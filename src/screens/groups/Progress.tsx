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
import {
  getTodaysProgressByUserId,
  getWeeklyActiveDaysProgress,
  getWeeklyActiveDaysProgressByUserId,
} from '../../api/exercise/progressService';
import CustomWeeklyProgressCalendar from '../../components/CustomWeeklyProgressCalendar';
import {AnimatedCircularProgress} from 'react-native-circular-progress';

type ProgressRouteProp = RouteProp<GroupsStackParamList, 'Progress'>;
const Progress = () => {
  const insets = useSafeAreaInsets();
  const {params} = useRoute<ProgressRouteProp>();
  const {member} = params;
  const {colors, theme} = useTheme();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<GroupsScreenNavigationProp>();

  const [todaysExerciseProgress, setTodaysExerciseProgress] =
    useState<ExerciseProgressDTO | null>();
  const [weeklyExerciseProgress, setWeeklyEersiseProgress] = useState<
    ExerciseProgressDTO[]
  >([]);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      if (!member) return;
      const todaysExerciseProgress: ExerciseProgressDTO =
        await getTodaysProgressByUserId(member.id!);
      if (todaysExerciseProgress)
        setTodaysExerciseProgress(todaysExerciseProgress);
      const weeklyExerciseProgress: ExerciseProgressDTO[] =
        await getWeeklyActiveDaysProgressByUserId(member.id!);
      setWeeklyEersiseProgress(weeklyExerciseProgress);
    } catch (error) {
    } finally {
      setLoading(false);
    }
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
            color:
              theme.name === 'Light'
                ? colors.text.primary
                : colors.background.secondary,
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
                  className="font-rubik mb-1"
                  style={{fontSize: 17, color: colors.text.primary}}>
                  Bugünün Egzersizi
                </Text>

                {!loading && (
                  <View className="flex flex-row justify-between items-center mt-3 mb-2">
                    {!todaysExerciseProgress?.totalProgressDuration ? (
                      <TouchableOpacity
                        className="flex flex-row justify-center items-center ml-1 py-3 pl-3"
                        style={{
                          borderRadius: 17,
                          backgroundColor: colors.primary[175],
                        }}>
                        <Text className="text-xl font-rubik">
                          Egzersize başla
                        </Text>
                        <Image source={icons.gymnastic_1} className="size-16" />
                      </TouchableOpacity>
                    ) : todaysExerciseProgress?.totalProgressDuration ===
                      100 ? (
                      <TouchableOpacity
                        className="flex flex-row justify-center items-center ml-1 py-3 pl-3"
                        style={{
                          borderRadius: 17,
                          backgroundColor: '#3BC476',
                        }}>
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
                        }}>
                        <Text className="text-xl font-rubik mx-2">
                          Egzersize{'\n'}devam et
                        </Text>
                        <Image source={icons.gymnastic_1} className="size-16" />
                      </TouchableOpacity>
                    )}
                    {todaysExerciseProgress?.totalProgressDuration &&
                      todaysExerciseProgress.totalProgressDuration > 0 && (
                        <View className="flex justify-center items-center mr-5">
                          <AnimatedCircularProgress
                            size={100}
                            width={8}
                            rotation={0}
                            lineCap="round"
                            fill={
                              todaysExerciseProgress?.totalProgressDuration &&
                              todaysExerciseProgress.totalProgressDuration
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
                                {todaysExerciseProgress?.totalProgressDuration ??
                                  0}
                              </Text>
                            )}
                          </AnimatedCircularProgress>
                        </View>
                      )}
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
                fontSize: 17,
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
          {/* <CustomWeeklyProgressCalendar
            weeklyProgress={weeklyExerciseProgress}
          /> */}
        </View>
      </View>
    </>
  );
};

export default Progress;
