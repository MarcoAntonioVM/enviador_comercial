const express = require('express');
const router = express.Router();
const webhooksController = require('../controllers/webhooks.controller');
const { verifyBrevoWebhook } = require('../middlewares/brevoWebhook.middleware');

// Webhooks externos: sin authenticate. Brevo llama a esta URL.
// Si BREVO_WEBHOOK_SECRET está en .env, se valida la firma x-brevo-signature.
router.post('/brevo', verifyBrevoWebhook, webhooksController.brevo);

module.exports = router;
