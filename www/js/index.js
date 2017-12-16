
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        //app.receivedEvent('deviceready');
        document.getElementById('ready').innerHTML = "Device ready";
        console.log('----DEVICE READY----');
        outputToTextarea('DEVICE READY');
        
        document.getElementById('record').addEventListener('click', function() {
            audio.createAudioFile();
        });

        document.getElementById('stop-recording').addEventListener('click', function() {
            audio.stopRecording();
        });

        document.getElementById('play-recording').addEventListener('click', function() {
            console.log("play btn pressed");
            audio.goTo(2);
            audio.play();
        });

        document.getElementById('pause-recording').addEventListener('click', function() {
            audio.timeElapsed = audio.getCurrentPosition();
            audio.pause();
        });

    },
};


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
                outputToTextarea('Audio File creation successfull:');
                //get file location
                audio.srcFile = fileEntry.toInternalURL();
                outputToTextarea("Audio File Location: " + audio.srcFile);
                //start recording
                audio.recordAudio();
            }, errorCallback);
        }
        function errorCallback(error) {
            outputToTextarea("ERROR: " + error.code + JSON.stringify(error));
        }
    },
    recordAudio: function() {
        outputToTextarea("Starting to record");
        //new Media() makes a file if one does not exist
        audio.recordingObject = new Media(audio.srcFile,
            // success callback
            function() {
                outputToTextarea("recordAudio():Audio Success");
            },
            // error callback
            function(err) {
                outputToTextarea("recordAudio():Audio Error: "+ err.code);
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
        console.log("play");
        audio.playbackObject = new Media(audio.srcFile,
        // success callback
        function() {
            outputToTextarea("playAudio():Audio Success");
        },
        // error callback
        function(err) {
            outputToTextarea("playAudio():Audio Error: "+ JSON.stringify(err));
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
                outputToTextarea("Elapsed Time: "+ secs);
            }, 
            function(err) {
                outputToTextarea("recordAudio():Audio Error: "+ err.code);
            });
    },
    goTo: function() {
        audio.playbackObject.seekTo(audio.timeElapsed*1000);
    }

};


//OUTPUT TO TEXTAREA
function outputToTextarea(output) {
    var currentValue = document.getElementById("ouputarea").innerHTML;
    output += "<br><br>" + currentValue;
    document.getElementById("ouputarea").innerHTML = output;
}


//CONVERT FILE LOCATION from cdvfile://localhost/ to file//// 
//(src) should = a cdvfile url
function getNativeFileLocation(src) {
    window.resolveLocalFileSystemURL(src, OnSuccessGetFile, errorCallback)

    function OnSuccessGetFile (entry) {
        var nativePath = entry.toURL();
        outputToTextarea('Native URI: ' + nativePath);
    }

    function errorCallback(error) {
        outputToTextarea("ERROR: " + error.code + JSON.stringify(error));
    }
}
