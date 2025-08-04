'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dashboard } from '@/components/Dashboard';
import { AuthPage } from '@/components/AuthPage';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (session && status === 'authenticated') {
      // Already on the main page, show dashboard
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (!session) {
    return <AuthPage />;
  }

  return <Dashboard />;
}