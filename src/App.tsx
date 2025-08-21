import * as React from 'react';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import '../global.css';
import AppNavigator from './navigation/AppNavigator';
import {ThemeProvider, useTheme} from './themes/ThemeProvider';
import Toast, {BaseToastProps, ErrorToast} from 'react-native-toast-message';
import {UserProvider} from './contexts/UserContext';
import {ReactQueryProvider} from './lib/react-query/provider';
import {focusManager} from '@tanstack/react-query';
import {AppState} from 'react-native';

export default function App() {
  focusManager.setEventListener(handleFocus => {
    const sub = AppState.addEventListener('change', state => {
      handleFocus(state === 'active');
    });
    return () => sub.remove();
  });

  return (
    <ThemeProvider>
      <UserProvider>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ReactQueryProvider>
            <AppNavigator />
          </ReactQueryProvider>
        </SafeAreaProvider>
        <Toast />
      </UserProvider>
    </ThemeProvider>
  );
}

// import React, {useState} from 'react';
// import type {PropsWithChildren} from 'react';
// import {
//   SafeAreaView,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   useColorScheme,
//   View,
// } from 'react-native';
// import '../global.css';

// import {
//   Colors,
//   DebugInstructions,
//   Header,
//   LearnMoreLinks,
//   ReloadInstructions,
// } from 'react-native/Libraries/NewAppScreen';
// import {readSampleData} from './health/hooks/useHealthConnect';

// function App(): React.JSX.Element {
//   const isDarkMode = useColorScheme() === 'dark';

//   const [steps, setSteps] = useState(0);

//   const backgroundStyle = {
//     backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
//   };

//   /*
//    * To keep the template simple and small we're adding padding to prevent view
//    * from rendering under the System UI.
//    * For bigger apps the recommendation is to use `react-native-safe-area-context`:
//    * https://github.com/AppAndFlow/react-native-safe-area-context
//    *
//    * You can read more about it here:
//    * https://github.com/react-native-community/discussions-and-proposals/discussions/827
//    */
//   const safePadding = '5%';

//   return (
//     <SafeAreaView style={[backgroundStyle, {flex: 1}]}>
//       <View
//         style={{
//           flex: 1,
//           backgroundColor: isDarkMode ? Colors.black : Colors.white,
//           paddingHorizontal: 16,
//           paddingBottom: 16,
//           justifyContent: 'center',
//           alignItems: 'center', // opsiyonel: ortalamak için
//         }}>
//         <TouchableOpacity
//           onPress={() => {
//             readSampleData().then(result => {
//               setSteps(result ?? 0);
//             });
//           }}
//           style={{
//             marginTop: 10,
//             padding: 5,
//             paddingHorizontal: 10,
//             borderRadius: 15,
//             backgroundColor: '#d0c9c7',
//           }}>
//           <Text style={{fontSize: 20}}>
//             Get data
//           </Text>
//         </TouchableOpacity>
//         <Text
//           className="font-rubik-bold"
//           style={{
//             fontSize: 20,
//             marginTop: 10,
//             padding: 5,
//             paddingHorizontal: 10,
//             borderRadius: 15,
//             backgroundColor: '#d0c9c7',
//           }}>
//           {steps}
//         </Text>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   sectionContainer: {
//     marginTop: 32,
//     paddingHorizontal: 24,
//   },
//   sectionTitle: {
//     fontSize: 24,
//     fontWeight: '600',
//   },
//   sectionDescription: {
//     marginTop: 8,
//     fontSize: 18,
//     fontWeight: '400',
//   },
//   highlight: {
//     fontWeight: '700',
//   },
// });

// export default App;
