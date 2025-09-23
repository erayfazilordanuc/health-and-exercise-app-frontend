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
  ImageBackground,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../../themes/ThemeProvider';
import {parseTheme, Theme, themes} from '../../themes/themes';
import {checkHealthConnectAvailable} from '../../lib/health/healthConnectService';
import {useNotificationNavigation} from '../../hooks/useNotificationNavigation';
import {useUser} from '../../contexts/UserContext';
import {BlurView} from '@react-native-community/blur';
import NetInfo from '@react-native-community/netinfo';
import {getDbUser, getUser, updateAvatarApi} from '../../api/user/userService';

const {width, height} = Dimensions.get('window');

const Launch = () => {
  // useNotificationNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const {theme, colors, setTheme} = useTheme();
  const styles = stylesWithColor(colors);
  const navigation = useNavigation<RootScreenNavigationProp>();
  const windowHeight = Dimensions.get('window').height;
  const windowWidth = Dimensions.get('window').width;
  const {setUser} = useUser();
  // const {user} = useGlobalContext();
  // TO DO burada global user nesnesi alsın ona göre yönlendirsin

  const checkToken = async () => {
    console.log('1');
    const userJson = await AsyncStorage.getItem('user');
    let user;
    if (userJson) {
      user = JSON.parse(userJson);
      setUser(user);
    }
    console.log('user', user);

    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    console.log(accessToken, refreshToken);

    if ((!user && refreshToken) || (user && user.avatar === 'non')) {
      console.log('neden');
      const net = await NetInfo.fetch();
      if (net.isConnected) {
        if (user.role === 'ROLE_USER' && !user.groupId) {
          const dbUser = await getDbUser();
          if (dbUser) {
            user = dbUser;
            await AsyncStorage.setItem('user', JSON.stringify(user));
            setUser(user);
          }
        }
        await updateAvatarApi(user.avatar);
      }
    }
    console.log('user', user);

    if (user && user.theme) {
      const {color, mode, themeObj} = parseTheme(user.theme);
      if (color && themeObj) {
        if (mode === 'system') {
          setTheme(colorScheme === 'dark' ? themeObj.dark : themeObj.light);
        } else {
          setTheme(mode === 'dark' ? themeObj.dark : themeObj.light);
        }
      }
      console.log('user.theme', user.theme);
    } else
      setTheme(colorScheme === 'light' ? themes.blue.light : themes.blue.dark);

    console.log('aaaaay', user);

    // if (user) {
    //   const userThemeJson = await AsyncStorage.getItem(
    //     `${user.username}-main-theme`,
    //   );
    //   setUser(user);
    //   if (userThemeJson) {
    //     const userTheme: UserTheme = userThemeJson
    //       ? JSON.parse(userThemeJson)
    //       : null;
    //     if (theme) {
    //       setTheme(userTheme.theme);
    //     }
    //   } else {
    //     const newUserTheme: UserTheme = {
    //       theme:
    //         colorScheme === 'dark' ? themes.blue.dark : themes.blue.light,
    //       isDefault: true,
    //     };
    //     setTheme(
    //       colorScheme === 'dark' ? themes.blue.dark : themes.blue.light,
    //     );
    //     await AsyncStorage.setItem(
    //       `${user!.username}-main-theme`,
    //       JSON.stringify(newUserTheme),
    //     );
    //   }
    // }

    if (accessToken || refreshToken || user) {
      // if (user.role === 'ROLE_USER') {
      //   console.log('bura59');
      //   const isHealthConnectInstalled = await checkHealthConnectAvailable();
      //   // if (isHealthConnectInstalled) await saveSymptoms();
      //   console.log('bura62');
      // }
      // await SessionManager.init(user.id, DeviceInfo.getVersion(), DeviceInfo.getModel());
      // await SessionManager.stopSession('logout');
      navigation.navigate('App');
    }
    // TO DO TEST else yi kaldırıp deneyebilirsin
    else {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   if (colorScheme == 'light') setTheme(themes.blue.light);
  //   else setTheme(themes.blue.dark);
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
      <ImageBackground
        source={require('../../assets/images/bubbles_blue_low_launch.png')}
        resizeMode="cover"
        className="absolute inset-0"
      />
      <BlurView
        blurType="light"
        blurAmount={30}
        reducedTransparencyFallbackColor="white"
        pointerEvents="none"
        style={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 0}}
      />
      {/* Üst sağ mavi dekor */}
      <View style={styles.topRightShape} />
      <Text
        className="font-rubik-bold text-center"
        style={[
          // styles.titleBlue,
          {
            color: '#404040',
            paddingTop: windowHeight / 4,
            fontSize: 40,
          },
        ]}>
        HopeMove
      </Text>
      <Text
        className="font-rubik-semibold text-xl text-center mt-4"
        style={[styles.titleBlack, {color: '#404040'}]}>
        With HopeMove, we monitor your activity under the guidance of a nurse
        and support your recovery process with hope.
      </Text>
      <TouchableOpacity
        className="px-6 py-3 rounded-2xl mb-2"
        style={{
          backgroundColor: theme.colors.isLight
            ? colors.background.primary
            : '#333333',
        }}
        onPress={() => {
          navigation.navigate('UserLogin');
        }}>
        <Text
          className="text-xl font-rubik"
          style={{
            color: colors.text.primary,
          }}>
          User Login
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="px-6 py-3 rounded-2xl"
        style={{
          backgroundColor: theme.colors.isLight
            ? colors.background.primary
            : '#333333',
        }}
        onPress={() => {
          navigation.navigate('AdminLogin');
        }}>
        <Text
          className="text-xl font-rubik"
          style={{
            color: colors.text.primary,
          }}>
          Nurse Login
        </Text>
      </TouchableOpacity>
      {/* Alt sol mavi dekor */}
      <View style={styles.bottomLeftShape} />
      <View style={styles.bottomRightShape} />
      <Text style={styles.footerText}>Exercise tracking and health app</Text>
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
