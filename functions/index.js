const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});

exports.getWorkshops = functions.https.onRequest((request, response) => {
    admin.firestore().collection('workshops').get()
        .then(data => {
            let workshops = [];
            data.forEach(doc => {
                workshops.push(doc.data());
            });
            return response.json(workshops)
        })
        .catch(error => console.error(error))
});

exports.createWorkshop = functions.https.onRequest((request, response) => {
    if (request.method !== 'POST') {
        return response.status(400).json({error: 'Method not allowed'})
    }
    const newWorkshop = {
        session: request.body.session,
        workshopTitle: request.body.workshopTitle,
        maxCapacity: request.body.maxCapacity,
        students: request.body.students,
        currentCapacity: request.body.currentCapacity,
        workshopDescription: request.body.workshopDescription,
        presenterName: request.body.presenterName
    };

    admin.firestore()
        .collection('workshops')
        .add(newWorkshop)
        .then(doc => {
            response.json({message: 'document ${doc.id} successfully created'});
        })
        .catch((error) => {
            response.status(500).json({error: 'Something went wrong.'});
            console.error(error)
        });
});