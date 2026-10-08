'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

const CreditContext = createContext<{ balance: number; setBalance: (n: number) => void } | null>(null);

/** Số dư credit dùng chung cho thanh trên cùng, khung soạn và trang credit. */
export function CreditProvider({ initial, children }: { initial: number; children: ReactNode }) {
  const [balance, setBalance] = useState(initial);
  return <CreditContext.Provider value={{ balance, setBalance }}>{children}</CreditContext.Provider>;
}

export function useCredit() {
  const ctx = useContext(CreditContext);
  if (!ctx) throw new Error('useCredit phải nằm trong <CreditProvider>');
  return ctx;
}
