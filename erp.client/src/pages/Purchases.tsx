import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { productApi, type Product } from "../api/products";
import { supplierApi } from "../api/suppliers";
import {
  purchaseOrderApi,
  type CreatePurchaseOrderRequest,
} from "../api/purchaseOrders";
import AdminLayout from "../layouts/AdminLayout";
import "./Purchases.css";

interface SupplierOption {
  supplier_id: string;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const PAGE_SIZE = 6;
const TAX_RATE = 0.12;

function money(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Supports the common supplier response property names while keeping the page
 * independent of additional supplier fields returned by the API.
 */
function mapSupplierOptions(value: unknown): SupplierOption[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item): SupplierOption[] => {
    if (!item || typeof item !== "object") return [];

    const record = item as Record<string, unknown>;
    const supplierId = String(record.supplier_id ?? record.id ?? "").trim();
    if (!supplierId) return [];

    const supplierName = String(
      record.name ??
        record.supplier_name ??
        record.supplierName ??
        record.company_name ??
        supplierId
    ).trim();

    return [{ supplier_id: supplierId, name: supplierName || supplierId }];
  });
}

export default function Purchases() {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deliveryCost, setDeliveryCost] = useState("0.00");
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load suppliers once and select the first supplier returned by the API.
  useEffect(() => {
    let isMounted = true;

    async function loadSuppliers() {
      setLoadingSuppliers(true);
      try {
        const result = await supplierApi.getAll();
        if (!isMounted) return;

        const options = mapSupplierOptions(result);
        setSuppliers(options);
        setError("");

        if (options.length > 0) {
          setSelectedSupplierId(options[0].supplier_id);
        } else {
          setError("No suppliers were found.");
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load suppliers."
          );
        }
      } finally {
        if (isMounted) setLoadingSuppliers(false);
      }
    }

    void loadSuppliers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load only the products associated with the selected supplier.
  useEffect(() => {
    let isCurrentRequest = true;

    if (!selectedSupplierId) {
      setProducts([]);
      setLoadingProducts(false);
      return () => {
        isCurrentRequest = false;
      };
    }

    async function loadSupplierProducts() {
      setLoadingProducts(true);
      setProducts([]);
      setCurrentPage(1);

      try {
        const result = await productApi.getBySupplier(selectedSupplierId);
        if (isCurrentRequest) {
          setProducts(result);
          setError("");
        }
      } catch (err) {
        if (isCurrentRequest) {
          setProducts([]);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load products for this supplier."
          );
        }
      } finally {
        if (isCurrentRequest) setLoadingProducts(false);
      }
    }

    void loadSupplierProducts();
    return () => {
      isCurrentRequest = false;
    };
  }, [selectedSupplierId]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products
      .filter((product) =>
        [product.name, product.product_id].some((value) =>
          String(value ?? "").toLowerCase().includes(term)
        )
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredProducts.length);
  const visibleProducts = filteredProducts.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const visiblePageNumbers = useMemo(() => {
    const first = Math.max(1, Math.min(safeCurrentPage - 1, totalPages - 2));
    return Array.from(
      { length: Math.min(3, totalPages) },
      (_, index) => first + index
    );
  }, [safeCurrentPage, totalPages]);

  const subtotal = roundMoney(
    cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );
  const tax = roundMoney(subtotal * TAX_RATE);
  const parsedDeliveryCost = Number(deliveryCost);
  const validDeliveryCost = Number.isFinite(parsedDeliveryCost)
    ? Math.max(0, parsedDeliveryCost)
    : 0;
  const roundedDeliveryCost = roundMoney(validDeliveryCost);
  const total = roundMoney(subtotal + tax + roundedDeliveryCost);
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const selectedSupplier = suppliers.find(
    (supplier) => supplier.supplier_id === selectedSupplierId
  );

  function handleSupplierChange(supplierId: string) {
    if (supplierId === selectedSupplierId) return;

    // A purchase order must contain products from one supplier only.
    setSelectedSupplierId(supplierId);
    setCart([]);
    setSearch("");
    setCurrentPage(1);
    setError("");
    setSuccess("");
  }

  function addToCart(product: Product) {
    setError("");
    setSuccess("");

    setCart((items) => {
      const existing = items.find(
        (item) => item.product.product_id === product.product_id
      );

      if (existing) {
        return items.map((item) =>
          item.product.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...items, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1) return;

    setCart((items) =>
      items.map((item) =>
        item.product.product_id === productId ? { ...item, quantity } : item
      )
    );
  }

  function removeFromCart(productId: string) {
    setCart((items) =>
      items.filter((item) => item.product.product_id !== productId)
    );
  }

  async function placePurchaseOrder() {
    if (!selectedSupplierId) {
      setError("Select a supplier before placing a purchase order.");
      return;
    }

    if (cart.length === 0) {
      setError("Add at least one product before placing a purchase order.");
      return;
    }

    if (
      deliveryCost.trim() === "" ||
      !Number.isFinite(parsedDeliveryCost) ||
      parsedDeliveryCost < 0
    ) {
      setError("Enter a valid delivery cost of zero or greater.");
      return;
    }

    setPlacingOrder(true);
    setError("");
    setSuccess("");

    const request: CreatePurchaseOrderRequest = {
      supplier_id: selectedSupplierId,
      order_date: new Date().toISOString(),
      delivery_cost: roundedDeliveryCost,
      products: Object.fromEntries(
        cart.map((item) => [item.product.product_id, item.quantity])
      ),
    };

    try {
      const created = await purchaseOrderApi.create(request);
      setCart([]);
      setDeliveryCost("0.00");
      setSuccess(
        `Purchase order ${created.purchase_order_id} was placed successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to place the purchase order."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <AdminLayout breadcrumb="Admin / Purchases">
      <main className="purchases-page">
        <div className="purchases-page-heading">
          <div>
            <h1>Purchases</h1>
            <p>Select a supplier, add products, and place a purchase order.</p>
          </div>
          <div className="purchases-heading-actions">
            <button
              type="button"
              className="purchases-primary"
              onClick={() => navigate("/purchaseOrders")}
            >
              Purchase History
            </button>
            <div className="purchases-product-count">
              <strong>{products.length}</strong>
              <span>Supplier products</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="purchases-error-banner" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="purchases-success-banner" role="status">
            {success}
          </div>
        )}

        <div className="purchases-workspace">
          <section
            className="purchases-panel purchases-products-panel"
            aria-labelledby="purchases-products-title"
          >
            <div className="purchases-panel-heading purchases-products-heading">
              <div>
                <h2 id="purchases-products-title">Products</h2>
                <p>
                  {filteredProducts.length} product
                  {filteredProducts.length === 1 ? "" : "s"} found
                </p>
              </div>

              <div className="purchases-product-tools">
                <div className="purchases-supplier-select">
                  <label htmlFor="purchase-supplier">Supplier</label>
                  <select
                    id="purchase-supplier"
                    value={selectedSupplierId}
                    onChange={(event) =>
                      handleSupplierChange(event.target.value)
                    }
                    disabled={loadingSuppliers || suppliers.length === 0 || placingOrder}
                  >
                    {loadingSuppliers && <option value="">Loading suppliers...</option>}
                    {!loadingSuppliers && suppliers.length === 0 && (
                      <option value="">No suppliers available</option>
                    )}
                    {suppliers.map((supplier) => (
                      <option
                        key={supplier.supplier_id}
                        value={supplier.supplier_id}
                      >
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  className="purchases-search"
                  type="search"
                  placeholder="Search product or SKU..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Search products by name or SKU"
                  disabled={!selectedSupplierId || loadingProducts}
                />
              </div>
            </div>

            {loadingSuppliers ? (
              <div className="purchases-empty">Loading suppliers...</div>
            ) : !selectedSupplierId ? (
              <div className="purchases-empty">Select a supplier to view products.</div>
            ) : loadingProducts ? (
              <div className="purchases-empty">Loading supplier products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="purchases-empty">
                {search
                  ? "No products match your search."
                  : "This supplier has no available products."}
              </div>
            ) : (
              <>
                <div className="purchases-product-grid">
                  {visibleProducts.map((product) => (
                    <article
                      className="purchases-product-card"
                      key={product.product_id}
                    >
                      <div className="purchases-product-image-wrap">
                        {product.img ? (
                          <img
                            src={`/images/${product.img}`}
                            alt={product.name}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="purchases-product-image-placeholder">
                            {product.name.slice(0, 1).toUpperCase() || "P"}
                          </div>
                        )}
                      </div>

                      <div className="purchases-product-details">
                        <h3 title={product.name}>{product.name}</h3>
                        <div className="purchases-product-sku">
                          SKU: {product.product_id}
                        </div>
                        <div className="purchases-product-price">
                          {money(product.price)}
                        </div>
                        <div className="purchases-product-meta">
                          <span>Unit price</span>
                          {cart.some(
                            (item) => item.product.product_id === product.product_id
                          ) && <span className="purchases-in-cart">In cart</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="purchases-add-button"
                        onClick={() => addToCart(product)}
                        disabled={placingOrder}
                        aria-label={`Add ${product.name} to purchase order`}
                        title="Add to purchase order"
                      >
                      <span aria-hidden="true">+</span>
                      </button>
                    </article>
                  ))}
                </div>

                <div className="purchases-pagination">
                  <div className="purchases-pagination-info">
                    Showing <strong>{startIndex + 1}</strong> – <strong>{endIndex}</strong>
                    {" of "}<strong>{filteredProducts.length}</strong> products
                  </div>
                  <div className="purchases-pagination-controls">
                    <button
                      type="button"
                      className="purchases-page-button"
                      disabled={safeCurrentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                    >
                      Previous
                    </button>
                    {visiblePageNumbers.map((page) => (
                      <button
                        type="button"
                        key={page}
                        className={`purchases-page-number ${
                          safeCurrentPage === page ? "active" : ""
                        }`}
                        aria-current={safeCurrentPage === page ? "page" : undefined}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="purchases-page-button"
                      disabled={safeCurrentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <aside
            className="purchases-panel purchases-cart-panel"
            aria-labelledby="purchases-cart-title"
          >
            <div className="purchases-cart-heading">
              <div>
                <h2 id="purchases-cart-title">Purchase order</h2>
                <p>
                  {cartQuantity} item{cartQuantity === 1 ? "" : "s"} in cart
                </p>
              </div>
              <span className="purchases-cart-count">{cart.length}</span>
            </div>

            <div className="purchases-selected-supplier">
              <span>Supplier</span>
              <strong>{selectedSupplier?.name ?? "Select a supplier"}</strong>
              {selectedSupplier && (
                <small>{selectedSupplier.supplier_id}</small>
              )}
            </div>

            <div className="purchases-cart-items" aria-label="Purchase order products">
              {cart.length === 0 ? (
                <div className="purchases-cart-empty">
                  <span className="purchases-cart-empty-icon" aria-hidden="true">
                    ＋
                  </span>
                  <strong>Your cart is empty</strong>
                  <span>Add supplier products to start a purchase order.</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    className="purchases-cart-item"
                    key={item.product.product_id}
                  >
                    <div className="purchases-cart-item-image">
                      {item.product.img ? (
                        <img
                          src={`/images/${item.product.img}`}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>
                          {item.product.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="purchases-cart-item-content">
                      <div className="purchases-cart-item-topline">
                        <div className="purchases-cart-item-name">
                          <strong title={item.product.name}>
                            {item.product.name}
                          </strong>
                          <small>{item.product.product_id}</small>
                        </div>
                        <button
                          type="button"
                          className="purchases-remove-button"
                          onClick={() => removeFromCart(item.product.product_id)}
                          disabled={placingOrder}
                          aria-label={`Remove ${item.product.name} from cart`}
                          title="Remove product"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
                          </svg>
                        </button>
                      </div>

                      <div className="purchases-cart-item-bottomline">
                        <div
                          className="purchases-quantity-control"
                          aria-label={`Quantity for ${item.product.name}`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              changeQuantity(
                                item.product.product_id,
                                item.quantity - 1
                              )
                            }
                            disabled={item.quantity <= 1 || placingOrder}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            disabled={placingOrder}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              if (Number.isInteger(value) && value >= 1) {
                                changeQuantity(item.product.product_id, value);
                              }
                            }}
                            aria-label="Product quantity"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              changeQuantity(
                                item.product.product_id,
                                item.quantity + 1
                              )
                            }
                            disabled={placingOrder}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <strong className="purchases-cart-line-total">
                          {money(item.product.price * item.quantity)}
                        </strong>
                      </div>
                      <div className="purchases-cart-unit-price">
                        {money(item.product.price)} each
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="purchases-delivery-field">
              <label htmlFor="purchase-delivery-cost">Delivery cost</label>
              <div className="purchases-delivery-input-wrap">
                <span aria-hidden="true">$</span>
                <input
                  id="purchase-delivery-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={deliveryCost}
                  onChange={(event) => {
                    setDeliveryCost(event.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  disabled={placingOrder}
                  aria-label="Delivery cost"
                />
              </div>
            </div>

            <div className="purchases-cart-summary">
              <div>
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <div>
                <span>Tax (12%)</span>
                <strong>{money(tax)}</strong>
              </div>
              <div>
                <span>Delivery cost</span>
                <strong>{money(roundedDeliveryCost)}</strong>
              </div>
              <div className="purchases-cart-total">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
              <button
                type="button"
                className="purchases-primary purchases-place-order"
                onClick={() => void placePurchaseOrder()}
                disabled={
                  cart.length === 0 ||
                  !selectedSupplierId ||
                  placingOrder ||
                  loadingProducts
                }
              >
                {placingOrder ? "Placing purchase order..." : "Place purchase order"}
              </button>
            </div>
          </aside>
        </div>
      </main>
    </AdminLayout>
  );
}
