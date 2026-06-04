"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import styles from "./CouponField.module.css";

interface CouponFieldProps {
  cartItems: { productId: number; price: number }[];
  cartTotal: number;
  onCouponApplied: (discountAmount: number, code: string) => void;
  onCouponRemoved: () => void;
}

type CouponStatus = "idle" | "loading" | "valid" | "invalid";

export default function CouponField({
  cartItems,
  cartTotal,
  onCouponApplied,
  onCouponRemoved,
}: CouponFieldProps) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<CouponStatus>("idle");
  const [message, setMessage] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;
    setStatus("loading");
    setMessage("");
    setRequiresLogin(false);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          cartItems: cartItems.map((i) => ({ productId: i.productId, price: i.price })),
        }),
      });
      const data = await res.json();

      if (data.valid) {
        setStatus("valid");
        setAppliedCode(data.code);
        setMessage(`✅ ¡Cupón aplicado! Ahorrás $${data.discountAmount.toLocaleString("es-AR")}`);
        onCouponApplied(data.discountAmount, data.code);
      } else {
        setStatus("invalid");
        setMessage(data.reason || "Cupón inválido");
        if (data.requiresLogin) setRequiresLogin(true);
      }
    } catch {
      setStatus("invalid");
      setMessage("Error al validar el cupón. Intentá de nuevo.");
    }
  };

  const handleRemove = () => {
    setCode("");
    setStatus("idle");
    setMessage("");
    setAppliedCode("");
    setRequiresLogin(false);
    onCouponRemoved();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleApply();
  };

  if (status === "valid") {
    return (
      <div className={styles.wrapper}>
        <div className={styles.appliedBadge}>
          <span className={styles.appliedIcon}>🎁</span>
          <div className={styles.appliedInfo}>
            <span className={styles.appliedCode}>{appliedCode}</span>
            <span className={styles.appliedMsg}>{message}</span>
          </div>
          <button
            className={styles.removeBtn}
            onClick={handleRemove}
            aria-label="Quitar cupón"
            id="coupon-remove-btn"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.field}>
        <input
          id="coupon-input"
          className={`${styles.input} ${status === "invalid" ? styles.inputError : ""}`}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="¿Tenés un cupón?"
          disabled={status === "loading"}
          maxLength={30}
          autoComplete="off"
        />
        <button
          id="coupon-apply-btn"
          className={styles.applyBtn}
          onClick={handleApply}
          disabled={status === "loading" || !code.trim()}
        >
          {status === "loading" ? (
            <span className={styles.spinner} />
          ) : (
            "APLICAR"
          )}
        </button>
      </div>

      {message && (
        <p className={`${styles.message} ${status === "invalid" ? styles.messageError : ""}`}>
          {message}
        </p>
      )}

      {requiresLogin && (
        <div className={styles.loginPrompt}>
          <Link href="/auth/login" className={styles.loginLink} id="coupon-login-link">
            Iniciar sesión →
          </Link>
        </div>
      )}
    </div>
  );
}
