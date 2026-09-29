import { Request, Response, NextFunction } from "express";
import { assistantService } from "../services/assistant/assistant.service";
import { conversationService } from "../services/assistant/conversation.service";
import { ApiResponse } from "../utils/apiResponse";

export class AssistantController {
  /**
   * POST /api/v1/assistant/chat
   * Standard synchronous chat message
   */
  public chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const response = await assistantService.chat(req.body, {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
      });
      ApiResponse.success(res, response, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/assistant/chat/stream
   * Server-Sent Events (SSE) streaming chat message
   */
  public chatStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;

      // Setup Server-Sent Events headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const generator = assistantService.chatStream(req.body, {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
      });

      for await (const chunk of generator) {
        res.write(`event: ${chunk.event}\ndata: ${JSON.stringify(chunk.data)}\n\n`);
      }

      res.end();
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/assistant/conversations
   */
  public getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const conversations = conversationService.listConversations(user.id);
      ApiResponse.success(res, conversations, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/assistant/conversations/:id
   */
  public getConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const conversation = conversationService.getConversation(req.params.id as string, user.id);
      ApiResponse.success(res, conversation, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/assistant/conversations/:id
   */
  public deleteConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      conversationService.deleteConversation(req.params.id as string, user.id);
      ApiResponse.success(res, { deleted: true, id: req.params.id }, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/assistant/suggestions
   */
  public getSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const station = (req.query.station as string) || "MAITRI";
      const suggestions = assistantService.getSuggestions(station, user.role);
      ApiResponse.success(res, { station, suggestions }, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const assistantController = new AssistantController();
