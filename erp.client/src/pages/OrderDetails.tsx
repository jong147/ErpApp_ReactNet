import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { orderApi, type Order, type OrderProduct } from "../api/orders";
import { customerApi } from "../api/customers";
import AdminLayout from "../layouts/AdminLayout";
import "./OrderDetails.css";

const ORDER_STATUSES = [
  { value: "confirmed", label: "To fulfill" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

function formatStatus(status: string): string {
  const normalized = normalizeStatus(status);
  const known = ORDER_STATUSES.find((item) => item.value === normalized);

  if (known) return known.label;
  if (!normalized) return "Unknown";

  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return Number(value ?? 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOrderDetails() {
      if (!id) {
        setError("The order ID is missing from the URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setSuccess("");
      setOrder(null);
      setOrderProducts([]);
      setCustomerName("");
      setSelectedStatus("");

      try {
        const [loadedOrder, loadedProducts] = await Promise.all([
          orderApi.getById(id),
          orderApi.getProducts(id),
        ]);

        if (cancelled) return;

        setOrder(loadedOrder);
        setOrderProducts(loadedProducts);
        setSelectedStatus(normalizeStatus(loadedOrder.status));

        if (loadedOrder.customer_id.trim()) {
          try {
            const name = await customerApi.getNameById(loadedOrder.customer_id);
            if (!cancelled) setCustomerName(name || loadedOrder.customer_id);
          } catch {
            // Keep the order details usable if the customer-name lookup fails.
            if (!cancelled) setCustomerName(loadedOrder.customer_id);
          }
        } else {
          setCustomerName("Walk-in customer");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load order details."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOrderDetails();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function updateOrderStatus() {
    if (!order || !selectedStatus) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const updatedOrder: Order = {
      ...order,
      status: selectedStatus,
    };

    try {
      await orderApi.update(updatedOrder);
      setOrder(updatedOrder);
      setSuccess("Order status updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout breadcrumb="Admin / Orders / Order Details">
        <div className="order-details-page">
          <p className="order-details-message">Loading order details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout breadcrumb="Admin / Orders / Order Details">
        <div className="order-details-page">
          <button
            type="button"
            className="order-back-button"
            onClick={() => navigate("/orders")}
          >
            <span aria-hidden="true">←</span> Back to Orders
          </button>
          {error && <div className="order-details-error" role="alert">{error}</div>}
        </div>
      </AdminLayout>
    );
  }

  const currentStatus = normalizeStatus(order.status);
  const statusIsUnchanged = selectedStatus === currentStatus;

  return (
    <AdminLayout breadcrumb={`Admin / Orders / ${order.order_id}`}>
      <div className="order-details-page">
        <div className="order-details-heading">
          <div>
            <button
              type="button"
              className="order-back-button"
              onClick={() => navigate("/orders")}
            >
              <span aria-hidden="true">←</span> Back to Orders
            </button>
            <h1>Order Details</h1>
            <p>Review the order, its items, and fulfillment status.</p>
          </div>
          <div className="order-heading-id">
            <span>Order ID</span>
            <strong>{order.order_id}</strong>
          </div>
        </div>

        {error && <div className="order-details-error" role="alert">{error}</div>}
        {success && <div className="order-details-success" role="status">{success}</div>}

        <section className="order-details-panel">
          <div className="order-details-panel-heading">
            <div>
              <h2>Order Information</h2>
              <p>Customer and order status information.</p>
            </div>
          </div>

          <div className="order-info-grid">
            <div className="order-info-item">
              <span>Customer</span>
              <strong>{customerName || "—"}</strong>
            </div>
            <div className="order-info-item">
              <span>Customer ID</span>
              <strong className="order-monospace">
                {order.customer_id || "Walk-in"}
              </strong>
            </div>
            <div className="order-info-item">
              <span>Order date</span>
              <strong>{formatDate(order.date)}</strong>
            </div>
            <div className="order-info-item order-status-editor">
              <label htmlFor="order-status">Status</label>
              <div className="order-status-controls">
                <select
                  id="order-status"
                  value={selectedStatus}
                  onChange={(event) => {
                    setSelectedStatus(event.target.value);
                    setSuccess("");
                  }}
                  disabled={saving}
                >
                  {!ORDER_STATUSES.some((status) => status.value === selectedStatus) &&
                    selectedStatus && (
                      <option value={selectedStatus}>{formatStatus(selectedStatus)}</option>
                    )}
                  {ORDER_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="order-update-button"
                  onClick={() => void updateOrderStatus()}
                  disabled={saving || statusIsUnchanged || !selectedStatus}
                >
                  {saving ? "Updating..." : "Update Order"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="order-details-panel">
          <div className="order-details-panel-heading">
            <div>
              <h2>Products</h2>
              <p>{orderProducts.length} {orderProducts.length === 1 ? "item" : "items"} in this order.</p>
            </div>
          </div>

          {orderProducts.length === 0 ? (
            <p className="order-details-empty">No products were found for this order.</p>
          ) : (
            <div className="order-products-scroll">
              <table className="order-products-table">
                <thead>
                  <tr>
                    <th className="order-product-col">Product</th>
                    <th>Product ID</th>
                    <th className="order-number-col">Unit price</th>
                    <th className="order-quantity-col">Quantity</th>
                    <th className="order-number-col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orderProducts.map((product) => (
                    <tr key={product.product_id}>
                      <td>
                        <div className="order-product-cell">
                          {product.img ? (
                            <img
                              src={`/images/${product.img}`}
                              alt={product.product_name}
                              onError={(event) => {
                                event.currentTarget.style.visibility = "hidden";
                              }}
                            />
                          ) : (
                            <div className="order-product-placeholder" aria-hidden="true">
                              PC
                            </div>
                          )}
                          <strong>{product.product_name}</strong>
                        </div>
                      </td>
                      <td className="order-monospace">{product.product_id}</td>
                      <td className="order-number">{formatCurrency(product.price)}</td>
                      <td className="order-quantity">{product.quantity}</td>
                      <td className="order-number order-line-total">
                        {formatCurrency(product.price * product.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="order-bottom-grid">
          <section className="order-details-panel order-notes-panel">
            <div className="order-details-panel-heading">
              <div>
                <h2>Notes</h2>
                <p>Additional information for this order.</p>
              </div>
            </div>
            <p className="order-notes-content">
              {order.notes?.trim() || "No notes provided."}
            </p>
          </section>

          <section className="order-details-panel order-totals-panel">
            <div className="order-details-panel-heading">
              <div>
                <h2>Order Summary</h2>
                <p>Totals recorded for this order.</p>
              </div>
            </div>
            <div className="order-total-row">
              <span>Subtotal</span>
              <strong>{formatCurrency(order.subtotal)}</strong>
            </div>
            <div className="order-total-row">
              <span>Tax</span>
              <strong>{formatCurrency(order.tax)}</strong>
            </div>
            <div className="order-total-row order-grand-total">
              <span>Total</span>
              <strong>{formatCurrency(order.total)}</strong>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
