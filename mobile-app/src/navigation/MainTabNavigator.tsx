import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useTheme} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import {MainTabParamList} from '@/types';
import {LAYOUT} from '@/constants';

// Stack Navigators
import ProjectStackNavigator from './ProjectStackNavigator';
import ChatStackNavigator from './ChatStackNavigator';
import FilesStackNavigator from './FilesStackNavigator';
import CIStackNavigator from './CIStackNavigator';
import ProfileScreen from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const {colors} = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          switch (route.name) {
            case 'Projects':
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            case 'Chat':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Files':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'CI':
              iconName = focused ? 'build' : 'build-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text + '80', // 50% opacity
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: LAYOUT.TAB_BAR_HEIGHT,
          paddingBottom: LAYOUT.SAFE_AREA_PADDING,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}>
      <Tab.Screen
        name="Projects"
        component={ProjectStackNavigator}
        options={{
          tabBarLabel: 'Projects',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStackNavigator}
        options={{
          tabBarLabel: 'Chat',
          tabBarBadge: undefined, // TODO: Add unread count
        }}
      />
      <Tab.Screen
        name="Files"
        component={FilesStackNavigator}
        options={{
          tabBarLabel: 'Files',
        }}
      />
      <Tab.Screen
        name="CI"
        component={CIStackNavigator}
        options={{
          tabBarLabel: 'CI/CD',
          tabBarBadge: undefined, // TODO: Add running builds count
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}