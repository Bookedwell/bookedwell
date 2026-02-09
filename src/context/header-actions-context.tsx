'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface HeaderActionsContextType {
  headerActions: React.ReactNode | null;
  setHeaderActions: (actions: React.ReactNode | null) => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextType | null>(null);

export function HeaderActionsProvider({ children }: { children: React.ReactNode }) {
  const [headerActions, setHeaderActions] = useState<React.ReactNode | null>(null);

  return (
    <HeaderActionsContext.Provider value={{ headerActions, setHeaderActions }}>
      {children}
    </HeaderActionsContext.Provider>
  );
}

export function useHeaderActions() {
  const ctx = useContext(HeaderActionsContext);
  if (!ctx) throw new Error('useHeaderActions must be used within HeaderActionsProvider');
  return ctx;
}
