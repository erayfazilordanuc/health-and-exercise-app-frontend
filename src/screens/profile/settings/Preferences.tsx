import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Theme, themes} from '../../../themes/themes';
import {useTheme} from '../../../themes/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import icons from '../../../constants/icons';

const Preferences = () => {
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<User | null>(null);
  const [isThemeDefault, setIsThemeDefault] = useState(false);
  const {theme, colors, setTheme} = useTheme();
  const colorScheme = useColorScheme();

  const isLightActive = !isThemeDefault && theme.name === 'Light';
  const isDarkActive = !isThemeDefault && theme.name === 'Dark';
  const isSystemActive = isThemeDefault;

  useEffect(() => {
    const fetchUserAndTheme = async () => {
      const userData = await AsyncStorage.getItem('user');
      const user: User = JSON.parse(userData!);
      setUser(user);

      const userThemeJson = await AsyncStorage.getItem(
        `${user!.username}-main-theme`,
      );
      const userTheme: UserTheme = JSON.parse(userThemeJson!);
      setIsThemeDefault(userTheme.isDefault);
      console.log(userTheme);
    };

    fetchUserAndTheme();
  }, []);

  const handleThemeChange = async (theme: Theme, isDefault?: boolean) => {
    const newUserTheme: UserTheme = {
      theme: theme,
      isDefault: !!isDefault,
    };
    console.log(newUserTheme);

    console.log(isThemeDefault);
    setIsThemeDefault(!!isDefault);

    if (isDefault) {
      setTheme(
        colorScheme === 'dark' ? themes.primary.dark : themes.primary.light,
      );
    } else {
      setTheme(theme);
    }

    await AsyncStorage.setItem(
      `${user!.username}-main-theme`,
      JSON.stringify(newUserTheme),
    );

    console.log(theme);
  };

  const isDarkSelected = () => {
    return theme.name === 'dark' && !isThemeDefault;
  };

  const isLightSelected = () => {
    return theme.name === 'light' && !isThemeDefault;
  };

  return (
    <View
      className={`flex-1 pb-32 px-3 pt-3`}
      style={{backgroundColor: colors.background.secondary}}>
      <ScrollView>
        <View
          className="rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
          {user && user.username === 'erayfazilordanuc' && (
            <>
              <Text
                className="text-xl font-rubik-medium p-4"
                style={{
                  color: colors.text.primary,
                }}>
                Tema :{'  '}
                <Text selectable className="text-xl font-rubik">
                  {theme.name == 'Dark' ? 'Koyu' : 'Açık'}
                </Text>
              </Text>
              <Text
                className="text-xl font-rubik-medium p-4"
                style={{
                  color: colors.text.primary,
                }}>
                Renkler :{'  '}
                <Text selectable className="text-xl font-rubik">
                  {colors.primary[100]}
                </Text>
              </Text>
              <Text
                className="text-xl font-rubik-medium p-4"
                style={{
                  color: colors.text.primary,
                }}>
                Arkaplan rengi :{'  '}
                <Text selectable className="text-xl font-rubik">
                  {colors.background.primary}
                </Text>
              </Text>
            </>
          )}
          <View className="flex flex-col items-between justify-center px-3 pt-3 pb-3">
            <Text
              className="text-2xl font-rubik-medium ml-2 mb-2"
              style={{
                color: colors.text.primary,
              }}>
              Tema
            </Text>
            <View className="flex flex-row items-center justify-between">
              <TouchableOpacity
                className="py-3 px-4 rounded-3xl flex flex-row items-center justify-center"
                style={{
                  // backgroundColor:
                  //   theme.name === 'Light'
                  //     ? colors.background.primary
                  //     : colors.background.secondary,
                  backgroundColor: !isLightActive
                    ? colors.background.secondary
                    : colors.background.primary,
                }}
                onPress={() => handleThemeChange(themes.primary.light)}>
                <Image
                  source={
                    theme.name === 'Light'
                      ? icons.lightMode
                      : icons.lightModeFilled
                  }
                  className="size-8"
                  tintColor={colors.text.primary}
                />
                <Text
                  className="ml-3 text-lg font-rubik"
                  style={{color: colors.text.primary}}>
                  Açık
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="py-3 px-4 rounded-3xl flex flex-row items-center justify-center"
                style={{
                  backgroundColor: !isDarkActive
                    ? colors.background.secondary
                    : colors.background.primary,
                }}
                onPress={() => handleThemeChange(themes.primary.dark)}>
                <Image
                  source={
                    theme.name === 'Dark' // theme.name === "Light" is not working
                      ? icons.darkMode
                      : icons.darkModeFilled
                  }
                  className="size-8"
                  tintColor={colors.text.primary}
                />
                <Text
                  className="ml-3 text-lg font-rubik"
                  style={{color: colors.text.primary}}>
                  Koyu
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="py-3 px-4 rounded-3xl flex flex-row items-center justify-center"
                style={{
                  backgroundColor: isThemeDefault
                    ? colors.background.primary
                    : colors.background.secondary,
                }}
                onPress={() => handleThemeChange(themes.primary.light, true)}>
                <Image
                  source={icons.system_default_theme}
                  className="size-8"
                  tintColor={colors.text.primary}
                />
                <Text
                  className="ml-3 text-lg font-rubik"
                  style={{color: colors.text.primary}}>
                  Sistem
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* <View className="p-4 pb-5 flex flex-row items-center">
            <Text
              className="text-xl font-rubik-medium"
              style={{
                color: colors.text.primary,
              }}>
              Favori renk :{'  '}
            </Text>
            <Text
              selectable
              className="text-xl font-rubik"
              style={{
                color: colors.text.primary,
              }}>
              Mavi {'('}
              {colors.primary[300]}
              {')'}
            </Text>
            <View
              className="ml-1 w-5 h-5 rounded-md"
              style={{backgroundColor: colors.primary[300]}}></View>
          </View> */}
        </View>
      </ScrollView>
    </View>
  );
};

export default Preferences;

{
  /* <TouchableOpacity
              className="text-xl font-rubik-medium ml-1"
              onPress={() => {
                setTheme(
                  theme === themes.primary.dark
                    ? themes.primary.light
                    : themes.primary.dark,
                );
              }}>
              <Image
                source={
                  theme.name === 'Dark' // theme === themes.primary.light is not working
                    ? icons.nightMode
                    : icons.dayMode
                }
                className="size-10"
              />
            </TouchableOpacity> */
}
