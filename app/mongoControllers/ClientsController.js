const Clients = require('../mongoModels/ClinetsModel');

exports.create = async (data) => {
    try {
        let clients;
        clients = await Clients.create({
            Name: data.name ? data.name : null,
            CompanyName: data.CompanyName ? data.CompanyName : null,
            CompanyType: data.CompanyType ? data.CompanyType : null,
            Email: data.email ? data.email : null,
            Phone: data.Phone ? data.Phone : null,
            Address1: data.Address1 ? data.Address1 : null,
            Address2: data.Address2 ? data.Address2 : null,
            ContactPerson: data.ContactPerson ? data.ContactPerson : null,
            Type: data.type ? data.type : null,
            ContactPersonPosition: data.ContactPersonPosition ? data.ContactPersonPosition : null
        });
        if (clients) {
            return {
                status: 1,
                msg: "ok",
                data: clients
            };
        } else {
            return {
                status: 0,
                msg: "Error create Client"
            };
        }
    } catch (error) {
        return {
            status: 0,
            msg: error.message
        };
    }
};

exports.edit = async (data) => {
    try {
        let clients;
        clients = await Clients.findOneAndUpdate({
            _id: data.id
        }, data.obj, {new: true});
        if (clients) {
            return {
                status: 1,
                msg: "ok",
                data: clients
            };
        } else {
            return {
                status: 0,
                msg: "Error update Client",
            };
        }
    } catch (error) {
        return {
            status: 0,
            msg: error.message,
        };
    }
};

