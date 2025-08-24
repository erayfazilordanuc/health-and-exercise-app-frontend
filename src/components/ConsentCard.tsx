import React, {useMemo} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useTheme} from '../themes/ThemeProvider';

type ConsentStatus = 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'ACKNOWLEDGED';

interface ConsentCardProps {
  title: string;
  type: 'kvkk' | 'health' | 'exercise' | 'study'; // hangi consent için olduğunu belirt
  status?: ConsentStatus | null;
  loading?: boolean;
  onPress?: () => void;
}

const ConsentCard: React.FC<ConsentCardProps> = ({
  title,
  type,
  status,
  loading = false,
  onPress,
}) => {
  const {colors} = useTheme();

  const approved = useMemo(() => {
    if (loading) return false;

    if (type === 'kvkk') {
      return status === 'ACKNOWLEDGED';
    }

    return status === 'ACCEPTED';
  }, [type, status, loading]);

  const leftText = useMemo(() => {
    if (loading) return '';

    if (type === 'kvkk') {
      return status === 'ACKNOWLEDGED' ? 'Onaylandı' : 'Onaylanmadı';
    }
    // health / study gibi diğerleri
    return status === 'ACCEPTED' ? 'Onaylandı' : 'Onaylanmadı';
  }, [type, status, loading]);

  const leftTextColorClass =
    (type === 'kvkk' && status === 'ACKNOWLEDGED') ||
    (type !== 'kvkk' && status === 'ACCEPTED')
      ? 'text-green-500'
      : 'text-danger';

  // Buton etiketi (hepsi için ACCEPTED → iptal, diğer → onayla)
  const buttonText = useMemo(() => {
    return approved ? 'Onayı İptal Et' : 'Onayla';
  }, [approved]);

  return (
    <View
      className="mb-2"
      style={{
        borderRadius: 17,
        backgroundColor: colors.background.secondary,
      }}>
      <View className="flex flex-col items-center justify-between px-3 pt-3 pb-3">
        <Text
          className="font-rubik ml-2 text-center mr-5"
          style={{fontSize: 18, color: colors.text.primary}}>
          {title}
        </Text>

        <View className="flex flex-row items-center justify-between mt-1">
          {!loading && (
            <Text className={`${leftTextColorClass} font-rubik text-lg mr-6`}>
              {leftText}
            </Text>
          )}

          {!loading && (
            <TouchableOpacity
              className="p-3 rounded-2xl"
              style={{backgroundColor: colors.background.primary}}
              onPress={onPress}>
              <Text
                className="font-rubik text-center px-1"
                style={{fontSize: 14, color: colors.text.primary}}>
                {buttonText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default ConsentCard;
