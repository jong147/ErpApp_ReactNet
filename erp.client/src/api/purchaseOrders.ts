
const API_URL = "https://localhost:7278/api/purchaseOrders";

export interface PurchaseOrder {
  purchase_order_id: string;
  supplier_id: string;
  order_date: string;
  delivery_date: string | null;
  status: string;
  subtotal: number;
  tax: number;
  delivery_cost: number;
  total: number;
}

export interface PurchaseOrderProduct {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  img: string;
}

export interface CreatePurchaseOrderRequest {
  supplier_id: string;
  order_date: string;
  delivery_cost: number;
  products: Record<string, number>;
}

export interface UpdatePurchaseOrderRequest {
  delivery_date: string | null;
  status: string;
}

async function request<T>(
  path = "",
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const purchaseOrderApi = {
  // Get all purchase orders
  getAll: () =>
    request<PurchaseOrder[]>(),

    getById: (id: string) =>
    request<PurchaseOrder>(`/${encodeURIComponent(id)}`),

  // Get products belonging to a purchase order
  getProducts: (id: string) =>
    request<PurchaseOrderProduct[]>(
      `/${encodeURIComponent(id)}/products`
    ),

  // Create a purchase order
  create: (order: CreatePurchaseOrderRequest) =>
    request<PurchaseOrder>("", {
      method: "POST",
      body: JSON.stringify(order),
    }),

  // Update delivery date and status
  update: (
    id: string,
    order: UpdatePurchaseOrderRequest
  ) =>
    request<void>(`/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(order),
    }),
};
