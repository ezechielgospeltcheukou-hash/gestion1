import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { storage } from '../utils/storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'comptabilite_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await storage.getItem(THEME_KEY);
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    try {
      await storage.setItem(THEME_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      await storage.setItem(THEME_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
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

export function useThemeColors() {
  const { theme } = useContext(ThemeContext) || { theme: 'light' };
  return Colors[theme || 'light'];
}

export const Colors = {
  light: {
    background: '#f3f4f6',
    card: '#ffffff',
    text: '#111827',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    primary: '#059669',
    primaryDark: '#047857',
    primaryLight: '#d1fae5',
    primaryLighter: '#ecfdf5',
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    error: '#ef4444',
    errorLight: '#fef2f2',
    errorBorder: '#fecaca',
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    headerBg: '#059669',
    headerText: '#ffffff',
    inputBg: '#f9fafb',
    shadow: '#000000',
    statusBar: '#059669',
    statusBarStyle: 'light-content' as const,
  },
  dark: {
    background: '#111827',
    card: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#9ca3af',
    textTertiary: '#6b7280',
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#064e3b',
    primaryLighter: '#022c22',
    border: '#374151',
    borderLight: '#1f2937',
    error: '#f87171',
    errorLight: '#7f1d1d',
    errorBorder: '#991b1b',
    success: '#34d399',
    successLight: '#064e3b',
    warning: '#fbbf24',
    warningLight: '#78350f',
    headerBg: '#065f46',
    headerText: '#f9fafb',
    inputBg: '#374151',
    shadow: '#000000',
    statusBar: '#065f46',
    statusBarStyle: 'light-content' as const,
  }
};
