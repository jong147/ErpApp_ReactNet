export interface Supplier {
  supplier_id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_id_number: string;
}

const API_URL = "https://localhost:7278/api/suppliers";

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

export const supplierApi = {
  // READ: Get all suppliers
  getAll: () => request<Supplier[]>(),

  // CREATE
  create: (supplier: Supplier) =>
    request<Supplier>("", {
      method: "POST",
      body: JSON.stringify(supplier),
    }),

  // UPDATE
  update: (supplier: Supplier) =>
    request<void>(`/${encodeURIComponent(supplier.supplier_id)}`, {
      method: "PUT",
      body: JSON.stringify(supplier),
    }),

  // DELETE
  delete: (id: string) =>
    request<void>(`/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};