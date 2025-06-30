import {
  View,
  Text,
  ScrollView,
  Dimensions,
  Image,
  BackHandler,
  ToastAndroid,
  TouchableOpacity,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../src/themes/ThemeProvider';
import icons from '../../../src/constants/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import {getUser} from '../../api/user/userService';
import GradientText from '../../components/GradientText';

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

const Home = () => {
  const navigation = useNavigation<RootScreenNavigationProp>();
  const exercisesNavigation = useNavigation<ExercisesScreenNavigationProp>();
  let exitCount = 0; // TO DO sayaç lazım
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const healthProgressPercent = 93;
  const exercizeProgressPercent = 59;

  const scrollViewHeight = SCREEN_HEIGHT / 8;

  useEffect(() => {
    const fetchUser = async () => {
      const user: User = await getUser();
      setUser(user);
      if (user.role === 'ROLE_ADMIN') setIsAdmin(true);
    };

    fetchUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (exitCount > 0) {
          exitCount = 0;
          BackHandler.exitApp();
        } else {
          ToastAndroid.show('Çıkmak için tekrar ediniz', ToastAndroid.SHORT);
          exitCount++;
        }
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, []),
  );

  const navigateToMindGames = async (routeName: string) => {
    exercisesNavigation.navigate('Exercises', {
      screen: 'MindGames',
      params: {screen: routeName},
    });
  };

  return (
    <>
      <View
        className="pt-14"
        style={{
          backgroundColor: colors.background.secondary,
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
        <Text
          className="pl-7 font-rubik-semibold"
          style={{
            color: colors.text.primary,
            fontSize: 24,
          }}>
          Ana Ekran
        </Text>
      </View>
      <View
        className="px-3 pt-3"
        style={{
          flex: 1,
          backgroundColor: colors.background.secondary,
        }}>
        <ScrollView
          style={
            {
              // paddingTop: insets.top / 2,
            }
          }
          showsVerticalScrollIndicator={false}>
          <View
            className="flex flex-row justify-between px-3 py-3 rounded-2xl mb-2"
            style={{backgroundColor: colors.background.primary}}>
            {/* <Text
              className="pl-2 text-2xl font-rubik-medium"
              style={{
                color: colors.primary[300],
              }}>
              {user?.username}
            </Text> */}
            <GradientText
              className="pl-2 text-2xl font-rubik-medium text-center mb-1"
              start={{x: 0, y: 0}}
              end={{x: 0.7, y: 0}}
              colors={[colors.primary[300], '#40E0D0']}>
              {user?.fullName}
            </GradientText>
            {!isAdmin ? (
              <View className="flex flex-row">
                <Image
                  source={icons.badge1_colorful_bordered}
                  className="size-8 mr-2"
                />
                <Image source={icons.badge1_colorful} className="size-8 mr-2" />
                <Image
                  source={icons.badge1}
                  tintColor={colors.text.primary} // Eğer renkli değilse tintColor verilsin
                  className="size-8"
                />
              </View>
            ) : (
              <View className="flex flex-row">
                <Image
                  source={icons.nurse}
                  className="size-9 mr-2"
                  tintColor={colors.text.primary}
                />
              </View>
            )}
          </View>
          {user && user.role === 'ROLE_USER' && (
            <>
              <View className="flex flex-row justify-between my-1">
                <View
                  className="flex flex-col px-3 py-3 rounded-3xl mb-2"
                  style={{
                    backgroundColor: colors.background.primary,
                    width: SCREEN_WIDTH / 2 - 16,
                  }}>
                  <Text
                    className="pl-2 text-2xl font-rubik"
                    style={{
                      color: colors.text.primary,
                    }}>
                    Sağlık
                  </Text>
                  <View className="mt-4 mb-2 flex justify-center items-center">
                    <AnimatedCircularProgress
                      size={100}
                      width={8}
                      fill={healthProgressPercent}
                      tintColor={'#3EDA87'}
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
                          %{healthProgressPercent}
                        </Text>
                      )}
                    </AnimatedCircularProgress>
                  </View>
                </View>
                <View
                  className="flex flex-col px-3 py-3 rounded-3xl mb-2"
                  style={{
                    backgroundColor: colors.background.primary,
                    width: SCREEN_WIDTH / 2 - 16,
                  }}>
                  <Text
                    className="pl-2 text-xl font-rubik"
                    style={{
                      color: colors.text.primary,
                    }}>
                    Günlük Egzersiz
                  </Text>
                  <View className="mt-4 mb-2 flex justify-center items-center">
                    <AnimatedCircularProgress
                      size={100}
                      width={8}
                      fill={exercizeProgressPercent}
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
                          %{exercizeProgressPercent}
                        </Text>
                      )}
                    </AnimatedCircularProgress>
                  </View>
                </View>
              </View>
              <View
                className="px-5 py-3 rounded-2xl mb-3"
                style={{backgroundColor: colors.background.primary}}>
                <Text
                  className="font-rubik text-2xl mb-4"
                  style={{color: colors.text.primary}}>
                  Günlük Egzersizler
                </Text>
                <ScrollView
                  horizontal
                  style={{height: scrollViewHeight}}
                  showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
                    style={{backgroundColor: '#48AAFF'}}
                    // onPress={() => navigateToPhysicalExercises('Exercise2')}
                  >
                    <Image source={icons.back} className="size-20" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
                    style={{backgroundColor: '#55CC88'}}
                    onPress={() => {}}>
                    <Image source={icons.stretching} className="size-20" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
                    style={{backgroundColor: '#FFAA33'}}>
                    <Image source={icons.gymnastic_1} className="size-20" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
                    style={{backgroundColor: '#48AAFF'}}
                    onPress={() =>
                      exercisesNavigation.navigate('Exercises', {
                        screen: 'Exercise1',
                      })
                    }>
                    <Image source={icons.chronometer} className="size-20" />
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </>
          )}
          {user && user.role === 'ROLE_USER' && (
            <View
              className="flex flex-column justify-start rounded-2xl pl-5 p-4 mb-3" // border
              style={{
                backgroundColor: colors.background.primary,
                borderColor: colors.primary[300],
              }}>
              <Text
                className="font-rubik text-2xl"
                style={{color: colors.text.primary}}>
                Duyurular
              </Text>
              <Text
                className="font-rubik text-lg mt-3"
                style={{color: colors.text.primary}}>
                Sağlıklı günler!
              </Text>
            </View>
          )}

          {user && user.role === 'ROLE_ADMIN' && (
            <View
              className="flex flex-column justify-start rounded-2xl pl-5 p-3 mt-1"
              style={{
                backgroundColor: colors.background.primary,
              }}>
              <View className="flex flex-row justify-between">
                <Text
                  className="font-rubik text-2xl"
                  style={{color: colors.text.primary}}>
                  Öncelikli Geri Bildirimler
                </Text>
              </View>
              <Text
                className="font-rubik text-lg mt-3"
                style={{color: colors.text.primary}}>
                Bir hastadan gelen öncelikli geri bildirim
              </Text>
            </View>
          )}

          {/* EĞER GROUP ID VARSA BURADA DUYURULAR FALAN ÇIKSIN */}
          {/* <View
            className="px-5 py-3 rounded-2xl"
            style={{backgroundColor: colors.background.primary}}>
            <Text className="font-rubik text-2xl mb-4" style={{color: colors.text.primary}}>
              Zeka Oyunları
            </Text>
            <ScrollView
              horizontal
              style={{height: scrollViewHeight}}
              showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
                style={{backgroundColor: '#FF8B8B'}}
                onPress={() => navigateToMindGames('WordGame')}>
                <Image source={icons.wordle} className="size-20" />
              </TouchableOpacity>

              <TouchableOpacity
                className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
                style={{backgroundColor: '#FF8B8B'}}
                // onPress={() => navigateToMindGames('MindGame2')}
              >
                <Image source={icons.brickwall} className="size-20" />
              </TouchableOpacity>

              <TouchableOpacity
                className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
                style={{backgroundColor: '#FF8B8B'}}>
                <Image source={icons.piano} className="size-20" />
              </TouchableOpacity>

              <TouchableOpacity
                className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
                style={{backgroundColor: '#FF8B8B'}}>
                <Image source={icons.xox} className="size-20" />
              </TouchableOpacity>

              <TouchableOpacity
                className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
                style={{backgroundColor: '#FF8B8B'}}>
                <Image source={icons.board_game} className="size-20" />
              </TouchableOpacity>

              <TouchableOpacity
                className="justify-center items-center rounded-2xl mr-3 w-28 h-28"
                style={{backgroundColor: '#FF8B8B'}}>
                <Image source={icons.brain} className="size-20" />
              </TouchableOpacity>
            </ScrollView>
          </View> */}
        </ScrollView>
      </View>
    </>
  );
};

export default Home;
