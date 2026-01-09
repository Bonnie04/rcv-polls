const { DataTypes } = require("sequelize");
const db = require("./db");

const PollOption = db.define("pollOption", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pollId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  optionText: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

module.exports = PollOption;
