const db = require('../config/db.config.js');
const config = require('../config/config.js');
const Clients = require('../mongoControllers/ClientsController');
const Errors = require('../errors/authErrors');
const Helpers = require('../classes/helpers');
const apiKeyClass = require('../mongoClasses/apiKey');
const constants = require('../constants/socket');
const fs = require('fs');
const User = db.user;
const Role = db.role;
const UserRole = db.user_role;
const UserTypes = db.user_types;
const Driver = db.driver;
const Op = db.Sequelize.Op;
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
const tokenList = {};
const Notification = require('../classes/notification');
const NotificationService = new Notification();

exports.signup = async (req, res) => {
	let roles;
	roles = await Role.findOne({
		where: {
			name: req.body.roles
		}
	});
	
	// Save User to Database
	if (roles) {
		let client, user;
		client = await Clients.create(req.body);
		if (client.status) {
			user = await User.create({
				name: req.body.name,
				username: req.body.username,
				email: req.body.email,
				password: bcrypt.hashSync(req.body.password, 8)
			});
			if (user) {
				const role = roles.dataValues;
				const userData = user.dataValues;
				const type = await UserTypes.create({
					userId: userData.id,
					types: req.body.type
				});
				const userRole = await UserRole.create({
					roleId: role.id,
					userId: userData.id
				});
				let updClient = await Clients.edit({
					id: client.data._id,
					obj: {
						ID: user.id
					}
				});

				console.log(updClient);
				
				res.json({
					msg: 'ok',
					userRole,
					type,
					user
				});
			} else {
				res.status(409).send({ msg: "Error" });
			}
				
			
		}	
		
	} else {
		res.status(500).json({
			msg: 'such role doesn\'t exist'
		});
	}
};

exports.signin = async (req, res) => {
	console.log('SignIn: ', req.headers);
	let user = await User.findOne({
		where: {
			[Op.or]: [{username: req.body.username}, {email: req.body.username}]
		}
	}).catch(err => {
		res.status(500).send({
			msg: err.message,
			auth: false,
			status: 0
		});
	});
	if (!user) {
		return res.status(404).send({ auth: false, msg: 'User Not Found.', status: 0 });
	}
	let passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
	if (!passwordIsValid) {
		return res.status(401).send({ auth: false, msg: 'Invalid Password!', status: 0 });
	}

	let authorities = [];
	const roles = await user.getRoles();
	for (let i = 0; i < roles.length; i++) {
		authorities.push('ROLE_' + roles[i].name.toUpperCase());
	}
	const types = await UserTypes.findOne({
		where: {
			userId: user.id
		}
	});
	let driver;
	// driver = null;
	driver = await Driver.findOne({
		where: {
			email: user.email
		}
	});
	const Error = await Errors.authError({
		body: req.body,
		user,
		driver,
		types,
		authorities
	});
	if (Error.error) {
		res.status(401).send({
			status: 0,
			msg: Error.msg
		});
	} else {
		let info = await Helpers.getRemoteInfo(req);
		let getKeyClass = new apiKeyClass({
			data: {
				host: info.host,
				userId: user.id
			}
		});
		let apiKey = await getKeyClass.getBy(), createKeyClass;
		if (!apiKey.status) {
			createKeyClass = new apiKeyClass({
				data: {
					date: '2080-02-12 04:00:00.000',
					companyName: info.companyName,
					host: info.host,
					userId: user.id
				}
			});
			await createKeyClass.create();
		}
		var jwtUUID = '1234567890';
		const path = 'jwt.uuid';
		if (fs.existsSync(path)){
			jwtUUID = fs.readFileSync(path, 'utf8').toString();
		}
		let expire = '31d';
		user.dataValues.type = types ? types.types : '';
		delete user.dataValues.password;
		const token = jwt.sign({ user: user, jwtUUID }, config.secret, {
			expiresIn: expire // expires in 31 day
		});
		const response = {
			auth: true,
			status: 1,
			accessToken: token,
			username: user.username,
			userId: user.id,
			driverId: driver ? driver.id : '',
			userType: user.dataValues.type,
			ttt: user.type,
			authorities: authorities
		};
		tokenList[token] = response;
		res.status(200).send(response);
	}
};
exports.testSocket = async (req, res) => {
	
	const socket = require('../../server');
	const data = {
		title: req.body.title,
		content: req.body.content,
		type: req.body.type
	};
	const pushNotification = await NotificationService.create(data, req.user.id);

	await socket.sendNotificationToUser(constants.socketHandler.notification, req.user.id, pushNotification);
	return res.send({ msg: 'push notification sent !' });
};
exports.changePassword = (req, res) => {
	const postData = req.body;
	console.log(req.headers['x-access-token']);
	
	if (req.body.passwordNew.length < 8) return res.send({ status: 0, msg: 'minimum length of password must be 8', data: null })

	User.findOne({
		where: {
			[Op.or]: {
				username: req.body.username,
				email: req.body.username
			}
		}
	}).then(user => {
		if (!user) {
			return res.status(404).send({ reason: 'User Not Found.' });
		}
		
		var passwordIsValid = bcrypt.compareSync(req.body.passwordOld, user.password);
		if (!passwordIsValid) {
			return res.status(401).send({ auth: false, accessToken: null, reason: 'Invalid Password!' });
		}

		User.update({
			password: bcrypt.hashSync(req.body.passwordNew, 8),
			changePasswordAt: Date.now()
		}, 
		{
			where: { id: user.id }
		}).then(async user => {
			
			if((postData.token) && (postData.token in tokenList)) {
				const response = {
					username: user.username,
					msg: 'Password was changed successfully'
				};
				res.status(200).send(response);
			} else {
				res.status(409).json({
					status: 0,
					msg: "invalid Token"
				});
			}

		}).catch(err => {
			res.status(500).send({ reason: err.message });	
		});
	}).catch(err => {
		res.status(500).send({ reason: err.message });
	});
};

