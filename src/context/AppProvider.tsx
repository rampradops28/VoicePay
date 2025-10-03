'use client';

import { BillingProvider } from './BillingContext';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return <BillingProvider>{children}</BillingProvider>;
}
