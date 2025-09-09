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
  RefreshControl,
  Switch,
} from 'react-native';
// import {List, Surface, Switch, TouchableRipple} from 'react-native-paper';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  RouteProp,
  useFocusEffect,
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {useTheme} from '../../themes/ThemeProvider';
import {getUser, updateUser} from '../../api/user/userService';
import {
  getGroupById,
  getGroupRequestsByGroupId,
  respondToJoinRequest,
  updateGroup,
} from '../../api/group/groupService';
import {setGestureState} from 'react-native-reanimated';
import CustomAlert from '../../components/CustomAlert';
import icons from '../../constants/icons';
import {
  getLastMessageBySenderAndReceiver,
  getNextRoomId,
  isRoomExistBySenderAndReceiver,
} from '../../api/message/messageService';
import LinearGradient from 'react-native-linear-gradient';
import {
  GROUP_KEYS,
  useGroupById,
  useGroupUsers,
  useUpdateGroup,
} from '../../hooks/groupQueries';
import {useQueryClient} from '@tanstack/react-query';
import {useUser} from '../../contexts/UserContext';
import {join, update} from 'lodash';
import NetInfo from '@react-native-community/netinfo';
import {getRoomIdByUsers, MSG_KEYS} from '../../hooks/messageQueries';
import CustomAlertSingleton, {
  CustomAlertSingletonHandle,
} from '../../components/CustomAlertSingleton';

