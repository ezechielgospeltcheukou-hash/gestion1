import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = '@comptabilite:theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme) {
          setTheme(savedTheme as Theme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(THEME_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export const Colors = {
  light: {
    background: '#f3f4f6',
    card: '#ffffff',
    text: '#111827',
    textSecondary: '#4b5563',
    primary: '#059669',
    primaryLight: '#d1fae5',
    border: '#e5e7eb',
    error: '#ef4444',
    errorLight: '#fef2f2',
  },
  dark: {
    background: '#111827',
    card: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    primary: '#10b981',
    primaryLight: '#047857',
    border: '#374151',
    error: '#f87171',
    errorLight: '#7f1d1d',
  }
};
