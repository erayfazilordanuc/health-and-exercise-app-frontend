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

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

const ExercisesUser = () => {
  const {colors} = useTheme();
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

  // böyle pair değil de daha basit ["done", "not-yet", "not-yet"] gibi bir dizi gelecek
  const exerciseStatusByDate: Record<string, 'done' | 'missed'> = {
    '2025-07-21': 'done',
    '2025-07-22': 'missed',
    // …
  };

  const getMarked = () => {
    const marks: {[key: string]: any} = {};
    Object.entries(exerciseStatusByDate).forEach(([date, status]) => {
      marks[date] = {
        selected: true,
        disableTouchEvent: true,
        selectedColor: status === 'done' ? '#55CC88' : '#FFCCCC80', // %80 opacity
      };
    });
    return marks;
  };

  const onOpenExercise = async () => {
    setShowModal(true);
    // ayakta ya da oturarak olmasına göre o tür exercise id ile progress oluştursun
    // Egzersiz ayakta mı oturarak mı olacak sorulsun ona göre exercise id bulunsun
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
          className="px-5 py-3 rounded-2xl mb-3"
          style={{backgroundColor: colors.background.primary}}>
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
                  <TouchableOpacity
                    disabled={
                      todaysExerciseProgress?.progressRatio !== null &&
                      todaysExerciseProgress?.progressRatio === 100
                    }
                    className="flex flex-row justify-center items-center rounded-2xl ml-1 py-3 pl-3"
                    style={{
                      backgroundColor:
                        todaysExerciseProgress?.progressRatio &&
                        todaysExerciseProgress.progressRatio === 100
                          ? '#55CC88'
                          : todaysExerciseProgress?.progressRatio &&
                            todaysExerciseProgress.progressRatio > 0
                          ? '#FFAA33'
                          : colors.primary[175],
                    }}
                    onPress={() => onOpenExercise()}>
                    <Text className="text-xl font-rubik">
                      {todaysExerciseProgress?.progressRatio &&
                      todaysExerciseProgress.progressRatio === 100
                        ? 'Tamamlandı'
                        : todaysExerciseProgress?.progressRatio &&
                          todaysExerciseProgress.progressRatio > 0
                        ? 'Devam Et'
                        : 'Başla'}
                    </Text>
                    <Image source={icons.gymnastic_1} className="size-20" />
                  </TouchableOpacity>
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
            <Text
              className="font-rubik text-xl mb-1"
              style={{color: colors.text.primary}}>
              Bugün için planlanan egzersiziniz yok. İyi dinlenmeler!
            </Text>
          )}
        </View>

        <View
          className="px-3 py-3 rounded-2xl mb-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="font-rubik text-2xl mb-3 mt-1 ml-2"
            style={{color: colors.text.primary}}>
            Egzersiz Takvimi
          </Text>
          <CustomWeeklyProgressCalendar progress={weeklyExerciseProgress} />
          {/*<View className="mt-5">
            <WeekCalendar
              firstDay={1} // Pazartesi ile başlat
              current={dayjs().format('YYYY-MM-DD')} // Bu hafta
              markedDates={getMarked()}
              hideDayNames={false}
              allowShadow
              theme={{
                calendarBackground: colors.background.primary,
                monthTextColor: colors.text.primary,
                dayTextColor: colors.text.primary,
                todayTextColor: colors.primary[200],
                arrowColor: colors.primary[300],
              }}
              style={{borderRadius: 20, elevation: 2}}
            />
          </View>*/}
        </View>
      </View>

      <Modal
        transparent
        visible={showModal}
        animationType="fade"
        onRequestClose={() => {}}>
        <View className="flex-1 justify-center items-center">
          <View
            className="w-11/12 max-w-lg rounded-3xl p-6 items-center"
            style={{
              backgroundColor: colors.background.primary,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 10,
            }}>
            <Text
              className="font-rubik-semibold text-2xl mb-4 text-center"
              style={{color: colors.primary[200]}}>
              Egzersiz Türü Seçimi
            </Text>
            <Text
              className="font-rubik-semibold text-2xl mb-4 text-center"
              style={{color: colors.primary[200]}}>
              Egzersizinizi ayakta mı yapmak istersiniz yoksa oturarak mı?
            </Text>
            <Text
              className="font-rubik-semibold text-2xl mb-4 text-center"
              style={{color: colors.primary[200]}}>
              Ayakta
            </Text>
            <Text
              className="font-rubik-semibold text-2xl mb-4 text-center"
              style={{color: colors.primary[200]}}>
              Oturarak
            </Text>
            <TouchableOpacity
              className="py-2 px-4 rounded-2xl"
              style={{backgroundColor: colors.background.secondary}}
              onPress={() => setShowModal(false)}>
              <Text className="font-rubik text-xl text-center">Geri Dön</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ExercisesUser;
