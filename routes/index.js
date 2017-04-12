var express = require('express');
var convnetjs = require("convnetjs");
var router = express.Router();
var pg = require('pg');
var getPixels = require("get-pixels");
var fs = require("fs");

var connection = process.env.DATABASE_URL || "postgres://postgres:54093960@localhost:5432/postgres";
function handle_error(res, err) {
  console.error(err);
  res.status(500).send("Error " + err);
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Meter Reader' });
});

/* GET home page. */
router.get('/furi', function(req, res, next) {
  res.render('furi', { title: 'FURI Symposium demo' });
});


/* test camera */
router.get('/camera', function(req, res, next) {
  res.render('camera');
});

/* meter reader for MAE540 project */
router.get('/meterReader', function(req, res, next) {
  res.render('meterReader');
});

// classification
router.post('/read', function(req, res){
  var contents = fs.readFileSync("./data/model_MNIST.json");
  var model = JSON.parse(contents);

  //var id = req.body['image'];

  var layer_defs = [];
  layer_defs.push({type:'input', out_sx:28, out_sy:28, out_depth:1});
  layer_defs.push({type:'conv', sx:5, filters:8, stride:1, pad:2, activation:'relu'});
  layer_defs.push({type:'pool', sx:2, stride:2});
  layer_defs.push({type:'conv', sx:5, filters:16, stride:1, pad:2, activation:'relu'});
  layer_defs.push({type:'pool', sx:3, stride:3});
  layer_defs.push({type:'softmax', num_classes:10});
  var layers = model.layers;
  net = new convnetjs.Net();
  net.makeLayers(layer_defs);

  net.layers[1].biases = layers[1].biases;
  net.layers[1].filters = layers[1].filters;
  net.layers[4].biases = layers[4].biases;
  net.layers[4].filters = layers[4].filters;
  net.layers[7].biases = layers[7].biases;
  net.layers[7].filters = layers[7].filters;
  //net.layers[9].biases = layers[9].biases;
  //net.layers[9].filters = layers[9].filters;

  var image = req.body['image'];
  x = new convnetjs.Vol(28,28,1,0.0);
  //x1 = new convnetjs.Vol(28,28,1,0.0);
  //var address = "./data/new_big_simple.png";

  // note: getpixels reads row by row, not column by column!
  //getPixels(address, function(err, data) {
    // helpful utility for converting images into Vols is included

    // TODO: preprocess the image to the target size
    //var image = data.data;

    var W = 28*28;
    for(var i=0;i<W;i++) {
      var ix = i * 4;
      x.w[i] = image[ix]/255.0;
    }
    x = convnetjs.augment(x, 28, 1, 1);

    var output_probabilities_vol = net.forward(x);

    //getPixels("./data/new_big_5_row.png", function(err, data) {
    //  // helpful utility for converting images into Vols is included
    //
    //  // TODO: preprocess the image to the target size
    //  var image = data.data;
    //
    //  var W = 28*28;
    //  //for(var i=0;i<W;i++) {
    //  //  var ix = i*4;
    //  //  x.w[i] = image[ix]/255.0;
    //  //}
    //  for(var i=0;i<W;i++) {
    //    var ix = ((W * 17) + i) * 4;
    //    x1.w[i] = image[ix]/255.0;
    //  }
    //  x1 = convnetjs.augment(x1, 28, 1, 1);
    //
    //  var output_probabilities_vol1 = net.forward(x1);
    //  res.send( output_probabilities_vol);
    //});
  //});
  //var output_probabilities_vol = net.forward(x1);
  res.send( {'prob':output_probabilities_vol, 'id':req.body['id']} );

  //pg.connect(connection, function(err, client, done) {
  //  client.query('SELECT model FROM readmeter_model_table LIMIT 1', function(err, result) {
  //    done();
  //    if (err)
  //    { console.error(err); res.send("Error " + err); }
  //    else
  //    {
  //      var layer_defs = [];
  //      layer_defs.push({type:'input', out_sx:24, out_sy:24, out_depth:1});
  //      layer_defs.push({type:'conv', sx:5, filters:8, stride:1, pad:2, activation:'relu'});
  //      layer_defs.push({type:'pool', sx:2, stride:2});
  //      layer_defs.push({type:'conv', sx:5, filters:16, stride:1, pad:2, activation:'relu'});
  //      layer_defs.push({type:'pool', sx:3, stride:3});
  //      layer_defs.push({type:'softmax', num_classes:10});
  //      var layers = result.rows[0].model.layers;
  //      net = new convnetjs.Net();
  //      net.makeLayers(layer_defs);
  //
  //      net.layers[1].biases = layers[1].biases;
  //      net.layers[1].filters = layers[1].filters;
  //      net.layers[4].biases = layers[4].biases;
  //      net.layers[4].filters = layers[4].filters;
  //      net.layers[7].biases = layers[7].biases;
  //      net.layers[7].filters = layers[7].filters;
  //
  //      var address = req.body['image'];
  //      getPixels(address, function(err, data) {
  //        // helpful utility for converting images into Vols is included
  //
  //        // TODO: preprocess the image to the target size
  //        var image = data.data;
  //        var x = new convnetjs.Vol(28,28,1,0.0);
  //        var W = 28*28;
  //        for(var i=0;i<W;i++) {
  //          var ix = i*4;
  //          x.w[i] = image[ix]/255.0;
  //        }
  //        x = convnetjs.augment(x, 24);
  //
  //        var output_probabilities_vol = net.forward(x);
  //        res.send( output_probabilities_vol );
  //      });
  //    }
  //  });
  //});

});

