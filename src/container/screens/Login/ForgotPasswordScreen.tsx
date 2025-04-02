import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import Page from '../../../component/Page';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import NavigationService from '../NavigationService';
import { ScreenName } from '../../AppContainer';

type ForgotPasswordProps = {
  navigation: any;
};

type ForgotPasswordState = {
  email: string;
  code: string;
  newPassword: string;
  step: number;
};

export default class ForgotPasswordScreen extends React.PureComponent<ForgotPasswordProps, ForgotPasswordState> {
  constructor(props: ForgotPasswordProps) {
    super(props);
    this.state = {
      email: '',
      code: '',
      newPassword: '',
      step: 1,
    };
  }

  handleNextStep = () => {
    this.setState((prevState) => ({ step: prevState.step + 1 }));
  };

  render() {
    const { step, email, code, newPassword } = this.state;
    return (
      <Page>
        <View style={styles.container}>
          {step === 1 && (
            <>
              <Text style={styles.title}>Nhập Email</Text>
              <TextInput
                mode="outlined"
                label="Email"
                placeholder="Nhập email"
                style={styles.input}
                onChangeText={(text) => this.setState({ email: text })}
                value={email}
              />
              <Button mode="contained" onPress={this.handleNextStep}>
                Gửi mã xác nhận
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.title}>Nhập mã xác nhận</Text>
              <TextInput
                mode="outlined"
                label="Mã xác nhận"
                placeholder="Nhập mã"
                style={styles.input}
                onChangeText={(text) => this.setState({ code: text })}
                value={code}
              />
              <Button mode="contained" onPress={this.handleNextStep}>
                Xác nhận
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.title}>Thiết lập mật khẩu mới</Text>
              <TextInput
                mode="outlined"
                label="Mật khẩu mới"
                placeholder="Nhập mật khẩu mới"
                style={styles.input}
                secureTextEntry
                onChangeText={(text) => this.setState({ newPassword: text })}
                value={newPassword}
              />
              <Button mode="contained" onPress={() => NavigationService.navigate(ScreenName.LOGIN_SCREEN)}>
                Đặt lại mật khẩu
              </Button>
            </>
          )}
        </View>
      </Page>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: sizes._16sdp,
  },
  title: {
    fontSize: sizes._20sdp,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: sizes._16sdp,
  },
  input: {
    marginBottom: sizes._16sdp,
  },
});
