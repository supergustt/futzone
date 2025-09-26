import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { BetsProvider } from '@/contexts/BetsContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { WalletProvider } from '@/contexts/WalletContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ProfileProvider>
      <SubscriptionProvider>
        <WalletProvider>
          <BetsProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </BetsProvider>
        </WalletProvider>
      </SubscriptionProvider>
    </ProfileProvider>
  );
}
