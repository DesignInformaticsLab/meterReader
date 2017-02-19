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
  res.render('index', { title: 'Express' });
});

// classification
router.post('/read', function(req, res){
  pg.connect(connection, function(err, client, done) {
    client.query('SELECT model FROM readmeter_model_table LIMIT 1', function(err, result) {
      done();
      if (err)
      { console.error(err); res.send("Error " + err); }
      else
      {
        // species a 2-layer neural network with one hidden layer of 20 neurons
        var layer_defs = [];
        // input layer declares size of input. here: 2-D data
        // ConvNetJS works on 3-Dimensional volumes (sx, sy, depth), but if you're not dealing with images
        // then the first two dimensions (sx, sy) will always be kept at size 1
        layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:2});
        // declare 20 neurons, followed by ReLU (rectified linear unit non-linearity)
        layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});
        // declare the linear classifier on top of the previous hidden layer
        layer_defs.push({type:'softmax', num_classes:10});
        var layers = result.rows[0].model.layers;
        net = new convnetjs.Net();
        net.makeLayers(layer_defs);

        net.layers[1].biases = layers[1].biases;
        net.layers[1].filters = layers[1].filters;
        net.layers[3].biases = layers[3].biases;
        net.layers[3].filters = layers[3].filters;

        var address = req.body['image'];
        getPixels(address, function(err, data) {
          // helpful utility for converting images into Vols is included

          var x = convnetjs.img_to_vol(data);
          //var image =  new convnetjs.Vol(x);
          var output_probabilities_vol = net.forward(x);
          res.send( output_probabilities_vol );
        });
      }
    });
  });

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
  // input layer declares size of input. here: 2-D data
  // ConvNetJS works on 3-Dimensional volumes (sx, sy, depth), but if you're not dealing with images
  // then the first two dimensions (sx, sy) will always be kept at size 1
  layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:2});
  // declare 20 neurons, followed by ReLU (rectified linear unit non-linearity)
  layer_defs.push({type:'fc', num_neurons:20, activation:'relu'});
  // declare the linear classifier on top of the previous hidden layer
  layer_defs.push({type:'softmax', num_classes:10});

  net = new convnetjs.Net();
  net.makeLayers(layer_defs);

  // forward a random data point through the network
  //var x = new convnetjs.Vol([0.3, -0.5]);
  //var prob = net.forward(x);

  // prob is a Vol. Vols have a field .w that stores the raw data, and .dw that stores gradients
  //console.log('probability that x is class 0: ' + prob.w[0]); // prints 0.50101

  var trainer = new convnetjs.SGDTrainer(net, {learning_rate:0.01, l2_decay:0.001});

  getPixels("./data/mnist_batch_0.png", function(err, data) {
    // load labels
    var contents = fs.readFileSync("./data/mnist_labels.json");
    var labels = JSON.parse(contents);
    labels = labels['labels'];

    var batch_size = 3000;
    var step_num = 1;
    var use_validation_data = false;

    // functions related to training
    var sample_training_instance = function() {
      // find an unloaded batch
      var n = Math.floor(Math.random()*batch_size); // sample within the batch
      // fetch the appropriate row of the training image and reshape into a Vol
      var img = data.data;
      var x = new convnetjs.Vol(28,28,1,0.0);
      var W = 28*28;
      for(var i=0;i<W;i++) {
        var ix = i*4;
        x.w[i] = img[ix]/255.0;
      }
      x = convnetjs.augment(x, 24);

      var isval = use_validation_data && n%10===0 ? true : false;
      return {x:x, label:labels[n], isval:isval};
    };
    var load_and_step = function() {
      var sample = sample_training_instance();
      step(sample); // process this image
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
      trainer.train(x, y);
      //var lossx = stats.cost_loss;
      //var lossw = stats.l2_decay_loss;

      //// keep track of stats such as the average training error and loss
      //var yhat = net.getPrediction();
      //var train_acc = yhat === y ? 1.0 : 0.0;
      //xLossWindow.add(lossx);
      //wLossWindow.add(lossw);
      //trainAccWindow.add(train_acc);

      step_num++;
    };
    var max_iter = 3000;
    while (step_num<max_iter){
      load_and_step();
    }

    pg.connect(connection, function(err, client, done) {
      //using the sync versions because
      //bcrypt is not a IO operation and I can not deal
      //with any more callbacks
      var query = client.query("INSERT INTO readmeter_model_table (model) VALUES ($1)",[net]);
      query.on('error', handle_error.bind(this, res));
      query.on('end', function(result){res.status(202).send("Model Trained");});
      done();
    });
  });
  //var prob2 = net.forward(x);
  //console.log('probability that x is class 0: ' + prob2.w[0]);

  // now prints 0.50374, slightly higher than previous 0.50101: the networks
  // weights have been adjusted by the Trainer to give a higher probability to
  // the class we trained the network with (zero)

});

module.exports = router;
