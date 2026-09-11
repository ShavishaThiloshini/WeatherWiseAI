/**
 * App.tsx
 * Entry point for WeatherWise AI.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { clearAuthToken, setAuthToken, setOnTokenExpired } from './src/services/api';
import { loadAuthToken, removeAuthToken, saveAuthToken } from './src/services/authService';

export default function App() {
  const [token, setToken] = React.useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = React.useState(true);

  const handleLogout = React.useCallback(() => {
    void removeAuthToken();
    setToken(null);
  }, []);

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

  React.useEffect(() => {
    setOnTokenExpired(handleLogout);
    return () => setOnTokenExpired(null);
  }, [handleLogout]);

  const handleAuthenticate = (nextToken: string) => {
    void saveAuthToken(nextToken);
    setToken(nextToken);
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
