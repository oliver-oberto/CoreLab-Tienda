"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    router.push("/");
  };

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`} id="main-navbar">
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo} id="navbar-logo">
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
          <div className={styles.logoText}>
            <span className={styles.logoBrand}>CORELAB</span>
            <span className={styles.logoSub}>SUPLEMENTOS</span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <ul className={styles.navLinks}>
          <li><Link href="/" className={styles.navLink} id="nav-home">Inicio</Link></li>
          <li><Link href="/products" className={styles.navLink} id="nav-products">Productos</Link></li>
          <li>
            <a href="https://wa.me/543518792797" target="_blank" rel="noopener noreferrer" className={styles.navLink} id="nav-contact">
              Contacto
            </a>
          </li>
          {user?.role === "admin" && (
            <li><Link href="/admin" className={`${styles.navLink} ${styles.adminLink}`} id="nav-admin">Admin</Link></li>
          )}
        </ul>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Cart */}
          <Link href="/cart" className={styles.cartBtn} id="navbar-cart-btn" aria-label="Carrito">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {count > 0 && <span className={styles.cartCount}>{count > 9 ? "9+" : count}</span>}
          </Link>

          {/* User */}
          {user ? (
            <div className={styles.userMenu}>
              <button
                className={styles.userBtn}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                id="navbar-user-btn"
              >
                <span className={styles.userAvatar}>{user.name[0].toUpperCase()}</span>
                <span className={styles.userName}>{user.name.split(" ")[0]}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {userMenuOpen && (
                <div className={styles.dropdown} id="user-dropdown">
                  <Link href="/account" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                    👤 Mi cuenta
                  </Link>
                  <Link href="/account#orders" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                    📦 Mis pedidos
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <button className={styles.dropdownItem} onClick={handleLogout} id="logout-btn">
                    🚪 Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="btn btn-outline btn-sm" id="navbar-login-btn">
              Iniciar sesión
            </Link>
          )}

          {/* Mobile hamburger */}
          <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} id="mobile-menu-btn" aria-label="Menu">
            <span className={`${styles.bar} ${menuOpen ? styles.open : ""}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.open : ""}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.open : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu} id="mobile-menu">
          <Link href="/" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Inicio</Link>
          <Link href="/products" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Productos</Link>
          <Link href="/cart" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Carrito {count > 0 && `(${count})`}</Link>
          {user ? (
            <>
              <Link href="/account" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Mi cuenta</Link>
              {user.role === "admin" && <Link href="/admin" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Admin</Link>}
              <button className={`${styles.mobileLink} ${styles.mobileLinkBtn}`} onClick={() => { handleLogout(); setMenuOpen(false); }}>Cerrar sesión</button>
            </>
          ) : (
            <Link href="/auth/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Iniciar sesión</Link>
          )}
        </div>
      )}
    </nav>
  );
}
