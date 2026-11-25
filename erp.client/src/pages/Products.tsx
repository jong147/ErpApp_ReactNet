import { useEffect, useState } from "react";
import { useMemo, } from "react";
import { productApi, type Product } from "../api/products";
import AdminLayout from "../layouts/AdminLayout";
import "./Products.css";

import * as XLSX from "xlsx";

const emptyProduct: Product = {
  product_id: "",
  name: "",
  description: "",
  stock: 0,
  minimum_stock: 5,
  price: 0,
  img: "",
};

export default function Products() {
 
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Product>(emptyProduct);
  const [editing, setEditing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

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

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    return products.filter((p) =>
      [p.product_id, p.name]
        .some((value) => value.toLowerCase().includes(term))
    )
    .sort((a, b) =>
      a.product_id.localeCompare(b.product_id, undefined, {
        numeric: true,
        sensitivity: "base",
      }));
    
  }, [products, search]);

  const lowStock = products.filter(
    (p) => p.stock <= p.minimum_stock
  ).length;

  // Pagination logic
  // 1. Calculate the total number of pages
const totalPages = Math.max(
  1,
  Math.ceil(filtered.length / pageSize)
);

// 2. Keep the current page within valid bounds
const safeCurrentPage = Math.min(
  currentPage,
  totalPages
);

// 3. Correct the current page if products are deleted
// or filtering reduces the number of pages
useEffect(() => {
  setCurrentPage((page) => Math.min(page, totalPages));
}, [totalPages]);

// 4. Calculate the range of products to display
const startIndex = (safeCurrentPage - 1) * pageSize;

const endIndex = Math.min(
  startIndex + pageSize,
  filtered.length
);

// 5. Get only the products for the current page
const paginatedProducts = filtered.slice(
  startIndex,
  endIndex
);

// 6. Limit visible page-number buttons to 3
const maxVisiblePages = 3;

const startPage = Math.max(
  1,
  Math.min(
    safeCurrentPage - 1,
    totalPages - maxVisiblePages + 1
  )
);

const visiblePageNumbers = Array.from(
  {
    length: Math.min(maxVisiblePages, totalPages),
  },
  (_, index) => startPage + index
);

