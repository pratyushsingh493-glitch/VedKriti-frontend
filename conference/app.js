const APP_ID = "7ff6328ae61e4a3ea3676b6e1b3172c8"
const TOKEN = "007eJxTYLDJOLq7yDzQfnEex93V96/PnnJtc7y5qMiaJWE8q0+GhRYpMJinpZkZG1kkppoZppokGqcmGpuZmyWZpRomGRuaGyVbXDgantUQyMgQ+vswMyMDBIL4LAy5iZl5DAwAXvwgMA=="
const CHANEL = "main"

const client = AgoraRTC.createClient({mode:'rtc',codec:'vp8'})

let localTracks = []
let remoteUsers = {}

let joinAndDisplayLocalStream = async()=>{

    client.on('user-published',handleUserJoined)
    client.on('user-left',handleUserLeft)

    let UID = await client.join(APP_ID, CHANEL, TOKEN, null)
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()
    let player = `<div class="video-container" id="user-container-${UID}">
                        <div class="video-player" id="user-${UID}"></div>
                  </div>`
    document.getElementById('video-stream').insertAdjacentHTML('beforeend',player)
    localTracks[1].play(`user-${UID}`)
    await client.publish([localTracks[0],localTracks[1]])
}

let joinStream = async()=>{
    try {
        await joinAndDisplayLocalStream();

        document.getElementById('join-btn').style.display = 'none';
        document.getElementById('stream-controls').style.display = 'flex';
    } catch (error) {
        console.error("Could not join stream:", error);
        alert("Couldn't Join Stream! Try again Later");
    }
}

let handleUserJoined = async(user,mediaType)=>{
    remoteUsers[user.uid] = user
    await client.subscribe(user,mediaType)

    if(mediaType === 'video'){
        let player = document.getElementById(`user-container-${user.uid}`)
        if(player!=null) player.remove();

        player = `<div class="video-container" id="user-container-${user.uid}">
                            <div class="video-player" id="user-${user.uid}"></div>
                    </div>`
        document.getElementById('video-stream').insertAdjacentHTML('beforeend',player)

        user.videoTrack.play(`user-${user.uid}`)
    }

    if(mediaType === 'audio'){
        user.audioTrack.play()
    }
}

let handleUserLeft = async(user)=>{
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async()=>{
    for(let i=0;localTracks.length>i;i++){
        localTracks[i].stop()
        localTracks[i].close()
    }
    await client.leave()
    document.getElementById('join-btn').style.display = 'block';
    document.getElementById('stream-controls').style.display = 'none';
    document.getElementById('video-stream').innerHTML = '';
}

let toggleMic = async(e)=>{
    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        e.target.innerText = 'Mic On'
        e.target.style.backgroundColor = 'cadetblue'
    }else{
        await localTracks[0].setMuted(true)
        e.target.innerText = 'Mic Off'
        e.target.style.backgroundColor = '#EE4B2B'
    }
}

let toggleCam = async(e)=>{
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        e.target.innerText = 'Camera On'
        e.target.style.backgroundColor = 'cadetblue'
    }else{
        await localTracks[1].setMuted(true)
        e.target.innerText = 'Camera Off'
        e.target.style.backgroundColor = '#EE4B2B'
    }
}

document.getElementById('join-btn').addEventListener('click',joinStream)
document.getElementById('leave-btn').addEventListener('click',leaveAndRemoveLocalStream)
document.getElementById('mic-btn').addEventListener('click',toggleMic)
document.getElementById('cam-btn').addEventListener('click',toggleCam)