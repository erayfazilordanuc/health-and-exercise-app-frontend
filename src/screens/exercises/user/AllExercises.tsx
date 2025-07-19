import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {useTheme} from '../../../themes/ThemeProvider';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {getAllExercises} from '../../../api/exercise/exerciseService';

const AllExercises = () => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const [exercises, setExercises] = useState<ExerciseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const fetchAllExercises = async () => {
    setLoading(true);
    const exercises: ExerciseDTO[] = await getAllExercises();
    if (exercises.length > 0) setExercises(exercises);
    setLoading(false);
  };

  // useEffect(() => {
  //   fetchAllExercises();
  // }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllExercises();
    }, []),
  );

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
          Tüm Egzersizler
        </Text>
      </View>
      {!loading ? (
        <ScrollView
          className="h-full mb-16 px-3 mt-3"
          style={{
            backgroundColor: colors.background.secondary,
          }}>
          {exercises && exercises.length > 0 ? (
            exercises.map(exercise => (
              <TouchableOpacity
                key={exercise.id}
                className="flex flex-column rounded-2xl mb-3 px-4 py-3"
                style={{
                  backgroundColor: colors.background.primary,
                }}
                onPress={() => {
                  navigation.navigate('Exercise', {exercise});
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
              className="flex-1 items-center justify-center rounded-2xl mb-36"
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
            backgroundColor: colors.background.secondary,
            paddingTop: insets.top,
          }}
          className="mb-24">
          <ActivityIndicator size="large" color={colors.primary[200]} />
        </View>
      )}
    </>
  );
};

export default AllExercises;
