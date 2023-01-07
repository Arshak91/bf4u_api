const ErrorMessagesService = require('./errors');

class ValidationPipe {
    string = () => ( { type: 'string' } );
    number = () => ( { type: 'number' } );
    array = () => ( { type: 'array' } );
    object = () => ( { type: 'object' } );
    minLength = (length) => ( { minLength: length } );
    maxLength = (length) => ( { maxLength: length } );
    empty = (arr) => ( { isEmpty: !!arr.length } );
    allow = (allowList) => ( { allow: allowList } );
    nullabe = () => ( { nullable: true } );
};

module.exports = class Validation {
    get is () {
        return new ValidationPipe();
    }

    validate =  async (model, body) => {
        const errors = [];
        Object.keys(model).forEach(item => {
            model[item].forEach(types => {
                Object.keys(types).forEach(value => {
                    switch (value) {
                        case "type":
                            if (!this.isAllowType(body[item], types[value])) {
                                return errors.push(ErrorMessagesService.wrongFieldType(item, types[value]));
                            }
                            break;
                        case "array":
                            if (!this.isArrayType(body[item])) {
                                return errors.push(ErrorMessagesService.wrongFieldType(item, types[value]));
                            };
                            break;
                        case "minLength":
                            if (!this.isValidMinLength(body[item], types[value])) {
                                return errors.push(ErrorMessagesService.wrongMinLength(item, types[value]));
                            };
                            break;
                        case "maxLength":
                            if (!this.isValidMaxLength(body[item], types[value])) {
                                return errors.push(ErrorMessagesService.wrongMaxLength(item, types[value]));
                            };
                            break;
                        case "isEmpty":
                            if (!this.isEmptyArray(body[item])) {
                                return errors.push(ErrorMessagesService.canNotBeEmpty(item));
                            };
                            break;
                        case "allow":
                            if (!this.isValidAllowList(types[value], body[item])) {
                                return errors.push(ErrorMessagesService.wrongFieldType(item, typeof(body[types])));
                            };
                            break;
                            case "nullable":
                                if (!this.isNullable(types[value], body[item])) {
                                    return errors.push(ErrorMessagesService.wrongFieldType(item, typeof(body[types])));
                                };
                                break;
                        default:
                            break;
                    }
                });
            });
        });
        return { errors };
    };

    isAllowType = (key, value) =>{
        const x = typeof(key) === value;
        return x
    };
    isArrayType = (value) => ( Array.isArray(value) );
    isValidMinLength = (key, value) => {
        if ((typeof(key) === 'string' || this.isArrayType(key)) && key.length <= value) {
            return false
        } else return true
    };
    isValidMaxLength = (key, value) => {
        if ((typeof(key) === 'string' || this.isArrayType(key)) && key.length >= value) {
            return false
        } else return true
    };
    isEmptyArray = (key) => ( this.isArrayType(key) && key.length > 0 );
    isValidAllowList = (list, value) => (list.includes(value));

    isNullable = (model, value) => {
        const { key, keyValue } = model;
        let canBeNull = false;
        return canBeNull;
    };
};