module.exports = class AssetsValidation {
    constructor(data) {
        this.validationModel = {};
        this.validationModel.companyId = data.companyId;
        this.validationModel.name = data.name;
        this.validationModel.equipmentId = data.equipmentId;
        this.validationModel.platNumber = data.platNumber;
        this.validationModel.attachment = data.attachment;
        this.validationModel.licenses = data.licenses;
        this.validationModel.VIN = data.VIN;
        this.validationModel.brand = data.brand;
        this.validationModel.cabinType = data.cabinType;
        this.validationModel.inspaction = data.inspaction;
        this.validationModel.yom = data.yom;
        this.validationModel.model = data.model;
        this.validationModel.exploitation = data.exploitation;
        this.validationModel.info = data.info;
        this.validationModel.depoid = data.depoid;
        this.errors = [];
        this.model = this.createValidationModel();
    };

    createValidationModel() {
        return [
            // {
            //     target: 'companyId',
            //     type: 'Number',
            //     nullable: false
            // },
            {
                target: 'name',
                type: 'String',
                nullable: false
            },
            {
                target: 'equipmentId',
                type: 'Number',
                nullable: false
            },
            // {
            //     target: 'platNumber',
            //     type: 'String',
            //     nullable: false
            // },
            // {
            //     target: 'attachment',
            //     type: 'String',
            //     nullable: true
            // },
            // {
            //     target: 'licenses',
            //     type: 'String',
            //     nullable: false
            // },
            // {
            //     target: 'VIN',
            //     type: 'String',
            //     nullable: false
            // },
            // {
            //     target: 'brand',
            //     type: 'String',
            //     nullable: false
            // },
            // {
            //     target: 'cabinType',
            //     type: 'String',
            //     nullable: true
            // },
            // {
            //     target: 'inspaction',
            //     type: 'String',
            //     nullable: false
            // },
            // {
            //     target: 'yom',
            //     type: 'String',
            //     nullable: false
            // },
            // {
            //     target: 'model',
            //     type: 'String',
            //     nullable: false
            // },
            // {
            //     target: 'exploitation',
            //     type: 'String',
            //     nullable: true
            // },
            // {
            //     target: 'info',
            //     type: 'String',
            //     nullable: true
            // },
            // {
            //     target: 'depoid',
            //     type: 'Number',
            //     nullable: false
            // },
        ];
    }
    async validate() {
        this.model.map(async item => {
            const isValid = await this.validation(item.target, item.type, item.nullable);
            if (isValid && isValid.length) {
                return isValid;
            }
        });
        return { errors: this.errors };
    };

    async validation(target, type, nullable) {
        const targetType = typeof(this.validationModel[target]);
        if (!this.validationModel[target] && ( (targetType === null) && !nullable )) {
            return this.errors.push(`${target} can not be null or undefined`);
        } else if (targetType !== type.toLowerCase()) {
            return this.errors.push(`type of ${target} must be a ${type}`);
        }
        return this.errors;
    };
};