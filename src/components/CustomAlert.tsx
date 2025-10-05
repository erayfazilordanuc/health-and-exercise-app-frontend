import React from 'react';
import {View, Text, TouchableOpacity, Dimensions} from 'react-native';
import {useTheme} from '../themes/ThemeProvider';
import {useTranslation} from 'react-i18next';

interface CustomAlertProps {
  message?: string;
  secondMessage?: string;
  children?: React.ReactNode;
  visible: boolean;
  onYes: () => void;
  onCancel: () => void;
  isPositive?: boolean;
  onCancelText?: string;
  onYesText?: string;
}

const CustomAlert = ({
  message,
  secondMessage,
  children,
  visible,
  onYes,
  onCancel,
  isPositive,
  onCancelText,
  onYesText,
}: CustomAlertProps) => {
  const {t} = useTranslation('common');
  const {colors} = useTheme();
  const {width} = Dimensions.get('window');

  return (
    <View
      style={{
        flex: 1,
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: visible ? 1 : 0,
        zIndex: 999,
      }}
      pointerEvents={visible ? 'auto' : 'none'}>
      <View
        style={{
          width: (width / 14) * 12,
          maxWidth: 400,
          backgroundColor: colors.background.primary,
          borderRadius: 20,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 5,
          alignItems: 'center',
        }}>
        {children || (
          <Text
            style={{
              color: colors.text.primary,
              fontSize: 18,
              textAlign: 'center',
              fontWeight: '600',
            }}>
            {message || 'Emin misiniz?'}
          </Text>
        )}

        {secondMessage && (
          <Text
            style={{
              color: colors.text.secondary,
              fontSize: 14,
              textAlign: 'center',
              marginTop: 10,
            }}>
            {secondMessage}
          </Text>
        )}

        <View style={{flexDirection: 'row', marginTop: 20}}>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flex: 1,
              marginRight: 5,
              backgroundColor: colors.background.secondary,
              borderRadius: 12,
              paddingVertical: 10,
            }}>
            <Text
              style={{
                color: colors.text.primary,
                fontSize: 16,
                textAlign: 'center',
              }}>
              {onCancelText || t('alerts.cancel')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onYes} // ❌ visible değiştirme, parent yönetecek
            style={{
              flex: 1,
              marginLeft: 5,
              backgroundColor: isPositive ? '#16d750' : 'rgb(239 68 68)',
              borderRadius: 12,
              paddingVertical: 10,
            }}>
            <Text
              style={{
                color: colors.background.primary,
                fontSize: 16,
                textAlign: 'center',
              }}>
              {onYesText || t('alerts.yes')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default React.memo(CustomAlert);
