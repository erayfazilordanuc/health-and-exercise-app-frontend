import {
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {use, useEffect, useState} from 'react';
import {SettingsItem} from './components/SettingsItem';
import icons from '../../../constants/icons';
import {useTheme} from '../../../themes/ThemeProvider';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import CustomAlert from '../../../components/CustomAlert';
import {deleteUser, updateUser} from '../../../api/user/userService';
import {logout} from '../../../api/auth/authService';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {Input} from 'react-native-elements';
import {useUser} from '../../../contexts/UserContext';

const Account = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const appNavigation = useNavigation<AppScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const {colors, theme} = useTheme();
  const {t} = useTranslation('profile');
  const {t: s} = useTranslation('settings');
  const {t: l} = useTranslation('login');

  const {user, setUser} = useUser();

  const [uFullName, setFullName] = useState(user?.fullName);
  const [uUsername, setUsername] = useState(user?.username);
  const [uEmail, setEmail] = useState(user?.email);
  const [uPassword, setPassword] = useState('');

  const [passwordChange, setPasswordChange] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [isDeleteAlertVisible, setIsDeleteAlertVisible] = useState(false);

  const handleDelete = async () => {
    const isUserDeleted = await deleteUser();
    if (isUserDeleted) {
      await logout();
      appNavigation.navigate('Launch');
      appNavigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Launch'}],
        }),
      );
    } else ToastAndroid.show(s('toasts.deleteFailed'), ToastAndroid.LONG);
  };

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(60);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      event => {
        setKeyboardHeight(event.endCoordinates.height);
        setIsKeyboardVisible(true); // Klavye açıldı
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false); // Klavye kapandı
      },
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const saveUser = async () => {
    if (!user) return;

    if (
      user.fullName === uFullName &&
      user.username === uUsername &&
      user.email === uEmail &&
      !uPassword
    )
      return;

    if (!uUsername || !uFullName) {
      ToastAndroid.show("t('toasts.saveSuccessful')", ToastAndroid.SHORT);
    }

    if (uUsername && uUsername.length < 4) {
      ToastAndroid.show(l('toasts.usernameMin'), ToastAndroid.SHORT);
      return;
    }

    if (uUsername && uUsername.length > 25) {
      ToastAndroid.show(l('toasts.usernameMax'), ToastAndroid.SHORT);
      return;
    }

    if (uPassword && uPassword.length < 8) {
      ToastAndroid.show(l('toasts.passwordMin'), ToastAndroid.SHORT);
      return;
    }

    if (uEmail && !emailRegex.test(uEmail.trim())) {
      ToastAndroid.show(l('toasts.invalidEmail'), ToastAndroid.SHORT);
      return;
    }

    const updateDTO: UpdateUserDTO = {
      id: user.id!,
      fullName: uFullName,
      username: uUsername,
      email: uEmail,
      password: uPassword === '' ? null : uPassword,
    };
    const response = await updateUser(updateDTO);
    if (response.status >= 200 && response.status <= 300) {
      ToastAndroid.show(t('toasts.saveSuccessful'), ToastAndroid.SHORT);
      setUser(response.data);
    } else {
      ToastAndroid.show(t('toasts.saveUnsuccessful'), ToastAndroid.SHORT);
    }
  };

  return (
    <>
      <ScrollView
        className="px-3 mt-3"
        style={{backgroundColor: 'transparent'}}
        contentContainerStyle={{
          paddingBottom: 120,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled">
        <View
          className="px-4 py-3 rounded-2xl mb-2"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="font-rubik text-xl mb-3 pl-1 pt-1"
            style={{color: colors.text.primary}}>
            {t('labels.fullName')}
          </Text>
          <View
            className="flex flex-row justify-between mb-1 rounded-2xl pl-3"
            style={{
              backgroundColor: colors.background.secondary,
            }}>
            <TextInput
              value={uFullName}
              placeholderTextColor="gray"
              onChangeText={text => {
                setFullName(text);
              }}
              placeholder={t('labels.fullName')}
              selectionColor={'#7AADFF'}
              className="flex-1 font-rubik text-xl rounded-2xl"
              style={{
                backgroundColor: colors.background.secondary,
                color: colors.text.primary,
              }}
            />
          </View>
        </View>

        <View
          className="px-4 py-3 rounded-2xl mb-2"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="font-rubik text-xl mb-3 pl-1 pt-1"
            style={{color: colors.text.primary}}>
            {t('labels.username')}
          </Text>
          <View
            className="flex flex-row justify-between mb-1 rounded-2xl pl-3"
            style={{
              backgroundColor: colors.background.secondary,
            }}>
            <TextInput
              value={uUsername}
              placeholderTextColor="gray"
              onChangeText={text => {
                setUsername(text);
              }}
              placeholder={t('labels.username')}
              selectionColor={'#7AADFF'}
              className="flex-1 font-rubik text-xl rounded-2xl"
              style={{
                backgroundColor: colors.background.secondary,
                color: colors.text.primary,
              }}
            />
          </View>
        </View>

        <View
          className="px-4 py-3 rounded-2xl mb-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="font-rubik text-xl mb-3 pl-1 pt-1"
            style={{color: colors.text.primary}}>
            {t('labels.email')}
          </Text>
          <View
            className="flex flex-row justify-between mb-1 rounded-2xl pl-3"
            style={{
              backgroundColor: colors.background.secondary,
            }}>
            <TextInput
              value={uEmail}
              placeholder={t('labels.exampleEmail')}
              placeholderTextColor="gray"
              onChangeText={text => {
                setEmail(text);
              }}
              selectionColor={'#7AADFF'}
              className="flex-1 font-rubik text-xl rounded-2xl"
              style={{
                backgroundColor: colors.background.secondary,
                color: colors.text.primary,
              }}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            setPasswordChange(true);
          }}
          disabled={passwordChange}
          className="flex-col px-4 pt-4 pb-2 rounded-2xl mb-3"
          style={{backgroundColor: colors.background.primary}}>
          {passwordChange ? (
            <Text
              className="font-rubik text-xl mb-3 pl-1"
              style={{color: colors.text.primary}}>
              {t('labels.enterPassword')}
            </Text>
          ) : (
            <View className="flex-row items-center justify-center pl-1 mb-3">
              <Text
                className="font-rubik text-xl"
                style={{color: colors.text.primary}}>
                {t('labels.changePassword')}
              </Text>
              <Image source={icons.edit} className="size-5 ml-3" />
            </View>
          )}

          {passwordChange && (
            <View
              className="flex-col justify-between mb-1 rounded-2xl py-1"
              style={{
                backgroundColor: colors.background.primary,
              }}>
              <View
                className="flex flex-row items-center justify-start z-50 rounded-full"
                style={{
                  backgroundColor: theme.colors.isLight
                    ? colors.background.primary
                    : '#333333',
                }}>
                <TextInput
                  value={uPassword}
                  placeholder={t('labels.passwordPlaceholder')}
                  placeholderTextColor="gray"
                  onChangeText={text => {
                    setPassword(text);
                  }}
                  selectionColor={'#7AADFF'}
                  className="flex-1 font-rubik text-xl rounded-2xl px-4"
                  style={{
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                  textContentType="password"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-5">
                  <Image
                    source={showPassword ? icons.show : icons.hide}
                    className="size-6 mr-2"
                    tintColor={'gray'}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                className="self-start rounded-2xl px-3 py-2 mr-1 mt-2"
                style={{backgroundColor: '#fd5353'}}
                onPress={() => {
                  setPasswordChange(false);
                  setPassword('');
                }}>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.background.primary}}>
                  {t('buttons.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        <View className="flex-row mb-3 justify-end">
          <SettingsItem
            icon={icons.check}
            title={s('items.save')}
            textColor="#16d750"
            fontClassName="text-lg"
            iconClassName="size-5"
            bg={colors.isLight ? '#d0f8ddff' : '#1b3523ff'}
            showArrow={false}
            px={15}
            pyClassName={'py-3'}
            onPress={async () => {
              saveUser();
            }}
          />
        </View>

        <View className="flex-row mt-32 justify-start">
          <SettingsItem
            icon={icons.delete_user}
            title={s('items.deleteAccount')}
            textColor="#fd5353"
            fontClassName="text-lg"
            iconClassName="size-6"
            bg={colors.isLight ? '#f9e4e4ff' : '#331d1dff'}
            showArrow={false}
            px={15}
            pyClassName={'py-3'}
            onPress={async () => {
              setIsDeleteAlertVisible(true);
            }}
          />
        </View>
      </ScrollView>
      <CustomAlert
        message={s('alerts.confirmDelete')}
        visible={isDeleteAlertVisible}
        onYes={handleDelete}
        onCancel={() => {
          setIsDeleteAlertVisible(false);
        }}
      />
    </>
  );
};

export default Account;
