import { encryptAES_GCM, decryptAES_GCM } from "../lib/crypto/aes";
import { generateHMAC, verifyHMAC } from "../lib/crypto/hmac";

describe("Resilio-Health Cryptographic Tests", () => {
  const key = "SessionSecret2026!";
  const payload = JSON.stringify({ patientId: "P-101", diagnosis: "Hipertensi" });

  test("1. Positif: Enkripsi & dekripsi AES-256-GCM valid", async () => {
    const { ciphertext, ivHex } = await encryptAES_GCM(payload, key);
    const result = await decryptAES_GCM(ciphertext, ivHex, key);
    expect(result).toBe(payload);
  });

  test("2. Positif: Validasi HMAC-SHA256 data utuh", async () => {
    const hmac = await generateHMAC(payload, key);
    expect(await verifyHMAC(payload, hmac, key)).toBe(true);
  });

  test("3. Negatif: Manipulasi data merusak HMAC", async () => {
    const hmac = await generateHMAC(payload, key);
    expect(await verifyHMAC(payload + "tampered", hmac, key)).toBe(false);
  });

  test("4. Batas: IV salah menggagalkan dekripsi", async () => {
    const { ciphertext } = await encryptAES_GCM(payload, key);
    await expect(decryptAES_GCM(ciphertext, "000000000000000000000000", key)).rejects.toThrow();
  });
});
