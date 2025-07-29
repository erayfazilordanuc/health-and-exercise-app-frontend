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
import {getUser, updateUser} from '../../api/user/userService';
import {color} from 'react-native-elements/dist/helpers';
import {useUser} from '../../contexts/UserContext';
import CustomAlertSingleton, {
  CustomAlertSingletonHandle,
} from '../../components/CustomAlertSingleton';

const Groups = () => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const {user} = useUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroup, setMyGroup] = useState<Group | null>();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupToJoin, setGroupToJoin] = useState<Group>();
  const [groupJoinRequest, setGroupJoinRequest] = useState<GroupRequestDTO>();
  const [requestedGroupAdmin, setRequestedGroupAdmin] = useState<User>();
  const alertRef = useRef<CustomAlertSingletonHandle>(null);

  const onCreateGroup = async () => {
    setLoading(true);
    if (user) {
      const createGroupDTO: CreateGroupDTO = {
        name: newGroupName.trim(),
        adminId: user.id!,
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
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequestsAndGroups();
    }, [user]),
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
            className="py-3 px-4 rounded-2xl"
            style={{backgroundColor: colors.background.primary}}
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
          Gruplar
        </Text>
      </View>
      <View
        className="h-full pb-32 px-5 pt-3"
        style={{
          backgroundColor: colors.background.secondary,
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

        <View
          className="p-3 rounded-2xl"
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

        {user && user.role === 'ROLE_ADMIN' && (
          <View className="absolute bottom-48 right-3 items-center">
            {/* <Text
              className="mb-1 font-rubik text-base"
              style={{color: colors.text.primary}}>
              Grup Oluştur
            </Text> */}

            {/* Buton */}
            <TouchableOpacity
              className="w-32 h-16 bg-blue-500 rounded-3xl flex items-center justify-center"
              onPress={() => {
                setIsCreateModalVisible(true);
              }}>
              <Text
                className="font-rubik text-lg"
                style={{color: colors.background.secondary}}>
                Grup Oluştur
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TO DO Buraya liste şeklinde Grup maplenmeli yoksa da no result component kullanılabilir */}
      </View>
    </>
  );
};

export default Groups;
