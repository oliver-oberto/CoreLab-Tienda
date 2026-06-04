import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.glow} />
      <div className="container">
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <img
                src="/assets/subidas/logo_azul_transparente.png"
                alt="CoreLab Logo"
                style={{
                  height: "48px",
                  width: "auto",
                  objectFit: "contain",
                  display: "block"
                }}
              />
              <div>
                <div className={styles.logoBrand}>CORELAB</div>
                <div className={styles.logoSub}>SUPLEMENTOS</div>
              </div>
            </Link>
            <p className={styles.desc}>
              Distribuidor autorizado Cellpure en Argentina. Suplementos deportivos de máxima calidad a tu alcance.
            </p>
            <div className={styles.socials}>
              <a href="https://wa.me/543518792797" target="_blank" rel="noopener noreferrer" className={styles.social} aria-label="WhatsApp" id="footer-whatsapp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Tienda</h4>
            <ul className={styles.links}>
              <li><Link href="/products?category=proteinas" className={styles.link}>Proteínas</Link></li>
              <li><Link href="/products?category=creatina" className={styles.link}>Creatina</Link></li>
              <li><Link href="/products?category=pre-entreno" className={styles.link}>Pre-Entreno</Link></li>
              <li><Link href="/products?category=aminoacidos" className={styles.link}>Aminoácidos</Link></li>
              <li><Link href="/products?category=vitaminas" className={styles.link}>Vitaminas</Link></li>
            </ul>
          </div>

          <div className={styles.col}>
            <h4 className={styles.colTitle}>Ayuda</h4>
            <ul className={styles.links}>
              <li><Link href="/auth/register" className={styles.link}>Crear cuenta</Link></li>
              <li><Link href="/account" className={styles.link}>Mis pedidos</Link></li>
              <li>
                <a href="https://wa.me/543518792797?text=Hola!%20Tengo%20una%20consulta%20sobre%20un%20pedido" target="_blank" rel="noopener noreferrer" className={styles.link}>
                  Soporte por WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Contacto</h4>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.01 8.18 2 2 0 012 6.18l3-2a2 2 0 012.18.48l2.89 4.05a2 2 0 01-.45 2.74L8.09 12.61a16 16 0 006.29 6.29l1.34-1.53a2 2 0 012.74-.45l4.05 2.89a2 2 0 01.48 2.18z" /></svg>
                <span>+54 351 879-2797</span>
              </div>
              <div className={styles.contactItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                <span>admin@corelab.com</span>
              </div>
            </div>
            <div className={styles.distribBadge}>
              <span className={styles.distribText}>DISTRIBUIDOR AUTORIZADO</span>
              <span className={styles.distribBrand}>Cellpure</span>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>© {new Date().getFullYear()} CoreLab Suplementos. Todos los derechos reservados.</p>
          <p className={styles.copy} style={{ color: "var(--gray-dark)", fontSize: "0.75rem" }}>
            Distribuidor Autorizado Cellpure — Argentina
          </p>
        </div>
      </div>
    </footer>
  );
}
