import React, {useState, useImperativeHandle, forwardRef} from 'react';
import {View, Text, TouchableOpacity, Modal} from 'react-native';
import {useTheme} from '../themes/ThemeProvider';

export type CustomAlertSingletonHandle = {
  show: (options: {
    message: string;
    secondMessage?: string;
    isPositive?: boolean;
    onYes?: () => void;
    onCancel?: () => void;
    onYesText?: string;
    onCancelText?: string;
  }) => void;
};

const CustomAlertSingleton = forwardRef<CustomAlertSingletonHandle>(
  (_, ref) => {
    const {colors} = useTheme();
    const [visible, setVisible] = useState(false);
    const [opts, setOpts] = useState<any>({});

    useImperativeHandle(ref, () => ({
      show: options => {
        setOpts(options);
        setVisible(true);
      },
    }));

    const handleCancel = () => {
      setVisible(false);
      opts.onCancel?.();
    };

    const handleYes = () => {
      setVisible(false);
      opts.onYes?.();
    };

    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={handleCancel}>
        <View className="flex-1 justify-center items-center bg-black/50">
          <View
            className="w-4/5 rounded-xl p-5 py-6 items-center"
            style={{backgroundColor: colors.background.primary}}>
            <Text
              className="text-lg font-rubik text-center"
              style={{color: colors.text.primary}}>
              {opts.message || 'Emin misiniz?'}
            </Text>

            {opts.secondMessage && (
              <Text
                className="text-sm font-rubik text-center mt-4"
                style={{color: colors.text.primary}}>
                Not: {opts.secondMessage}
              </Text>
            )}

            <View className="flex-row justify-between w-full mt-6">
              <TouchableOpacity
                onPress={handleCancel}
                className="flex-1 p-2 rounded-lg items-center mx-1"
                style={{backgroundColor: colors.background.secondary}}>
                <Text
                  className="text-base font-bold"
                  style={{color: colors.text.primary}}>
                  {opts.onCancelText || 'İptal'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleYes}
                className="flex-1 p-2 rounded-lg items-center mx-1"
                style={{
                  backgroundColor: opts.isPositive
                    ? '#16d750'
                    : 'rgb(239 68 68)',
                }}>
                <Text className="text-base font-bold text-white">
                  {opts.onYesText || 'Evet'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

export default CustomAlertSingleton;
