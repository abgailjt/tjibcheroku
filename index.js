var express = require('express');
var app = express();
var fs = require('fs');  //filesystem
var async = require('async');
var bodyParser = require('body-parser');  //middleware of Express
var through = require('through');  //the basis for most of the synchronous streams in event-stream
var path = require('path');  //The path module provides utilities for working with file and directory paths
require('dotenv').config(); //Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env.

var storj = require('storj-lib');
var storj_utils = require('storj-lib/lib/utils');
var api = 'https://api.storj.io';
var client;
var KEYRING_PASS = 'somepassword';
var keyring = storj.KeyRing('./');

// Storj variables
var STORJ_EMAIL = process.env.STORJ_EMAIL;
var STORJ_PASSWORD = process.env.STORJ_PASSWORD;
/*
  Get and/or generate mnemonic for you on load.
  !! Important: you'll need to manually add the contents of the file in the
  key.ring directory to your Heroku config variables either through the GUI or
  the command line:
  `heroku config:set STORJ_MNEMONIC=<VALUE FROM .ENV FILE>`
*/
var STORJ_MNEMONIC = process.env.STORJ_MNEMONIC || generateMnemonic();

var storjCredentials = {
  email: STORJ_EMAIL,
  password: STORJ_PASSWORD
};

// Helps to break up endpoint logs
var separator = function() {
  return console.log('================================');
};


/**
 * Authenticates your user with storj.BridgeClient. The authorized instance
 * is saved into a 'global' variable 'client'. This allows you to use this same
 * authorized instance for future interactions without have to re-authenticate
 * every single time.
 */
app.get('/user/authenticate/user-pass', function(req, res) {
  separator();
  console.log('Attempting to log in with basic auth...');
  if (!STORJ_EMAIL || !STORJ_PASSWORD) {
    return res.status(400).send('No credentials. Make sure you have a .env file with KEY=VALUE pairs')
  }
  client = storj.BridgeClient(api, { basicAuth: storjCredentials });
  console.log('Logged in with basic auth');
  res.status(200).send('successful');
});

/**
 * Lists all buckets on your account
 */
app.get('/buckets/list', function(req, res) {
  separator();
  console.log('Getting buckets...')
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.log('error', err.message);
    }
    console.log('Retrieved buckets', buckets);
    res.status(200).send(buckets);
  });
});


/** Upload file **/
app.get('/files/upload', function(req, res) {
  separator();
  console.log('Retrieving buckets...')
  // Step 1
  client.getBuckets(function(err, buckets) {
    if (err) {
      return console.error(err.message);
    }

    // Step 1a) Use the first bucket
    var bucketId = buckets[0].id;
    console.log('Uploading file to: ', bucketId);

    // Step 1b) Path of file

    var filepath = './public/grumpy.jpg';
    console.log('Path of file: ', filepath);

    // Step 1c) Name of file
    var filename = 'grumpy.jpg';
    console.log('Name of file: ', filename);

    // Step 2) Create a filekey with username, bucketId, and filename
    var filekey = getFileKey(STORJ_EMAIL, bucketId, filename);

    // Step 3) Create a temporary path to store the encrypted file
    var tmppath = filepath + '.crypt';

    // Step 4) Instantiate encrypter
    var encrypter = new storj.EncryptStream(filekey);

    // Step 5) Encrypt file
    fs.createReadStream(filepath)
      .pipe(encrypter)
      .pipe(fs.createWriteStream(tmppath))
      .on('finish', function() {
        console.log('Finished encrypting');

        // Step 6) Create token for uploading to bucket by bucketId
        client.createToken(bucketId, 'PUSH', function(err, token) {
          if (err) {
            console.log('error', err.message);
          }
          console.log('Created token', token.token);

          // Step 7) Store the file
          console.log('Storing file in bucket...');
          client.storeFileInBucket(bucketId, token.token, tmppath,
            function(err, file) {
              if (err) {
                return console.log('error', err.message);
              }
              console.log('Stored file in bucket');
              // Step 8) Clean up and delete tmp encrypted file
              console.log('Cleaning up and deleting temporary encrypted file...');
              fs.unlink(tmppath, function(err) {
                if (err) {
                  return console.log(err);
                }
                console.log('Temporary encrypted file deleted');
              });

              console.log(`File ${filename} successfully uploaded to ${bucketId}`);
              res.status(200).send(file);
            });
        });
      });
  });
});


var localAssetsDir = __dirname + '/public';
app.use(express.static(localAssetsDir));

var server = app.listen(9091, function(){
  var host = server.address().address;
  var port = server.address().port;

  console.log("server starting ...");
});

function generateMnemonic() {
  console.log('Attempting to retrieve mnemonic');
  var mnemonic = keyring.exportMnemonic();
  var newMnemonic;

  if (mnemonic) {
    console.log('Mnemonic already exists', mnemonic);
  } else {
    console.log('Mnemonic doesn\'t exist or new keyring');
    try {
      keyring.importMnemonic(process.env.STORJ_MNEMONIC);
    } catch(err) {
      console.log('process.env.STORJ_MNEONIC', err);
      try {
        keyring.importMnemonic(keyring.generateDeterministicKey());
      } catch(err) {
        console.log('generateDeterministicKey', err);
      }
    }
  }

  console.log('Mnemonic successfully retrieved/generated and imported');
  if (!process.env.STORJ_MNEMONIC) {
    console.log('Mnemonic not saved to env vars. Saving...');
    // Write mnemonic to .env file
    fs.appendFileSync('./.env', `STORJ_MNEMONIC="${mnemonic || newMnemonic}"`);
    console.log('Mnemonic written to .env file. Make sure to add this to heroku config variables with \'heroku config:set STORJ_MNEMONIC="<VALUE FROM .ENV FILE>\'');
    return;
  }
}
