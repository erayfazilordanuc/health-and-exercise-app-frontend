import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from 'react';
import {View, BackHandler, StatusBar} from 'react-native';
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
import {progressExercise} from '../../../api/exercise/progressService';

type ExerciseRouteProp = RouteProp<ExercisesStackParamList, 'Exercise'>;

const Exercise = () => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
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

  const [isBackActionAlertVisible, setIsBackActionAlertVisible] =
    useState(false);

  const defaultTabBarStyle = {
    backgroundColor: colors.background.primary,
    borderColor: colors.background.primary,
    position: 'absolute',
    minHeight: 60,
    borderTopWidth: 0,
  };

  useLayoutEffect(() => {
    const parentNav = navigation.getParent();

    parentNav?.setOptions({
      tabBarStyle: {...defaultTabBarStyle, display: 'none'},
    });

    return () =>
      parentNav?.setOptions({
        tabBarStyle: defaultTabBarStyle,
      });
  }, [navigation]);

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

  useEffect(() => {
    Orientation.unlockAllOrientations();
    StatusBar.setHidden(true, 'fade');
    return () => {
      Orientation.lockToPortrait();
      StatusBar.setHidden(false, 'fade');
    };
  }, []);

  const syncExerciseProgress = useCallback(
    async (time: number, doneDuration?: number) => {
      if (
        paused ||
        (progress.videoProgress[videoIdxToShow] &&
          time < progress.videoProgress[videoIdxToShow].progressDuration)
      )
        return;
      const done = doneDuration ?? doneVideosDuration;

      if (doneDuration) setDoneVideosDuration(done);

      const newTotalProgressDuration = done + time;
      console.log('newTotal', newTotalProgressDuration);
      setTotalProgressDuration(newTotalProgressDuration);

      try {
        const netInfo = await NetInfo.fetch();
        console.log('time', time);
        if (netInfo.isConnected) {
          const response = await progressExercise(
            exercise.id!,
            exercise.videos[videoIdx].id!,
            time,
          );

          setUpdatedProgress(prev => {
            // Eğer dizi boş veya undefined/null ise:
            if (!prev.videoProgress || prev.videoProgress.length === 0) {
              console.log('1', {
                ...prev,
                totalProgressDuration: newTotalProgressDuration,
                videoProgress: [
                  {
                    ...response, // burada gerekli alanları doldur
                    durationSeconds: time,
                  },
                ],
              });
              return {
                ...prev,
                totalProgressDuration: newTotalProgressDuration,
                videoProgress: [
                  {
                    ...response, // burada gerekli alanları doldur
                    durationSeconds: time,
                  },
                ],
              };
            }

            // Doluysa map ile ilgili index'i güncelle
            console.log('2', {
              ...prev,
              totalProgressDuration: newTotalProgressDuration,
              videoProgress: prev.videoProgress.map((item, idx) =>
                idx === videoIdxToShow
                  ? {...item, durationSeconds: time}
                  : item,
              ),
            });
            return {
              ...prev,
              totalProgressDuration: newTotalProgressDuration,
              videoProgress: prev.videoProgress.map((item, idx) =>
                idx === videoIdxToShow
                  ? {...item, durationSeconds: time}
                  : item,
              ),
            };
          });
        }

        console.log('updatedProgress', updatedProgress);
        const key = `exerciseProgress_${new Date().toISOString().slice(0, 10)}`;
        await AsyncStorage.setItem(key, JSON.stringify(updatedProgress));
      } catch (error) {
        console.error('❌ Sync error:', error);
      }
    },
    [currentTime, doneVideosDuration],
  );

  const handleDurationProgress = (time: number) => {
    if (time > 0.5) {
      setCurrentTime(time);

      const now = Date.now();
      if (now - lastSyncRef.current >= 3000) {
        // 3 saniye geçtiyse
        lastSyncRef.current = now;
        syncExerciseProgress(time);
      }
    }
  };

  // useEffect(() => {
  //   const interval = setInterval(syncExerciseProgress, 5000);
  //   return () => clearInterval(interval);
  // }, [syncExerciseProgress]);

  return (
    <View
      style={{flex: 1, backgroundColor: '#171717', justifyContent: 'center'}}
      removeClippedSubviews={false}>
      <CustomVideoPlayer
        videoDTO={exercise.videos[videoIdxToShow]}
        startAt={startSecSync}
        isLast={videoIdxToShow === exercise.videos.length - 1}
        pausedParent={paused}
        onDurationProgress={handleDurationProgress}
        onVideoEnd={() => {
          if (videoIdxToShow + 1 < exercise.videos.length) {
            console.log(videoIdxToShow);
            setDoneVideosDuration(
              prev => prev + exercise.videos[videoIdxToShow].durationSeconds,
            );
            setVideoIdxToShow(prev => prev + 1);
            setStartSecSync(0);
            syncExerciseProgress(
              1,
              doneVideosDuration +
                exercise.videos[videoIdxToShow].durationSeconds,
            );
          } else {
            navigation.navigate('ExercisesUser');
          }
        }}
        onExit={() => setIsBackActionAlertVisible(true)}
      />

      <CustomAlert
        message="Egzersizi terk etmek istediğinize emin misiniz?"
        // message="Egzersizi sonlandırmak istediğinizden emin misiniz?"
        // secondMessage="Merak etmeyin, şu ana kadarki ilerlemeniz otomatik olarak kaydedilecek."
        secondMessage="İlerlemeniz kaydedilecektir"
        visible={isBackActionAlertVisible}
        onYes={() => {
          const parentNav = navigation.getParent();
          parentNav?.setOptions({
            tabBarStyle: defaultTabBarStyle,
          });

          setPaused(true);

          navigation.navigate('ExerciseDetail', {
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
