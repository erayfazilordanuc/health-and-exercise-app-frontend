import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ToastAndroid,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../../themes/ThemeProvider';
import icons from '../../constants/icons';
import {getProgressByUserId} from '../../api/exercise/progressService';

type ProgressRouteProp = RouteProp<GroupsStackParamList, 'Progress'>;
const Progress = () => {
  const insets = useSafeAreaInsets();
  const {params} = useRoute<ProgressRouteProp>();
  const {member} = params;
  const {colors} = useTheme();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<GroupsScreenNavigationProp>();

  const [progress, setProgress] = useState<AchievementDTO[]>([]);

  const fetchProgress = async () => {
    const progress: AchievementDTO[] = await getProgressByUserId(member.id!);

    if (progress) setProgress(progress);
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  return (
    <>
      <View
        style={{
          backgroundColor: colors.background.secondary,
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: insets.top * 1.3,
        }}>
        <Text
          className="pl-7 font-rubik-semibold"
          style={{
            color: colors.text.primary,
            fontSize: 24,
          }}>
          Egzersiz İlerlemesi
        </Text>
      </View>
      <View
        className="h-full pb-32 px-3 mt-3"
        style={{
          backgroundColor: colors.background.secondary,
        }}>
        <View
          className="px-4 pb-3 rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
          <Text className="pl-2 font-rubik text-2xl pt-3">
            Tamamlanan Egzersizler
          </Text>
          {progress.map((a, index) => (
            <View
              key={index}
              className="px-2 py-3 rounded-2xl mt-3"
              style={{backgroundColor: colors.background.secondary}}>
              <Text className="pl-2 font-rubik text-xl">
                {a.exerciseDTO.name}
              </Text>
            </View>
          ))}
        </View>
        <View
          className="px-4 pb-3 rounded-2xl mt-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text className="pl-2 font-rubik text-2xl pt-3">
            Devam Eden Egzersiz İlerlemeleri
          </Text>
          {progress.map((a, index) => (
            <View
              key={index}
              className="px-2 py-3 rounded-2xl mt-3"
              style={{backgroundColor: colors.background.secondary}}>
              <Text className="pl-2 font-rubik text-xl">{a.id}</Text>
            </View>
          ))}
        </View>

        <View
          className="px-4 pb-3 rounded-2xl mt-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text className="pl-2 font-rubik text-2xl pt-3">
            Günlük Egzersiz İlerlemeleri
          </Text>
          {progress.map((a, index) => (
            <View
              key={index}
              className="px-2 py-3 rounded-2xl mt-3"
              style={{backgroundColor: colors.background.secondary}}>
              <Text className="pl-2 font-rubik text-xl">{a.id}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
};

export default Progress;
