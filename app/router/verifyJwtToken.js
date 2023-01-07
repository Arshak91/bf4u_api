const jwt = require('jsonwebtoken');
const config = require('../config/config.js');
const db = require('../config/db.config.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const moment = require('moment');
const { URL } = require('url');
const User = db.user;

const ApiKey = require('../mongoModels/ApiKeyModel');
const Helper = require('../classes/helpers');

const verifyToken = async (req, res, next) => {
	let token = req.headers['x-access-token'];
	// console.log(' --- verifyToken - action ')
	// return next();
	if (!token) return next();
	if (!token){
		// check auth key
		try{
			let apiKey = req.headers['api_key'];
			let apiTime = req.headers['api_time'];
			
			if(!apiKey){
				apiKey = req.query['api_key'];
			}
			if(!apiTime){
				apiTime = req.query['api_time'];
			}

			if(apiKey && apiTime){
				if(new Date() - new Date(apiTime) > 120000){ // 2 min
					return res.status(500).send({ 
						auth: false, 
						message: 'Timeout'
					});
				}

				const user = await User.findOne({ where: { apiKey: apiKey } });
				
				if(!user){
					return res.status(500).send({ 
						auth: false, 
						message: 'Fail to Authentication.'
					});
				}
				
				const sha256 = require('sha256');
				const apiHash = req.query['api_hash'];
				if(apiHash){
					const hash = sha256(apiKey + apiTime + user.apiSecret);
					if(hash != apiHash){
						return res.status(500).send({ 
							auth: false, 
							message: 'Fail to Authentication.'
						});
					}
				}else{
					const hash = sha256(apiKey + apiTime);
					if(hash != user.apiHash){
						return res.status(500).send({ 
							auth: false, 
							message: 'Fail to Authentication.'
						});
					}
				}
				
				// ok
				req.user = user;
				req.companyName = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'].split('.')[0] : req.headers.referer && req.headers.referer !== '192.168.88.87:8080' && new URL(req.headers.referer) ? new URL(req.headers.referer).hostname.split('.')[0] : "error";
				return next();
			}
		}catch(ex){
			return res.status(403).send({ 
				auth: false, message: 'No apiKey provided.' 
			});
		}

		//
		console.log("Rejected  token", req.headers['x-access-token']);
		console.table([{ "Host": req.headers.host , "Time" : moment().format(), "url": req.url, "method": req.method }]);
		return res.status(403).send({ 
			auth: false, message: 'No token provided.' 
			
		});
	}

	var jwtUUID = '1234567890';
	const path = 'jwt.uuid';
	if (fs.existsSync(path)){
		
		jwtUUID = fs.readFileSync(path, 'utf8').toString();
	}

	let ValidToken = false;
	await jwt.verify(token, config.secret, async (err, decoded) => {
		let user;
		if (decoded) {
			user = await User.findOne({
				where: {
					id: decoded.user.id
				}
			});	
		}
		if (!user || err || (user.changePasswordAt && new Date(user.changePasswordAt).getTime() > decoded.iat * 1000) || (user.logoutAt && new Date(user.logoutAt).getTime() > decoded.iat * 1000) || decoded.jwtUUID != jwtUUID){
			console.log("Rejected  token", req.headers['x-access-token']);
			console.table([{ "Host": req.headers.host , "Time" : moment().format(), "url": req.url, "method": req.method }]);
			return res.status(500).send({ 
				auth: false, 
				message: 'Fail to Authentication. Error -> ' + err 
			});
		}
		else{
			ValidToken = true;
		}
		req.user = decoded.user;
		req.companyName = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'].split('.')[0] : req.headers.referer && req.headers.referer !== '192.168.88.87:8080' && new URL(req.headers.referer) ? new URL(req.headers.referer).hostname.split('.')[0] : "localHost";
	});

	if (ValidToken && req.url == '/api/auth/changepassword' && req.method == 'POST') {
		console.log("Rejected token:", req.headers['x-access-token']);
		console.table([{ "Host": req.headers.host , "Time" : moment().format(), "url": req.url, "method": req.method }]);
		const user = await User.findOne({
			where: {
				id: req.user.id
			}
		});
		const passwordIsValid = bcrypt.compareSync(req.body.passwordOld, user.password);
		if (!passwordIsValid) {
			return res.status(401).send({ auth: false, accessToken: null, reason: 'Invalid Password!' });
		}
		const updatePass = await User.update({
			password: bcrypt.hashSync(req.body.passwordNew, 8),
			changePasswordAt: Date.now()
		}, {
			where: {
				id: req.user.id
			}
		});
		if (updatePass[0]) {
			return res.status(401).send({ auth: false, accessToken: null, reason: 'Password changed' });
		}
	} else if(ValidToken && req.url != '/api/auth/changepassword') {
		next();
	}
};

const verifyKey = async (req, res, next) => {
	//return next();
	try {
		// let { apiKey } = req.query;
		let apiKey = req.headers['x-api-key'];
		let info = await Helper.getRemoteInfoForKey(req);
		let key;
		
		if (apiKey) {
			key = await ApiKey.findOne({
				Key: apiKey,
				host: info.host
			});
			let expire = key ? key.Expire : 0;
			let now = new Date();
			if (key && expire.getTime() > now.getTime()) {
				req.companyName = req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'].split('.')[0] : req.headers.host && req.headers.host != '192.168.88.87:8080' && req.headers.referer && new URL(req.headers.referer) ? new URL(req.headers.referer).hostname.split('.')[0] : "localHost";
				next();
			} else {
				return res.status(409).json({
					status: 0,
					msg: "key expired or invalid"
				});
			}
		} else {
			return res.status(409).json({
				status: 0,
				msg: "apiKey is required"
			});
		}

	} catch (error) {
		res.status(409).json({
			status: 0,
			msg: error.message
		});
	}
};

const isAdmin = (req, res, next) => {	
	User.findById(req.userId)
		.then(user => {
			user.getRoles().then(roles => {
				for(let i=0; i<roles.length; i++){
					console.log(roles[i].name);
					if(roles[i].name.toUpperCase() === "ADMIN"){
						next();
						return;
					}
				}
			
				res.status(403).send("Require Admin Role!");
				return;
			});
		});
};

const isPmOrAdmin = (req, res, next) => {
	User.findOne({
		where: { id: req.userId }
	})
	//findById(req.userId)
		.then(user => {
			user.getRoles().then(roles => {
				for(let i=0; i<roles.length; i++){					
					if(roles[i].name.toUpperCase() === "PM"){
						next();
						return;
					}
					
					if(roles[i].name.toUpperCase() === "ADMIN"){
						next();
						return;
					}
				}
				
				res.status(403).send("Require PM or Admin Roles!");
			});
		}).catch(err => {
			res.status(500).send({
				'description': 'Can not access Admin Board',
				'error': err
			});
		});
};

const isDriver = (req, res, next) => {

};

const authJwt = {};
authJwt.verifyToken = verifyToken;
authJwt.verifyKey = verifyKey;
authJwt.isAdmin = isAdmin;
authJwt.isPmOrAdmin = isPmOrAdmin;

module.exports = authJwt;