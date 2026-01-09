const { DataTypes } = require("sequelize");
const db = require("./db");

const Ranking = db.define("ranking", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ballotId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  pollOptionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
});

module.exports = Ranking;
