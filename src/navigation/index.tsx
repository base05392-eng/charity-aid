import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScanScreen } from '../screens/ScanScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { ReviewScreen } from '../screens/ReviewScreen';
import { ResultCardScreen } from '../screens/ResultCardScreen';
import { RegistryScreen } from '../screens/RegistryScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AdminScreen } from '../screens/AdminScreen';

import { useAuthStore } from '../stores/authStore';
import { COLORS } from '../theme';

// ── Shared param types ───────────────────────────────────────────────────────

export type ScanStackParamList = {
  ScanHome: undefined;
  Camera: undefined;
  Review: { ocrResult?: { cid: string | null; nameEn: string | null; nameAr: string | null } };
  ResultCard: { cid: string; fromScan?: boolean };
};

export type RegistryStackParamList = {
  RegistryHome: undefined;
  ResultCard: { cid: string; fromScan?: boolean };
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
};

export type AdminStackParamList = {
  AdminHome: undefined;
};

// ── Navigators ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();
const ScanStack = createNativeStackNavigator<ScanStackParamList>();
const RegistryStack = createNativeStackNavigator<RegistryStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: COLORS.header },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700' as const },
};

function AdminHeaderButton({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { isUnlocked } = useAuthStore();
  return (
    <TouchableOpacity
      style={styles.adminBtn}
      onPress={() => navigation.getParent()?.navigate('AdminTab')}
    >
      <Text style={styles.adminBtnText}>
        {isUnlocked ? t('admin.unlocked') : t('admin.locked')}
      </Text>
    </TouchableOpacity>
  );
}

function ScanNavigator() {
  const { t } = useTranslation();
  return (
    <ScanStack.Navigator screenOptions={({ navigation }) => ({
      ...headerOptions,
      headerRight: () => <AdminHeaderButton navigation={navigation} />,
    })}>
      <ScanStack.Screen name="ScanHome" component={ScanScreen} options={{ title: t('scan.title') }} />
      <ScanStack.Screen name="Camera" component={CameraScreen} options={{ title: t('scan.cameraTitle'), headerRight: undefined }} />
      <ScanStack.Screen name="Review" component={ReviewScreen} options={{ title: t('review.title') }} />
      <ScanStack.Screen name="ResultCard" component={ResultCardScreen} options={{ title: t('result.title') }} />
    </ScanStack.Navigator>
  );
}

function RegistryNavigator() {
  const { t } = useTranslation();
  return (
    <RegistryStack.Navigator screenOptions={headerOptions}>
      <RegistryStack.Screen name="RegistryHome" component={RegistryScreen} options={{ title: t('registry.title') }} />
      <RegistryStack.Screen name="ResultCard" component={ResultCardScreen} options={{ title: t('result.title') }} />
    </RegistryStack.Navigator>
  );
}

// ── Root Tab Navigator ────────────────────────────────────────────────────────

export function AppNavigator() {
  const { t } = useTranslation();

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: '#AAAAAA',
        tabBarStyle: { backgroundColor: COLORS.header, borderTopWidth: 0, paddingBottom: 6, height: 58 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      }}>
        <Tab.Screen
          name="ScanTab"
          component={ScanNavigator}
          options={{ tabBarLabel: t('tabs.scan'), tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📷</Text> }}
        />
        <Tab.Screen
          name="RegistryTab"
          component={RegistryNavigator}
          options={{ tabBarLabel: t('tabs.registry'), tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text> }}
        />
        <Tab.Screen
          name="DashboardTab"
          component={DashboardScreen}
          options={{
            tabBarLabel: t('tabs.dashboard'),
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text>,
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.header },
            headerTintColor: '#FFF',
            headerTitle: t('dashboard.title'),
          }}
        />
        <Tab.Screen
          name="AdminTab"
          component={AdminScreen}
          options={{
            tabBarLabel: t('tabs.admin'),
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔒</Text>,
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.header },
            headerTintColor: '#FFF',
            headerTitle: t('admin.title'),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  adminBtn: {
    marginRight: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  adminBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});
