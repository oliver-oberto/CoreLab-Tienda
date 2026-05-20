"use client";
import { createContext, useContext, useState } from "react";

interface BannerContextType {
  bannerVisible: boolean;
  hideBanner: () => void;
}

const BannerContext = createContext<BannerContextType>({
  bannerVisible: true,
  hideBanner: () => {},
});

export function BannerProvider({ children }: { children: React.ReactNode }) {
  const [bannerVisible, setBannerVisible] = useState(true);

  const hideBanner = () => setBannerVisible(false);

  return (
    <BannerContext.Provider value={{ bannerVisible, hideBanner }}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  return useContext(BannerContext);
}
