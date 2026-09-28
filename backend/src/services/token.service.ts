import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { env } from "../config/env";
import { AccessTokenPayload, RefreshTokenPayload } from "../types/auth.types";
import { ApiError } from "../utils/apiError";
import { CryptoUtil } from "../utils/crypto";

export class TokenService {
  /**
   * Generates a short-lived signed JWT access token containing identity & role claims
   */
  generateAccessToken(user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  }): string {
    const payload: Omit<AccessTokenPayload, "iat" | "exp"> = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      type: "access",
      jti: CryptoUtil.generateRandomToken(16)
    };

    const options: SignOptions = {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      algorithm: "HS256"
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
  }

  /**
   * Verifies and decodes an access token, asserting type === 'access'
   */
  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        algorithms: ["HS256"]
      }) as AccessTokenPayload;

      if (decoded.type !== "access") {
        throw ApiError.unauthorized("Invalid token type", "INVALID_TOKEN_TYPE");
      }

      return decoded;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized("Access token has expired", "TOKEN_EXPIRED");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized("Invalid access token", "INVALID_TOKEN");
      }
      throw ApiError.unauthorized("Token verification failed", "UNAUTHORIZED");
    }
  }

  /**
   * Generates a signed JWT refresh token bound to a session identifier with a unique jti nonce
   */
  generateRefreshToken(userId: string, sessionId: string): string {
    const payload: Omit<RefreshTokenPayload, "iat" | "exp"> = {
      sub: userId,
      sessionId,
      type: "refresh",
      jti: CryptoUtil.generateRandomToken(16)
    };

    const options: SignOptions = {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      algorithm: "HS256"
    };

    return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
  }

  /**
   * Verifies and decodes a refresh token, asserting type === 'refresh'
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
        algorithms: ["HS256"]
      }) as RefreshTokenPayload;

      if (decoded.type !== "refresh") {
        throw ApiError.unauthorized("Invalid refresh token type", "INVALID_REFRESH_TOKEN");
      }

      return decoded;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized("Refresh token has expired", "REFRESH_TOKEN_EXPIRED");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized("Invalid refresh token signature", "INVALID_REFRESH_TOKEN");
      }
      throw ApiError.unauthorized("Refresh token verification failed", "UNAUTHORIZED");
    }
  }

  /**
   * Calculates refresh expiration Date from duration string (e.g. '7d', '14d', '24h')
   */
  calculateRefreshExpiry(durationString = env.JWT_REFRESH_EXPIRES_IN): Date {
    const now = Date.now();
    let ms = 7 * 24 * 60 * 60 * 1000; // 7 days fallback

    const match = durationString.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      switch (unit) {
        case "s":
          ms = value * 1000;
          break;
        case "m":
          ms = value * 60 * 1000;
          break;
        case "h":
          ms = value * 60 * 60 * 1000;
          break;
        case "d":
          ms = value * 24 * 60 * 60 * 1000;
          break;
      }
    }

    return new Date(now + ms);
  }
}

export const tokenService = new TokenService();
