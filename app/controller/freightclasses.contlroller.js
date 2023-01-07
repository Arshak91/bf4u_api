const Helpers = require('../classes/helpers') ;
const db = require('../config/db.config.js');
const Freightclasses = db.freightclasses;

exports.getall = async (req, res) => {

  let sortAndPagination = await Helpers.sortAndPagination(req);
  let where = {};

  Freightclasses.findAndCountAll({
    where: where,
    ...sortAndPagination
  }).then(freightclasses => {
    res.status(200).send({
      status: 1,
      msg: 'ok',
      data: {
        freightclasses: freightclasses.rows,
        total: freightclasses.count
      }
    });
  }).catch(err => {
    res.status(500).send({
      'description': 'Can not access freightclasses table',
      'error': err
    });
  });
};
