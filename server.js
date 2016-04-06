// BASE SETUP
// =============================================================================
import { MONGODB_URL } from './app/constants';

// call the packages we need
var http           = require('http');
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var server     = http.createServer(app);
var bodyParser = require('body-parser');
var morgan     = require('morgan');
var io         = require('socket.io').listen(server);

var mongoose   = require('mongoose');
mongoose.connect(MONGODB_URL); // connect to our database

var Lightsetting    = require('./app/models/lightsetting');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('dev')); // use morgan to log requests to the console

var port = process.env.PORT || 8070;        // set our port
var appUrl = "http://localhost:8100";

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", appUrl);
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header("Access-Control-Allow-Headers", "Origin, x-access-token, X-Requested-With, Content-Type, Accept");
  next();
});

// middleware to use for all requests
router.use(function(req, res, next) {
    console.log('Something is happening @ the API.');
    next(); // make sure we go to the next routes and don't stop here
});

// get all the requests (accessed at GET http://localhost:8080/api/requests)
router.route('/lightsettings?')
    .get(function(req, res){
        Lightsetting.find().sort({ calculated : -1}).exec(function(err, requests) {
            if (err)
                res.send(err);
            res.json(requests);
            console.log('Performed GET ALL');
        });
    })
    .post(function(req, res){
      var lighsetting = new Lightsetting();
      lighsetting.color = req.query.color;
      lighsetting.save(function(err) {
          if (err)
              res.send(err);
          res.json({ message: 'Setting created!' });
      });
    });
router.route('/lightsettings/:id/upvote?')
    .post(function(req, res) {
        if (req.query.remove == 1) {
            // Remove the upvote
            Lightsetting.findById(req.params.id, function(err, setting) {
                if (err)
                    res.send(err);
                setting.upvotes = setting.upvotes - 1; // update the requests info
                setting.calculated = setting.calculated - 1; // update the requests info
                // save the request
                setting.save(function(err) {
                    if (err)
                        res.send(err);
                    res.json({ message: 'Setting upvote removed!'});
                    io.sockets.emit('upvote-removed', { id: req.params.id });
                });
            });
        } else {
            Lightsetting.findById(req.params.id, function(err, setting) {
                if (err)
                    res.send(err);
                setting.upvotes = setting.upvotes + 1; // update the requests info
                setting.calculated = setting.calculated + 1; // update the requests info
                // save the request
                setting.save(function(err) {
                    if (err)
                        res.send(err);
                    res.json({ message: 'Setting upvoted!'});
                    io.sockets.emit('upvote', { id: req.params.id });
                });
            });
        }
    });
router.route('/lightsettings/:id/downvote?')
    .post(function(req, res) {
        if (req.query.remove == 1) {
            // Removed downvote
            console.log('Removing downvote');
            Lightsetting.findById(req.params.id, function(err, setting) {
                if (err)
                    res.send(err);
                setting.downvotes = setting.downvotes + 1; // update the requests info
                setting.calculated = setting.calculated + 1; // update the requests info
                // save the request
                setting.save(function(err) {
                    if (err)
                        res.send(err);
                    res.json({ message: 'Setting downvote removed!'});
                    io.sockets.emit('downvote-removed', { id: req.params.id });
                });
            });
        } else {
            // Downvoted
            Lightsetting.findById(req.params.id, function(err, setting) {
                if (err)
                    res.send(err);
                setting.downvotes = setting.downvotes - 1; // update the requests info
                setting.calculated = setting.calculated - 1; // update the requests info
                // save the request
                setting.save(function(err) {
                    if (err)
                        res.send(err);
                    res.json({ message: 'Setting downvoted!'});
                    io.sockets.emit('downvote', { id: req.params.id });
                });
            });
        }
    });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// SOCKET
io.on('connection', function (socket) {
    console.log('Socket Connected!');
    // socket.on('my other event', function (data) {
    //     console.log(data);
    // });
});

// START THE SERVER
// =============================================================================
server.listen(port);
console.log('Magic happens on port ' + port);
