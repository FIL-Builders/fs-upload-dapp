"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ConfettiContextType = {
  triggerConfetti: () => void;
  showConfetti: boolean;
};

export const ConfettiContext = createContext<ConfettiContextType | undefined>(
  undefined
);

export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const [showConfetti, setShowConfetti] = useState(false);

  const triggerConfetti = () => {
    setShowConfetti(true);
  };

  useEffect(() => {
    if (showConfetti) {
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }
  }, [showConfetti]);

  return (
    <ConfettiContext.Provider value={{ triggerConfetti, showConfetti }}>
      {children}
    </ConfettiContext.Provider>
  );
}