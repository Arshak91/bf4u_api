const db = require('../config/db.config.js');
const Helper = require('../classes/helpers');
const Osmap = require('./osmap.controller');
const Errors = require('../errors/consigneeErrors');
const orderController = require('./orderscontroller');
const Search = require('../lib/search');
const Excel = require('exceljs');
const Op = db.Sequelize.Op;
const Consignees = db.consignee;
const Order = db.order;
const Mailer = require('../classes/mailer');
const ContactUsTypes = {
    [1]: 'Issue',
    [2]: 'Question',
    [3]: 'Custom Change Request',
    [4]: 'Other'
};

exports.sendContactUsEmail = async (req, res) => {
    const { type, message } = req.body;
    const user = req.user;
    const messageText = `

    Email: ${user.email} \r\n
    Username: ${!!user.username ? user.username : 'None'} \r\n

    ${ContactUsTypes[type]}:  \r\n
    ${message} \r\n
    -----------------------------------------\r\n

    Instance: ${req.get('host')}\r\n
    LocalPort: ${process.env.PORT}
    `;
    
    console.log(messageText);

    await Mailer.sendMail('hartyom26@gmail.com', ContactUsTypes[type], messageText);
    await Mailer.sendMail("Support@lessplatform.com", ContactUsTypes[type], messageText);
    return res.send({ status: 1, msg: 'Message successfully sent.', data: null });
}