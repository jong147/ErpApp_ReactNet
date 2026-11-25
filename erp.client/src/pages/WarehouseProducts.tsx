import { useEffect, useMemo, useState, type FormEvent } from "react";
import { warehouseProductApi, type WarehouseProduct } from "../api/warehouseProducts";
import AdminLayout from "../layouts/AdminLayout";
import * as XLSX from "xlsx";
import "./WarehouseProducts.css";

const emptyWarehouseProduct: WarehouseProduct = {
  warehouse_product_id: "",
  warehouse_id: "",
  product_id: "",
  quantity: 0,
};

export default function WarehouseProducts() {
  const [warehouseProducts, setWarehouseProducts] = useState<WarehouseProduct[]>([]);
  const [draft, setDraft] = useState<WarehouseProduct>(emptyWarehouseProduct);
  const [editing, setEditing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  async function loadWarehouseProducts() {
    setLoading(true);

    try {
      setWarehouseProducts(await warehouseProductApi.getAll());
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load warehouse products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWarehouseProducts();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    return warehouseProducts
      .filter((item) =>
        [
          item.warehouse_product_id,
          item.warehouse_id,
          item.product_id,
          String(item.quantity),
        ].some((value) => (value ?? "").toLowerCase().includes(term))
      )
      .sort((a, b) =>
        a.warehouse_product_id.localeCompare(
          b.warehouse_product_id,
          undefined,
          { numeric: true, sensitivity: "base" }
        )
      );
  }, [warehouseProducts, search]);

  const totalQuantity = warehouseProducts.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const uniqueWarehouses = new Set(
    warehouseProducts.map((item) => item.warehouse_id)
  ).size;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filtered.length);
  const paginatedWarehouseProducts = filtered.slice(startIndex, endIndex);

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

  function handleExport(format: "xlsx" | "csv" | "txt") {
    if (filtered.length === 0) return;

    const headers = [
      "Warehouse Product ID",
      "Warehouse ID",
      "Product ID",
      "Quantity",
    ] as const;

    const rows = filtered.map((item) => ({
      "Warehouse Product ID": item.warehouse_product_id,
      "Warehouse ID": item.warehouse_id,
      "Product ID": item.product_id,
      Quantity: item.quantity,
    }));

    const filename = `warehouse-products-${new Date().toISOString().slice(0, 10)}`;

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 25 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Warehouse Products");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      return;
    }

    const delimiter = format === "csv" ? "," : "\t";

    function formatCell(value: unknown): string {
      let text = value == null ? "" : String(value);

      // Prevent spreadsheet formula injection in exported text fields.
      if (typeof value === "string" && /^[\t\r\n ]*[=+\-@]/.test(text)) {
        text = `'${text}`;
      }

      if (format === "csv") {
        return `"${text.replace(/"/g, '""')}"`;
      }

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
    setDraft({ ...emptyWarehouseProduct });
    setEditing(false);
    setError("");
    setModalOpen(true);
  }

  function openEdit(item: WarehouseProduct) {
    setDraft({
      warehouse_product_id: item.warehouse_product_id,
      warehouse_id: item.warehouse_id,
      product_id: item.product_id,
      quantity: item.quantity,
    });
    setEditing(true);
    setError("");
    setModalOpen(true);
  }

  function change<K extends keyof WarehouseProduct>(
    key: K,
    value: WarehouseProduct[K]
  ) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  async function saveWarehouseProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editing) {
        await warehouseProductApi.update(draft);
      } else {
        await warehouseProductApi.create({
          warehouse_id: draft.warehouse_id,
          product_id: draft.product_id,
          quantity: draft.quantity,
        });
      }

      setModalOpen(false);
      await loadWarehouseProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteWarehouseProduct(item: WarehouseProduct) {
    if (
      !window.confirm(
        `Delete warehouse product "${item.warehouse_product_id}"?`
      )
    ) {
      return;
    }

    setError("");

    try {
      await warehouseProductApi.delete(item.warehouse_product_id);
      await loadWarehouseProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <AdminLayout breadcrumb="Admin / Warehouse Products">
      <div className="warehouse-product-page">
        <div className="page-heading">
          <div>
            <h1>Warehouse Products</h1>
            <p>Manage product quantities assigned to your warehouses.</p>
          </div>
          <button className="primary" type="button" onClick={openCreate}>
            + Add Warehouse Product
          </button>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <div className="stats">
          <div className="stat-card">
            <span>Total records</span>
            <strong>{warehouseProducts.length}</strong>
            <small>Product assignments across warehouses</small>
          </div>
          <div className="stat-card">
            <span>Total quantity</span>
            <strong>{totalQuantity.toLocaleString()}</strong>
            <small>Units recorded in all warehouses</small>
          </div>
          <div className="stat-card">
            <span>Warehouses represented</span>
            <strong>{uniqueWarehouses}</strong>
            <small>Warehouses with product records</small>
          </div>
        </div>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>All Warehouse Products</h2>
              <p>{filtered.length} records found</p>
            </div>

            <div className="panel-tools">
              <input
                className="search"
                placeholder="Search record, warehouse or product ID..."
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
            <p className="empty">Loading warehouse products...</p>
          ) : filtered.length === 0 ? (
            <p className="empty">No warehouse products found.</p>
          ) : (
            <>
              <div className="table-scroll">
                <table className="warehouse-product-table">
                  <colgroup>
                    <col className="col-product" />
                    <col className="col-record-id" />
                    <col className="col-warehouse-id" />
                    <col className="col-quantity" />
                    <col className="col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Record ID</th>
                      <th>Warehouse ID</th>
                      <th>Quantity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedWarehouseProducts.map((item) => (
                      <tr key={item.warehouse_product_id}>
                        <td>
                          <div className="product-cell">
                            <div className="product-placeholder" aria-hidden="true">
                              PR
                            </div>
                            <div>
                              <strong>{item.product_id}</strong>
                              <small>Warehouse product</small>
                            </div>
                          </div>
                        </td>
                        <td className="record-id">{item.warehouse_product_id}</td>
                        <td className="warehouse-id">{item.warehouse_id}</td>
                        <td className="quantity-cell">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td>
                          <div className="actions">
                            <button
                              type="button"
                              className="edit"
                              onClick={() => openEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="delete"
                              onClick={() => void deleteWarehouseProduct(item)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-pagination">
                <div className="pagination-info">
                  Showing <strong>{filtered.length === 0 ? 0 : startIndex + 1}</strong>
                  {" – "}
                  <strong>{endIndex}</strong>
                  {" of "}
                  <strong>{filtered.length}</strong>
                  {" records"}
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
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))
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
          <div
            className="modal-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setModalOpen(false);
            }}
          >
            <section
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="warehouse-product-form-title"
            >
              <div className="modal-heading">
                <div>
                  <h2 id="warehouse-product-form-title">
                    {editing ? "Edit Warehouse Product" : "Add Warehouse Product"}
                  </h2>
                  <p>Enter the warehouse product details.</p>
                </div>
                <button
                  className="close"
                  type="button"
                  aria-label="Close"
                  onClick={() => setModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={saveWarehouseProduct}>
                <div className="form-grid">
                  {editing && (
                    <label>
                      Warehouse Product ID
                      <input value={draft.warehouse_product_id} disabled />
                    </label>
                  )}

                  <label>
                    Warehouse ID *
                    <input
                      required
                      value={draft.warehouse_id}
                      placeholder="WH001"
                      onChange={(e) => change("warehouse_id", e.target.value)}
                    />
                  </label>

                  <label>
                    Product ID *
                    <input
                      required
                      value={draft.product_id}
                      placeholder="SKU-PC-001"
                      onChange={(e) => change("product_id", e.target.value)}
                    />
                  </label>

                  <label>
                    Quantity *
                    <input
                      required
                      type="number"
                      step="1"
                      value={draft.quantity}
                      onChange={(e) => change("quantity", Number(e.target.value))}
                    />
                  </label>
                </div>

                {error && (
                  <div className="error-banner" role="alert">
                    {error}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button className="primary" type="submit" disabled={saving}>
                    {saving
                      ? "Saving..."
                      : editing
                        ? "Save Changes"
                        : "Create Warehouse Product"}
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
