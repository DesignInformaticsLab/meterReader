/**
 * Created by p2admin on 2/18/2017.
 */



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
    var address = 'https://raw.githubusercontent.com/DesignInformaticsLab/meterReader/master/data/2.png';
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
    $.post('/read',{'image':address}, function(data){
        if(data!=null){
            var pred = data;
            //console.log(pred);
            var max = 0;
            var id = -1;
            for (var i=0;i<10;i++){
                var v = pred.w[i];
                max = v > max? v:max;
                if (max==v) {id = i;}
            }
            console.log(pred);
            $( "#result" ).append( "<p>Read from: "+ address + "</p>" );
            $( "#result" ).append( "<p>The digit is "+ id + "</p>" );
        }
    });
}


$('#download').hide();
var width = 320;
var height = 0;
var streaming = false;
var video = null;
var canvas = null;
var photo = null;
var startbutton = null;

function startup() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    photo = document.getElementById('photo');
    startbutton = document.getElementById('startbutton');

    navigator.getMedia = ( navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);

    navigator.getMedia(
        {
            video: true,
            audio: false
        },
        function(stream) {
            if (navigator.mozGetUserMedia) {
                video.mozSrcObject = stream;
            } else {
                var vendorURL = window.URL || window.webkitURL;
                video.src = vendorURL.createObjectURL(stream);
            }
            video.play();
        },
        function(err) {
            console.log("An error occured! " + err);
        }
    );

    video.addEventListener('canplay', function(ev){
        if (!streaming) {
            height = video.videoHeight / (video.videoWidth/width);


            if (isNaN(height)) {
                height = width / (4/3);
            }

            video.setAttribute('width', width);
            video.setAttribute('height', height);
            canvas.setAttribute('width', width);
            canvas.setAttribute('height', height);
            streaming = true;
        }
    }, false);

    startbutton.addEventListener('click', function(ev){
        takepicture();
        ev.preventDefault();
    }, false);

    clearphoto();
}


function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
}


function takepicture() {
    var context = canvas.getContext('2d');
    if (width && height) {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);

        var data = canvas.toDataURL('image/png');
        photo.setAttribute('src', data);

        $('#download').show();

        var myImg = document.getElementById("photo").src;
        document.getElementById("downloadButton").href = myImg;

    } else {
        clearphoto();
    }
}

// read and send digits
var img_address = "https://upload.wikimedia.org/wikipedia/en/8/82/Water_meter_register.jpg";
var digit = Array(6);
function read_img(img_address){
    Jimp.read(img_address).then(function (lenna) {
        for (var iter=0;iter<6;iter++){
            var small_image = Array.from(lenna.quality(60)                 // set JPEG quality
                .greyscale()                 // set greyscale
                .contrast(1)
                .crop( 70+iter*50, 120, 60, 60 )
                .resize( 28, 28).bitmap.data);

            $.post('/read',{'image':small_image, 'id':iter}, function(data){
                if(data!=null){
                    var id = data.id;
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
                    digit[id] = id;
                }
            });
        }
    }).catch(function (err) {
        console.error(err);
    });
}


navigator.getUserMedia = ( navigator.getUserMedia || // use the proper vendor prefix
navigator.webkitGetUserMedia ||
navigator.mozGetUserMedia ||
navigator.msGetUserMedia);

navigator.getUserMedia({video: true}, function() {
    alert('camera is supported in your browser');
}, function() {
    alert('camera is not supported in your browser!');
});
//// Prefer camera resolution nearest to 1280x720.
//var constraints = { audio: true, video: { width: 1280, height: 720 } };
//
//navigator.mediaDevices.getUserMedia(constraints)
//    .then(function(mediaStream) {
//        //var video = document.querySelector('video');
//        var video = $('#video')[0];
//        video.srcObject = mediaStream;
//        video.onloadedmetadata = function(e) {
//            video.play();
//        };
//    })
//    .catch(function(err) { console.log(err.name + ": " + err.message); }); // always check for errors at the end.


//window.addEventListener('load', startup, false);
//$(document).ready(function(){
//    $.getScript("https://cdn.rawgit.com/oliver-moran/jimp/v0.2.27/browser/lib/jimp.min.js", function(){
//        read_img(img_address);
//    });
//});

//test();
