import React, {useEffect, useRef, useState} from 'react';
import {
  Modal,
  Animated,
  Dimensions,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {useTheme} from '../themes/ThemeProvider'; // yolunu projene göre düzelt
import {useTranslation} from 'react-i18next';

type CustomModalProps = {
  visible: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onApproveText?: string;
  onDeclineText?: string;
  /** Uzun KVKK metni; string ya da React node verebilirsin */
  body: string | React.ReactNode;
};

const {height} = Dimensions.get('window');

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onApprove,
  onDecline,
  onApproveText,
  onDeclineText,
  body,
}) => {
  const {t} = useTranslation('common');
  const {colors} = useTheme();

  // Modal’ı önce mount edip içerik ölçülünce fade-in
  const [mounted, setMounted] = useState<boolean>(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible, opacity]);

  const handleContentLayout = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none" // kendi fade animasyonumuzu kullanıyoruz
      statusBarTranslucent={Platform.OS === 'android'}
      hardwareAccelerated
      onRequestClose={onDecline}>
      <Animated.View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)',
          opacity,
        }}>
        <View
          onLayout={handleContentLayout}
          style={{
            width: '94%',
            maxHeight: height * 0.7,
            borderRadius: 24,
            padding: 20,
            backgroundColor: colors.background.primary,
          }}>
          <ScrollView
            style={{flexGrow: 1}}
            contentContainerStyle={{paddingBottom: 8}}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled>
            {typeof body === 'string' ? (
              <Text
                style={{
                  marginTop: 15,
                  fontSize: 13,
                  lineHeight: 20,
                  textAlign: 'center',
                  color: colors.text.primary,
                }}>
                {body}
              </Text>
            ) : (
              body
            )}
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 10,
            }}>
            <TouchableOpacity
              onPress={onDecline}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: colors.background.secondary,
              }}>
              <Text style={{fontSize: 16, color: colors.text.primary}}>
                {onDeclineText ?? t('alerts.decline')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onApprove}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: colors.primary[200],
              }}>
              <Text style={{fontSize: 16, color: '#fff'}}>
                {onApproveText ?? t('alerts.approve')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};
