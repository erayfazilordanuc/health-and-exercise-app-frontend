import React, {useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  StyleSheet,
} from 'react-native';
import {useTheme} from '../../themes/ThemeProvider';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Video from 'react-native-video';
// import exercise from '../../assets/videos/egzersiz';

const Exercise1 = () => {
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const videoUri = 'https://www.w3schools.com/html/mov_bbb.mp4';

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

      return () => backHandler.remove(); // Ekrandan çıkınca event listener'ı kaldır
    }, []),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Egzersiz</Text>

      <View style={styles.card}>
        <Video
          // source={{uri: videoUri}}
          source={require('../../assets/videos/egzersiz.mp4')}
          style={styles.video}
          resizeMode="contain"
          controls
          repeat={false}
        />
        <Text style={styles.description}>
          Bu video egzersiz hareketlerini öğrenmen için hazırlanmıştır.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // çok açık gri
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 64,
    marginBottom: 16,
    color: '#1f2937', // koyu gri
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // android gölge
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: 'black',
    overflow: 'hidden',
  },
  description: {
    marginTop: 12,
    fontSize: 16,
    color: '#4b5563', // koyu gri
    textAlign: 'center',
  },
});

export default Exercise1;
