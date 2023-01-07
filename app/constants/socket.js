exports.socketHandler = {
    connection: "connection",
    notification: "notification",
    algoNotification: "algoNotification",
    uploadNotification: "uploadNotification",
    emitDisconnect: "reconnect",
    disconnect: "disconnect",
    sequenceNotification: "sequenceNotification"
};

exports.notificationType = {
    autoplan: 1,
    load: 2,
    order: 3,
    1: 'autoplan',
    2: 'load',
    3: 'order'
}