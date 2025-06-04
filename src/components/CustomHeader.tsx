import React from 'react';
import {View, Text, Pressable, TouchableOpacity, Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import icons from '../constants/icons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../themes/ThemeProvider';
import {themes} from '../themes/themes';

interface CustomHeaderProps {
  title: string;
  icon?: any;
  backgroundColor?: string;
  borderColor?: string;
  className?: string;
  backArrowEnable?: boolean | false;
}

const CustomHeader = ({
  title,
  icon,
  backgroundColor,
  borderColor,
  className,
  backArrowEnable,
}: CustomHeaderProps) => {
  const navigation = useNavigation();

  const {theme, colors, setTheme} = useTheme();

  return (
    <SafeAreaView
      className="px-3 pt-3"
      style={{
        backgroundColor: colors.background.secondary,
      }}>
      <View
        className={`flex flex-row items-center justify-start rounded-2xl p-4`}
        style={{
          backgroundColor: colors.background.primary,
        }}>
        {backArrowEnable && (
          <View className="flex flex-row">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="flex items-center justify-center size-4 px-6 py-5  rounded-full"
              style={{backgroundColor: colors.background.secondary}}>
              <Image
                source={icons.backArrow}
                className="size-6"
                tintColor={colors.text.primary}
              />
            </TouchableOpacity>
          </View>
        )}
        <Text
          className="text-2xl font-rubik mr-2 ml-5"
          style={{color: colors.text.primary}}>
          {title}
        </Text>
        {/* <Image
          source={icon}
          className="size-6 mb-1"
          tintColor={colors.text.primary}
        /> */}
      </View>
    </SafeAreaView>
  );
};

export default CustomHeader;
