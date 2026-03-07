import { MlKem768 } from "crystals-kyber-js";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function kyberKeygen(): Promise<{ publicKey: string; privateKey: string }> {
  const kem = new MlKem768();
  const [publicKey, privateKey] = await kem.generateKeyPair();
  return {
    publicKey: toBase64(publicKey),
    privateKey: toBase64(privateKey),
  };
}

export async function kyberEncapsulate(publicKeyB64: string): Promise<{ ciphertext: string; sharedSecret: string }> {
  const kem = new MlKem768();
  const publicKey = fromBase64(publicKeyB64);
  const [ciphertext, sharedSecret] = await kem.encap(publicKey);
  return {
    ciphertext: toBase64(ciphertext),
    sharedSecret: toBase64(sharedSecret),
  };
}

export async function kyberDecapsulate(ciphertextB64: string, privateKeyB64: string): Promise<string> {
  const kem = new MlKem768();
  const ciphertext = fromBase64(ciphertextB64);
  const privateKey = fromBase64(privateKeyB64);
  const sharedSecret = await kem.decap(ciphertext, privateKey);
  return toBase64(sharedSecret);
}
