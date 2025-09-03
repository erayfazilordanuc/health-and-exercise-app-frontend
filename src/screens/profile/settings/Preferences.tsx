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
import {
  parseTheme,
  Theme,
  ThemeColor,
  ThemeMode,
  themes,
  ThemeType,
} from '../../../themes/themes';
import {useTheme} from '../../../themes/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import icons from '../../../constants/icons';
import {updateUser} from '../../../api/user/userService';
import {update} from 'lodash';
import {useUser} from '../../../contexts/UserContext';
import LinearGradient from 'react-native-linear-gradient';
import ColorCircle from '../../../components/ColorCircle';

const Preferences = () => {
  const insets = useSafeAreaInsets();

  const {user, setUser} = useUser();
  const [isThemeDefault, setIsThemeDefault] = useState(false);
  const {theme, colors, setTheme} = useTheme();
  const colorScheme = useColorScheme() ?? 'light';

  const getOption = () =>
    parseTheme((user?.theme ?? 'blueSystem') as ThemeOption);

  const composeTheme = (color: ThemeColor, mode: ThemeMode): ThemeOption =>
    `${color}${
      (mode.charAt(0).toUpperCase() + mode.slice(1)) as Capitalize<ThemeMode>
    }`;

  const getActiveTheme = (
    themeObj: ThemeType,
    mode: ThemeMode,
    colorScheme: 'light' | 'dark',
  ) =>
    (mode === 'system' ? colorScheme : mode) === 'dark'
      ? themeObj.dark
      : themeObj.light;

  const handleThemeColorChange = async (newColor: ThemeColor) => {
    console.log(user);
    if (!user?.theme) return;

    const {mode} = parseTheme(user.theme as ThemeOption);
    console.log('mode', mode);
    const nextThemeOption = composeTheme(newColor, mode);
    console.log('next', nextThemeOption);

    const {themeObj} = parseTheme(nextThemeOption);
    console.log('obj', themeObj);
    setTheme(getActiveTheme(themeObj, mode, colorScheme));

    if (user.id) {
      const updateDTO: UpdateUserDTO = {
        id: user.id,
        theme: nextThemeOption,
      };
      console.log('dto', updateDTO);
      const response = await updateUser(updateDTO);
      if (response.status >= 200 && response.status <= 300)
        setUser(response.data);
    }
  };

  const handleThemeModeChange = async (newMode: ThemeMode) => {
    if (!user?.theme) return;

    const {color} = parseTheme(user.theme as ThemeOption);
    const nextThemeOption = composeTheme(color, newMode);

    const {themeObj} = parseTheme(nextThemeOption);
    setTheme(getActiveTheme(themeObj, newMode, colorScheme));

    if (user.id) {
      const updateDTO: UpdateUserDTO = {
        id: user.id,
        theme: nextThemeOption,
      };
      const response = await updateUser(updateDTO);
      if (response.status >= 200 && response.status <= 300)
        setUser(response.data);
    }
  };

  const handleThemeChange = async (theme: ThemeOption) => {
    const {color, mode, themeObj} = parseTheme(theme);

    if (mode === 'system') {
      setTheme(colorScheme === 'dark' ? themeObj.dark : themeObj.light);
    } else {
      setTheme(mode === 'dark' ? themeObj.dark : themeObj.light);
    }
    if (user && user.id) {
      const updateDTO: UpdateUserDTO = {
        id: user.id,
        theme: theme,
      };
      const response = await updateUser(updateDTO);
      const {setUser} = useUser();
      if (response.status <= 300 && response.status >= 200)
        setUser(response.data);
    }

    console.log(theme);
  };

  return (
    <View
      className={`flex-1 pb-32 px-3 pt-3`}
      style={{backgroundColor: colors.background.secondary}}>
      <ScrollView>
        <View
          style={{
            borderRadius: 17,
            backgroundColor: colors.background.primary,
          }}>
          {user && user.username === 'ordanuc' && (
            <>
              <Text
                className="font-rubik-medium p-4"
                style={{
                  fontSize: 18,
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

          <View className="flex flex-col items-start justify-center px-3 pt-3 pb-3">
            <View className="flex-col items-center mb-2">
              <Text
                className="font-rubik-medium ml-2"
                style={{
                  fontSize: 18,
                  color: colors.text.primary,
                }}>
                Tema Rengi
              </Text>
              <View
                className="flex-row items-center p-2 rounded-2xl"
                style={{backgroundColor: colors.background.primary}}>
                <Text
                  className="font-rubik mr-1"
                  style={{
                    fontSize: 16,
                    color: colors.text.primary,
                  }}>
                  Seçili:
                </Text>
                <ColorCircle
                  color1={theme.colors.primary[300]}
                  color2={theme.colors.secondary[300]}
                  padding={14}
                />
              </View>
            </View>
            <View className="flex flex-col items-start justify-center ml-2">
              <TouchableOpacity
                className="flex-row items-center p-2 rounded-2xl"
                style={{backgroundColor: colors.background.secondary}}
                onPress={() => handleThemeColorChange('blue')}>
                <Text
                  className="font-rubik ml-1 mr-2"
                  style={{
                    fontSize: 16,
                    color: colors.text.primary,
                  }}>
                  Mavi-Turkuaz
                </Text>
                <ColorCircle
                  color1={themes.blue.light.colors.primary[300]}
                  color2={themes.blue.light.colors.secondary[300]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center p-2 rounded-2xl mt-2"
                style={{backgroundColor: colors.background.secondary}}
                onPress={() => handleThemeColorChange('purple')}>
                <Text
                  className="font-rubik ml-1 mr-2"
                  style={{
                    fontSize: 16,
                    color: colors.text.primary,
                  }}>
                  Mor-Pembe
                </Text>
                <ColorCircle
                  color1={themes.purple.light.colors.primary[300]}
                  color2={themes.purple.light.colors.secondary[300]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center p-2 rounded-2xl mt-2"
                style={{backgroundColor: colors.background.secondary}}
                onPress={() => handleThemeColorChange('green')}>
                <Text
                  className="font-rubik ml-1 mr-2"
                  style={{
                    fontSize: 16,
                    color: colors.text.primary,
                  }}>
                  Yeşil-Sarı
                </Text>
                <ColorCircle
                  color1={themes.green.light.colors.primary[300]}
                  color2={themes.green.light.colors.secondary[300]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center p-2 rounded-2xl mt-2"
                style={{backgroundColor: colors.background.secondary}}
                onPress={() => handleThemeColorChange('red')}>
                <Text
                  className="font-rubik ml-1 mr-2"
                  style={{
                    fontSize: 16,
                    color: colors.text.primary,
                  }}>
                  Kırmızı-Turuncu
                </Text>
                <ColorCircle
                  color1={themes.red.light.colors.primary[300]}
                  color2={themes.red.light.colors.secondary[300]}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex flex-col items-between justify-center px-3 pt-2 pb-4">
            <View className="flex-col mb-2">
              <Text
                className="font-rubik-medium ml-2"
                style={{
                  fontSize: 18,
                  color: colors.text.primary,
                }}>
                Tema Modu
              </Text>
              <View
                className="flex-row items-center p-2 rounded-2xl ml-2"
                style={{backgroundColor: colors.background.primary}}>
                <Text
                  className="font-rubik mr-2"
                  style={{
                    fontSize: 16,
                    color: colors.text.primary,
                  }}>
                  Seçili:
                </Text>
                <Image
                  source={
                    getOption().mode === 'system'
                      ? icons.system_default_theme
                      : getOption().mode === 'light'
                      ? icons.lightMode
                      : icons.darkModeFilled
                  }
                  className="size-7 mr-1"
                  tintColor={colors.text.primary}
                />
                {getOption().mode === 'system' && (
                  <Text
                    className="font-rubik ml-3"
                    style={{
                      fontSize: 12,
                      color: colors.text.primary,
                    }}>
                    (Cihazınızdaki açık/koyu moduna{'\n'}otomatik uyum sağlar.)
                  </Text>
                )}
              </View>
            </View>
            <View className="flex flex-row items-center justify-center">
              <TouchableOpacity
                className="mr-1 py-2 px-4 rounded-2xl flex flex-row items-center justify-center"
                style={{
                  // backgroundColor:
                  //   theme.colors.isLight
                  //     ? colors.background.primary
                  //     : colors.background.secondary,
                  backgroundColor: colors.background.secondary,
                }}
                onPress={() => handleThemeModeChange('light')}>
                <Image
                  source={icons.lightMode}
                  className="size-7"
                  tintColor={colors.text.primary}
                />
                <Text
                  className="ml-3 font-rubik"
                  style={{
                    fontSize: 15,
                    color: colors.text.primary,
                  }}>
                  Açık
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="mx-1 py-2 px-4 rounded-2xl flex flex-row items-center justify-center"
                style={{
                  backgroundColor: colors.background.secondary,
                }}
                onPress={() => handleThemeModeChange('dark')}>
                <Image
                  source={icons.darkModeFilled}
                  className="size-7"
                  tintColor={colors.text.primary}
                />
                <Text
                  className="ml-3 font-rubik"
                  style={{
                    fontSize: 15,
                    color: colors.text.primary,
                  }}>
                  Koyu
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="ml-1 py-2 px-4 rounded-2xl flex flex-row items-center justify-center"
                style={{
                  backgroundColor: colors.background.secondary,
                }}
                onPress={() => handleThemeModeChange('system')}>
                <Image
                  source={icons.system_default_theme}
                  className="size-7"
                  tintColor={colors.text.primary}
                />
                <Text
                  className="ml-3 font-rubik"
                  style={{
                    fontSize: 15,
                    color: colors.text.primary,
                  }}>
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
                  theme === themes.blue.dark
                    ? themes.blue.light
                    : themes.blue.dark,
                );
              }}>
              <Image
                source={
                  theme.name === 'Dark' // theme === themes.blue.light is not working
                    ? icons.nightMode
                    : icons.dayMode
                }
                className="size-10"
              />
            </TouchableOpacity> */
}
