"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./HeroCarousel.module.css";

const IMAGES = [
  {
    src: "/assets/subidas/corelabimg1.jpeg",
    alt: "Suplemento Cellpure Creatine Monohidrato"
  },
  {
    src: "/assets/subidas/corelabimg2.jpeg",
    alt: "Suplemento Cellpure NAD+ con Resveratrol"
  },
  {
    src: "/assets/subidas/corelabimg3.jpeg",
    alt: "Suplemento Cellpure SHE Colágeno Hidrolizado"
  },
  {
    src: "/assets/subidas/corelabimg4.jpeg",
    alt: "Suplemento Cellpure Citrato de Magnesio"
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
    </div>
  );
}
