module.exports = (sequelize, Sequelize) => {
  const Freightclasses = sequelize.define('freightclasses', {
    freightclass: { type: Sequelize.DOUBLE },
    maxpcf: { type: Sequelize.DOUBLE },
    minpcf: { type: Sequelize.DOUBLE }
  })
  return Freightclasses;
};
