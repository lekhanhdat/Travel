import Modal from '../../../component/SafeAreaModal';
import React from 'react';
import i18n from '../../../i18n';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import {launchImageLibrary} from '../../../utils/imagePicker';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import TextBase from '../../../common/TextBase';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';

import NavigationService from '../NavigationService';
import {BackSvg} from '../../../assets/ImageSvg';
import {SendSvg, CameraSvg} from '../../../assets/ImageSvg';
import {Icon} from '../../../ui/Icon';
import {
  sendChatMessage,
  ChatMessage,
  getQuickReplies,
  searchImage,
  isImageSearchRequest,
  extractImageCount,
  resetChatSession,
} from '../../../services/chatbot.api';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import {chatAccountId, chatKey, chatRevision, writeChat, invalidateChatSession, subscribeChatSession} from '../../../services/chatStorage';
import {EndpointMissingError, getConversation, getLatestConversation, StoredChatMessage} from '../../../services/semantic.api';
import locationApi from '../../../services/locations.api';
import Markdown from 'react-native-markdown-display';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

interface ChatbotScreenProps {
  navigation?: any; // optional: the stack passes it
}

interface ChatbotScreenState {
  messages: ChatMessage[];
  inputText: string;
  isLoading: boolean;
  quickReplies: string[];
  selectedImage: {uri: string; url?: string} | null;
  uploadingImage: boolean;
  fullScreenImage: string | null; // For image viewer modal
  syncingHistory: boolean; // loading the Neon history after (re)login
}

export default class ChatbotScreen extends React.PureComponent<
  ChatbotScreenProps,
  ChatbotScreenState
