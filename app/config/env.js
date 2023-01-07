const env = {
    database: 'bfdb', // 'bfdb', // 'bfdb', // 'tbfdb'
    // database: 'devcity', // 'tbfdb',  'cityLine', devcity
    username: 'bf4u',
    password: 'Zn6+YsUU',
    host: '144.217.38.21',
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    engineHost: "http://ads.lessplatform.com",
    enginrPort: 8110,
    // enginrPort: 80,
    mapHost: "http://map.lessplatform.com:",
    // mapHost: "http://192.168.0.107:5000",
    uploadHost: "http://192.168.1.109:",
    uploadPort: "4774",
    mapPort: 80,
    mapUri:"/route/v1/driving/",
    mapKey: "AIzaSyAF2EnF5r4d18S-d1h5OyVrsRDXa_OzQUU",
    mailer: {
        email: "noreply@lessplatformmailer.com",
        pass: "Less-n0-rep!",
        SMTP_SERVER: "smtp.transip.email",
        PORT: 465,
    },
    mongo: {
        database: "LegacyFoods",
        host: "144.217.38.21",
        user: "mongouser",
        pass: "hello8008there",
        port: 27017,
    },
    mongoCommon: {
        database: "less",
        host: "144.217.38.21",
        user: "mongouser",
        pass: "hello8008there",
        port: 27017,
    },
    mapBox: {
        host: "https://api.mapbox.com/directions/v5/mapbox/driving/",
        linkParams: "?overview=full&access_token=pk.eyJ1IjoiaG92c2VwIiwiYSI6ImNrNTZibjVsbDAyOHYzZG1veXk0MGphczAifQ.QtVXUzQsI0EQB8BFUvq09g",
    }
    // mapHost: "http://192.168.0.107:5000"
};

module.exports = env;
