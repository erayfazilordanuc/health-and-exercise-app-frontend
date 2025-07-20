import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ToastAndroid,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../../../themes/ThemeProvider';
import icons from '../../../constants/icons';
import {getAchievementsByUserId} from '../../../api/exercise/achievementService';
import {useUser} from '../../../contexts/UserContext';

const Achievements = () => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<ExercisesScreenNavigationProp>();

  const {user, setUser} = useUser();

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
          Başarımlar ve İlerleme
        </Text>
      </View>
      <View
        className="h-full pb-32 px-3 mt-3"
        style={{
          backgroundColor: colors.background.secondary,
        }}>
        <View
          className="px-4 pb-3 rounded-2xl"
          style={{backgroundColor: colors.background.primary}}>
          <Text className="pl-2 font-rubik text-2xl pt-3">Başarımlar</Text>
          {user?.achievements.map((a, index) => (
            <View
              key={index}
              className="px-2 py-3 rounded-2xl mt-3"
              style={{backgroundColor: colors.background.secondary}}>
              <Text className="pl-2 font-rubik text-xl">
                {a.exerciseDTO.name}
              </Text>
            </View>
          ))}
        </View>
        <View
          className="px-4 pb-3 rounded-2xl mt-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text className="pl-2 font-rubik text-2xl pt-3">
            Devam Eden Egzersiz İlerlemeleri
          </Text>
          {user?.achievements.map((a, index) => (
            <View
              key={index}
              className="px-2 py-3 rounded-2xl mt-3"
              style={{backgroundColor: colors.background.secondary}}>
              <Text className="pl-2 font-rubik text-xl">{a.id}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
};

export default Achievements;
