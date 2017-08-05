const express = require('express');
const router = express.Router();

module.exports = (app) => {

    // Expose them to the rest of the application
    app.use('/', router);

}
