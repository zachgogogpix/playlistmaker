'use strict';

var https = require("https");
var http = require("http");

const AWS = require('aws-sdk');
const qs = require('querystring');
var mysql = require('mysql');
const kmsEncryptedToken = process.env.kmsEncryptedToken;
let token = 'mR7G3xpKjlYgkU2HwzHDrarG';


var DraftOption = {
    host: '54.185.140.188',
    path: '/maker/api/draftPlaylist',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'token': 'cbc5bfb8-7ae6-4e08-a4b0-05d17c171be7'
    }
};



function processEvent(event, callback) {
    const params = qs.parse(event.body);
    const requestToken = params.token;
    /*
    if (requestToken !== token) {
        console.error(`Request token (${requestToken}) does not match expected`);
        return callback('Invalid request token');
    }
    */
    const user = params.user_name;
    const command = params.command;
    const channel = params.channel_name;
    const commandText = params.text;
    var pretty = '';
    
    //const commandText = 'Radiohead';
    if (commandText === 'help'){
        pretty = 'Type the command /playlistmaker and the artist or band name using capitalization, i.e. /playlistmaker Imagine Dragons. \n Feel free to contact us at z@theplaylistradio.com for more support.'
                
                var response = {
                    text: pretty
                };

                callback(null,response);
        return;
    }

    //Call the setlist.fm with the commandText as the artist and return the output to slack.
    var query = {artistName : commandText};


    
    var makerSongArr = [];

    var playlistID = 0;
    var spotifypy_id ='';

    //Make a draft playlist so I could get back a playlist id;
    var body1 = {
        "playlistName": commandText + " Playlist",
        "notes": "",
        "songs": []
    };
    var output4 = '';
    var playlistID = 0;
    var req4 = http.request(DraftOption, function(res4) {
        console.log(DraftOption.host + ':' + res4.statusCode);
        console.log('STATUS: ' + res4.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res4.headers));
        res4.setEncoding('utf8');

        res4.on('data', function (chunk) {
            console.log('DATA: ' + chunk);
            output4 += chunk;
            var obj4 = JSON.parse(output4);
            playlistID = obj4.data;
            //console.log(obj4.data);

        });
    });
    req4.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
    req4.write(JSON.stringify(body1));
    req4.end();



    var userInput = commandText;
    if (userInput.includes(" ")){
        userInput = userInput.replace(/\s+/g, "+")
        }
    var MAKeRoptions = {
        host: '54.185.140.188',
        path: '/maker/api/searchSong?searchString='+ userInput + '&pageNo=0&rowSize=20',
        method: 'GET',
        headers: {
            'token': 'cbc5bfb8-7ae6-4e08-a4b0-05d17c171be7'
        }
    };

    // it searches for the artist that the user entered 
    var req3 = http.request(MAKeRoptions, function(res3)
    {
        var output3 = '';
        console.log(MAKeRoptions.host + MAKeRoptions.path+':' + res3.statusCode);
         console.log('STATUS: ' + res3.statusCode);
        // console.log('HEADERS: ' + JSON.stringify(res3.headers));
        // res3.setEncoding('utf8');

        res3.on('data', function (chunk) {
            console.log('DATA: ' + chunk);
            output3 += chunk;
        });

        res3.on('end', function() {
            var obj3 = JSON.parse(output3);
            var songFound = 0;
            if (obj3.data.length < 5) {
                pretty = 'Oh, bummer. We couldn\'t make a playlist for this Artist. Try again.'
                
                var response = {
                    text: pretty
                };

                callback(null,response);
                
                req3.end();
                return;
            }
            if (obj3.data.length!=null) {
                for (var i = 0, j = 0; i < obj3.data.length; i++) {
                    var s = obj3.data[i].songName;
                    var a = obj3.data[i].artistName;
                    // check
                    if (a.includes(commandText)) {
                        // output the whole data information of the song
                        console.log(obj3.data[i]);

                        makerSongArr.push(obj3.data[i]);
                    }
                }
            }
            
            
            if (makerSongArr.length < 5) {
                pretty = 'Oh, bummer. We couldn\'t make a playlist for this Artist. Try again.'
                
                var response = {
                    text: pretty
                };

                callback(null,response);
                
                req3.end();
                return;
            }

            var body2 = {
                "playlistName": commandText + " Playlist",
                "notes": "",
                "songs": makerSongArr
            };
            console.log(JSON.stringify(body2));
                        var output5 = '';
            var SubmitOption = {
                host: '54.185.140.188',
                path: '/maker/api/submitPlaylist?id='+playlistID,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': 'cbc5bfb8-7ae6-4e08-a4b0-05d17c171be7'
                }
            };
            var req5 = http.request(SubmitOption, function(res5) {
                console.log(SubmitOption.host + ':' + res5.statusCode);
                console.log('STATUS: ' + res5.statusCode);
                console.log('HEADERS: ' + JSON.stringify(res5.headers));
                res5.setEncoding('utf8');

                res5.on('data', function (chunk) {
                    console.log('DATA: ' + chunk);
                    output5 += chunk;
                    var obj5 = JSON.parse(output5);
                    //console.log(obj4.data);

                });
            });
            req5.on('error', function(e) {
                console.log('problem with request: ' + e.message);
            });
            req5.write(JSON.stringify(body2));

            req5.end();
        });
    });
    req3.end();
    setTimeout(()=>{
        var mysql      = require('mysql');
        var connection = mysql.createConnection({
            host     : '54.185.140.188',
            user     : 'root',
            password : 'P!@yL#&t@19Jun#2018',
            database : 'playlist'
        });

        connection.connect();

        connection.query('SELECT spotify_playlist_id from playlist where id='+playlistID+';', function (error, results, fields) {
            if (error) {
                console.log('The solution is: ', error);
                throw error;
            }
            else{

                pretty += 'Listen to ' + commandText +' Playlist at https://open.spotify.com/playlist/'+results[0].spotify_playlist_id;
                if(results[0].spotify_playlist_id==null){
                    pretty += 'Oh, bummer. We couldn\'t make a playlist for this Artist.Try again.'
                    return;
                }
                var response = {
                    text: pretty
                };

                callback(null,response);
            }
        });

        connection.end();
    }, 800);
}


exports.handler = (event, context, callback) => {
    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? (err.message || err) : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (token) {
        // Container reuse, simply process the event with the key in memory
        processEvent(event, done);
    } else if (kmsEncryptedToken && kmsEncryptedToken !== '<kmsEncryptedToken>') {
        const cipherText = { CiphertextBlob: new Buffer(kmsEncryptedToken, 'base64') };
        const kms = new AWS.KMS();
        kms.decrypt(cipherText, (err, data) => {
            if (err) {
                console.log('Decrypt error:', err);
                return done(err);
            }
            token = data.Plaintext.toString('ascii');
            processEvent(event, done);
        });
    } else {
        done('Token has not been set.');
    }

};