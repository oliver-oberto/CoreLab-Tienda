"use client";
import { useBanner } from "@/context/BannerContext";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const { bannerVisible } = useBanner();

  return (
    <main
      style={{
        paddingTop: bannerVisible
          ? "calc(var(--banner-height) + var(--navbar-height))"
          : "var(--navbar-height)",
        transition: "padding-top 0.25s ease",
      }}
    >
      {children}
    </main>
  );
}
