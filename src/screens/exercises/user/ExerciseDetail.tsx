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
import images from '../../../constants/images';

type ExerciseRouteProp = RouteProp<ExercisesStackParamList, 'ExerciseDetail'>;

/** ---------------------------
 *  DUMMY PREVIEW SWITCH (ONLY UI DATA)
 *  Tasarıma dokunmadan sadece ekranda görünen isim & thumbnail için.
 *  true => Dummy isim & görseller
 *  false => Gerçek veriler
 * -------------------------- */
const DUMMY_MODE = true;
// Örnek isimler (gerekirse sayıyı arttır)
const DUMMY_NAMES = [
  'Warming',
  'Aerobic',
  'Lower Body Strength',
  'Upper Body Mobility',
  'Cool Down & Stretch',
];
// Örnek görseller (telifsiz placeholder’lar veya kendi CDN’in)
const DUMMY_THUMBS = [images.warming, images.aerobic];

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
    // Local file
    if (src.startsWith('file://')) return true;
    // Remote URL
    const pattern = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
    if (!pattern.test(src)) return false;
    const validExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
    const lower = src.toLowerCase();
    return validExtensions.some(ext => lower.includes(ext));
  };

  useEffect(() => {
    if (DUMMY_MODE) return; // dummy açıkken gerçek thumbnail üretimini atla

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
          // 1) Check local cache
          const localUri = await getCachedLocalUri(String(v.id ?? v.videoUrl));
          const net = await NetInfo.fetch();
          const isOnline = !!net.isConnected;

          const candidate = localUri ?? (isOnline ? v.videoUrl : null);

          if (!candidate || !isValidSource(candidate)) {
            console.warn(`[thumb] Source not found: ${v.videoUrl}`);
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
            `[thumb] Thumbnail could not be created: ${v.videoUrl}`,
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
          Exercise Detail
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
            Total Progress
          </Text>
          <Text className="text-xl font-rubik-medium" style={{color: color}}>
            {`%${todayPercent}`}
          </Text>
          {calcPercent(progress) === 100 && (
            <Text className="text-xl font-rubik-medium" style={{color: color}}>
              Exercise Completed
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
            Videos
          </Text>
          {progress.exerciseDTO?.videos &&
            progress.exerciseDTO.videos.length > 0 &&
            progress.exerciseDTO.videos.map((video, index) => {
              // --- DUMMY seçimleri (sadece görüntü / isim) ---
              const displayName = DUMMY_MODE
                ? DUMMY_NAMES[index] ?? `Exercise Video ${index + 1}`
                : video.name?.trim();

              const dummyThumb = DUMMY_MODE
                ? DUMMY_THUMBS[index % DUMMY_THUMBS.length]
                : undefined;

              const displayThumbUri = DUMMY_MODE
                ? dummyThumb
                : thumbs[video.videoUrl]
                ? thumbs[video.videoUrl]
                : undefined;

              return (
                <View
                  key={index}
                  className="w-full rounded-2xl p-3 mb-3"
                  style={{backgroundColor: colors.background.secondary}}>
                  {!isDone ? (
                    <View className="pt-1 flex flex-row items-center justify-center">
                      <Image
                        source={
                          displayThumbUri ? displayThumbUri : undefined // fallback
                        }
                        style={{
                          width: '85%',
                          aspectRatio: 16 / 9,
                          borderRadius: 10,
                          resizeMode: 'cover',
                          backgroundColor: '#000',
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
                        displayThumbUri
                          ? {uri: displayThumbUri}
                          : icons.exercise_screen
                      }
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
                      {'Video name: ' +
                        (displayName ?? '').toString() +
                        '\nDuration: ' +
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
                            Completed
                          </Text>
                          <Image
                            source={icons.check}
                            className="size-5 mb-1"
                            tintColor={'#3BC476'}
                          />
                        </View>
                      ) : (
                        progress.videoProgress[index] && (
                          <View className="flex flex-coljustify-between items-center">
                            <Text
                              className="font-rubik text-center text-lg"
                              style={{color: getColor()}}>
                              Progress %
                              {Math.round(
                                (progress.videoProgress[index]
                                  .progressDuration /
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
                                className=" font-rubik text-xl px-3"
                                style={{
                                  borderRadius: 14,
                                  paddingVertical: 10,
                                  backgroundColor: color,
                                  color: colors.background.primary,
                                }}>
                                Continue
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )
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
                            className=" font-rubik text-xl px-3"
                            style={{
                              borderRadius: 14,
                              paddingVertical: 10,
                              backgroundColor: color,
                              color: colors.background.primary,
                            }}>
                            Start
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>
              );
            })}
        </View>
      </ScrollView>
    </>
  );
};

export default ExerciseDetail;
