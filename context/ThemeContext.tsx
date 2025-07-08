import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeColors {
  background: string;
  text: string;
  primary: string;
}

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  text: '#000000',
  primary: '#FF6B8A'
};

const darkColors: ThemeColors = {
  background: '#000000',
  text: '#FFFFFF',
  primary: '#FF6B8A'
};

interface ThemeContextValue {
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({ colors: lightColors });

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  return (
    <ThemeContext.Provider value={{ colors }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
