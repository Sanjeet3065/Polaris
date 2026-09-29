import { Router } from "express";
import { assistantController } from "../controllers/assistant.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateRequest } from "../middleware/validateRequest";
import {
  assistantChatBodySchema,
  conversationIdParamSchema,
  assistantSuggestionsQuerySchema
} from "../validators/assistant.validator";
import { UserRole } from "@prisma/client";
import rateLimit from "express-rate-limit";
import { ApiResponse } from "../utils/apiResponse";

const router = Router();

// Rate limiting for AI assistant endpoints
const assistantRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === "test" ? 1000 : 60, // 60 requests per min in prod, 1000 in test
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      "TOO_MANY_REQUESTS",
      "Assistant rate limit exceeded. Please wait a moment before sending another query.",
      429
    );
  }
});

// Protect all assistant endpoints with JWT authentication & RBAC
router.use(authenticate);
router.use(assistantRateLimiter);

// POST /api/v1/assistant/chat
router.post(
  "/chat",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ body: assistantChatBodySchema }),
  assistantController.chat
);

// POST /api/v1/assistant/chat/stream
router.post(
  "/chat/stream",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ body: assistantChatBodySchema }),
  assistantController.chatStream
);

// GET /api/v1/assistant/conversations
router.get(
  "/conversations",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  assistantController.getConversations
);

// GET /api/v1/assistant/conversations/:id
router.get(
  "/conversations/:id",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ params: conversationIdParamSchema }),
  assistantController.getConversation
);

// DELETE /api/v1/assistant/conversations/:id
router.delete(
  "/conversations/:id",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ params: conversationIdParamSchema }),
  assistantController.deleteConversation
);

// GET /api/v1/assistant/suggestions
router.get(
  "/suggestions",
  authorize(UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER),
  validateRequest({ query: assistantSuggestionsQuerySchema }),
  assistantController.getSuggestions
);

export default router;
