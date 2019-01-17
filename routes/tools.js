const express = require('express');
const router = express.Router();

// import controllers
const toolsController = require('../controllers').tools;


// -- random password generator --
/*
router.get('/pw', function(req, res, next) {
    res.status(200).send({message:"hi"});
});
*/

router.get('/pw',toolsController.pwGen);
router.get('/ip',toolsController.userIpAddr);
router.get('/pokemon',toolsController.pokemonInfo); // still not ready yet



router.get('/',(req,res,next)=>{
    res.status(200).send({
        "commands":["pw","ip"]
    });
});

module.exports = router;