// return model
router.post('/checkModel', function(req, res){
  pg.connect(connection, function(err, client, done) {
    client.query('SELECT model FROM readmeter_model_table LIMIT 1', function(err, result) {
      done();
      if (err)
      { console.error(err); res.send("Error " + err); }
      else
      { res.send( result.rows ); }
    });
  });
});

// training
router.post('/training', function(req, res){
  // species a 2-layer neural network with one hidden layer of 20 neurons
  var layer_defs = [];
  layer_defs.push({type:'input', out_sx:28, out_sy:28, out_depth:1});
  layer_defs.push({type:'conv', sx:3, filters:8, stride:1, pad:1, activation:'relu'});
  layer_defs.push({type:'pool', sx:2, stride:2});
  layer_defs.push({type:'conv', sx:4, filters:16, stride:1, pad:1, activation:'relu'});
  layer_defs.push({type:'pool', sx:2, stride:2});
  layer_defs.push({type:'conv', sx:3, filters:16, stride:1, pad:1, activation:'relu'});
  layer_defs.push({type:'softmax', num_classes:10});

  net = new convnetjs.Net();
  net.makeLayers(layer_defs);

  // forward a random data point through the network
  //var x = new convnetjs.Vol([0.3, -0.5]);
  //var prob = net.forward(x);

  // prob is a Vol. Vols have a field .w that stores the raw data, and .dw that stores gradients
  //console.log('probability that x is class 0: ' + prob.w[0]); // prints 0.50101

  var trainer = new convnetjs.SGDTrainer(net);
  trainer.learning_rate = 0.001;
  trainer.momentum = 0.9;
  trainer.l2_decay= 0.001;
  trainer.batch_size = 20;

  getPixels("./data/new_big_5_row.png", function(err, data) {
    // load labels
    var contents = fs.readFileSync("./data/big_column_flatten_labels.json");
    var labels = JSON.parse(contents);
    labels = labels['labels'];

    var batch_size = 181;
    var use_validation_data = false;
    var train_acc = 0;

    var img = data.data;

    var internal_test = function(id,image,net){
      var x = new convnetjs.Vol(28, 28, 1, 0.0);
      var W = 28 * 28;
      for(var i=0;i<W;i++) {
        var ix = ((W * id) + i) * 4;
        x.w[i] = image[ix]/255.0;
      }
      x = convnetjs.augment(x, 28, 1, 1);

      net.forward(x);
      var yhat = net.getPrediction();
      return yhat;
    };

    // functions related to training
    var sample_training_instance = function() {
      // find an unloaded batch
      var n = Math.floor(Math.random()*batch_size); // sample within the batch
      // fetch the appropriate row of the training image and reshape into a Vol

      var x = new convnetjs.Vol(28,28,1,0.0);
      var W = 28*28;
      for(var i=0;i<W;i++) {
        var ix = ((W * n) + i) * 4;
        x.w[i] = img[ix]/255.0;
      }

      x = convnetjs.augment(x, 28, 1, 1);

      var isval = use_validation_data && n%10===0 ? true : false;
      return {x:x, label:labels[n], isval:isval};
    };
    var load_and_step = function() {
      var sample = sample_training_instance();
      return step(sample); // process this image
    };
    var step = function(sample) {
      var x = sample.x;
      var y = sample.label;

      if(sample.isval) {
        // use x to build our estimate of validation error
        net.forward(x);
        var yhat = net.getPrediction();
        var val_acc = yhat === y ? 1.0 : 0.0;
        //valAccWindow.add(val_acc);
        return; // get out
      }

      // train on it with network
      var stats = trainer.train(x, y);
      var lossx = stats.cost_loss;
      var lossw = stats.l2_decay_loss;

      // keep track of stats such as the average training error and loss
      var yhat = net.getPrediction();
      train_acc = train_acc + (yhat === y ? 1.0 : 0.0);
      var output = {'lossx':lossx,'lossw':lossw,'train_acc':train_acc/max_iter};
      return output;
    };
    var max_iter = 10000;
    var output = [];
    for (var i = 0; i<max_iter; i++){
      output = load_and_step();
    }

    var predict = [];
    for (var i=0;i<181;i++){
      predict.push(internal_test(i,img,net));
    }

    pg.connect(connection, function(err, client, done) {
      client.query("INSERT INTO readmeter_model_table (model) VALUES ($1)",[net], function(err, result) {
        done();
        if (err)
        { console.error(err); res.send("Error " + err); }
        else
        {
          res.send( {'model':output,'pred':predict} );
        }
      });
    });
  });
  //var prob2 = net.forward(x);
  //console.log('probability that x is class 0: ' + prob2.w[0]);

  // now prints 0.50374, slightly higher than previous 0.50101: the networks
  // weights have been adjusted by the Trainer to give a higher probability to
  // the class we trained the network with (zero)

});


