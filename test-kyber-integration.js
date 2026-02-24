import { KyberKeyGenerator, uint8ArrayToBase64 } from "./kyber/kyber-keygen.js";

async function testKeyGen() {
    console.log("🧪 Testing Kyber Key Generation...");
    try {
        const keyGen = new KyberKeyGenerator();
        const { publicKey, privateKey } = await keyGen.generateKeyPair();

        console.log("✅ Public Key (Base64):", uint8ArrayToBase64(publicKey).substring(0, 50) + "...");
        console.log("✅ Private Key (Base64):", uint8ArrayToBase64(privateKey).substring(0, 50) + "...");

        if (publicKey.length > 0 && privateKey.length > 0) {
            console.log("🎉 SUCCESS: Key generation works correctly in the Node.js environment.");
        } else {
            console.error("❌ FAILURE: Generated keys are empty.");
        }
    } catch (error) {
        console.error("❌ ERROR during key generation:", error);
    }
}

testKeyGen();
