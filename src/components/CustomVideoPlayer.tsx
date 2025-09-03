import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Video, {VideoRef} from 'react-native-video';
import icons from '../constants/icons';
import {useTheme} from '../themes/ThemeProvider';
import {ScreenWidth} from 'react-native-elements/dist/helpers';
import {clamp} from 'lodash';
import GradientText from './GradientText';
import LinearGradient from 'react-native-linear-gradient';
import {useIsFocused} from '@react-navigation/native';

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

  return (
    <TouchableWithoutFeedback onPress={handleToggleControls}>
      <View style={{flex: 1, backgroundColor: '#171717'}}>
        <Video
          key={`${videoDTO.id}-${videoDTO.videoUrl}`}
          ref={playerRef}
          source={{
            uri: videoDTO.videoUrl, // mp4 / m3u8 / mpd
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
                source={paused ? icons.play : icons.pause}
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
                source={paused ? icons.play : icons.pause}
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
                backgroundColor: '#0A9FFF', // '#2CFF6B', // colors.primary[250],
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
                end={{x: 1, y: 1}}
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
