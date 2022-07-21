const canvasElement = document.getElementById('theCanvas');
const canvasCtx = canvasElement.getContext('2d');

let width = window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;

let height = window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight;

canvasElement.style.position = "absolute";
canvasElement.style.top = "0";
canvasElement.style.left = "0";
canvasElement.width = width;
canvasElement.height = height;
canvasElement.style.transform = "scale(-1, 1)";

function removeElements(landmarks, elements){
    for(let element of elements){
        delete landmarks[element];
    }
}

function removeLandmarks(results){
    if(results.poseLandmarks){
        removeElements(results.poseLandmarks,
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22, 23]);
    }
}

function connect(p1, p2){
    if(p1 && p2){
        canvasCtx.beginPath();
        canvasCtx.moveTo(p1.x * width, p1.y * height);
        canvasCtx.lineTo(p2.x * width, p2.y * height);
        canvasCtx.stroke();
    }
}

const FACE_POINTS = {
    "head": [127, 356, 10, 152, 168],
    "righteye": [33, 133, 159, 145, 468],
    "lefteye": [362, 263, 386, 374, 473],
    "mouth": [78, 308, 13, 14],
    "rightbrow": [105, 107],
    "leftbrow": [336, 334]
};
const POSE_CONNECTIONS = [[0,1],[1,2],[2,3],[3,7],[0,4],[4,5],[5,6],[6,8],[9,10],[11,12],[11,13],[13,15],[15,17],[15,19],[15,21],[17,19],[12,14],[14,16],[16,18],[16,20],[16,22],[18,20],[11,23],[12,24],[23,24],[23,25],[24,26],[25,27],[26,28],[27,29],[28,30],[29,31],[30,32],[27,31],[28,32]];
const HAND_CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
const POSE_LANDMARKS = {NOSE:0,LEFT_EYE_INNER:1,LEFT_EYE:2,LEFT_EYE_OUTER:3,RIGHT_EYE_INNER:4,RIGHT_EYE:5,RIGHT_EYE_OUTER:6,LEFT_EAR:7,RIGHT_EAR:8,P:9,V:10,LEFT_SHOULDER:11,RIGHT_SHOULDER:12,LEFT_ELBOW:13,RIGHT_ELBOW:14,LEFT_WRIST:15,RIGHT_WRIST:16,LEFT_PINKY:17,RIGHT_PINKY:18,LEFT_INDEX:19,RIGHT_INDEX:20,LEFT_THUMB:21,RIGHT_THUMB:22,LEFT_HIP:23,RIGHT_HIP:24,O:25,U:26,L:27,R:28,N:29,T:30,M:31,S:32};

var firstTime = true;
function onResults(results) {
    if(firstTime){
        firstTime = false;
        console.log(results);
    }

    removeLandmarks(results);

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, width, height);
    canvasCtx.drawImage(results.image, 0, 0, width, height);

    if(results.faceLandmarks){
        canvasCtx.fillStyle = "#CCCCCC";
        Object.keys(FACE_POINTS).forEach(function(key){
            let ll = FACE_POINTS[key];
            for(let i of ll){
                let p = results.faceLandmarks[i];
                canvasCtx.beginPath();
                canvasCtx.arc(p.x * width, p.y * height, 4, 0, 2 * Math.PI);
                canvasCtx.fill();
            }
        });
    }

    canvasCtx.lineWidth = 2;
    if(results.poseLandmarks){
        canvasCtx.strokeStyle = "#0000CC";
        for(i in POSE_CONNECTIONS){
            let ll = POSE_CONNECTIONS[i];
            let p1 = results.poseLandmarks[ll[0]];
            let p2 = results.poseLandmarks[ll[1]];
            connect(p1, p2);
        }
    }
    if(results.rightHandLandmarks){
        canvasCtx.strokeStyle = "#00CC00";
        for(i in HAND_CONNECTIONS){
            let ll = HAND_CONNECTIONS[i];
            let p1 = results.rightHandLandmarks[ll[0]];
            let p2 = results.rightHandLandmarks[ll[1]];
            connect(p1, p2);
        }
    }
    if(results.leftHandLandmarks){
        canvasCtx.strokeStyle = "#CC0000";
        for(i in HAND_CONNECTIONS){
            let ll = HAND_CONNECTIONS[i];
            let p1 = results.leftHandLandmarks[ll[0]];
            let p2 = results.leftHandLandmarks[ll[1]];
            connect(p1, p2);
        }
    }

    if(results.poseLandmarks) {
        if(results.rightHandLandmarks){
            canvasCtx.strokeStyle = '#00FF00';
            let p1 = results.poseLandmarks[POSE_LANDMARKS.RIGHT_ELBOW];
            let p2 = results.rightHandLandmarks[0];
            connect(p1, p2);
        }
        if(results.leftHandLandmarks){
            canvasCtx.strokeStyle = '#FF0000';
            let p1 = results.poseLandmarks[POSE_LANDMARKS.LEFT_ELBOW];
            let p2 = results.leftHandLandmarks[0];
            connect(p1, p2);
        }
    }

    canvasCtx.restore();
}

const holistic = new Holistic({locateFile: (file) => {
    if(file.endsWith(".data") || file.endsWith(".tflite")){
        return `data/${file}`;
    }else{
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5/${file}`;
    }
}});
holistic.setOptions({
    cameraOn: true,
    modelComplexity: 0,
    useCpuInference: false,
    smoothLandmarks: false,
    enableSegmentation: false,
    smoothSegmentation: false,
    refineFaceLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.55,
});
holistic.onResults(onResults);

const videoElement = document.createElement('video');
videoElement.playsinline = "playsinline";
videoElement.autoplay = "autoplay";
function startCamera(cb){
    navigator.mediaDevices.getUserMedia({
        audio:false, video:{
            facingMode: 'user',
            width: undefined,
            height: undefined,
        }
    }).then(function(stream){
        window.stream = stream;
        videoElement.srcObject = stream;
    });
    videoElement.onloadeddata = cb;
}
startCamera(function(){
    requestAnimationFrame(theLoop);
});

async function theLoop(){
    await holistic.send({image: videoElement});
    requestAnimationFrame(theLoop);
}
