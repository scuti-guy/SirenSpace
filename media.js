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

    if (!modal) {
        return;
    }

    modal.style.display = "flex";

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

    if (error) {
        error.textContent = "";
    }


    if (!file) {

        if (label) {
            label.textContent = "";
        }

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

        if (error) {
            error.textContent =
                "Videos must be MP4, MOV, or AVI.";
        }

        if (label) {
            label.textContent = "";
        }

        return;
    }


    if (label) {
        label.textContent =
            "Selected video: " + file.name;
    }

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


    if (error) {
        error.textContent = "";
    }


    if (!file) {

        if (label) {
            label.textContent = "";
        }

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

        if (error) {
            error.textContent =
                "Thumbnail must be PNG, JPG, JPEG, or WebP.";
        }

        if (label) {
            label.textContent = "";
        }

        return;
    }


    if (label) {
        label.textContent =
            "Selected thumbnail: " + file.name;
    }

}




/* =========================
   AUTOMATIC THUMBNAIL
========================= */

function generateVideoThumbnail(file) {

    return new Promise((resolve, reject) => {

        const video =
            document.createElement("video");

        const url =
            URL.createObjectURL(file);

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

                if (
                    !video.videoWidth ||
                    !video.videoHeight
                ) {

                    URL.revokeObjectURL(url);

                    reject(
                        "Could not read video dimensions."
                    );

                    return;
                }


                video.currentTime =
                    Math.min(
                        1,
                        video.duration / 2
                    );
            };


        video.onseeked =
            function() {

                const canvas =
                    document.createElement("canvas");


                canvas.width =
                    video.videoWidth;

                canvas.height =
                    video.videoHeight;


                const ctx =
                    canvas.getContext("2d");


                if (!ctx) {

                    URL.revokeObjectURL(url);

                    reject(
                        "Could not create thumbnail."
                    );

                    return;
                }


                ctx.drawImage(
                    video,
                    0,
                    0
                );


                canvas.toBlob(
                    function(blob) {

                        URL.revokeObjectURL(url);


                        if (!blob) {

                            reject(
                                "Could not create thumbnail."
                            );

                            return;
                        }


                        resolve(
                            new File(
                                [blob],
                                "thumbnail.jpg",
                                {
                                    type:
                                        "image/jpeg"
                                }
                            )
                        );

                    },
                    "image/jpeg",
                    0.85
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

    try {

        const {
            data,
            error: userError
        } =
        await supabaseClient.auth.getUser();


        if (userError) {
            throw userError;
        }


        const user =
            data.user;


        const errorBox =
            document.getElementById(
                "mediaUploadError"
            );


        if (errorBox) {
            errorBox.textContent = "";
        }


        if (!user) {

            if (errorBox) {
                errorBox.textContent =
                    "You must be logged in.";
            }

            return;
        }


        const titleInput =
            document.getElementById(
                "mediaTitle"
            );


        const descriptionInput =
            document.getElementById(
                "mediaDescription"
            );


        const videoInput =
            document.getElementById(
                "mediaVideo"
            );


        const thumbnailInput =
            document.getElementById(
                "mediaThumbnail"
            );


        if (
            !titleInput ||
            !descriptionInput ||
            !videoInput ||
            !thumbnailInput
        ) {

            if (errorBox) {
                errorBox.textContent =
                    "Media upload form is missing.";
            }

            return;
        }


        const title =
            titleInput.value.trim();


        const description =
            descriptionInput.value.trim();


        const videoFile =
            videoInput.files[0];


        let thumbnailFile =
            thumbnailInput.files[0];


        if (!title || !videoFile) {

            if (errorBox) {
                errorBox.textContent =
                    "Title and video are required.";
            }

            return;
        }


        if (!thumbnailFile) {

            if (errorBox) {
                errorBox.textContent =
                    "Generating thumbnail...";
            }


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


        if (errorBox) {
            errorBox.textContent =
                "Uploading video...";
        }


        const videoUpload =
            await supabaseClient.storage
                .from("post-media")
                .upload(
                    videoPath,
                    videoFile
                );


        if (videoUpload.error) {
            throw videoUpload.error;
        }


        if (errorBox) {
            errorBox.textContent =
                "Uploading thumbnail...";
        }


        const thumbUpload =
            await supabaseClient.storage
                .from("post-media")
                .upload(
                    thumbnailPath,
                    thumbnailFile
                );


        if (thumbUpload.error) {
            throw thumbUpload.error;
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
            data: profile,
            error: profileError
        } =
        await supabaseClient
            .from("profiles")
            .select("username")
            .eq(
                "id",
                user.id
            )
            .single();


        if (profileError) {
            throw profileError;
        }


        const {
            error: insertError
        } =
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
                    thumbnailURL,

                video_format:
                    extension

            });


        if (insertError) {
            throw insertError;
        }


        closeMediaUpload();


        titleInput.value = "";
        descriptionInput.value = "";
        videoInput.value = "";
        thumbnailInput.value = "";


        const selectedVideo =
            document.getElementById(
                "selectedVideo"
            );

        if (selectedVideo) {
            selectedVideo.textContent = "";
        }


        const selectedThumbnail =
            document.getElementById(
                "selectedThumbnail"
            );

        if (selectedThumbnail) {
            selectedThumbnail.textContent = "";
        }


        await loadVideos();

    }

    catch (error) {

        console.error(
            "Media upload error:",
            error
        );


        const errorBox =
            document.getElementById(
                "mediaUploadError"
            );


        if (errorBox) {

            errorBox.textContent =
                error.message ||
                String(error);

        }

    }

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


    try {

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
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        container.innerHTML = "";


        if (!data || data.length === 0) {

            container.innerHTML =
                "<div class=\"empty-media\">No videos yet.</div>";

            return;
        }


        data.forEach(
            function(video) {

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
                        alt=""
                    >

                    <div class="media-card-title">
                        ${escapeHTML(video.title)}
                    </div>

                `;


                card.addEventListener(
                    "click",
                    function() {

                        openVideoViewer(video);

                    }
                );


                container.appendChild(
                    card
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Error loading videos:",
            error
        );


        container.textContent =
            "Could not load media.";

    }

}





/* =========================
   MEDIA VIEWER
========================= */

function openVideoViewer(video) {

    const viewer =
        document.getElementById(
            "videoViewer"
        );


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


                <div class="youtube-player">

                    <div class="youtube-video-wrapper">

                        <video
                            id="mainVideoPlayer"
                            poster="${escapeHTML(video.thumbnail_url)}"
                            playsinline
                        >

                            <source
                                src="${escapeHTML(video.video_url)}"
                            >

                        </video>


                        <div
                            id="videoBigPlay"
                            class="video-big-play"
                        >
                            ▶
                        </div>


                        <div
                            class="youtube-controls"
                        >

                            <div
                                id="videoProgressContainer"
                                class="video-progress-container"
                            >

                                <div
                                    id="videoProgress"
                                    class="video-progress"
                                ></div>

                            </div>


                            <div
                                class="youtube-control-row"
                            >

                                <button
                                    id="playPauseButton"
                                    class="player-button"
                                >
                                    ▶
                                </button>


                                <span
                                    id="videoTime"
                                    class="video-time"
                                >
                                    0:00 / 0:00
                                </span>


                                <div
                                    class="volume-container"
                                >

                                    <button
                                        id="muteButton"
                                        class="player-button"
                                    >
                                        🔊
                                    </button>


                                    <input
                                        id="volumeSlider"
                                        class="volume-slider"
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value="1"
                                    >

                                </div>


                                <button
                                    id="speedButton"
                                    class="player-button"
                                >
                                    1x
                                </button>


                                <button
                                    id="fullscreenButton"
                                    class="player-button"
                                >
                                    ⛶
                                </button>

                            </div>

                        </div>

                    </div>

                </div>


                <div class="video-information">

                    <h2 class="viewer-title">
                        ${escapeHTML(video.title)}
                    </h2>


                    <div class="video-buttons">

                        <button>
                            Like
                        </button>


                        <button>
                            Dislike
                        </button>


                        <span id="viewCount">
                            0 views
                        </span>

                    </div>


                    <div class="viewer-uploader">

                        Uploaded by
                        <strong>
                            ${escapeHTML(video.username)}
                        </strong>

                    </div>


                    <div class="viewer-description">

                        ${escapeHTML(
                            video.description || ""
                        )}

                    </div>

                </div>

            </div>

        </div>

    `;


    viewer.style.display =
        "block";


    setupVideoPlayer();

}





/* =========================
   CLOSE VIDEO VIEWER
========================= */

function closeVideoViewer() {

    const viewer =
        document.getElementById(
            "videoViewer"
        );


    if (!viewer) {
        return;
    }


    const player =
        document.getElementById(
            "mainVideoPlayer"
        );


    if (player) {
        player.pause();
    }


    viewer.style.display =
        "none";


    viewer.innerHTML =
        "";

}





/* =========================
   VIDEO PLAYER
========================= */

function setupVideoPlayer() {

    const videoPlayer =
        document.getElementById(
            "mainVideoPlayer"
        );


    if (!videoPlayer) {
        return;
    }


    const playPauseButton =
        document.getElementById(
            "playPauseButton"
        );


    const videoBigPlay =
        document.getElementById(
            "videoBigPlay"
        );


    const videoTime =
        document.getElementById(
            "videoTime"
        );


    const videoProgress =
        document.getElementById(
            "videoProgress"
        );


    const videoProgressContainer =
        document.getElementById(
            "videoProgressContainer"
        );


    const muteButton =
        document.getElementById(
            "muteButton"
        );


    const volumeSlider =
        document.getElementById(
            "volumeSlider"
        );


    const speedButton =
        document.getElementById(
            "speedButton"
        );


    const fullscreenButton =
        document.getElementById(
            "fullscreenButton"
        );


    const youtubeControls =
        document.querySelector(
            ".youtube-controls"
        );



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


        seconds =
            Math.floor(seconds);


        const minutes =
            Math.floor(
                seconds / 60
            );


        const remainingSeconds =
            seconds % 60;


        return (
            minutes +
            ":" +
            remainingSeconds
                .toString()
                .padStart(
                    2,
                    "0"
                )
        );

    }


    function updateVideoTime() {

        if (videoTime) {

            videoTime.textContent =
                formatVideoTime(
                    videoPlayer.currentTime
                ) +
                " / " +
                formatVideoTime(
                    videoPlayer.duration
                );

        }


        if (
            videoProgress &&
            videoPlayer.duration &&
            Number.isFinite(
                videoPlayer.duration
            )
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

        if (videoPlayer.paused) {

            if (playPauseButton) {

                playPauseButton.textContent =
                    "▶";

            }


            if (videoBigPlay) {

                videoBigPlay.classList.remove(
                    "hidden"
                );

            }

        }

        else {

            if (playPauseButton) {

                playPauseButton.textContent =
                    "❚❚";

            }


            if (videoBigPlay) {

                videoBigPlay.classList.add(
                    "hidden"
                );

            }

        }

    }


    function toggleVideoPlay() {

        if (videoPlayer.paused) {

            videoPlayer.play().catch(
                function() {}
            );

        }

        else {

            videoPlayer.pause();

        }

    }


    if (playPauseButton) {

        playPauseButton.addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                toggleVideoPlay();

            }
        );

    }


    if (videoBigPlay) {

        videoBigPlay.addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                toggleVideoPlay();

            }
        );

    }


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



    /* =========================
       PROGRESS BAR
    ========================= */

    if (videoProgressContainer) {

        videoProgressContainer.addEventListener(
            "click",
            function(event) {

                if (
                    !videoPlayer.duration
                ) {
                    return;
                }


                const rect =
                    videoProgressContainer
                        .getBoundingClientRect();


                const clickPosition =
                    event.clientX -
                    rect.left;


                const percentage =
                    clickPosition /
                    rect.width;


                videoPlayer.currentTime =
                    percentage *
                    videoPlayer.duration;

            }
        );

    }



    /* =========================
       VOLUME
    ========================= */

    function updateMuteButton() {

        if (!muteButton) {
            return;
        }


        if (
            videoPlayer.muted ||
            videoPlayer.volume === 0
        ) {

            muteButton.textContent =
                "🔇";

        }

        else if (
            videoPlayer.volume < 0.5
        ) {

            muteButton.textContent =
                "🔉";

        }

        else {

            muteButton.textContent =
                "🔊";

        }

    }


    if (volumeSlider) {

        volumeSlider.addEventListener(
            "input",
            function() {

                videoPlayer.volume =
                    Number(
                        this.value
                    );


                videoPlayer.muted =
                    videoPlayer.volume === 0;


                updateMuteButton();

            }
        );

    }


    if (muteButton) {

        muteButton.addEventListener(
            "click",
            function(event) {

                event.stopPropagation();


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
            function(event) {

                event.stopPropagation();


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
            function(event) {

                event.stopPropagation();


                const player =
                    document.querySelector(
                        ".youtube-video-wrapper"
                    );


                if (
                    !document.fullscreenElement
                ) {

                    if (
                        player &&
                        player.requestFullscreen
                    ) {

                        player.requestFullscreen();

                    }

                }

                else {

                    if (
                        document.exitFullscreen
                    ) {

                        document.exitFullscreen();

                    }

                }

            }
        );

    }



    /* =========================
       VIDEO CLICK
    ========================= */

    videoPlayer.addEventListener(
        "click",
        toggleVideoPlay
    );



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


        if (!videoPlayer.paused) {

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

            if (youtubeControls) {

                youtubeControls.classList.remove(
                    "hidden"
                );

            }

        }
    );



    /* =========================
       INITIALIZE
    ========================= */

    videoPlayer.volume =
        1;


    updateMuteButton();

    updatePlayButton();

    updateVideoTime();


    videoPlayer.play().catch(
        function() {

            updatePlayButton();

        }
    );

}





/* =========================
   SPACE BAR PAUSE
========================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.code !== "Space"
        ) {
            return;
        }


        const target =
            event.target;


        /*
            Let spaces work normally
            while typing.
        */

        if (
            target &&
            (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.tagName === "SELECT" ||
                target.isContentEditable
            )
        ) {
            return;
        }


        const viewer =
            document.getElementById(
                "videoViewer"
            );


        if (
            !viewer ||
            viewer.style.display === "none"
        ) {
            return;
        }


        const player =
            document.getElementById(
                "mainVideoPlayer"
            );


        if (!player) {
            return;
        }


        event.preventDefault();


        if (player.paused) {

            player.play().catch(
                function() {}
            );

        }

        else {

            player.pause();

        }

    }
);





/* =========================
   CLOSE WHEN CLICKING OUTSIDE
========================= */

window.addEventListener(
    "click",
    function(event) {

        const viewer =
            document.getElementById(
                "videoViewer"
            );


        if (
            viewer &&
            event.target === viewer
        ) {

            closeVideoViewer();

        }

    }
);