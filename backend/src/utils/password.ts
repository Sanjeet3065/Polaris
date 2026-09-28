import argon2 from "argon2";
import { logger } from "./logger";

export class PasswordService {
  /**
   * Hashes a plaintext password using Argon2id with strong OWASP recommended parameters
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,       // 3 iterations
        parallelism: 4     // 4 threads
      });
    } catch (error) {
      logger.error(
        "Failed to hash password with Argon2id",
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error("Password hashing failed");
    }
  }

  /**
   * Securely verifies a plaintext password against an Argon2id hash with constant-time comparison
   */
  static async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch (error) {
      logger.warn("Password verification failed unexpectedly", { error: String(error) });
      return false;
    }
  }
}
