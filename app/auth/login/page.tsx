"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import styles from "../auth.module.css";

function LoginContent() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    showToast("¡Bienvenido de vuelta!", "success");
    router.push(redirect);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <img
            src="/assets/subidas/logo-oficial-transparent.png"
            alt="CoreLab Logo"
            style={{
              height: "50px",
              width: "auto",
              objectFit: "contain",
              display: "block"
            }}
          />
        </div>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Ingresá a tu cuenta CoreLab</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form} id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input id="email" type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="tu@email.com" autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input id="password" type="password" className="form-input" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required placeholder="••••••••" autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} id="login-submit-btn">
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className={styles.switchText}>
          ¿No tenés cuenta?{" "}
          <Link href="/auth/register" className={styles.switchLink} id="go-register-link">Creá una acá</Link>
        </p>

        <div className={styles.adminHint}>
          <p>Admin demo: <code>admin@corelab.com</code> / <code>admin123</code></p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
