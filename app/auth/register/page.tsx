"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    const result = await register(form.name, form.email, form.password, form.phone);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    showToast("¡Cuenta creada con éxito! Bienvenido 🎉", "success");
    router.push("/");
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
            <polygon points="50,5 78,20 95,50 78,80 50,95 22,80 5,50 22,20" fill="none" stroke="#C0C0C0" strokeWidth="4"/>
            <polygon points="50,15 72,27 85,50 72,73 50,85 28,73 15,50 28,27" fill="none" stroke="#A9A9A9" strokeWidth="2"/>
            <circle cx="50" cy="50" r="14" fill="white"/>
          </svg>
        </div>
        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.subtitle}>Registrate en CoreLab Suplementos</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form} id="register-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Nombre completo</label>
            <input id="name" type="text" className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Juan García" autoComplete="name" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input id="email" type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="tu@email.com" autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="phone">Teléfono (opcional)</label>
            <input id="phone" type="tel" className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="351 555-0000" autoComplete="tel" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input id="password" type="password" className="form-input" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="confirm">Confirmar contraseña</label>
            <input id="confirm" type="password" className="form-input" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required placeholder="Repetí la contraseña" autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} id="register-submit-btn">
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className={styles.switchText}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/auth/login" className={styles.switchLink} id="go-login-link">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  );
}
