
import { Routes, Route, Navigate, BrowserRouter } from "react-router";

import Products from "./pages/Products";
import Customers from "./pages/Customers";
import CustomerAddresses from "./pages/CustomerAddresses";
import Sales from "./pages/Sales";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Warehouses from "./pages/Warehouses";
import WarehouseProducts from "./pages/WarehouseProducts";
import Suppliers from "./pages/Suppliers";
import SupplierProducts from "./pages/SupplierProducts";
import PurchaseOrders from "./pages/PurchaseOrders";
import PurchaseOrderDetails from "./pages/PurchaseOrderDetails";
import Purchases from "./pages/Purchases";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return ( <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products/*" element={<Products />} />
        <Route path="/warehouses/*" element={<Warehouses />} />
        <Route path="/warehouseProducts/*" element={<WarehouseProducts />} />
        <Route path="/customers/*" element={<Customers />} />
        <Route path="/customerAddresses/*" element={<CustomerAddresses />} />
        <Route path="/sales/*" element={<Sales />} />
        <Route path="/orders/*" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
        <Route path="/suppliers/*" element={<Suppliers />} />
        <Route path="/supplierProducts/*" element={<SupplierProducts />} />
        <Route path="/purchaseOrders/*" element={<PurchaseOrders />} /> 
        <Route path="/purchaseOrders/:id" element={<PurchaseOrderDetails />} />
        <Route path="/purchases/*" element={<Purchases />} />

        <Route
          path="*"
          element={<Navigate to="/products" replace />}
        />
      </Routes>
    </BrowserRouter> );
}