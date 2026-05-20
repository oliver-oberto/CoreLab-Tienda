"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBanner } from "@/context/BannerContext";
import styles from "./PromoBanner.module.css";

export default function PromoBanner() {
  const { user, loading } = useAuth();
  const { bannerVisible, hideBanner } = useBanner();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Si ya fue cerrado en esta sesión, no renderizar y ocultar del contexto
    const dismissed = sessionStorage.getItem("corelab_banner_dismissed");
    if (dismissed) {
      hideBanner();
      return;
    }

    const checkCouponStatus = async () => {
      if (!user) {
        setShouldRender(true);
        return;
      }

      try {
        const res = await fetch("/api/coupons/status?code=BIENVENIDO");
        const data = await res.json();
        if (!data.used) {
          setShouldRender(true);
        } else {
          hideBanner();
        }
      } catch {
        setShouldRender(true);
      }
    };

    if (!loading) {
      checkCouponStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const handleDismiss = () => {
    sessionStorage.setItem("corelab_banner_dismissed", "true");
    hideBanner();
  };

  if (!bannerVisible || !shouldRender) return null;

  return (
    <div className={styles.banner} role="banner" aria-label="Promoción de bienvenida">
      <div className={styles.inner}>
        <span className={styles.icon}>🎁</span>
        <p className={styles.text}>
          Primera compra: código{" "}
          <strong className={styles.code}>BIENVENIDO</strong>
          {" "}→ 10% OFF{" "}
          <span className={styles.condition}>· Válido en productos hasta $45.000</span>
        </p>
        <button
          className={styles.closeBtn}
          onClick={handleDismiss}
          aria-label="Cerrar banner"
          id="promo-banner-close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
