
import { useCallback, useEffect, useState } from "react";
import { dashboardApi } from "../api/dashboard";
import AdminLayout from "../layouts/AdminLayout";
import "./Dashboard.css";

interface DashboardStats {
  purchased: number;
  revenue: number;
  customers: number;
  lowStock: number;
  pendingOrders: number;
  pendingPO: number;
}

const initialStats: DashboardStats = {
  purchased: 0,
  revenue: 0,
  customers: 0,
  lowStock: 0,
  pendingOrders: 0,
  pendingPO: 0,
};

function money(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function number(value: number): string {
  return value.toLocaleString("en-US");
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [
        purchased,
        revenue,
        customers,
        lowStock,
        pendingOrders,
        pendingPO,
      ] = await Promise.all([
        dashboardApi.getPurchased(),
        dashboardApi.getRevenue(),
        dashboardApi.getCustomers(),
        dashboardApi.getLowStockProducts(),
        dashboardApi.getPendingOrders(),
        dashboardApi.getPendingPO(),
      ]);

      setStats({
        purchased,
        revenue,
        customers,
        lowStock,
        pendingOrders,
        pendingPO,
      });

      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const cards = [
    {
      title: "Total Purchased",
      value: money(stats.purchased),
      description: "Total purchase orders",
      icon: "↓",
      color: "purple",
      footer: "Inventory investment",
    },
    {
      title: "Total Revenue",
      value: money(stats.revenue),
      description: "Total sales generated",
      icon: "$",
      color: "blue",
      footer: "Sales performance",
    },
    {
      title: "Total Customers",
      value: number(stats.customers),
      description: "Registered customers",
      icon: "♙",
      color: "green",
      footer: "Customer base",
    },
    {
      title: "Low Stock Products",
      value: number(stats.lowStock),
      description: "Products needing attention",
      icon: "!",
      color: "orange",
      footer: "Inventory alert",
      alert: stats.lowStock > 0,
    },
    {
      title: "Orders to Fulfill",
      value: number(stats.pendingOrders),
      description: "Confirmed customer orders",
      icon: "▤",
      color: "cyan",
      footer: "Awaiting fulfillment",
      alert: stats.pendingOrders > 0,
    },
    {
      title: "Purchase Orders Pending",
      value: number(stats.pendingPO),
      description: "Orders awaiting delivery",
      icon: "◷",
      color: "pink",
      footer: "Supplier operations",
      alert: stats.pendingPO > 0,
    },
  ];

  const operationalItems = [
    {
      title: "Low stock products",
      description: "Products at or below minimum stock",
      value: stats.lowStock,
      color: "orange",
      icon: "!",
    },
    {
      title: "Orders to fulfill",
      description: "Confirmed orders awaiting processing",
      value: stats.pendingOrders,
      color: "blue",
      icon: "▤",
    },
    {
      title: "Purchase orders pending",
      description: "Purchase orders currently ordered",
      value: stats.pendingPO,
      color: "purple",
      icon: "◷",
    },
  ];

  return (
    <AdminLayout breadcrumb="Admin / Dashboard">
      <main className="dashboard-page">

        {/* Page heading */}
        <header className="dashboard-heading">
          <div>
            <div className="dashboard-eyebrow">
              <span className="dashboard-eyebrow-dot" />
              OVERVIEW
            </div>
            <h1>Dashboard</h1>
            <p>
              Welcome back! Here's what's happening with your business.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-refresh"
            onClick={() => void loadDashboard(true)}
            disabled={loading || refreshing}
          >
            <span className={refreshing ? "refresh-spinning" : ""}>
              ↻
            </span>
            {refreshing ? "Refreshing..." : "Refresh data"}
          </button>
        </header>

        {/* Error */}
        {error && (
          <div className="dashboard-error" role="alert">
            <span>!</span>
            <div>
              <strong>Unable to load dashboard</strong>
              <p>{error}</p>
            </div>
            <button onClick={() => void loadDashboard(true)}>
              Try again
            </button>
          </div>
        )}

        {/* KPI section */}
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Business Overview</h2>
              <p>Your key business metrics at a glance.</p>
            </div>
            <span className="dashboard-live-label">
              <span />
              Live data
            </span>
          </div>

          <div className="dashboard-stats-grid">
            {cards.map((card) => (
              <article
                className={`dashboard-stat-card ${card.color}`}
                key={card.title}
              >
                <div className="dashboard-stat-top">
                  <div className={`dashboard-stat-icon ${card.color}`}>
                    {card.icon}
                  </div>

                  {card.alert && (
                    <span className="dashboard-stat-alert">
                      Attention
                    </span>
                  )}
                </div>

                <div className="dashboard-stat-content">
                  <span className="dashboard-stat-title">
                    {card.title}
                  </span>

                  <div className="dashboard-stat-value">
                    {loading ? (
                      <span className="dashboard-skeleton" />
                    ) : (
                      card.value
                    )}
                  </div>

                  <span className="dashboard-stat-description">
                    {card.description}
                  </span>
                </div>

                <div className="dashboard-stat-footer">
                  <span className={`dashboard-footer-dot ${card.color}`} />
                  {card.footer}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Financial overview */}
        <section className="dashboard-financial-grid">
          <article className="dashboard-financial-card revenue-card">
            <div className="dashboard-financial-top">
              <div>
                <span className="dashboard-card-label">
                  TOTAL REVENUE
                </span>
                <h2>Sales Revenue</h2>
              </div>
              <div className="dashboard-financial-icon revenue-icon">
                $
              </div>
            </div>

            <div className="dashboard-financial-amount">
              {loading ? (
                <span className="dashboard-skeleton" />
              ) : (
                money(stats.revenue)
              )}
            </div>

            <p className="dashboard-financial-description">
              Total value of all non-cancelled customer orders.
            </p>

            <div className="dashboard-financial-bottom">
              <span>Revenue generated</span>
              <span className="dashboard-financial-tag">
                Sales
              </span>
            </div>
          </article>

          <article className="dashboard-financial-card purchased-card">
            <div className="dashboard-financial-top">
              <div>
                <span className="dashboard-card-label">
                  TOTAL PURCHASED
                </span>
                <h2>Purchase Investment</h2>
              </div>
              <div className="dashboard-financial-icon purchased-icon">
                ↓
              </div>
            </div>

            <div className="dashboard-financial-amount">
              {loading ? (
                <span className="dashboard-skeleton" />
              ) : (
                money(stats.purchased)
              )}
            </div>

            <p className="dashboard-financial-description">
              Total value of all non-cancelled purchase orders.
            </p>

            <div className="dashboard-financial-bottom">
              <span>Purchasing expenditure</span>
              <span className="dashboard-financial-tag">
                Purchasing
              </span>
            </div>
          </article>
        </section>

        {/* Operations */}
        <section className="dashboard-operations">
          <div className="dashboard-section-heading">
            <div>
              <h2>Operational Overview</h2>
              <p>Items that may require your attention.</p>
            </div>
            <span className="dashboard-operations-count">
              {loading
                ? "..."
                : `${stats.lowStock + stats.pendingOrders + stats.pendingPO} items`}
            </span>
          </div>

          <div className="dashboard-operations-list">
            {operationalItems.map((item) => (
              <article
                className="dashboard-operation-item"
                key={item.title}
              >
                <div className={`dashboard-operation-icon ${item.color}`}>
                  {item.icon}
                </div>

                <div className="dashboard-operation-details">
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </div>

                <div className="dashboard-operation-status">
                  {loading ? (
                    <span className="dashboard-skeleton" />
                  ) : (
                    <span className={`dashboard-operation-number ${item.color}`}>
                      {number(item.value)}
                    </span>
                  )}
                  <span className="dashboard-operation-caption">
                    {item.value === 1 ? "item" : "items"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="dashboard-footer">
          <span>Business Management Dashboard</span>
          <span>All amounts displayed in USD</span>
        </footer>

      </main>
    </AdminLayout>
  );
}
