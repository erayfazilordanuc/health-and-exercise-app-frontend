import {View, Text, TouchableOpacity, ScrollView, Image} from 'react-native';
import React, {useEffect, useState} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../themes/ThemeProvider';
import NotificationSetting from 'react-native-open-notification';
import icons from '../../../constants/icons';
import {getLatestConsent} from '../../../api/consent/consentService';
import {ConsentPurpose, ConsentStatus} from '../../../types/enums';

const Permissions = () => {
  const insets = useSafeAreaInsets();
  const {colors, theme} = useTheme();
  const [kvkkConsent, setKvkkConsent] = useState<ConsentDTO | null>(null);
  const [healthConsent, setHealthConsent] = useState<ConsentDTO | null>(null);

  const fetchConsents = async () => {
    const kvkkConsent = await getLatestConsent(
      ConsentPurpose['KVKK_NOTICE_ACK'],
    );
    setKvkkConsent(kvkkConsent);
    const healthConsent = await getLatestConsent(
      ConsentPurpose['HEALTH_DATA_PROCESSING'],
    );
    setHealthConsent(healthConsent);
  };

  useEffect(() => {
    fetchConsents();
  }, []);
  console.log('weeeeeeeeee', ConsentStatus[kvkkConsent?.status]);
  return (
    <View
      className={`flex-1 pb-32 px-3 pt-3`}
      style={{backgroundColor: colors.background.secondary}}>
      <ScrollView>
        <TouchableOpacity
          className="flex flex-row items-center justify-between px-3 py-4 rounded-2xl mb-2"
          style={{backgroundColor: colors.background.primary}}
          onPress={() => {
            NotificationSetting.open();
          }}>
          <Text
            className="ml-2 font-rubik"
            style={{
              fontSize: 18,
              color: colors.text.primary,
            }}>
            Uygulama İzinlerine Git
          </Text>
          <Image
            source={icons.rightArrow}
            className="size-5 mr-2"
            tintColor={colors.text.primary}
          />
        </TouchableOpacity>

        <View
          className="mb-2"
          style={{
            borderRadius: 17,
            backgroundColor: colors.background.primary,
          }}>
          <View className="flex flex-row items-center justify-between px-3 pt-3 pb-3">
            <View className="flex flex-row items-center justify-end">
              <Text
                className="font-rubik ml-2 text-center mr-5"
                style={{
                  fontSize: 18,
                  color: colors.text.primary,
                }}>
                KVKK Metni
              </Text>
              {kvkkConsent && kvkkConsent.status === 'ACKNOWLEDGED' ? (
                <Text className="text-green-500 font-rubik text-lg">
                  Okundu
                </Text>
              ) : (
                <Text className="text-danger font-rubik text-lg">Okunmadı</Text>
              )}
            </View>
            <TouchableOpacity
              className="p-3 rounded-2xl mr-1"
              style={{backgroundColor: colors.background.secondary}}>
              <Text
                className="font-rubik text-center px-1"
                style={{
                  fontSize: 14,
                  color: colors.text.primary,
                }}>
                Değiştir
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          className="mb-2"
          style={{
            borderRadius: 17,
            backgroundColor: colors.background.primary,
          }}>
          <View className="flex flex-row items-center justify-between px-3 pt-3 pb-3">
            <View className="flex flex-row items-center justify-end">
              <Text
                className="font-rubik ml-2 text-center mr-5"
                style={{
                  fontSize: 18,
                  color: colors.text.primary,
                }}>
                Sağlık{'\n'}Sözleşmesi
              </Text>
              {kvkkConsent && kvkkConsent.status === 'ACKNOWLEDGED' ? (
                <Text className="text-green-500 font-rubik text-lg">
                  Onaylandı
                </Text>
              ) : (
                <Text className="text-danger font-rubik text-lg">
                  Onaylanmadı
                </Text>
              )}
            </View>
            <TouchableOpacity
              className="p-3 rounded-2xl mr-1"
              style={{backgroundColor: colors.background.secondary}}>
              <Text
                className="font-rubik text-center px-1"
                style={{
                  fontSize: 14,
                  color: colors.text.primary,
                }}>
                Değiştir
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* <View
          style={{
            borderRadius: 17,
            backgroundColor: colors.background.primary,
          }}>
          <View className="flex flex-col items-between justify-center px-3 pt-3 pb-3">
            <Text
              className="font-rubik ml-2 mb-2"
              style={{
                fontSize: 18,
                color: colors.text.primary,
              }}>
              Onaylar
            </Text>
            <View className="flex flex-row items-center justify-center">
              <Text
                className="text-lg font-rubik"
                style={{color: colors.text.primary}}>
                {JSON.stringify(kvkkConsent, null, 2)}
              </Text>
            </View>
            <View className="flex flex-row items-center justify-center">
              <Text
                className="text-lg font-rubik"
                style={{color: colors.text.primary}}>
                {JSON.stringify(healthConsent, null, 2)}
              </Text>
            </View>
          </View>
        </View> */}
      </ScrollView>
    </View>
  );
};

export default Permissions;
