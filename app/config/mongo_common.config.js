const mongoose = require('mongoose');

const env = process.env.SERVER == 'local' ? require('./env.local.js') : require('./env.js');
const mongo = env.mongoCommon;
// const mongo = env.mongo;
const uri = `mongodb://${mongo.user}:${mongo.pass}@${mongo.host}:${mongo.port}/${mongo.database}`;

const conn = mongoose.createConnection(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

conn.then( () => { 
    console.log('MongoDb - lessdb for common use is connected!');
})
.catch( err => {
    console.log(err);
});

module.exports = conn;