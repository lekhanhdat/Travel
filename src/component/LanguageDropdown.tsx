import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import {useLanguage, Language} from '../i18n';
import colors from '../common/colors';
import sizes from '../common/sizes';
import fonts from '../common/fonts';
import {AppStyle} from '../common/AppStyle';
import TextBase from '../common/TextBase';

interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
  nativeName: string;
}

const languageOptions: LanguageOption[] = [
  {
    code: 'vi',
    name: 'Vietnamese',
    flag: '🇻🇳',
    nativeName: 'Tiếng Việt',
  },
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    nativeName: 'English',
  },
];

interface LanguageDropdownProps {
  style?: any;
  compact?: boolean;
  showFlag?: boolean;
  showNativeName?: boolean;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  style,
  compact = false,
  showFlag = true,
  showNativeName = true,
}) => {
  const {language, setLanguage, t} = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  const currentLanguage = languageOptions.find(lang => lang.code === language);

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    setIsVisible(false);
  };

  const renderLanguageOption = ({item}: {item: LanguageOption}) => {
    const isSelected = item.code === language;
    
    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          isSelected && styles.selectedOption,
        ]}
        onPress={() => handleLanguageSelect(item.code)}>
        <View style={styles.optionContent}>
          {showFlag && (
            <Text style={styles.flag}>{item.flag}</Text>
          )}
          <View style={styles.textContainer}>
            <TextBase style={[
              styles.optionName,
              isSelected && styles.selectedText,
            ]}>
              {item.name}
            </TextBase>
            {showNativeName && (
              <TextBase style={[
                styles.optionNativeName,
                isSelected && styles.selectedSubText,
              ]}>
                {item.nativeName}
              </TextBase>
            )}
          </View>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <TextBase style={styles.checkmarkText}>✓</TextBase>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={[styles.compactButton, style]}
          onPress={() => setIsVisible(true)}>
          {showFlag && (
            <Text style={styles.compactFlag}>{currentLanguage?.flag}</Text>
          )}
          <TextBase style={styles.compactText}>
            {currentLanguage?.code.toUpperCase()}
          </TextBase>
        </TouchableOpacity>

        <Modal
          visible={isVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsVisible(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsVisible(false)}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TextBase style={styles.modalTitle}>
                  {t('settings.language')}
                </TextBase>
              </View>
              <FlatList
                data={languageOptions}
                renderItem={renderLanguageOption}
                keyExtractor={item => item.code}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.fullButton, style]}
        onPress={() => setIsVisible(true)}>
        <View style={styles.buttonContent}>
          {showFlag && (
            <Text style={styles.flag}>{currentLanguage?.flag}</Text>
          )}
          <View style={styles.textContainer}>
            <TextBase style={styles.buttonTitle}>
              {t('settings.language')}
            </TextBase>
            <TextBase style={styles.buttonSubtitle}>
              {showNativeName ? currentLanguage?.nativeName : currentLanguage?.name}
            </TextBase>
          </View>
        </View>
        <TextBase style={styles.arrow}>›</TextBase>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TextBase style={styles.modalTitle}>
                {t('settings.language')}
              </TextBase>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}>
                <TextBase style={styles.closeButtonText}>
                  {t('common.close')}
                </TextBase>
              </TouchableOpacity>
            </View>
            <FlatList
              data={languageOptions}
              renderItem={renderLanguageOption}
              keyExtractor={item => item.code}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const styles = StyleSheet.create({
  // Compact button styles
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: sizes._12sdp,
    paddingVertical: sizes._8sdp,
    borderRadius: sizes._20sdp,
    borderWidth: 1,
    borderColor: colors.primary_200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  compactFlag: {
    fontSize: sizes._16sdp,
    marginRight: sizes._6sdp,
  },
  compactText: {
    ...AppStyle.txt_12_bold,
    color: colors.primary,
  },

  // Full button styles
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: sizes._16sdp,
    paddingVertical: sizes._16sdp,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary_100,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: sizes._20sdp,
    marginRight: sizes._12sdp,
  },
  textContainer: {
    flex: 1,
  },
  buttonTitle: {
    ...AppStyle.txt_16_medium,
    color: colors.black,
    marginBottom: sizes._2sdp,
  },
  buttonSubtitle: {
    ...AppStyle.txt_14_regular,
    color: colors.primary_600,
  },
  arrow: {
    ...AppStyle.txt_18_medium,
    color: colors.primary_400,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: sizes._16sdp,
    width: screenWidth * 0.85,
    maxHeight: screenHeight * 0.6,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sizes._20sdp,
    paddingVertical: sizes._16sdp,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary_100,
  },
  modalTitle: {
    ...AppStyle.txt_18_bold,
    color: colors.black,
  },
  closeButton: {
    paddingHorizontal: sizes._12sdp,
    paddingVertical: sizes._6sdp,
  },
  closeButtonText: {
    ...AppStyle.txt_14_medium,
    color: colors.primary,
  },

  // Option item styles
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes._20sdp,
    paddingVertical: sizes._16sdp,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary_50,
  },
  selectedOption: {
    backgroundColor: colors.primary_50,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionName: {
    ...AppStyle.txt_16_medium,
    color: colors.black,
    marginBottom: sizes._2sdp,
  },
  optionNativeName: {
    ...AppStyle.txt_14_regular,
    color: colors.primary_600,
  },
  selectedText: {
    color: colors.primary,
  },
  selectedSubText: {
    color: colors.primary_700,
  },
  checkmark: {
    width: sizes._24sdp,
    height: sizes._24sdp,
    borderRadius: sizes._12sdp,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    ...AppStyle.txt_14_bold,
    color: colors.white,
  },
});

export default LanguageDropdown;
