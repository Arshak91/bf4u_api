const env = process.env.SERVER == 'local' ? require('./env.local.js') : require('./env.js');
const mongoose = require('mongoose');

mongoose.connect(`mongodb://${env.mongo.user}:${env.mongo.pass}@${env.mongo.host}:${env.mongo.port}/${env.mongo.database}`, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDb Connect'))
    .catch(err => console.log(err));

module.exports = mongoose;