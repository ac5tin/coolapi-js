const fs = require('fs');
const readline = require('readline');
const Crawler = require('crawler');
const puppeteer = require('puppeteer');
const { google } = require('googleapis');

// google api
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly'];
const TOKEN_PATH = 'token.json';
// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), createdrive);
});

const authorize =(credentials, callback)=>{
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
  
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getAccessToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
}


const getAccessToken = (oAuth2Client, callback)=>{
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
}

let drive = null;
const createdrive = auth => drive = google.drive({version: 'v3', auth});





// crawler
const c = new Crawler({maxConnections: 10});

const crawlerPromise = (options,type)=>(
    new Promise((resolve,reject)=>{
        options.callback = (err,res,done)=>{
            if(err){reject(err);}
            else{
                resolve(res.$(type).text());
            }
            done();
        }
        c.queue(options);
    })
)

const singlePageData = async uri=>{
    return await crawlerPromise({uri:uri},'body')
        .then(res=>(res))
        .catch(err=>console.log(err));
}



/** scrape contents of page */
const scrape_gvid = async url =>{
    const browser = await puppeteer.launch({
        headless:true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/usr/bin/google-chrome'
    });
    const userAgent = 'Mozilla/5.0 (X11; Linux x86_64)' + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
    
    const page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.goto(url);
    // inject jquery to access dynamically created elements
    await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.2.1.min.js'});
    await page.waitForSelector('img[alt*=".mp4"]')
    const frames = await page.frames();
    await page.waitForSelector('iframe')
    await page.click('img[alt*=".mp4"]')
    await page.waitFor(2000);
    // wait for video player iframe to load
    let vidframe = null;
    for(let frame of page.mainFrame().childFrames()){
        if(frame.name().includes('video')){
            vidframe = frame;
        }
    }

    //const result = await page.evaluate(()=>document.querySelector('video').getAttribute('src'))
    /*
    const result = await page.evaluate(()=> {
        window.$('img').click();
        return window.$(window.$('iframe')[0]).contents();
    });
    */
   const result = await vidframe.evaluate(()=> document.querySelector('video').getAttribute('src'));
   

    await browser.close();
    return result;
    
}


module.exports = {
    /** crawls single page */
    async singlePage(req,res){
        if(req.query.url){
            try{
                const url = req.query.url;
                res.status(200).send(await singlePageData(url));
            }catch(e){return res.status(400).send({'error':'could not fetch data from url'})}
            
        }else{
            res.status(400).send({'error':'please enter a valid url'});
        }
        
    },

    gvid: async (req,res)=>{
        if(req.query.url){
            try{
                const url = req.query.url;

                scrape_gvid(url).then(v => {
                    res.status(200).send(v);
                });
                
                //return res.status(200).send(await scrape_gvid(url));
            }catch(e){console.log(e);return res.status(400).send({'error':'could not fetch data from url'})}
        }else{
            res.status(400).send({'error':'please enter a valid url'});
        }
    },
    fetch_gdrive_file: (req,res)=>{
        const id = req.query.id;
        const ext = req.query.ext; // file extension (e.g. mp4, opus, mp3)

        let ctype = '';
        switch(ext){
            case 'mp3':
                ctype =  'audio/mpeg';
                break;
            case 'opus':
                ctype = 'audio/opus';
                break;
            case 'mp4':
                ctype = 'video/mp4';
                break;
            default:
                ctype = 'application/octet-stream';
                break;
        }

        res.setHeader('Content-Type',ctype);
        try{
            return drive.files.get({fileId: id,alt:'media'},{responseType:'stream'}, (err,resp)=>
                resp.data.pipe(res)
            )
        }catch(err){console.log(err);return res.status(400).send({'error':'could not fetch file'})}
        
    }
}

