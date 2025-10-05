import {
  View,
  Text,
  TextInput,
  Image,
  BackHandler,
  TouchableOpacity,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
  ToastAndroid,
  Dimensions,
  Switch,
  ScrollView,
} from 'react-native';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../src/themes/ThemeProvider';
import icons from '../../../src/constants/icons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {
  createGroup,
  deleteJoinGroupRequest,
  getAllGroups,
  getGroupAdmin,
  getGroupRequestsByUserId,
  getGroupsByAdmin,
  sendJoinGroupRequest,
} from '../../api/group/groupService';
import {getDbUser, getUser, updateUser} from '../../api/user/userService';
import {color} from 'react-native-elements/dist/helpers';
import {useUser} from '../../contexts/UserContext';
import CustomAlertSingleton, {
  CustomAlertSingletonHandle,
} from '../../components/CustomAlertSingleton';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {useTranslation} from 'react-i18next';

const Groups = () => {
  const {colors, theme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const {t} = useTranslation('groups');
  const {t: c} = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const {user, setUser} = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [exerciseEnabled, setExerciseEnabled] = useState(true);
  const [groupToJoin, setGroupToJoin] = useState<Group>();
  const [groupJoinRequest, setGroupJoinRequest] = useState<GroupRequestDTO>();
  const [requestedGroupAdmin, setRequestedGroupAdmin] = useState<User>();
  const alertRef = useRef<CustomAlertSingletonHandle>(null);

  const {height} = Dimensions.get('screen');
  const onCreateGroup = async () => {
    setLoading(true);

    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      ToastAndroid.show(t('toasts.createFailed'), ToastAndroid.LONG);
      return;
    }

    if (user) {
      const createGroupDTO: CreateGroupDTO = {
        name: newGroupName.trim(),
        adminId: user.id!,
        exerciseEnabled: exerciseEnabled,
      };

      const response = await createGroup(createGroupDTO);
      if (response.status === 200) {
        setIsCreateModalVisible(false);
        setTimeout(() => {
          navigation.replace('Group', {groupId: response.data.id});
        }, 250);
      }
    }
    setLoading(false);
  };

  const onGroupJoinRequest = async () => {
    setLoading(true);
    if (user && groupToJoin && groupToJoin.id) {
      const response = await sendJoinGroupRequest(groupToJoin.id);
      if (response.status === 200) {
        ToastAndroid.show(t('toasts.joinRequestSent'), ToastAndroid.SHORT);
        fetchRequest(user.id!);
        setIsJoinModalVisible(false);
        setLoading(false);
      }
    }
  };

  const onDeleteJoinRequest = async () => {
    alertRef.current?.show({
      message: t('alerts.cancelJoin'),
      // secondMessage: 'Bu işlem geri alınamaz.',
      isPositive: false,
      onYesText: t('buttons.yes'),
      onCancelText: t('buttons.no'),
      onYes: async () => {
        if (groupJoinRequest) {
          const response = await deleteJoinGroupRequest(groupJoinRequest.id!);
          if (response.status === 200) {
            setGroupJoinRequest(undefined);
            setRequestedGroupAdmin(undefined);
            ToastAndroid.show(
              t('toasts.joinRequestCanceled'),
              ToastAndroid.SHORT,
            );
          }
        }
      },
      onCancel: () => console.log('❌ İPTAL'),
    });
  };

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        navigation.navigate('Home');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove(); // Ekrandan çıkınca event listener'ı kaldır
    }, []),
  );

  const fetchRequest = async (userId: number) => {
    const groupRequestsResponse = await getGroupRequestsByUserId(userId);
    if (
      groupRequestsResponse.status >= 200 &&
      groupRequestsResponse.status < 300 &&
      groupRequestsResponse.data
    ) {
      setGroupJoinRequest(groupRequestsResponse.data);
      console.log('aaaaaaaaaaa', groupRequestsResponse.data);
      const admin = await getGroupAdmin(groupRequestsResponse.data.groupDTO.id);
      if (admin) setRequestedGroupAdmin(admin);
      // return;
    }
  };

  const fetchRequestsAndGroups = async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (user.role === 'ROLE_USER') {
        fetchRequest(user.id!);
        const response = await getAllGroups();
        if (response) {
          setGroups(response.data);
          // if (user) {
          //   const myGroup =
          //     (response.data as Group[]).find(g => g.id === user.groupId) || null;
          // }
        }
      } else if (user.id) {
        const response =
          user.username === 'ordanuc'
            ? await getAllGroups()
            : await getGroupsByAdmin(user.id);
        if (response) {
          setGroups(response.data);
          // if (user) {
          //   const myGroup =
          //     (response.data as Group[]).find(g => g.id === user.groupId) || null;
          // }
        }
      }
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequestsAndGroups();
    }, [user]),
  );

  const triedOnThisFocusRef = useRef(false);

  // getUser: user'a bağımlı OLMASIN; setUser/navigation yeterli
  const getUser = useCallback(async () => {
    const net = await NetInfo.fetch();
    if (!net.isConnected) return;

    const dbUser = await getDbUser();
    if (!dbUser) return;

    // sadece değişiklik varsa güncelle
    if (
      !user ||
      user.id !== dbUser.id ||
      user.groupId !== dbUser.groupId ||
      user.role !== dbUser.role
    ) {
      setUser(dbUser); // doğrudan obje ver
      if (dbUser.groupId)
        navigation.replace('Group', {groupId: dbUser.groupId});
    }

    await AsyncStorage.setItem('user', JSON.stringify(dbUser));
  }, [setUser, navigation, user]); // burada user kalabilir; istersen ref'le de okuyabilirsin

  useFocusEffect(
    useCallback(() => {
      // her focus'ta sıfır başla
      triedOnThisFocusRef.current = false;

      if (!triedOnThisFocusRef.current) {
        triedOnThisFocusRef.current = true;

        // Koşullar uygunsa sadece 1 kez çalıştır
        if (user && user.role === 'ROLE_USER' && !user.groupId) {
          if (!user.groupId) getUser();
          else navigation.replace('Group', {groupId: user.groupId});
        }
      }

      // blur olduğunda reset; böylece sonraki focus'ta yine 1 kez çalışır
      return () => {
        triedOnThisFocusRef.current = false;
      };
    }, [getUser, user?.id, user?.role, user?.groupId]),
  );

  const renderItem = ({item}: {item: Group}) => (
    <View
      className="flex flex-col mt-3 rounded-2xl p-4 active:bg-blue-600/20"
      style={{backgroundColor: colors.background.secondary}}>
      <View className="flex flex-row justify-between">
        <Text
          className="text-2xl font-semibold dark:text-blue-300 ml-1"
          style={{color: colors.primary[200]}}>
          {item.name}
        </Text>
        {user && user.role === 'ROLE_USER' && !groupJoinRequest && (
          <TouchableOpacity
            className="px-4 rounded-2xl"
            style={{
              paddingVertical: 10,
              backgroundColor: colors.background.primary,
            }}
            onPress={() => {
              setGroupToJoin(item);
              setIsJoinModalVisible(true);
            }}>
            <Text
              className="text-lg font-rubik-medium"
              style={{color: '#55CC88'}}>
              {t('buttons.join')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {/* <Text
        className="text-md font-semibold dark:text-blue-300 ml-1"
        style={{color: colors.primary[200]}}>
        {item.name}
      </Text> */}
    </View>
  );

  return (
    <View className="flex-1">
      <LinearGradient
        colors={colors.gradient}
        locations={[0.15, 0.25, 0.7, 1]}
        start={{x: 0.1, y: 0}}
        end={{x: 0.8, y: 1}}
        className="absolute top-0 left-0 right-0 bottom-0"
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
            color: theme.colors.isLight ? '#333333' : colors.background.primary,
            fontSize: 24,
          }}>
          {t('titles.groups')}
        </Text>
      </View>
      <ScrollView
        className="h-full px-3 pt-3"
        style={{
          paddingBottom: insets.bottom + 120,
          backgroundColor: 'transparent', // colors.background.secondary,
          // paddingTop: insets.top / 2,
        }}>
        {groupJoinRequest && (
          <View
            className="mb-3 pt-2 pb-3 rounded-2xl flex flex-col items-center justify-center"
            style={{backgroundColor: colors.background.primary}}>
            <Text
              className="font-rubik-medium Ftext-center"
              style={{color: colors.text.primary, fontSize: 20}}>
              {t('request.cardTitle')}
            </Text>
            <View
              className="rounded-2xl mt-1 py-3 px-5"
              style={{backgroundColor: colors.background.secondary}}>
              <View className="flex flex-row">
                <Text
                  className="font-rubik-medium text-xl text-center"
                  style={{color: colors.text.primary}}>
                  {t('request.group')}{' '}
                </Text>
                <Text
                  className="font-rubik text-xl text-center"
                  style={{color: colors.text.primary}}>
                  {groupJoinRequest.groupDTO.name}
                </Text>
              </View>
              <View className="flex flex-row">
                <Text
                  className="font-rubik-medium text-xl text-center"
                  style={{color: colors.text.primary}}>
                  {t('request.nurse')}{' '}
                </Text>
                <Text
                  className="font-rubik text-xl text-center"
                  style={{color: colors.text.primary}}>
                  {requestedGroupAdmin?.fullName}
                </Text>
              </View>
              <View className="flex flex-row">
                <Text
                  className="font-rubik-medium text-xl text-center"
                  style={{color: colors.text.primary}}>
                  {t('request.status')}{' '}
                </Text>
                <Text
                  className="font-rubik text-xl text-center"
                  style={{color: colors.text.primary}}>
                  {t('request.pending')}
                </Text>
              </View>
              <TouchableOpacity
                className="px-4 py-1 mt-3 rounded-xl self-center"
                style={{
                  backgroundColor: '#fd5353',
                }}
                onPress={() => onDeleteJoinRequest()}>
                <Text
                  className="font-rubik text-center text-md"
                  style={{color: colors.background.secondary}}>
                  {t('request.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {user && user.role === 'ROLE_USER' && (
          <View
            className="p-3 rounded-2xl mb-32"
            style={{backgroundColor: colors.background.primary}}>
            <View className="flex flex-row justify-center items-center">
              <View
                className="flex flex-row justify-between items-center rounded-2xl w-3/4" // border
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.primary[300],
                }}>
                <Image source={icons.search} className="size-6 ml-4 mr-2" />
                <TextInput
                  className="flex-1 font-rubik w-full"
                  style={{color: colors.text.primary}}
                  multiline={false}
                  placeholder={t('search.placeholder')}
                  placeholderClassName="pl-4"
                  placeholderTextColor={colors.text.secondary}
                  selectionColor={colors.primary[300]}
                />
              </View>
            </View>

            <View>
              <FlatList
                data={groups}
                keyExtractor={item => (item.id ? item.id.toString() : '')}
                renderItem={renderItem}
                // ListEmptyComponent={
                //   <Text className="text-center text-zinc-400">
                //     Henüz bir grup yok
                //   </Text>
                // }
              />
            </View>
          </View>
        )}

        {user &&
          user.role === 'ROLE_ADMIN' &&
          (loading ? (
            <View
              style={{
                marginTop: height / 3,
              }}>
              <ActivityIndicator
                className="mt-2 self-center"
                size="large"
                color={'#474747'}
              />
            </View>
          ) : (
            <View
              className="px-4 pb-4 pt-3 rounded-2xl mb-32"
              style={{backgroundColor: colors.background.primary}}>
              {/* <View className="flex flex-row justify-center items-center">
              <View
                className="flex flex-row justify-between items-center rounded-2xl w-3/4" // border
                style={{
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.primary[300],
                }}>
                <Image source={icons.search} className="size-6 ml-4 mr-2" />
                <TextInput
                  className="flex-1 font-rubik w-full"
                  style={{color: colors.text.primary}}
                  multiline={false}
                  placeholder="Grupları ara"
                  placeholderClassName="pl-4"
                  placeholderTextColor={colors.text.secondary}
                  selectionColor={colors.primary[300]}
                />
              </View>
            </View> */}
              <Text
                className="text-2xl font-rubik mb-1 ml-1"
                style={{color: colors.text.primary}}>
                {t('admin.myGroups')}
              </Text>
              {groups.length > 0 ? (
                groups.map((group: Group, index) => (
                  <TouchableOpacity
                    key={index}
                    className="flex flex-row items-center justify-between mt-3"
                    style={{
                      padding: 15,
                      borderRadius: 15,
                      backgroundColor: colors.background.secondary,
                    }}
                    onPress={() =>
                      navigation.navigate('Group', {groupId: group.id})
                    }>
                    <Text
                      className="text-2xl font-rubik-medium"
                      style={{color: colors.primary[200]}}>
                      {group.name}
                    </Text>
                    <Image
                      source={icons.arrow}
                      className="size-5 mr-2"
                      tintColor={colors.primary[200]}
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <Text
                  className="text-lg font-rubik mt-3 ml-1"
                  style={{color: colors.text.primary}}>
                  {t('list.empty')}
                </Text>
              )}
            </View>
          ))}

        <CustomAlertSingleton ref={alertRef} />

        <Modal
          transparent={true}
          visible={isJoinModalVisible}
          animationType="fade"
          onRequestClose={() => setIsJoinModalVisible(false)}>
          <View className="flex-1 justify-center items-center bg-black/50">
            <View
              className="w-4/5 rounded-xl p-5 py-6 items-center"
              style={{backgroundColor: colors.background.primary}}>
              <Text
                className="text-lg font-bold mb-8 text-center"
                style={{color: colors.text.primary}}>
                {c('locale') === 'en-US' && t('modals.join.confirmText')}
                <Text style={{color: colors.primary[200]}}>
                  {groupToJoin?.name}
                </Text>
                {c('locale') === 'tr-TR' ? t('modals.join.confirmText') : ' ?'}
              </Text>
              <View className="flex-row justify-between w-full">
                {!loading ? (
                  <>
                    <TouchableOpacity
                      onPress={onGroupJoinRequest}
                      className="flex-1 p-2 rounded-xl items-center mx-1"
                      style={{backgroundColor: '#0EC946'}}>
                      {/* #55CC88 */}
                      <Text className="text-base font-rubik text-white">
                        {t('buttons.sendRequest')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsJoinModalVisible(false)}
                      className="flex-1 p-2 rounded-xl items-center mx-1"
                      style={{backgroundColor: colors.background.secondary}}>
                      <Text
                        className="text-base font-bold"
                        style={{color: colors.text.primary}}>
                        {t('buttons.cancel')}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View className="flex flex-row items-center justify-center w-full">
                    <ActivityIndicator
                      className="mt-2 self-center"
                      size="large"
                      color={colors.primary[300] ?? colors.primary}
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          transparent={true}
          visible={isCreateModalVisible}
          animationType="fade"
          onRequestClose={() => setIsCreateModalVisible(false)}>
          <View className="flex-1 justify-center items-center bg-black/50">
            <View
              className="w-4/5 rounded-xl p-5 py-6 items-center"
              style={{backgroundColor: colors.background.primary}}>
              <Text
                className="text-lg font-bold mb-4 text-center"
                style={{color: colors.text.primary}}>
                {t('modals.create.title')}
              </Text>
              <View
                className="flex flex-row items-center justify-start z-50 rounded-2xl mb-4"
                style={{
                  backgroundColor: colors.background.secondary,
                }}>
                <TextInput
                  placeholderTextColor={'gray'}
                  selectionColor={'#7AADFF'}
                  value={newGroupName}
                  onChangeText={(value: string) => {
                    setNewGroupName(value);
                  }}
                  placeholder={t('modals.create.name')}
                  className="text-lg font-rubik ml-5 flex-1"
                  style={{color: colors.text.primary}}
                />
              </View>
              <View className="flex flex-row items-center justify-start z-50 rounded-2xl mb-4">
                <Text
                  className="text-lg font-rubik"
                  style={{color: colors.text.primary}}>
                  {t('modals.create.exerciseEnabled')}
                </Text>
                <View
                  className="ml-3"
                  style={{
                    borderRadius: 20,
                    backgroundColor: exerciseEnabled
                      ? colors.primary[300]
                      : '#B5B5B5',
                  }}>
                  <Switch
                    value={exerciseEnabled}
                    onValueChange={async (value: boolean) => {
                      setExerciseEnabled(value);
                    }}
                    thumbColor={colors.background.primary}
                    trackColor={{
                      false: '#B5B5B5',
                      true: colors.primary[300],
                    }}
                  />
                </View>
              </View>
              <View className="flex-row justify-between w-full">
                {!loading ? (
                  <>
                    <TouchableOpacity
                      onPress={onCreateGroup}
                      className="flex-1 p-2 rounded-xl items-center mx-1"
                      style={{backgroundColor: '#0EC946'}}>
                      <Text className="text-base font-bold text-white">
                        {t('buttons.create')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsCreateModalVisible(false)}
                      className="flex-1 p-2 rounded-xl items-center mx-1"
                      style={{backgroundColor: colors.background.secondary}}>
                      <Text
                        className="text-base font-bold"
                        style={{color: colors.text.primary}}>
                        {t('buttons.cancel')}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View className="flex flex-row items-center justify-center w-full">
                    <ActivityIndicator
                      className="mt-2 self-center"
                      size="large"
                      color={colors.primary[300] ?? colors.primary}
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* TO DO Buraya liste şeklinde Grup maplenmeli yoksa da no result component kullanılabilir */}
      </ScrollView>

      {user && user.role === 'ROLE_ADMIN' && (
        <View
          className="absolute right-3 items-center" // bottom-24
          style={{bottom: insets.bottom + 96}}>
          {/* <Text
              className="mb-1 font-rubik text-base"
              style={{color: colors.text.primary}}>
              Grup Oluştur
            </Text> */}

          {/* Buton */}
          <TouchableOpacity
            className="w-44 flex items-center justify-center"
            style={{
              backgroundColor: colors.primary[200],
              borderRadius: 17,
              height: 50,
              shadowColor: '#444',
              shadowOpacity: 0.15,
              shadowOffset: {width: 0, height: 2},
              shadowRadius: 4,
              elevation: 4,
            }}
            onPress={() => {
              setIsCreateModalVisible(true);
            }}>
            <Text
              className="font-rubik text-lg"
              style={{color: colors.background.secondary}}>
              {t('buttons.createNew')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Groups;
