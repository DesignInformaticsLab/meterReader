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
    var num_img = 6;
    var digit = Array(num_img);
    var width = 300;
    var height = 400;

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
        var address = 'https://raw.githubusercontent.com/DesignInformaticsLab/meterReader/master/data/CPPN6.png';
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
    var video_left = parseInt($("#video").css("left"));
    var video_top = parseInt($("#video").css("top"));
    var video_width = $("#video").width();
    var video_height = $("#video").height();

    var crop_height = 60;
    var crop_width = 50;
    var crop_top = 245;
    var crop_left = 120;
    var move = 30;

    $("#frame").css("top",video_top+200+100);
    $("#frame").css("left",video_left+0);
    $("#frame").css("width",150*5 );
    $("#frame").css("height",200);

    function read_img(img_address){
        var canvas_small = [];
        for (var iter=0;iter<num_img;iter++){
            canvas_small.push(document.getElementById('canvas'+(iter+1)));
        }

        for (var iter=0;iter<num_img;iter++){
            read_image_i(img_address, iter, canvas_small);
        }
    }
    function read_image_i(src,iter, canvas_small){
        Jimp.read(src).then(function (lenna) {
            var small_image = lenna.quality(100)
                .greyscale();
            if (iter == 0){
                small_image = small_image.crop( 50, 240, 40, 60);
                small_image = small_image.invert();
            }
            if (iter == 1){
                small_image = small_image.crop( 90, 240, 35, 60);
                small_image = small_image.invert();
            }
            if (iter == 2){
                small_image = small_image.crop( 120, 245, 50, 60);
                small_image = small_image.invert();
            }
            if (iter == 3){
                small_image = small_image.crop( 162, 240, 35, 60);
                //small_image = small_image.invert();
            }
            if (iter == 4){
                small_image = small_image.crop( 200, 240, 50, 60);
            }
            if (iter == 5){
                small_image = small_image.crop( 230, 240, 50, 60);
            }
            //.crop( crop_left+move*iter, crop_top, crop_width, crop_height)
            small_image.resize( 28, 28)
                .rotate(180,false)
                .flip(true,false)
                .normalize()
                .contrast(1);
            //if (iter<2){
            //    small_image = small_image.invert();
            //}
            //if (iter>3){
            //    small_image = small_image.greyscale();
            //}

            small_image = small_image.bitmap.data;

            var context = canvas_small[iter].getContext('2d');
            canvas_small[iter].width = 28;
            canvas_small[iter].height = 28;
            var imagarray = new Uint8ClampedArray(small_image);
            var imgdata = new ImageData(imagarray, 28, 28);
            context.putImageData(imgdata, 0, 0);

            $.post('/read',{'image':Array.from(small_image), 'id':iter}, function(data){
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
                    $( "#result"+(parseInt(iter)+1) ).html( "<a>"+ id + "</a>" );
                }
            });
        }).catch(function (err) {
            console.error(err);
        });
    }
    //train();
});



//window.addEventListener('load', startup, false);
//$(document).ready(function(){
//    $.getScript("https://cdn.rawgit.com/oliver-moran/jimp/v0.2.27/browser/lib/jimp.min.js", function(){
//        read_img(img_address);
//    });
//});

//test();
