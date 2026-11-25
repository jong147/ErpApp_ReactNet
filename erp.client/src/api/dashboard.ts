const API_URL = "https://localhost:7278/api/dashboard";

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

export const dashboardApi = {
  getPurchased: () => request<number>("/purchased"),

  getRevenue: () => request<number>("/revenue"),

  getCustomers: () => request<number>("/customers"),

  getLowStockProducts: () => request<number>("/low_stock"),

  getPendingOrders: () => request<number>("/pending_orders"),

  getPendingPO: () => request<number>("/pending_po"),
};