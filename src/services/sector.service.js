const { Sector, Prospect, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const { Op } = require('sequelize');

class SectorService {
  async getAllSectors(activeOnly = false) {
    const where = activeOnly ? { active: true } : {};
    
    const sectors = await Sector.findAll({
      where,
      order: [['name', 'ASC']]
    });

    return sectors;
  }

  async getSectorById(id) {
    const sector = await Sector.findByPk(id);

    if (!sector) {
      throw new AppError('Sector not found', 404);
    }

    return sector;
  }

  async createSector(data) {
    const sector = await Sector.create(data);
    return sector;
  }

  async bulkImport(sectors) {
    const results = { created: 0, updated: 0, errors: [] };

    for (const sectorData of sectors) {
      try {
        // Comparación case-insensitive compatible con MySQL (Op.iLike es solo PostgreSQL)
        const existing = await Sector.findOne({
          where: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('name')),
            Op.eq,
            (sectorData.name || '').toLowerCase()
          )
        });
        
        if (existing) {
          await existing.update(sectorData);
          results.updated++;
        } else {
          await Sector.create(sectorData);
          results.created++;
        }
      } catch (error) {
        results.errors.push({ 
          name: sectorData.name || 'Unknown', 
          error: error.message 
        });
      }
    }

    return results;
  }

  async updateSector(id, data) {
    const sector = await this.getSectorById(id);
    await sector.update(data);
    return sector;
  }

  async deleteSector(id) {
    const sector = await this.getSectorById(id);

    // Check if sector has associated prospects
    const prospectCount = await Prospect.count({ where: { sector_id: id } });
    if (prospectCount > 0) {
      throw new AppError('Cannot delete sector with associated prospects', 400);
    }

    await sector.destroy();
    return { message: 'Sector deleted successfully' };
  }

  async getSectorStats(id) {
    const sector = await this.getSectorById(id);

    const prospectCount = await Prospect.count({
      where: { sector_id: id, deleted_at: null }
    });

    const activeProspects = await Prospect.count({
      where: { sector_id: id, status: 'active', deleted_at: null }
    });

    return {
      sector,
      stats: {
        total_prospects: prospectCount,
        active_prospects: activeProspects
      }
    };
  }
}

module.exports = new SectorService();
