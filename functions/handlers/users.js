const {admin, db} = require('../util/admin');

const config = require('../util/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const {validateSignUpData, validateLoginData, reduceUserDetails} = require('../util/validators');
//Sign user in
exports.signUp = (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        firstName: request.body.firstName,
        lastName: request.body.lastName
    };

    const {valid, errors} = validateSignUpData(newUser);

    if (!valid) return response.status(400).json({errors});

    const defaultImg = 'no-img.png';

    let token, userId;
    db.doc(`/users/${newUser.email}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                return response.status(400).json({email: 'This email is already in use'})
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idToken) => {
            token = idToken;
            const userCredentials = {
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                workshops: ["", ""],
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${defaultImg}?alt=media`,
                userId
            };
            return db.doc(`/users/${newUser.email}`).set(userCredentials);
        })
        .then(() => {
            return response.status(201).json({token})
        })
        .catch((error) => {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                return response.status(400).json({email: 'Email is already in use'})
            } else {
                return response.status(500).json({error: error.code});
            }
        });
};
//Log user in
exports.login = (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    };

    const {valid, errors} = validateLoginData(user);

    if (!valid) return response.status(400).json({errors});

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        }).then(token => {
        return response.json({token});
    })
        .catch(error => {
            console.error(error);
            if (error.code === 'auth/wrong-password') {
                return response.status(403).json({general: 'Wrong credentials, please try again'});
            } else {
                return response.status(400).json({error: error});
            }
        });
};

//add user details
exports.addUserDetails = (request, response) => {
    let userDetails = reduceUserDetails(request.body);

    db.doc(`/users/${request.user.email}`).update(userDetails)
        .then(() => {
            return response.json({message: 'Details added successfully'});
        })
        .catch((error) => {
            return response.status(500).json({error: error.code});
        });
};

exports.getAuthenticatedUser = (request, response) => {
    let userData = {};
    db.doc(`/users/${request.user.email}`).get()
        .then(doc => {
            if (doc.exists){
                userData.credentials = doc.data();
                return db.collection('schedules').orderBy('session', 'asc').where('studentEmail', '==', request.user.email).get()
            }
        })
        .then(data => {
            userData.workshopTitles = [];
            data.forEach(doc => {
                userData.workshopTitles.push(doc.data());
            });
            return response.json(userData)
        })
        .catch(error => {
            return response.status(500).json({error: error.code});
        })
};

//Upload a profile image of user
exports.uploadImage = (request, response) => {
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
                return db.doc(`/users/${request.user.email}`).update({imageURL});
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