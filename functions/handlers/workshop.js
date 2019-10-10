const {db} = require('../util/admin');

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
                    students: doc.data().students,
                    workshopDescription: doc.data().workshopDescription,
                    presenterName: doc.data().presenterName
                });
            });
            return response.json(workshops)
        })
        .catch(error => console.error(error))
};

exports.postWorkshop = (request, response) => {
    const newWorkshop = {
        session: request.body.session,
        workshopTitle: request.body.workshopTitle,
        maxCapacity: request.body.maxCapacity,
        students: request.body.students,
        workshopDescription: request.body.workshopDescription,
        presenterName: request.body.presenterName
    };

    db
        .collection('workshops')
        .add(newWorkshop)
        .then(doc => {
            response.json({message: `document ${doc.id} successfully created`});
        })
        .catch((error) => {
            console.error(error);
            return response.status(500).json({error: 'Something went wrong.'});
        });
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