exports.userContent = (req, res) => {
	User.findOne({
		where: { id: req.userId },
		attributes: ['name', 'username', 'email'],
		include: [{
			model: Role,
			attributes: ['id', 'name'],
			through: {
				attributes: ['userId', 'roleId'],
			}
		}]
	}).then(user => {
		res.status(200).send({
			'description': '>>> User Contents!',
			'user': user
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access User Page',
			'error': err
		});
	});
};

exports.adminBoard = (req, res) => {
	User.findOne({
		where: { id: req.userId },
		attributes: ['name', 'username', 'email'],
		include: [{
			model: Role,
			attributes: ['id', 'name'],
			through: {
				attributes: ['userId', 'roleId'],
			}
		}]
	}).then(user => {
		res.status(200).send({
			'description': '>>> Admin Contents',
			'user': user
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access Admin Board',
			'error': err
		});
	});
};

exports.managementBoard = (req, res) => {
	User.findOne({
		where: { id: req.userId },
		attributes: ['name', 'username', 'email'],
		include: [{
			model: Role,
			attributes: ['id', 'name'],
			through: {
				attributes: ['userId', 'roleId'],
			}
		}]
	}).then(user => {
		res.status(200).send({
			'description': '>>> Project Management Board',
			'user': user
		});
	}).catch(err => {
		res.status(500).send({
			'description': 'Can not access Management Board',
			'error': err
		});
	});
};

exports.logOut = async (req, res) => {
	try {
		const userId = req.user.id;
		let { socketId } = req.body;
		const socket = require("../../server");
		const user = await User.update({
			logoutAt: Date.now()
		},{
			where: {
				id: userId
			}
		});
		if (user[0]) {
			socketId ? await socket.disconnected(socketId) : null;
			res.json({
				status: 1,
				msg: "LogOut"
			});
		}
	} catch (error) {
		res.status(500).send({
			msg: error.message,
			status: 0
		});
	}
};

exports.logOutScript = async (req, res) => {
	try {
		const users = await User.update({
			logoutAt: Date.now()
		}, {
			where: {}
		});
		console.log(users);
		const allUsers = await User.findAll();
		res.send({
			allUsers
		});
		
	} catch (error) {
		res.status(500).send({
			error
		});
	}
};
