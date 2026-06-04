"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import styles from "./ProductCard.module.css";

interface Product {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  image_url: string;
  brand: string;
  category_name?: string;
  stock: number;
  featured?: number;
  flavor?: string;
  weight?: string;
}

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (product.stock === 0) return;
    await addToCart(product.id, 1);
    showToast(`${product.name} agregado al carrito 🛒`, "success");
  };

  return (
    <Link href={`/products/${product.id}`} className={styles.card} id={`product-card-${product.id}`}>
      <div className={styles.imageWrap}>
        <Image
          src={(product.image_url && product.image_url.includes('http')) ? product.image_url : "/logo_corelab.png"}
          alt={product.name}
          fill
          style={{ objectFit: "contain" }}
          sizes="(max-width: 768px) 50vw, 25vw"
          onError={(e: any) => {
            e.currentTarget.src = "/logo_corelab.png";
          }}
        />
        {product.featured === 1 && (
          <span className={styles.featuredBadge}>⭐ Destacado</span>
        )}
        {discount && (
          <span className={styles.discountBadge}>-{discount}%</span>
        )}
        {product.stock === 0 && (
          <div className={styles.outOfStock}>Sin stock</div>
        )}
        <div className={styles.overlay}>
          <button
            className={`btn btn-primary btn-sm ${styles.quickAdd}`}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            id={`quick-add-${product.id}`}
          >
            {product.stock === 0 ? "Sin stock" : "Agregar al carrito"}
          </button>
        </div>
      </div>

      <div className={styles.info}>
        <div className={styles.meta}>
          <span className={styles.brand}>{product.brand}</span>
          {product.category_name && (
            <span className={styles.category}>{product.category_name}</span>
          )}
        </div>

        <h3 className={styles.name}>{product.name}</h3>

        {(product.flavor || product.weight) && (
          <p className={styles.details}>
            {[product.flavor, product.weight].filter(Boolean).join(" · ")}
          </p>
        )}

        <div className={styles.priceRow}>
          <div className={styles.prices}>
            <span className={styles.price}>{formatPrice(product.price)}</span>
            {product.original_price && (
              <span className={styles.originalPrice}>{formatPrice(product.original_price)}</span>
            )}
          </div>
          <div className={`${styles.stockDot} ${product.stock > 0 ? styles.inStock : styles.noStock}`} />
        </div>
      </div>
    </Link>
  );
}
