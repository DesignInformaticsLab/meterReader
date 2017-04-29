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
    var width = 180;
    var height = 360;

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

    var crop_height = 300;
    var crop_width = 300;
    var crop_top = 0;
    var crop_left = 0;
    var move = 200;

    $("#frame").css("top",video_top+crop_top);
    $("#frame").css("left",video_left+crop_left);
    $("#frame").css("width",crop_width );
    $("#frame").css("height",crop_height);

    function read_img(img_address){
        var canvas_small = [];
        for (var iter=0;iter<num_img;iter++){
            canvas_small.push(document.getElementById('canvas'+(iter+1)));
        }


        Jimp.read(img_address).then(
            function (lenna) {
                for (var iter=0;iter<num_img;iter++){
                    var small_image = lenna.quality(100)
                        .greyscale()
                        //.crop( crop_left+move*iter, crop_top, crop_width, crop_height)
                        .resize( 28, 28)
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
                }
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
