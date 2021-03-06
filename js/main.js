var vid = document.getElementById('videoel');
var vid_width = vid.width;
var vid_height = vid.height;
var overlay = document.getElementById('overlay');
var overlayCC = overlay.getContext('2d');
var webgl_overlay = document.getElementById('webgl');
var mask_image;

/*===================================================================================================================================================*/
/*                                                                                                                                                   */
/*                                             Setup of video/webcam and checking for webGL support                                                  */
/*                                                                                                                                                   */
/*===================================================================================================================================================*/

function enablestart() {
    startVideo();
}

var insertAltVideo = function(video) {
    if (supports_video()) {
        if (supports_webm_video()) {
            video.src = "./media/cap13_edit2.webm";
        } else if (supports_h264_baseline_video()) {
            video.src = "./media/cap13_edit2.mp4";
        } else {
            return false;
        }
        fd.init(webgl_overlay);
        return true;
    } else return false;
}

function adjustVideoProportions() {
    // resize overlay and video if proportions are not 4:3
    // keep same height, just change width
    var proportion = vid.videoWidth/vid.videoHeight;
    vid_width = Math.round(vid_height * proportion);
    vid.width = vid_width;
    overlay.width = vid_width;
    webgl_overlay.width = vid_width;
    webGLContext.viewport(0,0,webGLContext.canvas.width,webGLContext.canvas.height);
}

// check whether browser supports webGL
var webGLContext;
if (window.WebGLRenderingContext) {
    webGLContext = webgl_overlay.getContext('webgl') || webgl_overlay.getContext('experimental-webgl');
    if (!webGLContext || !webGLContext.getExtension('OES_texture_float')) {
        webGLContext = null;
    }
}

if (webGLContext == null) {
    alert("Your browser does not seem to support WebGL. Unfortunately this face mask example depends on WebGL, so you'll have to try it in another browser. :(");
}

function gumSuccess( stream ) {
    // add camera stream if getUserMedia succeeded
    if ("srcObject" in vid) {
        vid.srcObject = stream;
    } else {
        vid.src = (window.URL && window.URL.createObjectURL(stream));
    }
    vid.onloadedmetadata = function() {
        adjustVideoProportions();
        fd.init(webgl_overlay);
        vid.play();
    }
    vid.onresize = function() {
        adjustVideoProportions();
        fd.init(webgl_overlay);
        if (trackingStarted) {
            ctrack.stop();
            ctrack.reset();
            ctrack.start(vid);
        }
    }
}

function gumFail() {
    // fall back to video if getUserMedia failed
    insertAltVideo(vid);
    document.getElementById('gum').className = "hide";
    document.getElementById('nogum').className = "nohide";
    alert("There was some problem trying to fetch video from your webcam, using a fallback video instead.");
}

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

// check for camerasupport
if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia({video : true}).then(gumSuccess).catch(gumFail);
} else if (navigator.getUserMedia) {
    navigator.getUserMedia({video : true}, gumSuccess, gumFail);
} else {
    insertAltVideo(vid)
    document.getElementById('gum').className = "hide";
    document.getElementById('nogum').className = "nohide";
    alert("Your browser does not seem to support getUserMedia, using a fallback video instead.");
}

vid.addEventListener('canplay', enablestart, false);

/*===================================================================================================================================================*/
/*                                                                                                                                                   */
/*                                                    Code for face tracking and face masking                                                        */
/*                                                                                                                                                   */
/*===================================================================================================================================================*/

var ctrack = new clm.tracker();
ctrack.init(pModel);
var trackingStarted = false;

function startVideo() {
    // start video
    vid.play();
    // start tracking
    ctrack.start(vid);
    trackingStarted = true;
    // start drawing face grid
    drawGridLoop();
}

var positions;
var fd = new faceDeformer();
var averageMask = [[121.92799191984679,184.19216240419755],[118.74113263254269,253.7017373484083],[128.07732840700828,314.0651648786312],[145.50341586402052,377.3404382903117],[175.0470179047746,428.3720278198884],[216.26268310246033,469.2344402538887],[267.42588166495466,502.128073946532],[323.6864139765614,512.5053811316307],[381.1889691089136,499.48530971536445],[429.71357990120225,463.4214900408549],[467.1292936657478,421.537754329594],[493.2308725208873,370.6466670145585],[507.3945907183312,305.3965374123],[514.1098885852615,238.51000761747102],[507.2009944162471,174.7364492942625],[465.59705810723074,136.75665747531139],[432.10874975324265,125],[384.15174446143584,125],[351.54488594535763,135.22963355336668],[162.16177451030518,144.72103952617107],[194.70376235949394,126],[241,130],[277.5198647210173,137.82992220884094],[192.5627380181407,182.35373455399292],[225.1658086004223,166.85817167285668],[262.9021389237093,184.72604899079232],[224.82421319031323,193.62679469584918],[224.9386274222809,179.73191446260716],[443.75218061508883,177.1556294105885],[407.36102478935464,162.1785032964798],[367.3426762945685,181.37362678808685],[405.2498567443763,188.75927101523848],[404.863153412407,173.65270066194788],[314, 170],[277.2539320006613,252.0592473714927],[258.790607031229,284.0832945003201],[276.64778558874696,304.54255347445314],[317.4772090972725,307.7859653833357],[364.4959193923387,299.6561959465791],[377.27275089177823,279.043842539653],[357.1140334647449,250.14961061471956],[324,222],[296.770695143374,295.6331974142146],[350.24114846328195,290.942330984987],[248.8532880314441,372.38004806995957],[272.1557077756945,356.35352520595814],[302.9902196911147,350.59821534914704],[323.11457426149127,353.0358352022737],[338.3055779254553,347.5427982113969],[366.49269601972713,353.1538257295358],[392.63652105652415,368.4911974180641],[375.0778975047938,391.4413420753004],[352.32935954043757,405.19247889714825],[320.19499419206926,411.930992226806],[288.9192573286629,407.35752671668797],[267.61253113280924,394.527019223827],[286.6817714614754,382.82667526139215],[320.16223074694074,385.86502934549657],[359.1212544588326,380.7487964985724],[361.7270998810554,365.15603335898066],[322.91210334135167,367.2901736762333],[280.7920218316411,368.2798825278876],[320.66814785515174,277.11007275979364],[206.36606604411398,171.6086547538323],[247.5375468161923,170.29657636660522],[246.36866333618227,191.67729410789994],[205.19888043799355,189.99033691329964],[429.0603263358775,166.1691180598579],[386.8504393293843,166.2774220754911],[384.7938981921405,186.5701136634426],[426.9983448269614,184.45786533091854]];
var animationRequest;

