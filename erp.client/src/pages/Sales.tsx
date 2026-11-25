import { useEffect, useMemo, useState } from "react";
import { productApi, type Product } from "../api/products";
import { orderApi } from "../api/orders";
import AdminLayout from "../layouts/AdminLayout";
import "./Sales.css";
import { useNavigate } from "react-router";

interface CartItem {
  product: Product;
  quantity: number;
}

type CustomerMode = "walk-in" | "existing";

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

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [customerMode, setCustomerMode] = useState<CustomerMode>("walk-in");
  const [customerId, setCustomerId] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  async function loadProducts() {
    setLoading(true);
    try {
      setProducts(await productApi.getAll());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products
      .filter((product) =>
        [product.name, product.product_id].some((value) =>
          value.toLowerCase().includes(term)
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
    return Array.from({ length: Math.min(3, totalPages) }, (_, index) => first + index);
  }, [safeCurrentPage, totalPages]);

  const subtotal = roundMoney(
    cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );
  const tax = roundMoney(subtotal * TAX_RATE);
  const total = roundMoney(subtotal + tax);
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product: Product) {
    if (product.stock <= 0) return;

    setSuccess("");
    setCart((items) => {
      const existing = items.find((item) => item.product.product_id === product.product_id);

      if (existing) {
        return items.map((item) =>
          item.product.product_id === product.product_id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }

      return [...items, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, quantity: number) {
    setCart((items) =>
      items.map((item) =>
        item.product.product_id === productId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(quantity, item.product.stock)),
            }
          : item
      )
    );
  }

  function removeFromCart(productId: string) {
    setCart((items) => items.filter((item) => item.product.product_id !== productId));
  }

  async function placeOrder() {
    if (cart.length === 0) return;

    setPlacingOrder(true);
    setError("");
    setSuccess("");

    try {
      const created = await orderApi.create({
        customer_id: customerMode === "walk-in" ? "" : customerId.trim(),
        date: new Date().toISOString(),
        notes: orderNotes.trim(),
        products: Object.fromEntries(
          cart.map((item) => [item.product.product_id, item.quantity])
        ),
      });

      setCart([]);
      setCustomerMode("walk-in");
      setCustomerId("");
      setOrderNotes("");
      setSuccess(`Order ${created.order_id} was placed successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  }

  function goToHistory() {
    navigate("/orders");
  }

  return (
    <AdminLayout breadcrumb="Admin / Sales">
      <main className="sales-page">
        <div className="page-heading sales-page-heading">
          <div>
            <h1>Sales</h1>
            <p>Select products, add them to the cart, and place an order.</p>
          </div>
          <div className="sales-actions">
          <button className="primary" onClick={goToHistory}>
            Order History
          </button>
            <div className="sales-product-count">
              <strong>{products.length}</strong>
              <span>Products available</span>
            </div>
          </div>
          
        </div>

        {error && <div className="error-banner" role="alert">{error}</div>}
        {success && <div className="sales-success-banner" role="status">{success}</div>}

        <div className="sales-workspace">
          <section className="panel sales-products-panel" aria-labelledby="sales-products-title">
            <div className="panel-heading sales-products-heading">
              <div>
                <h2 id="sales-products-title">Products</h2>
                <p>{filteredProducts.length} products found</p>
              </div>
              <input
                className="search sales-search"
                type="search"
                placeholder="Search product name or SKU..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Search products by name or SKU"
              />
            </div>

            {loading ? (
              <div className="empty sales-empty">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty sales-empty">No products found.</div>
            ) : (
              <>
                <div className="sales-product-grid">
                  {visibleProducts.map((product) => {
                    const isLowStock = product.stock <= product.minimum_stock;
                    const outOfStock = product.stock <= 0;

                    return (
                      <article className="sales-product-card" key={product.product_id}>
                        <div className="sales-product-image-wrap">
                          {product.img ? (
                            <img
                              src={`/images/${product.img}`}
                              alt={product.name}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="sales-product-image-placeholder">
                              {product.name.slice(0, 1).toUpperCase() || "P"}
                            </div>
                          )}
                        </div>

                        <div className="sales-product-details">
                          <h3 title={product.name}>{product.name}</h3>
                          <div className="sales-product-sku">SKU: {product.product_id}</div>
                          <div className="sales-product-price">{money(product.price)}</div>
                          <div className="sales-product-meta">
                            <span>Stock: <strong>{product.stock}</strong></span>
                            <span className={`status ${isLowStock ? "low" : "good"}`}>
                              {outOfStock ? "Out of stock" : isLowStock ? "Low stock" : "In stock"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="sales-add-button"
                          onClick={() => addToCart(product)}
                          disabled={outOfStock}
                          aria-label={`Add ${product.name} to cart`}
                          title={outOfStock ? "Out of stock" : "Add to cart"}
                        >
                          <span aria-hidden="true">+</span>
                        </button>
                      </article>
                    );
                  })}
                </div>

                <div className="table-pagination sales-pagination">
                  <div className="pagination-info">
                    Showing <strong>{filteredProducts.length === 0 ? 0 : startIndex + 1}</strong>
                    {" – "}<strong>{endIndex}</strong> of <strong>{filteredProducts.length}</strong> products
                  </div>
                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="page-button"
                      disabled={safeCurrentPage === 1}
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </button>
                    {visiblePageNumbers.map((page) => (
                      <button
                        type="button"
                        key={page}
                        className={`page-number ${safeCurrentPage === page ? "active" : ""}`}
                        aria-current={safeCurrentPage === page ? "page" : undefined}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="page-button"
                      disabled={safeCurrentPage === totalPages}
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <aside className="panel sales-cart-panel" aria-labelledby="sales-cart-title">
            <div className="sales-cart-heading">
              <div>
                <h2 id="sales-cart-title">Current order</h2>
                <p>{cartQuantity} item{cartQuantity === 1 ? "" : "s"} in cart</p>
              </div>
              <span className="sales-cart-count">{cart.length}</span>
            </div>

            <div className="sales-customer-field">
              <label htmlFor="sales-customer-mode">Customer</label>
              <select
                id="sales-customer-mode"
                value={customerMode}
                onChange={(event) => setCustomerMode(event.target.value as CustomerMode)}
              >
                <option value="walk-in">Walk-in customer</option>
                <option value="existing">Existing customer</option>
              </select>
              {customerMode === "existing" && (
                <input
                  type="text"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                  placeholder="Enter customer ID (e.g. CUS001)"
                  aria-label="Customer ID"
                />
              )}
            </div>

            <div className="sales-cart-items" aria-label="Cart products">
              {cart.length === 0 ? (
                <div className="sales-cart-empty">
                  <span className="sales-cart-empty-icon" aria-hidden="true">＋</span>
                  <strong>Your cart is empty</strong>
                  <span>Add products to start an order.</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div className="sales-cart-item" key={item.product.product_id}>
                    <div className="sales-cart-item-image">
                      {item.product.img ? (
                        <img
                          src={`/images/${item.product.img}`}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>{item.product.name.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="sales-cart-item-content">
                      <div className="sales-cart-item-topline">
                        <div className="sales-cart-item-name">
                          <strong title={item.product.name}>{item.product.name}</strong>
                          <small>{item.product.product_id}</small>
                        </div>
                        <button
                          type="button"
                          className="sales-remove-button"
                          onClick={() => removeFromCart(item.product.product_id)}
                          aria-label={`Remove ${item.product.name} from cart`}
                          title="Remove product"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
                          </svg>
                        </button>
                      </div>
                      <div className="sales-cart-item-bottomline">
                        <div className="sales-quantity-control" aria-label={`Quantity for ${item.product.name}`}>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.product.product_id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >−</button>
                          <input
                            type="number"
                            min="1"
                            max={item.product.stock}
                            step="1"
                            value={item.quantity}
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
                            onClick={() => changeQuantity(item.product.product_id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            aria-label="Increase quantity"
                          >+</button>
                        </div>
                        <strong className="sales-cart-line-total">
                          {money(item.product.price * item.quantity)}
                        </strong>
                      </div>
                      <div className="sales-cart-unit-price">{money(item.product.price)} each</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="sales-order-notes">
              <label htmlFor="sales-order-notes">Order notes</label>
              <textarea
                id="sales-order-notes"
                rows={3}
                maxLength={500}
                value={orderNotes}
                onChange={(event) => setOrderNotes(event.target.value)}
                placeholder="Add notes for this order (optional)..."
              />
              <small>{orderNotes.length}/500 characters</small>
            </div>

            <div className="sales-cart-summary">
              <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              <div><span>Tax (12%)</span><strong>{money(tax)}</strong></div>
              <div className="sales-cart-total"><span>Total</span><strong>{money(total)}</strong></div>
              <button
                type="button"
                className="primary sales-place-order"
                onClick={() => void placeOrder()}
                disabled={cart.length === 0 || placingOrder}
              >
                {placingOrder ? "Placing order..." : "Place order"}
              </button>
            </div>
          </aside>
        </div>
      </main>
    </AdminLayout>
  );
}
