import Modal from '../../../component/SafeAreaModal';
import React from 'react';
import i18n from '../../../i18n';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  } from 'react-native';
import {TextInput, IconButton} from 'react-native-paper';
import {launchImageLibrary} from '../../../utils/imagePicker';
import Toast from 'react-native-toast-message';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import TextBase from '../../../common/TextBase';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import {AppStyle} from '../../../common/AppStyle';
import NavigationService from '../NavigationService';
import {IAccount} from '../../../common/types';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import {localStorageKey} from '../../../common/constants';
import {BackSvg} from '../../../assets/ImageSvg';
import {Avatar, getDisplayName} from '../../../utils/avatarUtils';
import authApi from '../../../services/auth.api';
import locationApi from '../../../services/locations.api';
import {validateEmail} from '../../../utils/Utils';
import FEATURE_FLAGS from '../../../config/featureFlags';
import {ScreenName} from '../../AppContainer';


interface IProfileScreenProps {
  navigation?: any;
}

interface IProfileScreenState {
  account?: IAccount | null;

  // Modal states
  showEditModal: boolean;
  showPasswordModal: boolean;

  // Form fields for Edit Profile Modal
  editFullName: string;
  editEmail: string;
  editAvatarUri?: string;
  editPhone: string;
  editGender: 'Male' | 'Female' | 'Other' | '';
  editBirthday: string;
  editAddress: string;

  // Password fields for Change Password Modal
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;

  // Avatar
  uploadingAvatar: boolean;
  showAvatarPreview: boolean;
  previewAvatarUri?: string;

  // Loading states
  savingProfile: boolean;
  changingPassword: boolean;

  // Gender picker
  showGenderPicker: boolean;

  // Account deletion (Play policy)
  showDeleteModal: boolean;
  deletePassword: string;
  deletingAccount: boolean;
}

export default class ProfileScreen extends React.PureComponent<
  IProfileScreenProps,
  IProfileScreenState
