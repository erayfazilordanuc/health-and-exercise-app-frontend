import {
  View,
  Text,
  BackHandler,
  ToastAndroid,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useTheme} from '../../../themes/ThemeProvider';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import CustomAlert from '../../../components/CustomAlert';
import axios from 'axios';
import {alphabet, cursorArray, keyboardRows} from '../../../constants/wordGame';
import {answers, words} from '../../../constants/words';

const WordGame = () => {
  const {colors} = useTheme();
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const rootNavigation = useNavigation<RootScreenNavigationProp>();
  const navigation = useNavigation<ExercisesScreenNavigationProp>();
  const [isStarted, setIsStarted] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [cursorIndex, setCursorIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [loading, setLoading] = useState(false);

  const [letters, setLetters] = useState(
    Array.from({length: 6}, () => Array(5).fill('')),
  );

  const [letterStats, setLetterStats] = useState(Array(30).fill(''));

  const [showCursor, setShowCursor] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (isStarted) setIsAlertVisible(true);
        else navigation.navigate('Exercises');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, [isStarted]),
  );

  const getSelectedWord = async (attempt = 1) => {
    const wordsToSelect = words;
    console.log(wordsToSelect.length);
    const random = Math.floor(Math.random() * 5532);
    const selectedWord = wordsToSelect[random];

    console.log(selectedWord);

    setSelectedWord(selectedWord);
    setIsStarted(true);
    setIsFinished(false);
    setLoading(false);

    // if (attempt > 5) {
    //   ToastAndroid.show(
    //     'Kelime bulunamadı, lütfen tekrar deneyin.',
    //     ToastAndroid.LONG,
    //   );
    //   setLoading(false);
    //   return;
    // }

    // const random1 = Math.floor(Math.random() * 29);
    // // const random2 = Math.floor(Math.random() * 29);
    // const randomLetter1 = alphabet[random1];
    // // const randomLetter2 = alphabet[random2];

    // try {
    //   const res = await axios.get(
    //     'https://kelimelodi.com/icinde-' +
    //       randomLetter1 +
    //       // randomLetter2 +
    //       '-olan-5-harfli-kelimeler',
    //   );

    //   const matches = [
    //     ...res.data.matchAll(/<td class="fontMobile">(.+?)<\/td>/g),
    //   ];

    //   const words = matches
    //     .map(m => m[1])
    //     .filter(word => word[0] === word[0].toLocaleLowerCase('tr'));

    //   if (words.length > 0) {
    //     const random = Math.floor(Math.random() * words.length);
    //     const word = words[random]
    //       .replace(/â/g, 'a')
    //       .replace(/î/g, 'i')
    //       .replace(/û/g, 'u')
    //       .replace(/Â/g, 'A')
    //       .replace(/Î/g, 'İ')
    //       .replace(/Û/g, 'U');

    //     setSelectedWord(word);
    //     setIsStarted(true);
    //     setIsFinished(false);
    //     setLoading(false);
    //   } else {
    //     getSelectedWord(attempt + 1);
    //   }
    // } catch (err) {
    //   console.error('HATA:', err);
    //   getSelectedWord(attempt + 1);
    // }
  };

  const checkIsValid = async (word: string): Promise<boolean> => {
    try {
      console.log('word', word.toLocaleLowerCase('tr'));
      const response = await axios.get(
        'https://sozluk.gov.tr/gts?ara=' + word.toLocaleLowerCase('tr'),
      );

      console.log('Word', word);
      console.log('Response', response);

      if (response.data && response.data.length > 0) {
        console.log('✅ Kelime:', response.data);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('❌ Hata:', error);
      return false;
    }
    // const newArray = words.concat(answers);
    // const isValid = newArray.includes(word.trim().toLocaleLowerCase());
    // console.log(words.length);
    // console.log(isValid, word.toLowerCase());
    // const found = words.find(w => w.includes('resim'));
    // if (found) {
    //   console.log([...found].map(c => c.charCodeAt(0)));
    // } else {
    //   console.log('resim bulunamadı!');
    // }
    // console.log([...'resim'].map(c => c.charCodeAt(0)));
    // return isValid;
  };

  const LetterBox = ({
    letter,
    borderColor,
    backgroundColor,
  }: {
    letter: string;
    borderColor?: string;
    backgroundColor?: string;
  }) => {
    const {colors} = useTheme();
    return (
      <View
        className="w-16 h-16 border rounded-xl m-1 justify-center items-center"
        style={{
          backgroundColor: backgroundColor || colors.background.primary,
          borderColor:
            borderColor !== '' ? borderColor : colors.background.fourth,
        }}>
        <Text
          className="text-3xl font-rubik"
          style={{
            color:
              letter === '|' ? colors.background.third : colors.text.primary,
          }}>
          {letter}
        </Text>
      </View>
    );
  };

  const handleApprove = async (currentRow: number, currentColumn: number) => {
    let word = '';
    for (let i = 0; i < 5; i++) {
      word += letters[currentRow][i];
    }
    const isWordValid = await checkIsValid(word);

    if (!isWordValid) {
      ToastAndroid.show(
        'Lütfen geçerli bir kelime giriniz',
        ToastAndroid.SHORT,
      );
      return;
    }

    let isFilled = true;
    for (let i = 0; i < 5; i++) {
      if (letters[currentRow][i] === '') {
        isFilled = false;
        ToastAndroid.show(
          'Lütfen 5 harfli bir kelime giriniz',
          ToastAndroid.SHORT,
        );
        return;
      }
    }

    const currentGuess = letters[currentRow].map(l =>
      l.toLocaleLowerCase('tr'),
    );
    const correctWord = selectedWord.toLocaleLowerCase('tr').split('');

    const newLetterStats: string[] = [...letterStats];
    const usedIndexes: boolean[] = [false, false, false, false, false];

    // 1. Aşama: Doğru harf + doğru konum (Green)
    for (let i = 0; i < 5; i++) {
      if (currentGuess[i] === correctWord[i]) {
        newLetterStats[cursorIndex - (4 - i)] = 'G';
        usedIndexes[i] = true; // bu harf bu pozisyonda kullanıldı
      }
    }

    let isCorrect = true;
    // 2. Aşama: Doğru harf ama yanlış konum (Yellow)
    for (let i = 0; i < 5; i++) {
      if (newLetterStats[cursorIndex - (4 - i)] === 'G') continue;
      else isCorrect = false;

      const letter = currentGuess[i];
      let found = false;

      for (let j = 0; j < 5; j++) {
        if (!usedIndexes[j] && correctWord[j] === letter) {
          found = true;
          usedIndexes[j] = true;
          break;
        }
      }

      if (found) {
        newLetterStats[cursorIndex - (4 - i)] = 'Y';
      } else {
        newLetterStats[cursorIndex - (4 - i)] = 'N';
      }
    }

    if (!(currentRow === 5 && currentColumn === 4)) {
      if (!(currentRow === 0 && currentColumn === 0))
        setCursorIndex(cursorIndex + 1);
    }

    setLetterStats(newLetterStats);

    console.log('isCorrect', isCorrect);

    if (isCorrect) {
      // ToastAndroid.show('Afrm', ToastAndroid.SHORT);
      setIsWon(true);
      setIsFinished(true);
      setIsStarted(false);
      setLetters(Array.from({length: 6}, () => Array(5).fill('')));
      setLetterStats(Array(30).fill(''));
      setCursorIndex(0);
      return;
    } else {
      console.log(cursorIndex);
      if (cursorIndex === 29) {
        // ToastAndroid.show(
        //   'Gardeş kaybettin kelime de çok kolaydı : ' + selectedWord,
        //   ToastAndroid.SHORT,
        // );
        setTimeout(() => {
          setIsFinished(true);
          setIsStarted(false);
          setIsWon(false);
          setLetters(Array.from({length: 6}, () => Array(5).fill('')));
          setLetterStats(Array(30).fill(''));
          setCursorIndex(0);
        }, 1750);
        return;
      }
    }
  };

  const handleRightMove = () => {
    if ((cursorIndex + 1) % 5 !== 0) {
      if (cursorIndex < 30) setCursorIndex(cursorIndex + 1);
    }
  };

  const handleLeftMove = () => {
    if (cursorIndex % 5 !== 0) {
      if (cursorIndex < 30) setCursorIndex(cursorIndex - 1);
    }
  };

  const handleLetterWrite = (
    label: string,
    currentRow: number,
    currentColumn: number,
    newLetters: Array<Array<string>>,
  ) => {
    if (
      !(currentColumn === 4 && newLetters[currentRow][currentColumn] !== '')
    ) {
      newLetters[currentRow][currentColumn] = label;
      setLetters(newLetters);
      if (cursorIndex < 30 && (cursorIndex + 1) % 5 !== 0)
        setCursorIndex(cursorIndex + 1);
    }
  };

  const handleLetterDelete = (
    currentRow: number,
    currentColumn: number,
    newLetters: Array<Array<string>>,
  ) => {
    if (newLetters[currentRow][currentColumn] === '' && cursorIndex % 5 !== 0) {
      if (cursorIndex > 0) setCursorIndex(cursorIndex - 1);

      let newRow = parseInt(cursorArray[cursorIndex - 1][0]);
      let newColumn = parseInt(cursorArray[cursorIndex - 1][1]);

      newLetters[newRow][newColumn] = '';
    }
    if (
      cursorIndex > 0 &&
      cursorIndex % 5 !== 0 &&
      (cursorIndex + 1) % 5 !== 0
    ) {
      setCursorIndex(cursorIndex - 1);
    }
    newLetters[currentRow][currentColumn] = '';
    setLetters(newLetters);
  };

  // My wordle logic trial
  // const KeyButton = ({
  //   label,
  //   borderColor,
  // }: {
  //   label: string;
  //   borderColor?: string;
  // }) => {
  //   const {colors} = useTheme();
  //   let backgroundColor = colors.background.primary;
  //   let breakness = false;
  //   let isOkay = false;
  //   for (let i = 0; i < 6; i++) {
  //     for (let j = 0; j < 5; j++) {
  //       if (
  //         letters[i][j] === label &&
  //         (letterStats[i * 5 + j] === 'G' || letterStats[i * 5 + j] === 'Y')
  //       ) {
  //         isOkay = true;
  //         breakness = true;
  //         break;
  //       }
  //     }
  //     if (breakness) break;
  //   }
  //   let isLetterExistInGuess = false;
  //   for (let i = 0; i < 5; i++) {
  //     let row = parseInt(cursorArray[cursorIndex - (5 + i)][0]);
  //     let col = parseInt(cursorArray[cursorIndex - (5 + i)][1]);
  //     if (letters[row][col] === label) {
  //       isLetterExistInGuess = true;
  //       break;
  //     }
  //   }
  //   if (!isOkay && isLetterExistInGuess)
  //     backgroundColor = colors.background.fourth;
  //   return (
  //     <TouchableOpacity
  //       className={`border rounded-lg justify-center items-center `}
  //       style={{
  //         width:
  //           label === '<' || label === '>'
  //             ? 50
  //             : label.length <= 2
  //             ? 30
  //             : undefined,
  //         height: 40,
  //         margin: 3,
  //         paddingHorizontal: label.length > 2 ? 12 : undefined,
  //         backgroundColor: colors.background.primary,
  //         borderColor:
  //           label === 'Sil'
  //             ? '#F75555'
  //             : borderColor || colors.background.fourth,
  //       }}
  //       onPress={async () => {
  //         let currentRow = parseInt(cursorArray[cursorIndex][0]);
  //         let currentColumn = parseInt(cursorArray[cursorIndex][1]);

  //         const newLetters = letters.map(row => [...row]);

  //         console.log(currentRow, currentColumn);
  //         if (label === 'Onayla') {
  //           handleApprove(currentRow, currentColumn);
  //         } else if (label === '>') {
  //           handleRightMove();
  //         } else if (label === '<') {
  //           handleLeftMove();
  //         } else if (label !== 'Sil') {
  //           handleLetterWrite(label, currentRow, currentColumn, newLetters);
  //         } else {
  //           handleLetterDelete(currentRow, currentColumn, newLetters);
  //         }
  //       }}>
  //       <Text
  //         className="text-xl font-rubik"
  //         style={{color: colors.text.primary}}>
  //         {label}
  //       </Text>
  //     </TouchableOpacity>
  //   );
  // };

  const KeyButton = ({
    label,
    borderColor,
  }: {
    label: string;
    borderColor?: string;
  }) => {
    const {colors} = useTheme();

    const backgroundColor = useMemo(() => {
      let isCorrectOrMisplaced = false;
      let isWrong = false;

      // G ve Y kontrolü
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 5; j++) {
          if (
            letters[i][j] === label &&
            (letterStats[i * 5 + j] === 'G' || letterStats[i * 5 + j] === 'Y')
          ) {
            isCorrectOrMisplaced = true;
            break;
          }
        }
      }

      // N kontrolü
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 5; j++) {
          if (letters[i][j] === label && letterStats[i * 5 + j] === 'N') {
            isWrong = true;
            break;
          }
        }
      }

      if (isCorrectOrMisplaced) return colors.background.primary; // yeşil/sarı zaten kutuda görünüyor
      if (isWrong) return colors.background.fourth; // '#a47fe1'

      // Eğer daha önce yazılmış ama yanlışlık durumu belli değilse:
      for (let i = 0; i < 5; i++) {
        let index = cursorIndex - (5 + i);
        if (index < 0) continue;
        const row = parseInt(cursorArray[index][0]);
        const col = parseInt(cursorArray[index][1]);
        if (letters[row][col] === label) {
          return colors.background.fourth;
        }
      }

      return colors.background.primary;
    }, [letters, letterStats, cursorIndex, label, colors]);

    return (
      <TouchableOpacity
        className="border rounded-lg justify-center items-center"
        style={{
          width:
            label === '<' || label === '>'
              ? 50
              : label.length <= 2
              ? 30
              : undefined,
          height: 40,
          margin: 3,
          paddingHorizontal: label.length > 2 ? 12 : undefined,
          backgroundColor: backgroundColor,
          borderColor:
            label === 'Sil'
              ? '#F75555'
              : borderColor || colors.background.fourth,
        }}
        onPress={async () => {
          let currentRow = parseInt(cursorArray[cursorIndex][0]);
          let currentColumn = parseInt(cursorArray[cursorIndex][1]);

          const newLetters = letters.map(row => [...row]);

          if (label === 'Onayla') {
            handleApprove(currentRow, currentColumn);
          } else if (label === '>') {
            handleRightMove();
          } else if (label === '<') {
            handleLeftMove();
          } else if (label !== 'Sil') {
            handleLetterWrite(label, currentRow, currentColumn, newLetters);
          } else {
            handleLetterDelete(currentRow, currentColumn, newLetters);
          }
        }}>
        <Text
          className="text-xl font-rubik"
          style={{color: colors.text.primary}}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <CustomAlert
        message={'Egzersizden ayrılmak istediğinize emin misiniz?'}
        visible={isAlertVisible}
        onYes={() => {
          rootNavigation.replace('Exercises');
          setIsAlertVisible(false);
        }}
        onCancel={() => {
          setIsAlertVisible(false);
        }}
      />
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
            color: theme.name === "Light" ? colors.text.primary : colors.background.secondary,
            fontSize: 24,
          }}>
          Kelime Egzersizi
        </Text>
      </View>
      {isStarted ? (
        <View className="flex-1 flex flex-col justify-between items-center mb-24">
          <View className="flex flex-col justify-center items-center mt-12">
            {letters.map((row, rowIndex) => (
              <View key={rowIndex} className="flex flex-row">
                {row.map((letter, colIndex) => (
                  <LetterBox
                    key={colIndex}
                    letter={letter}
                    borderColor={
                      rowIndex === parseInt(cursorArray[cursorIndex][0]) &&
                      colIndex === parseInt(cursorArray[cursorIndex][1])
                        ? '#88bff9'
                        : ''
                    }
                    backgroundColor={(() => {
                      let cursorIndex;
                      for (let i = 0; i < 30; i++) {
                        if (
                          cursorArray[i] ===
                          rowIndex.toString() + colIndex.toString()
                        ) {
                          cursorIndex = i;
                        }
                      }

                      console.log(selectedWord);
                      if (letterStats[cursorIndex!] === 'G') return '#41e873';
                      if (letterStats[cursorIndex!] === 'Y') return '#e2f246';
                    })()}
                  />
                ))}
              </View>
            ))}
          </View>
          {/* <Text
            className="text-2xl font-rubik text-center"
            style={{color: colors.text.primary}}>
            {selectedWord.toLocaleUpperCase('tr')}
          </Text> */}
          <View className="flex flex-col">
            {keyboardRows.slice(0, 3).map((row, rowIdx) => (
              <View
                key={rowIdx}
                className="flex flex-row justify-center items-center">
                {row.map((key, keyIdx) => (
                  <KeyButton key={keyIdx} label={key} />
                ))}
              </View>
            ))}
            <View className="flex flex-row justify-center">
              <KeyButton label="<" borderColor="#88bff9" />
              <KeyButton label=">" borderColor="#88bff9" />
              <KeyButton label="Onayla" borderColor="#55CC88" />
            </View>
          </View>
        </View>
      ) : isFinished ? (
        <View
          className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}>
          <View
            className="w-4/5 rounded-xl p-5 py-6 items-center justify-between"
            style={{backgroundColor: colors.background.primary}}>
            {!loading && (
              <>
                <Text
                  className="text-2xl font-rubik-medium mb-6 text-center"
                  style={{color: colors.text.primary}}>
                  {isWon
                    ? 'Tebrikler!'
                    : 'Kardeş bilemedin\nKelime de çok kolaydı'}
                </Text>
                <Text
                  className="text-2xl font-rubik mb-6"
                  style={{color: colors.text.primary}}>
                  {!isWon ? 'Doğru cevap : ' : 'Cevap : '} {selectedWord}
                </Text>
              </>
            )}
            {loading && (
              <View className="mb-4">
                <ActivityIndicator
                  size="large"
                  color={isWon ? '#55CC88' : '#f24646'}
                />
                <Text
                  className="mt-4 text-xl font-rubik"
                  style={{color: colors.text.primary}}>
                  Kelime bulunuyor...
                </Text>
              </View>
            )}
            <View className="w-3/4 mt-4">
              <TouchableOpacity
                onPress={() => {
                  setLoading(true);
                  getSelectedWord();
                }}
                className="p-3 rounded-xl items-center mx-1"
                style={{backgroundColor: isWon ? '#55CC88' : '#f24646'}}>
                <Text className="text-base font-rubik-medium text-white">
                  {isWon ? 'Bir Daha' : 'Tekrar Dene'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  navigation.replace('Exercises');
                }}
                className="p-3 rounded-xl items-center mx-1 mt-2"
                style={{backgroundColor: colors.background.secondary}}>
                <Text
                  className="text-base font-rubik-medium"
                  style={{color: colors.text.primary}}>
                  Çıkış
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View
          className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}>
          <View
            className="w-4/5 rounded-xl p-5 py-6 items-center justify-between"
            style={{backgroundColor: colors.background.primary}}>
            <Text
              className="text-2xl font-rubik-medium mb-6"
              style={{color: colors.text.primary}}>
              Egzersize Hoş Geldiniz
            </Text>
            {loading && (
              <View className="mb-4">
                <ActivityIndicator size="large" color={'#55CC88'} />
                <Text
                  className="mt-4 text-xl font-rubik"
                  style={{color: colors.text.primary}}>
                  Kelime bulunuyor...
                </Text>
              </View>
            )}
            <View className="w-3/4 mt-4">
              <TouchableOpacity
                onPress={() => {
                  setIsStarted(true);
                  setLoading(true);
                  getSelectedWord();
                }}
                className="p-3 rounded-xl items-center mx-1"
                style={{backgroundColor: '#55CC88'}}>
                <Text className="text-base font-rubik-medium text-white">
                  Başlat
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  navigation.replace('Exercises');
                }}
                className="p-3 rounded-xl items-center mx-1 mt-2"
                style={{backgroundColor: colors.background.secondary}}>
                <Text
                  className="text-base font-rubik-medium"
                  style={{color: colors.text.primary}}>
                  Çıkış
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );
};

export default WordGame;
