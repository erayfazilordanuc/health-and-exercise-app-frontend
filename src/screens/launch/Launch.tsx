// Launch.tsx
import {useNavigation} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../../themes/ThemeProvider';
import {Theme, themes} from '../../themes/themes';
import {saveAndGetSymptoms} from '../../api/health/healthConnectService';

const {width, height} = Dimensions.get('window');

const Launch = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const {theme, colors, setTheme} = useTheme();
  const styles = stylesWithColor(colors);
  const navigation = useNavigation<RootScreenNavigationProp>();
  const windowHeight = Dimensions.get('window').height;
  const windowWidth = Dimensions.get('window').width;
  // const {user} = useGlobalContext();
  // TO DO burada global user nesnesi alsın ona göre yönlendirsin

  const checkToken = async () => {
    const userData = await AsyncStorage.getItem('user');
    const user: User = JSON.parse(userData!);

    if (user) {
      const defaultThemeJson = await AsyncStorage.getItem(
        `${user.username}-main-theme`,
      );
      if (defaultThemeJson) {
        const defaultTheme: Theme = defaultThemeJson
          ? JSON.parse(defaultThemeJson)
          : null;
        if (theme) {
          setTheme(defaultTheme);
        }
      }
    }

    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    if (accessToken || refreshToken || userData) {
      if (user.role === 'ROLE_USER') await saveAndGetSymptoms();
      navigation.navigate('App');
    } else {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   if (colorScheme == 'light') setTheme(themes.primary.light);
  //   else setTheme(themes.primary.dark);
  // }, [colorScheme]);

  useEffect(() => {
    checkToken();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator
          size="large"
          color={colors.primary[300] ?? colors.primary}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Üst sağ mavi dekor */}
      <View style={styles.topRightShape} />

      <Text
        className="font-rubik-bold text-4xl text-center"
        style={[styles.titleBlue, {paddingTop: windowHeight / 5}]}>
        EGZERSİZ TAKİP{'\n'}VE{'\n'}SAĞLIK
      </Text>
      <Text
        className="font-rubik-bold text-4xl text-center"
        style={[styles.titleBlack, {color: colors.text.primary}]}>
        Uygulamasına{'\n'}Hoş Geldiniz
      </Text>

      <TouchableOpacity
        className="px-6 py-3 rounded-2xl mb-2"
        style={{backgroundColor: colors.background.primary}}
        onPress={() => {
          navigation.navigate('UserLogin');
        }}>
        <Text
          className="text-xl font-rubik"
          style={{
            color: colors.text.primary,
          }}>
          Kullanıcı Girişi
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="px-6 py-3 rounded-2xl"
        style={{backgroundColor: colors.background.primary}}
        onPress={() => {
          navigation.navigate('AdminLogin');
        }}>
        <Text
          className="text-xl font-rubik"
          style={{
            color: colors.text.primary,
          }}>
          Hemşire Girişi
        </Text>
      </TouchableOpacity>

      {/* Alt sol mavi dekor */}
      <View style={styles.bottomLeftShape} />
      <View style={styles.bottomRightShape} />
      <Text style={styles.footerText}>Egzersiz takip ve sağlık uygulaması</Text>
    </SafeAreaView>
  );
};

const stylesWithColor = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.secondary,
      alignItems: 'center',
      paddingHorizontal: 20,
      position: 'relative',
    },
    center: {justifyContent: 'center', alignItems: 'center'},
    topRightShape: {
      position: 'absolute',
      top: -45,
      left: -100,
      width: width * 0.9,
      height: height * 0.22,
      backgroundColor: colors.primary[300],
      borderBottomRightRadius: 50,
      transform: [{rotate: '-35deg'}],
    },
    bottomLeftShape: {
      position: 'absolute',
      bottom: 0,
      right: 100,
      width: width * 1.2,
      height: height * 0.2,
      backgroundColor: '#7DC9FF',
      zIndex: 5,
      borderTopLeftRadius: 80,
      borderTopRightRadius: 80,
      transform: [{rotate: '40deg'}],
    },
    bottomRightShape: {
      position: 'absolute',
      bottom: -15,
      right: -100,
      width: width * 0.9,
      height: height * 0.2,
      backgroundColor: colors.primary[300],
      borderTopLeftRadius: 80,
      borderTopRightRadius: 80,
      transform: [{rotate: '-45deg'}],
    },
    titleBlue: {
      color: colors.primary[300],
    },
    titleBlack: {
      color: '#000',
      marginBottom: 30,
    },
    button: {
      backgroundColor: '#fff',
      paddingVertical: 12,
      paddingHorizontal: 40,
      borderRadius: 12,
      marginVertical: 10,
      elevation: 3,
    },
    footerText: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      fontSize: 12,
      color: 'black',
      zIndex: 10,
    },
  });

export default Launch;
