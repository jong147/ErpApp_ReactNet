export interface Warehouse {
  warehouse_id: string;
  name: string;
  address: string;
}

const API_URL = "https://localhost:7278/api/warehouses";

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

export const warehouseApi = {
  // READ: Get all warehouses
  getAll: () => request<Warehouse[]>(),

  // READ: Get warehouse by ID
  getById: (id: string) =>
    request<Warehouse>(`/${encodeURIComponent(id)}`),

  // CREATE
  create: (warehouse: Warehouse) =>
    request<Warehouse>("", {
      method: "POST",
      body: JSON.stringify(warehouse),
    }),

  // UPDATE
  update: (warehouse: Warehouse) =>
    request<void>(`/${encodeURIComponent(warehouse.warehouse_id)}`, {
      method: "PUT",
      body: JSON.stringify(warehouse),
    }),

  // DELETE
  delete: (id: string) =>
    request<void>(`/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};