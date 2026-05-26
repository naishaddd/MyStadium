import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { UserRole } from '../types';

type Props = {
  onLogin: (role: UserRole) => void;
};

const mockAccounts: Record<
  string,
  { password: string; role: UserRole; label: string }
> = {
  admin: { password: 'admin', role: 'admin', label: 'Admin' },
  user: { password: 'user', role: 'consumer', label: 'User' },
  vendor: { password: 'vendor', role: 'vendor', label: 'Vendor' },
};

export default function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const accountHints = useMemo(
    () => Object.values(mockAccounts).map((account) => account.label).join(', '),
    [],
  );

  const handleLogin = () => {
    const account = mockAccounts[username.trim().toLowerCase()];

    if (!account || account.password !== password.trim()) {
      Alert.alert('Login failed', 'Use admin/admin or user/user to continue.');
      return;
    }

    onLogin(account.role);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Access</Text>
        <Text style={styles.title}>MyStadium Login</Text>
        <Text style={styles.subtitle}>
          Sign in with a simple username and password.
        </Text>

        <View style={styles.form}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Username"
            placeholderTextColor="#70707a"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Password"
            placeholderTextColor="#70707a"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </Pressable>
        </View>

        <Text style={styles.hint}>
          Available mock roles: {accountHints}. User credentials map to the fan view.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f3ee',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eadfd4',
    borderRadius: 24,
    padding: 24,
  },
  kicker: {
    color: '#d86f47',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
    marginBottom: 10,
  },
  title: {
    color: '#231912',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#81685c',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: '#fff8f4',
    borderWidth: 1,
    borderColor: '#eadfd4',
    borderRadius: 14,
    color: '#231912',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  button: {
    marginTop: 6,
    backgroundColor: '#d86f47',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  hint: {
    color: '#8f6f62',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
  },
});