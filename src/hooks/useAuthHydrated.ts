'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../lib/auth-store';

/** Waits for zustand persist to rehydrate from localStorage (client-only). */
export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  return hydrated;
}
