import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import tw from 'twrnc';

// Lucide Icons
import { 
  LayoutDashboard, 
  Radio, 
  Users, 
  History, 
  User, 
  Shield, 
  Activity,
  Settings as SettingsIcon 
} from 'lucide-react-native';

// Context Providers
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SOSProvider, useSOS } from './src/context/SOSContext';

// Pages/Screens
import { LandingPage } from './src/pages/LandingPage';
import { Login } from './src/pages/Login';
import { Registration } from './src/pages/Registration';
import { ForgotPassword } from './src/pages/ForgotPassword';
import { ResetPassword } from './src/pages/ResetPassword';
import { VerifyEmail } from './src/pages/VerifyEmail';
import { VerifyEmailPending } from './src/pages/VerifyEmailPending';
import { Dashboard } from './src/pages/Dashboard';
import { SendSOS } from './src/pages/SendSOS';
import { EmergencyContacts } from './src/pages/EmergencyContacts';
import { LiveTracking } from './src/pages/LiveTracking';
import { EmergencyChat } from './src/pages/EmergencyChat';
import { EmergencyHistory } from './src/pages/EmergencyHistory';
import { UserProfile } from './src/pages/UserProfile';
import { Settings } from './src/pages/Settings';
import { VolunteerDashboard } from './src/pages/VolunteerDashboard';
import { AdminDashboard } from './src/pages/AdminDashboard';

// Navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Styles Helper
const tabScreenOptions = (iconName: string) => ({
  tabBarActiveTintColor: '#f43f5e', // rose-500
  tabBarInactiveTintColor: '#94a3b8', // slate-400
  tabBarStyle: tw('bg-slate-900 border-t border-slate-800 py-1.5 h-14'),
  headerShown: false,
});

// 1. Citizen Tab Navigator
function CitizenTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Dashboard" 
        component={Dashboard} 
        options={{
          ...tabScreenOptions('Dashboard'),
          tabBarLabel: 'Control Center',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="SendSOS" 
        component={SendSOS} 
        options={{
          ...tabScreenOptions('SendSOS'),
          tabBarLabel: 'Broadcast SOS',
          tabBarIcon: ({ color, size }) => <Radio color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Contacts" 
        component={EmergencyContacts} 
        options={{
          ...tabScreenOptions('Contacts'),
          tabBarLabel: 'Contacts',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="History" 
        component={EmergencyHistory} 
        options={{
          ...tabScreenOptions('History'),
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={UserProfile} 
        options={{
          ...tabScreenOptions('Profile'),
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

// 2. Volunteer Tab Navigator
function VolunteerTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="VolunteerDashboard" 
        component={VolunteerDashboard} 
        options={{
          ...tabScreenOptions('VolunteerDashboard'),
          tabBarLabel: 'Radar',
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="History" 
        component={EmergencyHistory} 
        options={{
          ...tabScreenOptions('History'),
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={UserProfile} 
        options={{
          ...tabScreenOptions('Profile'),
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

// 3. Admin Tab Navigator
function AdminTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="AdminDashboard" 
        component={AdminDashboard} 
        options={{
          ...tabScreenOptions('AdminDashboard'),
          tabBarLabel: 'Admin Terminal',
          tabBarIcon: ({ color, size }) => <Shield color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="History" 
        component={EmergencyHistory} 
        options={{
          ...tabScreenOptions('History'),
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={UserProfile} 
        options={{
          ...tabScreenOptions('Profile'),
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Loading Spinner Screen
function LoadingScreen() {
  return (
    <View style={tw'flex-1 bg-slate-950 justify-center items-center'}>
      <ActivityIndicator size="large" color="#f43f5e" />
    </View>
  );
}

// Main Navigation Routing
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user === null ? (
        // Unauthenticated Screens
        <>
          <Stack.Screen name="Landing" component={LandingPage} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Registration} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmail} />
          <Stack.Screen name="VerifyEmailPending" component={VerifyEmailPending} />
        </>
      ) : (
        // Authenticated Screens
        <>
          {user.role === 'admin' ? (
            <Stack.Screen name="MainTabs" component={AdminTabs} />
          ) : user.role === 'volunteer' ? (
            <Stack.Screen name="MainTabs" component={VolunteerTabs} />
          ) : (
            <Stack.Screen name="MainTabs" component={CitizenTabs} />
          )}
          
          {/* Common Floating Overlay Screens */}
          <Stack.Screen name="LiveTracking" component={LiveTracking} />
          <Stack.Screen name="EmergencyChat" component={EmergencyChat} />
          <Stack.Screen name="Settings" component={Settings} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <SOSProvider>
          <AppNavigator />
          <StatusBar style="light" />
        </SOSProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}
