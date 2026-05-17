"use client";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });
}

const FREE_SHIPPING_THRESHOLD = 50000;

export default function CartPage() {
  const { items, count, total, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🛒</span>
        <h1 className={styles.emptyTitle}>Tu carrito está vacío</h1>
        <p className={styles.emptyDesc}>Explorá nuestro catálogo y agregá productos</p>
        <Link href="/products" className="btn btn-primary btn-lg" id="cart-go-shop-btn">Ir a la tienda</Link>
      </div>
    );
  }

  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : 1500;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Mi Carrito</h1>
          <span className={styles.count}>{count} {count === 1 ? "producto" : "productos"}</span>
        </div>

        <div className={styles.layout}>
          {/* Items */}
          <div className={styles.items}>
            {items.map((item) => (
              <div key={item.id} className={styles.item} id={`cart-item-${item.id}`}>
                <div className={styles.itemImage}>
                  <Image
                    src={item.image_url || "https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=200"}
                    alt={item.name}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="96px"
                  />
                </div>
                <div className={styles.itemInfo}>
                  <Link href={`/products/${item.product_id}`} className={styles.itemName}>{item.name}</Link>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemPrice}>{formatPrice(item.price)}</span>
                    {item.selected_flavor && (
                      <span className={styles.itemFlavor}>Sabor: {item.selected_flavor}</span>
                    )}
                  </div>
                </div>
                <div className={styles.itemControls}>
                  <div className={styles.qtyControl}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      id={`cart-dec-${item.id}`}
                    >−</button>
                    <span className={styles.qtyVal}>{item.quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      id={`cart-inc-${item.id}`}
                    >+</button>
                  </div>
                  <span className={styles.itemSubtotal}>{formatPrice(item.price * item.quantity)}</span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.id)}
                    aria-label="Eliminar"
                    id={`cart-remove-${item.id}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Resumen del pedido</h2>
            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>Subtotal ({count} items)</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Envío</span>
                <span>{shipping === 0 ? <span style={{ color: "var(--success)" }}>Gratis</span> : formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className={styles.shippingNote}>
                  Comprá {formatPrice(FREE_SHIPPING_THRESHOLD - total)} más para envío gratis en Córdoba
                </p>
              )}
            </div>
            <div className={styles.totalRow}>
              <span>Total</span>
              <span>{formatPrice(total + shipping)}</span>
            </div>
            {/* Free shipping progress bar */}
            {(() => {
              const remaining = FREE_SHIPPING_THRESHOLD - total;
              const progress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
              const formatPesos = (n: number) =>
                n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
              return (
                <div style={{ margin: '16px 0' }}>
                  <p style={{ fontSize: 13, color: '#1B2A4A', marginBottom: 8 }}>
                    {remaining > 0
                      ? <>🚚 Te faltan <strong>{formatPesos(remaining)}</strong> para envío gratis en Córdoba</>
                      : <span style={{ color: '#1D9E75' }}>🎉 ¡Envío gratis en Córdoba desbloqueado!</span>
                    }
                  </p>
                  <div style={{ background: '#E8ECF2', borderRadius: 4, height: 6 }}>
                    <div style={{
                      background: progress >= 100 ? '#1D9E75' : '#1B2A4A',
                      width: progress + '%',
                      height: '100%',
                      borderRadius: 4,
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              );
            })()}
            <Link href="/checkout" className="btn btn-primary btn-lg btn-full" id="go-checkout-btn">
              Proceder al pago →
            </Link>
            <Link href="/products" className="btn btn-ghost btn-full" id="continue-shopping-btn">
              ← Seguir comprando
            </Link>

            {/* Payment methods preview */}
            <div className={styles.payMethods}>
              <p className={styles.payLabel}>Métodos de pago aceptados</p>
              <div className={styles.payIcons}>
                <span className={styles.payIcon}>💵 Efectivo</span>
                <span className={styles.payIcon}>🏦 Transferencia</span>
                <span className={styles.payIcon}>💳 Tarjeta</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
