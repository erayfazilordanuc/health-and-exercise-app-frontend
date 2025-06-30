import {
  View,
  Text,
  BackHandler,
  Touchable,
  TouchableOpacity,
  FlatList,
  Pressable,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {useTheme} from '../../themes/ThemeProvider';
import {getUser, getUsersByGroupId} from '../../api/user/userService';
import {
  getGroupAdmin,
  getGroupById,
  getGroupSize,
} from '../../api/group/groupService';
import {setGestureState} from 'react-native-reanimated';

const Group = () => {
  const {colors} = useTheme();
  type GroupRouteProp = RouteProp<GroupsStackParamList, 'Group'>;
  const {params} = useRoute<GroupRouteProp>();
  const {groupId} = params;
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const [user, setUser] = useState<User | null>();
  const [group, setGroup] = useState<Group | null>();
  const [users, setUsers] = useState<User[]>([]);
  const [admin, setAdmin] = useState<User | null>();
  const [groupSize, setGroupSize] = useState(0);

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

  useEffect(() => {
    let isActive = true;

    const loadAll = async () => {
      try {
        // 1. user’ı çek
        const u = await getUser();
        if (!isActive) return;
        setUser(u);

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
    };

    loadAll();

    return () => {
      isActive = false;
    };
  }, [groupId]);

  // const fetchGroup = async () => {
  //   const response = await getGroupById(groupId);
  //   if (response.status === 200) {
  //     setGroup(response.data);
  //   }
  // };

  // const fetchGroupMembers = async () => {
  //   const response = await getUsersByGroupId(groupId);
  //   if (response.status === 200) {
  //     const list: User[] = Array.isArray(response.data)
  //       ? (response.data as User[])
  //       : [response.data as User];
  //     console.log('list', list);
  //     const sorted = user
  //       ? [
  //           ...list.filter(u => u.role === 'ROLE_ADMIN'),
  //           ...list.filter(u => u.role !== 'ROLE_ADMIN'),
  //         ]
  //       : list;

  //     console.log('sıfır', sorted[0]);

  //     setAdmin(sorted[0]);
  //     setUsers(sorted);
  //     setGroupSize(list.length);
  //   } else {
  //     const sizeResponse = await getGroupSize(groupId);
  //     if (sizeResponse.status === 200) setGroupSize(sizeResponse.data);
  //     const adminResponse = await getGroupAdmin(groupId);
  //     if (adminResponse.status === 200) setAdmin(adminResponse.data);
  //   }
  // };

  // const fetchUser = async () => {
  //   const user = await getUser();
  //   setUser(user);
  // };

  // useFocusEffect(
  //   useCallback(() => {
  //     fetchUser();
  //     fetchGroup();
  //   }, []),
  // );

  // useEffect(() => {
  //   if (user && users.length === 0) {
  //     fetchGroupMembers();
  //   }
  // }, [user]);

  // useEffect(() => {
  //   fetchUser();
  // }, []);

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
              /* member a navigate etmeli id ile */
            }}>
            <Text
              className="text-lg font-semibold dark:text-blue-300"
              style={{color: colors.text.primary}}>
              Durum
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
    <>
      <View
        className="pt-14"
        style={{
          backgroundColor: colors.background.secondary,
          justifyContent: 'center',
          alignItems: 'flex-start',
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
      <View
        className="h-full pb-32 px-3"
        style={{
          backgroundColor: colors.background.secondary,
          // paddingTop: insets.top / 2,
        }}>
        {user && user.role === 'ROLE_USER' && (
          <View
            className="flex flex-column justify-start rounded-2xl pl-5 p-3 mt-3" // border
            style={{
              backgroundColor: colors.background.primary,
              borderColor: colors.primary[300],
            }}>
            {admin && (
              <>
                <Text
                  className="font-rubik text-2xl"
                  style={{color: colors.primary[150]}}>
                  Hemşire Bilgileri
                </Text>
                <Text
                  className="font-rubik text-lg mt-3 mb-1"
                  style={{color: colors.primary[150]}}>
                  {admin?.fullName}
                </Text>
                <Text
                  className="font-rubik text-lg mt-1 mb-1"
                  style={{color: colors.primary[150]}}>
                  {admin?.email}
                </Text>
              </>
            )}
          </View>
        )}

        <View
          className="flex flex-column justify-start rounded-2xl pl-5 p-3 mt-3" // border
          style={{
            backgroundColor: colors.background.primary,
            borderColor: colors.primary[300],
          }}>
          <View className="flex flex-row justify-between">
            <Text
              className="font-rubik text-2xl"
              style={{color: colors.text.primary}}>
              Duyurular
            </Text>
            {user && user.role === 'ROLE_ADMIN' && (
              <TouchableOpacity
                className="p-2 px-3 rounded-2xl"
                style={{backgroundColor: colors.background.secondary}}>
                <Text
                  className="font-rubik text-lg"
                  style={{color: colors.text.primary}}>
                  Duyuru Yap
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text
            className="font-rubik text-lg mt-3"
            style={{color: colors.text.primary}}>
            Sağlıklı günler!
          </Text>
        </View>

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
          className="flex flex-column justify-start rounded-2xl pl-5 p-4 mt-3" // border
          style={{
            backgroundColor: colors.background.primary,
            borderColor: colors.primary[300],
          }}>
          <View className="flex flex-row justify-between">
            <Text
              className="font-rubik text-2xl"
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
            <FlatList
              data={users}
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
      </View>
    </>
  );
};

export default Group;
