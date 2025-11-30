require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    dialect: 'postgres',
    dialectOptions: { ssl: { rejectUnauthorized: false } },
    logging: false
  }
);

const sectors = [
  "Land Sinks",
  "Industry",
  "Transportation",
  "Electricity",
  "Food, Agriculture, and Land Use"
];

sequelize.authenticate()
  .then(() => {
    const values = sectors.map(s => `('${s}', NOW(), NOW())`).join(', ');
    return sequelize.query(`INSERT INTO "Sectors" ("sector_name", "createdAt", "updatedAt") VALUES ${values} ON CONFLICT DO NOTHING;`);
  })
  .then(() => {
    console.log("5 sectors inserted successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Error:", err.message);
    process.exit(1);
  });