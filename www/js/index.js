//to do
//if you add a location and go back to the record page and then return the location is gone and the interface allows you to continue. Oops!
//hide save and continue when recording
//check title and name input
//add double tap icons

// Initialize your app
var myApp = new Framework7({
    animateNavBackIcon:true,
    tapHold: true //enable tap hold events
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


//when record page loads
$$(document).on('page:init', '.page[data-page="record"]', function (e) {
    console.log('record loaded');
    myApp.popover(".recording-popover", ".record-pop");
    document.getElementById('recording-popover').addEventListener('click', function(){
        myApp.closeModal(".recording-popover", true);
    });
});

//when record page reloads
$$(document).on('page:reinit', '.page[data-page="record"]', function (e) {
    console.log('record reloaded');
    myApp.popover(".recording-popover", ".record-pop");
    //removeMapMarker();
});


//when map page loads
$$(document).on('page:init', '.page[data-page="map"]', function (e) {
	injectMapScript();
	//myApp.popover(".map-popover", ".pop");
	//mapPopover.open("#map-popover", "#map", true);
	document.getElementById('map-popover').addEventListener('click', function(){
		myApp.closeModal(".map-popover", true);
	});
});




document.addEventListener('deviceready', function() {
    /* Javascript here... */
    console.log('\n-------------\nDEVICE READY');
    
    document.querySelector('.floating-button').addEventListener('click', function() {
        resetApp();
    });

    document.querySelector('.views').addEventListener('click', function() {
        console.log('page clicked detected');
        idleTimerReset();
    });
    

    document.getElementById('start-stop-record').addEventListener('click', function() {
        console.log('record');
        recordAudio();   
    });


    document.getElementById('start-stop-playback').addEventListener('click', function() {
        var playBtn = document.getElementById('start-stop-playback').querySelector('.f7-icons');
        if (audio.playingBack) {
            audio.pause();
            playBtn.innerText = "play_fill";        
        } else {
            console.log('playing back');
            audio.play();
            playBtn.innerText = "pause_fill";
        };
        
    });



    document.getElementById('go-to-map').addEventListener('click', function() {
        console.log('go-to-map');
        if (recordDone) {
        	mainView.router.load({pageName: 'map'});
            myApp.popover(".map-popover", ".pop");
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
            window.plugins.toast.show('Please double tap a location on the map to continue', '4000', 'center');
        	//navigator.notification.alert("Please tap a location on the map");
        };
        //uploadText();
        //uploadAudio(audio.srcFile);
    });
    

    document.getElementById('finish').addEventListener('click', function() {
        //myApp.addNotification({title: "Thanks! Your story has been submitted", message: "download the Audience app to find other stories around Bristol", hold: 6000});
        //window.plugins.toast.show('Thanks! Your story has been submitted. Download the Audience app to find other stories around Bristol', '6000', 'center');
        console.log('finish');
        if (userInputAdded()) {
            saveUserInput();
            console.log(uploadData);
            //uploadText();
            uploadAudio(audio.srcFile);
            mainView.router.load({pageName: 'thanks'});
            setTimeout(resetApp, 13000);
        } else {
            //window.plugins.toast.show('Please add a title for your story', '4000', 'center');
            window.plugins.toast.showWithOptions({
                message: "Please add a title for your story",
                duration: "3000", // 2000 ms
                position: "center",
                styling: {
                  opacity: 0.75, // 0.0 (transparent) to 1.0 (opaque). Default 0.8
                  backgroundColor: '#FF0000', // make sure you use #RRGGBB. Default #333333
                  textColor: '#FFFFFF', // Ditto. Default #FFFFFF
                  textSize: 20.5, // Default is approx. 13.
                  cornerRadius: 20, // minimum is 0 (square). iOS default 20, Android default 100
                  horizontalPadding: 20, // iOS default 16, Android default 50
                  verticalPadding: 16 // iOS default 12, Android default 30
                }
              });
        };

        
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

    //AUTO SIGN IN
    firebase.auth().signInWithEmailAndPassword(email, pass).catch(function(error) {
      // Handle Errors here.
      console.log(error.code + error.message);
    });

    //SIGN OUT
    //firebase.auth().signOut();
    
    //DETECT LOG IN STATE
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        //navigator.notification.alert(user.email + " is logged in. <br> This App is ready to use");
        console.log(user.email + " logged in");
      } else {
        navigator.notification.alert("This app is not logged in, please check you have an internet connection");
        console.log("logged out");
      }
    });

    //END FIREBASE FUNCTIONS
    

});



//mainView.router.load({pageName: 'map'});
//mainView.router.load({pageName: 'form'});

//globals

//test nav
var recordingTime = 60; //10s
//LOG IN GLOBALS
var email = "matt@mattfenloncreative.co.uk";
var pass = "mshedmus1c";

//RECORD variables
var recordDone = false;
var startStopTimer;
//MAP variables
var map, marker;
var modalDone = false;
var alertDone = false;
var mapCreated = false;
var savedLocation = null;
//data to upload
var uploadData = {};
//sleep
var idleTime = 60*5; //s
var idleTimer = setTimeout(resetApp,  idleTime*1000);


function idleTimerReset(){
    console.log("idle Timer reset");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(resetApp, idleTime*1000);
}


//RESET APP
function resetApp(){
    console.log("app reset");
    document.getElementById('your-name').value = "";
	document.getElementById('your-title').value = "";
	uploadData = {};
	recordDone = false;
    savedLocation = null;
    modalDone = false;
    alertDone = false;
    mapCreated = false;
    myApp.closeModal();
    mainView.router.load({pageName: 'index'});
    document.querySelector('#recording-timer').innerHTML = "";
    resetRecording();
    document.querySelector('#playback-panel').style.display = "none";
    document.querySelector('#go-to-map').style.visibility = 'hidden';  
    stopAudioPlayback();
    idleTimerReset();
    removeMapMarker();
    reCenterMap();
    //myApp.closeModal();
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
    //var marker;
    var mapCenter = {lat: 51.44780110633896, lng: -2.598216131749723};
    //if a marker already has been added load map so marker is in the center
    if (savedLocation != null) {mapCenter =  savedLocation};

    map = new google.maps.Map(document.getElementById('map'), {
        streetViewControl: false,
        clickableIcons: false,
        zoom: 18,
        center: mapCenter,
        gestureHandling: "greedy",
        disableDoubleClickZoom: true
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
    map.addListener('dblclick', function(e) {
        var clickedLoc = JSON.parse(JSON.stringify(e.latLng));
        uploadData.latitude = clickedLoc.lat;
        uploadData.longitude = clickedLoc.lng;
        savedLocation = clickedLoc;
        if (!(alertDone)) {
            setTimeout(function(){
                window.plugins.toast.show('If you want to move the marker you can double tap the map again', '3000', 'center');
                //navigator.notification.alert("If you want to move the marker you can click the map again");
            }   
            ,600);
            alertDone = true;
        }
        console.log();
        //place marker
        if (marker == null) {
            marker = new google.maps.Marker({
                position: e.latLng,
                map: map
            }); 
            marker.setVisible(true);
        } else {
            clickedLoc = new google.maps.LatLng(clickedLoc.lat, clickedLoc.lng)
            marker.setPosition(clickedLoc); 
            marker.setVisible(true);
        } 
    });
    //set global
    mapCreated = true;
}

//map reset functions
function reCenterMap(){
    var center = {lat: 51.44780110633896, lng: -2.598216131749723};
    //var center = new google.maps.LatLng(lat, lon);
    map.setCenter(center);
    map.setZoom(18);
    //marker.setPosition(center);
}

function removeMapMarker() {
    marker.setVisible(false);
}



//USER DATA FUNCTIONS
function saveUserInput(){
    //check to see if name is empty
    var userName = document.getElementById('your-name').value;
    var userTitle = document.getElementById('your-title').value;
    var newUserTitle = "";
    if (userName != "") {
        uploadData.name = userName;
    } else {
        uploadData.name = "Anonymous"
    };
    //check for number of words and add <br> after 5 words
    var replaced = userTitle.split(' ');
    for (var i = 0; i < replaced.length; i++) {
        newUserTitle += replaced[i];
        if (i/5 % 1 === 0 && i != 0 && i != replaced.length-1) {
            newUserTitle += "<br>";
        } else {
            newUserTitle += " ";
        };
    };
	uploadData.title = newUserTitle;
	uploadData.published = true;
}

function userInputAdded() {
    if (document.getElementById('your-title').value != "") {
        return true;
    } else {
        return false;
    };
}

//create random unique string for the id of each button
function makeId() {
	var uniqueId = Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
	return uniqueId;
}

//RECORDING TIMER
function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    startStopTimer = setInterval(function () {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = "Recording: You have " + minutes + ":" + seconds + " seconds remaining";

        if (--timer < 0) {
            display.textContent = "Recording complete. You can use the record button to record again";
            audio.stopRecording();
            //remove class
            clearInterval(startStopTimer);
            recordDone = true;
            document.getElementById('start-stop-record').classList.remove("recording");
            document.querySelector('#playback-panel').style.display = "initial";
        }
    }, 1000);
}

//RECORD AND PLAYBACK AUDIO
var audio = {
    srcFile: "",
    recording: false,
    timeElapsed: 0,
    recordingObject: "",
    playbackObject: "",
    playingBack: false,
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
        audio.recording = true;
    },
    stopRecording: function() {
        console.log("stop recording");
        audio.recordingObject.stopRecord();
        audio.recordingObject.release();
        audio.recording = false;
    },
    play: function() {
        console.log("play recording");
        audio.playbackObject = new Media(audio.srcFile,
        // success callback
        function() {
            console.log("playAudio():Audio Success");
            resetPlayBtn();
        },
        // error callback
        function(err) {
            console.log("playAudio():Audio Error: "+ JSON.stringify(err));
        });
        // Play audio
        audio.playbackObject.play();
        audio.playingBack = true;
    },
    pause: function() {
        audio.playbackObject.pause();
        audio.playingBack = false;
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



function recordAudio(){
    if (audio.recording) {
        audio.stopRecording();
        recordDone = true;
        //remove class
        document.getElementById('start-stop-record').classList.remove("recording");
        clearInterval(startStopTimer);
        document.querySelector('#recording-timer').innerHTML = "Recording complete. You can use the record button to record again";
        document.querySelector('#playback-panel').style.display = "initial";
        document.querySelector('#go-to-map').style.visibility = 'visible';
    } else {
        audio.createAudioFile();
        //add class
        document.getElementById('start-stop-record').classList.add("recording");
        //var recordingTime = 10 * 1
        document.querySelector('#playback-panel').style.display = "none";
        var display = document.querySelector('#recording-timer');
        startTimer(recordingTime, display);
    };
}

//audio and recodring reset functions
function resetRecording(){
    if (audio.recording) {
        audio.stopRecording();
        recordDone = true;
        //remove class
        document.getElementById('start-stop-record').classList.remove("recording");
        clearInterval(startStopTimer);
        document.querySelector('#recording-timer').innerHTML = "";
        document.querySelector('#playback-panel').style.display = "none";
        document.querySelector('#go-to-map').style.visibility = 'hidden';
    };
}

function stopAudioPlayback(){
    if (audio.playingBack) {
        audio.pause();
        var playBtn = document.getElementById('start-stop-playback').querySelector('.f7-icons');
        playBtn.innerText = "pause_fill";
    }
}

function resetPlayBtn(){
    var playBtn = document.getElementById('start-stop-playback').querySelector('.f7-icons');
        playBtn.innerText = "play_fill";
}

//OUTPUT TO TEXTAEREA
var print = {
    ToTextArea: function(output) {
        var currentValue = document.getElementById("ouputarea").innerHTML;
        output += "<br>" + currentValue;
        document.getElementById("ouputarea").innerHTML = output;
    }
};

