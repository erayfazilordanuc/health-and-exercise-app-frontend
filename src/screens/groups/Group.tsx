import {
  View,
  Text,
  BackHandler,
  Touchable,
  TouchableOpacity,
  FlatList,
  Pressable,
  ScrollView,
  Image,
  ToastAndroid,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {useTheme} from '../../themes/ThemeProvider';
import {
  getUser,
  getUsersByGroupId,
  updateUser,
} from '../../api/user/userService';
import {
  getGroupAdmin,
  getGroupById,
  getGroupSize,
} from '../../api/group/groupService';
import {setGestureState} from 'react-native-reanimated';
import CustomAlert from '../../components/CustomAlert';
import icons from '../../constants/icons';
import {
  getNextRoomId,
  isRoomExistBySenderAndReceiver,
} from '../../api/message/messageService';

const Group = () => {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  type GroupRouteProp = RouteProp<GroupsStackParamList, 'Group'>;
  const {params} = useRoute<GroupRouteProp>();
  const {groupId} = params;
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>();
  const [group, setGroup] = useState<Group | null>();
  const [users, setUsers] = useState<User[]>([]);
  const [admin, setAdmin] = useState<User | null>();
  const [groupSize, setGroupSize] = useState(0);
  const [isLeaveAlertVisible, setIsLeaveAlertVisible] = useState(false);

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

      return () => backHandler.remove();
    }, []),
  );

  const fetchUsers = async () => {
    if (!groupId) return;
    const membersRes = await getUsersByGroupId(groupId);
    if (membersRes.status !== 200) return;
    const list: User[] = Array.isArray(membersRes.data)
      ? membersRes.data
      : [membersRes.data];
    setGroupSize(list.length);
    const sorted = user
      ? [
          ...list.filter(u => u.role === 'ROLE_ADMIN'),
          ...list.filter(u => u.role !== 'ROLE_ADMIN'),
        ]
      : list;
    setUsers(sorted);
  };

  useEffect(() => {
    let isActive = true;

    const loadAll = async () => {
      setLoading(true);
      try {
        // 1. user’ı çek
        const u = await getUser();
        if (!isActive) return;
        setUser(u);

        if (!groupId) return;
        console.log('param', groupId);

        // 2. grup bilgisini çek
        const grpRes = await getGroupById(groupId);
        if (!isActive || grpRes.status !== 200) return;
        setGroup(grpRes.data);

        // 3. üye listesini çek
        const membersRes = await getUsersByGroupId(groupId);
        if (!isActive || membersRes.status !== 200) return;
        const list: User[] = Array.isArray(membersRes.data)
          ? membersRes.data
          : [membersRes.data];
        setGroupSize(list.length);
        const sorted = user
          ? [
              ...list.filter(u => u.role === 'ROLE_ADMIN'),
              ...list.filter(u => u.role !== 'ROLE_ADMIN'),
            ]
          : list;
        setUsers(sorted);

        // 4. admin’i ayıkla
        const adminUser: User = sorted[0];
        setAdmin(adminUser);
      } catch (e) {
        console.error('Group screen load error', e);
      }
      setLoading(false);
    };

    loadAll();

    return () => {
      isActive = false;
    };
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, []),
  );

  const onLeaveGroup = async () => {
    ToastAndroid.show(
      'Gruptan ayrılma isteğiniz hemşireye iletildi.',
      ToastAndroid.SHORT,
    );
    setIsLeaveAlertVisible(false);

    // if (user) {
    //   const updateUserDTO: UpdateUserDTO = {
    //     id: user.id!,
    //     username: user.username,
    //     email: user.email,
    //     fullName: user.fullName,
    //     groupId: null,
    //   };
    //   const response = await updateUser(updateUserDTO);
    //   if (response.status === 200) {
    //     ToastAndroid.show('Gruptan ayrılma isteğiniz hemşireye iletildi', ToastAndroid.SHORT);
    //     navigation.navigate('Groups');
    //   }
    // }
  };

  const renderItem = ({item}: {item: User}) => (
    <Pressable
      className="mb-2 p-3 mr-1 rounded-xl active:bg-blue-600/20"
      style={{backgroundColor: colors.background.secondary}}
      onPress={() => {}}>
      {/* Basınca modal çıksın user bilgilerinin gösterildiği */}
      <View className="flex flex-row justify-between">
        <Text
          className="text-lg font-semibold dark:text-blue-300 ml-2"
          style={{color: colors.primary[200]}}>
          {item.fullName}
        </Text>
        {item.role === 'ROLE_ADMIN' && (
          <Text
            className="text-lg font-semibold dark:text-blue-300 mr-2"
            style={{color: colors.text.primary}}>
            Hemşire
          </Text>
        )}
        {item.role === 'ROLE_USER' && user && user.role === 'ROLE_ADMIN' && (
          <TouchableOpacity
            className="p-1 px-4 rounded-2xl"
            style={{backgroundColor: colors.background.primary}}
            onPress={() => {
              if (user && user.role === 'ROLE_ADMIN') {
                navigation.navigate('Member', {memberId: item.id});
              }
              /* member a navigate etmeli id ile */
            }}>
            <Text
              className="text-lg font-semibold dark:text-blue-300"
              style={{color: colors.text.primary}}>
              Detay
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {/* <Text
        className="text-lg font-semibold dark:text-blue-300 ml-2"
        style={{color: colors.primary[200]}}>
        {item.username} Yaş olmalı
      </Text> */}
    </Pressable>
  );

  return (
    <View className="flex-1">
      <View
        className=" pb-3"
        style={{
          backgroundColor: colors.background.secondary,
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: insets.top * 1.3,
        }}>
        <Text
          className="pl-7 font-rubik-semibold pr-7"
          style={{
            color: colors.text.primary,
            fontSize: 24,
          }}>
          Grup:{'  '}
          <Text style={{color: colors.primary[200]}}>
            {group && group.name ? group.name : ''}
          </Text>
        </Text>
      </View>
      <ScrollView
        className="flex-1 px-3"
        style={{
          backgroundColor: colors.background.secondary,
          // paddingTop: insets.top / 2,
        }}
        contentContainerClassName="pb-20">
        {user && user.role === 'ROLE_USER' && (
          <View
            className="flex flex-column justify-start rounded-2xl pl-5 p-3 mb-3" // border
            style={{
              backgroundColor: colors.background.primary,
              borderColor: colors.primary[300],
            }}>
            {admin && (
              <>
                <Text
                  className="font-rubik text-2xl"
                  style={{color: colors.primary[175]}}>
                  Hemşire Bilgileri
                </Text>
                <Text
                  className="font-rubik text-lg mt-3 mb-1"
                  style={{color: colors.primary[175]}}>
                  Adı Soyadı:{'  '}
                  <Text style={{color: colors.text.primary}}>
                    {admin?.fullName}
                  </Text>
                </Text>
                {/* <Text
                  className="font-rubik text-lg mt-1 mb-1"
                  style={{color: colors.primary[175]}}>
                  Kullanıcı Adı:{'  '}
                  <Text style={{color: colors.text.primary}}>
                    yagmurberktas
                  </Text>
                </Text> */}
                {/* {admin?.username} */}
                <Text
                  className="font-rubik text-lg mt-1 mb-1"
                  style={{color: colors.primary[175]}}>
                  E-posta:{'  '}
                  <Text style={{color: colors.text.primary}}>
                    {'(Hemşirenin e-posta adresi)'}
                    {/* {admin?.email} */}
                  </Text>
                </Text>
              </>
            )}
          </View>
        )}

        {user && user.role === 'ROLE_USER' && (
          <View
            className="flex flex-column justify-start rounded-2xl pl-5 p-3" // border
            style={{
              backgroundColor: colors.background.primary,
              borderColor: colors.primary[300],
            }}>
            <View className="flex flex-row justify-between">
              <Text
                className="font-rubik text-2xl"
                style={{color: colors.text.primary}}>
                Hemşireden Gelen İleti
              </Text>
              <TouchableOpacity
                className="py-2 px-3 bg-blue-500 rounded-2xl flex items-center justify-center"
                onPress={async () => {
                  try {
                    const response = await isRoomExistBySenderAndReceiver(
                      user.username,
                      admin?.username!,
                    );
                    if (response.status === 200) {
                      const roomId = response.data;
                      if (roomId !== 0) {
                        navigation.navigate('Chat', {
                          roomId: roomId,
                          sender: user.username,
                          receiver: admin,
                          fromNotification: false,
                        });
                      } else {
                        const nextRoomResponse = await getNextRoomId();
                        if (nextRoomResponse.status === 200) {
                          const nextRoomId = nextRoomResponse.data;
                          navigation.navigate('Chat', {
                            roomId: nextRoomId,
                            sender: user.username,
                            receiver: admin,
                            fromNotification: false,
                          });
                        }
                      }
                    }
                  } catch (error) {
                    ToastAndroid.show('Bir hata oluştu', ToastAndroid.SHORT);
                  }
                }}>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.background.secondary}}>
                  Sohbet
                </Text>
              </TouchableOpacity>
            </View>
            <Text
              className="font-rubik text-lg mt-3"
              style={{color: colors.text.primary}}>
              Sağlıklı günler!
            </Text>
          </View>
        )}

        {user && user.role === 'ROLE_ADMIN' && (
          <View
            className="flex flex-column justify-start rounded-2xl pl-5 p-3 mt-3"
            style={{
              backgroundColor: colors.background.primary,
            }}>
            <View className="flex flex-row justify-between">
              <Text
                className="font-rubik text-2xl"
                style={{color: colors.text.primary}}>
                Öncelikli Geri Bildirimler
              </Text>
            </View>
            <Text
              className="font-rubik text-lg mt-3"
              style={{color: colors.text.primary}}>
              Bir hastadan gelen öncelikli geri bildirim
            </Text>
          </View>
        )}

        <View
          className="flex flex-column justify-start rounded-2xl pl-4 p-3 mt-3" // border
          style={{
            backgroundColor: colors.background.primary,
            borderColor: colors.primary[300],
          }}>
          <View className="flex flex-row justify-between">
            <Text
              className="font-rubik text-2xl ml-1"
              style={{color: colors.text.primary}}>
              Üyeler
            </Text>
            <Text
              className="font-rubik text-2xl mr-3"
              style={{color: colors.text.primary}}>
              {groupSize}
            </Text>
          </View>

          <View className="mt-4">
            {users.map(user => (
              <View key={user.id?.toString() ?? user.username}>
                {renderItem({item: user})}
              </View>
            ))}
            {/* <FlatList
              data={users}
              keyExtractor={item => (item.id ? item.id.toString() : '')}
              renderItem={renderItem}
              // ListEmptyComponent={
              //   <Text className="text-center text-zinc-400">
              //     Henüz bir grup yok
              //   </Text>
              // }
            /> */}
          </View>
        </View>
        <View className="mt-4 rounded-2xl w-1/2">
          <CustomAlert
            message={'Gruptan ayrılmak istediğinize emin misiniz?'}
            visible={isLeaveAlertVisible}
            onYes={onLeaveGroup}
            onCancel={() => {
              setIsLeaveAlertVisible(false);
            }}
          />

          {/* {!loading && user && user.role === 'ROLE_USER' && (
            <TouchableOpacity
              style={{backgroundColor: colors.background.primary}}
              onPress={() => {
                setIsLeaveAlertVisible(true);
              }}
              className="flex flex-row items-center justify-between py-4 px-5 rounded-2xl">
              <View className="flex flex-row items-center gap-3">
                <Image
                  source={icons.logout}
                  className="size-7"
                  tintColor={'#fd5353'}
                />
                <Text
                  style={{color: '#fd5353'}}
                  className={`font-rubik text-xl`}>
                  Gruptan Ayrıl
                </Text>
              </View>
            </TouchableOpacity>
          )} */}

          {/* {!loading &&
            users &&
            users.length === 0 &&
            user &&
            user.role === 'ROLE_ADMIN' && (
              <TouchableOpacity
                style={{backgroundColor: colors.background.primary}}
                onPress={() => {
                  setIsLeaveAlertVisible(true);
                }}
                className="flex flex-row items-center justify-between py-4 px-5 rounded-2xl">
                <View className="flex flex-row items-center gap-3">
                  <Image
                    source={icons.logout}
                    className="size-7"
                    tintColor={'#fd5353'}
                  />
                  <Text
                    style={{color: '#fd5353'}}
                    className={`font-rubik text-xl`}>
                    Grubu Sil
                  </Text>
                </View>
              </TouchableOpacity>
            )} */}
        </View>
      </ScrollView>
      {user && user.role === 'ROLE_USER' && (
        <View className="absolute bottom-20 right-3 items-center">
          {/* <Text
                    className="mb-1 font-rubik text-base"
                    style={{color: colors.text.primary}}>
                    Grup Oluştur
                  </Text> */}

          {/* Buton */}
        </View>
      )}
    </View>
  );
};

export default Group;
