import {View, Text} from 'react-native';
import React from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../themes/ThemeProvider';

const Security = () => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  return (
    <View
      className="h-full pb-32 px-3 pt-3"
      style={{backgroundColor: colors.background.secondary}}>
      <View
        className="flex flex-row justify-center p-4 rounded-2xl"
        style={{backgroundColor: colors.background.primary}}>
        <Text
          className="text-xl font-rubik-medium"
          style={{color: colors.text.primary}}>
          Güvenlik
        </Text>
      </View>
    </View>
  );
};

export default Security;
