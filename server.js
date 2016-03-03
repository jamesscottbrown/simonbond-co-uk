// Generated by CoffeeScript 1.7.1
(function() {
  var Async, Collections, Express, MongoDb, app, _ipAddress, _mongoHost, _mongoPort, _mongoURL, _port, _ref, _ref1, _ref2, _ref3;

  Express = require('express');

  MongoDb = require('mongodb');

  Async = require('async');

  app = Express();

  app.get('/', function(req, res) {
    return Collections.lengths.count(function(err, count) {
      return res.send("Nothing here yet! DB has " + count + " records.");
    });
  });

  _ipAddress = (_ref = process.env.OPENSHIFT_NODEJS_IP) != null ? _ref : '127.0.0.1';

  _port = (_ref1 = process.env.OPENSHIFT_NODEJS_PORT) != null ? _ref1 : 8080;

  _mongoHost = (_ref2 = process.env.OPENSHIFT_MONGODB_DB_HOST) != null ? _ref2 : '127.0.0.1';

  _mongoPort = (_ref3 = process.env.OPENSHIFT_MONGODB_DB_PORT) != null ? _ref3 : 27017;

  _mongoURL = "mongodb://" + _mongoHost + ":" + _mongoPort + "/ringing";

  Collections = [];

  MongoDb.MongoClient.connect(_mongoURL, function(err, db) {
    var collections;
    if (err != null) {
      throw new Error("Failed to connect to MongoDB on " + _mongoURL);
    }
    collections = ['lengths', 'towers'];
    return Async.each(collections, function(collectionName, done) {
      return db.createCollection(collectionName, {
        strict: false
      }, function(err, collection) {
        Collections[collectionName] = collection;
        return done(err);
      });
    }, function(err) {
      if (err != null) {
        throw new Error("Collection creation failed with error: " + err);
      }
      return Collections.lengths.count(function(err, count) {
        if (err != null) {
          throw new Error("Sample DB query failed");
        }
        return console.log("Connected to MongoDB. Lengths has " + count + " records.");
      });
    });
  });

  app.listen(_port, _ipAddress, function() {
    return console.log("Web server started");
  });

}).call(this);
