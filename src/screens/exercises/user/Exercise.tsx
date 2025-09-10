import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  BackHandler,
  StatusBar,
  Dimensions,
  ToastAndroid,
} from 'react-native';
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

type ExerciseRouteProp = RouteProp<ExercisesStackParamList, 'Exercise'>;

const Exercise = () => {
  const insets = useSafeAreaInsets();
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

  //   parentNav?.setOptions({
  //     tabBarStyle: {...makeTabBarStyle(theme, width), display: 'none'},
  //   });

  //   return () =>
  //     parentNav?.setOptions({
  //       tabBarStyle: makeTabBarStyle(theme, width),
  //     });
  // }, [navigation]);

  const makeTabBarStyle = (
    theme: Theme,
    width: number,
    insetsBottom: number,
  ) => ({
    minHeight: 50 + Math.max(insetsBottom, 0),
    height: undefined,
    paddingTop: 11,
    paddingBottom: Math.max(insetsBottom, 11),

    // mevcut görünümü koru
    marginHorizontal: width / 24,
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
    borderRadius: 40,
    borderWidth: 1,
    borderTopWidth: 0.9,
    borderColor: theme.colors.isLight
      ? 'rgba(0,0,0,0.09)'
      : 'rgba(150,150,150,0.09)',
    backgroundColor: theme.colors.isLight
      ? 'rgba(255,255,255,0.95)'
      : 'rgba(25,25,25,0.95)',
    elevation: 0,
  });

  const baseTabBarStyleRef = useRef<any | null>(null);

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      // Snapshot'ı sadece girişte al (portrait 'window' ölçüleri ve o anki insets)
      const base = makeTabBarStyle(theme, portraitWidth, portraitInsets.bottom);
      baseTabBarStyleRef.current = base;

      // Görünmez yap ama base stilin ÜZERİNE
      parent?.setOptions({
        tabBarStyle: {...base, display: 'none'},
      });

      return () => {
        // 4) Çıkarken snapshot'ı AYNI HALİYLE geri yaz
        parent?.setOptions({
          tabBarStyle:
            baseTabBarStyleRef.current ??
            makeTabBarStyle(theme, portraitWidth, portraitInsets.bottom),
        });
      };
    }, [navigation, theme.name]), // dikkat: width/insets'i BAĞIMLILIĞA KOYMA!
  );

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

  const syncExerciseProgress = useCallback(
    async (time: number, videoIdx?: number, isEnd?: boolean) => {
      if (
        paused ||
        (progress.videoProgress[videoIdxToShow] &&
          time < progress.videoProgress[videoIdxToShow].progressDuration)
      )
        return;

      const done = videoIdx
        ? exercise.videos[videoIdxToShow].durationSeconds + doneVideosDuration
        : doneVideosDuration;
      if (videoIdx) setDoneVideosDuration(done);

      const newTotalProgressDuration = done + time;
      console.log('newTotal', newTotalProgressDuration);
      setTotalProgressDuration(newTotalProgressDuration);

      try {
        const netInfo = await NetInfo.fetch();
        console.log('time', time);
        if (netInfo.isConnected) {
          const response = await progressExerciseVideo(
            exercise.id!,
            exercise.videos[videoIdx ? videoIdx : videoIdxToShow].id!,
            time,
          );

          const key = `exerciseProgress_${new Date()
            .toISOString()
            .slice(0, 10)}`;
          await AsyncStorage.setItem(
            key,
            JSON.stringify({
              ...updatedProgress,
              totalProgressDuration: newTotalProgressDuration,
              // local tarafta isEnd geldiyse force true yaz
              videoProgress: updatedProgress.videoProgress.map(vp =>
                vp.videoId ===
                exercise.videos[videoIdx ? videoIdx : videoIdxToShow].id
                  ? {...vp, isCompeleted: vp.isCompeleted || !!isEnd}
                  : vp,
              ),
            }),
          );

          setUpdatedProgress(prev => {
            const existingIndex = prev.videoProgress?.findIndex(
              vp =>
                vp.videoId ===
                exercise.videos[videoIdx ? videoIdx : videoIdxToShow].id,
            );

            const newVideoProgressItem: ExerciseVideoProgressDTO = {
              ...response,
            };

            if (existingIndex === -1 || existingIndex === undefined) {
              // İlgili videoId yoksa → ekle
              return {
                ...prev,
                totalProgressDuration: newTotalProgressDuration,
                videoProgress: [
                  ...(prev.videoProgress || []),
                  newVideoProgressItem,
                ],
              };
            } else {
              // Varsa → güncelle
              return {
                ...prev,
                totalProgressDuration: newTotalProgressDuration,
                videoProgress: prev.videoProgress.map((item, idx) =>
                  idx === existingIndex
                    ? {
                        ...newVideoProgressItem,
                        isCompeleted: item.isCompeleted || !!isEnd,
                      }
                    : item,
                ),
              };
            }
          });
        }

        console.log('updatedProgress', updatedProgress);
        console.log(
          'saved local today progress',
          JSON.stringify({
            ...updatedProgress,
            totalProgressDuration: newTotalProgressDuration,
            // local tarafta isEnd geldiyse force true yaz
            videoProgress: updatedProgress.videoProgress.map(vp =>
              vp.videoId ===
              exercise.videos[videoIdx ? videoIdx : videoIdxToShow].id
                ? {...vp, isCompeleted: vp.isCompeleted || !!isEnd}
                : vp,
            ),
          }),
        );
      } catch (error) {
        console.error('❌ Sync error:', error);
      }
    },
    [currentTime, doneVideosDuration],
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
  console.log('updated', updatedProgress);

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
        onBufferChange={setIsBuffering}
        onDurationProgress={handleDurationProgress}
        onVideoEnd={() => {
          console.log('eeeeend');
          syncExerciseProgress(
            exercise.videos[videoIdxToShow].durationSeconds,
            undefined,
            true,
          );
          console.log(videoIdxToShow, exercise.videos.length);
          if (videoIdxToShow + 1 < exercise.videos.length) {
            syncExerciseProgress(1, videoIdxToShow + 1, true);
            setStartSecSync(0);
            setDoneVideosDuration(
              prev => prev + exercise.videos[videoIdxToShow].durationSeconds,
            );
            setVideoIdxToShow(prev => prev + 1);
          } else {
            setDoneVideosDuration(
              prev => prev + exercise.videos[videoIdxToShow].durationSeconds,
            );
            // const parentNav = navigation.getParent();
            // parentNav?.setOptions({
            //   tabBarStyle: makeTabBarStyle(theme, width),
            // });
            setTimeout(() => {
              navigation.navigate('ExercisesUser');
            }, 250);
          }
        }}
        onExit={() => setIsBackActionAlertVisible(true)}
      />

      {/* <CustomAlert
        message="Tebrikler! Egzersizi Tamamladınız"
        // message="Egzersizi sonlandırmak istediğinizden emin misiniz?"
        // secondMessage="Merak etmeyin, şu ana kadarki ilerlemeniz otomatik olarak kaydedilecek."
        visible={isFinishModalVisbible}
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
      /> */}

      <CustomAlert
        message="Egzersizi terk etmek istediğinize emin misiniz?"
        // message="Egzersizi sonlandırmak istediğinizden emin misiniz?"
        // secondMessage="Merak etmeyin, şu ana kadarki ilerlemeniz otomatik olarak kaydedilecek."
        secondMessage="İlerlemeniz kaydedilecektir"
        visible={isBackActionAlertVisible}
        onYes={() => {
          // const parentNav = navigation.getParent();
          // parentNav?.setOptions({
          //   tabBarStyle: makeTabBarStyle(theme, width),
          // });

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
