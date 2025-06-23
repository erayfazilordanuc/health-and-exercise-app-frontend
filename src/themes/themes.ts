import {colors, colorScheme} from './colors';

export type ThemeType = {
  light: Theme;
  dark: Theme;
};

export type Theme = {
  name: string;
  colors: typeof colorScheme;
};

// export enum ThemeType {
//   primary,
//   blue,
// }

const lightColors = {
  primary: {
    100: '#0061FF0A',
    150: '#5dbfff',
    200: '#5dbfff', // 92b4e5
    250: '#0080ff',
    300: '#0091ff',
  },
  background: {
    primary: 'white',
    secondary: '#ecf1f3',
    third: '#88bff9',
    fourth: '#d9e5f1',
  }, // #eaf0f3 #eaf0f3
  text: {
    primary: 'black',
    secondary: '#5d5d5d',
    third: '#666876',
  },
};

const darkColors = {
  primary: {
    100: '#0061FF0A',
    150: '#5dbfff',
    200: '#13a2ff', // 3e5c8a
    250: '#2c77ff',
    300: '#0091ff', // 3B82F6 / #0061FF
  },
  background: {
    primary: '#252525',
    secondary: '#171717',
    third: '#313e47',
    fourth: '#2f373d',
  }, //primary: '#2f2f2f'
  text: {
    primary: 'white',
    secondary: '#eef2f8',
    third: '#666876',
  }, // secondary: '#3a3a3a
};

// Tema nesnesi
export const themes: Record<string, ThemeType> = {
  primary: {
    light: {
      name: 'Light',
      colors: lightColors,
    },
    dark: {
      name: 'Dark',
      colors: darkColors,
    },
  },
};
