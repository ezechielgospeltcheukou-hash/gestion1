import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const LARGE_DATA_PREFIX = 'large_data_';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      
      const isLarge = await SecureStore.getItemAsync(LARGE_DATA_PREFIX + key);
      if (isLarge === 'true') {
        const fileUri = `${FileSystem.documentDirectory}${key}.txt`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          return await FileSystem.readAsStringAsync(fileUri);
        }
        return null;
      }
      
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        // SecureStore has a limit of 2048 bytes.
        // We use an arbitrary safe limit of 1800 bytes before switching to FileSystem
        if (value.length > 1800) {
          const fileUri = `${FileSystem.documentDirectory}${key}.txt`;
          await FileSystem.writeAsStringAsync(fileUri, value);
          await SecureStore.setItemAsync(LARGE_DATA_PREFIX + key, 'true');
        } else {
          await SecureStore.deleteItemAsync(LARGE_DATA_PREFIX + key).catch(() => {});
          await SecureStore.setItemAsync(key, value);
        }
      }
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        const fileUri = `${FileSystem.documentDirectory}${key}.txt`;
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        await SecureStore.deleteItemAsync(LARGE_DATA_PREFIX + key).catch(() => {});
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },
};
