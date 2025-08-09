import {
  View,
  Text,
  TextInput,
  Image,
  BackHandler,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  ToastAndroid,
  ActivityIndicator,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../themes/ThemeProvider';
import icons from '../../../constants/icons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {Calendar, WeekCalendar} from 'react-native-calendars';
import dayjs from 'dayjs';
import {
  getTodaysProgress,
  getWeeklyActiveDaysProgress,
  progressExercise,
} from '../../../api/exercise/progressService';
import CustomWeeklyProgressCalendar from '../../../components/CustomWeeklyProgressCalendar';
import {
  getExerciseById,
  getTodayExerciseByPosition,
} from '../../../api/exercise/exerciseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useUser} from '../../../contexts/UserContext';
import {jsonGetAll} from '@react-native-firebase/app';

const {height, width} = Dimensions.get('window');

export enum ExercisePosition {
  STANDING,
  SEATED,
}

const ExercisesUser = () => {
  const {colors, theme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const scrollViewHeight = height / 8;
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const {user} = useUser();

  const [todayExerciseProgress, setTodayExerciseProgress] =
    useState<ExerciseProgressDTO | null>(null);
  const [weeklyExerciseProgress, setWeeklyExersiseProgress] = useState<
    ExerciseProgressDTO[]
  >([]);

  const [showModal, setShowModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        navigation.navigate('Home');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove(); // Ekrandan çıkınca event listener'ı kaldır
    }, []),
  );

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const todayExerciseProgress: ExerciseProgressDTO =
        await getTodaysProgress();

      const localTodayExerciseProgressJson = await AsyncStorage.getItem(
        `exerciseProgress_${new Date().toISOString().slice(0, 10)}`,
      );

      console.log('today', todayExerciseProgress);
      console.log('local', localTodayExerciseProgressJson);

      let localTodayExerciseProgress: ExerciseProgressDTO | null = null;
      if (localTodayExerciseProgressJson)
        localTodayExerciseProgress = JSON.parse(localTodayExerciseProgressJson);

      if (
        (!todayExerciseProgress && localTodayExerciseProgress) ||
        (localTodayExerciseProgress &&
          localTodayExerciseProgress.totalProgressDuration >
            todayExerciseProgress.totalProgressDuration)
      ) {
        setTodayExerciseProgress(localTodayExerciseProgress);

        for (const videoProgress of localTodayExerciseProgress.videoProgress) {
          await progressExercise(
            localTodayExerciseProgress.exerciseDTO.id!,
            videoProgress.videoId,
            videoProgress.progressDuration,
          );
        }
      } else if (todayExerciseProgress) {
        await AsyncStorage.setItem(
          `exerciseProgress_${new Date().toISOString().slice(0, 10)}`,
          JSON.stringify(todayExerciseProgress),
        );

        setTodayExerciseProgress(todayExerciseProgress);
      }

      const weeklyExerciseProgress: ExerciseProgressDTO[] =
        await getWeeklyActiveDaysProgress();
      setWeeklyExersiseProgress(weeklyExerciseProgress);
    } catch (error) {
      console.log(error);
      ToastAndroid.show('Bir hata oluştu', ToastAndroid.SHORT);
    } finally {
      setLoading(false);
      if (!initialized) setInitialized(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProgress();
    }, []),
  );

  const onStartExercise = async (position: ExercisePosition) => {
    const todayExercise: ExerciseDTO = await getTodayExerciseByPosition(
      position,
    );
    let todayExerciseProgressNavPayload: ExerciseProgressDTO = {
      userId: user!.id!,
      exerciseDTO: todayExercise,
      videoProgress: [],
      totalProgressDuration: 0,
    };

    if (todayExercise) {
      navigation.navigate('ExerciseDetail', {
        progress: todayExerciseProgressNavPayload,
        totalDurationSec: todayExercise.videos.reduce(
          (sum, v) => sum + (v.durationSeconds ?? 0),
          0,
        ),
      });
      setShowModal(false);
    }
  };

  const onContinueExercise = async () => {
    if (
      todayExerciseProgress?.totalProgressDuration &&
      todayExerciseProgress?.totalProgressDuration > 0 &&
      todayExerciseProgress?.exerciseDTO
    ) {
      navigation.navigate('ExerciseDetail', {
        progress: todayExerciseProgress,
        totalDurationSec: todayExerciseProgress.exerciseDTO.videos.reduce(
          (sum, v) => sum + (v.durationSeconds ?? 0),
          0,
        ),
      });
      setShowModal(false);
    }
  };

  const calcPercent = (p?: ExerciseProgressDTO | null): number => {
    if (!p) return 0;
    const total = p.exerciseDTO.videos.reduce(
      (sum, v) => sum + (v.durationSeconds ?? 0),
      0,
    );
    return total === 0
      ? 0
      : Math.round((p.totalProgressDuration / total) * 100);
  };

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
          Egzersizler
        </Text>
      </View>
      <View
        className="h-full pb-32 px-3 mt-3"
        style={{
          backgroundColor: colors.background.secondary,
        }}>
        <View
          className="px-5 pt-3 pb-2 mb-3"
          style={{
            borderRadius: 17,
            backgroundColor: colors.background.primary,
          }}>
          {new Date().getDay() === 1 ||
          new Date().getDay() === 3 ||
          new Date().getDay() === 5 ? (
            <>
              <>
                <Text
                  className="font-rubik"
                  style={{fontSize: 17, color: colors.text.primary}}>
                  Bugünün Egzersizi
                </Text>

                {initialized ? (
                  <View className="flex flex-row justify-between items-center mt-3 mb-2">
                    {!(
                      todayExerciseProgress &&
                      todayExerciseProgress.totalProgressDuration
                    ) ? (
                      <TouchableOpacity
                        className="flex flex-row justify-center items-center ml-1 py-3 pl-3"
                        style={{
                          borderRadius: 17,
                          backgroundColor: colors.primary[175],
                        }}
                        onPress={() => {
                          setShowModal(true);
                        }}>
                        <Text className="text-xl font-rubik">
                          Egzersize başla
                        </Text>
                        <Image source={icons.gymnastic_1} className="size-16" />
                      </TouchableOpacity>
                    ) : todayExerciseProgress.totalProgressDuration ===
                      todayExerciseProgress.exerciseDTO.videos.reduce(
                        (sum, v) => sum + (v.durationSeconds ?? 0),
                        0,
                      ) ? (
                      <TouchableOpacity
                        className="flex flex-row justify-center items-center ml-1 py-3 pl-3"
                        style={{
                          borderRadius: 17,
                          backgroundColor: '#3BC476',
                        }}
                        onPress={onContinueExercise}>
                        <Text className="text-xl font-rubik">
                          Tamamlandı!{'\n'}Egzersizi gör
                        </Text>
                        <Image source={icons.gymnastic_1} className="size-16" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        className="flex flex-row justify-center items-center ml-1 py-3 pl-3 px-1"
                        style={{
                          borderRadius: 17,
                          backgroundColor: '#FFAA33',
                        }}
                        onPress={onContinueExercise}>
                        <Text className="text-xl font-rubik mx-2">
                          Egzersize{'\n'}devam et
                        </Text>
                        <Image source={icons.gymnastic_1} className="size-16" />
                      </TouchableOpacity>
                    )}
                    {todayExerciseProgress &&
                      todayExerciseProgress.totalProgressDuration &&
                      todayExerciseProgress.totalProgressDuration > 0 && (
                        <View className="flex justify-center items-center mr-5">
                          <AnimatedCircularProgress
                            size={100}
                            width={8}
                            rotation={0}
                            fill={calcPercent(todayExerciseProgress) ?? 0}
                            tintColor={colors.primary[300]}
                            onAnimationComplete={() =>
                              console.log('onAnimationComplete')
                            }
                            backgroundColor={colors.background.secondary}>
                            {() => (
                              <Text
                                className="text-2xl font-rubik"
                                style={{
                                  color: colors.text.primary,
                                }}>
                                %{calcPercent(todayExerciseProgress) ?? 0}
                              </Text>
                            )}
                          </AnimatedCircularProgress>
                        </View>
                      )}
                  </View>
                ) : (
                  <View className="flex flex-row justify-center items-center pt-10 pb-12">
                    <ActivityIndicator
                      size="small"
                      color={colors.primary[300]}
                    />
                  </View>
                )}
              </>
            </>
          ) : (
            <>
              <Text
                className="font-rubik text-center"
                style={{fontSize: 18, color: colors.text.primary}}>
                Bugün için planlanan egzersiziniz yok.
              </Text>
              <Text
                className="font-rubik mt-1 text-center"
                style={{fontSize: 18, color: colors.text.primary}}>
                İyi dinlenmeler!
              </Text>
            </>
          )}
        </View>

        <View
          className="flex flex-col px-3 py-3 mb-3"
          style={{
            borderRadius: 17,
            backgroundColor: colors.background.primary,
          }}>
          <View className="flex flex-row items-center justify-between">
            <Text
              className="font-rubik mb-2 ml-2"
              style={{fontSize: 19, color: colors.text.primary}}>
              Egzersiz Takvimi
            </Text>
            <Text
              className="font-rubik mb-3 mr-1 rounded-2xl py-2 px-3"
              style={{
                fontSize: 15,
                color: colors.text.primary,
                backgroundColor: colors.background.secondary,
              }}>
              {new Date().toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          {weeklyExerciseProgress && (
            <CustomWeeklyProgressCalendar
              todayProgressPercent={calcPercent(todayExerciseProgress)}
              weeklyProgressPercents={weeklyExerciseProgress.map(calcPercent)}
            />
          )}
        </View>
      </View>

      {showModal && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20, // ✅ kenarlarda margin
          }}>
          <View
            style={{
              maxWidth: (width * 9) / 10, // ✅ tabletlerde taşmayı önler
              borderRadius: 17,
              backgroundColor: colors.background.primary,
              padding: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              className="font-rubik-semibold text-2xl mb-4 text-center"
              style={{color: colors.text.primary}}>
              Egzersiz Türü Seçimi
            </Text>
            <Text
              className="font-rubik text-lg mb-3 text-center"
              style={{color: colors.text.secondary}}>
              Bugünkü egzersizinizi ayakta mı yoksa oturarak mı yapmak
              istediğinizi seçiniz.
            </Text>
            <View className="flex flex-row justify-between items-center">
              <TouchableOpacity
                className="flex-1 py-3 mt-2 mr-1 border"
                style={{
                  borderRadius: 17,
                  backgroundColor: colors.primary[175],
                  borderColor: colors.primary[150],
                }}
                onPress={() => onStartExercise(ExercisePosition.STANDING)}>
                <Text
                  className="font-rubik-semibold text-2xl text-center"
                  style={{color: colors.background.primary}}>
                  Ayakta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 mt-2 ml-2 border"
                style={{
                  borderRadius: 17,
                  backgroundColor: colors.primary[175],
                  borderColor: colors.primary[150],
                }}
                onPress={() => onStartExercise(ExercisePosition.SEATED)}>
                <Text
                  className="font-rubik-semibold text-2xl text-center"
                  style={{color: colors.background.primary}}>
                  Oturarak
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              className="py-2 px-4 mt-6 border"
              style={{
                borderRadius: 17,
                backgroundColor: colors.background.secondary,
                borderColor: colors.primary[125],
              }}
              onPress={() => setShowModal(false)}>
              <Text
                className="font-rubik text-md text-center"
                style={{color: colors.text.secondary}}>
                Geri Dön
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
};

export default ExercisesUser;
