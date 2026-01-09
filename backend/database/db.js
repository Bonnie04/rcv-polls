require("dotenv").config();
const { Sequelize } = require("sequelize");

// Use SQLite for simplicity
const db = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

module.exports = db;