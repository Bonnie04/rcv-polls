const { DataTypes } = require("sequelize");
const db = require("./db");

const Ballot = db.define("ballot", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pollId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  voterId: {
    type: DataTypes.STRING,
    allowNull: true, // Allow anonymous voting
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Ballot;
