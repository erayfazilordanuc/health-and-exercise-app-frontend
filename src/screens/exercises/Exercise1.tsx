import React, {useState, useRef} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useTheme} from '../../themes/ThemeProvider';

const Exercise1: React.FC = () => {
  const {colors} = useTheme();

  const [startTime, setStartTime] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStart = () => {
    const currentTime = Date.now();
    setStartTime(currentTime);
    setNow(currentTime);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setNow(Date.now());
    }, 10);
  };

  const handleStop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  let secondsPassed = 0;
  if (startTime !== null && now !== null) {
    secondsPassed = (now - startTime) / 1000;
  }

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{backgroundColor: colors.background.secondary}}>
      <Text
        className="text-4xl font-bold mb-8"
        style={{color: colors.text.primary}}>
        Geçen Zaman: {secondsPassed.toFixed(3)} s
      </Text>

      <TouchableOpacity
        onPress={handleStart}
        className="bg-blue-600 px-6 py-3 rounded-xl mb-4">
        <Text className="text-white text-lg font-semibold">Başlat</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleStop}
        className="bg-red-600 px-6 py-3 rounded-xl">
        <Text className="text-white text-lg font-semibold">Durdur</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Exercise1;
