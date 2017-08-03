'use strict';

const mongoose = require('mongoose');
require('dotenv').config();
// production
// const db = mongoose.connect(process.env.DB); 

// localdev
const db = mongoose.connect(process.env.localDB);

// Attach lister to connected event
mongoose.connection.once('connected', () => {
	console.log('Connected to database');
});

// Expose the db connection
module.exports = db;