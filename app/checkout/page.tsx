"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });
}

const PAYMENT_METHODS = [
  {
    id: "efectivo",
    label: "Efectivo",
    icon: "💵",
    desc: "Pagás al momento de la entrega o retiro",
    info: "Te contactaremos para coordinar el pago y entrega.",
  },
  {
    id: "transferencia",
    label: "Transferencia / MercadoPago",
    icon: "🏦",
    desc: "Transferí al alias o CVU",
    info: null,
    bankData: {
      alias: "oliveroberto",
      cvu: "0000003100063050496647",
      titular: "CoreLab Suplementos",
    },
  },
  {
    id: "tarjeta",
    label: "Tarjeta de débito/crédito",
    icon: "💳",
    desc: "Próximamente disponible",
    disabled: true,
    info: "Integración con pasarela de pago en desarrollo.",
  },
];

export default function CheckoutPage() {
  const { items, total, clearLocalCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [form, setForm] = useState({
    customer_name: user?.name || "",
    customer_email: user?.email || "",
    customer_phone: user?.phone || "",
    shipping_address: user?.address || "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("transferencia");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState<null | { orderId: number; total: number }>(null);

  const shipping = total > 15000 ? 0 : 1500;
  const grandTotal = total + shipping;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_email || !form.customer_phone || !form.shipping_address) {
      showToast("Por favor completá todos los campos requeridos", "error");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, payment_method: paymentMethod }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      showToast(data.error || "Error al procesar el pedido", "error");
      return;
    }
    clearLocalCart();
    setConfirmed({ orderId: data.orderId, total: data.total });
  };

  if (confirmed) {
    return (
      <div className={styles.confirmed}>
        <div className={styles.confirmedCard}>
          <div className={styles.confirmedIcon}>✅</div>
          <h1 className={styles.confirmedTitle}>¡Pedido confirmado!</h1>
          <p className={styles.confirmedDesc}>
            Tu pedido <strong>#{confirmed.orderId}</strong> fue recibido correctamente.
          </p>
          <div className={styles.confirmedTotal}>
            Total: <strong>{formatPrice(confirmed.total)}</strong>
          </div>
          {paymentMethod === "transferencia" && (
            <div className={styles.bankInfo}>
              <h3 className={styles.bankTitle}>📱 Realizá tu transferencia</h3>
              <div className={styles.bankRow}><span>Alias</span><strong>oliveroberto</strong></div>
              <div className={styles.bankRow}><span>CVU</span><strong style={{ fontSize: "0.85rem" }}>0000003100063050496647</strong></div>
              <div className={styles.bankRow}><span>Monto exacto</span><strong>{formatPrice(confirmed.total)}</strong></div>
              <p className={styles.bankNote}>
                Enviá el comprobante por WhatsApp para confirmar tu envío.
              </p>
              <a
                href={`https://wa.me/543518792797?text=Hola!%20Hice%20mi%20pedido%20%23${confirmed.orderId}%20por%20${formatPrice(confirmed.total)}%20y%20adjunto%20el%20comprobante.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
                id="confirmed-wa-btn"
              >
                Enviar comprobante por WhatsApp
              </a>
            </div>
          )}
          {paymentMethod === "efectivo" && (
            <div className={styles.bankInfo}>
              <h3 className={styles.bankTitle}>📞 Próximos pasos</h3>
              <p style={{ color: "var(--gray)", fontSize: "0.9rem" }}>
                Te contactaremos al número proporcionado para coordinar la entrega y el pago en efectivo.
              </p>
              <a
                href={`https://wa.me/543518792797?text=Hola!%20Hice%20mi%20pedido%20%23${confirmed.orderId}%20y%20elegí%20pago%20en%20efectivo.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
                id="confirmed-cash-wa-btn"
              >
                💬 Contactar por WhatsApp
              </a>
            </div>
          )}
          <Link href="/products" className="btn btn-outline" id="confirmed-shop-more-btn">
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <span style={{ fontSize: "3rem" }}>🛒</span>
        <h2>Tu carrito está vacío</h2>
        <Link href="/products" className="btn btn-primary">Ver productos</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <Link href="/cart" className={styles.back}>← Volver al carrito</Link>
          <h1 className={styles.title}>Finalizar compra</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.layout}>
            {/* Left: form */}
            <div className={styles.formSection}>
              {/* Contact */}
              <div className={styles.formBlock}>
                <h2 className={styles.blockTitle}>📋 Datos de contacto</h2>
                <div className={styles.formGrid}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="customer_name">Nombre completo *</label>
                    <input id="customer_name" name="customer_name" className="form-input" value={form.customer_name} onChange={handleChange} required placeholder="Juan García" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="customer_phone">Teléfono *</label>
                    <input id="customer_phone" name="customer_phone" className="form-input" value={form.customer_phone} onChange={handleChange} required placeholder="351 555-0000" />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label" htmlFor="customer_email">Email *</label>
                    <input id="customer_email" name="customer_email" type="email" className="form-input" value={form.customer_email} onChange={handleChange} required placeholder="juan@email.com" />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label" htmlFor="shipping_address">Dirección de entrega *</label>
                    <input id="shipping_address" name="shipping_address" className="form-input" value={form.shipping_address} onChange={handleChange} required placeholder="Av. Colón 1234, Córdoba" />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1/-1" }}>
                    <label className="form-label" htmlFor="notes">Notas (opcional)</label>
                    <textarea id="notes" name="notes" className="form-textarea" value={form.notes} onChange={handleChange} placeholder="Instrucciones de entrega, referencias, etc." style={{ minHeight: "80px" }} />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className={styles.formBlock}>
                <h2 className={styles.blockTitle}>💳 Método de pago</h2>
                <div className={styles.paymentMethods}>
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={`${styles.payMethod} ${paymentMethod === method.id ? styles.payActive : ""} ${method.disabled ? styles.payDisabled : ""}`}
                      id={`pay-method-${method.id}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => !method.disabled && setPaymentMethod(method.id)}
                        disabled={method.disabled}
                        style={{ display: "none" }}
                      />
                      <span className={styles.payIcon}>{method.icon}</span>
                      <div className={styles.payInfo}>
                        <span className={styles.payLabel}>{method.label}</span>
                        <span className={styles.payDesc}>{method.desc}</span>
                      </div>
                      <div className={styles.payRadio} />
                    </label>
                  ))}
                </div>

                {/* Payment details */}
                {paymentMethod === "transferencia" && (
                  <div className={styles.payDetail}>
                    <p className={styles.payDetailTitle}>Datos para transferencia</p>
                    <div className={styles.bankRow}><span>Alias</span><strong>oliveroberto</strong></div>
                    <div className={styles.bankRow}><span>CVU</span><strong style={{ fontSize: "0.8rem" }}>0000003100063050496647</strong></div>
                    <p style={{ fontSize: "0.78rem", color: "var(--gray-dark)", marginTop: "0.5rem" }}>
                      Enviá el comprobante por WhatsApp tras realizar el pago.
                    </p>
                  </div>
                )}
                {paymentMethod === "efectivo" && (
                  <div className={styles.payDetail}>
                    <p style={{ font: "0.85rem", color: "var(--gray)" }}>
                      Te contactaremos para coordinar el lugar y horario de pago/entrega.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: order summary */}
            <div className={styles.summary}>
              <h2 className={styles.summaryTitle}>Resumen</h2>
              <div className={styles.summaryItems}>
                {items.map((item) => (
                  <div key={item.id} className={styles.summaryItem}>
                    <span className={styles.summaryItemName}>{item.name} ×{item.quantity}</span>
                    <span className={styles.summaryItemPrice}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className={styles.divider} />
              <div className={styles.summaryRow}><span>Subtotal</span><span>{formatPrice(total)}</span></div>
              <div className={styles.summaryRow}>
                <span>Envío</span>
                <span>{shipping === 0 ? <span style={{ color: "var(--success)" }}>Gratis</span> : formatPrice(shipping)}</span>
              </div>
              <div className={styles.divider} />
              <div className={styles.totalRow}><span>Total a pagar</span><strong>{formatPrice(grandTotal)}</strong></div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={loading}
                id="confirm-order-btn"
              >
                {loading ? "Procesando..." : "✅ Confirmar pedido"}
              </button>
              <p className={styles.secureNote}>🔒 Tus datos están seguros</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
