import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  purchaseOrderApi,
  type PurchaseOrder,
} from "../api/purchaseOrders";
import AdminLayout from "../layouts/AdminLayout";
import "./PurchaseOrders.css";

function normalizeStatus(status: string): string {
  return (status ?? "").trim().toLowerCase();
}

function getStatusLabel(status: string): string {
  const normalized = normalizeStatus(status);

  if (!normalized) return "Unknown";

  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusClass(status: string): string {
  const normalized = normalizeStatus(status);

  if (["cancelled", "canceled"].includes(normalized)) return "cancelled";
  if (["received", "delivered", "completed"].includes(normalized)) {
    return "completed";
  }
  if (["ordered", "pending", "confirmed", "to_receive"].includes(normalized)) {
    return "pending";
  }

  return "other";
}

function formatDate(value: string): string {
  if (!value) return "—";

  // Treat date-only API values as local calendar dates to avoid timezone shifts.
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

export default function PurchaseOrders() {
  const navigate = useNavigate();

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    let isMounted = true;

    async function loadPurchaseOrders() {
      setLoading(true);

      try {
        const result = await purchaseOrderApi.getAll();
        if (isMounted) {
          setPurchaseOrders(result);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load purchase orders."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadPurchaseOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPurchaseOrders = useMemo(() => {
    const term = search.toLowerCase().trim();

    return purchaseOrders
      .filter((order) =>
        [
          order.purchase_order_id,
          order.supplier_id,
          order.order_date,
          formatDate(order.order_date),
          order.status,
          getStatusLabel(order.status),
        ].some((value) => String(value ?? "").toLowerCase().includes(term))
      )
      .sort((a, b) =>
        a.purchase_order_id.localeCompare(b.purchase_order_id, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
  }, [purchaseOrders, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPurchaseOrders.length / pageSize)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(
    startIndex + pageSize,
    filteredPurchaseOrders.length
  );
  const paginatedPurchaseOrders = filteredPurchaseOrders.slice(
    startIndex,
    endIndex
  );

  const maxVisiblePages = 3;
  const startPage = Math.max(
    1,
    Math.min(safeCurrentPage - 1, totalPages - maxVisiblePages + 1)
  );
  const visiblePageNumbers = Array.from(
    { length: Math.min(maxVisiblePages, totalPages) },
    (_, index) => startPage + index
  );

  function viewPurchaseOrder(order: PurchaseOrder) {
    navigate(
      `/purchaseOrders/${encodeURIComponent(order.purchase_order_id)}`
    );
  }

  return (
    <AdminLayout breadcrumb="Admin / Purchase Orders">
      <div className="purchase-orders-page">
        <div className="purchase-orders-heading">
          <div>
            <h1>Purchase Orders</h1>
            <p>Review and track orders placed with your suppliers.</p>
          </div>
        </div>

        {error && (
          <div className="purchase-orders-error" role="alert">
            {error}
          </div>
        )}

        <section className="purchase-orders-panel">
          <div className="purchase-orders-panel-heading">
            <div>
              <h2>Purchase Order History</h2>
              <p>
                {filteredPurchaseOrders.length} purchase order
                {filteredPurchaseOrders.length === 1 ? "" : "s"} found
              </p>
            </div>

            <input
              className="purchase-orders-search"
              type="search"
              aria-label="Search purchase orders"
              placeholder="Search order ID, supplier ID, date or status..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {loading ? (
            <p className="purchase-orders-empty" role="status">
              Loading purchase orders...
            </p>
          ) : filteredPurchaseOrders.length === 0 ? (
            <p className="purchase-orders-empty">
              {search ? "No matching purchase orders found." : "No purchase orders found."}
            </p>
          ) : (
            <>
              <div className="purchase-orders-table-scroll">
                <table className="purchase-orders-table">
                  <colgroup>
                    <col className="purchase-col-order-id" />
                    <col className="purchase-col-supplier-id" />
                    <col className="purchase-col-date" />
                    <col className="purchase-col-status" />
                    <col className="purchase-col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">Order ID</th>
                      <th scope="col">Supplier ID</th>
                      <th scope="col">Order Date</th>
                      <th scope="col">Status</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPurchaseOrders.map((order) => (
                      <tr key={order.purchase_order_id}>
                        <td className="purchase-order-id">
                          {order.purchase_order_id}
                        </td>
                        <td className="purchase-supplier-id">
                          {order.supplier_id}
                        </td>
                        <td>{formatDate(order.order_date)}</td>
                        <td>
                          <span
                            className={`purchase-order-status ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="purchase-view-order"
                            onClick={() => viewPurchaseOrder(order)}
                          >
                            View Order
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="purchase-orders-pagination">
                <div className="purchase-pagination-info">
                  Showing <strong>{startIndex + 1}</strong> –{" "}
                  <strong>{endIndex}</strong> of{" "}
                  <strong>{filteredPurchaseOrders.length}</strong> purchase orders
                </div>

                <label className="purchase-page-size-control">
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

                <div className="purchase-pagination-controls">
                  <button
                    type="button"
                    className="purchase-page-button"
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
                      className={`purchase-page-number ${
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
                    className="purchase-page-button"
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
