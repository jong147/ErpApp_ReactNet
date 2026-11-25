import { useEffect, useMemo, useState, type FormEvent } from "react";
import AdminLayout from "../layouts/AdminLayout";
import {
  supplierProductApi,
  type SupplierProductDto,
  type SupplierProductInput,
} from "../api/supplierProducts";
import { supplierApi } from "../api/suppliers";
import { productApi } from "../api/products";
import * as XLSX from "xlsx";
import "./SupplierProducts.css";

interface SupplierOption {
  supplier_id: string;
  name: string;
}

interface ProductOption {
  product_id: string;
  name: string;
  img: string;
}

const emptySupplierProduct: SupplierProductInput = {
  supplier_id: "",
  product_id: "",
  price: 0,
};

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function getImageSrc(path: string) {
  const imagePath = path.trim();
  if (!imagePath) return "";
  if (/^(https?:)?\/\//i.test(imagePath) || imagePath.startsWith("/")) {
    return imagePath;
  }
  return `/images/${imagePath}`;
}

export default function SupplierProducts() {
  const [supplierProducts, setSupplierProducts] = useState<SupplierProductDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [draft, setDraft] = useState<SupplierProductInput>(emptySupplierProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = editingId !== null;
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  async function loadPageData() {
    setLoading(true);
    try {
      const [supplierProductRows, supplierRows, productRows] = await Promise.all([
        supplierProductApi.getAll(),
        supplierApi.getAll(),
        productApi.getAll(),
      ]);

      setSupplierProducts(supplierProductRows);
      setSuppliers(supplierRows);
      setProducts(productRows);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load supplier products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPageData();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    return supplierProducts
      .filter((item) =>
        [
          item.supplier_name,
          item.product_name,
          item.supplier_id,
          item.product_id,
          item.supplier_product_id,
        ].some((value) => (value ?? "").toLowerCase().includes(term))
      )
      .sort((a, b) => {
        const supplierOrder = a.supplier_name.localeCompare(b.supplier_name);
        return supplierOrder || a.product_name.localeCompare(b.product_name);
      });
  }, [supplierProducts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filtered.length);
  const paginatedRows = filtered.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const maxVisiblePages = 3;
  const startPage = Math.max(
    1,
    Math.min(safeCurrentPage - 1, totalPages - maxVisiblePages + 1)
  );
  const visiblePageNumbers = Array.from(
    { length: Math.min(maxVisiblePages, totalPages) },
    (_, index) => startPage + index
  );

  const supplierCount = new Set(supplierProducts.map((item) => item.supplier_id)).size;
  const productCount = new Set(supplierProducts.map((item) => item.product_id)).size;

  function handleExport(format: "xlsx" | "csv" | "txt") {
    if (filtered.length === 0) return;

    const headers = [
      "Supplier",
      "Product",
      "Supplier ID",
      "Product ID",
      "Supplier Price (USD)",
      "Record ID",
    ] as const;

    const rows = filtered.map((item) => ({
      Supplier: item.supplier_name,
      Product: item.product_name,
      "Supplier ID": item.supplier_id,
      "Product ID": item.product_id,
      "Supplier Price (USD)": item.price,
      "Record ID": item.supplier_product_id,
    }));

    const filename = `supplier-products-${new Date().toISOString().slice(0, 10)}`;

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 30 },
        { wch: 30 },
        { wch: 18 },
        { wch: 18 },
        { wch: 24 },
        { wch: 18 },
      ];

      for (let rowIndex = 2; rowIndex <= rows.length + 1; rowIndex++) {
        const priceCell = worksheet[`E${rowIndex}`];
        if (priceCell) priceCell.z = '"$"#,##0.00';
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Supplier Products");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      return;
    }

    const delimiter = format === "csv" ? "," : "\t";
    function formatCell(value: unknown) {
      let text = value == null ? "" : String(value);
      if (typeof value === "string" && /^[\t\r\n ]*[=+\-@]/.test(text)) {
        text = `'${text}`;
      }
      if (format === "csv") return `"${text.replace(/"/g, '""')}"`;
      return text.replace(/[\t\r\n]+/g, " ");
    }

    const content = [
      headers.map(formatCell).join(delimiter),
      ...rows.map((row) => headers.map((header) => formatCell(row[header])).join(delimiter)),
    ].join("\r\n");

    const blob = new Blob(
      [format === "csv" ? "\uFEFF" + content : content],
      {
        type: format === "csv" ? "text/csv;charset=utf-8;" : "text/plain;charset=utf-8;",
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
    setDraft({
      ...emptySupplierProduct,
      supplier_id: suppliers[0]?.supplier_id ?? "",
      product_id: products[0]?.product_id ?? "",
    });
    setEditingId(null);
    setError("");
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item: SupplierProductDto) {
    setDraft({
      supplier_id: item.supplier_id,
      product_id: item.product_id,
      price: item.price,
    });
    setEditingId(item.supplier_product_id);
    setError("");
    setFormError("");
    setModalOpen(true);
  }

  function change<K extends keyof SupplierProductInput>(key: K, value: SupplierProductInput[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  async function saveSupplierProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      if (editing && editingId) {
        await supplierProductApi.update({
          ...draft,
          supplier_product_id: editingId,
        });
      } else {
        // The API generates supplier_product_id on the server.
        await supplierProductApi.create(draft);
      }
      setModalOpen(false);
      await loadPageData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSupplierProduct(item: SupplierProductDto) {
    if (!window.confirm(`Delete the ${item.product_name} price from ${item.supplier_name}?`)) {
      return;
    }

    setError("");
    try {
      await supplierProductApi.delete(item.supplier_product_id);
      await loadPageData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const selectedProduct = products.find((product) => product.product_id === draft.product_id);

  return (
    <AdminLayout breadcrumb="Admin / Supplier Products">
      <div className="supplier-products-page">
        <div className="sp-page-heading">
          <div>
            <h1>Supplier Product Prices</h1>
            <p>Manage supplier relationships and compare product purchase prices.</p>
          </div>
          <button
            type="button"
            className="primary"
            onClick={openCreate}
            disabled={loading || suppliers.length === 0 || products.length === 0}
          >
            + Add Supplier Product
          </button>
        </div>

        {error && <div className="sp-error-banner" role="alert">{error}</div>}

        <div className="sp-stats">
          <div className="sp-stat-card">
            <span>Total supplier prices</span>
            <strong>{supplierProducts.length}</strong>
            <small>Registered supplier-product offers</small>
          </div>
          <div className="sp-stat-card">
            <span>Suppliers represented</span>
            <strong>{supplierCount}</strong>
            <small>Suppliers with product prices</small>
          </div>
          <div className="sp-stat-card">
            <span>Products covered</span>
            <strong>{productCount}</strong>
            <small>Products with at least one supplier</small>
          </div>
        </div>

        <section className="sp-panel">
          <div className="sp-panel-heading">
            <div>
              <h2>Supplier Product List</h2>
              <p>{filtered.length} supplier prices found</p>
            </div>

            <div className="sp-panel-tools">
              <input
                className="sp-search"
                placeholder="Search supplier or product..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <div className="sp-export-dropdown">
                <button
                  type="button"
                  className="sp-export-button"
                  disabled={loading || filtered.length === 0}
                  aria-haspopup="menu"
                  aria-expanded={exportMenuOpen}
                  onClick={() => setExportMenuOpen((open) => !open)}
                >
                  Export <span aria-hidden="true">▾</span>
                </button>

                {exportMenuOpen && (
                  <div className="sp-export-menu" role="menu">
                    <button type="button" role="menuitem" onClick={() => { handleExport("xlsx"); setExportMenuOpen(false); }}>
                      <span>Excel</span><small>.xlsx</small>
                    </button>
                    <button type="button" role="menuitem" onClick={() => { handleExport("csv"); setExportMenuOpen(false); }}>
                      <span>CSV</span><small>.csv</small>
                    </button>
                    <button type="button" role="menuitem" onClick={() => { handleExport("txt"); setExportMenuOpen(false); }}>
                      <span>Text</span><small>.txt</small>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <p className="sp-empty">Loading supplier products...</p>
          ) : filtered.length === 0 ? (
            <p className="sp-empty">No supplier product prices found.</p>
          ) : (
            <>
              <div className="sp-table-scroll">
                <table className="sp-table">
                  <colgroup>
                    <col className="sp-col-supplier" />
                    <col className="sp-col-product" />
                    <col className="sp-col-price" />
                    <col className="sp-col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Product</th>
                      <th>Supplier Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((item) => (
                      <tr key={item.supplier_product_id}>
                        <td>
                          <div className="sp-supplier-cell">
                            <strong>{item.supplier_name}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="sp-product-cell">
                            {item.img ? (
                              <img src={getImageSrc(item.img)} alt={item.product_name} />
                            ) : (
                              <div className="sp-product-placeholder">PC</div>
                            )}
                            <div>
                              <strong>{item.product_name}</strong>
                            </div>
                          </div>
                        </td>
                        <td className="sp-price">{formatCurrency(item.price)}</td>
                        <td>
                          <div className="sp-actions">
                            <button type="button" className="sp-edit" onClick={() => openEdit(item)}>
                              Edit
                            </button>
                            <button type="button" className="sp-delete" onClick={() => void deleteSupplierProduct(item)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sp-table-pagination">
                <div className="sp-pagination-info">
                  Showing <strong>{filtered.length === 0 ? 0 : startIndex + 1}</strong>
                  {" – "}<strong>{endIndex}</strong> of <strong>{filtered.length}</strong> supplier prices
                </div>

                <label className="sp-page-size-control">
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

                <div className="sp-pagination-controls">
                  <button
                    type="button"
                    className="sp-page-button"
                    disabled={safeCurrentPage === 1}
                    onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
                  >
                    Previous
                  </button>
                  {visiblePageNumbers.map((page) => (
                    <button
                      type="button"
                      key={page}
                      className={`sp-page-number ${safeCurrentPage === page ? "active" : ""}`}
                      aria-current={safeCurrentPage === page ? "page" : undefined}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="sp-page-button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {modalOpen && (
          <div
            className="sp-modal-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setModalOpen(false);
            }}
          >
            <section className="sp-modal" role="dialog" aria-modal="true" aria-labelledby="sp-form-title">
              <div className="sp-modal-heading">
                <div>
                  <h2 id="sp-form-title">{editing ? "Edit Supplier Product Price" : "Add Supplier Product Price"}</h2>
                  <p>Select a supplier and product, then enter the supplier price.</p>
                </div>
                <button className="sp-close" type="button" onClick={() => setModalOpen(false)} aria-label="Close">
                  ×
                </button>
              </div>

              <form onSubmit={saveSupplierProduct}>
                <div className="sp-form-grid">
                  <label>
                    Supplier *
                    <select
                      required
                      value={draft.supplier_id}
                      onChange={(e) => change("supplier_id", e.target.value)}
                    >
                      <option value="" disabled>Select a supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.supplier_id} value={supplier.supplier_id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Product *
                    <select
                      required
                      value={draft.product_id}
                      onChange={(e) => change("product_id", e.target.value)}
                    >
                      <option value="" disabled>Select a product</option>
                      {products.map((product) => (
                        <option key={product.product_id} value={product.product_id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedProduct && (
                    <div className="sp-selected-product">
                      {selectedProduct.img ? (
                        <img src={getImageSrc(selectedProduct.img)} alt={selectedProduct.name} />
                      ) : (
                        <div className="sp-product-placeholder">PC</div>
                      )}
                      <div>
                        <strong>{selectedProduct.name}</strong>
                        <small>{selectedProduct.product_id}</small>
                      </div>
                    </div>
                  )}

                  <label className="sp-full">
                    Supplier Price (USD) *
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={draft.price}
                      onChange={(e) => change("price", Number(e.target.value))}
                    />
                  </label>
                </div>

                {formError && <div className="sp-error-banner" role="alert">{formError}</div>}

                <div className="sp-modal-actions">
                  <button type="button" className="sp-secondary" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary" disabled={saving}>
                    {saving ? "Saving..." : editing ? "Save Changes" : "Create Supplier Price"}
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
