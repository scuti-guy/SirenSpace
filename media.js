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
   VIDEO VIEWER
========================= */


function openVideoViewer(video) {

    const viewer =
        document.getElementById(
            "videoViewer"
        );


    viewer.innerHTML = `

        <button class="video-exit"
            onclick="closeVideoViewer()">
            Exit
        </button>


        <div class="video-player-wrapper">

            <video
                id="mainVideoPlayer"
                class="main-video-player"
                poster="${escapeHTML(video.thumbnail_url)}"
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                oncontextmenu="return false;"
            >

                <source
                    src="${escapeHTML(video.video_url)}"
                >

            </video>


            <div class="custom-video-controls">

                <input
                    id="videoProgress"
                    type="range"
                    min="0"
                    max="100"
                    value="0"
                >


                <button
                    id="videoPauseButton"
                    onclick="toggleVideoPause()"
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



    player.play();



    player.ontimeupdate =
        function() {

            if (
                player.duration
            ) {

                progress.value =
                    (
                        player.currentTime /
                        player.duration
                    ) * 100;

            }

        };



    progress.oninput =
        function() {

            player.currentTime =
                (
                    progress.value /
                    100
                ) * player.duration;

        };



    // Disable right click

    player.oncontextmenu =
        function() {

            return false;

        };


}

function closeVideoViewer() {


    const viewer =
        document.getElementById(
            "videoViewer"
        );


    viewer.style.display =
        "none";



    viewer.innerHTML =
        "";

}




document.addEventListener(
    "keydown",
    function(event){

        if(event.code === "Space"){

            const video =
                document.getElementById(
                    "mainVideoPlayer"
                );

            if(video){

                event.preventDefault();

                toggleVideoPause();

            }

        }

    }
);