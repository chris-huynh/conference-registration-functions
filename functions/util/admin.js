const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

module.exports = { admin, db, FieldValue };