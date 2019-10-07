const { db } = require('../util/admin');

const config = require('../util/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const {validateSignUpData, validateLoginData} = require('../util/validators');

exports.signUp= (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        firstName: request.body.firstName,
        lastName: request.body.lastName
    };

    const { valid, errors} = validateSignUpData(newUser);

    if(!valid) return response.status(400).json({errors});

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

exports.login = (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    };

    const { valid, errors} = validateLoginData(user);

    if(!valid) return response.status(400).json({errors});

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