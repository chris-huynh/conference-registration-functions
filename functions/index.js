const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const express = require('express');
const app = express();

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

app.get('/workshops', (request, response) => {
    admin.firestore().collection('workshops').get()
        .then(data => {
            let workshops = [];
            data.forEach(doc => {
                workshops.push({
                    workshopId: doc.id,
                    session: doc.data().session,
                    workshopTitle: doc.data().workshopTitle,
                    maxCapacity: doc.data().maxCapacity,
                    students: doc.data().students,
                    currentCapacity: doc.data().currentCapacity,
                    workshopDescription: doc.data().workshopDescription,
                    presenterName: doc.data().presenterName
                });
            });
            return response.json(workshops)
        })
        .catch(error => console.error(error))
});

app.post('/workshop',(request, response) => {
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
            response.json({message: `document ${doc.id} successfully created`});
        })
        .catch((error) => {
            response.status(500).json({error: 'Something went wrong.'});
            console.error(error)
        });
});

exports .api = functions.https.onRequest(app);