// HeartRateSimpleChart.tsx
// import {getMockSleepSessions} from '../../lib/health/healthConnectService';
// import {useTheme} from '../../../src/themes/ThemeProvider';
// import React, {useEffect, useState} from 'react';
// import {View, Text, Dimensions, ScrollView} from 'react-native';
// import {BarChart, LineChart} from 'react-native-chart-kit';

// const screenWidth = Dimensions.get('window').width;

// const HeartRateSimpleChart = () => {
//   const {colors} = useTheme();

//   const [labels, setLabels] = useState<string[]>([]);
//   const [durations, setDurations] = useState<number[]>([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       const sessions = await getMockSleepSessions();

//       // Tarihleri formatlayalım
//       const days = sessions
//         .map(s =>
//           new Date(s.start).toLocaleDateString('tr-TR', {weekday: 'short'}),
//         )
//         .reverse(); // En yeni en sağda olsun

//       const values = sessions.map(s => s.durationHours).reverse();

//       setLabels(days);
//       setDurations(values);
//     };

//     fetchData();
//   }, []);

//   const data = {
//     labels: ['09:00', '10:00', '11:00', '12:00', '13:00'],
//     datasets: [
//       {
//         data: [72, 78, 75, 80, 76],
//       },
//     ],
//   };

//   const chartConfig = {
//     backgroundGradientFrom: colors.background.primary,
//     backgroundGradientTo: colors.background.primary,
//     decimalPlaces: 0,
//     color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
//     labelColor: () => colors.text.primary,
//   };

//   const chartWidth = Math.max(screenWidth - 32, durations.length * 40);

//   return (
//     // <View>
//     //   <Text
//     //     style={{
//     //       color: colors.text.primary,
//     //       textAlign: 'center',
//     //       fontSize: 18,
//     //       marginBottom: 10,
//     //     }}>
//     //     Heart Rate (bpm)
//     //   </Text>
//     //   <LineChart
//     //     data={data}
//     //     width={(screenWidth * 88) / 100}
//     //     height={50}
//     //     yAxisSuffix=" bpm"
//     //     chartConfig={chartConfig}
//     //     bezier
//     //     style={{
//     //       marginVertical: 8,
//     //       marginHorizontal: 8,
//     //       borderRadius: 10,
//     //     }}
//     //   />
//     // </View>

//     <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//       <View className='pl-3'>
//         <Text style={{textAlign: 'center', fontSize: 16, marginBottom: 10}}>
//           Günlük Uyku Süresi
//         </Text>
//         <BarChart
//           data={{
//             labels,
//             datasets: [{data: durations}],
//           }}
//           width={chartWidth}
//           height={180}
//           yAxisLabel=""
//           yAxisSuffix="h"
//           fromZero
//           showValuesOnTopOfBars
//           withInnerLines={false}
//           chartConfig={{
//             backgroundColor: '#ffffff',
//             backgroundGradientFrom: '#ffffff',
//             backgroundGradientTo: '#ffffff',
//             decimalPlaces: 1,
//             color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
//             labelColor: () => '#333',
//             style: {
//               borderRadius: 10,
//             },
//             propsForLabels: {
//               fontSize: 10,
//             },
//           }}
//           style={{
//             borderRadius: 8,
//           }}
//         />
//       </View>
//     </ScrollView>
//   );
// };

// export default HeartRateSimpleChart;
