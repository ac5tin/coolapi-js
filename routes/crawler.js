const express = require('express');
const router = express.Router();

// import controllers
const crawlerController = require('../controllers').crawler;


// crawl data from a single url
router.get('/single',crawlerController.singlePage);
router.get('/gdrive/video',crawlerController.gvid);
router.get('/gdrive/file',crawlerController.fetch_gdrive_file);

router.get('/gdrive',(req,res,next)=>res.status(200).send({
    'commands':['file']
}))


router.get('/',(req,res,next)=>{
    res.status(200).send({
        "commands":["single",'gdrive']
    });
});

module.exports = router;
