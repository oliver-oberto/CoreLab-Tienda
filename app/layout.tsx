import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MainWrapper from "@/components/layout/MainWrapper";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { BannerProvider } from "@/context/BannerContext";
import ChatWidget from "@/components/chat/ChatWidget";
import PromoBanner from "@/components/ui/PromoBanner";
import WelcomeModal from "@/components/ui/WelcomeModal";

export const metadata: Metadata = {
  title: "CoreLab Suplementos — Distribuidor Premium Cellpure",
  description:
    "Tu tienda de confianza para suplementos deportivos de máxima calidad. Distribuidor autorizado Cellpure en Argentina. Proteínas, creatina, pre-entrenos y más.",
  keywords: "suplementos deportivos, proteína whey, creatina, pre-entreno, Cellpure, CoreLab, Argentina",
  openGraph: {
    title: "CoreLab Suplementos",
    description: "Distribuidor premium de suplementos Cellpure y más",
    type: "website",
  },
  icons: {
    icon: "/assets/subidas/Logo-corelab-fondo-azul.PNG",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <BannerProvider>
                <PromoBanner />
                <Navbar />
                <MainWrapper>{children}</MainWrapper>
                <Footer />
                <ChatWidget />
                <WelcomeModal />
              </BannerProvider>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
