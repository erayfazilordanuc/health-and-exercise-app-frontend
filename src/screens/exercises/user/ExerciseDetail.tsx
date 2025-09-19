import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  ScrollView,
  InteractionManager,
  ToastAndroid,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Video from 'react-native-video';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../themes/ThemeProvider';
import icons from '../../../constants/icons';
import VideoPlayer from 'react-native-video-player';
import {createThumbnail} from 'react-native-create-thumbnail';
import CustomAlert from '../../../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useUser} from '../../../contexts/UserContext';
import Orientation from 'react-native-orientation-locker';
import {calcPercent} from '../../../api/exercise/exerciseService';
import {Theme} from '../../../themes/themes';
import NetInfo from '@react-native-community/netinfo';
import {
  checkHealthConnectInstalled,
  checkSamsungHInstalled,
  getSymptoms,
  initializeHealthConnect,
} from '../../../lib/health/healthConnectService';
import {atLocalMidnight, isTodayLocal} from '../../../utils/dates';
import {
  useSaveSymptomsToday,
  useSymptomsByDate,
} from '../../../hooks/symptomsQueries';
import {getCachedLocalUri} from '../../../utils/videoCache';

type ExerciseRouteProp = RouteProp<ExercisesStackParamList, 'ExerciseDetail'>;
const ExerciseDetail = () => {
  const insets = useSafeAreaInsets();
  const {colors, theme} = useTheme();
  const {height, width} = Dimensions.get('window');
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const {params} = useRoute<ExerciseRouteProp>();
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const {user} = useUser();
  const {progress, totalDurationSec, fromMain} = params;
  console.log('ahadadada', progress);
  const todayPercent = calcPercent(progress);

  const [startAt, setStartAt] = useState(0);
  const [videoIdxToShow, setVideoIdxToShow] = useState(0);

  useEffect(() => {}, []);

  const calculateNavPayloads = () => {
    setLoading(true);
    console.log('progress', progress);
    for (let i = 0; i < progress.exerciseDTO.videos.length; i++) {
      const vp = progress.videoProgress[i];
      if (!vp || !vp.isCompeleted) {
        setVideoIdxToShow(i);
        setStartAt(vp && vp.progressDuration ? vp.progressDuration : 0);
        break;
      }
    }
    setLoading(false);
  };

  const getColor = () =>
    calcPercent(progress) === 100
      ? '#3BC476'
      : progress.totalProgressDuration === 0
      ? colors.primary[200]
      : '#FFAA33';
  const [color, setColor] = useState(getColor());

  const isDone = calcPercent(progress) === 100;

  useEffect(() => {
    calculateNavPayloads();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (fromMain) navigation.goBack();
        else navigation.navigate('ExercisesUser');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, []),
  );

  const isValidSource = (src?: string): boolean => {
    if (!src) return false;
    // Lokal dosya
    if (src.startsWith('file://')) return true;
    // Uzak URL
    const pattern = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
    if (!pattern.test(src)) return false;
    const validExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
    const lower = src.toLowerCase();
    return validExtensions.some(ext => lower.includes(ext));
  };

  useEffect(() => {
    let isActive = true;

    const loadSequentialExerciseVideosThumbs = async () => {
      if (!progress.exerciseDTO.videos.length) return;

      await new Promise<void>(res =>
        InteractionManager.runAfterInteractions(() => res()),
      );

      for (const v of progress.exerciseDTO.videos) {
        if (!isActive) break;
        if (thumbs[v.videoUrl]) continue;

        try {
          // 1) Lokal cache var mı?
          const localUri = await getCachedLocalUri(String(v.id ?? v.videoUrl));
          const net = await NetInfo.fetch();
          const isOnline = !!net.isConnected;

          const candidate = localUri ?? (isOnline ? v.videoUrl : null);

          if (!candidate || !isValidSource(candidate)) {
            console.warn(`[thumb] Kaynak bulunamadı: ${v.videoUrl}`);
            setThumbs(prev => ({
              ...prev,
              [v.videoUrl]: 'fallback_thumbnail_path',
            }));
            continue;
          }

          const {path} = await createThumbnail({
            url: candidate,
            timeStamp: 1000,
            format: 'jpeg',
            maxWidth: 512,
          });

          if (!isActive) break;
          setThumbs(prev => ({...prev, [v.videoUrl]: path}));
        } catch (err) {
          console.warn(
            `[thumb] Thumbnail oluşturulamadı: ${v.videoUrl}`,
            (err as Error).message,
          );
          setThumbs(prev => ({
            ...prev,
            [v.videoUrl]: 'fallback_thumbnail_path',
          }));
        }
      }
    };

    loadSequentialExerciseVideosThumbs();

    return () => {
      isActive = false;
    };
  }, [progress.exerciseDTO, progress.exerciseDTO.videos, thumbs]);

  useEffect(() => {
    setColor(getColor());
  }, [progress.totalProgressDuration]);

  const ToMinuteSeconds = (duration: number) => {
    const seconds = duration % 60;
    const minutes = Math.floor(duration / 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    return () => {
      Orientation.lockToPortrait();
      StatusBar.setHidden(false, 'fade');
    };
  }, []);

  // const makeTabBarStyle = (theme: Theme, width: number) => ({
  //   // marginHorizontal: width / 24,
  //   // position: 'absolute',
  //   // bottom: 15,
  //   // left: 15,
  //   // right: 15,
  //   // height: 56,
  //   // borderRadius: 40,
  //   // borderWidth: 1,
  //   // borderTopWidth: 0.9,
  //   // borderColor:
  //   //   theme.colors.isLight ? 'rgba(0,0,0,0.09)' : 'rgba(150,150,150,0.09)',
  //   // backgroundColor:
  //   //   theme.colors.isLight ? 'rgba(255,255,255,0.95)' : 'rgba(25,25,25,0.95)',
  //   // elevation: 0,
  //   // display: 'flex',
  //   minHeight: 56 + Math.max(insets.bottom, 0),
  //   height: undefined,
  //   paddingTop: 6,
  //   paddingBottom: Math.max(insets.bottom, 8),

  //   // mevcut görünümü koru
  //   marginHorizontal: width / 24,
  //   position: 'absolute',
  //   bottom: 15,
  //   left: 15,
  //   right: 15,
  //   borderRadius: 40,
  //   borderWidth: 1,
  //   borderTopWidth: 0.9,
  //   borderColor:
  //     theme.colors.isLight ? 'rgba(0,0,0,0.09)' : 'rgba(150,150,150,0.09)',
  //   backgroundColor:
  //     theme.colors.isLight ? 'rgba(255,255,255,0.95)' : 'rgba(25,25,25,0.95)',
  //   elevation: 0,
  // });

  // useLayoutEffect(() => {
  //   const parentNav = navigation.getParent();
  //   return () =>
  //     parentNav?.setOptions({
  //       tabBarStyle: makeTabBarStyle(theme, width),
  //     });
  // }, [navigation]);

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
          Egzersiz Detayı
        </Text>
      </View>

      <ScrollView
        className="h-full px-3 mt-3"
        style={{
          backgroundColor: colors.background.secondary,
        }}>
        <View
          className="mb-3 px-5 pt-3 pb-5 rounded-2xl flex flex-col items-center justify-center"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="text-xl font-rubik-medium mb-2"
            style={{color: colors.text.primary}}>
            Toplam İlerleme
          </Text>
          <Text className="text-xl font-rubik-medium" style={{color: color}}>
            {`%${todayPercent}`}
          </Text>
          {calcPercent(progress) === 100 && (
            <Text className="text-xl font-rubik-medium" style={{color: color}}>
              Egzersiz Tamamlandı
            </Text>
          )}
          <View
            className="w-full h-1 rounded-full overflow-hidden mt-3"
            style={{backgroundColor: colors.background.secondary}}>
            <View
              className="h-1 rounded-full"
              style={{
                width: `${todayPercent}%`,
                backgroundColor: color,
              }}
            />
          </View>
        </View>

        <View
          className="px-5 pt-3 rounded-2xl mb-24"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="text-center text-2xl font-rubik mb-2"
            style={{color: colors.text.primary}}>
            Videolar
          </Text>
          {progress.exerciseDTO?.videos &&
            progress.exerciseDTO.videos.length > 0 &&
            progress.exerciseDTO.videos.map((video, index) => (
              <View
                key={index}
                className="w-full rounded-2xl p-3 mb-3"
                style={{backgroundColor: colors.background.secondary}}>
                {!isDone ? (
                  <View className="pt-1 flex flex-row items-center justify-center">
                    <Image
                      source={
                        thumbs[video.videoUrl]
                          ? {uri: thumbs[video.videoUrl]}
                          : undefined // fallback
                      }
                      style={{
                        width: '85%',
                        aspectRatio: 16 / 9,
                        borderRadius: 10,
                        resizeMode: 'cover',
                        backgroundColor: '#000', // thumb yüklenirken boşluk siyah kalsın
                      }}
                    />
                  </View>
                ) : (
                  <VideoPlayer
                    source={{uri: video.videoUrl}}
                    autoplay={false}
                    style={{
                      width: '100%',
                      aspectRatio: 16 / 9,
                      backgroundColor: 'white',
                    }}
                    thumbnail={
                      thumbs[video.videoUrl]
                        ? {uri: thumbs[video.videoUrl]}
                        : icons.exercise_screen
                    }
                    // paused={isDone}
                    // disableSeek={isDone}
                    // hideControlsOnStart={isDone}
                    // onPlayPress={() => {
                    //   if (isDone) {
                    //     ToastAndroid.show(
                    //       'Önce "Başla / Devam et" butonuna basmalısın 🚀',
                    //       ToastAndroid.SHORT,
                    //     );
                    //     return;
                    //   }
                    // }}
                    customStyles={{
                      videoWrapper: {borderRadius: 10},
                      controlButton: {opacity: 0.9},
                      thumbnail: {
                        borderRadius: 15,
                        width: 110,
                        height: 110,
                        alignSelf: 'center',
                        justifyContent: 'center',
                      },
                      thumbnailImage: {
                        width: '100%',
                        height: '100%',
                        resizeMode: 'center',
                        borderRadius: 15,
                      },
                    }}
                  />
                )}

                <View className="flex flex-col justify-between items-center px-5 mt-3">
                  <Text
                    className="font-rubik text-center text-lg"
                    style={{color: colors.text.primary}}>
                    {'Video ismi: ' +
                      video.name.trim() +
                      '\nSüre: ' +
                      ToMinuteSeconds(video.durationSeconds)}
                  </Text>
                  {progress.videoProgress.length > 0 ? (
                    progress.videoProgress.some(
                      item => video.id === item.videoId && item.isCompeleted,
                    ) ? (
                      <View className="flex flex-row items-center justify-center">
                        <Text
                          className="font-rubik text-lg mr-2"
                          style={{color: '#3BC476'}}>
                          Tamamlandı
                        </Text>
                        <Image
                          source={icons.check}
                          className="size-5 mb-1"
                          tintColor={'#3BC476'}
                        />
                      </View>
                    ) : (
                      // TO DO TEST progress.videoProgress[index] &&
                      <View className="flex flex-coljustify-between items-center">
                        <Text
                          className="font-rubik text-center text-lg"
                          style={{color: getColor()}}>
                          İlerleme %
                          {Math.round(
                            (progress.videoProgress[index].progressDuration /
                              video.durationSeconds) *
                              100,
                          )}
                        </Text>
                        <TouchableOpacity
                          className="mt-3 mb-1"
                          onPress={() =>
                            navigation.navigate('Exercise', {
                              exercise: progress.exerciseDTO,
                              progress: progress,
                              videoIdx: videoIdxToShow,
                              startSec: startAt,
                            })
                          }>
                          <Text
                            className=" font-rubik text-xl px-3" // bg-blue-500 '#55CC88' '#FFAA33'
                            style={{
                              borderRadius: 14,
                              paddingVertical: 10,
                              backgroundColor: color,
                              color: colors.background.primary,
                            }}>
                            Devam et
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )
                  ) : (
                    index === 0 && (
                      <TouchableOpacity
                        className="mt-3 mb-1"
                        onPress={() =>
                          navigation.navigate('Exercise', {
                            exercise: progress.exerciseDTO,
                            progress: progress,
                            videoIdx: videoIdxToShow,
                            startSec: startAt,
                          })
                        }>
                        <Text
                          className=" font-rubik text-xl px-3" // bg-blue-500 '#55CC88' '#FFAA33'
                          style={{
                            borderRadius: 14,
                            paddingVertical: 10,
                            backgroundColor: color,
                            color: colors.background.primary,
                          }}>
                          Başla
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                  {/*Tamamlandı yazabilir */}
                  {/* Eğer progress ratio şuana kadar olan video indexlerindeki videoların uzunluğunun toplamı 
                  video uzunluğuna olan oranından büyük ise video tamamlandı anlamına gelen tik iconu konsun */}
                </View>
              </View>
            ))}
        </View>
      </ScrollView>

      {/* {!isDone && (
        <View className="absolute bottom-20 right-3 items-center">
          <TouchableOpacity
            className="flex flex-row justify-center items-center mt-3"
            onPress={() =>
              navigation.navigate('Exercise', {
                exercise: progress.exerciseDTO,
                progress: progress,
                videoIdx: videoIdxToShow,
                startSec: startAt,
              })
            }>
            <Text
              className=" font-rubik text-2xl p-4 rounded-3xl" // bg-blue-500 '#55CC88' '#FFAA33'
              style={{
                backgroundColor: color,
                color: colors.background.primary,
              }}>
              {progress.totalProgressDuration &&
              progress.totalProgressDuration < totalDurationSec &&
              progress.totalProgressDuration > 0
                ? 'Devam et'
                : 'Başla'}
            </Text>
          </TouchableOpacity>
        </View>
      )} */}
    </>
  );
};

export default ExerciseDetail;
