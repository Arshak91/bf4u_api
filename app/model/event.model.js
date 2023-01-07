module.exports = (sequelize, Sequelize) => {
    const Event = sequelize.define('events', {
        loads_id: { type: Sequelize.INTEGER },
        lat:{ type: Sequelize.STRING },
        lon:{ type: Sequelize.STRING },
        event_description:{ type: Sequelize.STRING },
        event_start_time: { type: Sequelize.DATE },
        event_end_time:{ type: Sequelize.DATE },
        duration: { type: Sequelize.FLOAT },
        streetaddress: { type: Sequelize.STRING },
        city: { type: Sequelize.STRING },
        state: { type: Sequelize.STRING },
        zip: { type: Sequelize.STRING },
        country: { type: Sequelize.STRING }

    });
    return Event;
};