import {colorScheme} from './colors';
import {useColorScheme} from 'react-native';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {Theme, themes} from './themes';
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
  theme: themes.primary.light,
  colors: themes.primary.light.colors,
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
    colorScheme === 'dark' ? themes.primary.dark : themes.primary.light,
  );

  const onSchemeChange = async () => {
    const userData = await AsyncStorage.getItem('user');
    const user: User = JSON.parse(userData!);

    if (user) {
      const defaultThemeJson = await AsyncStorage.getItem(
        `${user.username}-main-theme`,
      );
      if (defaultThemeJson) {
        const defaultTheme: Theme = defaultThemeJson
          ? JSON.parse(defaultThemeJson)
          : null;
        if (theme) {
          setTheme(defaultTheme);
          return;
        }
      }
    }

    setTheme(
      colorScheme === 'light' ? themes.primary.light : themes.primary.dark,
    );
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
