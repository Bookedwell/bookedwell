'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface BrandingState {
  logoUrl: string | null;
  primaryColor: string;
  salonName: string;
}

interface BrandingContextType extends BrandingState {
  updateBranding: (updates: Partial<BrandingState>) => void;
}

const BrandingContext = createContext<BrandingContextType | null>(null);

export function BrandingProvider({
  initialLogoUrl,
  initialPrimaryColor,
  initialSalonName,
  children,
}: {
  initialLogoUrl: string | null;
  initialPrimaryColor: string;
  initialSalonName: string;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<BrandingState>({
    logoUrl: initialLogoUrl,
    primaryColor: initialPrimaryColor,
    salonName: initialSalonName,
  });

  const updateBranding = useCallback((updates: Partial<BrandingState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <BrandingContext.Provider value={{ ...state, updateBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider');
  return ctx;
}
