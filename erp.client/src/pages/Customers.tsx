import { useEffect, useMemo, useState, type FormEvent } from "react";
import * as XLSX from "xlsx";
import AdminLayout from "../layouts/AdminLayout";
import { customerApi, type Customer, type CustomerType } from "../api/customers";
import "./Customers.css";
import { useNavigate } from "react-router";

const emptyCustomer: Customer = {
  customer_id: "",
  customer_type: "individual",
  first_name: "",
  last_name: "",
  company_name: "",
  email: "",
  phone: "",
  tax_id: "",
};

function normalizeCustomerType(value: string): CustomerType {
  return value.toLowerCase() === "company" ? "company" : "individual";
}

function customerDisplayName(customer: Customer): string {
  if (normalizeCustomerType(customer.customer_type) === "company") {
    return customer.company_name || "Unnamed company";
  }

  return `${customer.first_name} ${customer.last_name}`.trim() || "Unnamed customer";
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [draft, setDraft] = useState<Customer>({ ...emptyCustomer });
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

  async function loadCustomers() {
    setLoading(true);
    try {
      setCustomers(await customerApi.getAll());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    return customers
      .filter((customer) =>
        [
          customer.customer_id,
          customer.customer_type,
          customer.first_name,
          customer.last_name,
          customer.company_name,
          customer.email,
          customer.phone,
          customer.tax_id,
        ].some((value) => (value ?? "").toLowerCase().includes(term))
      )
      .sort((a, b) =>
        a.customer_id.localeCompare(b.customer_id, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
  }, [customers, search]);

  const individualCount = customers.filter(
    (customer) => normalizeCustomerType(customer.customer_type) === "individual"
  ).length;
  const companyCount = customers.length - individualCount;

  // Pagination: show at most three page-number buttons.
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filtered.length);
  const paginatedCustomers = filtered.slice(startIndex, endIndex);

  const maxVisiblePages = 3;
  const startPage = Math.max(
    1,
    Math.min(safeCurrentPage - 1, totalPages - maxVisiblePages + 1)
  );
  const visiblePageNumbers = Array.from(
    { length: Math.min(maxVisiblePages, totalPages) },
    (_, index) => startPage + index
  );

  function openCreate() {
    setDraft({ ...emptyCustomer });
    setEditing(false);
    setError("");
    setModalOpen(true);
  }

  function openEdit(customer: Customer) {
    setDraft({
      customer_id: customer.customer_id,
      customer_type: normalizeCustomerType(customer.customer_type),
      first_name: customer.first_name ?? "",
      last_name: customer.last_name ?? "",
      company_name: customer.company_name ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      tax_id: customer.tax_id ?? "",
    });
    setEditing(true);
    setError("");
    setModalOpen(true);
  }

  function change<K extends keyof Customer>(key: K, value: Customer[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  function changeCustomerType(value: CustomerType) {
    setDraft((previous) => ({
      ...previous,
      customer_type: value,
      ...(value === "company"
        ? { first_name: "", last_name: "" }
        : { company_name: "" }),
    }));
  }

  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload: Customer = {
      ...draft,
      customer_type: normalizeCustomerType(draft.customer_type),
      first_name:
        draft.customer_type === "individual" ? draft.first_name.trim() : "",
      last_name:
        draft.customer_type === "individual" ? draft.last_name.trim() : "",
      company_name:
        draft.customer_type === "company" ? draft.company_name.trim() : "",
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      tax_id: draft.tax_id.trim(),
    };

    try {
      if (editing) {
        await customerApi.update(payload);
      } else {
        // customer_id is intentionally blank for new records; the API/database
        // is expected to generate the incrementing ID.
        await customerApi.create(payload);
      }

      setModalOpen(false);
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save customer.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(customer: Customer) {
    const name = customerDisplayName(customer);
    if (
      !window.confirm(
        `Delete customer "${name}" (${customer.customer_id})?`
      )
    ) {
      return;
    }

    setError("");
    try {
      await customerApi.delete(customer.customer_id);
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete customer.");
    }
  }

  function handleExport(format: "xlsx" | "csv" | "txt") {
    if (filtered.length === 0) return;

    // Export every matching customer, not only the current page.
    const headers = [
      "Customer ID",
      "Customer Type",
      "First Name",
      "Last Name",
      "Company Name",
      "Email",
      "Phone",
      "Tax ID",
    ];

    const rows = filtered.map((customer) => ({
      "Customer ID": customer.customer_id,
      "Customer Type": normalizeCustomerType(customer.customer_type),
      "First Name": customer.first_name || "",
      "Last Name": customer.last_name || "",
      "Company Name": customer.company_name || "",
      Email: customer.email || "",
      Phone: customer.phone || "",
      "Tax ID": customer.tax_id || "",
    }));

    const filename = `customers-${new Date().toISOString().slice(0, 10)}`;

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 16 },
        { wch: 16 },
        { wch: 20 },
        { wch: 20 },
        { wch: 30 },
        { wch: 32 },
        { wch: 18 },
        { wch: 20 },
      ];
      worksheet["!autofilter"] = { ref: `A1:H${rows.length + 1}` };

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      return;
    }

    const delimiter = format === "csv" ? "," : "\t";

    function formatCell(value: unknown): string {
      let text = value == null ? "" : String(value);

      // Reduce the risk of text values being interpreted as spreadsheet formulas.
      if (typeof value === "string" && /^[\t\r\n ]*[=+\-@]/.test(text)) {
        text = `'${text}`;
      }

      if (format === "csv") {
        return `"${text.replace(/"/g, '""')}"`;
      }

      // Keep each TXT value on one tab-separated field.
      return text.replace(/[\t\r\n]+/g, " ");
    }

    const content = [
      headers.map(formatCell).join(delimiter),
      ...rows.map((row) =>
        headers
          .map((header) => formatCell(row[header as keyof typeof row]))
          .join(delimiter)
      ),
    ].join("\r\n");

    const blob = new Blob(
      [format === "csv" ? `\uFEFF${content}` : content],
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

  function goToAddresses() {
    navigate(`/customerAddresses`);
  }

  return (
    <AdminLayout breadcrumb="Admin / Customers">
      <div className="customers-page">
        <div className="page-heading">
          <div>
            <h1>Customer Management</h1>
            <p>Manage individual and company customer records.</p>
          </div>
          <div>
            <button className="success address-btn" onClick={goToAddresses}>
            + Add Address
          </button>
          <button className="primary" onClick={openCreate}>
            + Add Customer
          </button>
          </div>
          
        </div>

        {error && !modalOpen && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <div className="stats">
          <div className="stat-card">
            <span>Total customers</span>
            <strong>{customers.length}</strong>
            <small>Registered customer records</small>
          </div>
          <div className="stat-card">
            <span>Individuals</span>
            <strong>{individualCount}</strong>
            <small>Personal customer accounts</small>
          </div>
          <div className="stat-card">
            <span>Companies</span>
            <strong>{companyCount}</strong>
            <small>Business customer accounts</small>
          </div>
        </div>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>All Customers</h2>
              <p>{filtered.length} customers found</p>
            </div>

            <div className="panel-tools">
              <input
                className="search"
                placeholder="Search ID, name, email, phone or tax ID..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
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
            <p className="empty">Loading customers...</p>
          ) : filtered.length === 0 ? (
            <p className="empty">No customers found.</p>
          ) : (
            <>
              <div className="table-scroll">
                <table className="customer-table">
                  <colgroup>
                    <col className="customer-col-id" />
                    <col className="customer-col-type" />
                    <col className="customer-col-name" />
                    <col className="customer-col-email" />
                    <col className="customer-col-phone" />
                    <col className="customer-col-tax" />
                    <col className="customer-col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Type</th>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Tax ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCustomers.map((customer) => (
                      <tr key={customer.customer_id}>
                        <td className="customer-id">
                          {customer.customer_id}
                        </td>
                        <td>
                          <span
                            className={`customer-type-badge ${normalizeCustomerType(
                              customer.customer_type
                            )}`}
                          >
                            {normalizeCustomerType(customer.customer_type) ===
                            "company"
                              ? "Company"
                              : "Individual"}
                          </span>
                        </td>
                        <td>
                          <div className="customer-name-cell">
                            <strong>{customerDisplayName(customer)}</strong>
                            <small>
                              {normalizeCustomerType(customer.customer_type) ===
                              "company"
                                ? "Business customer"
                                : `${customer.first_name || ""} ${
                                    customer.last_name || ""
                                  }`.trim()}
                            </small>
                          </div>
                        </td>
                        <td className="customer-contact">
                          {customer.email || "—"}
                        </td>
                        <td>{customer.phone || "—"}</td>
                        <td>{customer.tax_id || "—"}</td>
                        <td>
                          <div className="actions">
                            <button
                              className="edit"
                              onClick={() => openEdit(customer)}
                            >
                              Edit
                            </button>
                            <button
                              className="delete"
                              onClick={() => void deleteCustomer(customer)}
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
                  –<strong>{endIndex}</strong> of <strong>{filtered.length}</strong>{" "}
                  customers
                </div>

                <label className="page-size-control">
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
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setModalOpen(false);
            }}
          >
            <section
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="customer-form-title"
            >
              <div className="modal-heading">
                <div>
                  <h2 id="customer-form-title">
                    {editing ? "Edit Customer" : "Add Customer"}
                  </h2>
                  <p>Enter the customer details below.</p>
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

              <form onSubmit={saveCustomer}>
                <div className="form-grid">
                  {editing ? (
                    <label>
                      Customer ID
                      <input value={draft.customer_id} disabled />
                    </label>
                  ) : (
                    <div className="customer-id-note">
                      <span>Customer ID</span>
                      <strong>Generated automatically</strong>
                    </div>
                  )}

                  <label>
                    Customer type *
                    <select
                      required
                      value={draft.customer_type}
                      onChange={(event) =>
                        changeCustomerType(event.target.value as CustomerType)
                      }
                    >
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                    </select>
                  </label>

                  {draft.customer_type === "individual" ? (
                    <>
                      <label>
                        First name *
                        <input
                          required
                          maxLength={100}
                          autoComplete="given-name"
                          value={draft.first_name}
                          onChange={(event) =>
                            change("first_name", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Last name *
                        <input
                          required
                          maxLength={100}
                          autoComplete="family-name"
                          value={draft.last_name}
                          onChange={(event) =>
                            change("last_name", event.target.value)
                          }
                        />
                      </label>
                    </>
                  ) : (
                    <label className="full">
                      Company name *
                      <input
                        required
                        maxLength={200}
                        autoComplete="organization"
                        value={draft.company_name}
                        onChange={(event) =>
                          change("company_name", event.target.value)
                        }
                      />
                    </label>
                  )}

                  <label>
                    Email
                    <input
                      type="email"
                      maxLength={254}
                      autoComplete="email"
                      value={draft.email}
                      onChange={(event) => change("email", event.target.value)}
                    />
                  </label>

                  <label>
                    Phone
                    <input
                      type="tel"
                      maxLength={40}
                      autoComplete="tel"
                      value={draft.phone}
                      onChange={(event) => change("phone", event.target.value)}
                    />
                  </label>

                  <label className="full">
                    Tax ID
                    <input
                      maxLength={100}
                      value={draft.tax_id}
                      onChange={(event) => change("tax_id", event.target.value)}
                    />
                  </label>
                </div>

                {error && (
                  <div className="error-banner customer-form-error" role="alert">
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
                      : "Create Customer"}
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
