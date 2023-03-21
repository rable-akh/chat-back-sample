const usersMod = require("../model/user");
const userRoomMod = require("../model/userRoom");


module.exports.list = (params) => {
    return new Promise(async function (reslove, reject) {
        usersMod.find(data, async function (err, res) {
            if (err) {
                reject(err);
            } else {
                reslove(data);
            }
        });
    });
};

module.exports.add = (params) => {
    return new Promise(async function (reslove, reject) {
        usersMod.create(params);
    });
};

module.exports.roomAdd = (params) => {
    return new Promise(async function (reslove, reject) {
        userRoomMod.create(params);
    });
};