> {
  private accountId = 'guest';
  private generation = 0;
  private pending = false;
  private ready = false;
  private unsubscribeFocus?: () => void;
  private unsubscribeSession?: () => void;
  private flatListRef: FlatList | null = null;

  constructor(props: ChatbotScreenProps) {
    super(props);
    this.state = {
      messages: [],
      inputText: '',
      isLoading: false,
      quickReplies: getQuickReplies(),
      selectedImage: null,
      uploadingImage: false,
      fullScreenImage: null,
      syncingHistory: false,
    };
  }

  componentDidMount() {
    this.loadChatHistory();

    // Listen for focus event to reload chat history
    this.unsubscribeSession = subscribeChatSession(() => {
      this.generation++;
      this.ready = false;
      this.pending = false;
      this.setState({messages: [], inputText: '', selectedImage: null, uploadingImage: false, fullScreenImage: null, isLoading: false});
    });
    this.unsubscribeFocus = this.props.navigation?.addListener('focus', () => {
      this.loadChatHistory();
    });
  }

  componentWillUnmount() {
    this.generation++;
    this.unsubscribeFocus?.();
    this.unsubscribeSession?.();
  }

  loadChatHistory = async () => {
    if (this.pending) {return;}
    const generation = ++this.generation;
    this.ready = false;
    this.pending = false;
    this.setState({messages: [], isLoading: false, selectedImage: null, inputText: ''});
    try {
      const accountId = await chatAccountId();
      if (generation !== this.generation) {return;}
      this.accountId = accountId;
      const savedMessages = await LocalStorageCommon.getItem(
        chatKey('CHAT_HISTORY', this.accountId),
      );

      if (generation !== this.generation) {return;}
      this.ready = true;
      const hasLocal = Array.isArray(savedMessages) && savedMessages.length > 1;
      if (!hasLocal) {
        // Nothing cached on this device for the account (e.g. after logout): restore from Neon.
        this.syncFromServer(generation);
      }
      if (savedMessages && Array.isArray(savedMessages) && savedMessages.length > 0) {
        this.setState({messages: savedMessages});
      } else {
        // Initialize with welcome message
        const welcomeMessage: ChatMessage = {
          role: 'assistant',
          content:
            i18n.t('common:ui.chatbot.welcome'),
        };
        this.setState({messages: [welcomeMessage]});
        await writeChat(chatKey('CHAT_HISTORY', this.accountId), [
          welcomeMessage,
        ]);
      }
    } catch (error) {
      if (generation !== this.generation) {return;}
      this.ready = false;
      // Fallback to welcome message
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content:
          i18n.t('common:ui.chatbot.welcome'),
      };
      this.setState({messages: [welcomeMessage]});
    }
  };

  /**
   * Restore the account's latest conversation stored in Neon (BE `public.conversations`).
   * Falls back to the stored session id while the BE predates /memory/conversations/latest.
   * Never wipes anything on failure; the chat stays usable.
   */
  syncFromServer = async (generation: number) => {
    const accountId = this.accountId;
    if (accountId === 'guest') {return;}
    this.setState({syncingHistory: true});
    try {
      let sessionId: string | null = null;
      let stored: StoredChatMessage[] = [];
      try {
        ({sessionId, messages: stored} = await getLatestConversation());
      } catch (error) {
        if (!(error instanceof EndpointMissingError)) {throw error;}
        const saved = await LocalStorageCommon.getItem(chatKey('CHAT_SESSION_ID', accountId));
        if (typeof saved === 'string' && saved) {
          sessionId = saved;
          stored = await getConversation(saved);
        }
      }
      // The user may have started typing meanwhile: keep their newer conversation.
      if (generation !== this.generation || this.pending || stored.length === 0) {return;}
      const welcome: ChatMessage = {role: 'assistant', content: i18n.t('common:ui.chatbot.welcome')};
      const messages: ChatMessage[] = [
        welcome,
        ...stored
          .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .map(m => ({role: m.role, content: m.content})),
      ];
      this.setState({messages});
      await writeChat(chatKey('CHAT_HISTORY', accountId), messages);
      if (sessionId) {await writeChat(chatKey('CHAT_SESSION_ID', accountId), sessionId);}
    } catch {
      // Offline / server error: keep what is shown; the next visit retries.
    } finally {
      if (generation === this.generation) {this.setState({syncingHistory: false});}
    }
  };

  saveChatHistory = async (messages: ChatMessage[]) => {
    try {
      await writeChat(chatKey('CHAT_HISTORY', this.accountId), messages);
    } catch (error) {
    }
  };

  handlePickImage = () => {
    if (!this.ready || this.pending) {return;}
    const generation = this.generation;
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      },
      async (response) => {
        if (generation !== this.generation) {return;}
        if (response.didCancel) {
        } else if (response.errorCode) {
          Alert.alert('Lỗi', i18n.t('common:ui.common.pickImageFailed'));
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          this.setState({uploadingImage: true});

          try {
            // Upload via POST /uploads
            const uploadResult = await locationApi.uploadImage({
              uri: asset.uri,
              type: asset.type || 'image/jpeg',
              fileName: asset.fileName || `chat_${Date.now()}.jpg`,
            });

            if (generation !== this.generation) {return;}
            this.setState({
              selectedImage: {
                uri: asset.uri!,
                url: uploadResult.url,
              },
              uploadingImage: false,
            });
          } catch (error) {
            if (generation !== this.generation) {return;}
            console.error('Error uploading image:', error);
            Alert.alert('Lỗi', i18n.t('common:ui.chatbot.uploadFailed'));
            this.setState({uploadingImage: false});
          }
        }
      },
    );
  };

  handleRemoveImage = () => {
    this.setState({selectedImage: null});
  };

  handleSendMessage = async () => {
    if (this.pending || !this.ready || this.state.uploadingImage) {return;}
    const {inputText, messages, selectedImage} = this.state;

    if (!inputText.trim() && !selectedImage) {
      return;
    }

    this.pending = true;
    const generation = this.generation;
    const revision = chatRevision();
    const accountId = this.accountId;
    // Build message content
    let messageContent: ChatMessage['content'];

    if (selectedImage && selectedImage.url) {
      // Message with image
      messageContent = [
        {
          type: 'image_url' as const,
          image_url: {url: selectedImage.url},
        },
      ];

      if (inputText.trim()) {
        messageContent.unshift({
          type: 'text' as const,
          text: inputText.trim(),
        });
      } else {
        messageContent.unshift({
          type: 'text' as const,
          text: i18n.t('common:ui.chatbot.describePlace'),
        });
      }
    } else {
      // Text-only message
      messageContent = inputText.trim();
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageContent,
    };

    const newMessages = [...messages, userMessage];

    this.setState(
      {
        messages: newMessages,
        inputText: '',
        selectedImage: null,
        isLoading: true,
      },
      () => {
        // Save to storage
        if (generation !== this.generation) {return;}
        this.saveChatHistory(newMessages);
        // Scroll to bottom
        setTimeout(() => {
          this.flatListRef?.scrollToEnd({animated: true});
        }, 100);
      },
    );

    // Check if user wants to search for an image
    const userTextContent = typeof messageContent === 'string'
      ? messageContent
      : messageContent.find(p => p.type === 'text')?.text || '';

    const wantsImage = isImageSearchRequest(userTextContent);

    // Call OpenAI API directly
    try {
      let finalMessages = newMessages;

      // Use direct OpenAI chat
      const response = await sendChatMessage(newMessages, undefined, accountId);
      if (generation !== this.generation || revision !== chatRevision()) {return;}

      if (response.error) {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `❌ ${response.error}`,
        };
        finalMessages = [...newMessages, errorMessage];
        this.setState({
          messages: finalMessages,
          isLoading: false,
        });
      } else {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.message,
        };
        finalMessages = [...newMessages, assistantMessage];
        this.setState({
          messages: finalMessages,
          isLoading: wantsImage,
        });
      }

      // If user wants to see images, search on SerpAPI
      if (wantsImage) {
        const imageCount = extractImageCount(userTextContent);

        const imageResponse = await searchImage(userTextContent, imageCount);

        if (generation !== this.generation || revision !== chatRevision()) {return;}
        if (imageResponse.error) {
          const imageErrorMessage: ChatMessage = {
            role: 'assistant',
            content: i18n.t('common:ui.chatbot.imageError', {message: imageResponse.error}),
          };
          finalMessages = [...finalMessages, imageErrorMessage];
          this.setState({
            messages: finalMessages,
            isLoading: false,
          });
        } else if (imageResponse.imageUrls && imageResponse.imageUrls.length > 0) {
          const imageMessage: ChatMessage = {
            role: 'assistant',
            content: imageResponse.imageUrls.map(url => ({
              type: 'image_url',
              image_url: {url},
            })),
          };
          finalMessages = [...finalMessages, imageMessage];
          this.setState({
            messages: finalMessages,
            isLoading: false,
          });
        }
      }

      // Save updated messages to storage
      await this.saveChatHistory(finalMessages);

      // Scroll to bottom after response
      setTimeout(() => {
        this.flatListRef?.scrollToEnd({animated: true});
      }, 100);
    } catch (error) {
      if (generation !== this.generation) {return;}
      console.error('Error sending message:', error);
      this.setState({isLoading: false});
    } finally {
      if (generation === this.generation) {
        this.pending = false;
        this.setState({isLoading: false});
      }
    }
  };

  handleQuickReply = (text: string) => {
    this.setState({inputText: text}, () => {
      this.handleSendMessage();
    });
  };

  handleNewConversation = () => {
    Alert.alert(
      i18n.t('common:ui.chatbot.newTitle'),
      i18n.t('common:ui.chatbot.newQuestion'),
      [
        {
          text: i18n.t('common:ui.common.cancel'),
          style: 'cancel',
        },
        {
          text: i18n.t('common:ui.common.delete'),
          style: 'destructive',
          onPress: async () => {
            invalidateChatSession();
            const generation = this.generation;
            this.ready = false;
            const welcomeMessage: ChatMessage = {
              role: 'assistant',
              content:
                i18n.t('common:ui.chatbot.welcome'),
            };
            this.setState({
              messages: [welcomeMessage],
            });
            await this.saveChatHistory([welcomeMessage]);
            if (generation !== this.generation) {return;}
            // P9: the BE session (history used as context) starts over too.
            try {await resetChatSession(this.accountId);} catch {
              if (generation === this.generation) {
                Alert.alert(i18n.t('common:common.error'), i18n.t('common:ui.common.serverError'));
              }
            } finally {
              if (generation === this.generation) {this.ready = true;}
            }
          },
        },
      ],
    );
  };

  renderMessage = ({item}: {item: ChatMessage; index: number}) => {
    const isUser = item.role === 'user';

    // Extract content for rendering
    let textContent = '';
    const imageUrls: string[] = [];

    if (typeof item.content === 'string') {
      textContent = item.content;
    } else if (Array.isArray(item.content)) {
      item.content.forEach(part => {
        if (part.type === 'text' && part.text) {
          textContent = part.text;
        } else if (part.type === 'image_url' && part.image_url) {
          imageUrls.push(part.image_url.url);
        }
      });
    }

    // Check if message has only images (no text)
    const hasOnlyImages = imageUrls.length > 0 && !textContent;

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
          // Remove maxWidth for image-only messages
          hasOnlyImages ? styles.imageMessageContainer : null,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            // Remove padding for image-only messages
            hasOnlyImages ? styles.imageBubble : null,
          ]}>
          {/* Render images if exist (horizontal scrollable) */}
          {imageUrls.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesScrollContainer}
              contentContainerStyle={styles.imagesScrollContent}>
              {imageUrls.map((url, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => this.setState({fullScreenImage: url})}
                  activeOpacity={0.8}
                  style={styles.imageWrapper}>
                  <Image
                    source={{uri: url}}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}

          {/* Render text content */}
          {textContent ? (
            isUser ? (
              <TextBase
                style={[
                  styles.messageText,
                  isUser ? styles.userText : styles.assistantText,
                ]}>
                {textContent}
              </TextBase>
            ) : (
              <Markdown
                style={{
                  body: {
                    color: colors.primary_950,
                    fontSize: sizes._14sdp,
                    margin: 0,
                  },
                  strong: {
                    fontWeight: 'bold',
                    color: colors.primary_950,
                  },
                  em: {
                    fontStyle: 'italic',
                  },
                  bullet_list: {
                    marginTop: 0,
                    marginBottom: 0,
                  },
                  ordered_list: {
                    marginTop: 0,
                    marginBottom: 0,
                  },
                  list_item: {
                    marginTop: 0,
                    marginBottom: 0,
                  },
                  link: {
                    color: colors.primary,
                    textDecorationLine: 'underline',
                  },
                  paragraph: {
                    marginTop: 0,
                    marginBottom: sizes._4sdp,
                  },
                }}>
                {textContent}
              </Markdown>
            )
          ) : null}
        </View>
      </View>
    );
  };

  renderQuickReplies = () => {
    const {quickReplies, messages} = this.state;

    // Only show quick replies if conversation just started
    if (messages.length > 1) {
      return null;
    }

    return (
      <View style={styles.quickRepliesContainer}>
        <TextBase style={styles.quickRepliesTitle}>{i18n.t('common:ui.chatbot.suggestions')}</TextBase>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRepliesScroll}>
          {quickReplies.map((reply, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickReplyButton}
              onPress={() => this.handleQuickReply(reply)}>
              <TextBase style={styles.quickReplyText}>{reply}</TextBase>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  render() {
    const {messages, inputText, isLoading, selectedImage, uploadingImage, fullScreenImage} = this.state;

    return (
      <Page>
        <HeaderBase
          title={i18n.t('common:ui.chatbot.title')}
          leftIconSvg={
            <BackSvg
              width={sizes._24sdp}
              height={sizes._24sdp}
              color={colors.primary_950}
            />
          }
          onLeftIconPress={() => NavigationService.pop()}
        />

        {/* Full Screen Image Modal */}
        <Modal
          visible={!!fullScreenImage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => this.setState({fullScreenImage: null})}>
          <View style={styles.fullScreenModalContainer}>
            <TouchableOpacity
              style={styles.fullScreenModalOverlay}
              activeOpacity={1}
              onPress={() => this.setState({fullScreenImage: null})}>
              <View style={styles.fullScreenImageWrapper}>
                {fullScreenImage && (
                  <Image
                    source={{uri: fullScreenImage}}
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                  />
                )}
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => this.setState({fullScreenImage: null})}>
                <Icon name="close" size={24} color={colors.white} accessibilityLabel={i18n.t('common:buttons.back')} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* New Chat Button */}
        <View style={styles.newChatButtonContainer}>
          <TouchableOpacity
            onPress={this.handleNewConversation}
            style={styles.newChatButton}>
            <TextBase style={styles.newChatButtonText}>{i18n.t('common:ui.chatbot.new')}</TextBase>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          {this.state.syncingHistory ? (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6}}>
              <ActivityIndicator size="small" color={colors.primary} />
              <TextBase style={{marginLeft: 8, fontSize: 13, color: colors.gray}}>
                {i18n.t('common:chat.loadingHistory')}
              </TextBase>
            </View>
          ) : null}
          {/* Messages List */}
          <FlatList
            ref={ref => { this.flatListRef = ref; }}
            data={messages}
            renderItem={this.renderMessage}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              this.flatListRef?.scrollToEnd({animated: true})
            }
            ListFooterComponent={
              isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <TextBase style={styles.loadingText}>{i18n.t('common:ui.chatbot.answering')}</TextBase>
                </View>
              ) : null
            }
          />

          {/* Quick Replies */}
          {this.renderQuickReplies()}

          {/* Input Area */}
          <View style={styles.inputWrapper}>
            {/* Selected Image Preview */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{uri: selectedImage.uri}}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={this.handleRemoveImage}>
                  <Icon name="close" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputContainer}>
              {/* Image Picker Button */}
              <TouchableOpacity
                style={styles.imageButton}
                onPress={this.handlePickImage}
                disabled={uploadingImage || isLoading}>
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <CameraSvg
                    width={sizes._24sdp}
                    height={sizes._24sdp}
                    color={colors.primary_700}
                  />
                )}
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder={i18n.t('common:ui.chatbot.inputPlaceholder')}
                placeholderTextColor={colors.primary_300}
                value={inputText}
                onChangeText={text => this.setState({inputText: text})}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() && !selectedImage) && styles.sendButtonDisabled,
                ]}
                onPress={this.handleSendMessage}
                disabled={isLoading || uploadingImage || (!inputText.trim() && !selectedImage)}>
                <SendSvg
                  width={sizes._24sdp}
                  height={sizes._24sdp}
                  color={
                    !inputText.trim() && !selectedImage
                      ? colors.primary_300
                      : colors.primary_950
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Page>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesList: {
    padding: sizes._16sdp,
    paddingBottom: sizes._8sdp,
  },
  messageContainer: {
    marginBottom: sizes._12sdp,
    maxWidth: '80%',
  },
  imageMessageContainer: {
    maxWidth: '100%', // Full width for image messages
    paddingHorizontal: 0,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: sizes._12sdp,
    borderRadius: sizes._16sdp,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: sizes._4sdp,
  },
  assistantBubble: {
    backgroundColor: colors.primary_100,
    borderBottomLeftRadius: sizes._4sdp,
  },
  imageBubble: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  messageText: {
    fontSize: sizes._14sdp,
    lineHeight: sizes._20sdp,
  },
  userText: {
    color: colors.primary_950,
  },
  assistantText: {
    color: colors.primary_950,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sizes._8sdp,
  },
  loadingText: {
    marginLeft: sizes._8sdp,
    fontSize: sizes._14sdp,
    color: colors.primary_400,
  },
  quickRepliesContainer: {
    paddingHorizontal: sizes._16sdp,
    paddingVertical: sizes._8sdp,
    borderTopWidth: 1,
    borderTopColor: colors.primary_200,
  },
  quickRepliesTitle: {
    fontSize: sizes._12sdp,
    color: colors.primary_400,
    marginBottom: sizes._8sdp,
  },
  quickRepliesScroll: {
    paddingRight: sizes._16sdp,
  },
  quickReplyButton: {
    backgroundColor: colors.primary_100,
    paddingHorizontal: sizes._12sdp,
    paddingVertical: sizes._8sdp,
    borderRadius: sizes._16sdp,
    marginRight: sizes._8sdp,
  },
  quickReplyText: {
    fontSize: sizes._12sdp,
    color: colors.primary_950,
  },
  inputWrapper: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.primary_200,
  },
  imagePreviewContainer: {
    padding: sizes._12sdp,
    paddingBottom: 0,
  },
  imagePreview: {
    width: sizes._100sdp,
    height: sizes._100sdp,
    borderRadius: sizes._8sdp,
  },
  removeImageButton: {
    position: 'absolute',
    top: sizes._16sdp,
    right: sizes._16sdp,
    width: sizes._24sdp,
    height: sizes._24sdp,
    backgroundColor: colors.black,
    borderRadius: sizes._12sdp,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: colors.white,
    fontSize: sizes._16sdp,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: sizes._12sdp,
    backgroundColor: colors.white,
  },
  imageButton: {
    width: sizes._44sdp,
    height: sizes._44sdp,
    backgroundColor: colors.primary_100,
    borderRadius: sizes._22sdp,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sizes._8sdp,
  },
  // Images horizontal scroll
  imagesScrollContainer: {
    maxWidth: '100%',
  },
  imagesScrollContent: {
    paddingVertical: sizes._4sdp,
  },
  imageWrapper: {
    marginRight: sizes._8sdp,
  },
  messageImage: {
    width: sizes._150sdp,
    height: sizes._150sdp,
    borderRadius: sizes._12sdp,
  },
  input: {
    flex: 1,
    backgroundColor: colors.primary_100,
    borderRadius: sizes._20sdp,
    paddingHorizontal: sizes._16sdp,
    paddingVertical: sizes._10sdp,
    fontSize: sizes._14sdp,
    maxHeight: sizes._100sdp,
    color: colors.primary_950,
  },
  sendButton: {
    width: sizes._44sdp,
    height: sizes._44sdp,
    backgroundColor: colors.primary,
    borderRadius: sizes._22sdp,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: sizes._8sdp,
  },
  sendButtonDisabled: {
    backgroundColor: colors.primary_200,
  },
  newChatButtonContainer: {
    paddingHorizontal: sizes._16sdp,
    paddingVertical: sizes._8sdp,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary_100,
  },
  newChatButton: {
    paddingHorizontal: sizes._16sdp,
    paddingVertical: sizes._10sdp,
    backgroundColor: colors.primary_50,
    borderRadius: sizes._8sdp,
    borderWidth: 1,
    borderColor: colors.primary_200,
    alignItems: 'center',
  },
  newChatButtonText: {
    color: colors.primary,
    fontSize: sizes._14sdp,
    fontWeight: '600',
  },
  // Full Screen Image Modal Styles
  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullScreenModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: sizes._40sdp,
    right: sizes._20sdp,
    width: sizes._40sdp,
    height: sizes._40sdp,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: sizes._20sdp,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.white,
    fontSize: sizes._24sdp,
    fontWeight: 'bold',
  },
});

