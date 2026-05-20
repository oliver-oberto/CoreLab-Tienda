"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBanner } from "@/context/BannerContext";
import styles from "./WelcomeModal.module.css";

const DELAY_MS = 9000;

export default function WelcomeModal() {
  const { couponUsed, couponLoading } = useBanner();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Esperar a que se resuelva el estado del cupón
    if (couponLoading) return;

    // Si ya usó el cupón → nunca mostrar
    if (couponUsed) return;

    // No logueado o logueado sin usar → mostrar cada visita
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [couponUsed, couponLoading]);

  const close = () => setVisible(false);

  const handleUsarAhora = () => {
    close();
    router.push("/products");
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText("BIENVENIDO");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencioso
    }
  };

  if (!visible) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && close()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      id="welcome-modal"
    >
      <div className={styles.modal}>
        {/* X button */}
        <button
          className={styles.closeBtn}
          onClick={close}
          aria-label="Cerrar"
          id="welcome-modal-close"
        >
          ✕
        </button>

        {/* Logo CoreLab */}
        <div className={styles.logo}>
          <img
            src="/assets/subidas/logo-oficial-transparent.png"
            alt="CoreLab Logo"
            className={styles.logoImg}
            style={{
              filter:
                "brightness(0) saturate(100%) invert(14%) sepia(35%) saturate(800%) hue-rotate(190deg) brightness(90%) contrast(95%)",
            }}
          />
          <div style={{ textAlign: "left", lineHeight: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "1rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "#1B2A4A",
              }}
            >
              CORELAB
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.45rem",
                letterSpacing: "0.2em",
                color: "#5C6F8A",
                textTransform: "uppercase",
              }}
            >
              SUPLEMENTOS
            </div>
          </div>
        </div>

        {/* Decorative line */}
        <div className={styles.divLine} />

        {/* Subtitle */}
        <p className={styles.subtitle} id="welcome-modal-title">
          Tu primera compra en CoreLab tiene
        </p>

        {/* 10% OFF */}
        <div className={styles.discount}>10% OFF</div>

        {/* Copyable coupon code */}
        <button
          className={styles.couponCode}
          onClick={handleCopyCode}
          title="Clic para copiar"
          id="welcome-modal-copy-code"
          aria-label="Copiar código BIENVENIDO"
        >
          <span className={styles.couponLabel}>
            {copied ? "✓ COPIADO" : "BIENVENIDO"}
          </span>
          <span className={styles.copyHint}>
            {copied ? "" : "CLIC PARA COPIAR"}
          </span>
        </button>

        {/* Terms */}
        <ul className={styles.terms}>
          <li>✓ Hasta $45.000</li>
          <li>✓ Un uso por cuenta</li>
          <li>✓ Solo usuarios registrados</li>
        </ul>

        {/* CTA */}
        <button
          className={styles.btnPrimary}
          onClick={handleUsarAhora}
          id="welcome-modal-use-btn"
        >
          IR A LA TIENDA →
        </button>

        {/* Ghost close */}
        <button
          className={styles.btnGhost}
          onClick={close}
          id="welcome-modal-close-btn"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
