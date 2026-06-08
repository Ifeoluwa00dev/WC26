/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type FlagStyle = 'emoji' | 'circular' | 'pill' | 'retro';

interface FlagStyleContextType {
  flagStyle: FlagStyle;
  setFlagStyle: (style: FlagStyle) => void;
}

const FlagStyleContext = createContext<FlagStyleContextType | undefined>(undefined);

export function FlagStyleProvider({ children }: { children: React.ReactNode }) {
  const [flagStyle, setFlagStyleState] = useState<FlagStyle>(() => {
    const saved = localStorage.getItem('wc26-flag-style');
    if (saved === 'emoji' || saved === 'circular' || saved === 'pill' || saved === 'retro') {
      return saved as FlagStyle;
    }
    return 'emoji';
  });

  const setFlagStyle = (style: FlagStyle) => {
    setFlagStyleState(style);
    localStorage.setItem('wc26-flag-style', style);
  };

  return (
    <FlagStyleContext.Provider value={{ flagStyle, setFlagStyle }}>
      {children}
    </FlagStyleContext.Provider>
  );
}

export function useFlagStyle() {
  const context = useContext(FlagStyleContext);
  if (context === undefined) {
    throw new Error('useFlagStyle must be used within a FlagStyleProvider');
  }
  return context;
}
