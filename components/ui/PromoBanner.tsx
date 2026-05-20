"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import styles from "./PromoBanner.module.css";

export default function PromoBanner() {
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [couponUsed, setCouponUsed] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("corelab_banner_dismissed");
    if (dismissed) return;

    const checkCouponStatus = async () => {
      if (!user) {
        setVisible(true);
        return;
      }

      try {
        const res = await fetch("/api/coupons/status?code=BIENVENIDO");
        const data = await res.json();
        if (!data.used) {
          setVisible(true);
        } else {
          setCouponUsed(true);
        }
      } catch {
        setVisible(true);
      }
    };

    if (!loading) {
      checkCouponStatus();
    }
  }, [user, loading]);

  const handleDismiss = () => {
    sessionStorage.setItem("corelab_banner_dismissed", "true");
    setVisible(false);
  };

  if (!visible || couponUsed) return null;

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
