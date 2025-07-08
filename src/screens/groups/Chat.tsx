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

type ChatRouteProp = RouteProp<GroupsStackParamList, 'Chat'>;
const Chat = () => {
  const insets = useSafeAreaInsets();
  const {params} = useRoute<ChatRouteProp>();
  const {roomId, sender, receiver, fromNotification} = params;
  const {colors} = useTheme();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<GroupsScreenNavigationProp>();

  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userAmount, setUserAmount] = useState<number>(0);

  const [accessToken, setAccessToken] = useState('');

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(60);

  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  };

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (!fromNotification && navigation.canGoBack()) {
          return false;
        }

        if (receiver.role === 'ROLE_USER') {
          navigation.navigate('Group');
        }

        if (receiver.role === 'ROLE_ADMIN') {
          navigation.navigate('Member', {
            memberId: receiver.id,
            fromNotification,
          });
        }

        socketService.emit('leave_room', {room: roomId, username: sender});
        socketService.disconnect();

        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, []),
  );

  const sendMessage = async () => {
    const newMessage: Message = {
      message,
      sender: sender,
      receiver: receiver.username,
      roomId: roomId,
      createdAt: Date.now(),
    };

    console.log(accessToken);

    // emit socket
    socketService.emit('send_message', {
      messageWithSender: newMessage,
      room: roomId,
      accessToken: accessToken,
    });

    // save db
    await saveMessage(newMessage);

    setMessages(prev => [...prev, {...newMessage, sender: sender}]);
    setMessage('');
  };

  const getAccessToken = async () => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken) setAccessToken(accessToken);
  };

  useEffect(() => {
    if (!socketService.isConnected()) {
      socketService.connect();
      getAccessToken();
    }

    // join room
    socketService.emit('chat_init', {room: roomId, sender});

    // get existing messages from DB
    const loadMessages = async () => {
      setLoading(true);
      const res = await getMessagesByRoomId(roomId);
      if (res?.data) {
        setMessages(res.data);
      }
      setLoading(false);
    };
    loadMessages();

    return () => {
      socketService.emit('leave_room', {room: roomId, username: sender});
      socketService.disconnect();
      console.log('disconnected and leaved');
    };
  }, []);

  useEffect(() => {
    const handleReceiveMessage = (data: any) => {
      const msg: Message = {
        ...data.messageWithSender,
      };
      setMessages(prev => [...prev, msg]);
      setUserAmount(data.userAmount);
    };

    const handleUserLogin = (data: any) => {
      const loginMsg: Message = {
        message: `${data.username} has joined the chat`,
        sender: data.username,
        receiver: '',
        roomId: roomId,
        createdAt: Date.now(),
      };
      // setMessages(prev => [...prev, loginMsg]);
      console.log('user has joined the chat', loginMsg);
    };

    socketService.on('receive_message', handleReceiveMessage);
    socketService.on('emit_user', handleUserLogin);

    return () => {
      socketService.off('receive_message', handleReceiveMessage);
      socketService.off('emit_user', handleUserLogin);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isKeyboardVisible]);

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
        setKeyboardHeight(60);
        console.log('Klavye kapandı 😴');
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [messages]);

  return (
    // <KeyboardAvoidingView
    //   style={{flex: 1, paddingBottom: isKeyboardVisible ? 5 : 60}}
    //   behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    //   keyboardVerticalOffset={
    //     Platform.OS === 'ios' ? 0 : isKeyboardVisible ? -5 : -32
    //   }>
    <View className="flex-1">
      <View
        className="flex-1 px-5 pb-2"
        style={{
          paddingTop: insets.top * 1.3,
          backgroundColor: colors.background.secondary,
        }}>
        {/* Header */}
        <View
          className="flex flex-row pr-5"
          style={{
            backgroundColor: colors.background.secondary,
            justifyContent: 'space-between',
          }}>
          <Text
            className="pl-4 font-rubik-semibold"
            style={{
              color: colors.text.primary,
              fontSize: 24,
            }}>
            Sohbet:{' '}
            <Text style={{color: colors.primary[300]}}>
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
        ) : messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4 pt-1">
            <Text
              className="text-center text-lg font-rubik"
              style={{color: colors.text.primary}}>
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
                {/* {msg.sender !== sender && (
                  <Text
                    className="font-rubik-medium text-lg mr-1"
                    style={{color: colors.primary[300]}}>
                    {msg.sender}
                  </Text>
                )} */}
                {/* <Text
                  className="text-base font-rubik"
                  style={{color: colors.text.primary}}>
                  {msg.sender !== sender
                    ? `: ${msg.message}`
                    : `${msg.message} : `}
                </Text> */}
                {/* {msg.sender === sender && (
                  <Text
                    className="font-rubik-medium text-lg ml-1"
                    style={{color: '#0EC946'}}>
                    Sen
                  </Text>
                )} */}
                <View
                  className={`flex  py-2 rounded-2xl flex-row
                  ${msg.message.length > 30 ? 'w-3/4' : ''} ${
                    msg.sender === sender ? 'justify-end' : 'justify-start'
                  }`}
                  style={{
                    backgroundColor: colors.background.primary,
                    paddingLeft: msg.sender === sender ? 12 : 7,
                    paddingRight: msg.sender === sender ? 4 : 12,
                  }}>
                  <Text
                    className="text-md font-rubik"
                    style={{color: colors.text.primary}}>
                    {msg.sender !== sender
                      ? `  ${msg.message}`
                      : `${msg.message}  `}
                  </Text>
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
            marginBottom: keyboardHeight,
          }}>
          <TextInput
            value={message}
            placeholder="Mesajınızı yazın"
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
