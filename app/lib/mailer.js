const nodemailer = require("nodemailer");
const env = process.env.SERVER == 'local' ? require('../config/env.local.js') : require('../config/env.js');

exports.transport = nodemailer.createTransport({
    pool: true,
    host: env.mailer.SMTP_SERVER,
    port: env.mailer.PORT,
    secureConnection: true, // use TLS
    auth: {
        user: env.mailer.email,
        pass: env.mailer.pass
    },
    tls: {
        secureProtocol: "TLSv1_method"
    }
});