import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AdminTabParamList } from '../types';
import { makeTabBar } from './AppTabBar';
import MetricsScreen from '../screens/admin/MetricsScreen';
import VocabularyScreen from '../screens/admin/VocabularyScreen';
import PreferencesScreen from '../screens/user/PreferencesScreen';
import ProfileScreen from '../screens/user/ProfileScreen';

const Tab = createBottomTabNavigator<AdminTabParamList>();

const TabBar = makeTabBar({
  AdminDashboard: { label: 'tab.metrics', icon: 'bar-chart-outline', iconActive: 'bar-chart' },
  Vocabulary: { label: 'tab.vocabulary', icon: 'book-outline', iconActive: 'book' },
  Preferences: { label: 'tab.settings', icon: 'options-outline', iconActive: 'options' },
  Profile: { label: 'tab.profile', icon: 'person-outline', iconActive: 'person' },
});

export default function AdminTabs() {
  return (
    // tabBar is called inside a render prop, so render it as an element to keep its hooks valid.
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="AdminDashboard" component={MetricsScreen} />
      <Tab.Screen name="Vocabulary" component={VocabularyScreen} />
      <Tab.Screen name="Preferences" component={PreferencesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
