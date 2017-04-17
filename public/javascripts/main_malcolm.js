/**
 * Created by p2admin on 2/18/2017.
 */

$(document).ready(function() {
    // Prefer camera resolution nearest to 1280x720.
    var constraints = {audio: false,
        video: true};
    var video = $("#video")[0];
    var canvas = document.getElementById('canvas');
    var startbutton = document.getElementById('startbutton');
    var num_img = 1;
    var digit = Array(num_img);
    var width = 160;
    var height = 120;

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (mediaStream) {
            //var video = document.querySelector('video');

            video.srcObject = mediaStream;
            video.onloadedmetadata = function (e) {
                video.play();
            };
        })
        .catch(function (err) {
            console.log(err.name + ": " + err.message);
        }); // always check for errors at the end.

    startbutton.addEventListener('click', function (ev) {
        ev.preventDefault();
        var context = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
        var data = canvas.toDataURL('image/png');
        read_img(data);
    }, false);

    function train(){
        $.post('/checkModel',{}, function(data){
            if(data!=null && data.length>0){
                console.log('model updated...'); //TODO: update model on check
            }
            else{
                $.post('/training',{}, function(data) {
                    if(data!=null && typeof(data)=="object"){
                        console.log(data);
                    }
                    else{
                        console.log('training failed...');
                    }
                });
            }
        });
    }

    function test(){
        // specify image address
        var address = 'https://raw.githubusercontent.com/DesignInformaticsLab/meterReader/master/data/digit.png';
        //var address = 82;

        //var img = new Image();
        //img.src = address;
        //var canvas = document.createElement('canvas');
        //canvas.width = img.width;
        //canvas.height = img.height;
        //var data_ctx = canvas.getContext("2d");
        //data_ctx.drawImage(img, 0, 0, 28, 28);
        //var img_data = data_ctx.getImageData(0, 0, 28, 28);
        //TODO: preprocess image

        // send data to predict
        $.post('/read_malcolm',{'image':address,'id':0}, function(data){
            if(data!=null){
                var pred = data.prob;
                //console.log(pred);
                var max = 0;
                var id = -1;
                for (var i=0;i<10;i++){
                    var v = pred.w[i];
                    max = v > max? v:max;
                    if (max == v) {
                        id = i;
                    }
                }
                console.log(pred);
                //$( "#result" ).append( "<p>Read from: "+ address + "</p>" );
                $( "#result" ).append( "<p>The digit is "+ id + "</p>" );
            }
        });
    }

// read and send digits
//var img_address = "https://upload.wikimedia.org/wikipedia/en/8/82/Water_meter_register.jpg";

    function read_img(img_address){
        Jimp.read(img_address).then(
            function (lenna) {
                for (var iter=0;iter<num_img;iter++){
                    var small_image = lenna.quality(100)                 // set JPEG quality
                        .greyscale()                 // set greyscale
                        .contrast(1)
                        //.posterize(10)
                        //.resize( 100, 100 )
                        //.crop( 70, 120, 60, 60 )
                        .resize( 28, 28).bitmap.data;

                    var context = canvas.getContext('2d');
                    canvas.width = 28;
                    canvas.height = 28;
                    var imagarray = new Uint8ClampedArray(small_image);
                    var imgdata = new ImageData(imagarray, 28, 28);
                    context.putImageData(imgdata, 0, 0);

                    $.post('/read_malcolm',{'image':Array.from(small_image), 'id':iter}, function(data){
                        if(data!=null){
                            var iter = data.id;
                            var pred = data.prob;
                            //console.log(pred);
                            var max = 0;
                            var id = -1;
                            for (var i=0;i<10;i++){
                                var v = pred.w[i];
                                max = v > max? v:max;
                                if (max==v) {id = i;}
                            }
                            console.log(pred);
                            digit[iter] = id;
                            $( "#result" ).html( "<a>"+ id + "</a>" );
                        }
                    });
                }
            }).catch(function (err) {
                console.error(err);
            });
     //   test();
    }
});



//window.addEventListener('load', startup, false);
//$(document).ready(function(){
//    $.getScript("https://cdn.rawgit.com/oliver-moran/jimp/v0.2.27/browser/lib/jimp.min.js", function(){
//        read_img(img_address);
//    });
//});

