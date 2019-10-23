const {admin, db, FieldValue} = require('../util/admin');
const config = require('../util/config');
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
                    presenterName: doc.data().presenterName,
                    imageUrl: doc.data().imageUrl
                });
            });
            return response.json(workshops)
        })
        .catch(error => console.error(error))
};
//Create a workshop
exports.postWorkshop = (request, response) => {
    const defaultImg = 'no-img.png';
    const newWorkshop = {
        session: request.body.session,
        workshopTitle: request.body.workshopTitle,
        maxCapacity: request.body.maxCapacity,
        workshopDescription: request.body.workshopDescription,
        presenterName: request.body.presenterName,
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${defaultImg}?alt=media`,
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
//Sign up for workshop
//TODO Write workshop id to users' credentials
exports.registerForWorkshop = (request, response) => {
    db.doc(`workshops/${request.params.workshopId}`).get()
        .then(doc => {
            if (doc.data().students.length >= doc.data().maxCapacity) {
                return response.status(403).json({error: "Workshop is full"})
            }
            const workshopSession = doc.data().session - 1;
            let schedule;
            db.doc(`users/${request.user.email}`).get()
                .then(userDoc => {
                    schedule = userDoc.data().workshop;
                    // if the student is not signed up for a workshop during that session, add it to the student's schedule and add them to the workshop's roster
                    if (schedule[workshopSession].length === 0) {
                        schedule[workshopSession] = doc.id;
                        db.doc(`users/${request.user.email}`).update({workshop: schedule})
                            .then(() => {
                                db.doc(`workshops/${request.params.workshopId}`).update({students: FieldValue.arrayUnion(request.user.email)})
                                    .then(() => {
                                        return response.status(201).json({message: `${request.user.email} successfully registered for workshop`})
                                    });
                            })
                    }
                    else {
                        return response.status(403).json({ error: "User is already registered for a workshop. Please drop from workshop before signing up"})
                    }
                });
        })
        .catch(error => {
            console.error(error);
            response.status(500).json({error: error.code})
        })
};
//TODO add logic in to check if user is signed up for a workshop, then proceed with both removals
exports.unregisterForWorkshop = (request, response) => {
    db.doc(`workshops/${request.params.workshopId}`).get()
        .then(doc => {
            //If user email is not registered/found for the workshop, return 404
            if (!doc.data().students.includes(request.user.email)) {
                return response.status(404).json({message: `${request.user.email} not found in workshop`})
            }
            const workshopSession = doc.data().session - 1;
            let schedule;
            db.doc(`users/${request.user.email}`).get()
                .then(userDoc => {
                    //Remove workshop from user's profile
                    schedule = userDoc.data().workshop;
                    schedule[workshopSession] = "";
                    db.doc(`users/${request.user.email}`).update({workshop: schedule})
                        .then(() =>{
                            //remove student from workshop's roster
                            db.doc(`workshops/${request.params.workshopId}`).update({students: FieldValue.arrayRemove(request.user.email)})
                                .then(() => {
                                    return response.status(200).json({message: `${request.user.email} successfully dropped from workshop`})
                                });
                        })
                });
        })
        .catch(error => {
            console.error(error);
            response.status(500).json({error: error.code})
        })
};

exports.uploadWorkshopImage = (request, response) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({headers: request.headers});

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return response.status(400).json({error: 'File not supported, please upload a .jpeg or .png file'});
        }
        const imageExtension = filename.split('.').pop();
        imageFileName = `${Math.round(Math.random() * 100000000000)}.${imageExtension}`;
        const filePath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {filePath, mimetype};
        file.pipe(fs.createWriteStream(filePath));
    });
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filePath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
            .then(() => {
                const imageURL = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/workshops/${request.params.workshopId}`).update({imageURL});
            })
            .then(() => {
                return response.json({message: 'Image successfully uploaded'});
            })
            .catch((error) => {
                console.error(error);
                return response.status(500).json({error: error.code})
            })
    });
    busboy.end(request.rawBody);
};