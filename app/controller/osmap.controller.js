const nomjs = require("../classes/nominatim");
const request  = require("request-promise");
const axios = require("axios");
const env = process.env.SERVER == "local" ? require("../config/env.local") : require("../config/env");
// const Helpers = require("../classes/helpers");

const groupMapLegs = async (str) => {
  // let mapUrl = env.mapHost + env.mapPort +  env.mapUri;
  let mapInfo = env.mapBox;
  let mapUrl = mapInfo.host;
  let arrLatLon = str.split(";"), results = [], latLonStr = "", mapResponse, finalResponse = {};
  if (arrLatLon.length < 2) {
      return {
          result: 0
      };
  }
  let bool = 0;
  for (const [i, item] of arrLatLon.entries()) {
      latLonStr += `${item};`;
      if ((i+1)%25 == 0 && bool == 0) {
          bool = 1;
          latLonStr = latLonStr.slice(0, -1);
          mapResponse = await request(mapUrl + latLonStr + mapInfo.linkParams, { json: true }, (err, res, body) => {
            if (err) { return { msg: err.message, result: 0 }; }
          });
          results.push(mapResponse);
          latLonStr = "";
          latLonStr += `${item};`;
      }
      if ((i+1)%24 == 0 && bool == 1) {
        latLonStr = latLonStr.slice(0, -1);
        mapResponse = await request(mapUrl + latLonStr + mapInfo.linkParams, { json: true }, (err, res, body) => {
            if (err) { return { msg: err.message, result: 0 }; }
        });
        results.push(mapResponse);
        latLonStr = "";
        latLonStr += `${item};`;
      }
  }
  latLonStr = latLonStr.slice(0, -1);
  let latLons = latLonStr.split(";"), mapResponseEnd;
  if (latLons.length >= 2) {
    mapResponseEnd = await request(mapUrl + latLonStr + mapInfo.linkParams, { json: true }, (err, res, body) => {
        if (err) { console.log(err.message); }
    });
  }
  if (mapResponseEnd && mapResponseEnd.code == "Ok") {
      results.push(mapResponseEnd);
  }
  finalResponse.routes = [{
    weight_name: "",
    weight: 0,
    duration: 0,
    distance: 0,
    legs: []
  }];
  for (const item of results) {
      finalResponse.routes[0].weight_name = item.routes[0].weight_name;
      finalResponse.routes[0].weight += item.routes[0].weight;
      finalResponse.routes[0].duration += item.routes[0].duration;
      finalResponse.routes[0].distance += item.routes[0].distance;
      finalResponse.routes[0].legs = finalResponse.routes[0].legs.concat(item.routes[0].legs);
      finalResponse.code = item.code;
  }
  // if (mapResponse.code == "InvalidInput") {
  // }
  return {
      result: finalResponse
  };

};

async function GetDistDur(points){
  try {
    let mapUrl = env.mapHost + env.mapPort +  env.mapUri;
    let newStr = points; // await Helpers.joinLatLon(points);
    let arrLatLon = [], status = 1;
    if (newStr.slice(-1) == ";") {
       newStr = newStr.slice(0, -1);
    }
    let pointsArray = newStr.split(";");
    let newPoints = "";
    pointsArray.forEach(point => {
        let latlon = point.split(",");
        let lat = parseFloat(latlon[0]).toFixed(7);
        let lon = parseFloat(latlon[1]).toFixed(7);
        arrLatLon.push({
          lat,
          lon
        });
        newPoints += lon + "," + lat + ";";
    });
    // console.log("new!!!", newPoints);
    newPoints = newPoints.slice(0, -1);
    // console.log( mapUrl + newPoints + "?overview=false");
    let data;
    data = {
      distance: 0,
      duration: 0,
      legs: [],
    };
    let result, matrix = "annotations=distance,duration&generate_hints=false&exclude=ferry";
    let msg, statusCode;
    result = await request(mapUrl + newPoints + "?overview=false&exclude=ferry", { json: true }, (err, res, body) => {
      if (err) {
        console.log(err);
        return {
          error: err,
          distDur: data,
          arrLatLon,
          status: 0,
          code: "Error",
          msg: err.message
        };
      }
      statusCode = res.statusCode;
      msg = res.statusMessage;
    });
    if (statusCode == 400) {
      status = 0;
      return {
        distDur: data,
        arrLatLon,
        status,
        code: statusCode,
        msg
      };
    } else {
      // let distance = 0;
      // let duration = 0;
      // let legs =[];
      // for (let i = 0, len = result.distances.length - 1; i < len; i++) {
      //   distance += result.distances[i][i + 1];
      //   duration += result.durations[i][i + 1];
      //   legs[i] = { distance: result.distances[i][i + 1], duration:result.durations[i][i + 1]};
      // }
      data = {
        distance: result.routes[0].distance,
        duration: result.routes[0].duration,
        legs: result.routes[0].legs,
      };
      return {
        distDur: data,
        arrLatLon,
        status,
        code: result.code,
        msg: result.message
      };
    }
  } catch (error) {
    return {
      error,
      status: 0,
      distDur: {
        legs: []
      },
      code: error.error.code,
      msg: error.error.message
    };
  }
}
async function GeoCode(query){
    const result =  await nomjs.NominatimJS.search({ q: query }, function(err, data){
      if(err){return err;}
    });
    return result;
}
async function GeoLoc(query){
  const loc = await axios.get(encodeURI(`https://maps.googleapis.com/maps/api/geocode/json?key=${env.mapKey}&address=${query}`)).catch(err => {
    console.log("error", err);
  });
  return loc;
}

async function GeoLocChina(query){
  const loc = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${env.mapBoxKey}`).catch(err => {
    console.log("error", err);
  });
  return loc;
}

async function GeoLocByZip(zip){
  const loc = axios.get(`https://maps.googleapis.com/maps/api/geocode/json?key=${env.mapKey}&address=${zip}`);
  return loc;
}

const GetDistDurMapBox = async (points) => {
  let mapInfo = env.mapBox;
  let mapUrl = mapInfo.host;
  let newStr = points;
  let arrLatLon = [], status = 1;
    if (newStr.slice(-1) == ";") {
       newStr = newStr.slice(0, -1);
    }
    let pointsArray = newStr.split(";");
    let newPoints = "";
    pointsArray.forEach(point => {
        let latlon = point.split(",");
        let lat = parseFloat(latlon[0]).toFixed(7);
        let lon = parseFloat(latlon[1]).toFixed(7);
        arrLatLon.push({
          lat,
          lon
        });
        newPoints += lon + "," + lat + ";";
    });

    newPoints = newPoints.slice(0, -1);

    // let result;
    // console.log(mapUrl + newPoints + mapInfo.linkParams);
    // result = await request(mapUrl + newPoints + mapInfo.linkParams, { json: true }, (err, res, body) => {
    //   if (err) { return err; }
    // });
    let newLegs;
    newLegs = await groupMapLegs(newPoints);
    const result = newLegs.result;
    let data;
    if (!result) {
      status = 0;
      return {
        distDur: [],
        arrLatLon,
        status,
        code: "Error",
        msg: "map Error"
      };
    } else {
      data = {
        distance: result.routes[0].distance,
        duration: result.routes[0].duration,
        legs: result.routes[0].legs,
      };
      return {
        distDur: data,
        arrLatLon,
        status,
        code: result.code,
        msg: result.message
      };
    }
};

exports.GetDistDur = GetDistDur;
exports.GeoCode = GeoCode;
exports.GeoLoc = GeoLoc;
exports.GeoLocChina = GeoLocChina;
exports.GetDistDurMapBox = GetDistDurMapBox;
