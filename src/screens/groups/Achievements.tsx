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
import {useTheme} from '../../themes/ThemeProvider';
import icons from '../../constants/icons';

type AchievementsRouteProp = RouteProp<GroupsStackParamList, 'Achievements'>;
const Achievements = () => {
  const insets = useSafeAreaInsets();
  const {params} = useRoute<AchievementsRouteProp>();
  const {member} = params;
  const {colors} = useTheme();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<ExercisesScreenNavigationProp>();

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
          Başarımlar ve Egzersiz İlerlemeleri
        </Text>
      </View>
      <View
        className="h-full pb-32 px-3 mt-3"
        style={{
          backgroundColor: colors.background.secondary,
        }}>
        <View
          className="px-5 py-3 rounded-2xl mb-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="font-rubik text-2xl mb-5"
            style={{color: colors.text.primary}}>
            Başarımlarım
          </Text>
          <View className="flex flex-row justify-between mb-4">
            <Text
              className="font-rubik text-xl"
              style={{color: colors.text.primary}}>
              Başarım 1
            </Text>
            <Image
              source={icons.badge1_colorful_bordered}
              className="size-8 mr-2"
            />
          </View>
        </View>
      </View>
    </>
  );
};

export default Achievements;
