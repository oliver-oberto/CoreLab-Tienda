"use client";
import { useState, useEffect } from "react";
import { useBanner } from "@/context/BannerContext";
import styles from "./PromoBanner.module.css";

export default function PromoBanner() {
  const { bannerVisible, hideBanner, couponUsed, couponLoading } = useBanner();
  // Pequeño estado local para la animación de entrada
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Comprobar si fue cerrado manualmente en esta sesión
    const dismissed = sessionStorage.getItem("corelab_banner_dismissed");
    if (dismissed) {
      hideBanner();
      return;
    }
    setMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No renderizar mientras carga el estado del cupón
  if (couponLoading) return null;
  // Si ya usó el cupón → nunca mostrar banner
  if (couponUsed) return null;
  // Si fue cerrado (context) → no mostrar
  if (!bannerVisible) return null;
  // Si fue cerrado en sesión antes de que montara
  if (!mounted) return null;

  const handleDismiss = () => {
    sessionStorage.setItem("corelab_banner_dismissed", "true");
    hideBanner();
  };

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
