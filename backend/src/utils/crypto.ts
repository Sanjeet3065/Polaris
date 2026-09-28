import crypto from "crypto";

export class CryptoUtil {
  /**
   * Generates a deterministic SHA-256 hash of a token string (used for storing refresh tokens in DB)
   */
  static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Generates a cryptographically strong random hex token
   */
  static generateRandomToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString("hex");
  }
}
