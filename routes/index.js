var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Turing Party' });
});

/* Mode selection page. */
router.get('/select', function(req, res, next) {
  res.render('select');
});

/* Page to start a new room with friends. */
router.get('/start-room', function(req, res, next) {
  res.render('start-room');
});

/* Page to join a room of friends. */
router.get('/join-room', function(req, res, next) {
  res.render('join-room');
});

/* Page to join a random room. */
router.get('/join-random', function(req, res, next) {
  res.render('join-random');
});

/* Gameplay page. */
router.get('/game', function(req, res, next) {
  res.render('game', { title: 'Turing Party' });
});

module.exports = router;
