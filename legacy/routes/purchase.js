const express = require('express');

const {create, readall, readId, update, deleteId} = require('../controller/purchase')

const multer = require('multer');


const router = express.Router();

// set up multer storage for file uploads
// const storage = multer.memoryStorage();
// const upload = multer({storage});


router.post(
	'/create',
    
    create
);

router.get(
    '/',
    readall
);
router.get(
	'/:id',
    // verifyToken,
    readId
);
router.put(
    '/:id',
    // verifyToken,
    update
);
router.delete(
    '/:id',
    // verifyToken,
    deleteId
);


module.exports = router;