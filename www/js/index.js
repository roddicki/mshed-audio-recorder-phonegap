
document.addEventListener('deviceready', function(){
    //deviceready
    /*StatusBar.overlaysWebView(true);
    StatusBar.styleBlackOpaque();
    StatusBar.styleLightContent();*/

    console.log('----DEVICE READY----');
    print.ToTextArea('DEVICE READY');
    //enable background mode plugin
    /*cordova.plugins.backgroundMode.enable();
    cordova.plugins.backgroundMode.on('EVENT', function(e){
        print.ToTextArea('backgroundMode is : ' + e);
    });*/

    document.getElementById('record').addEventListener('click', function() {
        audio.createAudioFile();
    });

    document.getElementById('stop-recording').addEventListener('click', function() {
        audio.stopRecording();
    });

    document.getElementById('play-recording').addEventListener('click', function() {
        audio.play();
    });

    document.getElementById('pause-recording').addEventListener('click', function() {
        audio.timeElapsed = audio.getCurrentPosition();
        audio.pause();
    });

    document.getElementById('share').addEventListener('click', function() {
        print.ToTextArea('share');
        share(audio.srcFile);
    });

    document.getElementById('upload').addEventListener('click', function() {
        print.ToTextArea('upload');
        //uploadText();
        uploadAudio(audio.srcFile);
    });

    // FIREBASE FUNCTIONS
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
      var storageRef = firebase.storage().ref("audioUploads/recordingFromApp1.m4a");
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
          var data = {
            title: "Bedwyr's story",
            name: "Bedwyr",
            latitude: 51.447271, 
            longitude: -2.616087,
            audioFile: task.snapshot.downloadURL
          }
          ref.push(data);
        }

      );
    }


    //END FIREBASE FUNCTIONS

});

//MAP variables
//var marker;
//var loc = {};
var modalDone = false;
var alertDone = false;
var mapCreated = false;
var savedLocation = null;
//data to upload
var uploadData = {};



//ONSEN PAGE NAVIGATION
document.addEventListener('init', function(event) {
    var page = event.target;

    //page 1 loaded
    if (page.id === 'page1') {
        console.log('page 1 loaded');
        page.querySelector('#next-btn').onclick = function() {
            document.querySelector('#myNavigator').pushPage('page2.html', {data: {title: 'Step 2'}});
            StatusBar.styleDefault();
        };
    } 

    //page 2 loaded
    else if (page.id === 'page2') {
        console.log('page 2 loaded');
        if (!(mapCreated)) {
            //inject map script
            injectMapScript();
            //build map with script callback
            if (!(modalDone)) {showModal()};
        };
        page.querySelector('#back-to-p1').onclick = function() {
            console.log('#back-to-p1');
            if (mapCreated) {
                //remove map
                //delete map div
                //delete map script tag
                console.log('delete map-script');
                var parent = document.getElementsByTagName('body')[0];
                var child = document.getElementById('map-script');
                parent.removeChild(child);
                mapCreated = false;
            };
        };
        page.querySelector('#save-location').onclick = function() {
            if (savedLocation != null) {
                console.log(savedLocation.lat, savedLocation.lng);
                document.querySelector('#myNavigator').pushPage('page3.html', {data: {title: 'Step 3'}});
                StatusBar.styleDefault();
            } else {
                ons.notification.alert("Oops you forgot to mark a location");

            };
          
        } 
    }

    //page 3 loaded
    else if (page.id === 'page3') {
        page.querySelector('#finish-btn').onclick = function() {
            console.log(document.querySelector('#name').value);
            console.log(document.querySelector('#story').value);
            ons.notification.toast('Thanks now download the app!', { timeout: 2000, animation: 'fall' })
            //reset variables, empty forms, go to 1
            setTimeout(reset, 3000);
        }
    };

});


//RESET
function reset(){
    document.querySelector('#name').value = "";
    document.querySelector('#story').value = "";
    document.querySelector('#myNavigator').pushPage('page1.html', {data: {title: 'Step 3'}});
    //savedLocation = null;
    //modalDone = false;
    //alertDone = false;
    //mapCreated = false;
}


//ONSEN Map Page modal
function showModal() {
    var modal = document.querySelector('ons-modal');
    modal.show();
    modalDone = true;
}

function hideModal() {
    var modal = document.querySelector('ons-modal');
    modal.hide();
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
                ons.notification.alert("If you want to move the marker you can click the map again");
            }   
            ,600);
            alertDone = true;
        }
    });
    //set global
    mapCreated = true;
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

//CONVERT FILE AND SHARE from cdvfile://localhost/ to file//// 
//(src) must = a cdvfile url
var convertFile = function(src) {
    window.resolveLocalFileSystemURL(src, OnSuccessGetFile, errorCallback);

    function OnSuccessGetFile (entry) {
        var nativePath = entry.toURL();
        uploadData.audioPath = nativePath;
        uploadData,audioObject = entry;
        print.ToTextArea(nativePath);
        print.ToTextArea("fileEntry: " + entry);
        upload(entry);
    }

    function errorCallback(error) {
        print.ToTextArea("ERROR: " + error.code + JSON.stringify(error));
    }
};

//CONVERT FILE AND SHARE from cdvfile://localhost/ to file//// 
//(src) must = a cdvfile url
var share = function(src) {
    window.resolveLocalFileSystemURL(src, OnSuccessGetFile, errorCallback);

    function OnSuccessGetFile (entry) {
        var nativePath = entry.toURL();
        window.plugins.socialsharing.share('audio file', 'Your audio', nativePath);
    }

    function errorCallback(error) {
        print.ToTextArea("ERROR: " + error.code + JSON.stringify(error));
    }
};






