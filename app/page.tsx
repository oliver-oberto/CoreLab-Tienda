"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ui/ProductCard";
import styles from "./page.module.css";

const CATEGORIES = [
  { name: "Proteínas", slug: "proteinas", icon: "💪", desc: "Whey, Caseína, Vegana" },
  { name: "Creatina", slug: "creatina", icon: "🥛", desc: "Monohidratada, HCL" },
  { name: "Pre-Entreno", slug: "pre-entreno", icon: "⚡", desc: "Energía & Foco" },
  { name: "Aminoácidos", slug: "aminoacidos", icon: "🧬", desc: "BCAA, Glutamina" },
  { name: "Vitaminas", slug: "vitaminas", icon: "🌿", desc: "Multivitamínicos, Vitamina C" },
  { name: "Minerales", slug: "minerales", icon: "⚗️", desc: "Magnesio, Zinc" },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?featured=true&limit=4")
      .then((r) => r.json())
      .then((d) => { setFeatured(d.products || []); setLoading(false); });
  }, []);

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={styles.heroGlow} />
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <span className="section-label">Distribuidor Autorizado Cellpure</span>
              <h1 className={styles.heroTitle}>
                Suplementos<br />
                <span className={styles.heroAccent}>Premium</span><br />
                para tu mejor versión
              </h1>
              <p className={styles.heroDesc}>
                La ciencia detrás de tu rendimiento. Productos de máxima calidad,
                entregados directamente a tu puerta.
              </p>
              <div className={styles.heroBtns}>
                <Link href="/products" className="btn btn-primary btn-lg" id="hero-cta-btn">
                  Comprar ahora
                </Link>
                <a href="https://wa.me/543518792797?text=Hola!%20Quiero%20consultar%20sobre%20sus%20productos" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg" id="hero-wa-btn">
                  Consultar por WhatsApp
                </a>
              </div>
              <div className={styles.heroStats}>
                <div className={styles.stat}>
                  <span className={styles.statNum}>12+</span>
                  <span className={styles.statLabel}>Productos</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <span className={styles.statNum}>100%</span>
                  <span className={styles.statLabel}>Original</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <span className={styles.statNum}>24h</span>
                  <span className={styles.statLabel}>Envío</span>
                </div>
              </div>
            </div>
            <div className={styles.heroImage}>
              <div className={styles.heroImageWrap}>
                <Image
                  src="/assets/subidas/FotoPrincipal.png"
                  alt="Suplementos CoreLab"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
                <div className={styles.heroImageOverlay} />
              </div>
              <div className={styles.heroBadge}>
                <span className={styles.heroBadgeLabel}>PRODUCTOS DESTACADOS</span>
                <span className={styles.heroBadgeBrand}>de Cellpure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className={styles.trustBar}>
        <div className="container">
          <div className={styles.trustItems}>
            {[
              { icon: "🚚", text: "Envío rápido a todo el país" },
              { icon: "✅", text: "Productos 100% originales" },
              { icon: "🔒", text: "Pago seguro" },
              { icon: "📱", text: "Atención por WhatsApp" },
            ].map((item) => (
              <div key={item.text} className={styles.trustItem}>
                <span className={styles.trustIcon}>{item.icon}</span>
                <span className={styles.trustText}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Explorar</span>
            <h2 className="section-title">Categorías</h2>
            <p className="section-subtitle">Encontrá el suplemento ideal para tus objetivos</p>
          </div>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`/products?category=${cat.slug}`} className={styles.categoryCard} id={`cat-${cat.slug}`}>
                <span className={styles.catIcon}>{cat.icon}</span>
                <h3 className={styles.catName}>{cat.name}</h3>
                <p className={styles.catDesc}>{cat.desc}</p>
                <span className={styles.catArrow}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Lo más elegido</span>
            <h2 className="section-title">Productos Destacados</h2>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="grid-4">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Link href="/products" className="btn btn-outline btn-lg" id="home-view-all-btn">
              Ver todos los productos
            </Link>
          </div>
        </div>
      </section>

      {/* ── Cellpure Banner ── */}
      <section className={styles.banner}>
        <div className="container">
          <div className={styles.bannerInner}>
            <div className={styles.bannerText}>
              <span className="section-label">Nuestras marcas asociadas</span>
              <h2 className={styles.bannerTitle}>Distribuidor Autorizado Cellpure</h2>
              <p className={styles.bannerDesc}>
                Somos revendedores oficiales de Cellpure, una de las marcas de suplementos más
                reconocidas. Garantizamos la autenticidad de cada producto.
              </p>
              <Link href="/products" className="btn btn-primary" id="banner-shop-btn">
                Ver productos Cellpure
              </Link>
            </div>
            <div className={styles.bannerBrands}>
              {["Cellpure", "UltraTech", "Vase24k"].map((b, i) => (
                <div key={i} className={styles.brandPill}>{b}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaTitle}>¿Listo para transformar tu rendimiento?</h2>
            <p className={styles.ctaDesc}>Consultanos por WhatsApp y te ayudamos a elegir el suplemento ideal.</p>
            <div className={styles.ctaBtns}>
              <Link href="/products" className="btn btn-primary btn-lg" id="cta-products-btn">Ir al catálogo</Link>
              <a href="https://wa.me/543518792797" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-lg" id="cta-wa-btn">
                💬 Escribirnos
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
