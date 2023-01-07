class ErrorMessagesService {
    requiredField = (msg) => ( msg + ' is required' );
    wrongFieldType = (key, type) => ( key + ' must be a ' +type );
    existItem = (key, existField) => ( key + `with given ${existField} already exists ` );
    wrongMinLength = (key, existLength) => ( 'the minimum length of the ' + key + ' must be ' + existLength );
    wrongMaxLength = (key, existLength) => ( 'the maximum length of the ' + key + ' must be ' + existLength );
    canNotBeEmpty = (key) => ( key + 'can not be empty' );
    requestFailed = () => ( 'Something went wrong' );
    wrong = (field, value) => ( `Wrong ${field} ${value}` );
    globalError = () => ( 'Something went wrong' );
};

module.exports = new ErrorMessagesService();