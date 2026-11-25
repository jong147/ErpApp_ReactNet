const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

export async function getHello(): Promise<{
  message: string;
  timestamp: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/test`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

// export async function getProductName(): Promise<string> {
//   const response = await fetch(`${API_BASE_URL}/test/product`);

//   if (!response.ok) {
//     throw new Error(`API request failed: ${response.status}`);
//   }

//   return response.text();
// }