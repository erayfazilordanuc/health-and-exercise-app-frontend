import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  color1: string;
  color2: string;
  style?: StyleProp<ViewStyle>;
  start?: {x: number; y: number};
  end?: {x: number; y: number};
  radius?: number; // default 24
  padding?: number; // default 15
  children?: React.ReactNode;
};

export default function ColorCircle({
  color1,
  color2,
  style,
  start = {x: 0, y: 0},
  end = {x: 1, y: 1}, // 0..1 arası olmalı
  radius = 24,
  padding = 15,
  children,
}: Props) {
  return (
    <LinearGradient
      colors={[color1, color2]}
      start={start}
      end={end}
      // locations iki renk için ya [0, 1] olmalı ya da hiç verilmemeli
      style={[
        {
          marginLeft: 4,
          marginRight: 4,
          padding,
          borderRadius: radius,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}>
      {children}
    </LinearGradient>
  );
}
