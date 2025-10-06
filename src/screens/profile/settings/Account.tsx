import {StyleSheet, Text, ToastAndroid, View} from 'react-native';
import React, {use, useState} from 'react';
import {SettingsItem} from './components/SettingsItem';
import icons from '../../../constants/icons';
import {useTheme} from '../../../themes/ThemeProvider';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import CustomAlert from '../../../components/CustomAlert';
import {deleteUser} from '../../../api/user/userService';
import {logout} from '../../../api/auth/authService';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

const Account = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const appNavigation = useNavigation<AppScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useTranslation('settings');

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
    } else ToastAndroid.show(t('toasts.deleteFailed'), ToastAndroid.LONG);
  };

  return (
    <>
      <View
        className="flex-1 px-3"
        style={{
          backgroundColor: colors.background.secondary,
          paddingTop: insets.top / 3,
        }}>
        <View className="flex-col">
          <View className="flex-row">
            <SettingsItem
              icon={icons.delete_user}
              title={t('items.deleteAccount')}
              textColor="#fd5353"
              bg={colors.isLight ? '#f9e4e4ff' : '#331d1dff'}
              showArrow={false}
              px={12}
              onPress={async () => {
                setIsDeleteAlertVisible(true);
              }}
            />
          </View>
        </View>
      </View>
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

export default Account;

const styles = StyleSheet.create({});
