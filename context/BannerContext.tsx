"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface BannerContextType {
  bannerVisible: boolean;
  hideBanner: () => void;
  couponUsed: boolean;
  couponLoading: boolean;
}

const BannerContext = createContext<BannerContextType>({
  bannerVisible: true,
  hideBanner: () => {},
  couponUsed: false,
  couponLoading: true,
});

export function BannerProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [bannerVisible, setBannerVisible] = useState(true);
  const [couponUsed, setCouponUsed] = useState(false);
  const [couponLoading, setCouponLoading] = useState(true);

  useEffect(() => {
    // Esperar a que auth termine de cargar
    if (authLoading) return;

    const check = async () => {
      // Usuario no logueado → cupón no usado (todavía no puede usarlo)
      if (!user) {
        setCouponUsed(false);
        setCouponLoading(false);
        return;
      }

      // Usuario logueado → consultar si ya redimió el cupón
      try {
        const res = await fetch("/api/coupons/status?code=BIENVENIDO");
        const data = await res.json();
        setCouponUsed(data.used);
        // Si ya usó el cupón, ocultar el banner también
        if (data.used) setBannerVisible(false);
      } catch {
        setCouponUsed(false);
      } finally {
        setCouponLoading(false);
      }
    };

    check();
  }, [user, authLoading]);

  const hideBanner = () => setBannerVisible(false);

  return (
    <BannerContext.Provider value={{ bannerVisible, hideBanner, couponUsed, couponLoading }}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  return useContext(BannerContext);
}
