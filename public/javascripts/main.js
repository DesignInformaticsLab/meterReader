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

test();