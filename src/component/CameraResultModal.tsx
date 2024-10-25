import React from 'react';
import {View, ScrollView, Image} from 'react-native';
import TextBase from '../common/TextBase';
import sizes from '../common/sizes';
import colors from '../common/colors';
import {AppStyle} from '../common/AppStyle';
import {Modal, Portal} from 'react-native-paper';

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  resultName: string;
  resultDescription: string;
  resultPhotoPath: string;
}

const CameraResultModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  resultName,
  resultDescription,
  resultPhotoPath,
}) => {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
          onClose();
        }}
        contentContainerStyle={{
          height: 500,
        }}>
        <View
          style={{
            flex: 1,
            // backgroundColor: 'rgba(255,255,255,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={{
              width: sizes.width - sizes._32sdp,
              padding: sizes._16sdp,
              backgroundColor: colors.white,
              borderRadius: sizes._16sdp,
              alignItems: 'center',
              justifyContent: 'center',
              // create shadow
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.8,
              shadowRadius: 2,
              elevation: 5,
            }}>
            <ScrollView>
              <View style={{marginBottom: sizes._16sdp}}>
                <Image
                  source={{uri: `file://${resultPhotoPath}`}}
                  style={{
                    objectFit: 'cover',
                    width: sizes.width - sizes._64sdp,
                    height: 300,
                    borderColor: '#ddd',
                    borderWidth: 1,
                    borderRadius: 10,
                  }}
                />
              </View>

              <TextBase
                style={[
                  AppStyle.txt_20_bold,
                  {textAlign: 'center', marginBottom: sizes._8sdp},
                ]}>
                {resultName}
              </TextBase>
              <TextBase
                style={[AppStyle.txt_18_medium, {textAlign: 'justify'}]}>
                {resultDescription}
              </TextBase>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

export default CameraResultModal;
