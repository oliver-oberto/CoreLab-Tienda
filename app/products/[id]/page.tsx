"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ui/ProductCard";
import styles from "./page.module.css";

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [selectedFlavor, setSelectedFlavor] = useState<string>("");
  
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/products/${id}`)
        .then((r) => r.json())
        .then((d) => {
          setProduct(d.product);
          setRelated(d.related || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [params]);

  const flavors: string[] = (() => {
    try { return JSON.parse(product?.flavors || "[]"); } catch { return []; }
  })();

  const handleAddToCart = async () => {
    if (!user) { router.push("/auth/login"); return; }
    if (flavors.length > 0 && !selectedFlavor) {
      showToast("Por favor, selecciona un sabor 🥤", "info");
      return;
    }
    setAdding(true);
    await addToCart(product.id, quantity, selectedFlavor);
    showToast(`${product.name}${selectedFlavor ? ` (${selectedFlavor})` : ""} agregado al carrito 🛒`, "success");
    setAdding(false);
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!product) return (
    <div style={{ textAlign: "center", padding: "5rem 0" }}>
      <h2>Producto no encontrado</h2>
      <Link href="/products" className="btn btn-outline" style={{ marginTop: "1rem" }}>← Volver</Link>
    </div>
  );

  const images: string[] = (() => {
    try { 
      const parsed = JSON.parse(product.images); 
      // Ensure it's an array and filter out non-Unsplash/invalid URLs
      const arr = Array.isArray(parsed) ? parsed : [];
      return arr.filter((url: any) => typeof url === 'string' && url.includes('http'));
    } catch { 
      return []; 
    }
  })();
  if (!images.length && product.image_url && product.image_url.includes('http')) {
    images.push(product.image_url);
  }

  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/" className={styles.crumb}>Inicio</Link>
          <span className={styles.sep}>›</span>
          <Link href="/products" className={styles.crumb}>Productos</Link>
          <span className={styles.sep}>›</span>
          {(product.category_names || "").split(", ").map((catName: string, i: number) => {
            const slugs = (product.category_slugs || "").split(",");
            const slug = slugs[i] || "";
            return (
              <span key={catName}>
                <Link href={`/products?category=${slug}`} className={styles.crumb}>{catName}</Link>
                <span className={styles.sep}>›</span>
              </span>
            );
          })}
          <span className={styles.crumbActive}>{product.name}</span>
        </nav>

        <div className={styles.layout}>
          {/* Gallery */}
          <div className={styles.gallery}>
            {/* ... omitiendo imagen por brevedad ... */}
            <div className={styles.mainImage}>
              <Image
                src={images[activeImage] || product.image_url}
                alt={product.name}
                fill
                style={{ objectFit: "contain" }}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                onError={(e: any) => {
                  e.currentTarget.src = "/logo_corelab.png";
                }}
              />
              {discount && <span className={styles.discountBadge}>-{discount}%</span>}
              {product.featured === 1 && <span className={styles.featuredBadge}>⭐ Destacado</span>}
            </div>
            {images.length > 1 && (
              <div className={styles.thumbs}>
                {(images || []).map((img: string, i: number) => (
                  <button
                    key={i}
                    className={`${styles.thumb} ${activeImage === i ? styles.thumbActive : ""}`}
                    onClick={() => setActiveImage(i)}
                    id={`thumb-${i}`}
                  >
                    <Image src={img} alt={`${product.name} imagen ${i + 1}`} fill style={{ objectFit: "cover" }} sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Side */}
          <div className={styles.info}>
            <div className={styles.meta}>
              <span className={styles.brand}>{product.brand}</span>
              {(product.category_names || "").split(", ").map((cat: string) => (
                <span key={cat} className={styles.category}>{cat}</span>
              ))}
            </div>

            <h1 className={styles.name}>{product.name}</h1>

            {(product.flavor || product.weight || product.servings || flavors.length > 0) && (
              <div className={styles.specs}>
                {product.weight && <span className={styles.spec}>⚖️ {product.weight}</span>}
                {product.flavor && !flavors.length && <span className={styles.spec}>🍫 {product.flavor}</span>}
                {product.servings && <span className={styles.spec}>🥄 {product.servings} porciones</span>}
              </div>
            )}

            {flavors.length > 0 && (
              <div className={styles.flavorSection}>
                <label className={styles.flavorLabel}>
                  Elegí tu sabor <span className={styles.required}>*</span>
                </label>
                <div className={styles.flavorGrid}>
                  {flavors.map((f: string) => (
                    <button
                      key={f}
                      type="button"
                      className={`${styles.flavorBtn} ${selectedFlavor === f ? styles.flavorBtnActive : ""}`}
                      onClick={() => setSelectedFlavor(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.priceBlock}>
              <span className={styles.price}>{formatPrice(product.price)}</span>
              {product.original_price && (
                <span className={styles.originalPrice}>{formatPrice(product.original_price)}</span>
              )}
              {discount && (
                <span className={styles.discountTag}>{discount}% OFF</span>
              )}
            </div>

            <div className={styles.stockInfo}>
              <div className={`${styles.stockDot} ${product.stock > 0 ? styles.inStock : styles.noStock}`} />
              <span className={product.stock > 0 ? styles.stockOk : styles.stockNo}>
                {product.stock > 0 ? `Stock disponible (${product.stock} unidades)` : "Sin stock"}
              </span>
            </div>

            {product.stock > 0 && (
              <div className={styles.quantityRow}>
                <span className={styles.qtyLabel}>Cantidad</span>
                <div className={styles.qtyControl}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    id="qty-minus"
                  >−</button>
                  <span className={styles.qtyVal}>{quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    id="qty-plus"
                  >+</button>
                </div>
                <span className={styles.qtyTotal}>{formatPrice(product.price * quantity)}</span>
              </div>
            )}

            <div className={styles.actions}>
              <button
                className="btn btn-primary btn-lg btn-full"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || adding}
                id="add-to-cart-btn"
              >
                {adding ? "Agregando..." : product.stock === 0 ? "Sin stock" : "🛒 Agregar al carrito"}
              </button>
              <a
                href={`https://wa.me/543518792797?text=Hola!%20Me%20interesa%20${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-lg btn-full"
                id="wa-product-btn"
              >
                💬 Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Full Width Bottom Content */}
        <div className={styles.bottomLayout}>
          <div className={styles.description}>
            <h2 className={styles.descTitle}>Descripción del Producto</h2>
            <div className={styles.descText}>{product.description}</div>
          </div>

          <div className={styles.trustWrapper}>
            <div className={styles.trust}>
              {[
                { icon: "✅", text: "Producto 100% original" },
                { icon: "🚚", text: "Envío rápido a todo el país" },
                { icon: "🔒", text: "Compra 100% segura" },
              ].map((item) => (
                <div key={item.text} className={styles.trustItem}>
                  <span className={styles.trustIcon}>{item.icon}</span>
                  <span className={styles.trustText}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section style={{ marginTop: "4rem" }}>
            <div className="section-header">
              <span className="section-label">También te puede interesar</span>
              <h2 className="section-title">Productos Relacionados</h2>
            </div>
            <div className="grid-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
