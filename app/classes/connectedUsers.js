module.exports = class ConnectedUser {
    constructor(data) {
        this.user = data.user;
        this.client = data.client;
    }

    user;
    client;

    static get connectModel () {
        return {
            user,
            client
        }
    }
}