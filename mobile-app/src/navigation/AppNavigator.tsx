import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {useTheme} from '@react-navigation/native';

import {useAuth} from '@/hooks/useAuth';
import {RootStackParamList} from '@/types';

// Screens
import SplashScreen from '@/screens/SplashScreen';
import AuthScreen from '@/screens/AuthScreen';
import MainTabNavigator from './MainTabNavigator';
import ProjectDetailScreen from '@/screens/ProjectDetailScreen';
import ChatSessionScreen from '@/screens/ChatSessionScreen';
import CodeViewerScreen from '@/screens/CodeViewerScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const {isAuthenticated, isLoading} = useAuth();
  const {colors} = useTheme();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.notification,
        },
      }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: {backgroundColor: colors.background},
        }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="ProjectDetail"
              component={ProjectDetailScreen}
              options={{
                headerShown: true,
                title: 'Project Details',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="ChatSession"
              component={ChatSessionScreen}
              options={{
                headerShown: true,
                title: 'Chat Session',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="CodeViewer"
              component={CodeViewerScreen}
              options={{
                headerShown: true,
                title: 'Code Viewer',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                headerShown: true,
                title: 'Settings',
                headerBackTitleVisible: false,
              }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                headerShown: true,
                title: 'Notifications',
                headerBackTitleVisible: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}