import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  ScrollView,
  InteractionManager,
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

type ExerciseRouteProp = RouteProp<ExercisesStackParamList, 'Exercise'>;
const Exercise = () => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const {params} = useRoute<ExerciseRouteProp>();
  const {exercise} = params;
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [videoFinished, setVideoFinished] = useState(false);

  const progressPercent = 30;

  // useFocusEffect(
  //   useCallback(() => {
  //     const backAction = () => {
  //       navigation.navigate('ExercisesUser');
  //       return true;
  //     };

  //     const backHandler = BackHandler.addEventListener(
  //       'hardwareBackPress',
  //       backAction,
  //     );

  //     return () => backHandler.remove();
  //   }, []),
  // );

  useEffect(() => {
    let isActive = true;

    const loadSequential = async () => {
      if (!exercise?.videos?.length) return;

      // İçerik etkileşimi bitsin, sonra başla
      await new Promise<void>(res =>
        InteractionManager.runAfterInteractions(() => res()),
      );

      for (const v of exercise.videos) {
        if (!isActive) break;
        if (thumbs[v.videoUrl]) continue; // zaten var
        try {
          const {path} = await createThumbnail({
            url: v.videoUrl,
            timeStamp: 1000,
            format: 'jpeg',
            maxWidth: 512,
          });
          if (!isActive) break;
          // anında state'e ekle – merge costu küçük
          setThumbs(prev => ({...prev, [v.videoUrl]: path}));
        } catch (err) {
          console.warn('[thumb] failed', (err as Error).message);
        }
      }
    };

    loadSequential();

    return () => {
      isActive = false;
    };
  }, [exercise?.videos]);

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
          Tüm Egzersizler
        </Text>
      </View>
      {/* <View
          className="w-full mt-6 rounded-xl p-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Dikkat Et:
          </Text>
          <Text className="text-gray-600 mb-1">✅ Sırtını dik tut</Text>
          <Text className="text-gray-600 mb-1">✅ Hareketleri yavaş yap</Text>
          <Text className="text-gray-600 mb-1">✅ Nefes kontrolünü unutma</Text>
        </View> */}
      <Text className="text-sm text-gray-500 mt-1 self-center">
        {progressPercent}% tamamlandı
      </Text>
      <View className="w-2/3 self-center h-2 bg-gray-300 rounded-full mt-2">
        <View
          style={{width: `${progressPercent}%`}}
          className="h-2 bg-blue-500 rounded-full"
        />
      </View>
      {videoFinished && (
        <>
          <TouchableOpacity
            className="bg-blue-600 rounded-2xl px-10 py-3 mt-6 shadow-lg self-center w-1/2"
            // onPress={() => navigation.navigate('NextExercise')}
          >
            <Text className="text-white text-base">Sonraki Egzersiz</Text>
          </TouchableOpacity>
          <Text className="text-green-600 font-bold">
            Tebrikler, bu egzersizi tamamladın! 🎉
          </Text>
        </>
      )}
      <ScrollView
        className="h-full mb-16 px-3 mt-3"
        style={{
          backgroundColor: colors.background.secondary,
        }}>
        <View
          className="px-5 pt-3 rounded-2xl mb-3"
          style={{backgroundColor: colors.background.primary}}>
          {exercise?.videos &&
            exercise.videos.length > 0 &&
            exercise.videos.map((video, index) => (
              <View
                key={index}
                className="w-full rounded-xl p-3 mb-3"
                style={{backgroundColor: colors.background.secondary}}>
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
                  customStyles={{
                    videoWrapper: {borderRadius: 10},
                    controlButton: {opacity: 0.9},
                    thumbnail: {
                      borderRadius: 15,
                      width: 80,
                      height: 80,
                      alignSelf: 'center',
                      justifyContent: 'center',
                    },
                    thumbnailImage: {
                      width: '100%',
                      height: '100%',
                      resizeMode: 'cover',
                    },
                  }}
                />
                <View className="flex flex-row justify-between items-center px-5 mt-3">
                  <Text
                    className="font-rubik text-center text-md"
                    style={{color: colors.text.primary}}>
                    Aşama {index + 1}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      </ScrollView>
    </>
  );
};

export default Exercise;
