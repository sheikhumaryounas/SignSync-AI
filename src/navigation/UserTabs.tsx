import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { UserTabParamList } from '../types';
import { makeTabBar } from './AppTabBar';
import HomeScreen from '../screens/user/HomeScreen';
import HistoryScreen from '../screens/user/HistoryScreen';
import PreferencesScreen from '../screens/user/PreferencesScreen';
import ProfileScreen from '../screens/user/ProfileScreen';

const Tab = createBottomTabNavigator<UserTabParamList>();

const TabBar = makeTabBar({
  Home: { label: 'tab.home', icon: 'home-outline', iconActive: 'home' },
  CommunicationHistory: { label: 'tab.history', icon: 'time-outline', iconActive: 'time' },
  Preferences: { label: 'tab.settings', icon: 'options-outline', iconActive: 'options' },
  Profile: { label: 'tab.profile', icon: 'person-outline', iconActive: 'person' },
});

export default function UserTabs() {
  return (
    // tabBar is called inside a render prop, so render it as an element to keep its hooks valid.
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="CommunicationHistory" component={HistoryScreen} />
      <Tab.Screen name="Preferences" component={PreferencesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
