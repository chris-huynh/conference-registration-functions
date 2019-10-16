const {db, FieldValue} = require('../util/admin');
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
        presenterName: request.body.presenterName,
        students: request.body.students
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
            return response.json(workshopData);
        })
        .catch(error => {
            console.error(error);
            response.status(500).json({error: error.code});
        })
};
//Sign up for workshop Get roster for workshop, check to see if roster is full
exports.registerForWorkshop = (request, response) => {
    db.doc(`workshops/${request.params.workshopId}`).get()
        .then(doc => {
            if (doc.data().students.length >= doc.data().maxCapacity) {
                return response.status(403).json({error: "Workshop is full"})
            }
            db.doc(`workshops/${request.params.workshopId}`).update({students: FieldValue.arrayUnion(request.user.email)})
                .then(() => {
                    return response.status(201).json({message: `${request.user.email} successfully registered for workshop`})
                })
        })
        .catch(error => {
            console.error(error);
            response.status(500).json({error: error.code})
        })
};