import React, { useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import LoginScreen from './src/common/LoginScreen';
import { StadiumLocation, UserRole } from './src/types';
import ConsumerView from './src/views/consumer/ConsumerView';
import AdminView from './src/views/admin/AdminView';
import VendorView from './src/views/vendor/VendorView';

import stadiumData from './mockStadium.json';

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  // ── Shared state (single source of truth for all views) ──
  const [locations, setLocations] = useState<StadiumLocation[]>(
    stadiumData.locations as StadiumLocation[],
  );
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);

  // ── Active views ──
  const goBack = () => setActiveRole(null);

  const renderContent = () => {
    if (!activeRole) {
      return (
        <SafeAreaView style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor="#08080f" />
          <LoginScreen
            onLogin={(role) => setActiveRole(role)}
          />
        </SafeAreaView>
      );
    }

    if (activeRole === 'consumer') {
      return (
        <ConsumerView
          locations={locations}
          onSwitchRole={goBack}
        />
      );
    }

    if (activeRole === 'admin') {
      return (
        <AdminView
          locations={locations}
          onLocationsChange={setLocations}
          onSwitchRole={goBack}
        />
      );
    }

    return (
      <VendorView
        locations={locations}
        onLocationsChange={setLocations}
        onSwitchRole={goBack}
      />
    );
  };

  return (
    <SafeAreaProvider>
      {renderContent()}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#08080f',
  },
});
