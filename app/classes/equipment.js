const db = require('../config/db.config.js');
const Equipment = db.equipment;
// const op = db.Sequelize.Op;
// const seq = db.sequelize;

module.exports = class Load {


    constructor(params) {
        this.data = params.data;        
    }

    async create(){
        let maxVolume = this.data.internalLength * this.data.internalWidth * this.data.internalHeight; 
        let equipment = await Equipment.create({
            type: this.data.type,
			trailerType: this.data.trailerType,
			name: this.data.name,
			horsePower: this.data.horsePower,
			value: this.data.value,
			valueUnit: this.data.valueUnit,
			
			trailerSize: this.data.trailerSize,
			externalLength: this.data.externalLength,
			externalWidth: this.data.externalWidth,
			externalHeight: this.data.externalHeight,

			internalLength: this.data.internalLength,
			internalWidth: this.data.internalWidth,
			internalHeight: this.data.internalHeight,
			maxweight: this.data.maxweight,
			maxVolume: this.data.maxVolume ? this.data.maxVolume : maxVolume,
			eqType: this.data.eqType
        });
        
        return equipment;

    }


};

