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
import icons from '../../../constants/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Avatar} from 'react-native-elements';
import CustomAvatar from '../../../components/CustomAvatar';
import {useTheme} from '../../../themes/ThemeProvider';
import CustomAlert from '../../../components/CustomAlert';
import {useLogout} from '../../../api/auth/authService';
import NotificationSetting from 'react-native-open-notification';
import {useUser} from '../../../contexts/UserContext';
import {deleteUser} from '../../../api/user/userService';
import {useTranslation} from 'react-i18next';
import {SettingsItem} from './components/SettingsItem';

const Settings = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const appNavigation = useNavigation<AppScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const {t} = useTranslation('settings');
  const {colors} = useTheme();

  const {user} = useUser();
  const logout = useLogout();
  const [isLogoutAlertVisible, setIsLogoutAlertVisible] = useState(false);
  const [isDeleteAlertVisible, setIsDeleteAlertVisible] = useState(false);

  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState<number>(0);

  const handleLogout = async () => {
    await logout();
    appNavigation.navigate('Launch');
    appNavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{name: 'Launch'}],
      }),
    );
  };

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
    } else ToastAndroid.show(t('toasts.deleteFailed'), ToastAndroid.LONG);
  };

  const handleSecretTap = () => {
    const now = Date.now();

    // Eğer son tıklama 1.5 saniyeden eskiyse resetle
    if (now - lastTapTime > 1500) {
      setTapCount(1);
    } else {
      setTapCount(prev => prev + 1);
    }

    console.log('tap', tapCount);
    setLastTapTime(now);
  };

  return (
    <>
      <View
        className="h-full pb-32 pt-3"
        style={{
          backgroundColor: colors.background.secondary,
        }}>
        <View className="flex flex-col px-3">
          <View
            className="py-1"
            style={{
              borderRadius: 17,
              backgroundColor: colors.background.primary,
            }}>
            {/* <SettingsItem
              icon={icons.preferences}
              title={t('items.preferences')}
              onPress={() => {
                navigation.navigate('Preferences');
              }}
            /> */}
            <SettingsItem
              icon={icons.account}
              title={t('items.account')}
              onPress={() => {
                navigation.navigate('Account');
              }}
            />
            <SettingsItem
              icon={icons.appearance}
              title={t('items.appearance')}
              onPress={() => {
                navigation.navigate('Appearance');
              }}
            />
            <SettingsItem
              icon={icons.language}
              title={t('items.language')}
              onPress={() => {
                navigation.navigate('Language');
              }}
            />
            {/* <SettingsItem
            icon={icons.bell}
            title={'Bildirimler'}
            onPress={() => {
              navigation.navigate('Notifications');
            }}
          /> */}
            <SettingsItem
              icon={icons.permission}
              title={
                user && user.role === 'ROLE_ADMIN'
                  ? t('items.permissionsAdmin')
                  : t('items.permissionsUser')
              }
              onPress={() => {
                navigation.navigate('Permissions');
                // if (Platform.OS === 'ios') {
                //   Linking.openURL('app-settings:');
                // } else {
                //   Linking.openSettings();
                // }
                // navigation.navigate('Permissions');
              }}
            />
            <SettingsItem
              icon={icons.app_info}
              title={t('items.appInfo')}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }}
            />
            {/* <SettingsItem
            icon={icons.shield}
            title={'Güvenlik'}
            onPress={() => {
              navigation.navigate('Security');
            }}
          /> */}
            {tapCount > 6 && (
              <SettingsItem
                icon={icons.development}
                title={'Geliştirme'}
                onPress={() => {
                  navigation.navigate('Development');
                }}
              />
            )}
          </View>
        </View>
        <View
          className="mt-3 px-3 flex-row items-center justify-between"
          style={{borderRadius: 17}}>
          <SettingsItem
            icon={icons.logout}
            title={t('items.logout')}
            textColor="#fd5353"
            bg={colors.isLight ? '#f9e4e4ff' : '#331d1dff'}
            showArrow={false}
            px={12}
            onPress={async () => {
              setIsLogoutAlertVisible(true);
            }}
          />
        </View>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleSecretTap}
          className="h-full pb-32 pt-3"
          style={{
            backgroundColor: colors.background.secondary,
          }}
        />
      </View>
      <CustomAlert
        message={t('alerts.confirmLogout')}
        visible={isLogoutAlertVisible}
        onYes={handleLogout}
        onCancel={() => {
          setIsLogoutAlertVisible(false);
        }}
      />
      <CustomAlert
        message={t('alerts.confirmDelete')}
        visible={isDeleteAlertVisible}
        onYes={handleDelete}
        onCancel={() => {
          setIsDeleteAlertVisible(false);
        }}
      />
    </>
  );
};

export default Settings;
