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

const blueLightColors = {
  primary: {
    100: '#0061FF0A',
    112: '#0061FF0A',
    125: '#dff2ff',
    150: '#5dbfff',
    175: '#42b2fc',
    200: '#2d99ff', // 92b4e5
    250: '#0A9FFF', // 0080ff
    300: '#0091ff',
  },
  secondary: {
    300: '#40E0D0',
  },
  background: {
    primary: 'white',
    secondary: '#ecf1f3',
    third: '#dff2ff',
    fourth: '#d9e5f1',
  }, // #eaf0f3 #eaf0f3
  text: {
    primary: 'black',
    secondary: '#5d5d5d',
    third: '#666876',
  },
  gradient: ['#C5F0F0', '#9DDCFA', '#CCFCF4', '#DFEFF2'], // ['#E8FEFF', '#A3DDFF', '#B4FAEE', '#E8FEFF']
  gradientSecondary: ['#E8FEFF', '#A3DDFF', '#A2FCE8'],
  isLight: true,
};

const blueDarkColors = {
  primary: {
    100: '#0061FF0A',
    112: '#0061FF0A',
    125: '#dff2ff',
    150: '#5dbfff',
    175: '#42b2fc',
    200: '#13a2ff', // 3e5c8a
    250: '#0A9FFF',
    300: '#0091ff', // 3B82F6 / #0061FF
  },
  secondary: {
    300: '#40E0D0',
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
  gradient: ['#C5F0F0', '#9DDCFA', '#CCFCF4', '#DFEFF2'], // ['#9AAED6', '#C5D6D5', '#876073', '#A1815D'] // ['#C7FFF2', '#FBE8FF', '#FFD4A1'], ['#C5D6D5', '#876073', '#A1815D']
  gradientSecondary: ['#E8FEFF', '#A3DDFF', '#A2FCE8'],
  isLight: false,
};

const purpleLightColors = {
  primary: {
    100: '#0061FF0A',
    112: '#0061FF0A',
    125: '#EEDFFF',
    150: '#A95DFF',
    175: '#B066FF',
    200: '#882DFF', // 92b4e5
    250: '#6A00FF',
    300: '#6A00FF',
  },
  secondary: {
    300: '#E040AB',
  },
  background: {
    primary: 'white',
    secondary: '#ecf1f3',
    third: '#EEDFFF',
    fourth: '#d9e5f1',
  }, // #eaf0f3 #eaf0f3
  text: {
    primary: 'black',
    secondary: '#5d5d5d',
    third: '#666876',
  },
  gradient: ['#E8D3E5', '#DEC9F2', '#FCCCF1', '#E0D1EB'], // ['#E8FEFF', '#A3DDFF', '#B4FAEE', '#E8FEFF']
  gradientSecondary: ['#E8FEFF', '#A3DDFF', '#A2FCE8'],
  isLight: true,
};

const purpleDarkColors = {
  primary: {
    100: '#0061FF0A',
    112: '#0061FF0A',
    125: '#EEDFFF',
    150: '#B470FF',
    175: '#B066FF',
    200: '#AC69FF', // 92b4e5
    250: '#A863FF',
    300: '#9042FF',
  },
  secondary: {
    300: '#E040AB',
  },
  background: {
    primary: '#252525',
    secondary: '#171717',
    third: '#3B3B3B',
    fourth: '#2f373d',
  }, //primary: '#2f2f2f'
  text: {
    primary: 'white',
    secondary: '#eef2f8',
    third: '#666876',
  }, // secondary: '#3a3a3a
  gradient: ['#E8D3E5', '#DEC9F2', '#FCCCF1', '#E0D1EB'], // ['#C7FFF2', '#FBE8FF', '#FFD4A1'], ['#C5D6D5', '#876073', '#A1815D']
  gradientSecondary: ['#E8FEFF', '#A3DDFF', '#A2FCE8'],
  isLight: false,
};

const greenLightColors = {
  primary: {
    100: '#0061FF0A',
    112: '#0061FF0A',
    125: '#EBFFF2',
    150: '#5DFF90',
    175: '#26ED66',
    200: '#2AD13B',
    250: '#15D14A',
    300: '#15D443',
  },
  secondary: {
    300: '#AAFF00',
  },
  background: {
    primary: 'white',
    secondary: '#ecf1f3',
    third: '#EBFFF2',
    fourth: '#d9e5f1',
  }, // #eaf0f3 #eaf0f3
  text: {
    primary: 'black',
    secondary: '#5d5d5d',
    third: '#666876',
  },
  gradient: ['#EBF2DA', '#AEF5C2', '#EDFCCC', '#D1EDDE'], // ['#E8FEFF', '#A3DDFF', '#B4FAEE', '#E8FEFF']
  gradientSecondary: ['#E8FEFF', '#A3DDFF', '#A2FCE8'],
  isLight: true,
};

const greenDarkColors = {
  primary: {
    100: '#0061FF0A',
    112: '#0061FF0A',
    125: '#DFFFE9',
    150: '#5DFF90',
    175: '#26ED66',
    200: '#35E543',
    250: '#0DD63B',
    300: '#00DB50',
  },
  secondary: {
    300: '#AAFF00',
  },
  background: {
    primary: '#252525',
    secondary: '#171717',
    third: '#474747',
    fourth: '#2f373d',
  }, //primary: '#2f2f2f'
  text: {
    primary: 'white',
    secondary: '#eef2f8',
    third: '#666876',
  }, // secondary: '#3a3a3a
  gradient: ['#EBF2DA', '#AEF5C2', '#EDFCCC', '#D1EDDE'], // ['#C7FFF2', '#FBE8FF', '#FFD4A1'], ['#C5D6D5', '#876073', '#A1815D']
  gradientSecondary: ['#E8FEFF', '#A3DDFF', '#A2FCE8'],
  isLight: false,
};

// Tema nesnesi
export const themes: Record<string, ThemeType> = {
  blue: {
    light: {
      name: 'blue light',
      colors: blueLightColors,
    },
    dark: {
      name: 'blue dark',
      colors: blueDarkColors,
    },
  },
  purple: {
    light: {
      name: 'purple light',
      colors: purpleLightColors,
    },
    dark: {
      name: 'purple dark',
      colors: purpleDarkColors,
    },
  },
  green: {
    light: {
      name: 'green light',
      colors: greenLightColors,
    },
    dark: {
      name: 'green dark',
      colors: greenDarkColors,
    },
  },
};

export type ThemeColor = 'blue' | 'purple' | 'green';
export type ThemeMode = 'dark' | 'light' | 'system';

export function parseTheme(theme: string): {
  color: ThemeColor;
  mode: ThemeMode;
  themeObj: ThemeType; // hem light hem dark seti
} {
  const regex = /^(blue|purple|green)(Light|Dark|System)$/i;
  const match = theme.match(regex);

  if (!match) {
    return {
      color: 'blue',
      mode: 'system',
      themeObj: themes.blue,
    };
  }

  const color = match[1].toLowerCase() as ThemeColor;
  const mode = match[2].toLowerCase() as ThemeMode;

  // ilgili renk setini al (light+dark beraber)
  const themeObj = themes[color] ?? null;

  return {color, mode, themeObj};
}
