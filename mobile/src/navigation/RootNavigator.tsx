/**
 * navigation/RootNavigator.tsx
 * Main navigation structure for WeatherWise AI.
 *
 * Architecture:
 *  - Bottom Tab Navigator as the primary navigation shell
 *  - Stack Navigator inside the "More" section for secondary screens
 *
 * To add new screens in Day 2+:
 *  1. Import the screen component.
 *  2. Add a <Tab.Screen> or <Stack.Screen> entry.
 *  3. Add the route name to the RootTabParamList or RootStackParamList types.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { ForecastScreen } from '../screens/ForecastScreen';
import { TravelScreen } from '../screens/TravelScreen';
import { PlantsScreen } from '../screens/PlantsScreen';
import { WeatherMapScreen } from '../screens/WeatherMapScreen';
import { AIAssistantScreen } from '../screens/AIAssistantScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SafetyScreen } from '../screens/SafetyScreen';
import { AuthScreen } from '../screens/AuthScreen';

import { COLORS, TYPOGRAPHY } from '../constants/theme';

// ---------------------------------------------------------------------------
// Param lists (extend as new routes are added in Day 2+)
// ---------------------------------------------------------------------------

export type RootTabParamList = {
  Home: undefined;
  Forecast: undefined;
  Safety: undefined;
  TravelMap: undefined;
  Profile: undefined;
};

export type TravelMapStackParamList = {
  Travel: undefined;
  Map: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Plants: undefined;
  Assistant: undefined;
};

// ---------------------------------------------------------------------------
// Tab icons (using emoji until an icon library is introduced in Day 2+)
// ---------------------------------------------------------------------------

const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Forecast: '📅',
  Safety: '🛡️',
  TravelMap: '🧭',
  Profile: '⚙️',
};

// ---------------------------------------------------------------------------
// Travel and map stack
// ---------------------------------------------------------------------------

const TravelMapStack = createNativeStackNavigator<TravelMapStackParamList>();

function TravelMapNavigator() {
  return (
    <TravelMapStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: TYPOGRAPHY.fontWeight.semiBold,
          fontSize: TYPOGRAPHY.fontSize.l,
        },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <TravelMapStack.Screen name="Travel" component={TravelScreen} options={{ title: 'Travel Safety' }} />
      <TravelMapStack.Screen name="Map" component={WeatherMapScreen} options={{ title: 'Weather Map' }} />
    </TravelMapStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Profile stack (secondary screens accessible from the Profile tab)
// ---------------------------------------------------------------------------

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: TYPOGRAPHY.fontWeight.semiBold,
          fontSize: TYPOGRAPHY.fontSize.l,
        },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'Profile & Settings' }} />
      <ProfileStack.Screen name="Plants" component={PlantsScreen} options={{ title: 'Plant Care' }} />
      <ProfileStack.Screen name="Assistant" component={AIAssistantScreen} options={{ title: 'AI Assistant' }} />
    </ProfileStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Root bottom tab navigator
// ---------------------------------------------------------------------------

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator({
  token,
  onAuthenticate,
  onLogout,
}: {
  token: string | null;
  onAuthenticate: (token: string) => void;
  onLogout: () => void;
}) {
  if (!token) {
    return <AuthScreen onAuthenticate={onAuthenticate} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.backgroundCard,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarLabelStyle: {
            fontSize: TYPOGRAPHY.fontSize.xs,
            fontWeight: TYPOGRAPHY.fontWeight.medium,
          },
          // Emoji tab icons (replace with react-native-vector-icons or similar in Day 2+)
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>
              {TAB_ICONS[route.name] ?? '●'}
            </Text>
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="Forecast" component={ForecastScreen} options={{ title: 'Forecast' }} />
        <Tab.Screen name="Safety" component={SafetyScreen} options={{ title: 'Safety' }} />
        <Tab.Screen name="TravelMap" component={TravelMapNavigator} options={{ title: 'Travel & Map' }} />
        <Tab.Screen
          name="Profile"
          children={(props: any) => <ProfileScreen {...(props as any)} onLogout={onLogout} />}
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
