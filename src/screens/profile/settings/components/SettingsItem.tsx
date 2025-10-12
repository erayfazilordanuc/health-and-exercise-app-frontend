import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  Alert,
  Platform,
  Linking,
  ToastAndroid,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  CommonActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Avatar} from 'react-native-elements';
import NotificationSetting from 'react-native-open-notification';
import {useTranslation} from 'react-i18next';
import icons from '../../../../constants/icons';
import {useTheme} from '../../../../themes/ThemeProvider';

interface SettingsItemProps {
  icon: ImageSourcePropType;
  title: string;
  onPress?: () => void;
  textColor?: string;
  fontClassName?: string;
  iconClassName?: string;
  showArrow?: boolean;
  px?: number;
  pyClassName?: string;
  bg?: string;
}

export const SettingsItem = ({
  icon,
  title,
  onPress,
  textColor,
  fontClassName = 'text-xl',
  iconClassName = 'size-7',
  showArrow = true,
  px = 20,
  pyClassName = 'py-4',
  bg,
}: SettingsItemProps) => {
  const {colors} = useTheme();
  return (
    <TouchableOpacity
      style={{
        backgroundColor: bg ? bg : colors.background.primary,
        paddingHorizontal: px,
      }}
      onPress={onPress}
      className={`flex flex-row items-center justify-between ${pyClassName} rounded-2xl`}>
      <View className="flex flex-row items-center gap-3">
        <Image
          source={icon}
          className={iconClassName}
          tintColor={textColor ? textColor : colors.text.primary}
        />
        <Text
          style={{
            color: textColor ? textColor : colors.text.primary,
          }}
          className={`font-rubik ${fontClassName}`}>
          {title}
        </Text>
      </View>

      {showArrow && (
        <Image
          source={icons.rightArrow}
          className="size-5"
          tintColor={colors.text.primary}
        />
      )}
    </TouchableOpacity>
  );
};
