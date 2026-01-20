const { Sector, Prospect } = require('../models');
const { AppError } = require('../utils/errors');

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
