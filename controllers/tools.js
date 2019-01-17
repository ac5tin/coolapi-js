const pwGenerator = require('generate-password-browser');
const axios = require('axios');

module.exports = {
    /** generates password */
    pwGen(req,res){
        let length = 6; // default length is 6
        let array = 1; // default is 1 = just return single pw and not an array
        let numbers = "f"; // default is to not include numbers
        let lc = "f"; // lower-case only switch (default is OFF)
        
        // ensure user has entered a valid int , else use def value
        try{
            length = Math.abs(parseInt(req.query.length));
            if(!length >= 1)length = 6;
        }catch(err){length = 6;}

        // make sure user entered an int, else use def value
        try{
            array = Math.abs(parseInt(req.query.array));
            if(!array >= 1)array = 1;
        }catch(err){array = 1;}

        // make sure user entered only t or f, else use def value

        // alt way of doing this
        // if req === "t" then user "t", any other case/input would mean "f"
        // define number as default value f
        // only change value to "t" if user entered "t" correctly
        
        /* let numbers = "f";
         * if req.query.numbers === "t" then numbers = "t"
        */
        try{
            numbers = req.query.numbers;
            
            if(numbers != "t" && numbers != "f")numbers = "f";
        }catch(err){numbers = "f";}


        // make sure user entered only t or f , else use def value
        try{
            lc = req.query.lc;
            if(lc != "t" && lc != "f")lc = "f";
        }catch(err){lc = "f";}


        let retPw = [];
        

        // return array if array>1
        if(array > 1){
            for(let i=0;i<array;i++){
                retPw.push(newpw(length,numbers,lc));
            }
        }else{retPw = newpw(length,numbers,lc);}

        return res.status(200).send(req.query.json === 'true' ? {'password':retPw} : retPw);
    },
    /** return request user ip address */
    userIpAddr(req,res){
        try{
            //const ipaddress = String(req.ip).slice(7);
            const ipaddress = req.headers['x-forwarded-for'];
            return res.status(200).send(req.query.json === 'true' ? {'ip':ipaddress} : ipaddress);
        }catch(err){return res.status(400).send({'error':'unable to find ip address'});}
    },
    /** return pokemon info */
    async pokemonInfo(req,res){
        try{
            // fetch json data from pokeapi 
            const pokedata = await pokejson(req.query.name || 'ditto'); // default pokemon = ditto
            // return abilities, moves, forms,types,moves
            let retme = {};
            // -- abilities --
            retme.abilities = [];
            // form = ['a','b','HA-c'] ; append HA to front of ability name if ha
            pokedata.abilities.forEach(ab =>{
                retme.abilities.push(ab.is_hidden ? '[HA] '+ ab.ability.name : ab.ability.name);
            });

            
            return res.status(200).send(retme);

        }catch(err){console.log(err);return res.status(400).send({'error':'cannot find data for this pokemon'})}
    },
}

/** generates random password
 * @params length of the password (int)
 * @params should the password include numbers (String "t" or "f" )
 * @params whether the password should contain lowercase only (String "t" or "f")
 * @return a String password 
 */
const newpw = (length,numbers,lc) => pwGenerator.generate({
    length,
    numbers: numbers === "t",
    uppercase: lc === "f"
});


/** fetch entire json from pokeAPI */
const pokejson = async pokemon =>{
    try{
       const pokemonData = await axios.get('http://pokeapi.salestock.net/api/v2/pokemon/'+pokemon);
       return pokemonData.data;
    }catch(err){console.log(err);return err};
}