// Export section
function handleExport(format: "xlsx" | "csv" | "txt") {
  if (filtered.length === 0) return;

  // Export all filtered products, not just the current page.
  const headers = [
    "Product",
    "Description",
    "SKU",
    "Price (USD)",
    "Stock",
    "Status",
  ] as const;

  const rows = filtered.map((p) => ({
    Product: p.name,
    Description: p.description || "",
    SKU: p.product_id,
    "Price (USD)": p.price,
    Stock: p.stock,
    Status: p.stock <= p.minimum_stock ? "Low stock" : "In stock",
  }));

  const filename = `products-${new Date()
    .toISOString()
    .slice(0, 10)}`;

  // EXCEL: Generate a real .xlsx workbook.
  if (format === "xlsx") {
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set readable column widths.
    worksheet["!cols"] = [
      { wch: 28 },
      { wch: 40 },
      { wch: 18 },
      { wch: 22 },
      { wch: 16 },
      { wch: 10 },
      { wch: 14 },
    ];

    // Format prices as USD in Excel.
    for (let rowIndex = 2; rowIndex <= rows.length + 1; rowIndex++) {
      const priceCell = worksheet[`E${rowIndex}`];

      if (priceCell) {
        priceCell.z = '"$"#,##0.00';
      }
    }

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Products"
    );

    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return;
  }

  // CSV and TXT: Convert the data to delimited text.
  const delimiter = format === "csv" ? "," : "\t";

  function formatCell(value: unknown): string {
    let text = value == null ? "" : String(value);

    // Protect text fields from spreadsheet formula injection.
    if (
      typeof value === "string" &&
      /^[\t\r\n ]*[=+\-@]/.test(text)
    ) {
      text = `'${text}`;
    }

    if (format === "csv") {
      // Escape quotation marks and quote every field.
      return `"${text.replace(/"/g, '""')}"`;
    }

    // A tab-separated TXT file must not contain tabs or
    // newlines inside individual fields.
    return text.replace(/[\t\r\n]+/g, " ");
  }

  const content = [
    headers.map(formatCell).join(delimiter),
    ...rows.map((row) =>
      headers.map((header) => formatCell(row[header])).join(delimiter)
    ),
  ].join("\r\n");

  const blob = new Blob(
    [format === "csv" ? "\uFEFF" + content : content],
    {
      type:
        format === "csv"
          ? "text/csv;charset=utf-8;"
          : "text/plain;charset=utf-8;",
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${filename}.${format}`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

  function openCreate() {
    setDraft({ ...emptyProduct });
    setEditing(false);
    setError("");
    setModalOpen(true);
  }

function openEdit(product: Product) {
  setDraft({
    product_id: product.product_id,
    name: product.name,
    description: product.description,
    stock: product.stock,
    minimum_stock: product.minimum_stock,
    price: product.price,
    img: product.img,
  });

  setEditing(true);
  setError("");
  setModalOpen(true);
}

  function change<K extends keyof Product>(
    key: K,
    value: Product[K]
  ) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  async function saveProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editing) {
        await productApi.update(draft);
      } else {
        await productApi.create(draft);
      }

      setModalOpen(false);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete "${product.name}" (${product.product_id})?`)) {
      return;
    }

    setError("");
    try {
      await productApi.delete(product.product_id);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <AdminLayout breadcrumb="Admin / Products">
          <div>
          <div className="page-heading">
            <div>
              <h1>Product Inventory</h1>
              <p>Manage your PC store products and stock levels.</p>
            </div>
            <button className="primary" onClick={openCreate}>
              + Add Product
            </button>
          </div>

          {error && <div className="error-banner" role="alert">{error}</div>}

          <div className="stats">
            <div className="stat-card">
              <span>Total products</span>
              <strong>{products.length}</strong>
              <small>Registered SKUs</small>
            </div>
            <div className="stat-card">
              <span>Low stock alerts</span>
              <strong className={lowStock ? "warning-text" : ""}>{lowStock}</strong>
              <small>At or below minimum stock</small>
            </div>
            <div className="stat-card">
              <span>Total value</span>
              <strong>{products.reduce((sum, p) => sum + p.stock * p.price, 0).toLocaleString("en-US", {
                style: "currency",
                currency: "USD"
              })}</strong>
              <small>Inventory Value</small>
            </div>
          </div>

          <section className="panel">

            <div className="panel-heading">
              <div>
                <h2>All Products</h2>
                <p>{filtered.length} products found</p>
              </div>

              <div className="panel-tools">
                <input
                  className="search"
                  placeholder="Search SKU or name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />

                <div className="export-dropdown">
                  <button
                    type="button"
                    className="export-button"
                    disabled={loading || filtered.length === 0}
                    aria-haspopup="menu"
                    aria-expanded={exportMenuOpen}
                    onClick={() => setExportMenuOpen((open) => !open)}
                  >
                    Export <span aria-hidden="true">▾</span>
                  </button>

                  {exportMenuOpen && (
                    <div className="export-menu" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          handleExport("xlsx");
                          setExportMenuOpen(false);
                        }}
                      >
                        <span>Excel</span>
                        <small>.xlsx</small>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          handleExport("csv");
                          setExportMenuOpen(false);
                        }}
                      >
                        <span>CSV</span>
                        <small>.csv</small>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          handleExport("txt");
                          setExportMenuOpen(false);
                        }}
                      >
                        <span>Text</span>
                        <small>.txt</small>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <p className="empty">Loading products...</p>
            ) : filtered.length === 0 ? (
              <p className="empty">No products found.</p>
            ) : (
              <>
              <div className="table-scroll">
                <table className="product-table">
                  <colgroup>
                    <col className="col-product" />
                    <col className="col-sku" />
                    <col className="col-price" />
                    <col className="col-stock" />
                    <col className="col-status" />
                    <col className="col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((p) => {
                      const isLow = p.stock <= p.minimum_stock;

                      return (
                        <tr key={p.product_id}>
                          <td>
                            <div className="product-cell">
                              {p.img ? (
                                <img src={`/images/${p.img}`} alt="" />
                              ) : (
                                <div className="product-placeholder">PC</div>
                              )}
                              <div>
                                <strong>{p.name}</strong>
                                <small>{p.description || "No description"}</small>
                              </div>
                            </div>
                          </td>
                          <td className="sku">{p.product_id}</td>
                          <td className="price">
                            {p.price.toLocaleString("en-US", {
                              style: "currency",
                              currency: "USD",
                            })}
                          </td>
                          <td>{p.stock}</td>
                          <td>
                            <span className={`status ${isLow ? "low" : "good"}`}>
                              {isLow ? "Low stock" : "In stock"}
                            </span>
                          </td>
                          <td>
                            <div className="actions">
                              <button className="edit" onClick={() => openEdit(p)}>
                                Edit
                              </button>
                              <button className="delete" onClick={() => void deleteProduct(p)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="table-pagination">
    <div className="pagination-info">
      Showing{" "}
      <strong>
        {filtered.length === 0 ? 0 : startIndex + 1}
      </strong>
      {" – "}
      <strong>{endIndex}</strong>
      {" of "}
      <strong>{filtered.length}</strong>
      {" products"}
    </div>

    <label className="page-size-control">
      Rows per page

      <select
        value={pageSize}
        onChange={(e) => {
          setPageSize(Number(e.target.value));
          setCurrentPage(1);
        }}
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
      </select>
    </label>

    <div className="pagination-controls">
      <button
        type="button"
        className="page-button"
        disabled={safeCurrentPage === 1}
        onClick={() =>
          setCurrentPage(Math.max(1, safeCurrentPage - 1))
        }
      >
        Previous
      </button>

      {visiblePageNumbers.map((page) => (
        <button
          type="button"
          key={page}
          className={`page-number ${
            safeCurrentPage === page ? "active" : ""
          }`}
          aria-current={
            safeCurrentPage === page ? "page" : undefined
          }
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        className="page-button"
        disabled={safeCurrentPage === totalPages}
        onClick={() =>
          setCurrentPage(
            Math.min(totalPages, safeCurrentPage + 1)
          )
        }
      >
        Next
      </button>
    </div>
  </div>
  </>
            )}
          </section>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}>
          <section className="modal" role="dialog" aria-modal="true"
            aria-labelledby="product-form-title">
            <div className="modal-heading">
              <div>
                <h2 id="product-form-title">
                  {editing ? "Edit Product" : "Add Product"}
                </h2>
                <p>Enter the product and inventory details.</p>
              </div>
              <button className="close" type="button"
                onClick={() => setModalOpen(false)}>×</button>
            </div>

            <form onSubmit={saveProduct}>
              <div className="form-grid">
                <label>
                  SKU / Product ID *
                  <input required maxLength={50}
                    value={draft.product_id}
                    disabled={editing}
                    placeholder="SKU-PC-017"
                    onChange={(e) => change("product_id", e.target.value)} />
                </label>

                <label>
                  Product name *
                  <input required maxLength={50} value={draft.name}
                    onChange={(e) => change("name", e.target.value)} />
                </label>

                <label className="full">
                  Description
                  <textarea maxLength={300} rows={3}
                    value={draft.description}
                    onChange={(e) => change("description", e.target.value)} />
                </label>

                <label>
                  Image URL
                  <input maxLength={300} value={draft.img}
                    placeholder="Optional"
                    onChange={(e) => change("img", e.target.value)} />
                </label>

                <label>
                  Minimum stock *
                  <input required type="number" min="0" step="1"
                    value={draft.minimum_stock}
                    onChange={(e) => change("minimum_stock", Number(e.target.value))} />
                </label>

                <label className="full">
                  Price (USD) *
                  <input required type="number" min="0" step="0.01"
                    value={draft.price}
                    onChange={(e) => change("price", Number(e.target.value))} />
                </label>
              </div>

              {error && <div className="error-banner" role="alert">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="secondary"
                  onClick={() => setModalOpen(false)}>Cancel</button>
                <button className="primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

        
  </div>
  </AdminLayout>
  );
}