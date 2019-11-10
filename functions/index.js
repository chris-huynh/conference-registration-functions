const functions = require('firebase-functions');
const express = require('express');
const app = express();

const FBAuth = require('./util/fbAuth');
// , registerForWorkshop
const { getAllWorkshops, postWorkshop, getWorkshop, registerForWorkshop, unregisterForWorkshop, uploadWorkshopImage } = require('./handlers/workshop');
const { signUp, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users');
const { getAllProducts, postProduct, getProduct } = require('./handlers/products');

//workshop routes
app.get('/workshops', getAllWorkshops);
app.post('/workshop', FBAuth, postWorkshop);
app.get('/workshop/:workshopId', getWorkshop);
app.post('/workshop/:workshopId/register', FBAuth, registerForWorkshop);
//TODO Delete workshop
app.post('/workshop/:workshopId/drop', FBAuth, unregisterForWorkshop);
app.post('/workshop/:workshopId/image', FBAuth, uploadWorkshopImage);

//product routes
app.get('/products', FBAuth, getAllProducts);
app.post('/product', postProduct);
app.get('/product/:productId', FBAuth, getProduct);

//register and login routes
app.post('/signup', signUp);
app.post('/login', login);

app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);