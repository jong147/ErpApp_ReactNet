import { useEffect, useMemo, useState, type FormEvent } from "react";
import { warehouseApi, type Warehouse } from "../api/warehouses";
import AdminLayout from "../layouts/AdminLayout";
import * as XLSX from "xlsx";
import "./Warehouses.css";
import { useNavigate } from "react-router";

const emptyWarehouse: Warehouse = {
  warehouse_id: "",
  name: "",
  address: "",
};

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [draft, setDraft] = useState<Warehouse>(emptyWarehouse);
  const [editing, setEditing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function loadWarehouses() {
    setLoading(true);

    try {
      setWarehouses(await warehouseApi.getAll());
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load warehouses."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWarehouses();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    return warehouses
      .filter((warehouse) =>
        [warehouse.warehouse_id, warehouse.name, warehouse.address].some(
          (value) => (value ?? "").toLowerCase().includes(term)
        )
      )
      .sort((a, b) =>
        a.warehouse_id.localeCompare(b.warehouse_id, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
  }, [warehouses, search]);

  const uniqueAddresses = new Set(
    warehouses
      .map((warehouse) => (warehouse.address ?? "").trim().toLowerCase())
      .filter(Boolean)
  ).size;

  const missingAddresses = warehouses.filter(
    (warehouse) => !(warehouse.address ?? "").trim()
  ).length;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filtered.length);
  const paginatedWarehouses = filtered.slice(startIndex, endIndex);

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

    const headers = ["Warehouse ID", "Name", "Address"] as const;
    const rows = filtered.map((warehouse) => ({
      "Warehouse ID": warehouse.warehouse_id,
      Name: warehouse.name,
      Address: warehouse.address || "",
    }));

    const filename = `warehouses-${new Date().toISOString().slice(0, 10)}`;

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [{ wch: 22 }, { wch: 30 }, { wch: 55 }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Warehouses");
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
    setDraft({ ...emptyWarehouse });
    setEditing(false);
    setError("");
    setModalOpen(true);
  }

  function openEdit(warehouse: Warehouse) {
    setDraft({
      warehouse_id: warehouse.warehouse_id,
      name: warehouse.name,
      address: warehouse.address,
    });
    setEditing(true);
    setError("");
    setModalOpen(true);
  }

  function change<K extends keyof Warehouse>(key: K, value: Warehouse[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  async function saveWarehouse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editing) {
        await warehouseApi.update(draft);
      } else {
        await warehouseApi.create(draft);
      }

      setModalOpen(false);
      await loadWarehouses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteWarehouse(warehouse: Warehouse) {
    if (
      !window.confirm(
        `Delete "${warehouse.name}" (${warehouse.warehouse_id})?`
      )
    ) {
      return;
    }

    setError("");

    try {
      await warehouseApi.delete(warehouse.warehouse_id);
      await loadWarehouses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }

    
  }

    function goToStockManagement() {
        navigate("/warehouseProducts");
    }

  return (
    <AdminLayout breadcrumb="Admin / Warehouses">
      <div className="warehouse-page">
        <div className="page-heading">
          <div>
            <h1>Warehouse Management</h1>
            <p>Manage your warehouse locations and addresses.</p>
          </div>
          <div>
            <button className="success stock-btn" type="button" onClick={goToStockManagement}>
                Stock Management
            </button>
            <button className="primary" type="button" onClick={openCreate}>
                + Add Warehouse
            </button>
          </div>
          
        </div>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <div className="stats">
          <div className="stat-card">
            <span>Total warehouses</span>
            <strong>{warehouses.length}</strong>
            <small>Registered warehouse locations</small>
          </div>
          <div className="stat-card">
            <span>Unique addresses</span>
            <strong>{uniqueAddresses}</strong>
            <small>Distinct registered addresses</small>
          </div>
          <div className="stat-card">
            <span>Missing addresses</span>
            <strong className={missingAddresses ? "warning-text" : ""}>
              {missingAddresses}
            </strong>
            <small>Warehouses without an address</small>
          </div>
        </div>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>All Warehouses</h2>
              <p>{filtered.length} warehouses found</p>
            </div>

            <div className="panel-tools">
              <input
                className="search"
                placeholder="Search ID, name or address..."
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
            <p className="empty">Loading warehouses...</p>
          ) : filtered.length === 0 ? (
            <p className="empty">No warehouses found.</p>
          ) : (
            <>
              <div className="table-scroll">
                <table className="warehouse-table">
                  <colgroup>
                    <col className="col-warehouse" />
                    <col className="col-id" />
                    <col className="col-address" />
                    <col className="col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Warehouse</th>
                      <th>Warehouse ID</th>
                      <th>Address</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedWarehouses.map((warehouse) => (
                      <tr key={warehouse.warehouse_id}>
                        <td>
                          <div className="warehouse-cell">
                            <div className="warehouse-placeholder" aria-hidden="true">
                              WH
                            </div>
                            <div>
                              <strong>{warehouse.name}</strong>
                              <small>{warehouse.address || "No address provided"}</small>
                            </div>
                          </div>
                        </td>
                        <td className="warehouse-id">{warehouse.warehouse_id}</td>
                        <td className="address-cell">
                          {warehouse.address || "—"}
                        </td>
                        <td>
                          <div className="actions">
                            <button
                              type="button"
                              className="edit"
                              onClick={() => openEdit(warehouse)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="delete"
                              onClick={() => void deleteWarehouse(warehouse)}
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
                  {" warehouses"}
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
              aria-labelledby="warehouse-form-title"
            >
              <div className="modal-heading">
                <div>
                  <h2 id="warehouse-form-title">
                    {editing ? "Edit Warehouse" : "Add Warehouse"}
                  </h2>
                  <p>Enter the warehouse details.</p>
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

              <form onSubmit={saveWarehouse}>
                <div className="form-grid">
                  <label>
                    Warehouse ID *
                    <input
                      required
                      value={draft.warehouse_id}
                      disabled={editing}
                      placeholder="WH-SAN-01"
                      onChange={(e) => change("warehouse_id", e.target.value)}
                    />
                  </label>

                  <label>
                    Warehouse name *
                    <input
                      required
                      value={draft.name}
                      placeholder="Main Warehouse"
                      onChange={(e) => change("name", e.target.value)}
                    />
                  </label>

                  <label className="full">
                    Address
                    <textarea
                      rows={3}
                      value={draft.address}
                      placeholder="Enter the warehouse address"
                      onChange={(e) => change("address", e.target.value)}
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
                        : "Create Warehouse"}
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
