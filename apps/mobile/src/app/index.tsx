import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/lib/auth-store';

export default function Index() {
  const router = useRouter();
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/(auth)/login');
    } else if (!user.onboardingComplete) {
      router.replace('/(onboarding)');
    } else {
      router.replace('/(tabs)');
    }
  }, [hydrated, user, router]);

  return (
    <View className="flex-1 items-center justify-center bg-brand-50">
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  );
}
