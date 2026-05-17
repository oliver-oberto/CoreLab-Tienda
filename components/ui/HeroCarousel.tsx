"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./HeroCarousel.module.css";

const IMAGES = [
  {
    src: "/assets/subidas/FotoPrincipal.png",
    alt: "Suplementos Premium CoreLab",
    badgeLabel: "PRODUCTOS DESTACADOS",
    badgeBrand: "de Cellpure"
  },
  {
    src: "/assets/subidas/slide2.png",
    alt: "Proteínas de alta calidad",
    badgeLabel: "MÁXIMA RECUPERACIÓN",
    badgeBrand: "Proteínas Isoladas"
  },
  {
    src: "/assets/subidas/slide3.png",
    alt: "Pre-entrenos energéticos",
    badgeLabel: "ENERGÍA EXTREMA",
    badgeBrand: "Fórmulas Pre-Workout"
  }
];

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % IMAGES.length);
    }, 4000); // 4 seconds per slide

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.heroImage}>
      <div className={styles.heroImageWrap}>
        {IMAGES.map((img, index) => (
          <div
            key={index}
            className={`${styles.slide} ${index === activeIndex ? styles.active : ""}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              style={{ objectFit: "contain" }}
              priority={index === 0}
            />
          </div>
        ))}
        <div className={styles.heroImageOverlay} />
        
        {/* Indicators */}
        <div className={styles.indicators}>
          {IMAGES.map((_, idx) => (
            <button
              key={idx}
              className={`${styles.indicator} ${idx === activeIndex ? styles.activeIndicator : ""}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
      
      <div className={styles.heroBadge}>
        <span className={styles.heroBadgeLabel}>{IMAGES[activeIndex].badgeLabel}</span>
        <span className={styles.heroBadgeBrand}>{IMAGES[activeIndex].badgeBrand}</span>
      </div>
    </div>
  );
}
