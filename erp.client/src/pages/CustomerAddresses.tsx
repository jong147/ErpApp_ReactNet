import { useState } from "react";
import type { FormEvent } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { customerAddressApi } from "../api/customerAddresses";
import type { CustomerAddress, CustomerAddressInput } from "../api/customerAddresses";
import "./CustomerAddresses.css";

const emptyAddress: CustomerAddressInput = {
  customer_id: "",
  address_type: "billing",
  line_1: "",
  line_2: "",
  city: "",
  state: "",
  postal_code: "",
};

function normalizeAddressType(value: string): "billing" | "shipping" {
  return value.toLowerCase() === "shipping" ? "shipping" : "billing";
}

export default function CustomerAddresses() {
  const [customerIdSearch, setCustomerIdSearch] = useState("");
  const [searchedCustomerId, setSearchedCustomerId] = useState("");
  const [searchSucceeded, setSearchSucceeded] = useState(false);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressDraft, setAddressDraft] =
    useState<CustomerAddressInput>({ ...emptyAddress });
  const [editingAddress, setEditingAddress] =
    useState<CustomerAddress | null>(null);
  const [editDraft, setEditDraft] = useState<CustomerAddress | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");
  const [notice, setNotice] = useState("");

  async function searchCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const customerId = customerIdSearch.trim();

    if (!customerId) {
      setError("Enter a customer ID to search.");
      setNotice("");
      setSearchSucceeded(false);
      setSearchedCustomerId("");
      setAddresses([]);
      return;
    }

    setSearching(true);
    setError("");
    setNotice("");
    setSearchSucceeded(false);
    setSearchedCustomerId("");
    setAddresses([]);

    try {
      // The API returns 404 if the customer does not exist. An empty array
      // means the customer exists but has no addresses yet.
      const results = await customerAddressApi.getByCustomerId(customerId);
      setAddresses(results);
      setSearchedCustomerId(customerId);
      setSearchSucceeded(true);
      setAddressDraft((previous) => ({
        ...previous,
        customer_id: customerId,
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not find a customer with that ID."
      );
    } finally {
      setSearching(false);
    }
  }

  function changeAddress<K extends keyof CustomerAddressInput>(
    key: K,
    value: CustomerAddressInput[K]
  ) {
    setAddressDraft((previous) => ({ ...previous, [key]: value }));
  }

  async function refreshSearchedCustomer() {
    if (!searchSucceeded || !searchedCustomerId) return;

    setLoadingAddresses(true);
    try {
      const results = await customerAddressApi.getByCustomerId(
        searchedCustomerId
      );
      setAddresses(results);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh addresses."
      );
    } finally {
      setLoadingAddresses(false);
    }
  }

  async function createAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload: CustomerAddressInput = {
      ...addressDraft,
      customer_id: addressDraft.customer_id.trim(),
      address_type: normalizeAddressType(addressDraft.address_type),
      line_1: addressDraft.line_1.trim(),
      line_2: addressDraft.line_2.trim(),
      city: addressDraft.city.trim(),
      state: addressDraft.state.trim(),
      postal_code: addressDraft.postal_code.trim(),
    };

    try {
      await customerAddressApi.create(payload);
      setNotice("Address created successfully.");
      setAddressDraft({
        ...emptyAddress,
        customer_id: searchSucceeded ? searchedCustomerId : payload.customer_id,
      });

      // Keep the table hidden until a customer has been searched successfully.
      // Refresh only when the new address belongs to that searched customer.
      if (searchSucceeded && payload.customer_id === searchedCustomerId) {
        await refreshSearchedCustomer();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create address."
      );
    } finally {
      setSaving(false);
    }
  }

  function openEdit(address: CustomerAddress) {
    setEditingAddress(address);
    setEditDraft({ ...address });
    setEditError("");
    setError("");
    setNotice("");
  }

  function changeEdit<K extends keyof CustomerAddress>(
    key: K,
    value: CustomerAddress[K]
  ) {
    setEditDraft((previous) =>
      previous ? { ...previous, [key]: value } : previous
    );
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editDraft) return;

    setSaving(true);
    setEditError("");

    const payload: CustomerAddress = {
      ...editDraft,
      customer_id: editDraft.customer_id.trim(),
      address_type: normalizeAddressType(editDraft.address_type),
      line_1: editDraft.line_1.trim(),
      line_2: editDraft.line_2.trim(),
      city: editDraft.city.trim(),
      state: editDraft.state.trim(),
      postal_code: editDraft.postal_code.trim(),
    };

    try {
      await customerAddressApi.update(payload);
      setEditingAddress(null);
      setEditDraft(null);
      setNotice("Address updated successfully.");

      if (searchSucceeded && payload.customer_id === searchedCustomerId) {
        await refreshSearchedCustomer();
      } else if (searchSucceeded) {
        // The address was moved to another customer, so it no longer belongs
        // in the current customer's results.
        await refreshSearchedCustomer();
      }
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update address."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddress(address: CustomerAddress) {
    const confirmed = window.confirm(
      `Delete the ${address.address_type} address (${address.customer_address_id})?`
    );
    if (!confirmed) return;

    setDeletingId(address.customer_address_id);
    setError("");
    setNotice("");

    try {
      await customerAddressApi.delete(address.customer_address_id);
      setNotice("Address deleted successfully.");
      await refreshSearchedCustomer();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete address."
      );
    } finally {
      setDeletingId("");
    }
  }

  return (
    <AdminLayout breadcrumb="Admin / Customer Addresses">
      <div className="customer-addresses-page">
        <div className="page-heading">
          <div>
            <h1>Customer Addresses</h1>
            <p>Search for a customer and manage their billing and shipping addresses.</p>
          </div>
        </div>

        {error && (
          <div className="error-banner customer-addresses-alert" role="alert">
            {error}
          </div>
        )}
        {notice && !error && (
          <div className="success-banner customer-addresses-alert" role="status">
            {notice}
          </div>
        )}

        <section className="panel customer-addresses-panel">
          <div className="panel-heading">
            <div>
              <h2>Search Customer</h2>
              <p>Enter the customer ID to view their saved addresses.</p>
            </div>
          </div>
          <form className="customer-address-search" onSubmit={searchCustomer}>
            <label htmlFor="customer-address-search-id">Customer ID</label>
            <input
              id="customer-address-search-id"
              value={customerIdSearch}
              onChange={(event) => setCustomerIdSearch(event.target.value)}
              placeholder="e.g. CUS001"
              autoComplete="off"
              required
            />
            <button className="primary" type="submit" disabled={searching}>
              {searching ? "Searching..." : "Search Customer"}
            </button>
          </form>
          {searchSucceeded && (
            <p className="customer-address-search-result" role="status">
              Showing results for <strong>{searchedCustomerId}</strong>.
            </p>
          )}
        </section>

        <section className="panel customer-addresses-panel">
          <div className="panel-heading">
            <div>
              <h2>Add Address</h2>
              <p>Create a billing or shipping address for a customer.</p>
            </div>
          </div>

          <form className="customer-address-form" onSubmit={createAddress}>
            <div className="customer-address-form-grid">
              <label>
                Customer ID *
                <input
                  required
                  value={addressDraft.customer_id}
                  onChange={(event) =>
                    changeAddress("customer_id", event.target.value)
                  }
                  placeholder="e.g. CUS001"
                  maxLength={50}
                />
              </label>
              <label>
                Address type *
                <select
                  required
                  value={addressDraft.address_type}
                  onChange={(event) =>
                    changeAddress(
                      "address_type",
                      event.target.value as CustomerAddressInput["address_type"]
                    )
                  }
                >
                  <option value="billing">Billing</option>
                  <option value="shipping">Shipping</option>
                </select>
              </label>
              <label className="address-field-full">
                Address line 1 *
                <input
                  required
                  value={addressDraft.line_1}
                  onChange={(event) => changeAddress("line_1", event.target.value)}
                  maxLength={200}
                />
              </label>
              <label className="address-field-full">
                Address line 2
                <input
                  value={addressDraft.line_2}
                  onChange={(event) => changeAddress("line_2", event.target.value)}
                  maxLength={200}
                />
              </label>
              <label>
                City *
                <input
                  required
                  value={addressDraft.city}
                  onChange={(event) => changeAddress("city", event.target.value)}
                  maxLength={100}
                />
              </label>
              <label>
                State / Department *
                <input
                  required
                  value={addressDraft.state}
                  onChange={(event) => changeAddress("state", event.target.value)}
                  maxLength={100}
                />
              </label>
              <label>
                Postal code *
                <input
                  required
                  value={addressDraft.postal_code}
                  onChange={(event) =>
                    changeAddress("postal_code", event.target.value)
                  }
                  maxLength={30}
                />
              </label>
            </div>
            <div className="customer-address-form-actions">
              <button className="primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Create Address"}
              </button>
            </div>
          </form>
        </section>

        {searchSucceeded && (
          <section className="panel customer-addresses-panel">
            <div className="panel-heading">
              <div>
                <h2>Addresses for {searchedCustomerId}</h2>
                <p>
                  {addresses.length} {addresses.length === 1 ? "address" : "addresses"} found
                </p>
              </div>
            </div>

            {loadingAddresses ? (
              <p className="empty">Loading addresses...</p>
            ) : addresses.length === 0 ? (
              <p className="empty">
                No addresses found for this customer. Use the Add Address section above to create one.
              </p>
            ) : (
              <div className="table-scroll">
                <table className="customer-address-table">
                  <thead>
                    <tr>
                      <th>Address ID</th>
                      <th>Type</th>
                      <th>Address</th>
                      <th>City</th>
                      <th>State / Department</th>
                      <th>Postal Code</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addresses.map((address) => (
                      <tr key={address.customer_address_id}>
                        <td className="customer-address-id">
                          {address.customer_address_id}
                        </td>
                        <td>
                          <span
                            className={`customer-address-type ${normalizeAddressType(
                              address.address_type
                            )}`}
                          >
                            {address.address_type}
                          </span>
                        </td>
                        <td className="customer-address-main">
                          <strong>{address.line_1}</strong>
                          {address.line_2 && <small>{address.line_2}</small>}
                        </td>
                        <td>{address.city}</td>
                        <td>{address.state}</td>
                        <td>{address.postal_code}</td>
                        <td>
                          <div className="actions customer-address-actions">
                            <button
                              type="button"
                              className="edit"
                              onClick={() => openEdit(address)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="delete"
                              disabled={deletingId === address.customer_address_id}
                              onClick={() => void deleteAddress(address)}
                            >
                              {deletingId === address.customer_address_id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {editingAddress && editDraft && (
          <div
            className="modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setEditingAddress(null);
                setEditDraft(null);
              }
            }}
          >
            <section
              className="modal customer-address-edit-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="customer-address-edit-title"
            >
              <div className="modal-heading">
                <div>
                  <h2 id="customer-address-edit-title">Edit Address</h2>
                  <p>Update the address details below.</p>
                </div>
                <button
                  type="button"
                  className="close"
                  aria-label="Close"
                  onClick={() => {
                    setEditingAddress(null);
                    setEditDraft(null);
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={saveEdit}>
                <div className="customer-address-form-grid">
                  <label>
                    Address ID
                    <input value={editDraft.customer_address_id} disabled />
                  </label>
                  <label>
                    Customer ID *
                    <input
                      required
                      value={editDraft.customer_id}
                      onChange={(event) => changeEdit("customer_id", event.target.value)}
                      maxLength={50}
                    />
                  </label>
                  <label>
                    Address type *
                    <select
                      required
                      value={normalizeAddressType(editDraft.address_type)}
                      onChange={(event) =>
                        changeEdit(
                          "address_type",
                          event.target.value as CustomerAddress["address_type"]
                        )
                      }
                    >
                      <option value="billing">Billing</option>
                      <option value="shipping">Shipping</option>
                    </select>
                  </label>
                  <label className="address-field-full">
                    Address line 1 *
                    <input
                      required
                      value={editDraft.line_1}
                      onChange={(event) => changeEdit("line_1", event.target.value)}
                      maxLength={200}
                    />
                  </label>
                  <label className="address-field-full">
                    Address line 2
                    <input
                      value={editDraft.line_2}
                      onChange={(event) => changeEdit("line_2", event.target.value)}
                      maxLength={200}
                    />
                  </label>
                  <label>
                    City *
                    <input
                      required
                      value={editDraft.city}
                      onChange={(event) => changeEdit("city", event.target.value)}
                      maxLength={100}
                    />
                  </label>
                  <label>
                    State / Department *
                    <input
                      required
                      value={editDraft.state}
                      onChange={(event) => changeEdit("state", event.target.value)}
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Postal code *
                    <input
                      required
                      value={editDraft.postal_code}
                      onChange={(event) => changeEdit("postal_code", event.target.value)}
                      maxLength={30}
                    />
                  </label>
                </div>

                {editError && (
                  <div className="error-banner customer-address-edit-error" role="alert">
                    {editError}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setEditingAddress(null);
                      setEditDraft(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button className="primary" type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
