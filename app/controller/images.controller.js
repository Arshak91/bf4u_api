const db = require('../config/db.config.js');
const uuidv4 = require('uuid/v4');
const path = require('path');
const fs = require("fs");
// const seq = db.sequelize;
// const Op = db.Sequelize.Op;
// const Image = db.image;

const imagesFolder = 'resources/'
const imagesApi = 'images/'
const allowedExtensions = [
  'image/apng',
  'image/bmp',
  'image/gif',
  'image/x-icon',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp'
]

exports.get = (req, res) => {
  const imageUrl = req.params.file;
  // TODO: auth check
  if(imageUrl) {
    const path = imagesFolder + imageUrl;
    if (fs.existsSync(path)) {
      res.status(200).sendFile(path, { root: '.' });
    } else {
      res.status(500).send({ status: 0 });
    }
  } else {
    res.status(500).send({ status: 0 });
  }
}

exports.upload = (req, res) => {
  const file = req.files.image;
  if(!file || !file.mimetype || !allowedExtensions.includes(file.mimetype)) {
    res.status(500).send({ status: 0, msg: 'wrong mimetype ' });
  }
  const fileName = uuidv4() + path.extname(file.name);
  file.mv(imagesFolder + fileName, err => {
    if (err) {
      res.status(500).send({ status: 0, msg: err.message });
      return;
    }

    res.status(200).send({
      status: 1,
      data: {
        image_url: imagesApi + fileName
      }
    });
  });
};
