// src/components/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = document.cookie.includes('token');

    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return <>{children}</>;
}
