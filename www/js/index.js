//to do
//reset map / remove pin
//record button on/off

// Initialize your app
var myApp = new Framework7({
    animateNavBackIcon:true
});

// Export selectors engine
var $$ = Dom7;

// Add main View
var mainView = myApp.addView('.view-main', {
    // Enable dynamic Navbar
    dynamicNavbar: true,
    iosSwipeBack: false,
    // Enable Dom Cache so we can use all inline pages
    domCache: true
});

//when map page loads
$$(document).on('page:init', '.page[data-page="map"]', function (e) {
	injectMapScript();
	myApp.popover(".map-popover", ".pop");
	//mapPopover.open("#map-popover", "#map", true);
	document.getElementById('map-popover').addEventListener('click', function(){
		myApp.closeModal(".map-popover", true);
	});
});



document.addEventListener('deviceready', function() {
    /* Javascript here... */
    console.log('\n-------------\nDEVICE READY');

    document.getElementById('record').addEventListener('click', function() {
    	console.log('record');
        audio.createAudioFile();
    });

    document.getElementById('stop-recording').addEventListener('click', function() {
    	console.log('stop-recording');
        audio.stopRecording();
        recordDone = true;
    });

    document.getElementById('play-recording').addEventListener('click', function() {
    	console.log('play-recording');
        audio.play();
    });

    document.getElementById('pause-recording').addEventListener('click', function() {
    	console.log('pause-recording');
        audio.timeElapsed = audio.getCurrentPosition();
        audio.pause();
    });

    document.getElementById('go-to-map').addEventListener('click', function() {
        console.log('go-to-map');
        if (recordDone) {
        	mainView.router.load({pageName: 'map'});
        } else {
        	navigator.notification.alert("Oops you haven't finished recording your story");
        };
        //uploadText();
        //uploadAudio(audio.srcFile);
    });

    document.getElementById('go-to-form').addEventListener('click', function() {
        console.log('go-to-form');
        if (savedLocation != null) {
        	mainView.router.load({pageName: 'form'});
        } else {
        	navigator.notification.alert("Please tap a location on the map");
        };
        //uploadText();
        //uploadAudio(audio.srcFile);
    });

    document.getElementById('finish').addEventListener('click', function() {
    	navigator.notification.alert("Thanks! Your story has been submitted, download the app");
        console.log('finish');
        saveUserInput();
        console.log(uploadData);
        //uploadText();
        uploadAudio(audio.srcFile);
        setTimeout(resetApp, 4000);
    });

    // Initialize FIREBASE 
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyDOoUezKPivRQbKI_dBpQC7X4aUB0vit_I",
        authDomain: "audio-retrieve-test.firebaseapp.com",
        databaseURL: "https://audio-retrieve-test.firebaseio.com",
        projectId: "audio-retrieve-test",
        storageBucket: "audio-retrieve-test.appspot.com",
        messagingSenderId: "899690313623"
    };
    firebase.initializeApp(config);
    console.log(firebase);

    //set up database
    var database = firebase.database();
    var ref = database.ref('stories');

    // FIREBASE FUNCTIONS
    //create Blob to upload
    function uploadAudio(src) {
        window.resolveLocalFileSystemURL(src, OnSuccessGetFile, errorCallback);
        function OnSuccessGetFile (fileEntry) {
            fileEntry.file(function (file) {
                var reader = new FileReader();

                reader.onloadend = function() {
                    console.log("Successful file write: " + this.result);
                    console.log(fileEntry.fullPath + ": " + this.result);
                    var name = "recordingBlob";
                    var blob = new Blob([new Uint8Array(this.result)], { type: "audio/mp4" });
                    pushToFirebase(blob); //upload
                };

                reader.readAsArrayBuffer(file);

            }, function(error){console.log(error)});
        }
        function errorCallback(error) {
            print.ToTextArea("ERROR: " + error.code + JSON.stringify(error));
        }
    }

    //UPLOAD     
    function pushToFirebase(file){
      //create storage ref
      var storageRef = firebase.storage().ref("audioUploads/"+uploadData.name+"-"+makeId()+"-recordingMshed.m4a");
      //upload the file
      var task = storageRef.put(file);
      //update the progress bar
      task.on('state_changed',
        //progress
        function progress(snapshot) {
          var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          //uploader.value = percentage;
          console.log(percentage);
        },
        //error
        function error(err) {
          console.log(err);
        },
        //complete
        function complete() {
          console.log("upload complete");
          console.log(task.snapshot.downloadURL);
          //Send data
          uploadData.audioFile = task.snapshot.downloadURL;
          ref.push(uploadData);
        }

      );
    }
    //END FIREBASE FUNCTIONS
    

});



//mainView.router.load({pageName: 'form'});

//RECORD variables
var recordDone = false;
//MAP variables
var modalDone = false;
var alertDone = false;
var mapCreated = false;
var savedLocation = null;
//data to upload
var uploadData = {};

