const jwt = require('jsonwebtoken');
const config = require('../config/config.js');
const db = require('../config/db.config.js');
const fs = require('fs');
const User = db.user;
const constants = require('../constants/socket');
class SocketInit {
    constructor() {
        this.clients = [];
        this.io;
    }
    async init(io) {
        this.io = io;
        io.on(constants.socketHandler.connection, async (client) => {
            const x = {msg: 'You are connected'};
            client.emit(constants.socketHandler.connection, JSON.stringify(x));
            const result = await this.checkToken(client.handshake.query.token);
            const index = result.user ? this.clients.findIndex(x => x.userId === result.user.id) : -2;
            if (result && result.status) {
                client.userId = result.user.id;
                this.setClinet(client);
            }
            client.on(constants.socketHandler.disconnect, () => {
                this.disconnect(client);
            });
          });
    };

    async setClinet(client) {
        console.log(`Client from id (${client.id}) connected to the socket.`);
        this.clients.push(client);
    }
    async disconnect (client) {
        const index = this.clients.findIndex(x => x.id === client.id);
        if (index > -1) {
            this.emitToDisconnect(index);
            this.clients.splice(index, 1);
            client.disconnect();
            console.log(client.id, 'disconnected');
        }
    }
    async emitToDisconnect (index) {
        this.clients[index].emit(constants.socketHandler.emitDisconnect, '');
    };
    async checkToken(token) {
        var jwtUUID = '1234567890';
        const path = 'jwt.uuid';
        if (fs.existsSync(path)) {
            jwtUUID = fs.readFileSync(path, 'utf8').toString();
        }
        return await jwt.verify(token, config.secret, async (err, decoded) => {
            let user;
            if (decoded) {
                user = await User.findOne({
                    where: {
                        id: decoded.user.id
                    }
                });
            }
            if (!user || err || (user.changePasswordAt && new Date(user.changePasswordAt).getTime() > decoded.iat * 1000) || (user.logoutAt && new Date(user.logoutAt).getTime() > decoded.iat * 1000) || decoded.jwtUUID != jwtUUID) {
                return {
                    status: false,
                    user: null
                };
            }
            this.user = user;
            return {
                status: true,
                user
            }
        });
    };
}

module.exports = class SocketService extends SocketInit {
    constructor(io) {
        super();
        this.io = io;
    };

    initSocket = async() => {
        this.init(this.io);
    }

    sendNotificationToUser = async (event, userId, notification) => {
        const index = this.clients.findIndex(x => x.userId === userId);
        for (const item of this.clients) {
            if (item.userId == userId) {
                item.emit(event, JSON.stringify(notification));
            }
        }
    };

    disconnected = async (clientId) => {
        const index = this.clients.findIndex(x => x.id === clientId);
        let userId = this.clients[index].userId;
        for (const [i, item] of this.clients.entries()) {
            if (item.userId == userId) {
                item.disconnect();
                console.log(this.clients[i].id, 'disconnected');
                this.clients = this.clients.splice(i, 1);
            }
        }
    };

    broadcastToAll = async (notification) => {
        this.clients.forEach(client => {
            client.emit(constants.socketHandler.notification, JSON.stringify(notification));
        });
    };

};




