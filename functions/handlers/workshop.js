const {db} = require('../util/admin');
//Retrieve all workshops
exports.getAllWorkshops = (request, response) => {
    db.collection('workshops').get()
        .then(data => {
            let workshops = [];
            data.forEach(doc => {
                workshops.push({
                    workshopId: doc.id,
                    session: doc.data().session,
                    workshopTitle: doc.data().workshopTitle,
                    maxCapacity: doc.data().maxCapacity,
                    workshopDescription: doc.data().workshopDescription,
                    presenterName: doc.data().presenterName
                });
            });
            return response.json(workshops)
        })
        .catch(error => console.error(error))
};
//Create a workshop
exports.postWorkshop = (request, response) => {
    const newWorkshop = {
        session: request.body.session,
        workshopTitle: request.body.workshopTitle,
        maxCapacity: request.body.maxCapacity,
        workshopDescription: request.body.workshopDescription,
        presenterName: request.body.presenterName
    };
    const roster = {
        maxCapacity: request.body.maxCapacity,
        workshopId: null,
        students: []
    };
    db
        .collection('workshops')
        .add(newWorkshop)
        .then(doc => {
            roster.workshopId = doc.id;
            db.collection('rosters').add(roster).then(rosterDoc => {
                response.json({message: `document ${doc.id} successfully created | ${rosterDoc.id}`});
            });
        })
        .catch((error) => {
            console.error(error);
            return response.status(500).json({error: 'Something went wrong.'});
        });
};

addRoster = (workshopId, roster, response) => {
    roster.workshopId = workshopId;
    db.collection('rosters').add(roster)
        .then(doc => {
            response.message.push(`roster ${doc.id} successfully created`)
        })
        .catch((error) => {
            console.error(error);
            return response.status(500).json({error: 'Something went wrong'});
        })
};
//Get one workshop
exports.getWorkshop = (request, response) => {
    let workshopData = {};
    db.doc(`workshops/${request.params.workshopId}`).get()
        .then(doc => {
            if(!doc.exists){
                return response.status(404).json({error: "Workshop not found"})
            }
            workshopData = doc.data();
            workshopData.workshopId = doc.id;
            return db.collection('rosters').where('workshopId', '==', request.params.workshopId).get()
        })
        .then(data => {
            workshopData.roster = [];
            data.forEach(doc => {
                workshopData.roster.push(doc.data())
            });
            return response.json(workshopData)
        })
        .catch(error => {
            console.error(error);
            response.status(500).json({error: error.code});
        })
};
//Sign up for workshop Get roster for workshop, check to see if roster is full
// exports.registerForWorkshop = (request, response) => {
//     let workshopRoster = [];
//     db.doc(`rosters`).where('workshopId', '==', request.params.workshopId).get()
//         .then(data => {
//             data.forEach(doc => {
//                 workshopRoster.push(doc.data());
//             });
//             workshopRoster.push(request.user.email);
//             return workshopRoster;
//         })
//         .then(data => {
//             //Add document to collection
//             db.collection('rosters').set(data)
//                 .then((data) => {
//                     response.json({message: `Roster ${data.id} successfully updated. User ${request.user.email} successfully registerd`})
//                 })
//                 .catch((error) => {
//                     console.error(error);
//                     response.status(500).json({error: error.code})
//                 })
//         })
//         .catch(error => {
//             console.error(error);
//             response.status(500).json({error: error.code})
//         })
// };