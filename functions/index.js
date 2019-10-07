const functions = require('firebase-functions');
const express = require('express');
const app = express();

const FBAuth = require('./util/fbAuth');

const { getAllWorkshops, postWorkshop } = require('./handlers/workshop');
const { signUp, login } = require('./handlers/users');

//workshop routes
app.get('/workshops', getAllWorkshops);
app.post('/workshop', FBAuth, postWorkshop);

//register and login routes
app.post('/signup', signUp);
app.post('/login', login);

exports.api = functions.https.onRequest(app);