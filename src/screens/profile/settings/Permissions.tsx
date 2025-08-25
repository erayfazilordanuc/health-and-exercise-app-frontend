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

const Permissions = () => {
  const insets = useSafeAreaInsets();
  const {colors, theme} = useTheme();
  const [loading, setLoading] = useState(true);

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

  const upsertConsert = async () => {
    const newKvkkConsent: UpsertConsentDTO = {
      purpose: ConsentPurpose['KVKK_NOTICE_ACK'],
      status: kvkkConsent?.status,
      policyId: kvkkPolicy?.id!,
      locale: 'tr-TR',
      source: 'MOBILE',
    };
    const kvkkResponse = await giveConsent(newKvkkConsent);

    const newHealthConsent: UpsertConsentDTO = {
      purpose: ConsentPurpose['HEALTH_DATA_PROCESSING_ACK'],
      status: healthConsent?.status,
      policyId: healthPolicy?.id!,
      locale: 'tr-TR',
      source: 'MOBILE',
    };
    const healthDataResponse = await giveConsent(newHealthConsent);

    const newExerciseConsent: UpsertConsentDTO = {
      purpose: ConsentPurpose['EXERCISE_DATA_PROCESSING_ACK'],
      status: exerciseConsent?.status,
      policyId: exercisePolicy?.id!,
      locale: 'tr-TR',
      source: 'MOBILE',
    };
    const exerciseDataResponse = await giveConsent(newExerciseConsent);

    const newStudyConsent: UpsertConsentDTO = {
      purpose: ConsentPurpose['STUDY_CONSENT_ACK'],
      status: studyConsent?.status,
      policyId: studyPolicy?.id!,
      locale: 'tr-TR',
      source: 'MOBILE',
    };
    const studyResponse = await giveConsent(newStudyConsent);
  };

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
    fetchConsents();
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
              Alert.alert('Ayarlar açılamadı');
            }
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
            Bildirim İzinlerine Git
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
              Onaylar
            </Text>
            <ConsentCard
              title={'KVKK Metni'}
              type="kvkk"
              status={kvkkConsent?.status}
              loading={loading}
              onPress={() => {
                setKvkkModalVisible(!kvkkModalVisible);
              }}
            />

            <ConsentCard
              title={'Sağlık Verisi Kullanım Rızası'}
              type="health"
              status={healthConsent?.status}
              loading={loading}
              onPress={() => {
                setHealthModalVisible(!healthModalVisible);
              }}
            />

            <ConsentCard
              title={'Egzersiz Verisi Kullanım Rızası'}
              type="exercise"
              status={exerciseConsent?.status}
              loading={loading}
              onPress={() => {
                setExerciseModalVisible(!exerciseModalVisible);
              }}
            />

            <ConsentCard
              title={'Aydınlatılmış Onam Formu'}
              type="study"
              status={studyConsent?.status}
              loading={loading}
              onPress={() => {
                setStudyModalVisible(!studyModalVisible);
              }}
            />
          </View>
        )}
        <ConsentModal
          visible={kvkkModalVisible}
          requireScrollToEnd
          approveHint="Onaylamak için lütfen tüm metni okuyup sonuna kadar kaydırın."
          onApprove={async () => {
            if (kvkkConsent?.status !== 'ACKNOWLEDGED') {
              const response = await approve(kvkkConsent?.id!);
              if (response) setKvkkConsent(response);
            }
            setKvkkModalVisible(false);
          }}
          onReject={async () => {
            if (kvkkConsent?.status === 'ACKNOWLEDGED') {
              const response = await withdraw(kvkkConsent?.id!);
              if (response) setKvkkConsent(response);
            }
            setKvkkModalVisible(false);
          }}
          onApproveText="Onaylıyorum"
          onRejectText="Onaylamıyorum"
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
          approveHint="Onaylamak için lütfen tüm metni okuyup sonuna kadar kaydırın."
          onApprove={async () => {
            if (healthConsent?.status !== 'ACCEPTED') {
              const response = await approve(healthConsent?.id!);
              if (response) setHealthConsent(response);
            }
            setHealthModalVisible(false);
          }}
          onReject={async () => {
            if (healthConsent?.status === 'ACCEPTED') {
              const response = await withdraw(healthConsent?.id!);
              if (response) setHealthConsent(response);
            }
            setHealthModalVisible(false);
          }}
          onApproveText="Onaylıyorum"
          onRejectText="Onaylamıyorum"
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
          approveHint="Onaylamak için lütfen tüm metni okuyup sonuna kadar kaydırın."
          onApprove={async () => {
            if (exerciseConsent?.status !== 'ACCEPTED') {
              const response = await approve(exerciseConsent?.id!);
              if (response) setExerciseConsent(response);
            }
            setExerciseModalVisible(false);
          }}
          onReject={async () => {
            if (exerciseConsent?.status === 'ACCEPTED') {
              const response = await withdraw(exerciseConsent?.id!);
              if (response) setExerciseConsent(response);
            }
            setExerciseModalVisible(false);
          }}
          onApproveText="Onaylıyorum"
          onRejectText="Onaylamıyorum"
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
          approveHint="Onaylamak için lütfen tüm metni okuyup sonuna kadar kaydırın."
          onApprove={async () => {
            if (studyConsent?.status !== 'ACCEPTED') {
              const response = await approve(studyConsent?.id!);
              if (response) setStudyConsent(response);
            }
            setStudyModalVisible(false);
          }}
          onReject={async () => {
            if (studyConsent?.status === 'ACCEPTED') {
              const response = await withdraw(studyConsent?.id!);
              if (response) setStudyConsent(response);
            }
            setStudyModalVisible(false);
          }}
          onApproveText="Onaylıyorum"
          onRejectText="Onaylamıyorum"
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
