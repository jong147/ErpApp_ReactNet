import { useEffect, useMemo, useState } from "react";
import { supplierApi, type Supplier } from "../api/suppliers";
import AdminLayout from "../layouts/AdminLayout";
import * as XLSX from "xlsx";
import "./Suppliers.css";
import { useNavigate } from "react-router";

const emptySupplier: Supplier = {
  supplier_id: "",
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  tax_id_number: "",
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [draft, setDraft] = useState<Supplier>(emptySupplier);
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

  async function loadSuppliers() {
    setLoading(true);
    try {
      setSuppliers(await supplierApi.getAll());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSuppliers();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    return suppliers
      .filter((supplier) =>
        [
          supplier.supplier_id,
          supplier.name,
          supplier.contact_person,
          supplier.phone,
          supplier.email,
          supplier.address,
          supplier.tax_id_number,
        ].some((value) => (value ?? "").toLowerCase().includes(term))
      )
      .sort((a, b) =>
        a.supplier_id.localeCompare(b.supplier_id, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
  }, [suppliers, search]);

  const withEmail = suppliers.filter((supplier) => supplier.email.trim()).length;
  const withTaxId = suppliers.filter((supplier) => supplier.tax_id_number.trim()).length;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filtered.length);
  const paginatedSuppliers = filtered.slice(startIndex, endIndex);

  const maxVisiblePages = 3;
  const startPage = Math.max(
    1,
    Math.min(safeCurrentPage - 1, totalPages - maxVisiblePages + 1)
  );
  const visiblePageNumbers = Array.from(
    { length: Math.min(maxVisiblePages, totalPages) },
    (_, index) => startPage + index
  );

  // Export all filtered suppliers, not only the current page.
  function handleExport(format: "xlsx" | "csv" | "txt") {
    if (filtered.length === 0) return;

    const headers = [
      "Supplier ID",
      "Supplier Name",
      "Contact Person",
      "Phone",
      "Email",
      "Address",
      "Tax ID Number",
    ] as const;

    const rows = filtered.map((supplier) => ({
      "Supplier ID": supplier.supplier_id,
      "Supplier Name": supplier.name,
      "Contact Person": supplier.contact_person,
      Phone: supplier.phone,
      Email: supplier.email,
      Address: supplier.address,
      "Tax ID Number": supplier.tax_id_number,
    }));

    const filename = `suppliers-${new Date().toISOString().slice(0, 10)}`;

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 18 },
        { wch: 30 },
        { wch: 25 },
        { wch: 18 },
        { wch: 30 },
        { wch: 40 },
        { wch: 22 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Suppliers");
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
      ...rows.map((row) => headers.map((header) => formatCell(row[header])).join(delimiter)),
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
    setDraft({ ...emptySupplier });
    setEditing(false);
    setError("");
    setModalOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setDraft({ ...supplier });
    setEditing(true);
    setError("");
    setModalOpen(true);
  }

  function change<K extends keyof Supplier>(key: K, value: Supplier[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  async function saveSupplier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editing) {
        await supplierApi.update(draft);
      } else {
        await supplierApi.create(draft);
      }

      setModalOpen(false);
      await loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSupplier(supplier: Supplier) {
    if (
      !window.confirm(
        `Delete "${supplier.name}" (${supplier.supplier_id})?`
      )
    ) {
      return;
    }

    setError("");
    try {
      await supplierApi.delete(supplier.supplier_id);
      await loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  function goToProducts() {
    navigate("/supplierProducts");
  }

  return (
    <AdminLayout breadcrumb="Admin / Suppliers">
      <div className="suppliers-page">
        <div className="suppliers-page__heading">
          <div>
            <h1>Suppliers</h1>
            <p>Manage your supplier directory and contact information.</p>
          </div>
          <div className="sales-actions">
            <button className="success" onClick={goToProducts}>
              Product List
            </button>
            <button className="primary" onClick={openCreate}>
              + Add Supplier
          </button>
          </div>
        </div>

        {error && (
          <div className="suppliers-page__error" role="alert">
            {error}
          </div>
        )}

        <div className="suppliers-page__stats">
          <div className="suppliers-page__stat-card">
            <span>Total suppliers</span>
            <strong>{suppliers.length}</strong>
            <small>Registered suppliers</small>
          </div>
          <div className="suppliers-page__stat-card">
            <span>With email address</span>
            <strong>{withEmail}</strong>
            <small>Suppliers with an email contact</small>
          </div>
          <div className="suppliers-page__stat-card">
            <span>With tax ID</span>
            <strong>{withTaxId}</strong>
            <small>Suppliers with a tax ID number</small>
          </div>
        </div>

        <section className="suppliers-page__panel">
          <div className="suppliers-page__panel-heading">
            <div>
              <h2>All Suppliers</h2>
              <p>{filtered.length} suppliers found</p>
            </div>

            <div className="suppliers-page__panel-tools">
              <input
                className="suppliers-page__search"
                placeholder="Search ID, name, contact, email..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Search suppliers"
              />

              <div className="suppliers-page__export-dropdown">
                <button
                  type="button"
                  className="suppliers-page__export-button"
                  disabled={loading || filtered.length === 0}
                  aria-haspopup="menu"
                  aria-expanded={exportMenuOpen}
                  onClick={() => setExportMenuOpen((open) => !open)}
                >
                  Export <span aria-hidden="true">▾</span>
                </button>

                {exportMenuOpen && (
                  <div className="suppliers-page__export-menu" role="menu">
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
            <p className="suppliers-page__empty">Loading suppliers...</p>
          ) : filtered.length === 0 ? (
            <p className="suppliers-page__empty">No suppliers found.</p>
          ) : (
            <>
              <div className="suppliers-page__table-scroll">
                <table className="suppliers-page__table">
                  <colgroup>
                    <col className="suppliers-page__col-supplier" />
                    <col className="suppliers-page__col-id" />
                    <col className="suppliers-page__col-contact" />
                    <col className="suppliers-page__col-phone" />
                    <col className="suppliers-page__col-email" />
                    <col className="suppliers-page__col-tax" />
                    <col className="suppliers-page__col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Supplier ID</th>
                      <th>Contact Person</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Tax ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSuppliers.map((supplier) => (
                      <tr key={supplier.supplier_id}>
                        <td>
                          <div className="suppliers-page__supplier-cell">
                            <div className="suppliers-page__supplier-placeholder">
                              {supplier.name.trim().charAt(0).toUpperCase() || "S"}
                            </div>
                            <div className="suppliers-page__supplier-details">
                              <strong>{supplier.name}</strong>
                              <small>{supplier.address || "No address provided"}</small>
                            </div>
                          </div>
                        </td>
                        <td className="suppliers-page__sku">{supplier.supplier_id}</td>
                        <td>{supplier.contact_person || "—"}</td>
                        <td>{supplier.phone || "—"}</td>
                        <td className="suppliers-page__email">{supplier.email || "—"}</td>
                        <td>{supplier.tax_id_number || "—"}</td>
                        <td>
                          <div className="suppliers-page__actions">
                            <button
                              type="button"
                              className="suppliers-page__edit"
                              onClick={() => openEdit(supplier)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="suppliers-page__delete"
                              onClick={() => void deleteSupplier(supplier)}
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

              <div className="suppliers-page__pagination">
                <div className="suppliers-page__pagination-info">
                  Showing <strong>{filtered.length === 0 ? 0 : startIndex + 1}</strong>
                  {" – "}<strong>{endIndex}</strong>{" of "}
                  <strong>{filtered.length}</strong>{" suppliers"}
                </div>

                <label className="suppliers-page__page-size">
                  Rows per page
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </label>

                <div className="suppliers-page__pagination-controls">
                  <button
                    type="button"
                    className="suppliers-page__page-button"
                    disabled={safeCurrentPage === 1}
                    onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
                  >
                    Previous
                  </button>

                  {visiblePageNumbers.map((page) => (
                    <button
                      type="button"
                      key={page}
                      className={`suppliers-page__page-number ${
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
                    className="suppliers-page__page-button"
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
            className="suppliers-page__modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setModalOpen(false);
            }}
          >
            <section
              className="suppliers-page__modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="supplier-form-title"
            >
              <div className="suppliers-page__modal-heading">
                <div>
                  <h2 id="supplier-form-title">
                    {editing ? "Edit Supplier" : "Add Supplier"}
                  </h2>
                  <p>Enter the supplier's business and contact details.</p>
                </div>
                <button
                  className="suppliers-page__close"
                  type="button"
                  aria-label="Close"
                  onClick={() => setModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={saveSupplier}>
                <div className="suppliers-page__form-grid">
                  <label>
                    Supplier ID *
                    <input
                      required
                      maxLength={50}
                      value={draft.supplier_id}
                      disabled={editing}
                      placeholder="SUP-001"
                      onChange={(event) => change("supplier_id", event.target.value)}
                    />
                  </label>

                  <label>
                    Supplier name *
                    <input
                      required
                      maxLength={150}
                      value={draft.name}
                      placeholder="Supplier company name"
                      onChange={(event) => change("name", event.target.value)}
                    />
                  </label>

                  <label>
                    Contact person
                    <input
                      maxLength={100}
                      value={draft.contact_person}
                      placeholder="Contact name"
                      onChange={(event) => change("contact_person", event.target.value)}
                    />
                  </label>

                  <label>
                    Phone
                    <input
                      type="tel"
                      maxLength={30}
                      value={draft.phone}
                      placeholder="Phone number"
                      onChange={(event) => change("phone", event.target.value)}
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      maxLength={150}
                      value={draft.email}
                      placeholder="supplier@example.com"
                      onChange={(event) => change("email", event.target.value)}
                    />
                  </label>

                  <label>
                    Tax ID number
                    <input
                      maxLength={50}
                      value={draft.tax_id_number}
                      placeholder="Tax identification number"
                      onChange={(event) => change("tax_id_number", event.target.value)}
                    />
                  </label>

                  <label className="suppliers-page__full">
                    Address
                    <textarea
                      maxLength={300}
                      rows={3}
                      value={draft.address}
                      placeholder="Supplier address"
                      onChange={(event) => change("address", event.target.value)}
                    />
                  </label>
                </div>

                {error && (
                  <div className="suppliers-page__error" role="alert">
                    {error}
                  </div>
                )}

                <div className="suppliers-page__modal-actions">
                  <button
                    type="button"
                    className="suppliers-page__secondary"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="suppliers-page__primary"
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editing
                        ? "Save Changes"
                        : "Create Supplier"}
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
