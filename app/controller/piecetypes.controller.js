const Helpers = require('../classes/helpers');
const db = require('../config/db.config.js');
const Piecetypes = db.piecetypes;

exports.getall = (req, res) => {
  let sortAndPagination = Helpers.sortAndPagination(req);
  let where = {};

  Piecetypes.findAndCountAll({
    where: where,
   ...sortAndPagination
  }).then(piecetypes => {
    res.status(200).send({
      status: 1,
      msg: 'ok',
      data: {
        piecetypes: piecetypes.rows,
        total: piecetypes.count
      }
    });
  }).catch(err => {
    res.status(500).send({
      'description': 'Can not access piecetypes table',
      'error': err
    });
  });
};
