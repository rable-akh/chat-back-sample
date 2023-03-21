const { default: mongoose } = require('mongoose');
const userChat = require('../model/userChat');

module.exports.saveMessage = (message) => {
    const members = [new mongoose.Types.ObjectId(message.to), new mongoose.Types.ObjectId(message.id)]
    return new Promise( async function(reslove, reject) {
        const count = await userChat.findOne({
            $match: {
                "members": {
                    $all: members
                }
            }
        }).count();
        if(count > 0){
            userChat.updateOne({
                $match: {
                    "members": {
                        $all: members
                    }
                }
            },
            {
                $push: {
                    message: message
                }
            })
            .then((doc) => {
                reslove(doc);
            }).catch((err) => {
                reject(err);
            })
        } else {
            userChat.create(
                {
                    members: members,
                    message: [message]
                })
            .then((doc) => {
                reslove(doc);
            }).catch((err) => {
                reject(err);
            })
        }
        
    })
}

module.exports.getUserMesages = (message) => {
    console.log(message);
    const members = [new mongoose.Types.ObjectId(message.to), new mongoose.Types.ObjectId(message.id)]
    return new Promise( async function(reslove, reject) {
        userChat.aggregate([
            {
                $match: {
                  "members": {
                    "$all": members
                  }
                },
            },
            {
                /**
                 * Provide any number of field/order pairs.
                 */
                $sort: {
                  "createdAt": -1
                }
            },
            {
                /**
                 * path: Path to the array field.
                 * includeArrayIndex: Optional name for index.
                 * preserveNullAndEmptyArrays: Optional
                 *   toggle to unwind null and empty values.
                 */
                $unwind: {
                  path: "$message",
                }
            },
            {
                /**
                 * specifications: The fields to
                 *   include or exclude.
                 */
                $project: {
                    "_id": 0,
                    "message": 1
                }
            },
            {
                /**
                 * Provide any number of field/order pairs.
                 */
                $sort: {
                  "message.created_at": -1
                }
            },
            {
                /**
                 * outputFieldN: The first output field.
                 * stageN: The first aggregation stage.
                 */
                $facet: {
                    data: [ 
                        {$skip: 0},
                        {$limit: 20} 
                    ],
                    totalcount: [
                        {$count: "count"}
                    ]
                }
            }
        ]).exec()
        .then((doc) => {
            reslove(doc[0]);
        }).catch((err) => {
            reject(err);
        })
    })
}
