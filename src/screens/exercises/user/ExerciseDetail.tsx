import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  ScrollView,
  InteractionManager,
  ToastAndroid,
  Image,
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

type ExerciseRouteProp = RouteProp<ExercisesStackParamList, 'ExerciseDetail'>;
const ExerciseDetail = () => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const {params} = useRoute<ExerciseRouteProp>();
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const {user} = useUser();
  const {progress, totalDurationSec} = params;

  const [startAt, setStartAt] = useState(0);
  const [videoIdxToShow, setVideoIdxToShow] = useState(0);

  const calculateNavPayloads = () => {
    setLoading(true);
    for (const [i, vp] of progress.videoProgress.entries()) {
      if (!vp.isCompeleted && vp.id) {
        setVideoIdxToShow(i);
        console.log('duraation', vp.progressDuration);
        setStartAt(vp.progressDuration);
        break;
      }
    }
    setLoading(false);
  };

  const calcPercent = (): number => {
    const total = progress.exerciseDTO.videos.reduce(
      (sum, v) => sum + (v.durationSeconds ?? 0),
      0,
    );
    return total === 0
      ? 0
      : Math.round((progress.totalProgressDuration / total) * 100);
  };

  const getColor = () =>
    progress.totalProgressDuration === totalDurationSec
      ? '#3BC476'
      : progress.totalProgressDuration === 0
      ? colors.primary[200]
      : '#FFAA33';
  const [color, setColor] = useState(getColor());

  const isDone = progress.totalProgressDuration === totalDurationSec;

  useEffect(() => {
    calculateNavPayloads();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        navigation.navigate('ExercisesUser');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, []),
  );

  const isValidUrl = (url?: string): boolean => {
    if (!url) return false;

    const pattern = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
    if (!pattern.test(url)) return false;

    const validExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const lower = url.toLowerCase();
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

        console.log(v.videoUrl, isValidUrl(v.videoUrl));
        if (!v.videoUrl || !isValidUrl(v.videoUrl)) {
          console.warn(`[thumb] Geçersiz URL atlandı: ${v.videoUrl}`);
          setThumbs(prev => ({
            ...prev,
            [v.videoUrl]: 'fallback_thumbnail_path',
          }));
          continue;
        }

        try {
          const {path} = await createThumbnail({
            url: v.videoUrl,
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
  }, [progress.exerciseDTO, progress.exerciseDTO.videos]);

  useEffect(() => {
    setColor(getColor());
  }, [progress.totalProgressDuration]);

  const ToMinuteSeconds = (duration: number) => {
    const seconds = duration % 60;
    const minutes = Math.floor(duration / 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
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
          Egzersiz Detayı
        </Text>
      </View>

      <View
        className="mt-3 mx-3 px-5 pt-3 pb-5 rounded-2xl flex flex-col items-center justify-center"
        style={{backgroundColor: colors.background.primary}}>
        <Text
          className="text-xl font-rubik-medium mb-2"
          style={{color: colors.text.primary}}>
          Mevcut İlerleme
        </Text>
        <Text className="text-xl font-rubik-medium mt-1" style={{color: color}}>
          {/* %{progress.totalProgressDuration} */}
          {`%${calcPercent()}`}
        </Text>
        {progress.totalProgressDuration === totalDurationSec && (
          <Text className="text-xl font-rubik-medium" style={{color: color}}>
            {/* %{progress.totalProgressDuration} */}
            Egzersiz Tamamlandı
          </Text>
        )}
        <View
          className="w-full h-1 rounded-full overflow-hidden mt-3"
          style={{backgroundColor: colors.background.secondary}}>
          <View
            className="h-1 rounded-full"
            style={{
              width: `${calcPercent()}%`,
              backgroundColor: color,
            }}
          />
        </View>
      </View>

      <ScrollView
        className="h-full px-3 mt-3"
        style={{
          backgroundColor: colors.background.secondary,
          marginBottom: 60,
        }}>
        <View
          className="px-5 pt-3 rounded-2xl mb-3"
          style={{backgroundColor: colors.background.primary}}>
          {progress.exerciseDTO?.videos &&
            progress.exerciseDTO.videos.length > 0 &&
            progress.exerciseDTO.videos.map((video, index) => (
              <View
                key={index}
                className="w-full rounded-xl p-3 mb-3"
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
                  {progress.videoProgress.some(
                    item => video.id === item.videoId && item.isCompeleted,
                  ) && (
                    <View className="flex flex-row items-center justify-center mt-1">
                      <Text
                        className="font-rubik text-sm mr-2"
                        style={{color: '#3BC476'}}>
                        Tamamlandı
                      </Text>
                      <Image
                        source={icons.check}
                        className="size-5 mb-1"
                        tintColor={'#3BC476'}
                      />
                    </View>
                  )}
                  {/*Tamamlandı yazabilir */}
                  {/* Eğer progress ratio şuana kadar olan video indexlerindeki videoların uzunluğunun toplamı 
                  video uzunluğuna olan oranından büyük ise video tamamlandı anlamına gelen tik iconu konsun */}
                </View>
              </View>
            ))}
        </View>
      </ScrollView>

      {!isDone && (
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
      )}
    </>
  );
};

export default ExerciseDetail;
