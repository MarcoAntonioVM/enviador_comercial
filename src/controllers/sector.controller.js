const sectorService = require('../services/sector.service');
const { successResponse } = require('../utils/response');

class SectorController {
  async getAllSectors(req, res, next) {
    try {
      const activeOnly = req.query.active === 'true';
      const sectors = await sectorService.getAllSectors(activeOnly);
      successResponse(res, { sectors }, 'Sectors retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSectorById(req, res, next) {
    try {
      const { id } = req.params;
      const sector = await sectorService.getSectorById(id);
      successResponse(res, { sector }, 'Sector retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createSector(req, res, next) {
    try {
      const sector = await sectorService.createSector(req.body);
      successResponse(res, { sector }, 'Sector created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateSector(req, res, next) {
    try {
      const { id } = req.params;
      const sector = await sectorService.updateSector(id, req.body);
      successResponse(res, { sector }, 'Sector updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteSector(req, res, next) {
    try {
      const { id } = req.params;
      const result = await sectorService.deleteSector(id);
      successResponse(res, result, 'Sector deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSectorStats(req, res, next) {
    try {
      const { id } = req.params;
      const result = await sectorService.getSectorStats(id);
      successResponse(res, result, 'Sector statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SectorController();
