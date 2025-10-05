import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../themes/ThemeProvider';
import NotificationSetting from 'react-native-open-notification';
import icons from '../../../constants/icons';
import {
  approveConsent,
  getLatestConsent,
  getLatestPolicy,
  giveConsent,
  withdrawConsent,
} from '../../../api/consent/consentService';
import {
  ConsentPolicyPurpose,
  ConsentPurpose,
  ConsentStatus,
} from '../../../types/enums';
import ConsentCard from '../../../components/ConsentCard';
import {CustomModal} from '../../../components/CustomModal';
import {useUser} from '../../../contexts/UserContext';
import {ConsentModal} from '../../../components/ConsentModal';
import NetInfo from '@react-native-community/netinfo';
import LinearGradient from 'react-native-linear-gradient';
import {Icon} from 'react-native-elements';
import {useTranslation} from 'react-i18next';

const Permissions = () => {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation('settings');
  const {colors, theme} = useTheme();
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const {user} = useUser();

  const [kvkkPolicy, setKvkkPolicy] = useState<ConsentPolicyDTO | null>(null);
  const [healthPolicy, setHealthPolicy] = useState<ConsentPolicyDTO | null>(
    null,
  );
  const [exercisePolicy, setExercisePolicy] = useState<ConsentPolicyDTO | null>(
    null,
  );
  const [studyPolicy, setStudyPolicy] = useState<ConsentPolicyDTO | null>(null);

  const [kvkkConsent, setKvkkConsent] = useState<ConsentDTO | null>(null);
  const [healthConsent, setHealthConsent] = useState<ConsentDTO | null>(null);
  const [exerciseConsent, setExerciseConsent] = useState<ConsentDTO | null>(
    null,
  );
  const [studyConsent, setStudyConsent] = useState<ConsentDTO | null>(null);

  const [kvkkModalVisible, setKvkkModalVisible] = useState(false);
  const [healthModalVisible, setHealthModalVisible] = useState(false);
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [studyModalVisible, setStudyModalVisible] = useState(false);

  const approve = async (consentId: number) => {
    const data = await approveConsent(consentId);
    if (data) {
      return data as ConsentDTO;
    }
    return null;
  };

  const withdraw = async (consentId: number) => {
    const data = await withdrawConsent(consentId);
    if (data) {
      return data as ConsentDTO;
    }
    return null;
  };

  const fetchConsentPolicies = async () => {
    const kvkk = await getLatestPolicy(ConsentPolicyPurpose['KVKK_NOTICE']);
    setKvkkPolicy(kvkk);
    const health = await getLatestPolicy(
      ConsentPolicyPurpose['HEALTH_DATA_PROCESSING'],
    );
    setHealthPolicy(health);
    const exercise = await getLatestPolicy(
      ConsentPolicyPurpose['EXERCISE_DATA_PROCESSING'],
    );
    setExercisePolicy(exercise);
    const study = await getLatestPolicy(ConsentPolicyPurpose['STUDY_CONSENT']);
    setStudyPolicy(study);
  };

  useEffect(() => {
    fetchConsentPolicies();
  }, []);

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const kvkkConsent = await getLatestConsent(
        ConsentPurpose['KVKK_NOTICE_ACK'],
      );
      setKvkkConsent(kvkkConsent);
      const healthConsent = await getLatestConsent(
        ConsentPurpose['HEALTH_DATA_PROCESSING_ACK'],
      );
      setHealthConsent(healthConsent);
      const exerciseConsent = await getLatestConsent(
        ConsentPurpose['EXERCISE_DATA_PROCESSING_ACK'],
      );
      setExerciseConsent(exerciseConsent);
      const studyConsent = await getLatestConsent(
        ConsentPurpose['STUDY_CONSENT_ACK'],
      );
      setStudyConsent(studyConsent);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOnline) fetchConsents();
  }, [isOnline]);

  useEffect(() => {
    // ağ durumunu izle
    const unsub = NetInfo.addEventListener(state => {
      const connected =
        !!state.isConnected && state.isInternetReachable !== false;
      setIsOnline(connected);
    });
    return () => unsub();
  }, []);

  return (
    <View
      className={`flex-1 pb-32 px-3 pt-3`}
      style={{backgroundColor: colors.background.secondary}}>
      <ScrollView>
        <TouchableOpacity
          className="flex flex-row items-center justify-between px-3 py-4 rounded-2xl mb-2"
          style={{backgroundColor: colors.background.primary}}
          onPress={async () => {
            try {
              if (Platform.OS === 'ios') {
                const url = 'app-settings:';
                const can = await Linking.canOpenURL(url);
                if (can) return Linking.openURL(url);
                return Linking.openSettings(); // fallback
              } else {
                return Linking.openSettings();
              }
            } catch (e) {
              Alert.alert(t('alerts.cantOpenSettigns'));
            }
          }}>
          <Text
            className="ml-2 font-rubik"
            style={{
              fontSize: 18,
              color: colors.text.primary,
            }}>
            {t('permissions.goToAppSettings')}
          </Text>
          <Image
            source={icons.rightArrow}
            className="size-5 mr-2"
            tintColor={colors.text.primary}
          />
        </TouchableOpacity>
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
            {t('permissions.goToNotificationSettings')}
          </Text>
          <Image
            source={icons.rightArrow}
            className="size-5 mr-2"
            tintColor={colors.text.primary}
          />
        </TouchableOpacity>
        {user && user.role === 'ROLE_USER' && (
          <View
            className="mt-1 px-3 pt-3 pb-1"
            style={{
              borderRadius: 17,
              backgroundColor: colors.background.primary,
            }}>
            <Text
              className="ml-2 font-rubik mb-2"
              style={{
                fontSize: 18,
                color: colors.text.primary,
              }}>
              {t('permissions.consentsTitle')}
            </Text>

            {isOnline ? (
              <>
                <ConsentCard
                  title={t('permissions.kvkkTitle')}
                  type="kvkk"
                  status={kvkkConsent?.status}
                  loading={loading}
                  onPress={() => {
                    setKvkkModalVisible(!kvkkModalVisible);
                  }}
                />

                <ConsentCard
                  title={t('permissions.healthTitle')}
                  type="health"
                  status={healthConsent?.status}
                  loading={loading}
                  onPress={() => {
                    setHealthModalVisible(!healthModalVisible);
                  }}
                />

                <ConsentCard
                  title={t('permissions.exerciseTitle')}
                  type="exercise"
                  status={exerciseConsent?.status}
                  loading={loading}
                  onPress={() => {
                    setExerciseModalVisible(!exerciseModalVisible);
                  }}
                />

                <ConsentCard
                  title={t('permissions.studyTitle')}
                  type="study"
                  status={studyConsent?.status}
                  loading={loading}
                  onPress={() => {
                    setStudyModalVisible(!studyModalVisible);
                  }}
                />
              </>
            ) : (
              <View
                className="items-center px-5 pb-3 rounded-2xl"
                style={{backgroundColor: colors.background.primary}}>
                <LinearGradient
                  colors={['rgba(0,145,255,0.16)', 'rgba(64,224,208,0.16)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 42, // boyut KORUNDU
                    alignItems: 'center',
                    justifyContent: 'center',
                    // hafif glow (iOS shadow) + Android elevation
                    shadowColor: '#0091FF',
                    shadowOpacity: 0.18,
                    shadowRadius: 6,
                    shadowOffset: {width: 0, height: 2},
                    elevation: 2,
                  }}>
                  {/* ultra-ince dış ring */}
                  <View
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 40,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.06)',
                    }}
                  />

                  {/* İç rozet (35x35 KORUNDU) */}
                  <View
                    style={{
                      width: 35,
                      height: 35,
                      borderRadius: 28, // boyut KORUNDU
                      backgroundColor: colors.background.secondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(0,145,255,0.28)',
                    }}>
                    {/* İKON: PNG/SVG (mevcut sistemine uygun) */}
                    <Image
                      source={icons.offline} // wifi-off / cloud-off tarzı bir ikon önerilir
                      style={{
                        width: 18,
                        height: 18,
                        tintColor: colors.text.primary,
                      }}
                      resizeMode="contain"
                    />
                    {/* Vector icon tercih edersen:
              <Feather name="wifi-off" size={18} color={colors.text.primary} />
          */}
                  </View>

                  {/* Üst parlama (gloss) */}
                  <LinearGradient
                    colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']}
                    start={{x: 0.2, y: 0}}
                    end={{x: 0.8, y: 1}}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 25,
                      borderTopLeftRadius: 42,
                      borderTopRightRadius: 42,
                    }}
                    pointerEvents="none"
                  />
                </LinearGradient>
                <Text
                  className="font-rubik-medium mt-2 text-center"
                  style={{color: colors.text.primary, fontSize: 18}}>
                  {t('offline.consentsLoadFailed')}
                </Text>
                <Text
                  className="font-rubik mt-2 text-center"
                  style={{color: colors.text.primary, opacity: 0.7}}>
                  {t('offline.noInternet')}
                </Text>
              </View>
            )}
          </View>
        )}
        <ConsentModal
          visible={kvkkModalVisible}
          requireScrollToEnd
          approveHint={t('permissions.approveHint')}
          onApprove={async () => {
            if (kvkkConsent?.status !== 'ACKNOWLEDGED') {
              const response = await approve(kvkkConsent?.id!);
              if (response) setKvkkConsent(response);
            }
            setKvkkModalVisible(false);
          }}
          onDecline={async () => {
            if (kvkkConsent?.status === 'ACKNOWLEDGED') {
              const response = await withdraw(kvkkConsent?.id!);
              if (response) setKvkkConsent(response);
            }
            setKvkkModalVisible(false);
          }}
          onApproveText={t('permissions.approve')}
          onDeclineText={t('permissions.decline')}
          body={
            <Text
              className="font-rubik text-md"
              style={{color: colors.text.primary}}>
              {kvkkPolicy?.content}
            </Text>
          }
        />

        <ConsentModal
          visible={healthModalVisible}
          requireScrollToEnd
          approveHint={t('permissions.approveHint')}
          onApprove={async () => {
            if (healthConsent?.status !== 'ACCEPTED') {
              const response = await approve(healthConsent?.id!);
              if (response) setHealthConsent(response);
            }
            setHealthModalVisible(false);
          }}
          onDecline={async () => {
            if (healthConsent?.status === 'ACCEPTED') {
              const response = await withdraw(healthConsent?.id!);
              if (response) setHealthConsent(response);
            }
            setHealthModalVisible(false);
          }}
          onApproveText={t('permissions.approve')}
          onDeclineText={t('permissions.decline')}
          body={
            <Text
              className="font-rubik text-md"
              style={{color: colors.text.primary}}>
              {healthPolicy?.content}
            </Text>
          }
        />

        <ConsentModal
          visible={exerciseModalVisible}
          requireScrollToEnd
          approveHint={t('permissions.approveHint')}
          onApprove={async () => {
            if (exerciseConsent?.status !== 'ACCEPTED') {
              const response = await approve(exerciseConsent?.id!);
              if (response) setExerciseConsent(response);
            }
            setExerciseModalVisible(false);
          }}
          onDecline={async () => {
            if (exerciseConsent?.status === 'ACCEPTED') {
              const response = await withdraw(exerciseConsent?.id!);
              if (response) setExerciseConsent(response);
            }
            setExerciseModalVisible(false);
          }}
          onApproveText={t('permissions.approve')}
          onDeclineText={t('permissions.decline')}
          body={
            <Text
              className="font-rubik text-md"
              style={{color: colors.text.primary}}>
              {exercisePolicy?.content}
            </Text>
          }
        />

        <ConsentModal
          visible={studyModalVisible}
          requireScrollToEnd
          approveHint={t('permissions.approveHint')}
          onApprove={async () => {
            if (studyConsent?.status !== 'ACCEPTED') {
              const response = await approve(studyConsent?.id!);
              if (response) setStudyConsent(response);
            }
            setStudyModalVisible(false);
          }}
          onDecline={async () => {
            if (studyConsent?.status === 'ACCEPTED') {
              const response = await withdraw(studyConsent?.id!);
              if (response) setStudyConsent(response);
            }
            setStudyModalVisible(false);
          }}
          onApproveText={t('permissions.approve')}
          onDeclineText={t('permissions.decline')}
          body={
            <Text
              className="font-rubik text-md"
              style={{color: colors.text.primary}}>
              {studyPolicy?.content}
            </Text>
          }
        />
      </ScrollView>
    </View>
  );
};

export default Permissions;
