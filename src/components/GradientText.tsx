// components/GradientText.tsx
import React from 'react';
import {Text, TextProps, StyleSheet} from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../themes/ThemeProvider';

interface GradientTextProps extends TextProps {
  children: React.ReactNode;
  colors?: string[]; // opsiyonel özel renkler
  start?: {x: number; y: number};
  end?: {x: number; y: number};
}

const GradientText: React.FC<GradientTextProps> = ({
  children,
  style,
  colors,
  start = {x: 0, y: 0},
  end = {x: 1, y: 0},
  ...props
}) => {
  const {colors: themeColors} = useTheme();

  const gradientColors = colors || [
    themeColors.primary[300],
    themeColors.secondary[300],
  ];

  return (
    <MaskedView
      maskElement={
        <Text style={[styles.maskText, style]} {...props}>
          {children}
        </Text>
      }>
      <LinearGradient colors={gradientColors} start={start} end={end}>
        <Text style={[styles.hiddenText, style]} {...props}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  maskText: {
    backgroundColor: 'transparent',
  },
  hiddenText: {
    opacity: 0, // Sadece mask olarak kullanılıyor
  },
});

export default GradientText;
