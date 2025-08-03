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
} from '../../../api/exercise/progressService';
import CustomWeeklyProgressCalendar from '../../../components/CustomWeeklyProgressCalendar';
import {
  getExerciseById,
  getTodayExerciseByPosition,
} from '../../../api/exercise/exerciseService';

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

export enum ExercisePosition {
  STANDING,
  SEATED,
}

const ExercisesUser = () => {
  const {colors, theme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const scrollViewHeight = SCREEN_HEIGHT / 8;

  const [todaysExerciseProgress, setTodaysExerciseProgress] =
    useState<ExerciseProgressDTO | null>();
  const [weeklyExerciseProgress, setWeeklyEersiseProgress] = useState<
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
    const todaysExerciseProgress: ExerciseProgressDTO =
      await getTodaysProgress();
    setTodaysExerciseProgress(todaysExerciseProgress);

    const weeklyExerciseProgress: ExerciseProgressDTO[] =
      await getWeeklyActiveDaysProgress();
    setWeeklyEersiseProgress(weeklyExerciseProgress);
  };

  useFocusEffect(
    useCallback(() => {
      fetchProgress();
    }, []),
  );

  const onStartExercise = async (position: ExercisePosition) => {
    const todayExercise = await getTodayExerciseByPosition(position);
    if (todayExercise) {
      navigation.navigate('ExerciseDetail', {
        exercise: todayExercise,
        progressRatio: 0,
      });
      setShowModal(false);
    }
  };

  const onContinueExercise = async () => {
    if (
      todaysExerciseProgress?.progressRatio &&
      todaysExerciseProgress?.progressRatio > 0 &&
      todaysExerciseProgress?.exerciseDTO
    ) {
      navigation.navigate('ExerciseDetail', {
        exercise: todaysExerciseProgress?.exerciseDTO,
        progressRatio: todaysExerciseProgress.progressRatio,
      });
      setShowModal(false);
    }
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
          className="px-5 py-3 mb-3"
          style={{
            borderRadius: 17,
            backgroundColor: colors.background.primary,
          }}>
          {new Date().getDay() === 1 ||
          new Date().getDay() === 3 ||
          new Date().getDay() === 5 ||
          new Date().getDay() === 6 ? (
            <>
              <>
                <Text
                  className="font-rubik text-2xl mb-1"
                  style={{color: colors.text.primary}}>
                  Bugünün Egzersizi
                </Text>

                <View className="flex flex-row justify-between items-center mt-4 mb-2">
                  {!(
                    todaysExerciseProgress &&
                    todaysExerciseProgress.progressRatio
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
                      <Image source={icons.gymnastic_1} className="size-20" />
                    </TouchableOpacity>
                  ) : todaysExerciseProgress?.progressRatio === 100 ? (
                    <TouchableOpacity
                      className="flex flex-row justify-center items-center ml-1 py-3 pl-3"
                      style={{
                        borderRadius: 17,
                        backgroundColor: '#3BC476',
                      }}
                      onPress={onContinueExercise}>
                      <Text className="text-xl font-rubik">
                        Tamamlandı{'\n'}Egzersizi gör
                      </Text>
                      <Image source={icons.gymnastic_1} className="size-20" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      className="flex flex-row justify-center items-center ml-1 py-3 pl-3"
                      style={{
                        backgroundColor: '#FFAA33',
                      }}
                      onPress={onContinueExercise}>
                      <Text className="text-xl font-rubik">
                        Egzersize devam et
                      </Text>
                      <Image source={icons.gymnastic_1} className="size-20" />
                    </TouchableOpacity>
                  )}

                  {todaysExerciseProgress?.progressRatio &&
                    todaysExerciseProgress.progressRatio > 0 && (
                      <View className="flex justify-center items-center mr-5">
                        <AnimatedCircularProgress
                          size={100}
                          width={8}
                          fill={
                            todaysExerciseProgress?.progressRatio &&
                            todaysExerciseProgress.progressRatio
                          }
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
                              %
                              {todaysExerciseProgress?.progressRatio &&
                                todaysExerciseProgress.progressRatio}
                            </Text>
                          )}
                        </AnimatedCircularProgress>
                      </View>
                    )}
                </View>
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
              className="font-rubik mb-2 mt-1 ml-2"
              style={{fontSize: 19, color: colors.text.primary}}>
              Egzersiz Takvimi
            </Text>
            <Text
              className="font-rubik mb-3 mt-1 ml-2"
              style={{fontSize: 17, color: colors.text.primary}}>
              {new Date().toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <CustomWeeklyProgressCalendar progress={weeklyExerciseProgress} />
        </View>
      </View>

      <Modal
        transparent
        visible={showModal}
        animationType="fade"
        onRequestClose={() => {}}>
        <View
          className="flex-1 justify-center items-center"
          style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <View
            className="w-11/12 max-w-lg p-4 items-center"
            style={{
              borderRadius: 17,
              backgroundColor: colors.background.primary,
              shadowColor: theme.name === 'Light' ? 'black' : '#707070',
              shadowOpacity: 2,
              shadowRadius: 10,
              elevation: 3,
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
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.primary[150],
                }}
                onPress={() => onStartExercise(ExercisePosition.STANDING)}>
                <Text
                  className="font-rubik-semibold text-2xl text-center"
                  style={{color: colors.primary[200]}}>
                  Ayakta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 mt-2 ml-2 border"
                style={{
                  borderRadius: 17,
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.primary[150],
                }}
                onPress={() => onStartExercise(ExercisePosition.SEATED)}>
                <Text
                  className="font-rubik-semibold text-2xl text-center"
                  style={{color: colors.primary[200]}}>
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
      </Modal>
    </>
  );
};

export default ExercisesUser;
