import React from 'react';
import {View, Text, TouchableOpacity, Modal} from 'react-native';
import {useTheme} from '../themes/ThemeProvider';

interface CustomAlertProps {
  message: string;
  secondMessage?: string;
  visible: boolean;
  onYes: () => void;
  onCancel: () => void;
  isPositive?: boolean;
  onCancelText?: string;
  onYesText?: string;
}

const CustomAlert = ({
  message,
  secondMessage,
  visible,
  onYes,
  onCancel,
  isPositive,
  onCancelText,
  onYesText,
}: CustomAlertProps) => {
  const {theme, colors, setTheme} = useTheme();

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View
          className="w-4/5 rounded-xl p-5 py-6 items-center"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="text-lg font-rubik text-center"
            style={{color: colors.text.primary}}>
            {message ? message : 'Emin misiniz?'}
          </Text>
          {secondMessage && (
            <Text
              className="text-sm font-rubik text-center mt-4"
              style={{color: colors.text.primary}}>
              {'Not: ' + secondMessage}
            </Text>
          )}
          <View className="flex-row justify-between w-full mt-6">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 p-2 rounded-lg items-center mx-1"
              style={{backgroundColor: colors.background.secondary}}>
              <Text
                className="text-base font-bold"
                style={{color: colors.text.primary}}>
                {onCancelText ? onCancelText : 'İptal'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onYes();
                visible = true;
              }}
              className="flex-1 p-2  rounded-lg items-center mx-1"
              style={{
                backgroundColor: isPositive ? '#16d750' : 'rgb(239 68 68)',
              }}>
              <Text
                className={`text-base font-bold text-white ${
                  onYesText ? '' : 'mr-1'
                }`}>
                {onYesText ? onYesText : 'Evet'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;
