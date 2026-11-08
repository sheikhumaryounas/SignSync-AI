import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { UserTabParamList } from '../types';
import { makeTabBar } from './AppTabBar';
import HomeScreen from '../screens/user/HomeScreen';
import HistoryScreen from '../screens/user/HistoryScreen';
import BidirectionalChatScreen from '../screens/preview/BidirectionalChatScreen';
import ProfileScreen from '../screens/user/ProfileScreen';

const Tab = createBottomTabNavigator<UserTabParamList>();

const TabBar = makeTabBar({
  Home: { label: 'tab.home', icon: 'home-outline', iconActive: 'home' },
  Conversation: { label: 'tab.conversation', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  CommunicationHistory: { label: 'tab.history', icon: 'time-outline', iconActive: 'time' },
  Profile: { label: 'tab.profile', icon: 'person-outline', iconActive: 'person' },
});

export default function UserTabs() {
  return (
    // tabBar is called inside a render prop, so render it as an element to keep its hooks valid.
    <Tab.Navigator screenOptions={{ headerShown: false, animation: 'shift' }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Conversation" component={BidirectionalChatScreen} />
      <Tab.Screen name="CommunicationHistory" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
