const express = require('express');
const ConversationController = require('../controllers/conversationController');
const { authenticate } = require('../middlewares/authenticate');
const joiValidate = require('../middlewares/validate.middleware');
const {
  conversationParamsSchema,
  conversationMessagesQuerySchema
} = require('../validators/conversationValidator');

const conversationRoute = express.Router();
conversationRoute.use(authenticate);

// GET /conversations/:id/messages
conversationRoute.get(
  '/:id/messages',
  joiValidate({ params: conversationParamsSchema, query: conversationMessagesQuerySchema }),
  ConversationController.listerMessages
);

module.exports = conversationRoute;
