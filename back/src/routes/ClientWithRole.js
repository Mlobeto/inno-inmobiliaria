const express = require('express');
const addPropertyToClientController = require('../controllers');
const router = express.Router();


router.post('/addRole',addPropertyToClientController.addPropertyToClientWithRole);


module.exports = router;