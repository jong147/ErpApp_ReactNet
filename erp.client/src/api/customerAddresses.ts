export type AddressType = "billing" | "shipping";

export interface CustomerAddress {
  customer_address_id: string;
  customer_id: string;
  address_type: AddressType;
  line_1: string;
  line_2: string;
  city: string;
  state: string;
  postal_code: string;
}

// Used when creating an address because the server generates its ID.
export type CustomerAddressInput = Omit<
  CustomerAddress,
  "customer_address_id"
>;

const API_URL = "https://localhost:7278/api/CustomerAddresses";

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

export const customerAddressApi = {
  // Get all addresses belonging to a customer
  getByCustomerId: (customerId: string) =>
    request<CustomerAddress[]>(
      `/customer/${encodeURIComponent(customerId)}`
    ),

  // Create a new address
  create: (address: CustomerAddressInput) =>
    request<CustomerAddress>("", {
      method: "POST",
      body: JSON.stringify(address),
    }),

  // Update an existing address
  update: (address: CustomerAddress) =>
    request<void>(
      `/${encodeURIComponent(address.customer_address_id)}`,
      {
        method: "PUT",
        body: JSON.stringify(address),
      }
    ),

  // Delete an address
  delete: (addressId: string) =>
    request<void>(
      `/${encodeURIComponent(addressId)}`,
      {
        method: "DELETE",
      }
    ),
};