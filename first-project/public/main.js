const divSelectRoom = document.getElementById('selectRoom');
const divConsultingRoom = document.getElementById('consultingRoom');
const inputRoomNumber = document.getElementById('roomNumber');
const btnGoRoom = document.getElementById('goRoom');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let roomNumber, localStream, remoteStream, rtcPeerConnection, isCaller;

const iceServers = {
  isServer: [
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.l.google.com:19302 '}
  ]
};

const streamConstraints = {
  audio: true,
  video: true
};

const socket = io();

btnGoRoom.onclick = () => {
  if (inputRoomNumber.value === '') {
    alert('Please enter a valid room number');
  } else {
    roomNumber = inputRoomNumber.value;
    socket.emit('create or join', roomNumber);
    divSelectRoom.style = 'display: none';
    divConsultingRoom.style = 'display: block';
  }
};

socket.on('created', () => {
  navigator.mediaDevices.getUserMedia(streamConstraints)
      .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
        isCaller = true;
      })
      .catch(console.error);
});

socket.on('joined', () => {
  navigator.mediaDevices.getUserMedia(streamConstraints)
    .then(stream => {
      localStream = stream;
      localVideo.srcObject = stream;
      socket.emit('ready', roomNumber);
    })
});

socket.on('ready', () => {
  if (isCaller) {
    // TODO: Search for RTCPeerConnection API
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    // TODO: Search for getTracks API
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    rtcPeerConnection.createOffer()
      .then(sessionDescription => {
        // TODO: Search for setLocalDescription API
        rtcPeerConnection.setLocalDescription(sessionDescription);
        socket.emit('offer', {
          type: 'offer',
          sdp: sessionDescription,
          room: roomNumber
        })
      })
      .catch(console.error);
  }
});

socket.on('offer', event => {
  if (!isCaller) {
    // TODO: Search for RTCPeerConnection API
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    // TODO: Search for getTracks API
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    rtcPeerConnection.createAnswer()
      .then(sessionDescription => {
        // TODO: Search for setLocalDescription API
        rtcPeerConnection.setLocalDescription(sessionDescription);
        socket.emit('answer', {
          type: 'answer',
          sdp: sessionDescription,
          room: roomNumber
        })
      })
      .catch(console.error);
  }
});

socket.on('answer', event => {
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

socket.on('candidate', event => {
  const candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate
  })
  rtcPeerConnection.addIceCandidate(candidate);
})

function onAddStream(event) {
  remoteVideo.srcObject = event.streams[0];
  remoteStream = event.streams[0];
};

function onIceCandidate(event) {
  if (event.candidate) {
    //TODO: What is this candidate?
    console.log('sending ice candidate', event.candidate);
    socket.emit('candidate', {
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate,
      room: roomNumber
    })
  }
}