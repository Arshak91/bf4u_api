// const db = require('../config/db.config.js');
// //const config = require('../config/config.js');
// const seq = db.sequelize;
// const Op = db.Sequelize.Op;


const googleAPIUrl = 'https://maps.googleapis.com/maps/api/';
const googleKey = 'AIzaSyCnwaexZOy2wCh_7vXKpd7xk979zhXV9EM';

const googleMapsClient = require('@google/maps').createClient({
    key: googleKey,
    Promise: Promise
  });
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
 
  // Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: 'AIzaSyCnwaexZOy2wCh_7vXKpd7xk979zhXV9EM', // for Mapquest, OpenCage, Google Premier
  formatter: null         // 'gpx', 'string', ...
};
 
var geocoder = NodeGeocoder(options);

exports.getDistance = (req, res) => {
    var addresses = req.query.addresses ? req.query.addresses : 'Concord+ON' // 'Concord+ON|Swiftwater+PA|Fort+Washington+MD|Carteret+NJ|Mansfield+MA|Warner+NH|Mansfield+MA'

    if(!addresses || addresses.trim() == ''){
        return res.status(200).send({
            status: 1,
            msg: 'ok',
            data: [{}]
        });
    }


    addresses = addresses.split('|')

    googleMapsClient.distanceMatrix({
            origins: addresses,
            destinations: addresses
        })
        .asPromise()
        .then(function(result) {
            
            if(result.status != 200 || !result.json || !result.json.rows.length){
                res.status(200).send({
                    status: 0,
                    msg: 'No rows.elements'
                });
                return;
            }

            var dists = [];
            var times = [];
            result.json.rows.forEach( (row, ind) => {
                if(!dists[ind]){
                    dists[ind] = [];
                    times[ind] = [];
                }
                row.elements.forEach(elem => {
                    //if(elem.distance.value > 0){
                        dists[ind].push(elem.distance.value);
                        times[ind].push(elem.duration.value);
                    //}
                });
            });
            res.status(200).send({
                status: 1,
                msg: 'Ok',
                data: {
                    dists: dists,
                    times: times
                }
            });
        })
        .catch(function(err) {
            console.log(err);
        });


    //let url = googleAPIUrl + 'distancematrix/json?key=' + googleKey + '&language=en-US' + '&origins=' + addresses + '&destinations=' + addresses;
    let url = googleAPIUrl + 'distancematrix/json?key=' + googleKey + '&origins=' + addresses + '&destinations=' + addresses;

    //geocoder.geo
    // url='https://maps.googleapis.com/maps/api/distancematrix/json?
    // origins=Concord+ON|Swiftwater+PA|Fort+Washington+MD|Carteret+NJ|Mansfield+MA|Warner+NH|Mansfield+MA
    // &
    // destinations=Concord+ON|Swiftwater+PA|Fort+Washington+MD|Carteret+NJ|Mansfield+MA|Warner+NH|Mansfield+MA'

    // https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=Washington,DC&destinations=New+York+City,NY&key=YOUR_API_KEY
}

exports.getDistancesTimes = (req, res) => {
    var addresses = req.query.addresses;

    if(!addresses || addresses.trim() == ''){
        return res.status(200).send({
            status: 1,
            msg: 'ok',
            data: [{}]
        });
    }

    addresses = addresses.split('|');

    googleMapsClient.distanceMatrix({
            origins: addresses,
            destinations: addresses
        })
        .asPromise()
        .then(function(result) {
            
            if(result.status != 200 || !result.json || !result.json.rows.length){
                res.status(200).send({
                    status: 0,
                    msg: 'No rows.elements'
                });
                return;
            }

            var dists = []
            var times = []
            result.json.rows.forEach( (row, ind) => {
                if(!dists[ind]){
                    dists[ind] = [];
                    times[ind] = [];
                }
                row.elements.forEach(elem => {
                    dists[ind].push(elem.distance.value);
                    times[ind].push(elem.duration.value);
                });
            });

            var c = { };
            var tm = { };

            trucks = [1, 2];

            dists.forEach(function(els, ind1){
                els.forEach(function(v, ind2){
                    if(ind1 != ind2){
                        trucks.forEach(t => {
                            c[`(${ind1},${ind2},${t})`] = v
                        });
                    }
                });
            });
            times.forEach(function(els, ind1){
                els.forEach(function(v, ind2){
                    if(ind1 != ind2){
                        trucks.forEach(t => {
                            tm[`(${ind1},${ind2},${t})`] = v;
                        });
                    }
                });
            });

            res.status(200).send({
                status: 1,
                msg: 'Ok',
                data: {
                    dists: c, // dists,
                    times: tm // times
                }
            });
        })
        .catch(function(err) {
            console.log(err);
        });
};

exports.getlonglat = (req, res) => {
    var address = req.query.address;

    geocoder.geocode(address)
    .then(function(result) {
        res.status(200).send({
			status: 1,
			msg: 'ok',
			data: result
		});
        // console.log(res)
    })
    .catch(function(err) {
        console.log(err);
    });
};

// // Using callback
// geocoder.geocode('29 champs elysée paris', function(err, res) {
//   console.log(res);
// });
 
// // Or using Promise
// geocoder.geocode('29 champs elysée paris')
//   .then(function(res) {
//     console.log(res);
//   })
//   .catch(function(err) {
//     console.log(err);
//   });
 
// // output :
// [{
//   latitude: 48.8698679,
//   longitude: 2.3072976,
//   country: 'France',
//   countryCode: 'FR',
//   city: 'Paris',
//   zipcode: '75008',
//   streetName: 'Champs-Élysées',
//   streetNumber: '29',
//   administrativeLevels: {
//     level1long: 'Île-de-France',
//     level1short: 'IDF',
//     level2long: 'Paris',
//     level2short: '75'
//   },
//   provider: 'google'
// }]

// exports.getlonglat = (req, res) => {
// 	var date = getDateParam(req.query.address);

// 	let dtTo = new Date(date)
// 	dtTo.setDate(dtTo.getDate() + 1)
// 	dtTo = dtTo.toISOString().split('T')[0]
// 	seq.query(`SELECT * FROM orders WHERE createdAt>='${date}' AND createdAt<'${dtTo}'`, { 
// 			type: seq.QueryTypes.SELECT
// 		})
// 	.then(orders => {
// 		res.status(200).send({
// 			status: 1,
// 			msg: 'ok',
// 			data: orders
// 		})
// 	}).catch(err => {
// 		res.status(500).send({
// 			'description': 'Can not access orders table',
// 			'error': err
// 		});
// 	})
// }