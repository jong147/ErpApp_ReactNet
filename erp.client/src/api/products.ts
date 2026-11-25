export interface Product {
  product_id: string;
  name: string;
  description: string;
  stock: number;
  minimum_stock: number;
  price: number;
  img: string;
}

const API_URL = "https://localhost:7278/api/products";

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

export const productApi = {
  getAll: () => request<Product[]>(),

  getBySupplier: (supplierId: string) =>
    request<Product[]>(`/supplier/${encodeURIComponent(supplierId)}`),

  create: (product: Product) =>
    request<Product>("", {
      method: "POST",
      body: JSON.stringify(product),
    }),

  update: (product: Product) =>
    request<void>(`/${encodeURIComponent(product.product_id)}`, {
      method: "PUT",
      body: JSON.stringify(product),
    }),

  delete: (id: string) =>
    request<void>(`/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};