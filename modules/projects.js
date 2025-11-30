require('dotenv').config();
require('pg');

const { Sequelize, Op } = require('sequelize');

// Connect to Neon Postgres
const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    dialect: 'postgres',
    dialectOptions: {
      ssl: { rejectUnauthorized: false }
    },
    logging: false
  }
);

// Define Models
const Sector = sequelize.define('Sector', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  sector_name: Sequelize.STRING
}, { createdAt: false, updatedAt: false });

const Project = sequelize.define('Project', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  title: Sequelize.STRING,
  feature_img_url: Sequelize.STRING,
  summary_short: Sequelize.TEXT,
  intro_short: Sequelize.TEXT,
  impact: Sequelize.TEXT,
  original_source_url: Sequelize.STRING
}, { createdAt: false, updatedAt: false });

Project.belongsTo(Sector, { foreignKey: 'sector_id' });

// === All Functions ===
function initialize() {
  return sequelize.sync();
}

function getAllProjects() {
  return Project.findAll({
    include: [Sector],
    order: [['id', 'ASC']]
  });
}

function getProjectById(id) {
  return Project.findAll({
    include: [Sector],
    where: { id }
  }).then(data => {
    if (data.length === 0) throw new Error("Project not found");
    return data[0];
  });
}

function getProjectsBySector(sector) {
  return Project.findAll({
    include: [Sector],
    where: { '$Sector.sector_name$': { [Op.iLike]: `%${sector}%` } }
  });
}

function getAllSectors() {
  return Sector.findAll({ order: [['sector_name', 'ASC']] });
}

function addProject(projectData) {
  return Project.create(projectData)
    .catch(err => {
      throw new Error(err.errors?.[0]?.message || "Failed to add project");
    });
}

function updateProject(id, projectData) {
  return Project.update(projectData, { where: { id } })
    .then(result => {
      if (result[0] === 0) throw new Error("Project not found");
    });
}

function deleteProject(id) {
  return Project.destroy({ where: { id } });
}

// Export everything
module.exports = {
  initialize,
  getAllProjects,
  getProjectById,
  getProjectsBySector,
  getAllSectors,
  addProject,
  updateProject,
  deleteProject
};
