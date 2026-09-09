/**
 * App.tsx
 * Entry point for WeatherWise AI.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { clearAuthToken, setAuthToken } from './src/services/api';
import { loadAuthToken, removeAuthToken, saveAuthToken } from './src/services/authService';

export default function App() {
  const [token, setToken] = React.useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = React.useState(true);

  React.useEffect(() => {
    loadAuthToken()
      .then(setToken)
      .finally(() => setIsRestoringSession(false));
  }, []);

  React.useEffect(() => {
    if (token) {
      setAuthToken(token);
    } else {
      clearAuthToken();
    }
  }, [token]);

  const handleAuthenticate = (nextToken: string) => {
    void saveAuthToken(nextToken);
    setToken(nextToken);
  };

  const handleLogout = () => {
    void removeAuthToken();
    setToken(null);
  };

  if (isRestoringSession) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator token={token} onAuthenticate={handleAuthenticate} onLogout={handleLogout} />
    </SafeAreaProvider>
  );
}
