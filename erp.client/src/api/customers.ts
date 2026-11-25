export type CustomerType = "individual" | "company";

export interface Customer {
  customer_id: string;
  customer_type: CustomerType;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
  tax_id: string;
}

const API_URL = "https://localhost:7278/api/customers";

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

export const customerApi = {
  getAll: () => request<Customer[]>(),
// export name>
  getNameById: (id: string) =>
    request<string>(`/${encodeURIComponent(id)}/name`),

  create: (customer: Customer) =>
    request<Customer>("", {
      method: "POST",
      body: JSON.stringify(customer),
    }),

  update: (customer: Customer) =>
    request<void>(`/${encodeURIComponent(customer.customer_id)}`, {
      method: "PUT",
      body: JSON.stringify(customer),
    }),

  delete: (id: string) =>
    request<void>(`/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};