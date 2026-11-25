const API_URL = "https://localhost:7278/api/orders";

export interface Order {
  order_id: string;
  customer_id: string;
  date: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
}

export interface OrderProduct {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  img: string;
}

export interface CreateOrderRequest {
  customer_id: string;
  date: string;
  notes: string;
  products: Record<string, number>;
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

export const orderApi = {
  getAll: () => request<Order[]>(),

  getById: (id: string) =>
    request<Order>(`/${encodeURIComponent(id)}`),

  getProducts: (id: string) =>
    request<OrderProduct[]>(`/${encodeURIComponent(id)}/products`),

  create: (order: CreateOrderRequest) =>
    request<Order>("", {
      method: "POST",
      body: JSON.stringify(order),
    }),

  update: (order: Order) =>
    request<void>(`/${encodeURIComponent(order.order_id)}`, {
      method: "PUT",
      body: JSON.stringify(order),
    }),
};