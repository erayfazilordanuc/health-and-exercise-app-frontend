import React from 'react';
import {View} from 'react-native';

const radius = 50; // örnek
const percentage = 75;
const angle = (percentage / 100) * 180;

export default function SemiCircularProgress() {
  return (
    <View
      style={{
        width: radius * 2,
        height: radius * 2,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <View
        style={{
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          backgroundColor: 'grey',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View
          style={{
            position: 'absolute',
            left: radius,
            width: radius,
            height: radius * 2,
            backgroundColor: 'blue',
            borderTopLeftRadius: radius,
            borderBottomLeftRadius: radius,
            transform: [
              {translateX: -radius / 2}, // merkezden kaydır
              {rotate: `${angle}deg`},
              {translateX: radius / 2},
            ],
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: (radius - 5) * 2,
            height: (radius - 5) * 2,
            borderRadius: radius - 5,
            backgroundColor: '#fff',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        />
      </View>
    </View>
  );
}
