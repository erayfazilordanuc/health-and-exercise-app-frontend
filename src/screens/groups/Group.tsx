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
import {getDbUser, getUser, updateUser} from '../../api/user/userService';
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
import {AvatarKey, AVATARS} from '../../constants/avatars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';

const Group = () => {
  const insets = useSafeAreaInsets();
  const {colors, theme} = useTheme();
  type GroupRouteProp = RouteProp<GroupsStackParamList, 'Group'>;
  const {params} = useRoute<GroupRouteProp>();
  const {groupId, fromNotification} = params;
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const {t} = useTranslation('groups');
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const {user, setUser} = useUser();
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
        if (user && user.role === 'ROLE_USER') {
          navigation.navigate('Home');
          return true;
        } else if (fromNotification) {
          // navigation.navigate('Groups');
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'Groups',
              },
            ],
          });
          return true;
        }
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
    }

    await AsyncStorage.setItem('user', JSON.stringify(dbUser));
  }, [setUser, navigation, user]);

  useFocusEffect(
    useCallback(() => {
      // her focus'ta sıfır başla
      triedOnThisFocusRef.current = false;

      if (!triedOnThisFocusRef.current) {
        triedOnThisFocusRef.current = true;

        // Koşullar uygunsa sadece 1 kez çalıştır
        if (user && user.role === 'ROLE_USER' && !user.groupId) {
          getUser();
        }
      }

      // blur olduğunda reset; böylece sonraki focus'ta yine 1 kez çalışır
      return () => {
        triedOnThisFocusRef.current = false;
      };
    }, [getUser, user?.id, user?.role, user?.groupId]),
  );

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
    ToastAndroid.show(t('toasts.leaveSent'), ToastAndroid.SHORT);
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
        <View className="flex flex-row justify-start items-center">
          <Image
            source={AVATARS[item.avatar as AvatarKey]}
            className="mr-1 size-8"
          />
          <Text
            className="text-lg font-rubik-medium dark:text-blue-300 ml-2"
            style={{color: colors.primary[200]}}>
            {item.fullName}
          </Text>
        </View>
        {user?.role === 'ROLE_USER' && item.role === 'ROLE_ADMIN' && (
          <Text
            className="text-lg font-rubik-medium dark:text-blue-300 mr-2"
            style={{color: colors.text.primary}}>
            {t('groupDetail.roles.admin')}
          </Text>
        )}
        {user && item.username === user.username && (
          <Text
            className="text-lg font-rubik-medium dark:text-blue-300 mr-2"
            style={{color: colors.text.primary}}>
            {t('groupDetail.roles.you')}
          </Text>
        )}
        {item.role === 'ROLE_USER' && user && user.role === 'ROLE_ADMIN' && (
          <TouchableOpacity
            className="px-4 rounded-xl"
            style={{
              backgroundColor: colors.background.primary,
              paddingVertical: 5,
            }}
            onPress={() => {
              if (user && user.role === 'ROLE_ADMIN') {
                navigation.navigate('Member', {memberId: item.id});
              }
              /* member a navigate etmeli id ile */
            }}>
            <Text
              className="text-lg font-rubik-medium dark:text-blue-300"
              style={{color: colors.text.primary}}>
              {t('buttons.detail')}
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

  // TO DO sıralama ekle
  // style={{
  //                   backgroundColor: active
  //                     ? colors.background.third
  //                     : colors.background.secondary,
  //                   borderWidth: active ? 1 : 0,
  //                   borderColor: active ? colors.primary[200] : 'transparent',
  //                 }}

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
          className="pl-7 font-rubik-semibold pr-7"
          style={{
            color: theme.colors.isLight ? '#333333' : colors.background.primary,
            fontSize: 24,
          }}>
          {t('titles.group')}:{'  '}
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
        // contentContainerClassName="pb-24"
        contentContainerStyle={{paddingBottom: insets.bottom + 90}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                if (groupId) {
                  // await qc.invalidateQueries({
                  //   queryKey: ['groupUsers', groupId],
                  // });
                  await qc.refetchQueries({
                    queryKey: GROUP_KEYS.usersByGroupId(groupId),
                    exact: true,
                    type: 'active', // sadece aktif (mounted) query’leri refetch et
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
                <View className="flex-row items-center justify-between">
                  <Text
                    className="font-rubik-medium"
                    style={{fontSize: 19, color: colors.text.primary}}>
                    {t('groupDetail.nurseInfo')}
                  </Text>
                  <Image
                    source={AVATARS[admin.avatar as AvatarKey]}
                    className="mr-1 size-12"
                  />
                </View>
                <View className="flex flex-row items-center mt-1 mb-1">
                  <Text
                    className="font-rubik-medium text-lg"
                    style={{color: colors.text.primary}}>
                    {t('groupDetail.fields.fullName')}
                    {'  '}
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
                    {t('groupDetail.fields.email')}
                    {'  '}
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
                  {t('groupDetail.sections.lastMessage')}:
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
                  console.log('admin', admin, 'user', user);
                  if (!(admin && user)) return;

                  try {
                    const key = MSG_KEYS.roomIdByUsers(
                      user.username,
                      admin.username,
                    );
                    let roomId = qc.getQueryData<number>(key);

                    console.log('roomId1', roomId);

                    if (roomId == null || roomId === 0) {
                      roomId = await qc.fetchQuery({
                        queryKey: key,
                        queryFn: () =>
                          getRoomIdByUsers(user.username, admin.username),
                        staleTime: 5 * 60 * 1000,
                        gcTime: 60 * 60 * 1000,
                      });
                      console.log('roomId2', roomId);
                    }

                    if (roomId === null || roomId === 0)
                      roomId = await getRoomIdByUsers(
                        user.username,
                        admin.username,
                      );

                    console.log('roomId3', roomId);

                    let finalRoomId = roomId;

                    if (roomId === 0) {
                      console.log(
                        '🚧 Oda mevcut değil, yeni roomId alınıyor...',
                      );
                      const {data: newId} = await getNextRoomId();
                      finalRoomId = newId;
                      console.log('🆕 [New Room Created] newId:', newId);

                      // Cache düzelt
                      qc.setQueryData(key, newId);
                      console.log('✅ Cache güncellendi:', key, '=>', newId);
                    }

                    console.log('➡️ Navigating to Chat with params:', {
                      roomId: finalRoomId,
                      sender: user.username,
                      receiver: admin,
                      fromNotification: false,
                    });

                    navigation.navigate('Chat', {
                      roomId: finalRoomId,
                      sender: user.username,
                      receiver: admin,
                      fromNotification: false,
                    });
                  } catch (error) {
                    console.error('❌ Hata oluştu [navigateToChat]:', error);
                  }
                }}>
                <Text
                  className="font-rubik text-md"
                  style={{color: colors.primary[200], marginTop: 1}}>
                  {t('buttons.goToChat')}
                </Text>
              </TouchableOpacity>
            </View>
            {lastMessage && (
              <Text
                className="font-rubik text-md mt-1"
                style={{color: colors.text.primary}}>
                {lastMessage.receiver === user?.username
                  ? admin?.fullName + ' : ' + lastMessage.message
                  : t('groupDetail.sections.youPrefix') + lastMessage.message}
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
              {t('groupDetail.sections.settings')}
            </Text>

            <View
              className="flex flex-row justify-start items-center mt-2 py-3 px-3 rounded-2xl self-start"
              style={{
                backgroundColor: colors.background.secondary,
              }}>
              <Text
                className="font-rubik ml-1"
                style={{fontSize: 16, color: colors.text.primary}}>
                {t('groupDetail.settings.exercise')}
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
                        ? t('groupDetail.settings.confirmEnable')
                        : t('groupDetail.settings.confirmDisable'),
                      secondMessage: value
                        ? undefined
                        : t('groupDetail.settings.disableWarning'),
                      isPositive: value ? true : false,
                      onYesText: t('buttons.yes'),
                      onCancelText: t('buttons.cancel'),
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

        {/* <View className="flex-row mt-3 mb-1 items-center">
              <Text
                className="font-rubik mr-2"
                style={{fontSize: 16, color: colors.text.primary}}>
                {t('groupDetail.sort.title', 'Sıralama')}
              </Text>

              <View className="flex-row">
                {(
                  [
                    {
                      key: 'usageDuration',
                      label: t(
                        'groupDetail.sort.usageDuration',
                        'Uygulama Kullanım Süresi',
                      ),
                    },
                    {
                      key: 'exerciseCount',
                      label: t(
                        'groupDetail.sort.exerciseCount',
                        'Egzersiz Tamamlama Adedi',
                      ),
                    },
                    {
                      key: 'goalBadgeCount',
                      label: t(
                        'groupDetail.sort.goalBadgeCount',
                        'Hedef Rozeti Sayısı',
                      ),
                    },
                  ] as {key: any; label: string}[]
                ) // (any) -> mevcut SortKey union’ını değiştirmeden hızlı kullanım
                  .map(opt => {
                    const active = sort.key === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => setKey(opt.key)}
                        className="py-2 px-3 mr-2 rounded-2xl"
                        style={{
                          backgroundColor: active
                            ? colors.background.third
                            : colors.background.secondary,
                          borderWidth: active ? 1 : 0,
                          borderColor: active
                            ? colors.primary[200]
                            : 'transparent',
                        }}>
                        <Text
                          className="font-rubik"
                          style={{color: colors.text.primary}}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>

              <TouchableOpacity
                onPress={toggleDir}
                className="py-2 px-3 ml-1 rounded-2xl"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderWidth: 1,
                  borderColor: colors.primary[200],
                }}>
                <Text
                  className="font-rubik"
                  style={{color: colors.text.primary}}>
                  {sort.dir === 'asc'
                    ? t('groupDetail.sort.asc', '↑ Artan')
                    : t('groupDetail.sort.desc', '↓ Azalan')}
                </Text>
              </TouchableOpacity>
            </View> */}

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
                {t('groupDetail.sections.joinRequests')}
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
                      {t('groupDetail.fields.fullName')}{' '}
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
                      {t('groupDetail.fields.username')}{' '}
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
                        {t('buttons.approve')}
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
                        {t('buttons.reject')}
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
              {t('groupDetail.sections.members')}
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
          </View>
        </View>
        <View className="mt-4 w-1/2">
          <CustomAlert
            message={t('alerts.leaveGroup')}
            visible={isLeaveAlertVisible}
            onYes={onLeaveGroup}
            onCancel={() => {
              setIsLeaveAlertVisible(false);
            }}
          />
        </View>
      </ScrollView>
      {user && user.role === 'ROLE_USER' && (
        <View className="absolute bottom-20 right-3 items-center"></View>
      )}

      <CustomAlertSingleton ref={alertRef} />
    </View>
  );
};

export default Group;
