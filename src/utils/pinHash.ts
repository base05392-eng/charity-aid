import * as Crypto from 'expo-crypto';

export async function hashPin(pin: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `charity_aid_salt_2025:${pin}`
  );
  return digest;
}
