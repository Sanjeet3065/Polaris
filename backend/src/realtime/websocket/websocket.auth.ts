import http from "http";
import url from "url";
import { tokenService } from "../../services/token.service";
import { userRepository } from "../../repositories/user.repository";
import { AuthenticatedUserContext } from "../events/realtime.types";
import { logger } from "../../utils/logger";

export interface WebSocketAuthResult {
  authenticated: boolean;
  user?: AuthenticatedUserContext;
  statusCode?: number;
  reason?: string;
  selectedSubprotocol?: string;
}

export class WebSocketAuthService {
  /**
   * Authenticates an incoming WebSocket handshake request
   * Reuses Phase 3 JWT infrastructure and verifies live user state in PostgreSQL.
   */
  public async authenticateHandshake(
    req: http.IncomingMessage
  ): Promise<WebSocketAuthResult> {
    try {
      let rawToken: string | null = null;
      let selectedSubprotocol: string | undefined;

      // 1. Check Sec-WebSocket-Protocol header (Preferred standard for browser WebSockets)
      // Browsers can pass protocols: ['polaris-auth', '<token>']
      const protocolsHeader = req.headers["sec-websocket-protocol"];
      if (protocolsHeader) {
        const protocols = Array.isArray(protocolsHeader)
          ? protocolsHeader
          : protocolsHeader.split(",").map((s) => s.trim());

        const authIdx = protocols.indexOf("polaris-auth");
        if (authIdx !== -1 && protocols.length > authIdx + 1) {
          rawToken = protocols[authIdx + 1];
          selectedSubprotocol = "polaris-auth";
        } else if (protocols[0]?.startsWith("polaris-auth.")) {
          rawToken = protocols[0].slice("polaris-auth.".length);
          selectedSubprotocol = protocols[0];
        }
      }

      // 2. Check URL Query Parameters: ?token=<jwt>
      if (!rawToken && req.url) {
        const parsed = url.parse(req.url, true);
        if (typeof parsed.query.token === "string" && parsed.query.token.length > 0) {
          rawToken = parsed.query.token;
        }
      }

      // 3. Check Authorization header: Bearer <jwt>
      if (!rawToken && req.headers.authorization) {
        const parts = req.headers.authorization.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
          rawToken = parts[1];
        }
      }

      // If token missing, reject connection
      if (!rawToken) {
        logger.warn("WEBSOCKET_AUTH_FAILED: Connection rejected - missing authentication token", {
          ip: req.socket.remoteAddress
        });
        return {
          authenticated: false,
          statusCode: 401,
          reason: "MISSING_TOKEN"
        };
      }

      // Verify JWT signature, expiration, and algorithm
      let decoded;
      try {
        decoded = tokenService.verifyAccessToken(rawToken);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Token verification failed";
        logger.warn("WEBSOCKET_AUTH_FAILED: Connection rejected - invalid or expired token", {
          error: message,
          ip: req.socket.remoteAddress
        });
        return {
          authenticated: false,
          statusCode: 401,
          reason: "INVALID_OR_EXPIRED_TOKEN"
        };
      }

      // Verify live user existence and active status in PostgreSQL
      const user = await userRepository.findById(decoded.sub);
      if (!user) {
        logger.warn("WEBSOCKET_AUTH_FAILED: Connection rejected - user not found in database", {
          userId: decoded.sub
        });
        return {
          authenticated: false,
          statusCode: 401,
          reason: "USER_NOT_FOUND"
        };
      }

      if (!user.isActive) {
        logger.warn("WEBSOCKET_AUTH_FAILED: Connection rejected - account deactivated", {
          userId: user.id
        });
        return {
          authenticated: false,
          statusCode: 403,
          reason: "ACCOUNT_DEACTIVATED"
        };
      }

      logger.info("WEBSOCKET_AUTH_SUCCESS: Client authenticated successfully", {
        userId: user.id,
        role: user.role
      });

      return {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive
        },
        selectedSubprotocol
      };
    } catch (error) {
      logger.error("WEBSOCKET_AUTH_ERROR: Unexpected error during WebSocket handshake auth", error as Error);
      return {
        authenticated: false,
        statusCode: 500,
        reason: "INTERNAL_AUTH_ERROR"
      };
    }
  }
}

export const webSocketAuthService = new WebSocketAuthService();
