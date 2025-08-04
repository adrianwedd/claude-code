import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider as PaperProvider} from 'react-native-paper';

// Navigation
import AppNavigator from '@/navigation/AppNavigator';

// Providers
import {AuthProvider} from '@/hooks/useAuth';
import {WebSocketProvider} from '@/hooks/useWebSocket';
import {NotificationProvider} from '@/hooks/useNotifications';
import {ThemeProvider} from '@/hooks/useTheme';

// Services
import '@/services/notifications';
import '@/services/crashlytics';

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PaperProvider>
            <AuthProvider>
              <WebSocketProvider>
                <NotificationProvider>
                  <StatusBar
                    barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                    backgroundColor="transparent"
                    translucent
                  />
                  <AppNavigator />
                </NotificationProvider>
              </WebSocketProvider>
            </AuthProvider>
          </PaperProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}