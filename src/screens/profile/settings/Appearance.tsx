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
import {useTranslation} from 'react-i18next';

const Appearance = () => {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation('settings');
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
    if (!user?.theme) return;

    const {mode} = parseTheme(user.theme as ThemeOption);
    const nextThemeOption = composeTheme(newColor, mode);

    const {themeObj} = parseTheme(nextThemeOption);
    setTheme(getActiveTheme(themeObj, mode, colorScheme));

    if (user.id) {
      const updateDTO: UpdateUserDTO = {
        id: user.id,
        theme: nextThemeOption,
      };
      const response = await updateUser(updateDTO);
      if (response.status >= 200 && response.status <= 300) {
        AsyncStorage.setItem('user', JSON.stringify(response.data as User));
        setUser(response.data);
      }
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
      if (response.status >= 200 && response.status <= 300) {
        AsyncStorage.setItem('user', JSON.stringify(response.data as User));
        setUser(response.data);
      }
    }
  };
  // ---------- /LOGIC: AYNEN KORUNDU ----------

  // ---------- UI HELPERS (yalnızca görünüm) ----------
  const SectionCard: React.FC<{
    title?: string;
    children: React.ReactNode;
    style?: any;
    right?: React.ReactNode;
  }> = ({title, children, style, right}) => (
    <View
      className="rounded-2xl mb-3"
      style={{
        backgroundColor: colors.background.primary,
        shadowColor: '#000',
        shadowOpacity: theme.colors.isLight ? 0.06 : 0.12,
        shadowRadius: 12,
        shadowOffset: {width: 0, height: 6},
        elevation: 3,
        ...style,
      }}>
      {title ? (
        <View className="flex-row items-center justify-between px-4 pt-4">
          <Text
            className="font-rubik-medium"
            style={{fontSize: 18, color: colors.text.primary}}>
            {title}
          </Text>
          {right}
        </View>
      ) : null}
      <View className="px-4 pb-4 pt-3">{children}</View>
    </View>
  );

  const Chip: React.FC<{
    active?: boolean;
    icon?: any;
    label: string;
    onPress: () => void;
  }> = ({active, icon, label, onPress}) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-4 py-3 rounded-2xl mr-2 mb-2"
      style={{
        backgroundColor: active
          ? colors.background.third
          : colors.background.secondary,
        borderWidth: active ? 1 : 0,
        borderColor: active ? colors.primary[200] : 'transparent',
      }}>
      {icon ? (
        <Image
          source={icon}
          className="size-6"
          tintColor={active ? colors.primary[200] : colors.text.primary}
        />
      ) : null}
      <Text
        className="font-rubik ml-2"
        style={{
          color: active ? colors.primary[200] : colors.text.primary,
          fontSize: 15,
        }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ColorOption: React.FC<{
    label: string;
    color: ThemeColor;
    c1: string;
    c2: string;
    active: boolean;
    onPress: () => void;
  }> = ({label, color, c1, c2, active, onPress}) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between p-3 rounded-2xl mb-2"
      style={{
        backgroundColor: colors.background.secondary,
        borderWidth: active ? 1 : 0,
        borderColor: active ? colors.primary[200] : 'transparent',
      }}>
      <View className="flex-row items-center">
        <Text
          className="font-rubik mr-3"
          style={{color: colors.text.primary, fontSize: 16}}>
          {label}
        </Text>
        <ColorCircle color1={c1} color2={c2} />
      </View>
      {active ? (
        <Image
          source={icons.check}
          className="size-5"
          tintColor={colors.primary[200]}
        />
      ) : (
        <View className="size-5" />
      )}
    </TouchableOpacity>
  );
  // ---------- /UI HELPERS ----------

  const {mode, color} = getOption();
  const isLight = (mode === 'system' ? colorScheme : mode) === 'light';

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: colors.background.secondary,
        paddingTop: insets.top / 3,
      }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingBottom: insets.bottom + 100,
        }}>
        <LinearGradient
          colors={colors.gradient}
          locations={[0.15, 0.25, 0.7, 1]}
          start={{x: 0.1, y: 0}}
          end={{x: 0.8, y: 1}}
          style={{borderRadius: 17}}
          className="mb-3 px-4 pb-4 pt-2">
          <Text
            className="font-rubik-semibold"
            style={{
              fontSize: 24,
              color: theme.colors.isLight
                ? '#333333'
                : colors.background.primary,
            }}>
            {t('appearance.mock')}
          </Text>
          <Text
            className="font-rubik mt-1 opacity-80"
            style={{
              fontSize: 13,
              color: theme.colors.isLight ? '#555' : colors.background.primary,
            }}>
            {t('appearance.themeColor')}
          </Text>
        </LinearGradient>

        {user && user.username === 'ordanuc' && (
          <SectionCard
            title={t('items.development')}
            right={
              <View className="flex-row items-center">
                <ColorCircle
                  color1={theme.colors.primary[300]}
                  color2={theme.colors.secondary[300]}
                />
              </View>
            }>
            <Text
              className="font-rubik mb-1"
              style={{color: colors.text.primary}}>
              {t('appearance.debug.theme')}{' '}
              <Text selectable className="font-rubik">
                {theme.name == 'Dark'
                  ? t('appearance.dark')
                  : t('appearance.light')}
              </Text>
            </Text>
            <Text
              className="font-rubik mb-1"
              style={{color: colors.text.primary}}>
              {t('appearance.debug.colors')}{' '}
              <Text selectable className="font-rubik">
                {colors.primary[100]}
              </Text>
            </Text>
            <Text className="font-rubik" style={{color: colors.text.primary}}>
              {t('appearance.debug.background')}{' '}
              <Text selectable className="font-rubik">
                {colors.background.primary}
              </Text>
            </Text>
          </SectionCard>
        )}

        {/* Seçili Tema Rengi */}
        <SectionCard
          title={t('appearance.themeColor')}
          right={
            <View
              className="px-2 py-1 rounded-xl"
              style={{backgroundColor: colors.background.secondary}}>
              <View className="flex-row items-center">
                <Text
                  className="font-rubik mr-1 p-1"
                  style={{color: colors.text.primary, fontSize: 12}}>
                  {t('appearance.selected')}
                </Text>
                <ColorCircle
                  color1={theme.colors.primary[300]}
                  color2={theme.colors.secondary[300]}
                  padding={12}
                />
              </View>
            </View>
          }>
          {/* Grid yerine dikey list – erişilebilir ve kaydırması kolay */}
          <ColorOption
            label={t('appearance.colorBlueTurquoise')}
            color="blue"
            c1={themes.blue.light.colors.primary[300]}
            c2={themes.blue.light.colors.secondary[300]}
            active={color === 'blue'}
            onPress={() => handleThemeColorChange('blue')}
          />
          <ColorOption
            label={t('appearance.colorPurplePink')}
            color="purple"
            c1={themes.purple.light.colors.primary[300]}
            c2={themes.purple.light.colors.secondary[300]}
            active={color === 'purple'}
            onPress={() => handleThemeColorChange('purple')}
          />
          <ColorOption
            label={t('appearance.colorGreenYellow')}
            color="green"
            c1={themes.green.light.colors.primary[300]}
            c2={themes.green.light.colors.secondary[300]}
            active={color === 'green'}
            onPress={() => handleThemeColorChange('green')}
          />
          <ColorOption
            label={t('appearance.colorRedOrange')}
            color="red"
            c1={themes.red.light.colors.primary[300]}
            c2={themes.red.light.colors.secondary[300]}
            active={color === 'red'}
            onPress={() => handleThemeColorChange('red')}
          />
        </SectionCard>

        {/* Tema Modu */}
        <SectionCard
          title={t('appearance.themeMode')}
          right={
            <View
              className="flex-row items-center px-2 py-1 rounded-xl"
              style={{backgroundColor: colors.background.secondary}}>
              <Text
                className="font-rubik mr-2"
                style={{color: colors.text.primary, fontSize: 12}}>
                {t('appearance.selected')}
              </Text>
              <Image
                source={
                  mode === 'system'
                    ? icons.system_default_theme
                    : mode === 'light'
                    ? icons.lightMode
                    : icons.darkModeFilled
                }
                className="size-6"
                tintColor={colors.text.primary}
              />
            </View>
          }>
          <View className="flex-row items-center justify-between">
            <Chip
              active={mode === 'light'}
              icon={icons.lightMode}
              label={t('appearance.light')}
              onPress={() => handleThemeModeChange('light')}
            />
            <Chip
              active={mode === 'dark'}
              icon={icons.darkModeFilled}
              label={t('appearance.dark')}
              onPress={() => handleThemeModeChange('dark')}
            />
            <Chip
              active={mode === 'system'}
              icon={icons.system_default_theme}
              label={t('appearance.system')}
              onPress={() => handleThemeModeChange('system')}
            />
          </View>

          {mode === 'system' ? (
            <View
              className="mt-2 px-3 py-2 rounded-xl"
              style={{backgroundColor: colors.background.secondary}}>
              <Text
                className="font-rubik"
                style={{color: colors.text.primary, fontSize: 12}}>
                {t('appearance.systemNote')}
              </Text>
            </View>
          ) : null}
        </SectionCard>
      </ScrollView>
    </View>
  );
};

export default Appearance;
