const { DataTypes } = require("sequelize");
const db = require("./db");

// Poll model
// - Uses UUID primary key
// - Timestamps (createdAt, updatedAt) are enabled by default
const Poll = db.define("poll", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  creatorId: {
    // Will be associated with the User model via Sequelize associations.
    // Keeping it as a UUID as specified, without enforcing a DB-level FK yet.
    type: DataTypes.UUID,
    allowNull: false,
  },
  shareableLink: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  isOpen: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = Poll;

