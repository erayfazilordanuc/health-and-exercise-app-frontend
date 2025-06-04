import {View, Text, TextInput, Image, BackHandler} from 'react-native';
import React, {useCallback} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../src/themes/ThemeProvider';
import icons from '../../../src/constants/icons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

const Groups = () => {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<GroupsScreenNavigationProp>();

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        navigation.navigate('Home');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove(); // Ekrandan çıkınca event listener'ı kaldır
    }, []),
  );

  return (
    <>
      <View
        className="pt-14"
        style={{
          backgroundColor: colors.background.secondary,
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
        <Text
          className="pl-7 font-rubik-semibold"
          style={{
            color: colors.text.primary,
            fontSize: 24,
          }}>
          Gruplar
        </Text>
      </View>
      <View
        className="h-full pb-32 px-5 pt-3"
        style={{
          backgroundColor: colors.background.secondary,
          // paddingTop: insets.top / 2,
        }}>
        <View className="flex flex-row justify-center items-center">
          <View
            className="flex flex-row justify-start items-center rounded-2xl w-3/4" // border
            style={{
              backgroundColor: colors.background.primary,
              borderColor: colors.primary[300],
            }}>
            <Image source={icons.search} className="size-6 ml-4 mr-2" />
            <TextInput
              className="font-rubik"
              style={{color: colors.text.primary}}
              multiline={false}
              placeholder="Grupları ara"
              placeholderClassName="pl-4"
              placeholderTextColor={colors.text.secondary}
              selectionColor={colors.primary[300]}
            />
          </View>
        </View>
        {/* TO DO Buraya liste şeklinde gruplar maplenmeli yoksa da no result component kullanılabilir */}
      </View>
    </>
  );
};

export default Groups;
