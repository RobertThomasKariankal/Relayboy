interface KyberKeygenResponse {
  publicKey: string;
  privateKey: string;
}

interface KyberEncapsulateResponse {
  ciphertext: string;
  sharedSecret: string;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Kyber API request failed");
  }
  return data as T;
}

export async function kyberKeygen(): Promise<{ publicKey: string; privateKey: string }> {
  return postJSON<KyberKeygenResponse>("/api/kyber/keygen", {});
}

export async function kyberEncapsulate(publicKeyB64: string): Promise<{ ciphertext: string; sharedSecret: string }> {
  return postJSON<KyberEncapsulateResponse>("/api/kyber/encapsulate", { publicKey: publicKeyB64 });
}

export async function kyberDecapsulate(ciphertextB64: string, privateKeyB64: string): Promise<string> {
  const data = await postJSON<{ sharedSecret: string }>("/api/kyber/decapsulate", {
    ciphertext: ciphertextB64,
    privateKey: privateKeyB64,
  });
  return data.sharedSecret;
}
