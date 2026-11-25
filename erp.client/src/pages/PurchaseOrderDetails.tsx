import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  purchaseOrderApi,
  type PurchaseOrder,
  type PurchaseOrderProduct,
  type UpdatePurchaseOrderRequest,
} from "../api/purchaseOrders";
import AdminLayout from "../layouts/AdminLayout";
import "./PurchaseOrderDetails.css";

const PURCHASE_ORDER_STATUSES = [
  { value: "ordered", label: "Ordered" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function normalizeStatus(status: string): string {
  return (status ?? "").trim().toLowerCase();
}

function formatStatus(status: string): string {
  const normalized = normalizeStatus(status);
  const known = PURCHASE_ORDER_STATUSES.find(
    (item) => item.value === normalized
  );

  if (known) return known.label;
  if (!normalized) return "Unknown";

  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  // Keep date-only values on their original calendar date.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3])
      )
    : new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";

  const dateOnly = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  if (dateOnly) return dateOnly[1];

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCurrency(value: number | null | undefined): string {
  return Number(value ?? 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default function PurchaseOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [orderProducts, setOrderProducts] = useState<PurchaseOrderProduct[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPurchaseOrderDetails() {
      if (!id) {
        setError("The purchase order ID is missing from the URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setSuccess("");
      setOrder(null);
      setOrderProducts([]);
      setSelectedStatus("");
      setDeliveryDate("");

      try {
        const [loadedOrder, loadedProducts] = await Promise.all([
          purchaseOrderApi.getById(id),
          purchaseOrderApi.getProducts(id),
        ]);

        if (cancelled) return;

        setOrder(loadedOrder);
        setOrderProducts(loadedProducts);
        setSelectedStatus(normalizeStatus(loadedOrder.status));
        setDeliveryDate(toDateInputValue(loadedOrder.delivery_date));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load purchase order details."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPurchaseOrderDetails();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function updatePurchaseOrder() {
    if (!order || !selectedStatus) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const updateRequest: UpdatePurchaseOrderRequest = {
      delivery_date: deliveryDate || null,
      status: selectedStatus,
    };

    try {
      await purchaseOrderApi.update(order.purchase_order_id, updateRequest);
      setOrder((current) =>
        current
          ? {
              ...current,
              delivery_date: updateRequest.delivery_date,
              status: updateRequest.status,
            }
          : current
      );
      setSuccess("Purchase order updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update purchase order."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout breadcrumb="Admin / Purchase Orders / Details">
        <div className="purchase-order-details-page">
          <p className="purchase-order-details-message">
            Loading purchase order details...
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout breadcrumb="Admin / Purchase Orders / Details">
        <div className="purchase-order-details-page">
          <button
            type="button"
            className="purchase-order-back-button"
            onClick={() => navigate("/purchaseOrders")}
          >
            <span aria-hidden="true">←</span> Back to Purchase Orders
          </button>
          {error && (
            <div className="purchase-order-details-error" role="alert">
              {error}
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  const statusIsUnchanged = selectedStatus === normalizeStatus(order.status);
  const dateIsUnchanged = deliveryDate === toDateInputValue(order.delivery_date);
  const updateIsUnchanged = statusIsUnchanged && dateIsUnchanged;

  return (
    <AdminLayout
      breadcrumb={`Admin / Purchase Orders / ${order.purchase_order_id}`}
    >
      <div className="purchase-order-details-page">
        <div className="purchase-order-details-heading">
          <div>
            <button
              type="button"
              className="purchase-order-back-button"
              onClick={() => navigate("/purchaseOrders")}
            >
              <span aria-hidden="true">←</span> Back to Purchase Orders
            </button>
            <h1>Purchase Order Details</h1>
            <p>Review the supplier order, its products, and delivery status.</p>
          </div>
          <div className="purchase-order-heading-id">
            <span>Purchase Order ID</span>
            <strong>{order.purchase_order_id}</strong>
          </div>
        </div>

        {error && (
          <div className="purchase-order-details-error" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="purchase-order-details-success" role="status">
            {success}
          </div>
        )}

        <section className="purchase-order-details-panel">
          <div className="purchase-order-panel-heading">
            <div>
              <h2>Purchase Order Information</h2>
              <p>Supplier, order date, and delivery information.</p>
            </div>
          </div>

          <div className="purchase-order-info-grid">
            <div className="purchase-order-info-item">
              <span>Supplier ID</span>
              <strong className="purchase-order-monospace">
                {order.supplier_id || "—"}
              </strong>
            </div>
            <div className="purchase-order-info-item">
              <span>Order date</span>
              <strong>{formatDate(order.order_date)}</strong>
            </div>
            <div className="purchase-order-info-item purchase-order-date-editor">
              <label htmlFor="purchase-order-delivery-date">Delivery date</label>
              <input
                id="purchase-order-delivery-date"
                type="date"
                value={deliveryDate}
                onChange={(event) => {
                  setDeliveryDate(event.target.value);
                  setSuccess("");
                }}
                disabled={saving}
              />
            </div>
            <div className="purchase-order-info-item purchase-order-status-editor">
              <label htmlFor="purchase-order-status">Status</label>
              <div className="purchase-order-status-controls">
                <select
                  id="purchase-order-status"
                  value={selectedStatus}
                  onChange={(event) => {
                    setSelectedStatus(event.target.value);
                    setSuccess("");
                  }}
                  disabled={saving}
                >
                  {!PURCHASE_ORDER_STATUSES.some(
                    (status) => status.value === selectedStatus
                  ) &&
                    selectedStatus && (
                      <option value={selectedStatus}>
                        {formatStatus(selectedStatus)}
                      </option>
                    )}
                  {PURCHASE_ORDER_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="purchase-order-update-button"
                  onClick={() => void updatePurchaseOrder()}
                  disabled={saving || updateIsUnchanged || !selectedStatus}
                >
                  {saving ? "Updating..." : "Update Order"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="purchase-order-details-panel">
          <div className="purchase-order-panel-heading">
            <div>
              <h2>Products</h2>
              <p>
                {orderProducts.length} {orderProducts.length === 1 ? "item" : "items"} in this purchase order.
              </p>
            </div>
          </div>

          {orderProducts.length === 0 ? (
            <p className="purchase-order-details-empty">
              No products were found for this purchase order.
            </p>
          ) : (
            <div className="purchase-order-products-scroll">
              <table className="purchase-order-products-table">
                <thead>
                  <tr>
                    <th className="purchase-order-product-col">Product</th>
                    <th>Product ID</th>
                    <th className="purchase-order-number-col">Unit price</th>
                    <th className="purchase-order-quantity-col">Quantity</th>
                    <th className="purchase-order-number-col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orderProducts.map((product) => (
                    <tr key={product.product_id}>
                      <td>
                        <div className="purchase-order-product-cell">
                          {product.img ? (
                            <img
                              src={`/images/${product.img}`}
                              alt={product.product_name}
                              onError={(event) => {
                                event.currentTarget.style.visibility = "hidden";
                              }}
                            />
                          ) : (
                            <div
                              className="purchase-order-product-placeholder"
                              aria-hidden="true"
                            >
                              PC
                            </div>
                          )}
                          <strong>{product.product_name}</strong>
                        </div>
                      </td>
                      <td className="purchase-order-monospace">
                        {product.product_id}
                      </td>
                      <td className="purchase-order-number">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="purchase-order-quantity">
                        {product.quantity}
                      </td>
                      <td className="purchase-order-number purchase-order-line-total">
                        {formatCurrency(product.price * product.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="purchase-order-details-panel purchase-order-totals-panel">
          <div className="purchase-order-panel-heading">
            <div>
              <h2>Purchase Order Summary</h2>
              <p>Totals recorded for this purchase order.</p>
            </div>
          </div>
          <div className="purchase-order-total-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(order.subtotal)}</strong>
          </div>
          <div className="purchase-order-total-row">
            <span>Tax</span>
            <strong>{formatCurrency(order.tax)}</strong>
          </div>
          <div className="purchase-order-total-row">
            <span>Delivery cost</span>
            <strong>{formatCurrency(order.delivery_cost)}</strong>
          </div>
          <div className="purchase-order-total-row purchase-order-grand-total">
            <span>Total</span>
            <strong>{formatCurrency(order.total)}</strong>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
