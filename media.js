/* =========================
   MEDIA UPLOAD + VIEWING
========================= */


/* =========================
   OPEN / CLOSE UPLOAD
========================= */

function openMediaUpload() {

    const modal =
        document.getElementById(
            "mediaUploadModal"
        );

    if (modal) {
        modal.style.display = "block";
    }

    const error =
        document.getElementById(
            "mediaUploadError"
        );

    if (error) {
        error.textContent = "";
    }
}


function closeMediaUpload() {

    const modal =
        document.getElementById(
            "mediaUploadModal"
        );

    if (modal) {
        modal.style.display = "none";
    }

}



/* =========================
   FILE CHECKING
========================= */

function handleMediaVideo(input) {

    const file =
        input.files[0];

    const label =
        document.getElementById(
            "selectedVideo"
        );

    const error =
        document.getElementById(
            "mediaUploadError"
        );


    error.textContent = "";


    if (!file) {

        label.textContent = "";

        return;

    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const allowed = [
        "mp4",
        "mov",
        "avi"
    ];


    if (!allowed.includes(extension)) {

        input.value = "";

        error.textContent =
            "Videos must be MP4, MOV, or AVI.";

        label.textContent = "";

        return;

    }


    label.textContent =
        "Selected video: " + file.name;

}



function handleMediaThumbnail(input) {

    const file =
        input.files[0];


    const label =
        document.getElementById(
            "selectedThumbnail"
        );


    const error =
        document.getElementById(
            "mediaUploadError"
        );


    error.textContent = "";


    if (!file) {

        label.textContent = "";

        return;

    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const allowed = [
        "png",
        "jpg",
        "jpeg",
        "webp"
    ];


    if (!allowed.includes(extension)) {

        input.value = "";

        error.textContent =
            "Thumbnail must be PNG, JPG, JPEG, or WebP.";

        label.textContent = "";

        return;

    }


    label.textContent =
        "Selected thumbnail: " + file.name;

}




/* =========================
   AUTOMATIC THUMBNAIL
========================= */


function generateVideoThumbnail(file) {

    return new Promise((resolve, reject) => {


        const video =
            document.createElement(
                "video"
            );


        const url =
            URL.createObjectURL(
                file
            );


        video.src =
            url;


        video.muted =
            true;


        video.playsInline =
            true;


        video.preload =
            "metadata";



        video.onloadedmetadata =
            function() {


                video.currentTime =
                    Math.min(
                        1,
                        video.duration / 2
                    );


            };



        video.onseeked =
            function() {


                const canvas =
                    document.createElement(
                        "canvas"
                    );


                canvas.width =
                    video.videoWidth;


                canvas.height =
                    video.videoHeight;



                const ctx =
                    canvas.getContext(
                        "2d"
                    );


                ctx.drawImage(
                    video,
                    0,
                    0
                );



                canvas.toBlob(
                    blob => {


                        URL.revokeObjectURL(
                            url
                        );


                        resolve(
                            new File(
                                [
                                    blob
                                ],
                                "thumbnail.jpg",
                                {
                                    type:
                                        "image/jpeg"
                                }
                            )
                        );


                    },
                    "image/jpeg",
                    .85
                );


            };



        video.onerror =
            function() {

                URL.revokeObjectURL(url);

                reject(
                    "Thumbnail failed."
                );

            };


    });

}





/* =========================
   UPLOAD MEDIA
========================= */


async function uploadMedia() {


    const {
        data
    } =
    await supabaseClient.auth.getUser();



    const user =
        data.user;



    const errorBox =
        document.getElementById(
            "mediaUploadError"
        );



    errorBox.textContent = "";



    if (!user) {

        errorBox.textContent =
            "You must be logged in.";

        return;

    }



    const title =
        document.getElementById(
            "mediaTitle"
        ).value.trim();



    const description =
        document.getElementById(
            "mediaDescription"
        ).value.trim();



    const videoInput =
        document.getElementById(
            "mediaVideo"
        );



    const thumbnailInput =
        document.getElementById(
            "mediaThumbnail"
        );



    let videoFile =
        videoInput.files[0];



    let thumbnailFile =
        thumbnailInput.files[0];



    if (!title || !videoFile) {

        errorBox.textContent =
            "Title and video are required.";

        return;

    }



    if (!thumbnailFile) {

        errorBox.textContent =
            "Generating thumbnail...";


        thumbnailFile =
            await generateVideoThumbnail(
                videoFile
            );

    }



    const id =
        crypto.randomUUID();



    const extension =
        videoFile.name
            .split(".")
            .pop()
            .toLowerCase();



    const videoPath =
        `videos/${user.id}/${id}.${extension}`;



    const thumbnailPath =
        `thumbnails/${user.id}/${id}.jpg`;




    errorBox.textContent =
        "Uploading video...";



    const videoUpload =
        await supabaseClient.storage
            .from("post-media")
            .upload(
                videoPath,
                videoFile
            );



    if (videoUpload.error) {

        errorBox.textContent =
            videoUpload.error.message;

        return;

    }




    errorBox.textContent =
        "Uploading thumbnail...";



    const thumbUpload =
        await supabaseClient.storage
            .from("post-media")
            .upload(
                thumbnailPath,
                thumbnailFile
            );



    if (thumbUpload.error) {

        errorBox.textContent =
            thumbUpload.error.message;

        return;

    }





    const videoURL =
        supabaseClient.storage
            .from("post-media")
            .getPublicUrl(
                videoPath
            )
            .data
            .publicUrl;



    const thumbnailURL =
        supabaseClient.storage
            .from("post-media")
            .getPublicUrl(
                thumbnailPath
            )
            .data
            .publicUrl;





    const {
        data: profile
    } =
    await supabaseClient
        .from("profiles")
        .select("username")
        .eq(
            "id",
            user.id
        )
        .single();





    await supabaseClient
        .from("videos")
        .insert({

            user_id:
                user.id,

            username:
                profile.username,

            title:
                title,

            description:
                description || null,

            video_url:
                videoURL,

            thumbnail_url:
                thumbnailURL

        });





    closeMediaUpload();

    loadVideos();

}





/* =========================
   LOAD MEDIA
========================= */


async function loadVideos() {


    const container =
        document.getElementById(
            "mediaContainer"
        );


    if (!container) {
        return;
    }



    container.innerHTML =
        "Loading videos...";



    const {
        data,
        error
    } =
    await supabaseClient
        .from("videos")
        .select("*")
        .order(
            "created_at",
            {
                ascending:false
            }
        );



    if (error) {

        container.textContent =
            error.message;

        return;

    }



    container.innerHTML = "";



    data.forEach(video => {


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "media-card";



        card.innerHTML = `

            <img
                class="media-thumbnail"
                src="${escapeHTML(video.thumbnail_url)}"
            >

            <div class="media-card-title">
                ${escapeHTML(video.title)}
            </div>

        `;



        card.onclick =
            function() {

                openVideoViewer(video);

            };



        container.appendChild(
            card
        );


    });


}





/* =========================
   MEDIA VIEWER FIX
========================= */


function openVideoViewer(video) {

    const viewer =
        document.getElementById("videoViewer");


    if (!viewer) {

        console.error(
            "videoViewer element missing from index.html"
        );

        return;

    }



    viewer.innerHTML = `

        <div class="video-viewer-background">


            <div class="video-viewer-box">


                <button
                    class="video-exit"
                    onclick="closeVideoViewer()"
                >
                    ×
                </button>



                <div class="video-player-area">


                    <video
                        id="mainVideoPlayer"
                        class="main-video-player"
                        poster="${escapeHTML(video.thumbnail_url)}"
                        controlsList="nodownload noplaybackrate nofullscreen"
                        disablePictureInPicture
                        playsinline
                    >

                        <source
                            src="${escapeHTML(video.video_url)}"
                        >

                    </video>



                    <div class="custom-video-controls">


                        <input
                            id="videoProgress"
                            class="video-progress"
                            type="range"
                            min="0"
                            max="100"
                            value="0"
                        >



                        <button
                            id="videoPauseButton"
                            class="video-pause"
                        >
                            Pause
                        </button>


                    </div>


                </div>



                <div class="video-information">


                    <h2>
                        ${escapeHTML(video.title)}
                    </h2>


                    <p>
                        ${escapeHTML(video.description || "")}
                    </p>


                    <span>
                        Uploaded by ${escapeHTML(video.username)}
                    </span>


                </div>


            </div>


        </div>

    `;



    viewer.style.display =
        "block";



    const player =
        document.getElementById(
            "mainVideoPlayer"
        );


    const progress =
        document.getElementById(
            "videoProgress"
        );


    const pauseButton =
        document.getElementById(
            "videoPauseButton"
        );



    player.controls = false;



    player.play();



    pauseButton.onclick =
        function(){


            if(player.paused){

                player.play();

                pauseButton.textContent =
                    "Pause";

            }

            else {

                player.pause();

                pauseButton.textContent =
                    "Play";

            }


        };




    player.ontimeupdate =
        function(){


            if(player.duration){

                progress.value =
                    (
                        player.currentTime /
                        player.duration
                    ) * 100;

            }


        };




    progress.oninput =
        function(){


            if(player.duration){

                player.currentTime =
                    (
                        progress.value /
                        100
                    )
                    *
                    player.duration;

            }


        };




    player.oncontextmenu =
        function(){

            return false;

        };



    player.addEventListener(
        "ratechange",
        function(){

            player.playbackRate = 1;

        }
    );



}





function closeVideoViewer(){


    const viewer =
        document.getElementById(
            "videoViewer"
        );


    if(!viewer){
        return;
    }


    const player =
        document.getElementById(
            "mainVideoPlayer"
        );


    if(player){

        player.pause();

    }



    viewer.style.display =
        "none";


    viewer.innerHTML =
        "";


}




/* =========================
   SPACE BAR PAUSE
========================= */


document.addEventListener(
    "keydown",
    function(event){


        if(event.code !== "Space"){
            return;
        }



        const player =
            document.getElementById(
                "mainVideoPlayer"
            );



        if(player){


            event.preventDefault();



            if(player.paused){

                player.play();

            }

            else {

                player.pause();

            }


        }


    }
);




/* =========================
   CLOSE WHEN CLICKING OUTSIDE
========================= */


window.addEventListener(
    "click",
    function(event){


        const viewer =
            document.getElementById(
                "videoViewer"
            );


        if(
            viewer &&
            event.target === viewer
        ){

            closeVideoViewer();

        }


    }
);

/* =========================
   YOUTUBE STYLE VIDEO PLAYER
========================= */

const videoPlayer =
    document.getElementById("mainVideoPlayer");

const playPauseButton =
    document.getElementById("playPauseButton");

const videoBigPlay =
    document.getElementById("videoBigPlay");

const videoTime =
    document.getElementById("videoTime");

const videoProgress =
    document.getElementById("videoProgress");

const videoProgressContainer =
    document.getElementById("videoProgressContainer");

const muteButton =
    document.getElementById("muteButton");

const volumeSlider =
    document.getElementById("volumeSlider");

const speedButton =
    document.getElementById("speedButton");

const fullscreenButton =
    document.getElementById("fullscreenButton");

const youtubeControls =
    document.querySelector(".youtube-controls");


/* =========================
   TIME
========================= */

function formatVideoTime(seconds) {

    if (
        !Number.isFinite(seconds) ||
        seconds < 0
    ) {
        return "0:00";
    }

    seconds = Math.floor(seconds);

    const minutes =
        Math.floor(seconds / 60);

    const remainingSeconds =
        seconds % 60;

    return (
        minutes +
        ":" +
        remainingSeconds
            .toString()
            .padStart(2, "0")
    );
}


function updateVideoTime() {

    if (!videoPlayer || !videoTime) {
        return;
    }

    videoTime.textContent =
        formatVideoTime(
            videoPlayer.currentTime
        ) +
        " / " +
        formatVideoTime(
            videoPlayer.duration
        );

    if (
        videoPlayer.duration &&
        Number.isFinite(videoPlayer.duration)
    ) {

        const percent =
            (
                videoPlayer.currentTime /
                videoPlayer.duration
            ) * 100;

        videoProgress.style.width =
            percent + "%";
    }
}


/* =========================
   PLAY / PAUSE
========================= */

function updatePlayButton() {

    if (!videoPlayer) {
        return;
    }

    if (videoPlayer.paused) {

        playPauseButton.textContent = "▶";

        videoBigPlay.classList.remove(
            "hidden"
        );

    } else {

        playPauseButton.textContent = "❚❚";

        videoBigPlay.classList.add(
            "hidden"
        );
    }
}


function toggleVideoPlay() {

    if (!videoPlayer) {
        return;
    }

    if (videoPlayer.paused) {

        videoPlayer.play();

    } else {

        videoPlayer.pause();
    }
}


if (playPauseButton) {

    playPauseButton.addEventListener(
        "click",
        toggleVideoPlay
    );
}


if (videoBigPlay) {

    videoBigPlay.addEventListener(
        "click",
        toggleVideoPlay
    );
}


if (videoPlayer) {

    videoPlayer.addEventListener(
        "play",
        updatePlayButton
    );

    videoPlayer.addEventListener(
        "pause",
        updatePlayButton
    );

    videoPlayer.addEventListener(
        "timeupdate",
        updateVideoTime
    );

    videoPlayer.addEventListener(
        "loadedmetadata",
        updateVideoTime
    );

    videoPlayer.addEventListener(
        "durationchange",
        updateVideoTime
    );
}


/* =========================
   PROGRESS BAR
========================= */

if (videoProgressContainer) {

    videoProgressContainer.addEventListener(
        "click",
        function(event) {

            if (
                !videoPlayer ||
                !videoPlayer.duration
            ) {
                return;
            }

            const rect =
                videoProgressContainer.getBoundingClientRect();

            const clickPosition =
                event.clientX - rect.left;

            const percentage =
                clickPosition / rect.width;

            videoPlayer.currentTime =
                percentage *
                videoPlayer.duration;
        }
    );
}


/* =========================
   VOLUME
========================= */

if (volumeSlider) {

    volumeSlider.addEventListener(
        "input",
        function() {

            videoPlayer.volume =
                Number(this.value);

            videoPlayer.muted =
                videoPlayer.volume === 0;

            updateMuteButton();
        }
    );
}


function updateMuteButton() {

    if (!videoPlayer || !muteButton) {
        return;
    }

    if (
        videoPlayer.muted ||
        videoPlayer.volume === 0
    ) {

        muteButton.textContent = "🔇";

    } else if (
        videoPlayer.volume < 0.5
    ) {

        muteButton.textContent = "🔉";

    } else {

        muteButton.textContent = "🔊";
    }
}


if (muteButton) {

    muteButton.addEventListener(
        "click",
        function() {

            videoPlayer.muted =
                !videoPlayer.muted;

            updateMuteButton();
        }
    );
}


/* =========================
   PLAYBACK SPEED
========================= */

const playbackSpeeds = [
    1,
    1.25,
    1.5,
    1.75,
    2
];

let currentSpeedIndex = 0;


if (speedButton) {

    speedButton.addEventListener(
        "click",
        function() {

            currentSpeedIndex++;

            if (
                currentSpeedIndex >=
                playbackSpeeds.length
            ) {
                currentSpeedIndex = 0;
            }

            const speed =
                playbackSpeeds[
                    currentSpeedIndex
                ];

            videoPlayer.playbackRate =
                speed;

            speedButton.textContent =
                speed + "x";
        }
    );
}


/* =========================
   FULLSCREEN
========================= */

if (fullscreenButton) {

    fullscreenButton.addEventListener(
        "click",
        function() {

            const player =
                document.querySelector(
                    ".youtube-video-wrapper"
                );

            if (
                !document.fullscreenElement
            ) {

                if (
                    player.requestFullscreen
                ) {
                    player.requestFullscreen();
                }

            } else {

                document.exitFullscreen();
            }
        }
    );
}


/* =========================
   VIDEO CLICK
========================= */

if (videoPlayer) {

    videoPlayer.addEventListener(
        "click",
        toggleVideoPlay
    );
}


/* =========================
   HIDE CONTROLS
========================= */

let controlsTimeout;


function showVideoControls() {

    if (!youtubeControls) {
        return;
    }

    youtubeControls.classList.remove(
        "hidden"
    );

    clearTimeout(
        controlsTimeout
    );

    if (
        videoPlayer &&
        !videoPlayer.paused
    ) {

        controlsTimeout =
            setTimeout(
                function() {

                    youtubeControls.classList.add(
                        "hidden"
                    );

                },
                2500
            );
    }
}


if (videoPlayer) {

    videoPlayer.addEventListener(
        "mousemove",
        showVideoControls
    );

    videoPlayer.addEventListener(
        "mouseenter",
        showVideoControls
    );

    videoPlayer.addEventListener(
        "play",
        showVideoControls
    );

    videoPlayer.addEventListener(
        "pause",
        function() {

            youtubeControls.classList.remove(
                "hidden"
            );

        }
    );
}