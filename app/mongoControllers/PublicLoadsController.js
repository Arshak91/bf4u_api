const PublicLoad = require('../mongoModels/PublicLoadModel');

exports.getAll = async (req, res) => {
    
    try {
        let page = req.query.page ? Math.max(0, req.query.page*1) : Math.max(0, 1);
        let perPage = req.query.limit ? req.query.limit*1 : 10;        
        PublicLoad.find().sort('_id').limit(perPage).skip(perPage * (page - 1))
            .then(async (publicLoads) => {
               let ct = await PublicLoad.countDocuments();
               console.log(ct);
                res.json({
                    status: 1,
                    msg: 'ok',
                    data: {
                        loads: publicLoads,
                        total: ct
                    }
                });
            });
    } catch (error) {
        res.json({error});
    }
};

exports.getOne = async (req, res) => {
    try {
        let publicLoadId = req.params.id;
        const publicLoad = await PublicLoad.findOne({
            ID: publicLoadId
        });
        res.json({
            status: 1,
            msg: 'ok',
            data: publicLoad
        });
        
    } catch (error) {
        res.json({error, msg: 'such publicLoad doesn\'t exist'});
    }
};