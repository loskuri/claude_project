import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth-store';
import { API_URL } from '@/lib/api-client';

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ firstName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { error?: string; user?: { id: string; email: string; firstName: string }; accessToken?: string; refreshToken?: string };
      if (!res.ok) throw new Error(data.error ?? 'Error al registrarse');
      await setAuth(data.user!, data.accessToken!, data.refreshToken!);
      router.replace('/(onboarding)');
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-green-50">
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-8">
          <View className="w-14 h-14 bg-brand-600 rounded-2xl items-center justify-center mb-3">
            <Text className="text-white text-2xl font-bold">N</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900">NutriPlan</Text>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <Text className="text-xl font-bold text-gray-900 mb-2">Crear cuenta</Text>
          {(['firstName', 'email', 'password'] as const).map((field) => (
            <View key={field} className="mt-3">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                {field === 'firstName' ? 'Nombre' : field === 'email' ? 'Email' : 'Contraseña'}
              </Text>
              <TextInput
                value={form[field]}
                onChangeText={(v) => setForm((p) => ({ ...p, [field]: v }))}
                secureTextEntry={field === 'password'}
                keyboardType={field === 'email' ? 'email-address' : 'default'}
                autoCapitalize={field === 'firstName' ? 'words' : 'none'}
                className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                placeholder={field === 'firstName' ? 'Tu nombre' : field === 'email' ? 'tu@email.com' : 'Mín. 8 caracteres'}
              />
            </View>
          ))}
          <TouchableOpacity onPress={handleRegister} disabled={loading} className="bg-brand-600 rounded-xl py-4 items-center mt-4">
            <Text className="text-white font-semibold text-base">{loading ? 'Creando...' : 'Crear cuenta'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.back()} className="mt-6 items-center">
          <Text className="text-gray-500">¿Ya tenés cuenta? <Text className="text-brand-600 font-semibold">Ingresar</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
