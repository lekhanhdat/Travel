import React from 'react';
import {
  Image,
  Linking,
  NativeModules,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import {TextInput, IconButton} from 'react-native-paper';
import {launchImageLibrary} from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import TextBase from '../../../common/TextBase';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import {AppStyle} from '../../../common/AppStyle';
import {Call, FAQ, Policy, Setting} from '../../../assets/ImageSvg';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import {IAccount} from '../../../common/types';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import {localStorageKey} from '../../../common/constants';
import {BackSvg, UserSvg} from '../../../assets/assets/ImageSvg';
import {Button} from 'react-native-paper';
import {Avatar, getDisplayName} from '../../../utils/avatarUtils';
import authApi from '../../../services/auth.api';
import locationApi from '../../../services/locations.api';
import {validateEmail} from '../../../utils/Utils';


const {StatusBarManager} = NativeModules;

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
    };
  }

  componentDidMount(): void {
    this.handleGetUser();

    // Add focus listener to refresh user data when returning to this screen
    if (this.props.navigation) {
      this.props.navigation.addListener('focus', () => {
        console.log('Personal screen focused - refreshing user data');
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
      },
      async (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
          Toast.show({
            type: 'error',
            text1: 'Lỗi',
            text2: 'Không thể chọn ảnh. Vui lòng thử lại.',
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

    if (!previewAvatarUri || !account?.Id) return;

    this.setState({uploadingAvatar: true, showAvatarPreview: false});

    try {
      // Upload to NocoDB
      const uploadResult = await locationApi.uploadImage({
        uri: previewAvatarUri,
        type: 'image/jpeg',
        fileName: `avatar_${Date.now()}.jpg`,
      });

      const avatarUrl = uploadResult.url;

      // Update avatar in database immediately
      await authApi.updateProfile(account.Id, {
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
        text1: 'Thành công',
        text2: 'Đã cập nhật ảnh đại diện',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải ảnh lên. Vui lòng thử lại.',
      });
      this.setState({uploadingAvatar: false, previewAvatarUri: undefined});
    }
  };

  handleDeleteAvatar = async () => {
    const {account} = this.state;

    if (!account?.Id) return;

    this.setState({uploadingAvatar: true});

    try {
      // Update avatar to empty string (default avatar will be shown)
      await authApi.updateProfile(account.Id, {
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
        text1: 'Thành công',
        text2: 'Đã xóa ảnh đại diện',
      });
    } catch (error) {
      console.error('Error deleting avatar:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể xóa ảnh đại diện. Vui lòng thử lại.',
      });
      this.setState({uploadingAvatar: false});
    }
  };

  handleSaveProfile = async () => {
    const {account, editFullName, editEmail, editAvatarUri, editPhone, editGender, editBirthday, editAddress} = this.state;

    if (!account?.Id) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không tìm thấy thông tin tài khoản',
      });
      return;
    }

    // Validation
    if (!editFullName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng nhập họ và tên',
      });
      return;
    }

    if (!editEmail.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng nhập email',
      });
      return;
    }

    if (!validateEmail(editEmail)) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Email không hợp lệ',
      });
      return;
    }

    this.setState({savingProfile: true});

    try {
      // Update profile
      await authApi.updateProfile(account.Id, {
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
        text1: 'Thành công',
        text2: 'Đã cập nhật thông tin cá nhân',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message || 'Không thể cập nhật thông tin',
      });
      this.setState({savingProfile: false});
    }
  };

  handleChangePassword = async () => {
    const {account, currentPassword, newPassword, confirmPassword} = this.state;

    if (!account?.Id) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không tìm thấy thông tin tài khoản',
      });
      return;
    }

    // Validation
    if (!currentPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng nhập mật khẩu hiện tại',
      });
      return;
    }

    if (!newPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng nhập mật khẩu mới',
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Mật khẩu xác nhận không khớp',
      });
      return;
    }

    this.setState({changingPassword: true});

    try {
      await authApi.changePassword(
        account.Id,
        currentPassword,
        newPassword,
      );

      this.setState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        changingPassword: false,
      });

      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đã đổi mật khẩu thành công',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message || 'Không thể đổi mật khẩu',
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
        return 'Khác';
      default:
        return 'Chưa cập nhật';
    }
  };

  // Helper function to format birthday to DD/MM/YYYY
  formatBirthday = (birthday?: string): string => {
    if (!birthday) return 'Chưa cập nhật';

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
      showGenderPicker,
    } = this.state;

    return (
      <Page>
        <HeaderBase
          title={'Thông tin cá nhân'}
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
              Tên đăng nhập
            </TextBase>
            <TextBase
              style={[AppStyle.txt_16_medium, {color: colors.primary_950}]}>
              {account?.userName || 'Chưa cập nhật'}
            </TextBase>
          </View>

          {/* Họ và tên */}
          <View style={styles.infoRow}>
            <TextBase
              style={[
                AppStyle.txt_14_medium,
                {color: colors.primary_400, marginBottom: sizes._4sdp},
              ]}>
              Họ và tên
            </TextBase>
            <TextBase
              style={[AppStyle.txt_16_medium, {color: colors.primary_950}]}>
              {account?.fullName || 'Chưa cập nhật'}
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
              {account?.email || 'Chưa cập nhật'}
            </TextBase>
          </View>

          {/* Số điện thoại */}
          <View style={styles.infoRow}>
            <TextBase
              style={[
                AppStyle.txt_14_medium,
                {color: colors.primary_400, marginBottom: sizes._4sdp},
              ]}>
              Số điện thoại
            </TextBase>
            <TextBase
              style={[AppStyle.txt_16_medium, {color: colors.primary_950}]}>
              {account?.phone || 'Chưa cập nhật'}
            </TextBase>
          </View>

          {/* Giới tính */}
          <View style={styles.infoRow}>
            <TextBase
              style={[
                AppStyle.txt_14_medium,
                {color: colors.primary_400, marginBottom: sizes._4sdp},
              ]}>
              Giới tính
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
              Ngày sinh
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
              Địa chỉ
            </TextBase>
            <TextBase
              style={[AppStyle.txt_16_medium, {color: colors.primary_950}]}>
              {account?.address || 'Chưa cập nhật'}
            </TextBase>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={this.handleOpenEditModal}>
              <TextBase
                style={[AppStyle.txt_16_bold, {color: colors.white}]}>
                Chỉnh sửa thông tin
              </TextBase>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={this.handleOpenPasswordModal}>
              <TextBase
                style={[AppStyle.txt_16_bold, {color: colors.primary}]}>
                Đổi mật khẩu
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
                Chỉnh sửa thông tin
              </TextBase>

              <ScrollView>
                {/* Avatar */}
                <View style={{alignItems: 'center', marginBottom: sizes._20sdp}}>
                  <TouchableOpacity
                    onPress={this.handlePickAvatar}
                    disabled={uploadingAvatar}>
                    <Avatar
                      avatarUrl={editAvatarUri || account?.avatar}
                      size={sizes._80sdp}
                    />
                    <View style={styles.avatarEditBadge}>
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
                    </View>
                  </TouchableOpacity>
                  <TextBase
                    style={[
                      AppStyle.txt_12_regular,
                      {color: colors.primary_400, marginTop: sizes._8sdp},
                    ]}>
                    Nhấn để thay đổi ảnh đại diện
                  </TextBase>

                  {/* Delete Avatar Button */}
                  {(editAvatarUri || account?.avatar) && (
                    <TouchableOpacity
                      onPress={this.handleDeleteAvatar}
                      disabled={uploadingAvatar}
                      style={{marginTop: sizes._8sdp}}>
                      <TextBase
                        style={[
                          AppStyle.txt_12_medium,
                          {color: '#FF0000'},
                        ]}>
                        🗑️ Xóa ảnh đại diện
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
                    Họ và tên
                  </TextBase>
                  <TextInput
                    mode="outlined"
                    value={editFullName}
                    onChangeText={text => this.setState({editFullName: text})}
                    placeholder="Nhập họ và tên"
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
                    Số điện thoại
                  </TextBase>
                  <TextInput
                    mode="outlined"
                    value={editPhone}
                    onChangeText={text => this.setState({editPhone: text})}
                    placeholder="Nhập số điện thoại"
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
                    Giới tính
                  </TextBase>
                  <View style={styles.genderContainer}>
                    {(['Male', 'Female', 'Other'] as const).map((gender) => (
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
                          {gender === 'Male' ? 'Nam' : gender === 'Female' ? 'Nữ' : 'Khác'}
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
                    Ngày sinh (DD/MM/YYYY)
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
                    Địa chỉ
                  </TextBase>
                  <TextInput
                    mode="outlined"
                    value={editAddress}
                    onChangeText={text => this.setState({editAddress: text})}
                    placeholder="Nhập địa chỉ"
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
                    Hủy
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
                      Lưu
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
                Đổi mật khẩu
              </TextBase>

              <ScrollView>
                {/* Current Password */}
                <View style={{marginBottom: sizes._16sdp}}>
                  <TextBase
                    style={[
                      AppStyle.txt_14_medium,
                      {color: colors.primary_400, marginBottom: sizes._8sdp},
                    ]}>
                    Mật khẩu hiện tại
                  </TextBase>
                  <TextInput
                    mode="outlined"
                    value={currentPassword}
                    onChangeText={text => this.setState({currentPassword: text})}
                    placeholder="Nhập mật khẩu hiện tại"
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
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
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
                    Xác nhận mật khẩu mới
                  </TextBase>
                  <TextInput
                    mode="outlined"
                    value={confirmPassword}
                    onChangeText={text => this.setState({confirmPassword: text})}
                    placeholder="Nhập lại mật khẩu mới"
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
                    Hủy
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
                      Đổi mật khẩu
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
            this.setState({showAvatarPreview: false, previewAvatarUri: undefined})
          }>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TextBase
                style={[
                  AppStyle.txt_18_bold,
                  {marginBottom: sizes._16sdp, textAlign: 'center'},
                ]}>
                Xem trước ảnh đại diện
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
                    Hủy
                  </TextBase>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={this.handleConfirmAvatar}>
                  <TextBase
                    style={[AppStyle.txt_14_medium, {color: colors.white}]}>
                    Xác nhận
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
    paddingTop: StatusBarManager.HEIGHT + sizes._16sdp,
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
