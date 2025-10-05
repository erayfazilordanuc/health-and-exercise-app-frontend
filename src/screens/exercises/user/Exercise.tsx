import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from 'react';
import {View, BackHandler, StatusBar, Dimensions} from 'react-native';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomAlert from '../../../components/CustomAlert';
import CustomVideoPlayer from '../../../components/CustomVideoPlayer';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../themes/ThemeProvider';
import {useUser} from '../../../contexts/UserContext';
import {progressExerciseVideo} from '../../../api/exercise/progressService';
import {Theme} from '../../../themes/themes';
import {Cake} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';

type ExerciseRouteProp = RouteProp<ExercisesStackParamList, 'Exercise'>;

const Exercise = () => {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation('exercise');
  const {colors, theme} = useTheme();
  const {width} = Dimensions.get('screen');
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const {params} = useRoute<ExerciseRouteProp>();
  const {user} = useUser();
  const {exercise, progress, videoIdx, startSec} = params;

  const [updatedProgress, setUpdatedProgress] = useState(progress);
  const [totalProgressDuration, setTotalProgressDuration] = useState(
    progress.totalProgressDuration,
  );
  const [doneVideosDuration, setDoneVideosDuration] = useState(
    progress.videoProgress
      .filter(vp => vp.isCompeleted)
      .reduce((sum, vp) => sum + vp.progressDuration, 0),
  );
  const [videoIdxToShow, setVideoIdxToShow] = useState(videoIdx);
  const [startSecSync, setStartSecSync] = useState(startSec);

  const lastSyncRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const onBufferChange = (b: boolean) => setIsBuffering(b);

  const [isBackActionAlertVisible, setIsBackActionAlertVisible] =
    useState(false);

  const [isFinishModalVisbible, setIsFinishModalVisbible] = useState(false);

  const [portraitInsets, setPortraitInsets] = useState(insets);
  const [portraitWidth, setPortraitWidth] = useState(width);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        setIsBackActionAlertVisible(true);
        return true;
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );
      return () => backHandler.remove();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      // ekrana girince
      StatusBar.setHidden(true, 'fade');
      const {height, width} = Dimensions.get('window');
      const isPortrait = height >= width;
      if (!isPortrait) {
        Orientation.lockToPortrait();

        const portraitInsts = useSafeAreaInsets();
        setPortraitInsets(portraitInsts);
        setPortraitWidth(width);
      }

      Orientation.unlockAllOrientations();

      return () => {
        // ekrandan çıkarken (blur) her zaman geri aç
        Orientation.lockToPortrait();
        StatusBar.setHidden(false, 'fade');
      };
    }, []),
  );

  const updatedProgressRef = useRef(updatedProgress);
  useEffect(() => {
    updatedProgressRef.current = updatedProgress;
  }, [updatedProgress]);
  const syncExerciseProgress = useCallback(
    async (time: number, finishedVideoIdx?: number, isEnd?: boolean) => {
      // 1) Hangi video hesapta? Sadece guard ve isCompleted için lazım
      const idx = finishedVideoIdx ?? videoIdxToShow;
      const relatedVideo = exercise.videos[idx];
      const vid = relatedVideo.id!;

      const prevVP = updatedProgressRef.current.videoProgress.find(
        vp => vp.videoId === vid,
      );

      // Zaman toleransı (float sapmalarına karşı)
      const EPS = 0.25;
      let isCompleted = time >= (relatedVideo.durationSeconds ?? 0) - EPS;

      // Paused ise veya geriye/aynı süre yazılıyorsa çık (tamamlandı anı hariç)
      if (!isCompleted) {
        if (paused || (prevVP && time <= prevVP.progressDuration)) return;
      }

      // 2) Toplam süre hesabı (mevcut videonun full süresini SADECE bitişte ekle)
      const completedBonus =
        finishedVideoIdx != null
          ? exercise.videos[finishedVideoIdx].durationSeconds ?? 0
          : 0;

      const newTotalProgressDuration =
        doneVideosDuration +
        completedBonus +
        (finishedVideoIdx == null ? time : 0);
      setTotalProgressDuration(newTotalProgressDuration);

      // 3) Online ise API
      let response: any = null;
      try {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          response = await progressExerciseVideo(
            exercise.id!,
            vid,
            Math.min(time, relatedVideo.durationSeconds ?? time),
          );
        }
      } catch (e) {
        console.warn('progressExerciseVideo failed:', e);
      }

      // 4) State & AsyncStorage
      try {
        setUpdatedProgress(prev => {
          const existingIndex = prev.videoProgress.findIndex(
            vp => vp.videoId === vid,
          );
          const base =
            existingIndex === -1
              ? undefined
              : prev.videoProgress[existingIndex];

          // Bir kez true olduysa hep true kalsın
          isCompleted = isCompleted || base?.isCompeleted || !!isEnd;

          const newVideoProgressItem: ExerciseVideoProgressDTO = {
            id: response?.id ?? base?.id,
            progressDuration: Math.min(
              time,
              relatedVideo.durationSeconds ?? time,
            ),
            isCompeleted: isCompleted,
            videoId: vid,
            exerciseId: exercise.id!,
            userId: user!.id!,
            createdAt: response?.createdAt ?? base?.createdAt ?? new Date(),
            updatedAt: new Date(),
          };

          const newVideoProgress =
            existingIndex === -1
              ? [...prev.videoProgress, newVideoProgressItem]
              : prev.videoProgress.map((it, i) =>
                  i === existingIndex ? newVideoProgressItem : it,
                );

          const next = {
            ...prev,
            totalProgressDuration: newTotalProgressDuration,
            videoProgress: newVideoProgress,
          };

          const key = `exerciseProgress_${new Date()
            .toISOString()
            .slice(0, 10)}`;
          AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
          return next;
        });
      } catch (error) {
        console.error('❌ Sync error:', error);
      }
    },
    [
      paused,
      videoIdxToShow,
      doneVideosDuration,
      exercise.id,
      exercise.videos,
      user?.id,
    ],
  );

  const handleDurationProgress = async (time: number) => {
    if (time > 0.5) {
      setCurrentTime(time);
      const now = Date.now();
      if (!isBuffering && now - lastSyncRef.current >= 3000) {
        // 🤚 buffering iken sync yapma
        lastSyncRef.current = now;
        syncExerciseProgress(time);
      }
    }
  };

  return (
    <View
      style={{flex: 1, backgroundColor: '#171717', justifyContent: 'center'}}
      removeClippedSubviews={false}>
      <CustomVideoPlayer
        videoDTO={exercise.videos[videoIdxToShow]}
        startAt={startSecSync}
        isLast={videoIdxToShow === exercise.videos.length - 1}
        pausedParent={paused}
        onBufferChange={setIsBuffering}
        onDurationProgress={handleDurationProgress}
        // onVideoEnd={() => {
        //   console.log('eeeeend');
        //   syncExerciseProgress(
        //     exercise.videos[videoIdxToShow].durationSeconds,
        //     undefined,
        //     true,
        //   );
        //   console.log(videoIdxToShow, exercise.videos.length);
        //   if (videoIdxToShow + 1 < exercise.videos.length) {
        //     // syncExerciseProgress(1, videoIdxToShow + 1, true);
        //     setStartSecSync(0);
        //     setDoneVideosDuration(
        //       prev => prev + exercise.videos[videoIdxToShow].durationSeconds,
        //     );
        //     setVideoIdxToShow(prev => prev + 1);
        //   } else {
        //     setDoneVideosDuration(
        //       prev => prev + exercise.videos[videoIdxToShow].durationSeconds,
        //     );
        //     // const parentNav = navigation.getParent();
        //     // parentNav?.setOptions({
        //     //   tabBarStyle: makeTabBarStyle(theme, width),
        //     // });
        //     setTimeout(() => {
        //       navigation.navigate('ExercisesUser');
        //     }, 250);
        //   }
        // }}
        onVideoEnd={async () => {
          // 1) O an biten videonun index’ini sabitle
          const finishedIdx = videoIdxToShow;
          const finishedDur = exercise.videos[finishedIdx].durationSeconds;

          // 2) Önce biten video için kesin olarak tamamlandı yaz (o index’i geçir!)
          console.log('burada', finishedIdx, finishedDur);
          await syncExerciseProgress(finishedDur, finishedIdx, true);

          // 3) Sonraki videoya geç
          if (finishedIdx + 1 < exercise.videos.length) {
            setStartSecSync(0);
            setDoneVideosDuration(prev => prev + finishedDur);
            setVideoIdxToShow(finishedIdx + 1);
          } else {
            setDoneVideosDuration(prev => prev + finishedDur);
            setTimeout(() => {
              navigation.navigate('ExercisesUser');
            }, 250);
          }
        }}
        // onVideoEnd={() => {
        //   console.log('eeeeend');
        //   syncExerciseProgress(
        //     exercise.videos[videoIdxToShow].durationSeconds,
        //     undefined,
        //     true,
        //   );
        //   console.log(videoIdxToShow, exercise.videos.length);
        //   if (videoIdxToShow + 1 < exercise.videos.length) {
        //     // syncExerciseProgress(1, videoIdxToShow + 1, true);
        //     setStartSecSync(0);
        //     setDoneVideosDuration(
        //       prev => prev + exercise.videos[videoIdxToShow].durationSeconds,
        //     );
        //     setVideoIdxToShow(prev => prev + 1);
        //   } else {
        //     setDoneVideosDuration(
        //       prev => prev + exercise.videos[videoIdxToShow].durationSeconds,
        //     );
        //     // const parentNav = navigation.getParent();
        //     // parentNav?.setOptions({
        //     //   tabBarStyle: makeTabBarStyle(theme, width),
        //     // });
        //     setTimeout(() => {
        //       navigation.navigate('ExercisesUser');
        //     }, 250);
        //   }
        // }}
        onExit={() => setIsBackActionAlertVisible(true)}
      />

      <CustomAlert
        message={t('player.confirmExit.message')}
        // message="Egzersizi sonlandırmak istediğinizden emin misiniz?"
        // secondMessage="Merak etmeyin, şu ana kadarki ilerlemeniz otomatik olarak kaydedilecek."
        secondMessage={t('player.confirmExit.subtitle')}
        visible={isBackActionAlertVisible}
        onYes={() => {
          setPaused(true);

          navigation.replace('ExerciseDetail', {
            progress: updatedProgress,
            totalDurationSec: exercise.videos.reduce(
              (sum, v) => sum + (v.durationSeconds ?? 0),
              0,
            ),
          });
          setIsBackActionAlertVisible(false);
        }}
        onCancel={() => setIsBackActionAlertVisible(false)}
      />
    </View>
  );
};

export default Exercise;
