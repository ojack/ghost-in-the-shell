var CAM_WIDTH = 200;
var CAM_HEIGHT =200;
var jpgQuality= 0.60;
var blendModes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 
	'soft-light', 'difference', 'exclusion', 'hue', 'saturation',
	'color', 'luminosity'];
var blendIndex = 10;
var canvas, receiverCanvas, compositeCanvas, compositeContext, receiverContext, context, camvideo, stream;
var server_stream, socket, theDataURL;
console.log("reached main!");

var readyForNextFrame = true;

window.onload = function(){
	init();
	document.onkeydown = checkKey;
}


function checkKey(e) {
	blendIndex++;
	if(blendIndex >= blendModes.length) blendIndex = 0;
	receiverContext.globalCompositeOperation = blendModes[blendIndex];
	console.log("blend is "+ blendModes[blendIndex]);
}

function drawScreenElements(){
	viewCanvas = document.createElement('canvas');
	viewCanvas.width = window.innerWidth;
	viewCanvas.height = window.innerHeight;
	viewContext = viewCanvas.getContext('2d');
	//receiverContext.globalCompositeOperation = blendModes[blendIndex];
	document.body.appendChild(viewCanvas);

	canvas = document.createElement('canvas');
	canvas.width = CAM_WIDTH;
	canvas.height = CAM_HEIGHT;
	context = canvas.getContext('2d');
	//document.body.appendChild(canvas);

	compositeCanvas = document.createElement('canvas');
	compositeCanvas.width = CAM_WIDTH;
	compositeCanvas.height = CAM_HEIGHT;
	compositeContext = compositeCanvas.getContext('2d');
	compositeContext.globalCompositeOperation = blendModes[blendIndex];
	//document.body.appendChild(compositeCanvas);

	receiverCanvas = document.createElement('canvas');
	receiverCanvas.width = CAM_WIDTH;
	receiverCanvas.height = CAM_HEIGHT;
	receiverContext = receiverCanvas.getContext('2d');
	//receiverContext.globalCompositeOperation = blendModes[blendIndex];
	//document.body.appendChild(receiverCanvas);

}

function initWebRTC(){
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
window.URL = window.URL || window.webkitURL;
	camvideo = document.getElementById('vid');
	var constraints = {
	  audio: false,
	  video: true
	};
	if (!navigator.getUserMedia) 
	{
		document.getElementById('errorMessage').innerHTML = 
			'Sorry. <code>navigator.getUserMedia()</code> is not available.';
	} else {
		navigator.getUserMedia({video: true}, gotStream, noStream);
	}
}

function initSocket(){
	var str = "" + window.location;
	var extra = str.lastIndexOf("/");
	socketLoc = str.substring(0, extra);
	console.log(socketLoc);
	socket = io(socketLoc);
  
  socket.on('new server frame', function(data){
  	//sconsole.log(data);
  	if(readyForNextFrame){
  		readyForNextFrame = false;
  		var img = new Image;
		img.onload = function(){
			//context.drawImage(camvideo, 0, 0, canvas.width, canvas.height);
			//receiverContext.globalCompositeOperation = 'source-over';
		//	receiverContext.clearRect(0, 0, CAM_WIDTH, CAM_HEIGHT);
			// receiverContext.globalCompositeOperation = 'lighten';
		  receiverContext.drawImage(img,0,0); // Or at whatever offset you like
		  //receiverContext.drawImage(canvas, 0, 0);
		//  console.log("drawing receiver");
		  readyForNextFrame = true;
		  //drawFrame();
		};
		img.src = data.image;
	}
  });

}
function init(){
	drawScreenElements();
	initWebRTC();
	initSocket();
	window.addEventListener( 'resize', onWindowResize, false );




 


  

}

/*new image from webcam is drawn to canvas*/
function drawWebCam(){
	if ( camvideo.readyState === camvideo.HAVE_ENOUGH_DATA ) {
		context.drawImage(camvideo, 0, 0, canvas.width, canvas.height);
	}
	//window.requestAnimationFrame(drawWebCam);

	drawComposite();
}

function drawComposite(){
 // if ( camvideo.readyState === camvideo.HAVE_ENOUGH_DATA ) {
  	//console.log("drawing");
  	//window.requestAnimationFrame(drawFrame);

  	compositeContext.clearRect(0, 0, CAM_WIDTH, CAM_HEIGHT);
   compositeContext.globalCompositeOperation = blendModes[blendIndex];
   	compositeContext.drawImage(receiverCanvas, 0, 0, canvas.width, canvas.height);
   	compositeContext.drawImage(canvas, 0, 0, canvas.width, canvas.height);
  // 	console.log("drawig composite");
  	// readyForNextFrame = true;
  	 sendCompositeToServer();
  	 viewContext.drawImage(compositeCanvas, 0, 0, viewCanvas.width, viewCanvas.height);
  	 viewContext.drawImage(canvas, 5, 5, 150, 150);
  	 viewContext.drawImage(receiverCanvas, 160, 5, 150, 150);
// get the dataURL in .jpg format
   
}

function sendCompositeToServer(){
	theDataURL = compositeCanvas.toDataURL('image/jpeg',jpgQuality);
 	socket.emit('new client frame', {image: theDataURL});
}

function gotStream(stream) 
{
	console.log('got stream!');
	if (window.URL) 
	{   camvideo.src = window.URL.createObjectURL(stream);   } 
	else // Opera
	{   camvideo.src = stream;   }
	camvideo.onerror = function(e) 
	{   stream.stop();   };
	stream.onended = noStream;
	//context.drawImage(camvideo, 0, 0, canvas.width, canvas.height);
	setInterval(drawWebCam, 100);
}

function noStream(e) 
{
	var msg = 'No camera available.';
	if (e.code == 1) 
	{   msg = 'User denied access to use camera.';   }
}

function onWindowResize() {

	viewCanvas.width = window.innerWidth;
	viewCanvas.height = window.innerHeight;

}