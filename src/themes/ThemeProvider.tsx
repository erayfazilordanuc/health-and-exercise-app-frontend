import {colorScheme} from './colors';
import {useColorScheme} from 'react-native';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {parseTheme, Theme, themes} from './themes';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tema Tipi

// Context Türü
interface ThemeContextProps {
  theme: Theme;
  colors: typeof colorScheme;
  setTheme: (themeType: Theme) => void;
}

// ThemeContext
export const ThemeContext = createContext<ThemeContextProps>({
  theme: themes.blue.light,
  colors: themes.blue.light.colors,
  setTheme: (theme: Theme) => {},
  // For initialization
});

interface ThemeProviderProps {
  children: ReactNode;
}

// ThemeProvider
export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(
    colorScheme === 'dark' ? themes.blue.dark : themes.blue.light,
  );

  const onSchemeChange = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user: User = JSON.parse(userData);

      if (user.theme) {
        const {color, mode, themeObj} = parseTheme(user.theme);
        if (!color || !themeObj) return;

        if (mode === 'system') {
          setTheme(colorScheme === 'dark' ? themeObj.dark : themeObj.light);
          return;
        } else {
          setTheme(mode === 'dark' ? themeObj.dark : themeObj.light);
          return;
        }
      }
    }

    setTheme(colorScheme === 'light' ? themes.blue.light : themes.blue.dark);
  };

  useEffect(() => {
    onSchemeChange();
  }, [colorScheme]);

  // for getting the system-user default theme
  // Geri kalanına launchda bak
  const defaultTheme: ThemeContextProps = {
    theme,
    colors: theme.colors, // Geçerli renk setini al
    setTheme: (theme: Theme) => setTheme(theme),
  };

  return (
    <ThemeContext.Provider value={defaultTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook
export const useTheme = (): ThemeContextProps => useContext(ThemeContext);
