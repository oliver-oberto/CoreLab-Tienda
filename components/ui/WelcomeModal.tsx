"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./WelcomeModal.module.css";

const POPUP_STORAGE_KEY = "corelab_popup_shown";
const DELAY_MS = 15000;

export default function WelcomeModal() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Solo mostrar si nunca se mostró antes
    const alreadyShown = localStorage.getItem(POPUP_STORAGE_KEY);
    if (alreadyShown) return;

    const timer = setTimeout(() => {
      setVisible(true);
      localStorage.setItem(POPUP_STORAGE_KEY, "true");
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const close = useCallback(() => setVisible(false), []);

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
      // Fallback silencioso
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
        {/* Close button */}
        <button
          className={styles.closeBtn}
          onClick={close}
          aria-label="Cerrar"
          id="welcome-modal-close"
        >
          ✕
        </button>

        {/* Header decorative */}
        <div className={styles.header}>
          <div className={styles.giftIcon}>🎁</div>
          <div className={styles.shine} aria-hidden="true" />
        </div>

        {/* Content */}
        <div className={styles.body}>
          <p className={styles.subtitle}>¡Bienvenido a CoreLab!</p>
          <h2 className={styles.title} id="welcome-modal-title">
            Tu primera compra tiene
          </h2>
          <div className={styles.discount}>10% OFF</div>

          {/* Coupon code */}
          <button
            className={styles.couponCode}
            onClick={handleCopyCode}
            title="Clic para copiar"
            id="welcome-modal-copy-code"
            aria-label="Copiar código BIENVENIDO"
          >
            <span className={styles.couponLabel}>
              {copied ? "¡Copiado! ✓" : "BIENVENIDO"}
            </span>
            <span className={styles.copyHint}>{copied ? "" : "clic para copiar"}</span>
          </button>

          {/* Terms */}
          <ul className={styles.terms}>
            <li>✓ Válido en productos hasta $45.000</li>
            <li>✓ Solo para usuarios registrados</li>
            <li>✓ Un uso por cuenta</li>
          </ul>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={styles.btnPrimary}
              onClick={handleUsarAhora}
              id="welcome-modal-use-btn"
            >
              Ir a la tienda →
            </button>
            <button
              className={styles.btnGhost}
              onClick={close}
              id="welcome-modal-close-btn"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
