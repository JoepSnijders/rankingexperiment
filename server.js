// BASE SETUP
// =============================================================================
import { MONGODB_URL } from './app/constants';

// call the packages we need
var http = require('http');
var express = require('express'); // call express
var app = express(); // define our app using express
var server = http.createServer(app);
var bodyParser = require('body-parser');
var morgan = require('morgan');
var io = require('socket.io').listen(server);

var mongoose = require('mongoose');
var Lightsetting = require('./app/models/lightsetting');
var Vote = require('./app/models/vote');
var Participant = require('./app/models/participant');
mongoose.connect(MONGODB_URL); // connect to our database

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(morgan('dev')); // use morgan to log requests to the console

var port = process.env.PORT || 8070; // set our port


// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); // get an instance of the express Router

// CORS
app.use(function(req, res, next) {
    var allowedOrigins = ['http://jsnijders.com', 'http://www.jsnijders.com', 'http://localhost:8100'];
    var origin = req.headers.origin;
    if (allowedOrigins.indexOf(origin) > -1) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
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
    .get(function(req, res) {
        Lightsetting.find().sort({
            calculated: -1
        }).exec(function(err, requests) {
            if (err)
                res.send(err);
            res.json(requests);
            console.log('Performed GET ALL');
        });
    })
    .post(function(req, res) {
        var lighsetting = new Lightsetting();
        lighsetting.color = req.query.color;
        lighsetting.save(function(err) {
            if (err)
                res.send(err);
            res.json({
                message: 'Setting created!'
            });
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
                // Save the Setting
                setting.save(function(err) {
                    if (err)
                        res.send(err);
                    res.json({
                        message: 'Setting upvote removed!'
                    });
                    io.sockets.emit('upvote-removed', {
                        id: req.params.id
                    });
                });
                // Save individual vote
                var vote = new Vote();
                vote.lightSetting = setting._id;
                vote.type = "Upvote Removed";
                vote.currentUpvotes = setting.upvotes;
                vote.currentDownvotes = setting.downvotes;
                vote.currentCalculated = setting.calculated;
                vote.participant = req.body.participant;
                vote.condition = req.body.condition;
                vote.rank = req.body.rank;
                vote.save();
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
                    res.json({
                        message: 'Setting upvoted!'
                    });
                    io.sockets.emit('upvote', {
                        id: req.params.id
                    });
                });
                var vote = new Vote();
                vote.lightSetting = setting._id;
                vote.type = "Upvote";
                vote.currentUpvotes = setting.upvotes;
                vote.currentDownvotes = setting.downvotes;
                vote.currentCalculated = setting.calculated;
                vote.participant = req.body.participant;
                vote.condition = req.body.condition;
                vote.rank = req.body.rank;
                vote.save();
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
                    res.json({
                        message: 'Setting downvote removed!'
                    });
                    io.sockets.emit('downvote-removed', {
                        id: req.params.id
                    });
                });
                var vote = new Vote();
                vote.lightSetting = setting._id;
                vote.type = "Downvote Removed";
                vote.currentUpvotes = setting.upvotes;
                vote.currentDownvotes = setting.downvotes;
                vote.currentCalculated = setting.calculated;
                vote.participant = req.body.participant;
                vote.condition = req.body.condition;
                vote.rank = req.body.rank;
                vote.save();
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
                    res.json({
                        message: 'Setting downvoted!'
                    });
                    io.sockets.emit('downvote', {
                        id: req.params.id
                    });
                });
                var vote = new Vote();
                vote.lightSetting = setting._id;
                vote.type = "Downvote";
                vote.currentUpvotes = setting.upvotes;
                vote.currentDownvotes = setting.downvotes;
                vote.currentCalculated = setting.calculated;
                vote.participant = req.body.participant;
                vote.condition = req.body.condition;
                vote.rank = req.body.rank;
                vote.save();
            });
        }
    });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// SOCKET
var socketCounter = 0;
io.on('connection', function(socket) {
    console.log('Socket Connected');
    socketCounter++;
    console.log('Connected users: ' + socketCounter);
    // Generate PP ID
    Participant.findOne({}, {}, { sort: { 'connectedOn' : -1 } }, function(err, post) {
        var participant = new Participant();
        participant.participant = post.participant + 1;
        participant.save();
        io.sockets.emit('participant', {
            id: participant.participant,
            condition: participant.condition
        });
    });

    socket.on('disconnect', function() {
        socketCounter--;
        console.log('Socket Disconnected');
        console.log('Connected users: ' + socketCounter);
    });
});


// START THE SERVER
// =============================================================================
server.listen(port);
console.log('Magic happens on port ' + port);
