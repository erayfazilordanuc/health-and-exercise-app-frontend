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
  Dimensions,
  InteractionManager,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {socketService} from '../../api/socket/socketService';
import {
  saveMessage,
  getMessagesByRoomId,
} from '../../api/message/messageService';
import {useTheme} from '../../themes/ThemeProvider';
import icons from '../../constants/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useUser} from '../../contexts/UserContext';
import LinearGradient from 'react-native-linear-gradient';
import {useRoomMessages, useSendMessage} from '../../hooks/messageQueries';

const {width, height} = Dimensions.get('window');

type ChatRouteProp = RouteProp<GroupsStackParamList, 'Chat'>;
const Chat = () => {
  const insets = useSafeAreaInsets();
  const {params} = useRoute<ChatRouteProp>();
  const {roomId, sender, receiver, fromNotification, navigatedInApp} = params;
  const {user, setUser} = useUser();
  const {colors, theme} = useTheme();

  const navigation = useNavigation<GroupsScreenNavigationProp>();

  const [message, setMessage] = useState<string>('');
  // const {data: messagesData, isLoading} = useRoomMessages(roomId);
  // const [loading, setLoading] = useState(isLoading);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

  // const {mutate: send, isPending} = useSendMessage({
  //   roomId,
  //   sender,
  //   receiver: receiver.username,
  // });

  const [initialized, setInitialized] = useState(false);

  const [userAmount, setUserAmount] = useState<number>(0);

  const [accessToken, setAccessToken] = useState('');

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(85);

  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({animated: true});
    });
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 0);
    }
  }, [messages, isKeyboardVisible]);

  // useEffect(() => {
  //   if (messagesData && messagesData.length > 0) {
  //     setTimeout(() => {
  //       scrollToBottom();
  //     }, 0);
  //   }
  // }, [messagesData, messages, isKeyboardVisible]);

  // useEffect(() => {
  //   if (!initialized) {
  //     if (messagesData) setMessages(messagesData);
  //     setInitialized(true);
  //   }
  // }, [messagesData]);

  // useEffect(() => {
  //   if (messagesData) setMessages(messagesData);
  // }, [messagesData]);

  const sendMessage = async () => {
    const newMessage: Message = {
      message,
      sender: sender,
      receiver: receiver.username,
      roomId: roomId,
      createdAt: new Date(),
    };

    console.log('saved key', `lastMessage_${sender}_${receiver.username}`);
    // lastMessage_kullanıcı85_ordanuc
    await AsyncStorage.setItem(
      `lastMessage_${sender}_${receiver.username}`,
      JSON.stringify({
        message: newMessage,
        savedAt: new Date(),
      } as LocalMessage),
    );
    console.log(accessToken);

    socketService.emit('send_message', {
      messageWithSender: newMessage,
      room: roomId,
      accessToken: accessToken,
    });

    await saveMessage(newMessage);
    // await send(newMessage);

    setMessages(prev => [...prev, {...newMessage, sender: sender}]);
    setMessage('');
  };

  const loadMessages = async () => {
    setLoading(true);
    const res = await getMessagesByRoomId(roomId);
    if (res.status >= 200 && res.status <= 300 && res?.data) {
      setMessages(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!socketService.isConnected()) {
      socketService.connect();
      getAccessToken();
    }

    socketService.emit('chat_init', {room: roomId, sender});

    loadMessages();

    return () => {
      socketService.emit('leave_room', {room: roomId, username: sender});
      socketService.disconnect();
      console.log('disconnected and leaved');
    };
  }, []);

  const listenersAttachedRef = useRef(false);

  useEffect(() => {
    if (listenersAttachedRef.current) return;

    const handleReceiveMessage = (data: any) => {
      const msg: Message = {
        ...data.messageWithSender,
      };
      setMessages(prev => [...prev, msg]);
      setTimeout(scrollToBottom, 0);
      setUserAmount(data.userAmount);
      AsyncStorage.setItem(
        `lastMessage_${receiver.username}_${sender}`,
        JSON.stringify({
          message: msg,
          savedAt: new Date(),
        } as LocalMessage),
      );
    };

    const handleUserLogin = (data: any) => {
      const loginMsg: Message = {
        message: `${data.username} has joined the chat`,
        sender: data.username,
        receiver: '',
        roomId: roomId,
        createdAt: new Date(),
      };
      // setMessages(prev => [...prev, loginMsg]);
      console.log('user has joined the chat', loginMsg);
    };

    // socketService.off('receive_message');
    // socketService.off('emit_user');
    socketService.on('receive_message', handleReceiveMessage);
    socketService.on('emit_user', handleUserLogin);
    listenersAttachedRef.current = true;

    return () => {
      socketService.off('receive_message', handleReceiveMessage);
      socketService.off('emit_user', handleUserLogin);
      listenersAttachedRef.current = false;
    };
  }, [roomId]);

  const getAccessToken = async () => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken) setAccessToken(accessToken);
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      e => {
        setIsKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        console.log('Klavyeyi gördüm 👀 yükseklik:', e.endCoordinates.height);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(85);
        console.log('Klavye kapandı 😴');
      },
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [messages]);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (!navigatedInApp && !fromNotification && navigation.canGoBack()) {
          return false; // default back behavior
        }

        (async () => {
          if (!user) {
            const userJson = await AsyncStorage.getItem('user');
            if (userJson) {
              const localUser = JSON.parse(userJson);
              setUser(localUser);
            }
          }

          if (navigatedInApp) {
            if (user?.role === 'ROLE_USER') {
              navigation.replace('Group', {groupId: user?.groupId});
            }
          }

          if (fromNotification) {
            if (user?.role === 'ROLE_ADMIN') {
              console.log('receiver', receiver);
              navigation.replace('Member', {
                memberId: receiver.id,
                fromNotification,
              });
            } else {
              navigation.replace('Group', {
                groupId: user?.groupId,
                fromNotification,
              });
            }
          }

          socketService.emit('leave_room', {room: roomId, username: sender});
          socketService.disconnect();
        })();

        return true; // event'i biz handle ettik
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, [
      navigation,
      user,
      navigatedInApp,
      fromNotification,
      receiver,
      roomId,
      sender,
    ]),
  );

  return (
    // <KeyboardAvoidingView
    //   style={{flex: 1, paddingBottom: isKeyboardVisible ? 5 : 60}}
    //   behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    //   keyboardVerticalOffset={
    //     Platform.OS === 'ios' ? 0 : isKeyboardVisible ? -5 : -32
    //   }>
    <View className="flex-1">
      <LinearGradient
        colors={colors.gradient}
        locations={[0.15, 0.25, 0.7, 1]}
        start={{x: 0.1, y: 0}}
        end={{x: 0.8, y: 1}}
        className="absolute top-0 left-0 right-0 bottom-0"
      />
      <View
        className="flex-1 px-5 pb-2"
        style={{
          paddingTop: insets.top * 1.3,
          backgroundColor: 'transparent', // colors.background.secondary,
        }}>
        {/* Header */}
        <View
          className="flex flex-row pr-5"
          style={{
            backgroundColor: 'transparent', // colors.background.secondary,
            justifyContent: 'space-between',
          }}>
          <Text
            className="font-rubik-semibold"
            style={{
              color: theme.colors.isLight
                ? '#2F2F30'
                : colors.background.primary,
              fontSize: 24,
            }}>
            Chat:{' '}
            <Text
              style={{
                color: theme.colors.isLight ? colors.primary[200] : '#2F2F30',
              }}>
              {' ' + receiver.fullName}
            </Text>
          </Text>
        </View>

        {/* Messages */}
        {loading ? (
          <View className="flex-1 items-center justify-center w-full">
            <ActivityIndicator
              className="mt-2 self-center"
              size="large"
              color={colors.primary[300] ?? colors.primary}
            />
          </View>
        ) : messages && messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4 pt-1">
            <Text
              className="text-center text-lg font-rubik"
              style={{color: colors.background.primary}}>
              Henüz bu görüşmede bir mesaj bulunmuyor.
            </Text>
            <Text className="text-center text-2xl mt-2">💬</Text>
            <Text className="text-center text-sm mt-1 text-gray-500">
              Sağlık sürecinizle ilgili ilk mesajı paylaşabilirsiniz.
            </Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 mt-2"
            showsVerticalScrollIndicator={false}>
            {messages.map((msg, index) => (
              <View
                key={index}
                className={`flex-row items-center rounded-2xl my-1 ${
                  msg.sender === sender ? 'justify-end' : 'justify-start'
                }`}>
                <View
                  className={`flex py-2 ${
                    msg.message.startsWith('dailyStatus')
                      ? 'rounded-3xl'
                      : 'rounded-2xl'
                  } flex-row ${
                    msg.sender === sender ? 'justify-end' : 'justify-start'
                  }`}
                  style={{
                    backgroundColor: colors.background.primary,
                    paddingLeft: msg.sender === sender ? 12 : 10,
                    paddingRight: msg.sender === sender ? 4 : 12,
                    maxWidth: width * 0.8,
                  }}>
                  {!msg.message.startsWith('dailyStatus') ? (
                    <Text
                      className="text-md font-rubik"
                      style={{color: colors.text.primary}}>
                      {msg.sender !== sender
                        ? `  ${msg.message}`
                        : `${msg.message}  `}
                    </Text>
                  ) : (
                    <Text
                      className="text-lg font-rubik text-center"
                      style={{
                        color: colors.primary[250],
                      }}>
                      {(() => {
                        const match = msg.message.match(/dailyStatus(\d+)/);
                        const score = parseInt(match![1], 10);
                        // return msg.sender !== sender
                        //   ? `  Bugün ruh halimi 9 üzerinden ${score} olarak değerlendiriyorum.`
                        //   : `Bugün ruh halimi 9 üzerinden ${score} olarak değerlendiriyorum.  `;
                        return `${
                          msg.createdAt
                            ? new Date(msg.createdAt).toLocaleDateString() +
                              '\n'
                            : ''
                        }I rate my mood today as ${score}/9.`; // Bugün ruh halimi 9 üzerinden ${score} olarak değerlendiriyorum.`;
                      })()}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View
          className="flex-row items-center rounded-3xl px-3 py-2 mt-2"
          style={{
            backgroundColor: colors.background.primary,
            borderWidth: 1,
            borderColor: theme.colors.isLight
              ? 'rgba(150,150,150,0.09)'
              : 'rgba(150,150,150,0.09)',
            marginBottom: keyboardHeight,
          }}>
          <TextInput
            value={message}
            placeholder="Write"
            placeholderTextColor="gray"
            onChangeText={setMessage}
            onSubmitEditing={() => {
              if (message.length > 0) sendMessage();
              else ToastAndroid.show('Lütfen mesaj gir', ToastAndroid.SHORT);
            }}
            selectionColor={'#7AADFF'}
            className="flex-1 font-rubik text-md pl-2"
            style={{color: colors.text.primary}}
          />
          <TouchableOpacity
            onPress={async () => {
              if (message.length > 0) await sendMessage();
              else ToastAndroid.show('Lütfen mesaj gir', ToastAndroid.SHORT);
            }}
            className="ml-2 px-4 py-3 rounded-3xl"
            style={{backgroundColor: '#0EC946'}}>
            <Image
              source={icons.send}
              className="size-4"
              tintColor={colors.background.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
    // </KeyboardAvoidingView>
  );
};

export default Chat;
