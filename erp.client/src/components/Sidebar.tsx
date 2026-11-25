import { NavLink } from "react-router";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">◈ PC STORE</div>

      <p className="nav-label">WORKSPACE</p>

      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `nav-item ${isActive ? "active" : ""}`
        }
      >
        ▣ Dashboard
      </NavLink>

      <NavLink
        to="/products"
        className={({ isActive }) =>
          `nav-item ${isActive ? "active" : ""}`
        }
      >
        ▣ Products
      </NavLink>

      <NavLink
        to="/warehouses"
        className={({ isActive }) =>
          `nav-item ${isActive ? "active" : ""}`
        }
      >
        ▣ Warehouses
      </NavLink>

      <NavLink
        to="/suppliers"
        className={({ isActive }) =>
          `nav-item ${isActive ? "active" : ""}`
        }
      >
        ▣ Suppliers
      </NavLink>

      <NavLink
        to="/customers"
        className={({ isActive }) =>
          `nav-item ${isActive ? "active" : ""}`
        }
      >
        ▣ Customers
      </NavLink>

      <NavLink
        to="/sales"
        className={({ isActive }) =>
          `nav-item ${isActive ? "active" : ""}`
        }
      >
        ▣ Sales
      </NavLink>

      <NavLink
        to="/purchases"
        className={({ isActive }) =>
          `nav-item ${isActive ? "active" : ""}`
        }
      >
        ▣ Purchases
      </NavLink>

      <div className="sidebar-bottom">
        Business Management
      </div>
    </aside>
  );
}