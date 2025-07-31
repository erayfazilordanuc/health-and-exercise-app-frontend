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
      <View className="flex-1 justify-center items-center">
        <View
          className="w-4/5 rounded-2xl p-5 py-5 items-center"
          style={{
            backgroundColor: colors.background.primary,
            shadowColor: 'gray', // ✅ iOS için
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 4, // ✅ Android için
          }}>
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

          <View className="flex flex-row justify-between mt-6">
            <TouchableOpacity
              onPress={onCancel}
              className="py-2 px-5 rounded-xl items-center mr-2"
              style={{backgroundColor: colors.background.secondary}}>
              <Text
                className="text-lg font-rubik"
                style={{color: colors.text.primary}}>
                {onCancelText ? onCancelText : 'İptal'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onYes();
                visible = true;
              }}
              className="py-2 px-5 rounded-xl items-center ml-2"
              style={{
                backgroundColor: isPositive ? '#16d750' : 'rgb(239 68 68)',
              }}>
              <Text
                className={`text-lg font-rubik`}
                style={{color: colors.background.primary}}>
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
