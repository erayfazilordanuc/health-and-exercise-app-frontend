import React, {memo, useMemo} from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  Text,
  View,
  StyleSheet,
} from 'react-native';

type Props = {
  label: string | number;
  image: ImageSourcePropType;
  selected: boolean;
  onPress: () => void;
  // Tema/Renkler
  isLight: boolean;
  textPrimaryColor: string;
  darkBorderColor: string; // örn: colors.text.third
  lightBorderColor?: string; // varsayılan: '#A6A6A6'
  // Opsiyonel ayarlar
  baseSize?: number; // varsayılan: 60
  selectedDelta?: number; // varsayılan: +5
  borderRadius?: number; // varsayılan: 10
  margin?: number; // varsayılan: 3
};

const StatusOption: React.FC<Props> = ({
  label,
  image,
  selected,
  onPress,
  isLight,
  textPrimaryColor,
  darkBorderColor,
  lightBorderColor = '#A6A6A6',
  baseSize = 60,
  selectedDelta = 5,
  borderRadius = 10,
  margin = 3,
}) => {
  const imageSize = useMemo(
    () => (selected ? baseSize + selectedDelta : baseSize),
    [selected, baseSize, selectedDelta],
  );

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        margin,
        borderRadius,
        paddingHorizontal: selected ? 1 : 0,
        paddingVertical: selected ? 3 : 0,
        borderWidth: selected ? 1 : 0,
        borderColor: isLight ? lightBorderColor : darkBorderColor,
      },
    ],
    [
      margin,
      borderRadius,
      selected,
      isLight,
      lightBorderColor,
      darkBorderColor,
    ],
  );

  return (
    <View style={containerStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{selected}}
        hitSlop={8}
        onPress={onPress}
        style={styles.pressable}>
        <Image
          source={image}
          style={{width: imageSize, height: imageSize, aspectRatio: 1}}
          resizeMode="contain"
        />
      </Pressable>

      <Text style={[styles.label, {color: textPrimaryColor}]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Rubik-SemiBold',
  },
});

export default memo(StatusOption);
