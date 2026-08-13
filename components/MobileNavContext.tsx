"use client";

import { createContext, useContext, useState } from "react";

type MobileNavState = { open: boolean; toggle: () => void; close: () => void };

const MobileNavContext = createContext<MobileNavState | null>(null);

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileNavContext.Provider
      value={{ open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) }}
    >
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error("useMobileNav must be used within a MobileNavProvider");
  return ctx;
}