function drawGridLoop() {
    // get position of face
    positions = ctrack.getCurrentPosition();
    overlayCC.clearRect(0, 0, vid_width, vid_height);
    if (positions) {
        // draw current grid
        ctrack.draw(overlay);
    }
    // check whether mask has converged
    var pn = ctrack.getConvergence();
    if (pn < 0.4) {
        switchMasks();
        requestAnimFrame(drawMaskLoop);
    } else {
        requestAnimFrame(drawGridLoop);
    }
}

function switchMasks() {
    // get mask
    fd.load(document.getElementById('average'), averageMask, pModel);
}

function drawMaskLoop() {
    // get position of face
    positions = ctrack.getCurrentPosition();
    overlayCC.clearRect(0, 0, vid_width, vid_height);
    if (positions) {
        // draw mask on top of face
        fd.draw(positions);
        if(getRandomInt(10)==1){
            //mask_image = webgl_overlay.toDataURL('image/png');
            // var hidden_canvas = document.querySelector('#combine'),
            // context = hidden_canvas.getContext('2d');
            // var width = vid.videoWidth,
            // height = vid.videoHeight;
            // context.drawImage(webgl_overlay, 0, 0, width, height);
            mask_image = cloneCanvas(webgl_overlay);
        }
    }
    document.getElementById('controls').classList.remove("hidden");
    animationRequest = requestAnimFrame(drawMaskLoop);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function cloneCanvas(oldCanvas) {

    //create a new canvas
    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');

    //set dimensions
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    //apply the old canvas to the new one
    context.drawImage(oldCanvas, 0, 0);

    //return the new canvas
    return newCanvas;
}

/*===================================================================================================================================================*/
/*                                                                                                                                                   */
/*                                                       Race/Sex/Age Valuation Comparison                                                           */
/*                                                                                                                                                   */
/*===================================================================================================================================================*/

function screencap() {
    document.getElementById('results').classList.remove("hidden");
    document.getElementById('nomask-title').innerHTML = 'Before';
    document.getElementById('combine-title').innerHTML = 'After';
    var combine_canvas = document.querySelector('#combine'),
    combine_context = combine_canvas.getContext('2d');
    var nomask_canvas = document.querySelector('#nomask'),
    nomask_context = nomask_canvas.getContext('2d');

    var width = vid.videoWidth,
    height = vid.videoHeight;

    if (width && height) {
        // Setup canvases with the same dimensions as the video.
        combine_canvas.width = width;
        combine_canvas.height = height;
        nomask_canvas.width = width;
        nomask_canvas.height = height;

        // Make a copy of the current frame in the video on the canvas.
        combine_context.drawImage(vid, 0, 0, width, height);
        combine_context.drawImage(mask_image, 0, 0, width, height);
        nomask_context.drawImage(vid, 0, 0, width, height);

        // Turn the canvas image into a dataURL that can be used as a src for our photo.
        var combine_img = combine_canvas.toDataURL('image/png');
        var nomask_img = nomask_canvas.toDataURL('image/png');
    }

    var headers = {
        "Content-type"     : "application/json",
        "app_id"          : "ad48aba9",
        "app_key"         : "fc67b8b3c454213c8e9dfc1dd3f7fa23",
    };
    var nomask_payload  = { "image" : nomask_img};
    var combine_payload  = { "image" : combine_img};
    var url = "https://api.kairos.com/detect";
    $.ajax(url, {
       headers  : headers,
       type: "POST",
       data: JSON.stringify(nomask_payload),
       dataType: "text"
    }).done(function(response){
        console.log('nomask results:')
        console.log(response);
        document.getElementById("nomask-json").innerHTML = JSON.stringify(JSON.parse(response), undefined, 2);
    });

    $.ajax(url, {
       headers  : headers,
       type: "POST",
       data: JSON.stringify(combine_payload),
       dataType: "text"
    }).done(function(response){
        console.log('combine results:')
        console.log(response);
        document.getElementById("combine-json").innerHTML = JSON.stringify(JSON.parse(response), undefined, 2);
    });

}
