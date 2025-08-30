import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  Alert,
  Platform,
  Linking,
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

interface SettingsItemProps {
  icon: ImageSourcePropType;
  title: string;
  onPress?: () => void;
  textColor?: string;
  showArrow?: boolean;
}

const SettingsItem = ({
  icon,
  title,
  onPress,
  textColor,
  showArrow = true,
}: SettingsItemProps) => {
  const {colors} = useTheme();
  return (
    <TouchableOpacity
      style={{backgroundColor: colors.background.primary}}
      onPress={onPress}
      className="flex flex-row items-center justify-between py-4 px-5 rounded-2xl">
      <View className="flex flex-row items-center gap-3">
        <Image
          source={icon}
          className="size-7"
          tintColor={textColor ? textColor : colors.text.primary}
        />
        <Text
          style={{color: textColor ? textColor : colors.text.primary}}
          className={`font-rubik text-xl`}>
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

const Settings = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const appNavigation = useNavigation<AppScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();

  const {user} = useUser();
  const logout = useLogout();
  const [isAlertVisible, setIsAlertVisible] = useState(false);

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
            <SettingsItem
              icon={icons.preferences}
              title={'Tercihler'}
              onPress={() => {
                navigation.navigate('Preferences');
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
                  ? 'İzinler'
                  : 'İzinler ve Onaylar'
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
              title={'Uygulama Bilgileri'}
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
            {/* <SettingsItem
            icon={icons.language}
            title={'Dil'}
            onPress={() => {
              navigation.navigate('Language');
            }}
          /> */}
          </View>
        </View>
        <View className="mt-3 px-3" style={{borderRadius: 17}}>
          <SettingsItem
            icon={icons.logout}
            title="Çıkış Yap"
            textColor="#fd5353"
            showArrow={false}
            onPress={async () => {
              setIsAlertVisible(true);
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
        message={'Çıkmak istediğinize emin misiniz?'}
        visible={isAlertVisible}
        onYes={handleLogout}
        onCancel={() => {
          setIsAlertVisible(false);
        }}
      />
    </>
  );
};

export default Settings;
