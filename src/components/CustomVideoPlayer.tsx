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

interface CustomVideoPlayerProps {
  videoDTO: ExerciseVideoDTO;
  startAt?: number;
  isLast: boolean;
  pausedParent: boolean;
  onDurationProgress: (duration: number) => void;
  onVideoEnd: () => void;
  onExit?: () => void;
}

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  videoDTO,
  startAt = 0,
  isLast,
  pausedParent,
  onDurationProgress,
  onVideoEnd,
  onExit,
}) => {
  const {colors} = useTheme();
  const playerRef = useRef<VideoRef>(null);

  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [paused, setPaused] = useState(pausedParent);
  const [hasSeeked, setHasSeeked] = useState(false);

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

  return (
    <TouchableWithoutFeedback onPress={handleToggleControls}>
      <View style={{flex: 1, backgroundColor: '#171717'}}>
        <Video
          ref={playerRef}
          source={{uri: videoDTO.videoUrl}}
          style={{width: '100%', height: '100%'}}
          resizeMode="contain"
          paused={paused}
          onLoadStart={() => {
            setLoading(true);
          }}
          onBuffer={({isBuffering}) => setBuffering(isBuffering)}
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

        <Text
          className="font-rubik-medium text-3xl"
          style={{
            position: 'absolute',
            top:
              Dimensions.get('window').height >= Dimensions.get('window').width
                ? '30%'
                : '2%',
            left:
              Dimensions.get('window').height >= Dimensions.get('window').width
                ? '39%'
                : '78%',
            color: 'white',
          }}>
          {videoDTO.name}
        </Text>

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
                backgroundColor: colors.primary[250],
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
            <Text
              className="text-2xl"
              style={{
                color: 'white',
                textAlign: 'center',
                marginBottom: 12,
              }}>
              {isLast
                ? 'Tebrikler! Egzersizi tamamladınız!'
                : 'Tebrikler videoyu bitirdiniz!'}
            </Text>

            {/* Buton */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary[200],
                marginTop: 5,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 25,
              }}
              onPress={() => {
                onVideoEnd();
                setShowNextButton(false);
              }}>
              <Text style={{color: 'white', fontSize: 17, textAlign: 'center'}}>
                {isLast ? 'Bitir' : 'Sonraki videoya geç ->'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default CustomVideoPlayer;
