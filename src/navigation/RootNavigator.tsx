import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import UserTabs from './UserTabs';
import AdminTabs from './AdminTabs';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SignRecognitionScreen from '../screens/preview/SignRecognitionScreen';
import VoiceSignScreen from '../screens/preview/VoiceSignScreen';
import TextToSignScreen from '../screens/preview/TextToSignScreen';
import BidirectionalChatScreen from '../screens/preview/BidirectionalChatScreen';
import SessionDetailScreen from '../screens/user/SessionDetailScreen';
import CompareVersionsScreen from '../screens/admin/CompareVersionsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Screens exist only for the matching auth state, so a signed-out user has no route
// to History or any account data (TC-AUTH-05). Signing in or out swaps the whole tree.
export default function RootNavigator() {
  const { status, user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {status !== 'signedIn' || !user ? (
        <Stack.Group>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          {user.role === 'admin' ? (
            <>
              <Stack.Screen name="AdminMain" component={AdminTabs} />
              <Stack.Screen name="CompareVersions" component={CompareVersionsScreen} />
            </>
          ) : (
            <Stack.Screen name="Main" component={UserTabs} />
          )}
          <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
          {/* FYP-2 previews, still on mock logic */}
          <Stack.Screen name="SignRecognition" component={SignRecognitionScreen} />
          <Stack.Screen name="VoiceSign" component={VoiceSignScreen} />
          <Stack.Screen name="TextToSign" component={TextToSignScreen} />
          <Stack.Screen name="BidirectionalChat" component={BidirectionalChatScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
