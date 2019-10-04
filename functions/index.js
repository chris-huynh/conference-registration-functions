const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

admin.initializeApp();

const config = {
  apiKey: "AIzaSyCo-zZVlqtxaBsBSgmAa7IA2u3oNP1_dpM",
  authDomain: "conference-registration-96fee.firebaseapp.com",
  databaseURL: "https://conference-registration-96fee.firebaseio.com",
  projectId: "conference-registration-96fee",
  storageBucket: "conference-registration-96fee.appspot.com",
  messagingSenderId: "965368768984",
  appId: "1:965368768984:web:d31ee464a0b5592acc6aad",
  measurementId: "G-PGBB9P9EP7"
};

const firebase = require('firebase');
firebase.initializeApp(config);

const db = admin.firestore();

app.get('/workshops', (request, response) => {
  db().collection('workshops').get()
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

app.post('/workshop', (request, response) => {
  const newWorkshop = {
    session: request.body.session,
    workshopTitle: request.body.workshopTitle,
    maxCapacity: request.body.maxCapacity,
    students: request.body.students,
    currentCapacity: request.body.currentCapacity,
    workshopDescription: request.body.workshopDescription,
    presenterName: request.body.presenterName
  };

  db()
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

const isEmpty = (string) => {
  return string.trim() === '';
};

const isEmail = (email) => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return email.match(emailRegEx);
};

//signup route
app.post('/signup', (request, response) => {
  let errors = {};
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    confirmPassword: request.body.confirmPassword,
    firstName: request.body.firstName,
    lastName: request.body.lastName
  };
  //Checks to see if email is valid, passwords match, and they both have characters in them
  if (isEmpty(newUser.email)) {
    errors.email = 'Must not be empty';
  } else if (!isEmail(newUser.email)) {
    errors.email = 'Must be a valid email address';
  }
  if (isEmpty(newUser.password)) {
    errors.password = 'Must not be empty';
  }
  if (newUser.password !== newUser.confirmPassword) {
    errors.password = 'Passwords must match';
  }

  if (Object.keys(errors).length > 0) return response.status(400).json(errors);

  //TODO: validate data
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
});

app.post('/login', (request, response) => {
  let errors = {};
  const user = {
    email: request.body.email,
    password: request.body.password
  };

  if (isEmpty(user.email)) errors.email = "Must not be empty";
  if (isEmpty(user.password)) errors.password = "Must not be empty";
  if (Object.keys(errors).length > 0) return response.status(400).json(errors);

  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    }).then(token => {
    return response.json({token});
  })
    .catch(error => {
      console.error(error);
      if(error.code === 'auth/wrong-password') {
        return response.status(403).json({ general: 'Wrong credentials, please try again'});
      } else {
        return response.status(400).json({error: error});
      }
    });
});

exports.api = functions.https.onRequest(app);