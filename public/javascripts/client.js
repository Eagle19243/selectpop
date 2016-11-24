(function($, windowObject, navigatorObject) {
    var socket = io(),
        chatMessage,
        chatBox,
        room,
        localVideo,
        peerConnection,
        peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]};
        
    var voice_rss_key = '3255bee5bc4c44b58e5dfd0639226486';

    navigatorObject.getUserMedia = navigatorObject.getUserMedia ||
        navigatorObject.mozGetUserMedia ||
        navigatorObject.webkitGetUserMedia;
    windowObject.RTCPeerConnection = windowObject.RTCPeerConnection ||
        windowObject.mozRTCPeerConnection ||
        windowObject.webkitRTCPeerConnection;
    windowObject.RTCIceCandidate = windowObject.RTCIceCandidate ||
        windowObject.mozRTCIceCandidate ||
        windowObject.webkitRTCIceCandidate;
    windowObject.RTCSessionDescription = windowObject.RTCSessionDescription ||
        windowObject.mozRTCSessionDescription ||
        windowObject.webkitRTCSessionDescription;

    var Functions = {

        pageReady : function() {
            localVideo = $('.videoview');
            chatBox = $('.chatBox');
            room = $('.room').val();

            console.log(room);

            console.log('hidden value room', room);

            socket.on('message', function(msg) {
                Functions.gotMessageFromServer(msg);
            });

            socket.on('chatMessage', function(msg){
                console.log('received chatMessage', msg);
                Functions.appendChat(msg);
            });

            socket.on('welcome', function(msg) {
                Functions.welcome(msg);
            });
            socket.on('disconnected', function(msg) {
                Functions.disconnected(msg);
            });
            socket.on('connected', function(msg) {
                Functions.connected(msg);
            });
            socket.on('toast', function(notification) {
                Functions.toast(notification);
            });

            var constraints = {
                video: true,
                audio: true,
            };

            if(navigatorObject.getUserMedia) {
                navigatorObject.getUserMedia(constraints,
                    Functions.getUserMediaSuccess,
                    Functions.getUserMediaError
                );
            } else {
                alert('Your browser does not support getUserMedia API');
            }
        },

        createObjectURL : function(file) {
            if ( windowObject.webkitURL ) {
                return windowObject.webkitURL.createObjectURL( file );
            } else if ( windowObject.URL && windowObject.URL.createObjectURL ) {
                return windowObject.URL.createObjectURL( file );
            } else {
                return null;
            }
        },

        getUserMediaSuccess : function(stream) {
            localStream = stream;
            localVideo.src = Functions.createObjectURL(stream);
        },

        getUserMediaError : function(error) {
            console.log(error);
            Functions.toast("getUserMedia Error");
        },

        start : function(isCaller) {
            console.log("start called");
            startButton.val("Calling");
            Functions.toast("calling... Please Wait!!");
            peerConnection = new RTCPeerConnection(peerConnectionConfig);
            peerConnection.onicecandidate = Functions.gotIceCandidate;
            peerConnection.onaddstream = Functions.gotRemoteStream;
            peerConnection.addStream(localStream);
            if(isCaller) {
                peerConnection.createOffer(Functions.gotDescription, Functions.createOfferError);
                console.log("offer created");
            }
            startButton.prop('disabled', true);
        },

        gotDescription : function(description) {
            console.log('got description' + description);
            peerConnection.setLocalDescription(description, function () {
                    socket.emit('message',JSON.stringify({'sdp': description}));
                },
                function() {
                    console.log('set description error');
                    Functions.toast("gotDescription Error");
                });
        },
        gotIceCandidate : function(event) {
            if(event.candidate != null) {
                socket.emit('message', JSON.stringify({'ice': event.candidate}));
            }
        },
        gotRemoteStream : function(event) {
            console.log("got remote stream");
            remoteVideo.src = windowObject.URL.createObjectURL(event.stream);
            startButton.val("Connected");
            Functions.toast("You are in a call!!")
            startButton.prop('disabled', true);
        },
        createOfferError : function(error) {
            console.log(error);
            Functions.toast("Error occured: createOfferError");
        },
        gotMessageFromServer : function(message) {
            //console.log("From server" + message);
            if(!peerConnection) {
                Functions.start(false);
            }
            var signal = JSON.parse(message);
            if(signal.sdp) {
                peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp), function() {
                        peerConnection.createAnswer(Functions.gotDescription, Functions.createAnswerError);
                        console.log("answer created");
                    },
                    function() {
                        console.log("setRemoteDescription error");
                        Functions.toast("Error occured: setRemoteDescriptionError");
                    });
            } else if(signal.ice) {
                peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
                console.log("ice candidate added");
            }
        },

        createAnswerError : function() {
            console.log("createAnswerError");
            Functions.toast("Error occured: createAnswerError");
        },

        appendChat : function(chat) {
            var prevMessage = chatBox.val();
            chatBox.val(chat);
        },

        playMessage : function(msg) {
            VoiceRSS.speech({
                key: voice_rss_key,
                src: msg,
                hl: 'en-us',
                r: 0,
                c: 'mp3',
                f: '44khz_16bit_stereo',
                ssml:false
            });
        },

        welcome : function(message) {
            console.log("Ask someone to join you. Your id is: " + message);
            Functions.makeConnection();
        },

        connected : function(message) {
            console.log('Connected');
        },

        disconnected : function(message) {
            Console.log('Disconnected');
        },

        makeConnection : function () {
            console.log('MakeConnection');
            socket.emit('makeConnection', room);
        },

        toast: function (notification) {
            console.log(notification);
        },

        init : function () {
            console.log('init');
        }
    };

    $(document).ready(function() {
        Functions.init();
        Functions.pageReady();
    });

    //Handers---------------------------------------------


}(jQuery, window, navigator));