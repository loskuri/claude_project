import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth-store';
import { API_URL } from '@/lib/api-client';

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { error?: string; user?: { id: string; email: string; firstName: string; onboardingComplete?: boolean }; accessToken?: string; refreshToken?: string };
      if (!res.ok) throw new Error(data.error ?? 'Error al ingresar');
      await setAuth(data.user!, data.accessToken!, data.refreshToken!);
      router.replace(data.user?.onboardingComplete ? '/(tabs)' : '/(onboarding)');
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-green-50">
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <View className="w-14 h-14 bg-brand-600 rounded-2xl items-center justify-center mb-3">
            <Text className="text-white text-2xl font-bold">N</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900">NutriPlan</Text>
          <Text className="text-gray-500 mt-1">Tu nutrición inteligente</Text>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <Text className="text-xl font-bold text-gray-900 mb-2">Ingresar</Text>
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
              placeholder="tu@email.com"
            />
          </View>
          <View className="mt-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Contraseña</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
              placeholder="••••••••"
            />
          </View>
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-brand-600 rounded-xl py-4 items-center mt-4"
          >
            <Text className="text-white font-semibold text-base">{loading ? 'Ingresando...' : 'Ingresar'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} className="mt-6 items-center">
          <Text className="text-gray-500">¿No tenés cuenta? <Text className="text-brand-600 font-semibold">Registrate</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
