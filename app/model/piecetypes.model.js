module.exports = (sequelize, Sequelize) => {
  const Piecetypes = sequelize.define('piecetypes', {
    piecetype: { type: Sequelize.STRING },
    density: { type: Sequelize.DOUBLE },
    freightclasses_id: { type: Sequelize.INTEGER }
  });
  return Piecetypes;
};