//RESET APP
function resetApp(){
    document.getElementById('your-name').value = "";
	document.getElementById('your-title').value = "";
	uploadData = {};
	recordDone = false;
    savedLocation = null;
    modalDone = false;
    alertDone = false;
    mapCreated = false;
    mainView.router.load({pageName: 'index'});
    //reset map to mshed
    //remove marker
}


//MAP functions
function injectMapScript() {
    console.log('injecting script tag');
    var script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.id = "map-script";
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCAWs4z177IcctYZJzfh42S8UZvIddSTLA&callback=initMap";
    document.getElementsByTagName('body')[0].appendChild(script);
}


//create map - fired by the googleapis script tag
function initMap() {
    console.log('initMap');
    var marker;
    var mapCenter = {lat: 51.44780110633896, lng: -2.598216131749723};
    //if a marker already has been added load map so marker is in the center
    if (savedLocation != null) {mapCenter =  savedLocation};

    var map = new google.maps.Map(document.getElementById('map'), {
        streetViewControl: false,
        clickableIcons: false,
        zoom: 18,
        center: mapCenter
    });


    //if saved location exists place marker
    if (savedLocation != null) {
        console.log("savedLocation works trying to place marker");
        marker = new google.maps.Marker({
            position: savedLocation,
            map: map
        }); 
    };
    
    //listen for map click and add / move marker
    map.addListener('click', function(e) {
        var clickedLoc = JSON.parse(JSON.stringify(e.latLng));
        uploadData.latitude = clickedLoc.lat;
        uploadData.longitude = clickedLoc.lng;
        savedLocation = clickedLoc;
        
        //place marker
        if (marker == null) {
            marker = new google.maps.Marker({
                position: e.latLng,
                map: map
            }); 
        } else {
            clickedLoc = new google.maps.LatLng(clickedLoc.lat, clickedLoc.lng)
            marker.setPosition(clickedLoc); 
        } 
        if (!(alertDone)) {
            setTimeout(function(){
            	navigator.notification.alert("If you want to move the marker you can click the map again");
            }   
            ,600);
            alertDone = true;
        }
    });
    //set global
    mapCreated = true;
}

//USER DATA FUNCTIONS
function saveUserInput(){
	uploadData.name = document.getElementById('your-name').value;
	uploadData.title = document.getElementById('your-title').value;
	uploadData.published = false;
}

//create random unique string for the id of each button
function makeId() {
	var uniqueId = Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
	return uniqueId;
}



//RECORD AND PLAYBACK AUDIO
var audio = {
    srcFile: "",
    timeElapsed: 0,
    recordingObject: "",
    playbackObject: "",
    createAudioFile: function() {
        var type = LocalFileSystem.PERSISTENT;
        var size = 5*1024*1024;
        window.requestFileSystem(type, size, successCallback, errorCallback);
        function successCallback(fs) {
            fs.root.getFile('recording.m4a', {create: true, exclusive: false}, function(fileEntry) {
                print.ToTextArea('Audio File creation successfull:');
                //get file location
                audio.srcFile = fileEntry.toInternalURL();
                print.ToTextArea("Audio File Location: " + audio.srcFile);
                //start recording
                audio.recordAudio();
            }, errorCallback);
        }
        function errorCallback(error) {
            print.ToTextArea("ERROR: " + error.code + JSON.stringify(error));
        }
    },
    recordAudio: function() {
        print.ToTextArea("Starting to record");
        //new Media() makes a file if one does not exist
        audio.recordingObject = new Media(audio.srcFile,
            // success callback
            function() {
                print.ToTextArea("recordAudio():Audio Success");
            },
            // error callback
            function(err) {
                print.ToTextArea("recordAudio():Audio Error: "+ err.code);
            }
        );
        // Record audio
        audio.recordingObject.startRecord();
    },
    stopRecording: function() {
        console.log("stop recording");
        audio.recordingObject.stopRecord();
        audio.recordingObject.release();
    },
    play: function() {
        console.log("play recording");
        audio.playbackObject = new Media(audio.srcFile,
        // success callback
        function() {
            print.ToTextArea("playAudio():Audio Success");
        },
        // error callback
        function(err) {
            print.ToTextArea("playAudio():Audio Error: "+ JSON.stringify(err));
        });
        // Play audio
        audio.playbackObject.play();
    },
    pause: function() {
        audio.playbackObject.pause();
    },
    getCurrentPosition: function() {
        audio.playbackObject.getCurrentPosition(
            function(secs){
                print.ToTextArea("Elapsed Time: "+ secs);
            }, 
            function(err) {
                print.ToTextArea("recordAudio():Audio Error: "+ err.code);
            });
    },
    goTo: function() {
        audio.playbackObject.seekTo(audio.timeElapsed*1000);
    }

};


//OUTPUT TO TEXTAEREA
var print = {
    ToTextArea: function(output) {
        var currentValue = document.getElementById("ouputarea").innerHTML;
        output += "<br>" + currentValue;
        document.getElementById("ouputarea").innerHTML = output;
    }
};