// classification
router.post('/read_malcolm', function(req, res){
  var contents = fs.readFileSync("./data/model_malcolm.json");
  var model = JSON.parse(contents);

  //var id = req.body['image'];

  var layer_defs = [];
  layer_defs.push({type:'input', out_sx:28, out_sy:28, out_depth:1});
  layer_defs.push({type:'conv', sx:5, filters:8, stride:1, pad:2, activation:'relu'});
  layer_defs.push({type:'pool', sx:2, stride:2});
  layer_defs.push({type:'conv', sx:5, filters:16, stride:1, pad:2, activation:'relu'});
  layer_defs.push({type:'pool', sx:3, stride:3});
  layer_defs.push({type:'softmax', num_classes:10});
  var layers = model.layers;
  net = new convnetjs.Net();
  net.makeLayers(layer_defs);

  net.layers[1].biases = layers[1].biases;
  net.layers[1].filters = layers[1].filters;
  net.layers[4].biases = layers[4].biases;
  net.layers[4].filters = layers[4].filters;
  net.layers[7].biases = layers[7].biases;
  net.layers[7].filters = layers[7].filters;
  //net.layers[9].biases = layers[9].biases;
  //net.layers[9].filters = layers[9].filters;

  var image = req.body['image'];
  x = new convnetjs.Vol(28,28,1,0.0);
  //x1 = new convnetjs.Vol(28,28,1,0.0);
  //var address = "./data/new_big_simple.png";

  // note: getpixels reads row by row, not column by column!
  //getPixels(address, function(err, data) {
  // helpful utility for converting images into Vols is included

  // TODO: preprocess the image to the target size
  //var image = data.data;

  var W = 28*28;
  for(var i=0;i<W;i++) {
    var ix = i * 4;
    x.w[i] = image[ix]/255.0;
  }
  x = convnetjs.augment(x, 28, 1, 1);

  var output_probabilities_vol = net.forward(x);

  //getPixels("./data/new_big_5_row.png", function(err, data) {
  //  // helpful utility for converting images into Vols is included
  //
  //  // TODO: preprocess the image to the target size
  //  var image = data.data;
  //
  //  var W = 28*28;
  //  //for(var i=0;i<W;i++) {
  //  //  var ix = i*4;
  //  //  x.w[i] = image[ix]/255.0;
  //  //}
  //  for(var i=0;i<W;i++) {
  //    var ix = ((W * 17) + i) * 4;
  //    x1.w[i] = image[ix]/255.0;
  //  }
  //  x1 = convnetjs.augment(x1, 28, 1, 1);
  //
  //  var output_probabilities_vol1 = net.forward(x1);
  //  res.send( output_probabilities_vol);
  //});
  //});
  //var output_probabilities_vol = net.forward(x1);
  res.send( {'prob':output_probabilities_vol, 'id':req.body['id']} );

  //pg.connect(connection, function(err, client, done) {
  //  client.query('SELECT model FROM readmeter_model_table LIMIT 1', function(err, result) {
  //    done();
  //    if (err)
  //    { console.error(err); res.send("Error " + err); }
  //    else
  //    {
  //      var layer_defs = [];
  //      layer_defs.push({type:'input', out_sx:24, out_sy:24, out_depth:1});
  //      layer_defs.push({type:'conv', sx:5, filters:8, stride:1, pad:2, activation:'relu'});
  //      layer_defs.push({type:'pool', sx:2, stride:2});
  //      layer_defs.push({type:'conv', sx:5, filters:16, stride:1, pad:2, activation:'relu'});
  //      layer_defs.push({type:'pool', sx:3, stride:3});
  //      layer_defs.push({type:'softmax', num_classes:10});
  //      var layers = result.rows[0].model.layers;
  //      net = new convnetjs.Net();
  //      net.makeLayers(layer_defs);
  //
  //      net.layers[1].biases = layers[1].biases;
  //      net.layers[1].filters = layers[1].filters;
  //      net.layers[4].biases = layers[4].biases;
  //      net.layers[4].filters = layers[4].filters;
  //      net.layers[7].biases = layers[7].biases;
  //      net.layers[7].filters = layers[7].filters;
  //
  //      var address = req.body['image'];
  //      getPixels(address, function(err, data) {
  //        // helpful utility for converting images into Vols is included
  //
  //        // TODO: preprocess the image to the target size
  //        var image = data.data;
  //        var x = new convnetjs.Vol(28,28,1,0.0);
  //        var W = 28*28;
  //        for(var i=0;i<W;i++) {
  //          var ix = i*4;
  //          x.w[i] = image[ix]/255.0;
  //        }
  //        x = convnetjs.augment(x, 24);
  //
  //        var output_probabilities_vol = net.forward(x);
  //        res.send( output_probabilities_vol );
  //      });
  //    }
  //  });
  //});

});



module.exports = router;
