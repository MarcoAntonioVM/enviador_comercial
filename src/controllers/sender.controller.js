const senderService = require('../services/sender.service');
const { successResponse } = require('../utils/response');

class SenderController {
  async getAllSenders(req, res, next) {
    try {
      const senders = await senderService.getAllSenders();
      successResponse(res, { senders }, 'Senders retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSenderById(req, res, next) {
    try {
      const { id } = req.params;
      const sender = await senderService.getSenderById(id);
      successResponse(res, { sender }, 'Sender retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createSender(req, res, next) {
    try {
      const sender = await senderService.createSender(req.body);
      successResponse(res, { sender }, 'Sender created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateSender(req, res, next) {
    try {
      const { id } = req.params;
      const sender = await senderService.updateSender(id, req.body);
      successResponse(res, { sender }, 'Sender updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteSender(req, res, next) {
    try {
      const { id } = req.params;
      const result = await senderService.deleteSender(id);
      successResponse(res, result, 'Sender deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getDefaultSender(req, res, next) {
    try {
      const sender = await senderService.getDefaultSender();
      successResponse(res, { sender }, 'Default sender retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async setDefaultSender(req, res, next) {
    try {
      const { id } = req.params;
      const sender = await senderService.setDefaultSender(id);
      successResponse(res, { sender }, 'Default sender updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async checkDailyLimit(req, res, next) {
    try {
      const { id } = req.params;
      const result = await senderService.checkDailyLimit(id);
      successResponse(res, result, 'Daily limit status retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SenderController();
