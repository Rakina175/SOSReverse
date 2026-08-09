import { Platform } from 'react-native';

// Default server URL. 
// - On iOS simulator or physical devices using ADB reverse port forwarding, 'localhost' will work.
// - On Android emulator, '10.0.2.2' maps to the host's localhost.
export const API_BASE = Platform.select({
  android: 'http://10.0.2.2:5000',
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000',
});

// If physical device is connected via USB and ADB reverse is running:
// adb reverse tcp:5000 tcp:5000
// we can use http://localhost:5000 directly.
export const API_BASE_URL = 'http://localhost:5000'; 

export const API_URL = `${API_BASE_URL}/api`;
