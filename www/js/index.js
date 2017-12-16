
document.addEventListener('deviceready', function(){
    //deviceready
    document.getElementById('ready').innerHTML = "Device ready";
    console.log('----DEVICE READY----');
    print.ToTextArea('DEVICE READY');
    
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
});


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

