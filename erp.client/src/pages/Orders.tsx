import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import * as XLSX from "xlsx";
import { orderApi, type Order } from "../api/orders";
import AdminLayout from "../layouts/AdminLayout";
import "./Orders.css";

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

function getStatusLabel(status: string): string {
  const normalized = normalizeStatus(status);

  if (normalized === "confirmed") return "To fulfill";
  if (!normalized) return "Unknown";

  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusClass(status: string): string {
  const normalized = normalizeStatus(status);

  if (normalized === "confirmed") return "to-fulfill";
  if (normalized === "cancelled" || normalized === "canceled") return "cancelled";
  if (normalized === "completed" || normalized === "delivered") return "completed";

  return "other";
}

function formatDate(value: string): string {
  if (!value) return "—";

  // Treat date-only API values as local calendar dates to avoid timezone shifts.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const exportHeaders = [
  "Order ID",
  "Customer ID",
  "Date",
  "Status",
] as const;

type ExportRow = Record<(typeof exportHeaders)[number], string>;

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  async function loadOrders() {
    setLoading(true);

    try {
      const result = await orderApi.getAll();
      setOrders(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    return orders
      .filter((order) =>
        [order.order_id, order.customer_id, order.date, order.status, getStatusLabel(order.status)]
          .some((value) => String(value ?? "").toLowerCase().includes(term))
      )
      .sort((a, b) =>
        a.order_id.localeCompare(b.order_id, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
  }, [orders, search]);

  const ordersToFulfill = orders.filter(
    (order) => normalizeStatus(order.status) === "confirmed"
  ).length;

  const cancelledOrders = orders.filter((order) => {
    const status = normalizeStatus(order.status);
    return status === "cancelled" || status === "canceled";
  }).length;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filtered.length);
  const paginatedOrders = filtered.slice(startIndex, endIndex);

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

    // Export every filtered order, not only the rows on the current page.
    const rows: ExportRow[] = filtered.map((order) => ({
      "Order ID": order.order_id,
      "Customer ID": order.customer_id,
      Date: formatDate(order.date),
      Status: getStatusLabel(order.status),
    }));

    const filename = `orders-${new Date().toISOString().slice(0, 10)}`;

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 24 },
        { wch: 24 },
        { wch: 18 },
        { wch: 18 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      return;
    }

    const delimiter = format === "csv" ? "," : "\t";

    function formatCell(value: unknown): string {
      let text = value == null ? "" : String(value);

      // Prevent exported text from being interpreted as a spreadsheet formula.
      if (typeof value === "string" && /^[\t\r\n ]*[=+\-@]/.test(text)) {
        text = `'${text}`;
      }

      if (format === "csv") {
        return `"${text.replace(/"/g, '""')}"`;
      }

      return text.replace(/[\t\r\n]+/g, " ");
    }

    const content = [
      exportHeaders.map(formatCell).join(delimiter),
      ...rows.map((row) =>
        exportHeaders.map((header) => formatCell(row[header])).join(delimiter)
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

  function viewOrder(order: Order) {
    navigate(`/orders/${encodeURIComponent(order.order_id)}`);
  }

  return (
    <AdminLayout breadcrumb="Admin / Orders">
      <div className="orders-page">
        <div className="page-heading">
          <div>
            <h1>Orders</h1>
            <p>Track customer orders and fulfillment status.</p>
          </div>
        </div>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <div className="stats">
          <div className="stat-card">
            <span>Total orders</span>
            <strong>{orders.length}</strong>
            <small>All registered orders</small>
          </div>
          <div className="stat-card">
            <span>Orders to fulfill</span>
            <strong className={ordersToFulfill ? "warning-text" : ""}>
              {ordersToFulfill}
            </strong>
            <small>Orders with confirmed status</small>
          </div>
          <div className="stat-card">
            <span>Cancelled orders</span>
            <strong className={cancelledOrders ? "cancelled-text" : ""}>
              {cancelledOrders}
            </strong>
            <small>Orders cancelled</small>
          </div>
        </div>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>All Orders</h2>
              <p>{filtered.length} orders found</p>
            </div>

            <div className="panel-tools">
              <input
                className="search"
                placeholder="Search order ID, customer ID, date or status..."
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
            <p className="empty">Loading orders...</p>
          ) : filtered.length === 0 ? (
            <p className="empty">No orders found.</p>
          ) : (
            <>
              <div className="table-scroll">
                <table className="orders-table">
                  <colgroup>
                    <col className="col-order-id" />
                    <col className="col-customer-id" />
                    <col className="col-date" />
                    <col className="col-order-status" />
                    <col className="col-order-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer ID</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => (
                      <tr key={order.order_id}>
                        <td className="order-id">{order.order_id}</td>
                        <td className="customer-id">{order.customer_id}</td>
                        <td>{formatDate(order.date)}</td>
                        <td>
                          <span className={`status ${getStatusClass(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td>
                          <div className="actions">
                            <button
                              type="button"
                              className="view-order"
                              onClick={() => viewOrder(order)}
                            >
                              View Order
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
                  {" orders"}
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
                    onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
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
      </div>
    </AdminLayout>
  );
}
