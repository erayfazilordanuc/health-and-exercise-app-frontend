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

const Groups = () => {
  const {colors, theme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const [loading, setLoading] = useState(true);
  const {user, setUser} = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroup, setMyGroup] = useState<Group | null>();
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
        ToastAndroid.show(
          'Gruba katılma isteği gönderildi',
          ToastAndroid.SHORT,
        );
        fetchRequest(user.id!);
        setIsJoinModalVisible(false);
        setLoading(false);
        // setTimeout(() => {
        //   navigation.replace('Group', {groupId: response.data.groupId});
        //   setIsJoinModalVisible(false);
        //   setLoading(false);
        // }, 750);
      }
    }
  };

  const onDeleteJoinRequest = async () => {
    alertRef.current?.show({
      message: 'Gruba katılma isteğini iptal etmek istediğinize emin misin?',
      // secondMessage: 'Bu işlem geri alınamaz.',
      isPositive: false,
      onYesText: 'Evet',
      onCancelText: 'Vazgeç',
      onYes: async () => {
        if (groupJoinRequest) {
          const response = await deleteJoinGroupRequest(groupJoinRequest.id!);
          if (response.status === 200) {
            setGroupJoinRequest(undefined);
            setRequestedGroupAdmin(undefined);
            ToastAndroid.show(
              'Gruba katılma isteği başarıyla iptal edildi',
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
      }

      const response = await getAllGroups();
      if (response) {
        setGroups(response.data);
        if (user) {
          const myGroup =
            (response.data as Group[]).find(g => g.id === user.groupId) || null;
          if (myGroup) setMyGroup(myGroup);
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

  const filterGroupsByAdmin = (groups: Group[], adminId: number) => {
    return groups.filter(group => group.adminId === adminId);
  };

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
              Katıl
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
        colors={colors.gradient} // istediğin renkler
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
            color: theme.colors.isLight ? '#333333' : colors.background.primary,
            fontSize: 24,
          }}>
          Gruplar
        </Text>
      </View>
      <ScrollView
        className="h-full pb-30 px-3 pt-3"
        style={{
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
              Gönderilen İstek
            </Text>
            <View
              className="rounded-2xl mt-1 py-3 px-5"
              style={{backgroundColor: colors.background.secondary}}>
              <View className="flex flex-row">
                <Text
                  className="font-rubik-medium text-xl text-center"
                  style={{color: colors.text.primary}}>
                  Grup:{' '}
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
                  Hemşire:{' '}
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
                  Durum:{' '}
                </Text>
                <Text
                  className="font-rubik text-xl text-center"
                  style={{color: colors.text.primary}}>
                  Beklemede
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
                  İptal Et
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
                  placeholder="Grupları ara"
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
                Gruplarım
              </Text>
              {filterGroupsByAdmin(groups, user.id!).length > 0 ? (
                filterGroupsByAdmin(groups, user.id!).map(
                  (group: Group, index) => (
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
                  ),
                )
              ) : (
                <Text className="text-lg font-rubik mt-3 ml-1">
                  Henüz bir grubunuz bulunmamakta
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
                <Text style={{color: colors.primary[200]}}>
                  {groupToJoin?.name}
                </Text>{' '}
                grubuna katılmak istediğinize emin misiniz?
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
                        İstek Gönder
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsJoinModalVisible(false)}
                      className="flex-1 p-2 rounded-xl items-center mx-1"
                      style={{backgroundColor: colors.background.secondary}}>
                      <Text
                        className="text-base font-bold"
                        style={{color: colors.text.primary}}>
                        İptal
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
                Grup Oluşturma
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
                  placeholder="Grup İsmi"
                  className="text-lg font-rubik ml-5 flex-1"
                  style={{color: colors.text.primary}}
                />
              </View>
              <View className="flex flex-row items-center justify-start z-50 rounded-2xl mb-4">
                <Text
                  className="text-lg font-rubik"
                  style={{color: colors.text.primary}}>
                  Egzersiz Etkinliği
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
                        Oluştur
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsCreateModalVisible(false)}
                      className="flex-1 p-2 rounded-xl items-center mx-1"
                      style={{backgroundColor: colors.background.secondary}}>
                      <Text
                        className="text-base font-bold"
                        style={{color: colors.text.primary}}>
                        İptal
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
        <View className="absolute bottom-28 right-3 items-center">
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
            }}
            onPress={() => {
              setIsCreateModalVisible(true);
            }}>
            <Text
              className="font-rubik text-lg"
              style={{color: colors.background.secondary}}>
              Yeni Grup Oluştur
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Groups;
