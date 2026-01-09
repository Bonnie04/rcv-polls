const db = require("./db");
const User = require("./user");
const Poll = require("./Poll");
const PollOption = require("./PollOption");
const Ballot = require("./Ballot");
const Ranking = require("./Ranking");

// Define associations
// Poll associations
Poll.hasMany(PollOption, { foreignKey: "pollId", as: "options" });
Poll.hasMany(Ballot, { foreignKey: "pollId", as: "ballots" });
Poll.belongsTo(User, { foreignKey: "creatorId", as: "creator" });

// User associations
User.hasMany(Poll, { foreignKey: "creatorId", as: "polls" });

// PollOption associations
PollOption.belongsTo(Poll, { foreignKey: "pollId", as: "poll" });
PollOption.hasMany(Ranking, { foreignKey: "pollOptionId", as: "rankings" });

// Ballot associations
Ballot.belongsTo(Poll, { foreignKey: "pollId", as: "poll" });
Ballot.hasMany(Ranking, { foreignKey: "ballotId", as: "rankings" });

// Ranking associations
Ranking.belongsTo(Ballot, { foreignKey: "ballotId", as: "ballot" });
Ranking.belongsTo(PollOption, { foreignKey: "pollOptionId", as: "pollOption" });

module.exports = {
  db,
  User,
  Poll,
  PollOption,
  Ballot,
  Ranking,
};
