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
  PermissionsAndroid,
  Modal,
  InteractionManager,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../../../themes/ThemeProvider';
import icons from '../../../constants/icons';
import Video from 'react-native-video';
// import VideoPlayer from 'react-native-video-controls';
import VideoPlayer from 'react-native-video-player';
import {
  addVideoToExercise,
  createExercise,
  deleteExercise,
  deleteVideoFromExercise,
  getPresignedUrl,
  updateExercise,
  uploadVideoToS3,
} from '../../../api/exercise/exerciseService';
import {Asset, launchImageLibrary} from 'react-native-image-picker';
import {BlurView} from '@react-native-community/blur';
import * as Progress from 'react-native-progress';
import CustomAlert from '../../../components/CustomAlert';
import {createThumbnail} from 'react-native-create-thumbnail';

type EditExerciseRouteProp = RouteProp<ExercisesStackParamList, 'EditExercise'>;
const EditExercise = () => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<ExercisesScreenNavigationProp>();

  const {params} = useRoute<EditExerciseRouteProp>();
  const {exercise} = params;
  const makeEmptyExercise = (): ExerciseDTO => ({
    id: null,
    name: null,
    description: null,
    point: null,
    videos: [],
    adminId: null,
    createdAt: null,
    updatedAt: null,
  });
  const [editedExercise, setEditedExercise] = useState<ExerciseDTO>(
    exercise ?? makeEmptyExercise(),
  );

  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [pendingVideos, setPendingVideos] = useState<Asset[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);

  const [uploadingVideoIndex, setUploadingVideoIndex] = useState(1);
  const [videoUploadPercent, setVideoUploadPercent] = useState(0);
  const [isVideoUploadModalVisible, setIsVideoUploadModalVisible] =
    useState(false);

  const [isDeleteVideoModalVisible, setIsDeleteVideoModalVisible] =
    useState(false);

  const [isDeleteExerciseModalVisible, setIsDeleteExerciseModalVisible] =
    useState(false);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(60);

  const onSaveExercise = async () => {
    if (
      !editedExercise.name ||
      !editedExercise.description ||
      !editedExercise.point
    ) {
      ToastAndroid.show('Lütfen tüm boşlukları doldurun', ToastAndroid.LONG);
      return;
    }

    setLoading(true);

    let snapExerciseId = editedExercise.id;

    if (!exercise && !editedExercise.id) {
      const createExerciseDTO: CreateExerciseDTO = {
        name: editedExercise.name,
        description: editedExercise.description,
        point: editedExercise.point,
      };

      try {
        const createdExerciseDTO: ExerciseDTO = await createExercise(
          createExerciseDTO,
        );

        if (createdExerciseDTO) {
          snapExerciseId = createdExerciseDTO.id!;
          setEditedExercise(createdExerciseDTO);
        }
      } catch (error) {
        ToastAndroid.show('Bir hata oluştu', ToastAndroid.LONG);
      }
    } else {
      if (JSON.stringify(exercise) !== JSON.stringify(editedExercise)) {
        const updateExerciseDTO: UpdateExerciseDTO = {
          name: editedExercise.name,
          description: editedExercise.description,
          point: editedExercise.point,
        };

        try {
          const updatedExerciseDTO: ExerciseDTO = await updateExercise(
            editedExercise.id!,
            updateExerciseDTO,
          );

          if (updatedExerciseDTO) {
            snapExerciseId = updatedExerciseDTO.id!;
            setEditedExercise(updatedExerciseDTO);
          }
        } catch (error) {
          ToastAndroid.show('Bir hata oluştu', ToastAndroid.LONG);
        }
      }
    }

    if (pendingVideos.length) {
      setIsVideoUploadModalVisible(true);
      for (let idx = 0; idx < pendingVideos.length; idx++) {
        const video = pendingVideos[idx];

        setUploadingVideoIndex(idx);
        setVideoUploadPercent(0); // ← reset

        const presigned = await getPresignedUrl(
          snapExerciseId!,
          video.fileName!,
        );

        const publicUrl = await uploadVideoToS3(presigned, video, pct =>
          setVideoUploadPercent(pct),
        );

        console.log('public url', publicUrl);

        try {
          const updatedExercise: ExerciseDTO = await addVideoToExercise(
            snapExerciseId!,
            publicUrl,
          );
          setEditedExercise(updatedExercise);
        } catch (e) {
          setPendingVideos(prev =>
            prev.filter(v => v.fileName !== video.fileName),
          );
          console.log('video upload error', e);
          ToastAndroid.show('Video yüklenemedi', ToastAndroid.LONG);
        }
      }

      setPendingVideos([]);
      setIsVideoUploadModalVisible(false);
      setUploadingVideoIndex(1);
      setVideoUploadPercent(0);
    }

    ToastAndroid.show('Egzersiz başarıyla kaydedildi', ToastAndroid.LONG);
    setLoading(false);
  };

  const requestVideoPerm = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    const perm =
      Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

    const alreadyGranted = await PermissionsAndroid.check(perm);
    if (alreadyGranted) return true;

    const granted = await PermissionsAndroid.request(perm, {
      title: 'Video Erişimi',
      message: 'Uygulamanın galerinizdeki videolara erişmesine izin verin.',
      buttonPositive: 'Tamam',
      buttonNegative: 'İptal',
    });

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const isDuplicateVideo = (file: Asset): boolean => {
    const alreadyUploaded = editedExercise.videos?.some(v =>
      v.videoUrl?.endsWith(file.fileName || ''),
    );

    const alreadyPending = pendingVideos.some(
      v => v.fileName === file.fileName,
    );

    return alreadyUploaded || alreadyPending;
  };

  const pickVideo = (): Promise<Asset | null> =>
    new Promise(resolve => {
      launchImageLibrary(
        {
          mediaType: 'video',
          quality: 1,
          videoQuality: 'high',
        },
        res => {
          if (res.didCancel || !res.assets?.length) return resolve(null);
          resolve(res.assets[0]);
        },
      );
    });

  const onAddVideo = async () => {
    try {
      const ok = await requestVideoPerm();
      if (!ok) {
        ToastAndroid.show('Videolara erişim reddedildi', ToastAndroid.LONG);
        return;
      }

      setVideoLoading(true);
      const picked = await pickVideo();
      if (!picked) return;

      if (isDuplicateVideo(picked)) {
        console.error('⚠️ Bu video zaten listede:', picked.fileName);
        ToastAndroid.show('Bu video zaten ekli', ToastAndroid.LONG);
        throw new Error('Duplicate video');
      }

      setPendingVideos(prev => [...prev, picked]);
    } catch (e) {
      console.warn('Video seçilemedi', e);
    } finally {
      setVideoLoading(false);
    }
  };

  const onDeletePendingVideo = async (idx: number) => {
    setPendingVideos(prev => prev.filter((_, i) => i !== idx));
  };

  const onDeleteVideoFromExercise = async (videoUrl: string) => {
    try {
      if (editedExercise.id)
        await deleteVideoFromExercise(editedExercise.id, videoUrl);
    } catch (e) {
      console.warn('Video silinemedi', e);
    }
  };

  const onDeleteExercise = async () => {
    try {
      if (editedExercise.id) {
        const response = await deleteExercise(editedExercise.id);
        if (response) {
          navigation.navigate('ExercisesAdmin');
        }
      }
    } catch (e) {
      console.warn('Video silinemedi', e);
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadSequential = async () => {
      if (!exercise?.videos?.length) return;

      // İçerik etkileşimi bitsin, sonra başla
      await new Promise<void>(res =>
        InteractionManager.runAfterInteractions(() => res()),
      );

      for (const v of exercise.videos) {
        if (!isActive) break;
        if (thumbs[v.videoUrl]) continue; // zaten var
        try {
          const {path} = await createThumbnail({
            url: v.videoUrl,
            timeStamp: 1000,
            format: 'jpeg',
            maxWidth: 512,
          });
          if (!isActive) break;
          // anında state'e ekle – merge costu küçük
          setThumbs(prev => ({...prev, [v.videoUrl]: path}));
        } catch (err) {
          console.warn('[thumb] failed', (err as Error).message);
        }
      }
    };

    loadSequential();

    return () => {
      isActive = false;
    };
  }, [editedExercise.videos]);

  return (
    <>
      <View
        className="flex flex-row"
        style={{
          backgroundColor: colors.background.secondary,
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingTop: insets.top * 1.4,
        }}>
        <Text
          className="pl-7 font-rubik-semibold"
          style={{
            color: colors.text.primary,
            fontSize: 24,
          }}>
          Egzersiz Düzenle
        </Text>
        {!loading ? (
          <TouchableOpacity
            className="py-2 px-4 rounded-2xl mr-6"
            style={{backgroundColor: '#16d750'}}
            onPress={onSaveExercise}>
            <Text
              className="text-lg font-rubik"
              style={{color: colors.background.secondary}}>
              Kaydet
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            className="py-2 px-4 rounded-2xl mr-6"
            style={{backgroundColor: '#16d750'}}>
            <ActivityIndicator
              className="self-center"
              size="small"
              color={colors.background.secondary}
            />
          </View>
        )}
      </View>

      <ScrollView
        className="px-3 mt-3"
        style={{backgroundColor: colors.background.secondary}}
        contentContainerStyle={{paddingBottom: 60, flexGrow: 1}}
        keyboardShouldPersistTaps="handled">
        <View
          className="px-5 py-3 rounded-2xl mb-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="font-rubik text-2xl mb-3"
            style={{color: colors.text.primary}}>
            Egzersiz İsmi
          </Text>
          <View
            className="flex flex-row justify-between mb-1 rounded-2xl pl-3"
            style={{
              backgroundColor: colors.background.secondary,
            }}>
            <TextInput
              value={editedExercise.name ? editedExercise.name : ''}
              placeholder="İsim girin"
              placeholderTextColor="gray"
              onChangeText={text =>
                setEditedExercise(prev => ({...prev!, name: text}))
              }
              selectionColor={'#7AADFF'}
              className="flex-1 font-rubik text-xl rounded-2xl"
              style={{
                backgroundColor: colors.background.secondary,
                color: colors.text.primary,
              }}
            />
          </View>
        </View>

        <View
          className="px-5 py-3 rounded-2xl mb-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="font-rubik text-2xl mb-3"
            style={{color: colors.text.primary}}>
            Egzersiz Açıklaması
          </Text>
          <View
            className="flex flex-row justify-between mb-1 rounded-2xl pl-3"
            style={{
              backgroundColor: colors.background.secondary,
            }}>
            <TextInput
              value={
                editedExercise.description ? editedExercise.description : ''
              }
              multiline
              placeholder="Açıklama girin"
              placeholderTextColor="gray"
              onChangeText={text =>
                setEditedExercise(prev => ({...prev!, description: text}))
              }
              selectionColor={'#7AADFF'}
              className="flex-1 font-rubik text-xl rounded-2xl"
              style={{
                backgroundColor: colors.background.secondary,
                color: colors.text.primary,
              }}
            />
          </View>
        </View>

        <View
          className="px-5 py-3 rounded-2xl mb-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="font-rubik text-2xl mb-3"
            style={{color: colors.text.primary}}>
            Egzersiz Puanı
          </Text>
          <View
            className="flex flex-row justify-between mb-1 rounded-2xl pl-3"
            style={{
              backgroundColor: colors.background.secondary,
            }}>
            <TextInput
              value={
                editedExercise.point ? editedExercise.point.toString() : ''
              }
              placeholder="Puan giriniz"
              placeholderTextColor="gray"
              onChangeText={text =>
                setEditedExercise(prev => ({...prev!, point: parseInt(text)}))
              }
              selectionColor={'#7AADFF'}
              className="flex-1 font-rubik text-xl rounded-2xl"
              style={{
                backgroundColor: colors.background.secondary,
                color: colors.text.primary,
              }}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View
          className="px-5 pt-3 rounded-2xl mb-3"
          style={{backgroundColor: colors.background.primary}}>
          <Text
            className="font-rubik text-2xl mb-3"
            style={{color: colors.text.primary}}>
            Egzersiz Videoları
          </Text>

          {editedExercise?.videos &&
            editedExercise.videos.length > 0 &&
            editedExercise.videos.map((video, index) => (
              <View
                key={index}
                className="w-full rounded-xl p-3 mb-3"
                style={{backgroundColor: colors.background.secondary}}>
                <VideoPlayer
                  source={{uri: video.videoUrl}}
                  autoplay={false}
                  style={{
                    width: '100%',
                    aspectRatio: 16 / 9,
                    backgroundColor: 'white',
                  }}
                  thumbnail={
                    thumbs[video.videoUrl]
                      ? {uri: thumbs[video.videoUrl]}
                      : icons.gymnastic
                  }
                  customStyles={{
                    videoWrapper: {borderRadius: 10},
                    controlButton: {opacity: 0.9},
                    thumbnail: {
                      borderRadius: 15,
                      width: 80,
                      height: 80,
                      alignSelf: 'center',
                      justifyContent: 'center',
                    },
                    thumbnailImage: {
                      width: '100%',
                      height: '100%',
                      resizeMode: 'cover',
                    },
                  }}
                />

                <View className="flex flex-row justify-between items-center px-5 mt-3">
                  <Text
                    className="font-rubik text-center text-md"
                    style={{color: colors.text.primary}}>
                    Video {index + 1}
                  </Text>
                  <TouchableOpacity
                    className="px-4 py-1 rounded-xl"
                    style={{
                      backgroundColor: '#fd5353',
                    }}
                    onPress={() => setIsDeleteVideoModalVisible(true)}>
                    <Text
                      className="font-rubik text-center text-md"
                      style={{color: colors.background.secondary}}>
                      Sil
                    </Text>
                  </TouchableOpacity>
                </View>
                <CustomAlert
                  message={'Videoyu silmek istediğinize emin misiniz?'}
                  visible={isDeleteVideoModalVisible}
                  onYes={() => {
                    onDeleteVideoFromExercise(video.videoUrl);
                    setIsDeleteVideoModalVisible(false);
                  }}
                  onCancel={() => {
                    setIsDeleteVideoModalVisible(false);
                  }}
                />
              </View>
            ))}
          {pendingVideos.map((video, index) => (
            <View
              key={index}
              className="w-full rounded-xl p-3 mb-3"
              style={{backgroundColor: colors.background.secondary}}>
              <VideoPlayer
                source={{uri: video.originalPath}}
                autoplay={false}
                style={{
                  width: '100%',
                  aspectRatio: 16 / 9,
                  backgroundColor: 'white',
                }}
                thumbnail={icons.gymnastic}
                customStyles={{
                  videoWrapper: {borderRadius: 10},
                  controlButton: {opacity: 0.9},
                  thumbnail: {
                    borderRadius: 15,
                    width: 80,
                    height: 80,
                    alignSelf: 'center',
                    justifyContent: 'center',
                  },
                }}
              />

              <View className="flex flex-row justify-between items-center px-5 mt-3">
                <Text
                  className="font-rubik text-center text-md"
                  style={{color: colors.text.primary}}>
                  Yeni Video
                </Text>
                <TouchableOpacity
                  className="px-4 py-1 rounded-xl"
                  style={{
                    backgroundColor: '#fd5353',
                  }}
                  onPress={() => onDeletePendingVideo(index)}>
                  <Text
                    className="font-rubik text-center text-md"
                    style={{color: colors.background.secondary}}>
                    Sil
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {!videoLoading ? (
            <TouchableOpacity
              className="flex flex-row self-start rounded-xl p-3 mb-4 items-center justify-start"
              style={{backgroundColor: colors.background.secondary}}
              onPress={onAddVideo}>
              <Text className="font-rubik text-md pl-1">Video ekle</Text>
              <Image
                source={icons.plus_sign}
                tintColor={colors.text.primary}
                className="size-5 ml-2"
              />
            </TouchableOpacity>
          ) : (
            <View
              className="flex flex-row self-start rounded-xl py-3 px-12 mb-4 items-center justify-start"
              style={{backgroundColor: colors.background.secondary}}>
              <ActivityIndicator
                className="self-center"
                size="small"
                color={colors.text.primary}
              />
            </View>
          )}
        </View>
        <TouchableOpacity
          className="self-center rounded-xl p-3 mb-4"
          style={{backgroundColor: '#fd5353'}}
          onPress={() => setIsDeleteExerciseModalVisible(true)}>
          <Text
            className="font-rubik text-md pl-1"
            style={{color: colors.background.secondary}}>
            Egzersizi Sil
          </Text>
        </TouchableOpacity>
        <Modal
          transparent
          visible={isVideoUploadModalVisible}
          animationType="fade"
          onRequestClose={() => {}}>
          <BlurView
            style={{flex: 1}}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(0,0,0,0.6)">
            <View className="flex-1 justify-center items-center">
              <View
                className="w-11/12 max-w-lg rounded-3xl p-6 items-center"
                style={{
                  backgroundColor: colors.background.primary,
                  shadowColor: '#000',
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 10,
                }}>
                <Text
                  className="font-rubik-semibold text-2xl mb-4 text-center"
                  style={{color: colors.primary[200]}}>
                  Videolar Kaydediliyor
                </Text>

                <Text
                  className="font-rubik text-lg mb-2"
                  style={{color: colors.text.primary}}>
                  Video {uploadingVideoIndex + 1} / {pendingVideos.length}
                </Text>

                <Text
                  className="font-rubik-bold text-3xl mt-1 mb-3"
                  style={{color: colors.primary[200]}}>
                  %{videoUploadPercent}
                </Text>

                <View className="w-full items-center mb-4">
                  <Progress.Bar
                    progress={videoUploadPercent / 100}
                    width={150}
                    color={colors.primary[200]}
                    height={8}
                    borderRadius={4}
                  />
                </View>

                <Text
                  className="font-rubik text-sm text-center"
                  style={{color: colors.text.third}}>
                  Lütfen ekrandan ayrılmayınız
                </Text>
              </View>
            </View>
          </BlurView>
        </Modal>

        <CustomAlert
          message={'Egzersizi silmek istediğinize emin misiniz?'}
          visible={isDeleteExerciseModalVisible}
          onYes={() => {
            onDeleteExercise();
            setIsDeleteExerciseModalVisible(false);
          }}
          onCancel={() => {
            setIsDeleteExerciseModalVisible(false);
          }}
        />
      </ScrollView>
    </>
  );
};

export default EditExercise;