> {
  constructor(props: IProfileScreenProps) {
    super(props);
    this.state = {
      account: null,
      showEditModal: false,
      showPasswordModal: false,
      editFullName: '',
      editEmail: '',
      editAvatarUri: undefined,
      editPhone: '',
      editGender: '',
      editBirthday: '',
      editAddress: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      uploadingAvatar: false,
      showAvatarPreview: false,
      savingProfile: false,
      changingPassword: false,
      showGenderPicker: false,
      showDeleteModal: false,
      deletePassword: '',
      deletingAccount: false,
    };
  }

  componentDidMount(): void {
    this.handleGetUser();

    // Add focus listener to refresh user data when returning to this screen
    if (this.props.navigation) {
      this.props.navigation.addListener('focus', () => {
        this.handleGetUser();
      });
    }
  }

  handleGetUser = async () => {
    const response: IAccount = await LocalStorageCommon.getItem(
      localStorageKey.AVT,
    );
    this.setState({
      account: response,
      editFullName: response?.fullName || '',
      editEmail: response?.email || '',
      editAvatarUri: response?.avatar || undefined,
      editPhone: response?.phone || '',
      editGender: response?.gender || '',
      editBirthday: response?.birthday || '',
      editAddress: response?.address || '',
    });
  };

  // Open Edit Profile Modal
  handleOpenEditModal = () => {
    const {account} = this.state;
    this.setState({
      showEditModal: true,
      editFullName: account?.fullName || '',
      editEmail: account?.email || '',
      editAvatarUri: account?.avatar || undefined,
      editPhone: account?.phone || '',
      editGender: account?.gender || '',
      editBirthday: account?.birthday || '',
      editAddress: account?.address || '',
    });
  };

  // Close Edit Profile Modal
  handleCloseEditModal = () => {
    this.setState({
      showEditModal: false,
      editFullName: '',
      editEmail: '',
      editAvatarUri: undefined,
      editPhone: '',
      editGender: '',
      editBirthday: '',
      editAddress: '',
    });
  };

  // Open Change Password Modal
  handleOpenPasswordModal = () => {
    this.setState({
      showPasswordModal: true,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  // Close Change Password Modal
  handleClosePasswordModal = () => {
    this.setState({
      showPasswordModal: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  handlePickAvatar = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
        // P7: avatars are small; keeps the upload far below the BE limit (2 MB).
        maxWidth: 800,
        maxHeight: 800,
      },
      async response => {
        if (response.didCancel) {
        } else if (response.errorCode) {
          Toast.show({
            type: 'error',
            text1: 'Lỗi',
            text2: i18n.t('common:ui.common.pickImageFailed'),
          });
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];

          // Show preview modal
          this.setState({
            showAvatarPreview: true,
            previewAvatarUri: asset.uri,
          });
        }
      },
    );
  };

  handleConfirmAvatar = async () => {
    const {previewAvatarUri, account} = this.state;

    if (!previewAvatarUri || !account?.id) {
      return;
    }

    this.setState({uploadingAvatar: true, showAvatarPreview: false});

    try {
      // P7: upload qua BE (POST /uploads → GCS)
      const uploadResult = await locationApi.uploadImage({
        uri: previewAvatarUri,
        type: 'image/jpeg',
        fileName: `avatar_${Date.now()}.jpg`,
      });

      const avatarUrl = uploadResult.url;

      // Update avatar in database immediately
      await authApi.updateProfile(account.id, {
        avatar: avatarUrl,
      });

      // Update local state and storage
      const updatedAccount: IAccount = {
        ...account,
        avatar: avatarUrl,
      };

      await LocalStorageCommon.setItem(localStorageKey.AVT, updatedAccount);

      this.setState({
        account: updatedAccount,
        editAvatarUri: avatarUrl,
        uploadingAvatar: false,
        previewAvatarUri: undefined,
      });

      Toast.show({
        type: 'success',
        text1: i18n.t('common:ui.common.ok'),
        text2: i18n.t('common:ui.personal.avatarUpdated'),
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: i18n.t('common:ui.personal.uploadFailed'),
      });
      this.setState({uploadingAvatar: false, previewAvatarUri: undefined});
    }
  };

  handleDeleteAvatar = async () => {
    const {account} = this.state;

    if (!account?.id) {
      return;
    }

    this.setState({uploadingAvatar: true});

    try {
      // Update avatar to empty string (default avatar will be shown)
      await authApi.updateProfile(account.id, {
        avatar: '',
      });

      // Update local state and storage
      const updatedAccount: IAccount = {
        ...account,
        avatar: '',
      };

      await LocalStorageCommon.setItem(localStorageKey.AVT, updatedAccount);

      this.setState({
        account: updatedAccount,
        editAvatarUri: '',
        uploadingAvatar: false,
      });

      Toast.show({
        type: 'success',
        text1: i18n.t('common:ui.common.ok'),
        text2: i18n.t('common:ui.personal.avatarDeleted'),
      });
    } catch (error) {
      console.error('Error deleting avatar:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: i18n.t('common:ui.personal.avatarDeleteFailed'),
      });
      this.setState({uploadingAvatar: false});
    }
  };

  handleSaveProfile = async () => {
    const {
      account,
      editFullName,
      editEmail,
      editAvatarUri,
      editPhone,
      editGender,
      editBirthday,
      editAddress,
    } = this.state;

    if (!account?.id) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: i18n.t('common:ui.personal.noAccount'),
      });
      return;
    }

    // Validation
    if (!editFullName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: i18n.t('common:ui.personal.nameRequired'),
      });
      return;
    }

    if (!editEmail.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: i18n.t('common:ui.personal.emailRequired'),
      });
      return;
    }

    if (!validateEmail(editEmail)) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: i18n.t('common:ui.common.invalidEmail'),
      });
      return;
    }

    this.setState({savingProfile: true});

    try {
      // Update profile
      await authApi.updateProfile(account.id, {
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        avatar: editAvatarUri,
        phone: editPhone.trim(),
        gender: editGender || undefined,
        birthday: editBirthday.trim(),
        address: editAddress.trim(),
      });

      // Update local storage
      const updatedAccount: IAccount = {
        ...account,
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        avatar: editAvatarUri,
        phone: editPhone.trim(),
        gender: editGender || undefined,
        birthday: editBirthday.trim(),
        address: editAddress.trim(),
      };

      await LocalStorageCommon.setItem(localStorageKey.AVT, updatedAccount);

      this.setState({
        account: updatedAccount,
        showEditModal: false,
        savingProfile: false,
      });

      Toast.show({
        type: 'success',
        text1: i18n.t('common:ui.common.ok'),
        text2: i18n.t('common:ui.personal.updated'),
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message || i18n.t('common:ui.personal.updateFailed'),
      });
      this.setState({savingProfile: false});
    }
  };

  handleDeleteAccount = async () => {
    const {deletePassword} = this.state;
    if (!deletePassword) {
      Toast.show({type: 'error', text1: 'Lỗi', text2: i18n.t('common:ui.personal.passwordToConfirm')});
      return;
    }
    this.setState({deletingAccount: true});
    try {
      await authApi.deleteAccount(deletePassword);
      this.setState({showDeleteModal: false, deletePassword: '', deletingAccount: false});
      Toast.show({type: 'success', text1: i18n.t('common:ui.personal.accountDeleted')});
      NavigationService.reset(ScreenName.HOME_STACK_SCREEN);
    } catch (error: any) {
      this.setState({deletingAccount: false});
      Toast.show({type: 'error', text1: 'Lỗi', text2: error.message || i18n.t('common:ui.personal.accountDeleteFailed')});
    }
  };

  handleChangePassword = async () => {
    const {account, currentPassword, newPassword, confirmPassword} = this.state;

    if (!account?.id) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: i18n.t('common:ui.personal.noAccount'),
      });
      return;
    }

    // Validation
    if (!currentPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: i18n.t('common:ui.personal.currentRequired'),
      });
      return;
    }

    if (!newPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: i18n.t('common:ui.personal.newRequired'),
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: i18n.t('common:ui.personal.newShort'),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: i18n.t('common:ui.personal.confirmMismatch'),
      });
      return;
    }

    this.setState({changingPassword: true});

    try {
      await authApi.changePassword(account.id, currentPassword, newPassword);

      this.setState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        changingPassword: false,
      });

      Toast.show({
        type: 'success',
        text1: i18n.t('common:ui.common.ok'),
        text2: i18n.t('common:ui.personal.passwordChanged'),
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message || i18n.t('common:ui.personal.passwordChangeFailed'),
      });
      this.setState({changingPassword: false});
    }
  };

  // Helper function to translate gender
  getGenderLabel = (gender?: string): string => {
    switch (gender) {
      case 'Male':
        return 'Nam';
      case 'Female':
        return 'Nữ';
      case 'Other':
        return i18n.t('common:ui.common.other');
      default:
        return i18n.t('common:ui.personal.notSet');
    }
  };

  // Helper function to format birthday to DD/MM/YYYY
  formatBirthday = (birthday?: string): string => {
    if (!birthday) {
      return i18n.t('common:ui.personal.notSet');
    }

    // If already in DD/MM/YYYY format, return as-is
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(birthday)) {
      return birthday;
    }

    // If in YYYY-MM-DD format, convert to DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      const [year, month, day] = birthday.split('-');
      return `${day}/${month}/${year}`;
    }

    // For other formats, try to parse and format
    const date = new Date(birthday);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    // If all else fails, return the original value
    return birthday;
  };

  render(): React.ReactNode {
    const {
      account,
      showEditModal,
      showPasswordModal,
      editFullName,
      editEmail,
      editAvatarUri,
      editPhone,
      editGender,
      editBirthday,
      editAddress,
      currentPassword,
      newPassword,
      confirmPassword,
      showCurrentPassword,
      showNewPassword,
      showConfirmPassword,
      uploadingAvatar,
      showAvatarPreview,
      previewAvatarUri,
      savingProfile,
      changingPassword,
      showDeleteModal,
      deletePassword,
      deletingAccount,
    } = this.state;

    return (
      <Page>
        <HeaderBase
          title={i18n.t('common:ui.personal.title')}
          leftIconSvg={
            <BackSvg
              width={sizes._24sdp}
              height={sizes._24sdp}
              color={colors.primary_950}
            />
          }
          onLeftIconPress={() => NavigationService.pop()}
        />

        <ScrollView style={styles.container}>
          {/* Avatar Section */}
          <View style={{alignSelf: 'center', marginBottom: sizes._10sdp}}>
            <Avatar avatarUrl={account?.avatar} size={sizes._80sdp} />
          </View>

          {/* Display Name */}
          <TextBase
            style={[
              AppStyle.txt_18_bold_review,
              {alignSelf: 'center', marginBottom: sizes._20sdp},
            ]}>
            {getDisplayName(account)}
          </TextBase>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Tên đăng nhập */}
          <View style={styles.infoRow}>
            <TextBase
              style={[
                AppStyle.txt_14_medium,
                {color: colors.primary_400, marginBottom: sizes._4sdp},
              ]}>
              {i18n.t('common:ui.common.userName')}
            </TextBase>
            <TextBase
              style={[AppStyle.txt_16_medium, {color: colors.primary_950}]}>
              {account?.userName || i18n.t('common:ui.personal.notSet')}
            </TextBase>
          </View>

          {/* Họ và tên */}
          <View style={styles.infoRow}>
            <TextBase
              style={[
                AppStyle.txt_14_medium,
                {color: colors.primary_400, marginBottom: sizes._4sdp},
              ]}>
              {i18n.t('common:ui.signup.fullName')}
            </TextBase>
            <TextBase
              style={[AppStyle.txt_16_medium, {color: colors.primary_950}]}>
              {account?.fullName || i18n.t('common:ui.personal.notSet')}
            </TextBase>
          </View>

          {/* Email */}
          <View style={styles.infoRow}>
            <TextBase
              style={[
                AppStyle.txt_14_medium,
                {color: colors.primary_400, marginBottom: sizes._4sdp},
              ]}>
              Email
            </TextBase>
            <TextBase
              style={[AppStyle.txt_16_medium, {color: colors.primary_950}]}>
              {account?.email || i18n.t('common:ui.personal.notSet')}
            </TextBase>
          </View>

          {/* Số điện thoại */}
          <View style={styles.infoRow}>
            <TextBase
              style={[
                AppStyle.txt_14_medium,
                {color: colors.primary_400, marginBottom: sizes._4sdp},
              ]}>
              {i18n.t('common:ui.signup.phone')}
            </TextBase>
            <TextBase
              style={[AppStyle.txt_16_medium, {color: colors.primary_950}]}>
              {account?.phone || i18n.t('common:ui.personal.notSet')}
            </TextBase>
          </View>

          {/* Giới tính */}
          <View style={styles.infoRow}>
            <TextBase
              style={[
                AppStyle.txt_14_medium,
                {color: colors.primary_400, marginBottom: sizes._4sdp},
              ]}>
              {i18n.t('common:ui.signup.gender')}
            </TextBase>
            <TextBase
              style={[AppStyle.txt_16_medium, {color: colors.primary_950}]}>
              {this.getGenderLabel(account?.gender)}
            </TextBase>
          </View>

          {/* Ngày sinh */}
          <View style={styles.infoRow}>
            <TextBase
              style={[
                AppStyle.txt_14_medium,
                {color: colors.primary_400, marginBottom: sizes._4sdp},
              ]}>
              {i18n.t('common:ui.signup.birthday')}
            </TextBase>
            <TextBase
              style={[AppStyle.txt_16_medium, {color: colors.primary_950}]}>
              {this.formatBirthday(account?.birthday)}
            </TextBase>
          </View>

          {/* Địa chỉ */}
          <View style={styles.infoRow}>
            <TextBase
              style={[
                AppStyle.txt_14_medium,
                {color: colors.primary_400, marginBottom: sizes._4sdp},
              ]}>
              {i18n.t('common:ui.signup.address')}
            </TextBase>
            <TextBase
              style={[AppStyle.txt_16_medium, {color: colors.primary_950}]}>
              {account?.address || i18n.t('common:ui.personal.notSet')}
            </TextBase>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={this.handleOpenEditModal}>
              <TextBase style={[AppStyle.txt_16_bold, {color: colors.white}]}>
                {i18n.t('common:ui.personal.edit')}
              </TextBase>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={this.handleOpenPasswordModal}>
              <TextBase style={[AppStyle.txt_16_bold, {color: colors.primary}]}>
                {i18n.t('common:ui.personal.changePassword')}
              </TextBase>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton, styles.dangerButton]}
              onPress={() => this.setState({showDeleteModal: true, deletePassword: ''})}>
              <TextBase style={[AppStyle.txt_16_bold, {color: '#B22222'}]}>
                {i18n.t('common:ui.personal.deleteAccount')}
              </TextBase>
            </TouchableOpacity>
          </View>

          <View style={{height: sizes._32sdp}} />
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditModal}
          transparent={true}
          animationType="slide"
          onRequestClose={this.handleCloseEditModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TextBase
                style={[
                  AppStyle.txt_18_bold,
                  {marginBottom: sizes._20sdp, textAlign: 'center'},
                ]}>
                {i18n.t('common:ui.personal.edit')}
              </TextBase>

              <ScrollView>
                {/* Avatar */}
                <View
                  style={{alignItems: 'center', marginBottom: sizes._20sdp}}>
                  {/* P7.4: avatar upload goes through POST /uploads; ENABLE_UPLOAD turns it on. */}
                  <TouchableOpacity
                    onPress={this.handlePickAvatar}
                    disabled={uploadingAvatar || !FEATURE_FLAGS.ENABLE_UPLOAD}>
                    <Avatar
                      avatarUrl={editAvatarUri || account?.avatar}
                      size={sizes._80sdp}
                    />
                    {FEATURE_FLAGS.ENABLE_UPLOAD && <View style={styles.avatarEditBadge}>
                      {uploadingAvatar ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <IconButton
                          icon="camera"
                          size={sizes._16sdp}
                          iconColor={colors.white}
                          style={{margin: 0}}
                        />
                      )}
                    </View>}
                  </TouchableOpacity>
                  {FEATURE_FLAGS.ENABLE_UPLOAD && <TextBase
                    style={[
                      AppStyle.txt_12_regular,
                      {color: colors.primary_400, marginTop: sizes._8sdp},
                    ]}>
                    {i18n.t('common:ui.personal.tapToChange')}
                  </TextBase>}

                  {/* Delete Avatar Button */}
                  {(editAvatarUri || account?.avatar) && (
                    <TouchableOpacity
                      onPress={this.handleDeleteAvatar}
                      disabled={uploadingAvatar}
                      style={{marginTop: sizes._8sdp}}>
                      <TextBase
                        style={[AppStyle.txt_12_medium, {color: '#FF0000'}]}>
                        {i18n.t('common:ui.personal.removeAvatar')}
                      </TextBase>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Full Name */}
                <View style={{marginBottom: sizes._16sdp}}>
                  <TextBase
                    style={[
                      AppStyle.txt_14_medium,
                      {color: colors.primary_400, marginBottom: sizes._8sdp},
                    ]}>
                    {i18n.t('common:ui.signup.fullName')}
                  </TextBase>
                  <TextInput
                    mode="outlined"
                    value={editFullName}
                    onChangeText={text => this.setState({editFullName: text})}
                    placeholder={i18n.t('common:ui.common.fullNamePlaceholder')}
                    style={styles.textInput}
                    outlineColor={colors.primary_200}
                    activeOutlineColor={colors.primary}
                  />
                </View>

                {/* Email */}
                <View style={{marginBottom: sizes._16sdp}}>
                  <TextBase
                    style={[
                      AppStyle.txt_14_medium,
                      {color: colors.primary_400, marginBottom: sizes._8sdp},
                    ]}>
                    Email
                  </TextBase>
                  <TextInput
                    mode="outlined"
                    value={editEmail}
                    onChangeText={text => this.setState({editEmail: text})}
                    placeholder="Nhập email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                    outlineColor={colors.primary_200}
                    activeOutlineColor={colors.primary}
                  />
                </View>

                {/* Phone */}
                <View style={{marginBottom: sizes._16sdp}}>
                  <TextBase
                    style={[
                      AppStyle.txt_14_medium,
                      {color: colors.primary_400, marginBottom: sizes._8sdp},
                    ]}>
                    {i18n.t('common:ui.signup.phone')}
                  </TextBase>
                  <TextInput
                    mode="outlined"
                    value={editPhone}
                    onChangeText={text => this.setState({editPhone: text})}
                    placeholder={i18n.t('common:ui.common.phonePlaceholder')}
                    keyboardType="phone-pad"
                    style={styles.textInput}
                    outlineColor={colors.primary_200}
                    activeOutlineColor={colors.primary}
                  />
                </View>

                {/* Gender */}
                <View style={{marginBottom: sizes._16sdp}}>
                  <TextBase
                    style={[
                      AppStyle.txt_14_medium,
                      {color: colors.primary_400, marginBottom: sizes._8sdp},
                    ]}>
                    {i18n.t('common:ui.signup.gender')}
                  </TextBase>
                  <View style={styles.genderContainer}>
                    {(['Male', 'Female', 'Other'] as const).map(gender => (
                      <TouchableOpacity
                        key={gender}
                        style={[
                          styles.genderOption,
                          editGender === gender && styles.genderOptionSelected,
                        ]}
                        onPress={() => this.setState({editGender: gender})}>
                        <TextBase
                          style={[
                            AppStyle.txt_14_medium,
                            {
                              color:
                                editGender === gender
                                  ? colors.white
                                  : colors.primary_950,
                            },
                          ]}>
                          {gender === 'Male'
                            ? 'Nam'
                            : gender === 'Female'
                            ? 'Nữ'
                            : i18n.t('common:ui.common.other')}
                        </TextBase>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Birthday */}
                <View style={{marginBottom: sizes._16sdp}}>
                  <TextBase
                    style={[
                      AppStyle.txt_14_medium,
                      {color: colors.primary_400, marginBottom: sizes._8sdp},
                    ]}>
                    {i18n.t('common:ui.personal.birthday')}
                  </TextBase>
                  <TextInput
                    mode="outlined"
                    value={editBirthday}
                    onChangeText={text => this.setState({editBirthday: text})}
                    placeholder="VD: 01/01/1990"
                    style={styles.textInput}
                    outlineColor={colors.primary_200}
                    activeOutlineColor={colors.primary}
                  />
                </View>

                {/* Address */}
                <View style={{marginBottom: sizes._16sdp}}>
                  <TextBase
                    style={[
                      AppStyle.txt_14_medium,
                      {color: colors.primary_400, marginBottom: sizes._8sdp},
                    ]}>
                    {i18n.t('common:ui.signup.address')}
                  </TextBase>
                  <TextInput
                    mode="outlined"
                    value={editAddress}
                    onChangeText={text => this.setState({editAddress: text})}
                    placeholder={i18n.t('common:ui.common.addressPlaceholder')}
                    multiline
                    numberOfLines={2}
                    style={[styles.textInput, {minHeight: sizes._60sdp}]}
                    outlineColor={colors.primary_200}
                    activeOutlineColor={colors.primary}
                  />
                </View>
              </ScrollView>

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={this.handleCloseEditModal}
                  disabled={savingProfile}>
                  <TextBase
                    style={[AppStyle.txt_14_medium, {color: colors.primary}]}>
                    {i18n.t('common:ui.common.cancel')}
                  </TextBase>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={this.handleSaveProfile}
                  disabled={savingProfile}>
                  {savingProfile ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <TextBase
                      style={[AppStyle.txt_14_medium, {color: colors.white}]}>
                      {i18n.t('common:ui.personal.save')}
                    </TextBase>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          visible={showPasswordModal}
          transparent={true}
          animationType="slide"
          onRequestClose={this.handleClosePasswordModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TextBase
                style={[
                  AppStyle.txt_18_bold,
                  {marginBottom: sizes._20sdp, textAlign: 'center'},
                ]}>
                {i18n.t('common:ui.personal.changePassword')}
              </TextBase>

              <ScrollView>
                {/* Current Password */}
                <View style={{marginBottom: sizes._16sdp}}>
                  <TextBase
                    style={[
                      AppStyle.txt_14_medium,
                      {color: colors.primary_400, marginBottom: sizes._8sdp},
                    ]}>
                    {i18n.t('common:ui.personal.currentPassword')}
                  </TextBase>
                  <TextInput
                    mode="outlined"
                    value={currentPassword}
                    onChangeText={text =>
                      this.setState({currentPassword: text})
                    }
                    placeholder={i18n.t('common:ui.personal.currentPlaceholder')}
                    secureTextEntry={!showCurrentPassword}
                    right={
                      <TextInput.Icon
                        icon={showCurrentPassword ? 'eye-off' : 'eye'}
                        onPress={() =>
                          this.setState({
                            showCurrentPassword: !showCurrentPassword,
                          })
                        }
                      />
                    }
                    style={styles.textInput}
                    outlineColor={colors.primary_200}
                    activeOutlineColor={colors.primary}
                  />
                </View>

                {/* New Password */}
                <View style={{marginBottom: sizes._16sdp}}>
                  <TextBase
                    style={[
                      AppStyle.txt_14_medium,
                      {color: colors.primary_400, marginBottom: sizes._8sdp},
                    ]}>
                    Mật khẩu mới
                  </TextBase>
                  <TextInput
                    mode="outlined"
                    value={newPassword}
                    onChangeText={text => this.setState({newPassword: text})}
                    placeholder={i18n.t('common:ui.personal.newPlaceholder')}
                    secureTextEntry={!showNewPassword}
                    right={
                      <TextInput.Icon
                        icon={showNewPassword ? 'eye-off' : 'eye'}
                        onPress={() =>
                          this.setState({showNewPassword: !showNewPassword})
                        }
                      />
                    }
                    style={styles.textInput}
                    outlineColor={colors.primary_200}
                    activeOutlineColor={colors.primary}
                  />
                </View>

                {/* Confirm Password */}
                <View style={{marginBottom: sizes._16sdp}}>
                  <TextBase
                    style={[
                      AppStyle.txt_14_medium,
                      {color: colors.primary_400, marginBottom: sizes._8sdp},
                    ]}>
                    {i18n.t('common:ui.personal.confirmNew')}
                  </TextBase>
                  <TextInput
                    mode="outlined"
                    value={confirmPassword}
                    onChangeText={text =>
                      this.setState({confirmPassword: text})
                    }
                    placeholder={i18n.t('common:ui.personal.confirmPlaceholder')}
                    secureTextEntry={!showConfirmPassword}
                    right={
                      <TextInput.Icon
                        icon={showConfirmPassword ? 'eye-off' : 'eye'}
                        onPress={() =>
                          this.setState({
                            showConfirmPassword: !showConfirmPassword,
                          })
                        }
                      />
                    }
                    style={styles.textInput}
                    outlineColor={colors.primary_200}
                    activeOutlineColor={colors.primary}
                  />
                </View>
              </ScrollView>

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={this.handleClosePasswordModal}
                  disabled={changingPassword}>
                  <TextBase
                    style={[AppStyle.txt_14_medium, {color: colors.primary}]}>
                    {i18n.t('common:ui.common.cancel')}
                  </TextBase>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={this.handleChangePassword}
                  disabled={changingPassword}>
                  {changingPassword ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <TextBase
                      style={[AppStyle.txt_14_medium, {color: colors.white}]}>
                      {i18n.t('common:ui.personal.changePassword')}
                    </TextBase>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Account Modal: step 2 of the two-step confirmation */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => this.setState({showDeleteModal: false})}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TextBase
                style={[
                  AppStyle.txt_18_bold,
                  {marginBottom: sizes._12sdp, textAlign: 'center'},
                ]}>
                {i18n.t('common:ui.personal.deleteAccount')}
              </TextBase>
              <TextBase
                style={[
                  AppStyle.txt_14_medium,
                  {color: colors.primary_400, marginBottom: sizes._16sdp},
                ]}>
                {i18n.t('common:ui.personal.deleteWarning')}
              </TextBase>
              <TextInput
                mode="outlined"
                value={deletePassword}
                onChangeText={text => this.setState({deletePassword: text})}
                placeholder="Mật khẩu"
                secureTextEntry
                style={styles.textInput}
                outlineColor={colors.primary_200}
                activeOutlineColor={colors.primary}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => this.setState({showDeleteModal: false, deletePassword: ''})}
                  disabled={deletingAccount}>
                  <TextBase
                    style={[AppStyle.txt_14_medium, {color: colors.primary}]}>
                    {i18n.t('common:ui.common.cancel')}
                  </TextBase>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton, styles.dangerConfirm]}
                  onPress={this.handleDeleteAccount}
                  disabled={deletingAccount}>
                  {deletingAccount ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <TextBase
                      style={[AppStyle.txt_14_medium, {color: colors.white}]}>
                      {i18n.t('common:ui.personal.deleteForever')}
                    </TextBase>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Avatar Preview Modal */}
        <Modal
          visible={showAvatarPreview}
          transparent={true}
          animationType="fade"
          onRequestClose={() =>
            this.setState({
              showAvatarPreview: false,
              previewAvatarUri: undefined,
            })
          }>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TextBase
                style={[
                  AppStyle.txt_18_bold,
                  {marginBottom: sizes._16sdp, textAlign: 'center'},
                ]}>
                {i18n.t('common:ui.personal.previewAvatar')}
              </TextBase>

              {previewAvatarUri && (
                <Image
                  source={{uri: previewAvatarUri}}
                  style={styles.previewImage}
                />
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() =>
                    this.setState({
                      showAvatarPreview: false,
                      previewAvatarUri: undefined,
                    })
                  }>
                  <TextBase
                    style={[AppStyle.txt_14_medium, {color: colors.primary}]}>
                    {i18n.t('common:ui.common.cancel')}
                  </TextBase>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={this.handleConfirmAvatar}>
                  <TextBase
                    style={[AppStyle.txt_14_medium, {color: colors.white}]}>
                    {i18n.t('common:ui.personal.confirm')}
                  </TextBase>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Page>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    paddingTop: sizes._16sdp,
    padding: sizes._16sdp,
    flex: 1,
    backgroundColor: colors.background,
  },
  divider: {
    width: '100%',
    height: 2,
    backgroundColor: colors.primary_100,
    marginVertical: sizes._20sdp,
  },
  infoRow: {
    marginBottom: sizes._20sdp,
  },
  buttonContainer: {
    marginTop: sizes._20sdp,
    gap: sizes._12sdp,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: sizes._14sdp,
    borderRadius: sizes._8sdp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dangerButton: {
    borderColor: '#B22222',
  },
  dangerConfirm: {
    backgroundColor: '#B22222',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: sizes._20sdp,
    width: sizes._32sdp,
    height: sizes._32sdp,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  textInput: {
    backgroundColor: colors.white,
    fontSize: sizes._14sdp,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: sizes._16sdp,
    padding: sizes._20sdp,
    width: sizes.width - sizes._64sdp,
    maxWidth: 400,
    maxHeight: 600,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: sizes._12sdp,
    marginBottom: sizes._16sdp,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: sizes._12sdp,
    marginTop: sizes._16sdp,
  },
  modalButton: {
    flex: 1,
    paddingVertical: sizes._12sdp,
    borderRadius: sizes._8sdp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.primary_100,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: sizes._12sdp,
  },
  genderOption: {
    flex: 1,
    paddingVertical: sizes._12sdp,
    borderRadius: sizes._8sdp,
    borderWidth: 1,
    borderColor: colors.primary_200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  genderOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
