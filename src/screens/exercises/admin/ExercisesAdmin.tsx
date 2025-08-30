import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useTheme} from '../../../themes/ThemeProvider';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {getAllExercises} from '../../../api/exercise/exerciseService';
import LinearGradient from 'react-native-linear-gradient';
import {useAllExercises} from '../../../hooks/exerciseQueries';

const ExercisesAdmin = () => {
  const {colors, theme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  // const [exercises, setExercises] = useState<ExerciseDTO[]>([]);

  // const fetchAllExercises = async () => {
  //   setLoading(true);
  //   const exercises: ExerciseDTO[] = await getAllExercises();
  //   if (exercises.length > 0) setExercises(exercises);
  //   setLoading(false);
  // };

  // // useEffect(() => {
  // //   fetchAllExercises();
  // // }, []);

  // useFocusEffect(
  //   useCallback(() => {
  //     fetchAllExercises();
  //   }, []),
  // );

  const {
    data: exercises = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAllExercises();

  return (
    <>
      <LinearGradient
        colors={colors.gradient}
        start={{x: 0.1, y: 0}}
        end={{x: 0.9, y: 1}}
        className="absolute inset-0"
      />
      <View
        style={{
          backgroundColor: 'transparent', // colors.background.secondary,
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: insets.top * 1.3,
        }}>
        <Text
          className="pl-7 font-rubik-semibold"
          style={{
            color:
              theme.name === 'Light'
                ? colors.text.primary
                : colors.background.secondary,
            fontSize: 24,
          }}>
          Egzersizler
        </Text>
      </View>
      {!isLoading ? (
        <ScrollView
          className="h-full mb-16 px-3 mt-3"
          style={{
            backgroundColor: 'transparent', // colors.background.secondary,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                refetch();
                setRefreshing(false);
              }}
              progressBackgroundColor={colors.background.secondary}
              colors={[colors.primary[300]]} // Android (array!)
              tintColor={colors.primary[300]}
            />
          }>
          {exercises && exercises.length > 0 ? (
            exercises.map(exercise => (
              <TouchableOpacity
                key={exercise.id}
                className="flex flex-column rounded-2xl mb-3 px-4 py-3"
                style={{
                  backgroundColor: colors.background.primary,
                }}
                onPress={() => {
                  navigation.navigate('EditExercise', {exercise});
                }}>
                {/* Kapak görseli */}
                {/* {exercise.videos && exercise.videos.length > 0 && (
                <Image
                  source={{uri: exercise.videos[0].videoUrl}}
                  style={{
                    width: '100%',
                    height: 180,
                    borderRadius: 12,
                    marginBottom: 8,
                  }}
                  resizeMode="cover"
                />
              )} */}

                {/* Başlık */}
                <Text
                  className="font-rubik text-xl mb-2"
                  style={{color: colors.primary[200]}}>
                  {exercise.name}
                </Text>

                {/* Açıklama */}
                <Text
                  className="font-rubik text-md"
                  style={{color: colors.text.secondary}}>
                  {exercise.description!.length > 75
                    ? `${exercise.description!.substring(0, 75)}...`
                    : exercise.description}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View
              className="flex-1 items-center justify-center rounded-2xl mb-36 py-5"
              style={{
                backgroundColor: colors.background.secondary,
              }}>
              <Text
                className="font-rubik text-lg text-center"
                style={{color: colors.text.primary}}>
                Henüz bir egzersiz mevcut değil
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
            paddingTop: insets.top,
          }}
          className="mb-24">
          <ActivityIndicator size="large" color={colors.primary[200]} />
        </View>
      )}
      <View className="absolute bottom-24 right-3 items-center">
        <TouchableOpacity
          className="w-36 h-16 rounded-3xl flex items-center justify-center"
          style={{
            backgroundColor: colors.primary[200],
          }}
          onPress={() => {
            navigation.navigate('EditExercise', {exercise: null});
          }}>
          <Text
            className="font-rubik text-lg"
            style={{color: colors.background.secondary}}>
            Egzersiz Ekle
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default ExercisesAdmin;
