import {View, Text, ScrollView, TouchableOpacity, Image} from 'react-native';
import React, {useEffect, useState} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Theme, themes} from '../../../themes/themes';
import {useTheme} from '../../../themes/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import icons from '../../../constants/icons';

const Preferences = () => {
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<User | null>(null);

  const {theme, colors, setTheme} = useTheme();

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      const user: User = JSON.parse(userData!);
      setUser(user);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const setUserTheme = async () => {
      await AsyncStorage.setItem(
        `${user!.username}-main-theme`,
        JSON.stringify(theme),
      );
    };

    setUserTheme();
  }, [theme]);

  return (
    <View
      className={`flex-1 pb-32 px-3 pt-3`}
      style={{backgroundColor: colors.background.secondary}}>
      <ScrollView>
        <View
          className="rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
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
          <View className="flex flex-row items-center px-3 pt-3 pb-3">
            <Text
              className="text-xl font-rubik-medium"
              style={{
                color: colors.text.primary,
              }}>
              Temayı değiştir :
            </Text>
            <View className="flex flex-row ml-3">
              <TouchableOpacity
                className="text-xl font-rubik-medium p-2 rounded-2xl"
                style={{
                  backgroundColor:
                    theme.name === 'Light'
                      ? colors.background.primary
                      : colors.background.secondary,
                }}
                onPress={() => {
                  setTheme(themes.primary.light);
                }}>
                <Image
                  source={
                    theme.name === 'Light'
                      ? icons.lightMode
                      : icons.lightModeFilled
                  }
                  className="size-8"
                  tintColor={colors.text.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                className="text-xl font-rubik-medium ml-2 mr-1 p-2 rounded-2xl"
                style={{
                  backgroundColor:
                    theme.name === 'Dark'
                      ? colors.background.primary
                      : colors.background.secondary,
                }}
                onPress={() => {
                  setTheme(themes.primary.dark);
                }}>
                <Image
                  source={
                    theme.name === 'Dark' // theme.name === "Light" is not working
                      ? icons.darkMode
                      : icons.darkModeFilled
                  }
                  className="size-8"
                  tintColor={colors.text.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View className="p-4 pb-5 flex flex-row items-center">
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
          </View>
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
