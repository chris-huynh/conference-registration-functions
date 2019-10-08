const functions = require('firebase-functions');
const express = require('express');
const app = express();

const FBAuth = require('./util/fbAuth');

const { getAllWorkshops, postWorkshop } = require('./handlers/workshop');
const { signUp, login, uploadImage } = require('./handlers/users');

//workshop routes
app.get('/workshops', getAllWorkshops);
app.post('/workshop', FBAuth, postWorkshop);

//register and login routes
app.post('/signup', signUp);
app.post('/login', login);

app.post('/user/image', FBAuth, uploadImage);

exports.api = functions.https.onRequest(app);