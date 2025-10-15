import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  NativeModules,
} from 'react-native';
import {withTranslation, WithTranslationProps} from '../../../i18n/withTranslation';
import LanguageDropdown from '../../../component/LanguageDropdown';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import TextBase from '../../../common/TextBase';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import {AppStyle} from '../../../common/AppStyle';
import {BackSvg} from '../../../assets/assets/ImageSvg';
import NavigationService from '../NavigationService';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import {localStorageKey} from '../../../common/constants';

const {StatusBarManager} = NativeModules;

interface ISettingsProps extends WithTranslationProps {}

interface ISettingsState {
  notifications: boolean;
  locationServices: boolean;
  autoSync: boolean;
  darkMode: boolean;
  language: string;
  cacheSize: string;
}

class Settings extends React.PureComponent<
  ISettingsProps,
  ISettingsState
> {
  constructor(props: ISettingsProps) {
    super(props);
    this.state = {
      notifications: true,
      locationServices: true,
      autoSync: false,
      darkMode: false,
      language: 'Tiếng Việt',
      cacheSize: '0 MB',
    };
  }

  componentDidMount(): void {
    this.loadSettings();
    this.calculateCacheSize();
  }

  loadSettings = async () => {
    try {
      const settings = await LocalStorageCommon.getItem('app_settings');
      if (settings) {
        this.setState({
          notifications: settings.notifications ?? true,
          locationServices: settings.locationServices ?? true,
          autoSync: settings.autoSync ?? false,
          darkMode: settings.darkMode ?? false,
          language: settings.language ?? 'Tiếng Việt',
        });
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  saveSettings = async () => {
    try {
      const settings = {
        notifications: this.state.notifications,
        locationServices: this.state.locationServices,
        autoSync: this.state.autoSync,
        darkMode: this.state.darkMode,
        language: this.state.language,
      };
      await LocalStorageCommon.setItem('app_settings', settings);
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  };

  calculateCacheSize = () => {
    // Simulate cache size calculation
    const randomSize = Math.floor(Math.random() * 50) + 10;
    this.setState({cacheSize: `${randomSize} MB`});
  };

  handleToggleNotifications = (value: boolean) => {
    this.setState({notifications: value}, this.saveSettings);
  };

  handleToggleLocationServices = (value: boolean) => {
    this.setState({locationServices: value}, this.saveSettings);
  };

  handleToggleAutoSync = (value: boolean) => {
    this.setState({autoSync: value}, this.saveSettings);
  };

  handleToggleDarkMode = (value: boolean) => {
    this.setState({darkMode: value}, this.saveSettings);
    Alert.alert(
      this.props.t('settings.darkModeTitle'),
      this.props.t('settings.darkModeMessage'),
    );
  };

  handleClearCache = () => {
    Alert.alert(
      this.props.t('settings.clearCacheTitle'),
      this.props.t('settings.clearCacheMessage'),
      [
        {text: this.props.t('common.cancel'), style: 'cancel'},
        {
          text: this.props.t('settings.clearCache'),
          style: 'destructive',
          onPress: () => {
            this.setState({cacheSize: '0 MB'});
            Alert.alert(this.props.t('common.success'), this.props.t('settings.clearCacheSuccess'));
          },
        },
      ],
    );
  };



  renderSettingItem = (
    title: string,
    subtitle?: string,
    rightComponent?: React.ReactNode,
    onPress?: () => void,
  ) => {
    return (
      <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        disabled={!onPress}>
        <View style={styles.settingContent}>
          <TextBase style={styles.settingTitle}>{title}</TextBase>
          {subtitle && (
            <TextBase style={styles.settingSubtitle}>{subtitle}</TextBase>
          )}
        </View>
        {rightComponent}
      </TouchableOpacity>
    );
  };

  renderSectionHeader = (title: string) => {
    return (
      <View style={styles.sectionHeader}>
        <TextBase style={styles.sectionTitle}>{title}</TextBase>
      </View>
    );
  };

  render(): React.ReactNode {
    return (
      <Page>
        <HeaderBase
          title={this.props.t('settings.title')}
          leftIconSvg={
            <BackSvg
              width={sizes._24sdp}
              height={sizes._24sdp}
              color={colors.primary_950}
            />
          }
          onLeftIconPress={() => NavigationService.pop()}
        />

        <View style={styles.container}>
          {this.renderSectionHeader(this.props.t('settings.notifications'))}

          {this.renderSettingItem(
            this.props.t('settings.pushNotifications'),
            this.props.t('settings.pushNotificationsDesc'),
            <Switch
              value={this.state.notifications}
              onValueChange={this.handleToggleNotifications}
              trackColor={{false: colors.primary_200, true: colors.primary}}
              thumbColor={colors.white}
            />,
          )}

          {this.renderSectionHeader(this.props.t('settings.privacy'))}

          {this.renderSettingItem(
            this.props.t('settings.locationServices'),
            this.props.t('settings.locationServicesDesc'),
            <Switch
              value={this.state.locationServices}
              onValueChange={this.handleToggleLocationServices}
              trackColor={{false: colors.primary_200, true: colors.primary}}
              thumbColor={colors.white}
            />,
          )}

          {this.renderSectionHeader(this.props.t('settings.sync'))}

          {this.renderSettingItem(
            this.props.t('settings.autoSync'),
            this.props.t('settings.autoSyncDesc'),
            <Switch
              value={this.state.autoSync}
              onValueChange={this.handleToggleAutoSync}
              trackColor={{false: colors.primary_200, true: colors.primary}}
              thumbColor={colors.white}
            />,
          )}

          {this.renderSectionHeader(this.props.t('settings.interface'))}

          {this.renderSettingItem(
            this.props.t('settings.darkMode'),
            this.props.t('settings.darkModeDesc'),
            <Switch
              value={this.state.darkMode}
              onValueChange={this.handleToggleDarkMode}
              trackColor={{false: colors.primary_200, true: colors.primary}}
              thumbColor={colors.white}
            />,
          )}

          <LanguageDropdown style={styles.languageDropdown} />

          {this.renderSectionHeader(this.props.t('settings.storage'))}

          {this.renderSettingItem(
            this.props.t('settings.cache'),
            `${this.props.t('settings.cacheSize')}: ${this.state.cacheSize}`,
            <TouchableOpacity
              style={styles.clearButton}
              onPress={this.handleClearCache}>
              <TextBase style={styles.clearButtonText}>{this.props.t('settings.clearCache')}</TextBase>
            </TouchableOpacity>,
          )}
        </View>
      </Page>
    );
  }
}

export default withTranslation(Settings);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: StatusBarManager.HEIGHT + sizes._16sdp,
  },
  sectionHeader: {
    paddingHorizontal: sizes._16sdp,
    paddingVertical: sizes._12sdp,
    backgroundColor: colors.primary_50,
  },
  sectionTitle: {
    ...AppStyle.txt_16_bold,
    color: colors.primary_700,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes._16sdp,
    paddingVertical: sizes._16sdp,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary_100,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...AppStyle.txt_16_regular,
    color: colors.primary_950,
  },
  settingSubtitle: {
    ...AppStyle.txt_14_regular,
    color: colors.primary_600,
    marginTop: sizes._4sdp,
  },
  arrow: {
    ...AppStyle.txt_20_bold,
    color: colors.primary_400,
  },
  clearButton: {
    paddingHorizontal: sizes._12sdp,
    paddingVertical: sizes._6sdp,
    backgroundColor: colors.red,
    borderRadius: sizes._6sdp,
  },
  clearButtonText: {
    ...AppStyle.txt_14_bold,
    color: colors.white,
  },
  languageDropdown: {
    marginHorizontal: 0,
  },
});
