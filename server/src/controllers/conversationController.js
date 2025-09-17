// src/controllers/conversationController.js
import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";

export default {
  async getMessages(req, res) {
    try {
      const { id } = req.params;
      const messages = await Message.findAll({
        where: { conversation_id: id },
        order: [["created_at", "ASC"]],
      });
      res.json(messages);
    } catch (err) {
      console.error("[ConversationController] getMessages:", err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  },

  async createMessage({ conversationId, senderUserId, senderGuestId, text }) {
      console.log("[createMessage] conversationId=", conversationId, {
    senderUserId,
    senderGuestId,
    text,
  });
    // ✅ Create message only, not conversation
    return await Message.create({
      conversation_id: conversationId,
      sender_user_id: senderUserId || null,
      sender_guest_id: senderGuestId || null,
      message: text,
    });
  },

  async getOrCreateConversation(req, res) {
    try {
      const { contributionId } = req.params;
      let convo = await Conversation.findOne({
        where: { contribution_id: contributionId },
      });

      if (!convo) {
        convo = await Conversation.create({
          contribution_id: contributionId,
          status: "open",
        });
      }

      res.json(convo);
    } catch (err) {
      console.error("[ConversationController] getOrCreateConversation:", err);
      res.status(500).json({ error: "Failed to get or create conversation" });
    }
  },
};
