// Generated by CoffeeScript 1.7.1
(function() {
  var Async, Db, ErrorHandler, Express, Moment, MongoDb, Morgan, Stable, app, getTowerDisplayName, _ipAddress, _port, _ref, _ref1, _stages;

  Express = require('express');

  MongoDb = require('mongodb');

  Async = require('async');

  Morgan = require('morgan');

  ErrorHandler = require('errorhandler');

  Moment = require('moment');

  Stable = require('stable');

  Db = require('./db');

  _ipAddress = (_ref = process.env.OPENSHIFT_NODEJS_IP) != null ? _ref : '127.0.0.1';

  _port = (_ref1 = process.env.OPENSHIFT_NODEJS_PORT) != null ? _ref1 : 8080;

  app = Express();

  app.set('view engine', 'pug');

  app.use(Morgan('combined'));

  app.use(ErrorHandler());

  _stages = ["Singles", "Minimus", "Doubles", "Doubles and Minor", "Minor", "Triples", "Triples and Major", "Major", "Major and Caters", "Caters", "Caters and Royal", "Royal", "Cinques", "Cinques and Maximus", "Maximus", "Sextuples", "Fourteen", "Septuples", "Sixteen"];

  app.get('/', function(req, res) {
    return res.render('index');
  });

  app.use('/static', Express["static"]('static'));

  app.get('/ringing', function(req, res) {
    var key, selector, val, _ref2;
    selector = {};
    _ref2 = req.query;
    for (key in _ref2) {
      val = _ref2[key];
      if (val.length) {
        switch (key) {
          case 'year':
            selector.date = {
              $gte: new Date(parseInt(val), 0, 1),
              $lt: new Date(parseInt(val) + 1, 0, 1)
            };
            break;
          case 'length':
            if (val === 'quarter') {
              selector.Length = {
                $lt: 5000
              };
            }
            if (val === 'peal') {
              selector.Length = {
                $gte: 5000
              };
            }
        }
      }
    }
    return Db.collections.lengths.find(selector).sort({
      date: 1
    }).toArray(function(err, lengths) {
      var context, countP, countQ, mappedLengths, totalRows, _i, _ref3, _results;
      if (err != null) {
        return res.status(500).send(err);
      }
      totalRows = countQ = countP = 0;
      mappedLengths = lengths.map(function(length) {
        totalRows += length.Length;
        if (length.Length > 4999) {
          countP++;
        } else {
          countQ++;
        }
        length.formatDate = Moment(length.date).format('ddd D MMMM YYYY');
        if (lengths.footnotes != null) {
          lengths.formatFootnotes = lengths.footnotes.replace('\n', '<br>');
        }
        return length;
      });
      context = req.query;
      context.performances = lengths;
      context.totalRows = totalRows;
      context.countP = countP;
      context.countQ = countQ;
      context.years = (function() {
        _results = [];
        for (var _i = _ref3 = new Date().getFullYear(); _ref3 <= 2002 ? _i <= 2002 : _i >= 2002; _ref3 <= 2002 ? _i++ : _i--){ _results.push(_i); }
        return _results;
      }).apply(this);
      return res.render('ringing', context);
    });
  });

  app.get('/stats', function(req, res) {
    var selector;
    selector = {};
    return Db.collections.lengths.find(selector).sort({
      date: 1
    }).toArray(function(err, lengths) {
      var conductor, conductors, conductorsArr, context, count, details, method, methods, paramSortAsc, paramSortDesc, perf, ringer, ringers, ringersArr, stage, stagesArr, title, tower, towerId, towers, towersArr, _base, _i, _j, _k, _l, _len, _len1, _len2, _name, _name1, _ref2;
      if (err != null) {
        return res.status(500).send(err);
      }
      ringers = {};
      methods = {};
      for (_i = 0, _len = _stages.length; _i < _len; _i++) {
        stage = _stages[_i];
        methods[stage] = {};
      }
      towers = {};
      conductors = {};
      for (_j = 0, _len1 = lengths.length; _j < _len1; _j++) {
        perf = lengths[_j];
        for (ringer = _k = 1; _k <= 16; ringer = ++_k) {
          if (!(perf["Ringer" + ringer] != null)) {
            continue;
          }
          if (ringers[_name = perf["Ringer" + ringer]] == null) {
            ringers[_name] = 0;
          }
          ringers[perf["Ringer" + ringer]]++;
        }
        title = perf.Method || ("(" + perf.numMeth + "m)");
        if ((_base = methods[perf.stage])[title] == null) {
          _base[title] = 0;
        }
        methods[perf.stage][title]++;
        tower = perf.tower || perf.venue;
        if (towers[_name1 = tower.DoveID] == null) {
          towers[_name1] = {
            displayName: getTowerDisplayName(tower),
            count: 0
          };
        }
        towers[tower.DoveID].count++;
        conductor = perf["Ringer" + perf.Conductor];
        if (conductors[conductor] == null) {
          conductors[conductor] = 0;
        }
        conductors[conductor]++;
      }
      paramSortAsc = function(param) {
        return function(x, y) {
          return x[param] > y[param];
        };
      };
      paramSortDesc = function(param) {
        return function(x, y) {
          return y[param] > x[param];
        };
      };
      ringersArr = [];
      for (ringer in ringers) {
        count = ringers[ringer];
        ringersArr.push({
          name: ringer,
          count: count
        });
      }
      Stable.inplace(ringersArr, paramSortAsc('name'));
      Stable.inplace(ringersArr, paramSortDesc('count'));
      for (_l = 0, _len2 = _stages.length; _l < _len2; _l++) {
        stage = _stages[_l];
        stagesArr = [];
        _ref2 = methods[stage];
        for (method in _ref2) {
          count = _ref2[method];
          stagesArr.push({
            method: method,
            count: count
          });
        }
        Stable.inplace(stagesArr, paramSortAsc('method'));
        Stable.inplace(stagesArr, paramSortDesc('count'));
        methods[stage] = stagesArr;
      }
      towersArr = [];
      for (towerId in towers) {
        details = towers[towerId];
        towersArr.push({
          towerId: towerId,
          displayName: details.displayName,
          count: details.count
        });
      }
      Stable.inplace(towersArr, paramSortAsc('displayName'));
      Stable.inplace(towersArr, paramSortDesc('count'));
      conductorsArr = [];
      for (ringer in conductors) {
        count = conductors[ringer];
        conductorsArr.push({
          name: ringer,
          count: count
        });
      }
      Stable.inplace(conductorsArr, paramSortAsc('name'));
      Stable.inplace(conductorsArr, paramSortDesc('count'));
      context = {
        stages: _stages,
        methods: methods,
        ringers: ringersArr,
        towers: towersArr,
        conductors: conductorsArr
      };
      return res.render('stats', context);
    });
  });

  getTowerDisplayName = function(tower) {
    if (tower.Place2 != null) {
      return "" + tower.Place + ", " + tower.Place2 + ", " + tower.Dedicn + ", " + tower.County;
    }
    return "" + tower.Place + ", " + tower.Dedicn + ", " + tower.County;
  };

  Db.start(function(err) {
    if (err != null) {
      throw new Error("DB start failed: " + err);
    }
    return app.listen(_port, _ipAddress, function() {
      return console.log("Web server started");
    });
  });

}).call(this);
