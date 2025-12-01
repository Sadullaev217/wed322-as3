require('dotenv').config();
const { Sequelize, Op } = require('sequelize');

// Use DATABASE_URL (Vercel + Neon standard) — THIS IS THE KEY FIX
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false   // Required for Neon on Vercel
    }
  }
});

// Define Models
const Sector = sequelize.define('Sector', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  sector_name: Sequelize.STRING
}, { createdAt: false, updatedAt: false, freezeTableName: true });

const Project = sequelize.define('Project', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  title: Sequelize.STRING,
  feature_img_url: Sequelize.STRING,
  summary_short: Sequelize.TEXT,
  intro_short: Sequelize.TEXT,
  impact: Sequelize.TEXT,
  original_source_url: Sequelize.STRING,
  sector_id: Sequelize.INTEGER
}, { createdAt: false, updatedAt: false, freezeTableName: true });

Project.belongsTo(Sector, { foreignKey: 'sector_id' });
Sector.hasMany(Project, { foreignKey: 'sector_id' });

// === All Functions ===
function initialize() {
  return sequelize.authenticate()
    .then(() => sequelize.sync())
    .then(() => console.log("Database connected & synced"))
    .catch(err => {
      console.error("DB Connection Failed:", err);
      throw err;
    });
}

function getAllProjects() {
  return Project.findAll({
    include: [Sector],
    order: [['id', 'ASC']]
  });
}

function getProjectById(id) {
  return Project.findOne({
    include: [Sector],
    where: { id }
  }).then(project => {
    if (!project) throw new Error("Project not found");
    return project;
  });
}

function getProjectsBySector(sector) {
  return Project.findAll({
    include: [Sector],
    where: {
      '$Sector.sector_name$': { [Op.iLike]: `%${sector}%` }
    }
  });
}

function getAllSectors() {
  return Sector.findAll({ order: [['sector_name', 'ASC']] });
}

function addProject(projectData) {
  return Project.create(projectData);
}

function updateProject(id, projectData) {
  return Project.update(projectData, { where: { id } })
    .then(([affected]) => {
      if (affected === 0) throw new Error("Project not found");
    });
}

function deleteProject(id) {
  return Project.destroy({ where: { id } })
    .then(count => {
      if (count === 0) throw new Error("Project not found");
    });
}

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