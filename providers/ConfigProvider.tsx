"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { config as defaultConfig } from "@/config";
import { ConfigType, ConfigContextType } from "@/types";

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const CONFIG_STORAGE_KEY = "app-config";

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfig] = useState<ConfigType>(defaultConfig);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        // Validate that all required keys exist and have correct types
        const validatedConfig = {
          storageCapacity:
            typeof parsedConfig.storageCapacity === "number"
              ? parsedConfig.storageCapacity
              : defaultConfig.storageCapacity,
          persistencePeriod:
            typeof parsedConfig.persistencePeriod === "number"
              ? parsedConfig.persistencePeriod
              : defaultConfig.persistencePeriod,
          minDaysThreshold:
            typeof parsedConfig.minDaysThreshold === "number"
              ? parsedConfig.minDaysThreshold
              : defaultConfig.minDaysThreshold,
          withCDN:
            typeof parsedConfig.withCDN === "boolean"
              ? parsedConfig.withCDN
              : defaultConfig.withCDN,
        };
        setConfig(validatedConfig);
      }
    } catch (error) {
      console.warn(
        "Failed to load config from localStorage, using defaults:",
        error
      );
    }
  }, []);

  const updateConfig = (newConfig: Partial<ConfigType>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updatedConfig));
    } catch (error) {
      console.error("Failed to save config to localStorage:", error);
    }
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    try {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove config from localStorage:", error);
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <ConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
