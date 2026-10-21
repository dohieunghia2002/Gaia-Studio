'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type CreditState = {
  balance: number;
  setBalance: (n: number) => void;
  /** false ở chế độ nhóm riêng (lib/access.ts): không nạp tiền, chủ nhóm cấp credit. */
  canTopup: boolean;
};

const CreditContext = createContext<CreditState | null>(null);

/** Số dư credit dùng chung cho thanh trên cùng, khung soạn và trang credit. */
export function CreditProvider({ initial, canTopup, children }: { initial: number; canTopup: boolean; children: ReactNode }) {
  const [balance, setBalance] = useState(initial);
  return <CreditContext.Provider value={{ balance, setBalance, canTopup }}>{children}</CreditContext.Provider>;
}

export function useCredit() {
  const ctx = useContext(CreditContext);
  if (!ctx) throw new Error('useCredit phải nằm trong <CreditProvider>');
  return ctx;
}
