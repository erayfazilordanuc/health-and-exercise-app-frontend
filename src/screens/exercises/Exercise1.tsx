import React, {useState, useRef, useCallback} from 'react';
import {View, Text, TouchableOpacity, BackHandler} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Video from 'react-native-video';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../themes/ThemeProvider';

const Exercise1 = () => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const videoRef = useRef(null);
  const [videoFinished, setVideoFinished] = useState(false);

  const progressPercent = 30; // örnek ilerleme

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        navigation.navigate('Exercises');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, []),
  );

  return (
    <View
      className="flex-1 items-center px-4 relative"
      style={{
        backgroundColor: colors.background.secondary,
        paddingTop: insets.top * 1.3,
      }}>
      {/* Başlık */}
      <Text className="text-3xl font-bold text-blue-600 text-center mt-4">
        Egzersiz
      </Text>

      {/* Video Kartı */}
      <View className="w-full bg-white rounded-xl p-3 mt-6 shadow-md">
        <Video
          ref={videoRef}
          source={require('../../assets/videos/egzersiz.mp4')}
          style={{
            width: '100%',
            aspectRatio: 16 / 9,
            borderRadius: 12,
            backgroundColor: 'black',
          }}
          resizeMode="contain"
          controls
          repeat={false}
          onEnd={() => setVideoFinished(true)}
        />

        <Text className="text-center text-gray-700 mt-3">
          Bu video egzersiz hareketlerini öğrenmen için hazırlanmıştır.
        </Text>
      </View>

      {/* Dikkat listesi */}
      <View
        className="w-full mt-6 rounded-xl p-3"
        style={{backgroundColor: colors.background.primary}}>
        <Text className="text-lg font-semibold text-gray-800 mb-2">
          Dikkat Et:
        </Text>
        <Text className="text-gray-600 mb-1">✅ Sırtını dik tut</Text>
        <Text className="text-gray-600 mb-1">✅ Hareketleri yavaş yap</Text>
        <Text className="text-gray-600 mb-1">✅ Nefes kontrolünü unutma</Text>
      </View>

      {/* Progress Bar */}
      <View className="w-full h-2 bg-gray-300 rounded-full mt-6">
        <View
          style={{width: `${progressPercent}%`}}
          className="h-2 bg-blue-500 rounded-full"
        />
      </View>
      <Text className="text-sm text-gray-500 mt-1">
        {progressPercent}% tamamlandı
      </Text>

      {/* Motivasyon */}
      <Text className="italic text-gray-500 mt-4">
        Her adım, daha sağlıklı bir sen için. 💪
      </Text>

      {/* Sonraki egzersiz butonu */}
      <TouchableOpacity
        className="bg-blue-600 rounded-2xl px-10 py-3 mt-6 shadow-lg"
        // onPress={() => navigation.navigate('NextExercise')}
      >
        <Text className="text-white text-base">➡️ Sonraki Egzersiz</Text>
      </TouchableOpacity>

      {/* Bitirme mesajı */}
      {videoFinished && (
        <Text className="text-green-600 font-bold mt-4">
          Tebrikler, bu egzersizi tamamladın! 🎉
        </Text>
      )}

      {/* Sol alt slogan */}
      <Text className="absolute bottom-5 left-5 text-xs text-gray-500">
        Küçük adımlar, büyük fark yaratır.
      </Text>
    </View>
  );
};

export default Exercise1;