const Group = () => {
  const insets = useSafeAreaInsets();
  const {colors, theme} = useTheme();
  type GroupRouteProp = RouteProp<GroupsStackParamList, 'Group'>;
  const {params} = useRoute<GroupRouteProp>();
  const {groupId} = params;
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const {user} = useUser();
  // const {data: group, isLoading, error} = useGroupById(groupId);
  const {
    data: group,
    isLoading,
    error,
    refetch,
  } = useGroupById(groupId, {enabled: Number.isFinite(groupId) && groupId > 0});
  const [exerciseEnabled, setExerciseEnabled] = useState(
    group?.exerciseEnabled,
  );
  useEffect(() => {
    if (group) setExerciseEnabled(group.exerciseEnabled);
  }, [group]);

  const updateMut = useUpdateGroup();
  const alertRef = useRef<CustomAlertSingletonHandle>(null);
  const {
    data: members,
    isLoading: isUsersLoading,
    refetch: refetchGroupUsers,
  } = useGroupUsers(groupId);
  const [admin, setAdmin] = useState<User | null>();
  const [groupSize, setGroupSize] = useState(0);
  const [isLeaveAlertVisible, setIsLeaveAlertVisible] = useState(false);
  const [lastMessage, setLastMessage] = useState<Message | null>();
  const [joinRequests, setJoinRequests] = useState<GroupRequestDTO[] | null>(
    null,
  );

  const fetchLastMessage = async () => {
    if (!user || !admin) return;
    const lastMessageResponse = await getLastMessageBySenderAndReceiver(
      admin.username,
      user.username,
    );
    if (lastMessageResponse && lastMessageResponse.message) {
      if (lastMessageResponse.message.startsWith('dailyStatus')) {
        const match = lastMessageResponse.message.match(/dailyStatus(\d+)/);
        const score = parseInt(match![1], 10);

        lastMessageResponse.message =
          '\n' +
          new Date().toLocaleDateString() +
          `\nBugün ruh halimi ${score}/9 olarak değerlendiriyorum.`;
      }
      setLastMessage(lastMessageResponse);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('dışarda');
      if (user && user.role === 'ROLE_USER') {
        console.log('içerde');
        fetchLastMessage();
      }
    }, [user, admin]),
  );

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (user && user.role === 'ROLE_ADMIN') navigation.navigate('Groups');
        else navigation.navigate('Home');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, []),
  );

  const fetchMembers = async () => {
    if (members) {
      console.log('mememebers', members);
      const list: User[] = members;
      setGroupSize(list.length);

      if (!admin && members.length > 0) {
        const adminUser = members[0];
        setAdmin(adminUser);
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMembers();
    setLoading(false);
  }, [members]);

  const fetchRequests = async (user: User) => {
    const groupRequests = await getGroupRequestsByGroupId(groupId);
    if (groupRequests) {
      setJoinRequests(groupRequests);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ROLE_ADMIN' && !joinRequests)
      fetchRequests(user);
  }, [user]);

  // const fetchGroup = async () => {
  //   const grpRes = await getGroupById(groupId);
  //   if (grpRes.status !== 200) return;
  //   setGroup(grpRes.data);
  // };

  // useEffect(() => {
  //   if (!group) fetchGroup();
  // }, [groupId]);

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

  const respondToRequest = async (joinRequestId: number, approved: boolean) => {
    await respondToJoinRequest(joinRequestId, approved);
    setJoinRequests(
      prev => prev && prev.filter(req => req.id !== joinRequestId),
    );

    if (groupId) {
      await refetchGroupUsers();
    }
  };

  const renderItem = ({item}: {item: User}) => (
    <Pressable
      className="mb-2 p-3 mr-1 rounded-xl active:bg-blue-600/20"
      style={{backgroundColor: colors.background.secondary}}
      onPress={() => {}}>
      {/* Basınca modal çıksın user bilgilerinin gösterildiği */}
      <View className="flex flex-row justify-between items-center">
        <Text
          className="text-lg font-rubik-medium dark:text-blue-300 ml-2"
          style={{color: colors.primary[200]}}>
          {item.fullName}
        </Text>
        {user?.role === 'ROLE_USER' && item.role === 'ROLE_ADMIN' && (
          <Text
            className="text-lg font-rubik-medium dark:text-blue-300 mr-2"
            style={{color: colors.text.primary}}>
            Hemşire
          </Text>
        )}
        {user && item.username === user.username && (
          <Text
            className="text-lg font-rubik-medium dark:text-blue-300 mr-2"
            style={{color: colors.text.primary}}>
            Siz
          </Text>
        )}
        {item.role === 'ROLE_USER' && user && user.role === 'ROLE_ADMIN' && (
          <TouchableOpacity
            className="p-1 px-4 rounded-3xl"
            style={{backgroundColor: colors.background.primary}}
            onPress={() => {
              if (user && user.role === 'ROLE_ADMIN') {
                navigation.navigate('Member', {memberId: item.id});
              }
              /* member a navigate etmeli id ile */
            }}>
            <Text
              className="text-lg font-rubik-medium dark:text-blue-300"
              style={{color: colors.text.primary}}>
              Detay
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {/* <Text
        className="text-lg font-rubik-medium dark:text-blue-300 ml-2"
        style={{color: colors.primary[200]}}>
        {item.username} Yaş olmalı
      </Text> */}
    </Pressable>
  );

  return (
    <View className="flex-1">
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
          className="pl-7 font-rubik-semibold pr-7"
          style={{
            color: theme.colors.isLight ? '#333333' : colors.background.primary,
            fontSize: 24,
          }}>
          Grup:{'  '}
          <Text
            style={{
              color: theme.colors.isLight ? colors.primary[200] : '#2F2F30',
            }}>
            {group && group.name ? group.name : ''}
          </Text>
        </Text>
      </View>
      <ScrollView
        className="flex-1 px-3"
        style={{
          backgroundColor: 'transparent', // colors.background.secondary,
          // paddingTop: insets.top / 2,
        }}
        contentContainerClassName="pb-20"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                if (groupId) {
                  await qc.invalidateQueries({
                    queryKey: ['groupUsers', groupId],
                  });
                }
              } catch (error) {
                console.log(error);
              } finally {
                setRefreshing(false);
              }
            }}
            progressBackgroundColor={colors.background.secondary}
            colors={[colors.primary[300]]} // Android (array!)
            tintColor={colors.primary[300]}
          />
        }>
        {user && user.role === 'ROLE_USER' && (
          <View
            className="flex flex-column justify-start pl-5 p-3 mb-3 mt-3" // border
            style={{
              borderRadius: 17,
              backgroundColor: colors.background.primary,
              borderColor: colors.primary[300],
            }}>
            {admin && (
              <>
                <Text
                  className="font-rubik-medium"
                  style={{fontSize: 19, color: colors.text.primary}}>
                  Hemşire Bilgileri
                </Text>
                <View className="flex flex-row items-center mt-1 mb-1">
                  <Text
                    className="font-rubik-medium text-lg"
                    style={{color: colors.text.primary}}>
                    Adı Soyadı:{'  '}
                  </Text>
                  <Text
                    className="font-rubik text-lg"
                    style={{color: colors.text.primary}}>
                    {admin?.fullName}
                  </Text>
                </View>
                <View className="flex flex-row items-center mb-1">
                  <Text
                    className="font-rubik-medium text-lg"
                    style={{color: colors.text.primary}}>
                    E-posta:{'  '}
                  </Text>
                  <Text
                    className="font-rubik text-lg"
                    style={{color: colors.text.primary}}>
                    {admin?.email}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {user && user.role === 'ROLE_USER' && (
          <View
            className="flex flex-column justify-start pl-5 p-3"
            style={{
              borderRadius: 17,
              backgroundColor: colors.background.primary,
            }}>
            <View className="flex flex-row justify-between">
              {lastMessage && (
                <Text
                  className="font-rubik mt-1"
                  style={{fontSize: 20, color: colors.primary[200]}}>
                  En Son Mesaj
                </Text>
              )}
              <TouchableOpacity
                className="py-2 px-3 flex items-center justify-center"
                style={{
                  backgroundColor: colors.background.third,
                  borderRadius: 13,
                }}
                onPress={async () => {
                  // if (admin && user) {
                  //   const response = await isRoomExistBySenderAndReceiver(
                  //     admin.username,
                  //     user.username,
                  //   );
                  //   if (response && response.status === 200) {
                  //     const roomId = response;
                  //     if (roomId !== 0) {
                  //       navigation.navigate('Chat', {
                  //         roomId: roomId,
                  //         sender: user.username,
                  //         receiver: admin,
                  //         fromNotification: false,
                  //       });
                  //     } else {
                  //       const nextRoomResponse = await getNextRoomId();
                  //       if (nextRoomResponse.status === 200) {
                  //         const nextRoomId = nextRoomResponse.data;
                  //         navigation.navigate('Chat', {
                  //           roomId: nextRoomId,
                  //           sender: user.username,
                  //           receiver: admin,
                  //           fromNotification: false,
                  //         });
                  //       }
                  //     }
                  //   }
                  // }
                  if (!(admin && user)) return;

                  try {
                    // 1) cache → yoksa fetch
                    const roomId = await qc.ensureQueryData({
                      queryKey: MSG_KEYS.roomIdByUsers(
                        user.username,
                        admin.username,
                      ),
                      queryFn: () =>
                        getRoomIdByUsers(user.username, admin.username),
                    });

                    // 2) oda yoksa yeni id al
                    let finalRoomId = roomId;

                    if (roomId === 0) {
                      const {data: newId} = await getNextRoomId();
                      finalRoomId = newId;

                      // ➤ Cache'i anında düzelt
                      qc.setQueryData(
                        MSG_KEYS.roomIdByUsers(user.username, admin.username),
                        newId,
                      );
                    }

                    navigation.navigate('Chat', {
                      roomId: finalRoomId,
                      sender: user.username,
                      receiver: admin, // senin mevcut tipin neyse aynı kalsın
                      fromNotification: false,
                    });
                  } catch (e) {
                    // isteğe bağlı: toast vb.
                    console.log(e);
                  }
                }}>
                <Text
                  className="font-rubik text-md"
                  style={{color: colors.primary[200], marginTop: 1}}>
                  Sohbete Git
                </Text>
              </TouchableOpacity>
            </View>
            {lastMessage && (
              <Text
                className="font-rubik text-md mt-1"
                style={{color: colors.text.primary}}>
                {lastMessage.receiver === user?.username
                  ? admin?.fullName + ' : ' + lastMessage.message
                  : 'Siz : ' + lastMessage.message}
              </Text>
            )}
          </View>
        )}

        {user && user.role === 'ROLE_ADMIN' && (
          <View
            className="flex flex-column justify-start px-4 p-3 mt-3"
            style={{
              borderRadius: 17,
              backgroundColor: colors.background.primary,
              borderColor: colors.primary[300],
            }}>
            <Text
              className="font-rubik ml-1"
              style={{fontSize: 20, color: colors.text.primary}}>
              Grup Ayarları
            </Text>

            <View
              className="flex flex-row justify-start items-center mt-2 py-3 px-3 rounded-2xl self-start"
              style={{
                backgroundColor: colors.background.secondary,
              }}>
              <Text
                className="font-rubik ml-1"
                style={{fontSize: 16, color: colors.text.primary}}>
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
                    alertRef.current?.show({
                      message: value
                        ? 'Grup için egzersiz yapma özelliğini etkinleştirmek istediğinize emin misiniz?'
                        : 'Grup için egzersiz yapma özelliğini devre dışı bırakmak istediğinize emin misiniz?',
                      secondMessage: value
                        ? undefined
                        : 'Bu işlem egzersiz yapan kullanıcıların verilerinin kaydedilmemesine sebep olacaktır.',
                      isPositive: value ? true : false,
                      onYesText: 'Evet',
                      onCancelText: 'İptal',
                      onYes: async () => {
                        if (group && group.id) {
                          const updateDTO: UpdateGroupDTO = {
                            id: group.id,
                            name: group.name,
                            exerciseEnabled: value,
                          };
                          console.log('update dto', updateDTO);
                          const response = await updateMut.mutateAsync(
                            updateDTO,
                          );
                          if (
                            (!response.data && response.status > 300) ||
                            response.status < 200
                          )
                            setExerciseEnabled(prev => !prev);
                        }
                      },
                      onCancel: () => setExerciseEnabled(prev => !prev),
                    });
                  }}
                  thumbColor={colors.background.primary}
                  trackColor={{
                    false: '#B5B5B5',
                    true: colors.primary[300],
                  }}
                />
              </View>
            </View>
          </View>
        )}

        {user &&
          user.role === 'ROLE_ADMIN' &&
          joinRequests &&
          joinRequests.length > 0 && (
            <View
              className="flex flex-col justify-start /*items-center*/ pl-4 pr-4 pt-3 pb-4 mt-3" // border
              style={{
                borderRadius: 17,
                backgroundColor: colors.background.primary,
                borderColor: colors.primary[300],
              }}>
              <Text
                className="font-rubik ml-1"
                style={{fontSize: 20, color: colors.text.primary}}>
                Gruba katılma istekleri
              </Text>
              {joinRequests.map(jr => (
                <View
                  key={jr.id}
                  className="flex flex-col items-stretch justify-center pl-4 p-2 mt-3"
                  style={{
                    borderRadius: 15,
                    backgroundColor: colors.background.secondary,
                  }}>
                  <View className="flex flex-row mt-1">
                    <Text
                      className="font-rubik-medium text-lg ml-1"
                      style={{color: colors.text.primary}}>
                      Adı Soyadı:{' '}
                    </Text>
                    <Text
                      className="font-rubik text-lg ml-1"
                      style={{color: colors.text.primary}}>
                      {jr.userDTO.fullName}
                    </Text>
                  </View>
                  <View className="flex flex-row mb-1">
                    <Text
                      className="font-rubik-medium text-lg ml-1"
                      style={{color: colors.text.primary}}>
                      Kullanıcı Adı:{' '}
                    </Text>
                    <Text
                      className="font-rubik text-lg ml-1"
                      style={{color: colors.text.primary}}>
                      {jr.userDTO.username}
                    </Text>
                  </View>

                  <View className="flex flex-row items-center justify-center mt-2 mb-1">
                    <TouchableOpacity
                      className="rounded-xl mr-1 px-3 py-1"
                      style={{
                        backgroundColor: '#16d750',
                      }}
                      onPress={() => respondToRequest(jr.id!, true)}>
                      <Text
                        className="font-rubik text-md"
                        style={{color: colors.background.primary}}>
                        Onayla
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="rounded-xl ml-1 px-3 py-1"
                      style={{
                        backgroundColor: '#fd5353',
                      }}
                      onPress={() => respondToRequest(jr.id!, false)}>
                      <Text
                        className="font-rubik text-md"
                        style={{color: colors.background.primary}}>
                        Reddet
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

        <View
          className="flex flex-col justify-start pl-4 p-3 mt-3" // border
          style={{
            borderRadius: 17,
            backgroundColor: colors.background.primary,
            borderColor: colors.primary[300],
          }}>
          <View className="flex flex-row justify-between">
            <Text
              className="font-rubik ml-1"
              style={{fontSize: 20, color: colors.text.primary}}>
              Üyeler
            </Text>
            <Text
              className="font-rubik text-2xl mr-3"
              style={{color: colors.text.primary}}>
              {groupSize}
            </Text>
          </View>

          <View className="mt-3">
            {members &&
              members.map((user: User) => (
                <View key={user.id?.toString() ?? user.username}>
                  {renderItem({item: user})}
                </View>
              ))}
            {/* <FlatList
              data={members}
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
        <View className="mt-4 w-1/2">
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
              className="flex flex-row items-center justify-between py-4 px-5 rounded-3xl">
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
            members &&
            members.length === 0 &&
            user &&
            user.role === 'ROLE_ADMIN' && (
              <TouchableOpacity
                style={{backgroundColor: colors.background.primary}}
                onPress={() => {
                  setIsLeaveAlertVisible(true);
                }}
                className="flex flex-row items-center justify-between py-4 px-5 rounded-3xl">
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

      <CustomAlertSingleton ref={alertRef} />
    </View>
  );
};

export default Group;
