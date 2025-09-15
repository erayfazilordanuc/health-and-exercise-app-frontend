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
import LinearGradient from 'react-native-linear-gradient';

type ExerciseProgressRouteProp = RouteProp<
  GroupsStackParamList,
  'ExerciseProgress'
>;
const ExerciseProgress = () => {
  const insets = useSafeAreaInsets();
  const {params} = useRoute<ExerciseProgressRouteProp>();
  const {member, weeklyProgress} = params;
  const {colors, theme} = useTheme();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<GroupsScreenNavigationProp>();

  return (
    <View style={{paddingTop: insets.top * 1.3}} className="flex-1 px-3">
      <LinearGradient
              colors={colors.gradient}
              locations={[0.15, 0.25, 0.7, 1]}
              start={{x: 0.1, y: 0}}
              end={{x: 0.8, y: 1}}
              className="absolute top-0 left-0 right-0 bottom-0"
            />

      <View
        className="pb-3"
        style={{
          backgroundColor: 'transparent', // colors.background.secondary,
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
        <Text
          className="pl-4 font-rubik-semibold pr-7"
          style={{
            color: theme.colors.isLight ? '#333333' : colors.background.primary,
            fontSize: 24,
          }}>
          Egzersiz Detayları
        </Text>
      </View>

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
                  {!weeklyProgress?.[0]?.totalProgressDuration ? (
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
                  ) : weeklyProgress?.[0]?.totalProgressDuration === 100 ? (
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
                  {weeklyProgress?.[0]?.totalProgressDuration &&
                    weeklyProgress?.[0].totalProgressDuration > 0 && (
                      <View className="flex justify-center items-center mr-5">
                        <AnimatedCircularProgress
                          size={100}
                          width={8}
                          rotation={0}
                          lineCap="round"
                          fill={
                            weeklyProgress?.[0]?.totalProgressDuration &&
                            weeklyProgress?.[0].totalProgressDuration
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
                              %{weeklyProgress?.[0]?.totalProgressDuration ?? 0}
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
              style={{fontSize: 16, color: colors.text.primary}}>
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
            style={{fontSize: 18, color: colors.text.primary}}>
            Egzersiz Takvimi
          </Text>
          <Text
            className="font-rubik mb-3 rounded-xl"
            style={{
              paddingVertical: 5,
              paddingHorizontal: 9,
              fontSize: 14,
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
  );
};

export default ExerciseProgress;
