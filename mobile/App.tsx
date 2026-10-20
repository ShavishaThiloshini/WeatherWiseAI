/**
 * App.tsx
 * Entry point for WeatherWise AI.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { clearAuthToken, setAuthToken } from './src/services/api';

export default function App() {
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (token) {
      setAuthToken(token);
    } else {
      clearAuthToken();
    }
  }, [token]);

  const handleAuthenticate = (nextToken: string) => {
    setAuthToken(nextToken);
    setToken(nextToken);
  };

  const handleLogout = () => {
    clearAuthToken();
    setToken(null);
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator token={token} onAuthenticate={handleAuthenticate} onLogout={handleLogout} />
    </SafeAreaProvider>
  );
}
