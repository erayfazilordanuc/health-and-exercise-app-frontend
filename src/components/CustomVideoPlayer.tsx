import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  Image,
  Dimensions,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import Video, {VideoRef} from 'react-native-video';
import icons from '../constants/icons';
import {useTheme} from '../themes/ThemeProvider';
import {ScreenWidth} from 'react-native-elements/dist/helpers';
import {clamp} from 'lodash';
import GradientText from './GradientText';
import LinearGradient from 'react-native-linear-gradient';
import {useIsFocused} from '@react-navigation/native';
import {cacheVideoIfNeeded, getCachedLocalUri} from '../utils/videoCache';
import NetInfo from '@react-native-community/netinfo';

interface CustomVideoPlayerProps {
  videoDTO: ExerciseVideoDTO;
  startAt?: number;
  isLast: boolean;
  pausedParent: boolean;
  onBufferChange: (b: boolean) => void;
  onDurationProgress: (duration: number) => void;
  onVideoEnd: () => void;
  onExit?: () => void;
}

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  videoDTO,
  startAt = 0,
  isLast,
  pausedParent,
  onBufferChange,
  onDurationProgress,
  onVideoEnd,
  onExit,
}) => {
  const {colors} = useTheme();
  const playerRef = useRef<VideoRef>(null);

  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const isFocused = useIsFocused();
  const [paused, setPaused] = useState(pausedParent);
  const [hasSeeked, setHasSeeked] = useState(false);
  const [ended, setEnded] = useState(false);

  const [videoTotalDuration, setVideoTotalDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const [skipBalance, setSkipBalance] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${('0' + Math.floor(sec % 60)).slice(-2)}`;
  const handleToggleControls = () => {
    if (showControls) {
      hideTimer.current && clearTimeout(hideTimer.current);
      setShowControls(false);
    } else {
      setShowControls(true);
      hideTimer.current && clearTimeout(hideTimer.current);
      if (!paused)
        hideTimer.current = setTimeout(() => setShowControls(false), 2000);
      else {
        hideTimer.current = setTimeout(() => setShowControls(false), 5000);
      }
    }
  };

  const safeSeek = (target: number) => {
    const t = clamp(target, 0, videoTotalDuration || 0);
    playerRef.current?.seek(t);
    setCurrentTime(t);
  };

  useEffect(() => {
    setPaused(pausedParent);
  }, [pausedParent]);

  useEffect(() => {
    setShowNextButton(false);
    setEnded(false);
    setHasSeeked(false);
    setProgress(0);
    setCurrentTime(0);
  }, [videoDTO.id]);

  const [resolvedUri, setResolvedUri] = useState<string | null>(null);
  const [downloadPct, setDownloadPct] = useState(0); // % indirme ilerleme

  // useEffect(() => {
  //   let cancelled = false;

  //   (async () => {
  //     setResolvedUri(null);
  //     setDownloadPct(0);

  //     // 1) Lokalde var mı?
  //     const local = await getCachedLocalUri(
  //       String(videoDTO.id ?? videoDTO.videoUrl),
  //     );
  //     if (cancelled) return;

  //     if (local) {
  //       setResolvedUri(local);
  //       return;
  //     } else {
  //       const net = await NetInfo.fetch();
  //       if (!net.isConnected) {
  //         ToastAndroid.show(
  //           'İnternet bağlantınızı kontrol ediniz',
  //           ToastAndroid.LONG,
  //         );
  //         setPaused(true);
  //         return;
  //       }
  //     }

  //     setResolvedUri(videoDTO.videoUrl); // stream başlasın
  //     try {
  //       const fileUri = await cacheVideoIfNeeded(
  //         String(videoDTO.id ?? videoDTO.videoUrl),
  //         videoDTO.videoUrl,
  //         setDownloadPct,
  //       );
  //       if (!cancelled) {
  //         // “sessiz” kaynak değiştirme (seek’i korumak için mevcut zamanı tutup seek edebilirsiniz)
  //         setResolvedUri(fileUri);
  //       }
  //     } catch {
  //       // indirme patlarsa umursama → stream devam
  //     }
  //   })();

  //   return () => {
  //     cancelled = true;
  //   };
  // }, [videoDTO.id, videoDTO.videoUrl]);

  const videoSource = React.useMemo(() => {
    if (!resolvedUri) return undefined;
    const isHLS = resolvedUri.endsWith('.m3u8');
    return {uri: resolvedUri, type: isHLS ? 'm3u8' : undefined};
  }, [resolvedUri]);

  const currentTimeRef = useRef(0);
  const pendingSwapSeekRef = useRef<number | null>(null);
  const didSwapRef = useRef(false);

  useEffect(() => {
    currentTimeRef.current = currentTime; // progress geldikçe güncel kalsın
  }, [currentTime]);

  // ✅ TEK ve DOĞRU effect (ilkini sil, sadece bunu tut)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setResolvedUri(null);
      setDownloadPct(0);

      // 1) Lokal var mı?
      const local = await getCachedLocalUri(
        String(videoDTO.id ?? videoDTO.videoUrl),
      );
      if (cancelled) return;

      if (local) {
        setResolvedUri(local); // direkt local’den başla → swap yok
        return;
      } else {
        const net = await NetInfo.fetch();
        if (!net.isConnected) {
          ToastAndroid.show(
            'İnternet bağlantınızı kontrol ediniz',
            ToastAndroid.LONG,
          );
          setPaused(true);
          return;
        }
      }

      // 2) Önce stream’den başlat
      setResolvedUri(videoDTO.videoUrl);

      // 3) Arkada indir; bitince kaldığın yerden local’e geç
      try {
        const fileUri = await cacheVideoIfNeeded(
          String(videoDTO.id ?? videoDTO.videoUrl),
          videoDTO.videoUrl,
          setDownloadPct,
        );
        if (!cancelled) {
          // swap öncesi süreyi kaydet → onLoad’da buraya seek edilecek
          pendingSwapSeekRef.current = currentTimeRef.current;
          didSwapRef.current = true;
          setResolvedUri(fileUri); // source değişir → Video yeniden onLoad olur
        }
      } catch {
        // indirme başarısızsa stream’e devam
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [videoDTO.id, videoDTO.videoUrl]);

  return (
    <TouchableWithoutFeedback onPress={handleToggleControls}>
      <View style={{flex: 1, backgroundColor: '#171717'}}>
        <Video
          // key={`${videoDTO.id}-${videoDTO.videoUrl}`}
          key={String(videoDTO.id)}
          ref={playerRef}
          source={{
            uri: resolvedUri ?? videoDTO.videoUrl,
            type: videoDTO.videoUrl.endsWith('.m3u8') ? 'm3u8' : undefined, // HLS ise belirt
            headers: undefined, // gerekiyorsa
            minLoadRetryCount: 3, // ✅ yeni yer
            bufferConfig: {
              // ✅ yeni yer (Android/ExoPlayer)
              minBufferMs: 24000, // ~24 sn altına düşmesin
              maxBufferMs: 90000, // tavan ~90 sn (dalgalı mobilde rahat)
              bufferForPlaybackMs: 1500, // başlatmak için ~1.5 sn
              bufferForPlaybackAfterRebufferMs: 3000,
            },
          }}
          style={{width: '100%', height: '100%'}}
          resizeMode="contain"
          paused={paused || !isFocused}
          playInBackground={false}
          playWhenInactive={false}
          onLoadStart={() => {
            setLoading(true);
          }}
          progressUpdateInterval={700}
          onBuffer={({isBuffering}) => {
            setBuffering(isBuffering);
            onBufferChange(isBuffering);
          }}
          onLoad={({duration}) => {
            setVideoTotalDuration(duration);
            if (!hasSeeked && startAt > 0) {
              playerRef.current?.seek(startAt);
              setHasSeeked(true);
            }

            if (didSwapRef.current && pendingSwapSeekRef.current != null) {
              const t = Math.min(pendingSwapSeekRef.current, duration - 0.5);
              playerRef.current?.seek(Math.max(0, t));
              pendingSwapSeekRef.current = null;
              didSwapRef.current = false;
            }
          }}
          onProgress={({currentTime}) => {
            setCurrentTime(currentTime);
            if (videoTotalDuration > 0)
              setProgress(currentTime / videoTotalDuration);
            onDurationProgress(currentTime);
            if (loading) setLoading(false);
          }}
          onEnd={() => {
            if (ended) return;
            setEnded(true);
            setPaused(true);
            setShowNextButton(true);
          }}
        />

        {showControls && !buffering && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              gap: 25,
            }}>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                safeSeek(currentTime - 5);
                setSkipBalance(prev => prev + 1);
                if (!paused) setShowControls(false);
                setLoading(false); // ileri alma artık aktif
                if (showNextButton) setShowNextButton(false);
              }}>
              <Image
                source={icons.rewind_5}
                tintColor={'white'}
                style={{width: 55, height: 55}}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPaused(p => !p)}>
              <Image
                source={paused ? colors.playButton : colors.pauseButton}
                style={{width: 65, height: 65}}
              />
            </TouchableOpacity>

            <TouchableOpacity
              disabled={skipBalance < 1}
              onPress={() => {
                setLoading(true);
                safeSeek(currentTime + 5);
                if (skipBalance > 0) setSkipBalance(prev => prev - 1);
                setLoading(false);
                if (!paused) setShowControls(false);
              }}
              style={{opacity: skipBalance < 1 ? 0.4 : 1}}>
              <Image
                source={icons.forward_5}
                tintColor={'white'}
                style={{width: 55, height: 55}}
              />
            </TouchableOpacity>
          </View>
        )}

        {showControls && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              top:
                Dimensions.get('window').height >=
                Dimensions.get('window').width
                  ? '5%'
                  : '3%',
              left:
                Dimensions.get('window').height >=
                Dimensions.get('window').width
                  ? '5%'
                  : '2%',
              paddingVertical: 12,
              paddingHorizontal: 15,
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: 25,
            }}
            onPress={onExit}>
            <Image
              source={icons.logout}
              style={{width: 24, height: 24, tintColor: 'white'}}
            />
          </TouchableOpacity>
        )}

        {showControls && (
          <View
            style={{
              position: 'absolute',
              bottom:
                Dimensions.get('window').height >=
                Dimensions.get('window').width
                  ? '4%'
                  : '6%',
              right: '4%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 5,
            }}>
            <Text style={{color: 'white', fontSize: 14}}>
              {formatTime(currentTime)} / {formatTime(videoTotalDuration)}
            </Text>
          </View>
        )}

        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text
            className="font-rubik-medium text-3xl"
            style={{
              position: 'absolute',
              top:
                Dimensions.get('window').height >=
                Dimensions.get('window').width
                  ? '30%'
                  : '2%',
              right:
                Dimensions.get('window').height >=
                Dimensions.get('window').width
                  ? undefined
                  : '12%',
              color: 'white',
            }}>
            {videoDTO.name}
          </Text>
        </View>

        {showControls && !buffering && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <TouchableOpacity onPress={() => setPaused(p => !p)}>
              <Image
                source={paused ? colors.playButton : colors.pauseButton}
                style={{width: 65, height: 65}}
              />
            </TouchableOpacity>
          </View>
        )}

        {(loading || buffering) && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.35)',
            }}>
            <ActivityIndicator size="large" color={colors.primary[250]} />
          </View>
        )}

        {showControls && (
          <View
            style={{
              position: 'absolute',
              bottom:
                Dimensions.get('window').height >=
                Dimensions.get('window').width
                  ? '2%'
                  : '3%',
              left: '3%',
              right: '3%',
              height: 4,
              backgroundColor: '#666',
              borderRadius: 10,
              marginHorizontal: ScreenWidth / 35,
            }}>
            <View
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                backgroundColor: colors.primary[250], // '#2CFF6B', // colors.primary[250],
                borderRadius: 10,
              }}
            />
          </View>
        )}

        {showNextButton && (
          <View
            style={{
              position: 'absolute',
              bottom: '12%',
              alignSelf: 'center',
              alignItems: 'center', // yatay ortala
            }}>
            {/* Bilgilendirme metni */}
            <GradientText className="mb-4">
              <Text
                className="text-2xl font-rubik-semibold"
                style={{
                  color: 'white',
                  textAlign: 'center',
                }}>
                {isLast
                  ? 'Tebrikler!\nTüm videoları bitirerek egzersizi başarıyla tamamladınız'
                  : 'Videoyu bitirdiniz!'}
              </Text>
            </GradientText>

            {/* Buton */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                onVideoEnd();
                setShowNextButton(false);
                setPaused(false);
              }}
              style={{marginTop: 5}} // sadece dış boşluklar burada kalsın
            >
              <LinearGradient
                colors={[colors.primary[300], colors.secondary[300]]} // ister temaya göre değiştir
                start={{x: 0, y: 0}}
                end={{x: 1.1, y: 1}}
                className="flex flex-row"
                style={{
                  paddingHorizontal: 15,
                  paddingVertical: 12,
                  borderRadius: 25,
                  alignItems: 'center',
                  justifyContent: 'center',
                  // opsiyonel: gölge
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  shadowOffset: {width: 0, height: 4},
                  elevation: 3,
                }}>
                <Text
                  style={{color: 'white', fontSize: 17, textAlign: 'center'}}>
                  {isLast ? 'Bitir  ' : 'Sonraki videoya geç  '}
                </Text>
                <Image
                  source={isLast ? icons.check_1 : icons.next}
                  tintColor={'white'}
                  className="size-7"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default CustomVideoPlayer;
