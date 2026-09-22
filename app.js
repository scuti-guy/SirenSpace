/* =========================
   SIRENSPACE APP
========================= */


/* =========================
   BASIC HELPERS
========================= */

function escapeHTML(text) {

    if (text === null || text === undefined) {
        return "";
    }

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


/* =========================
   PAGE SWITCHING
========================= */

function switchPage(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(function(page) {

            page.classList.remove("active");

        });

    document
        .querySelectorAll(".nav-tab")
        .forEach(function(tab) {

            tab.classList.remove("active");

        });


    const page =
        document.getElementById(pageName);

    if (page) {
        page.classList.add("active");
    }


    if (pageName === "postsPage") {

        const tab =
            document.getElementById("postsTab");

        if (tab) {
            tab.classList.add("active");
        }

        loadPosts();

    }


    if (pageName === "mediaPage") {

        const tab =
            document.getElementById("mediaTab");

        if (tab) {
            tab.classList.add("active");
        }

        loadVideos();

    }
}


/* =========================
   ACCOUNT MODAL
========================= */

function showLogin() {

    const modal =
        document.getElementById("accountModal");

    const loginForm =
        document.getElementById("loginForm");

    const signupForm =
        document.getElementById("signupForm");

    if (!modal) {
        return;
    }

    modal.style.display = "flex";

    loginForm.style.display = "block";

    signupForm.style.display = "none";
}


function showSignup() {

    const modal =
        document.getElementById("accountModal");

    const loginForm =
        document.getElementById("loginForm");

    const signupForm =
        document.getElementById("signupForm");

    if (!modal) {
        return;
    }

    modal.style.display = "flex";

    loginForm.style.display = "none";

    signupForm.style.display = "block";
}


function closeAccount() {

    const modal =
        document.getElementById("accountModal");

    if (modal) {
        modal.style.display = "none";
    }
}


/* =========================
   SIGN UP
========================= */

async function signup() {

    const username =
        document
            .getElementById("signupUsername")
            .value
            .trim();

    const password =
        document
            .getElementById("signupPassword")
            .value;

    const confirmPassword =
        document
            .getElementById("signupPasswordConfirm")
            .value;

    const error =
        document.getElementById("signupError");


    error.textContent = "";


    if (!username || !password) {

        error.textContent =
            "Please enter a username and password.";

        return;
    }


    if (password !== confirmPassword) {

        error.textContent =
            "Passwords do not match.";

        return;
    }


    if (username.length < 3) {

        error.textContent =
            "Username must be at least 3 characters.";

        return;
    }


    const email =
        username.toLowerCase() +
        "@accounts.sirenspace.local";


    const {
        data,
        error: signupError
    } =
        await supabaseClient.auth.signUp({

            email: email,

            password: password,

            options: {
                data: {
                    username: username
                }
            }

        });


    if (signupError) {

        error.textContent =
            signupError.message;

        return;
    }


    if (!data.user) {

        error.textContent =
            "Account could not be created.";

        return;
    }


    const {
        error: profileError
    } =
        await supabaseClient
            .from("profiles")
            .insert({

                id: data.user.id,

                username: username

            });


    if (profileError) {

        console.error(
            "Profile error:",
            profileError
        );
    }


    closeAccount();

    loadAccount();
}


/* =========================
   LOGIN
========================= */

async function login() {

    const username =
        document
            .getElementById("loginUsername")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;

    const error =
        document.getElementById("loginError");


    error.textContent = "";


    if (!username || !password) {

        error.textContent =
            "Please enter your username and password.";

        return;
    }


    const email =
        username.toLowerCase() +
        "@accounts.sirenspace.local";


    const {
        error: loginError
    } =
        await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

        });


    if (loginError) {

        error.textContent =
            loginError.message;

        return;
    }


    closeAccount();

    loadAccount();

    loadPosts();

    loadVideos();
}


/* =========================
   LOGOUT
========================= */

async function logout() {

    await supabaseClient.auth.signOut();

    loadAccount();

    loadPosts();

    loadVideos();
}


/* =========================
   LOAD ACCOUNT
========================= */

async function loadAccount() {

    const {
        data
    } =
        await supabaseClient.auth.getUser();


    const user =
        data.user;


    const accountInfo =
        document.getElementById("accountInfo");

    const loginButton =
        document.getElementById("loginButton");

    const signupButton =
        document.getElementById("signupButton");

    const logoutButton =
        document.getElementById("logoutButton");


    if (user) {

        const username =
            user.user_metadata?.username ||
            user.email?.split("@")[0] ||
            "User";


        accountInfo.textContent =
            username;


        loginButton.style.display =
            "none";

        signupButton.style.display =
            "none";

        logoutButton.style.display =
            "inline-block";

    } else {

        accountInfo.textContent =
            "";

        loginButton.style.display =
            "inline-block";

        signupButton.style.display =
            "inline-block";

        logoutButton.style.display =
            "none";
    }
}


/* =========================
   CREATE POST MODAL
========================= */

function openCreatePost() {

    const modal =
        document.getElementById("createPostModal");

    if (!modal) {

        console.error(
            "createPostModal was not found."
        );

        return;
    }


    modal.style.display = "flex";


    const content =
        document.getElementById("postContent");

    if (content) {
        content.focus();
    }
}


function closeCreatePost() {

    const modal =
        document.getElementById("createPostModal");

    if (modal) {
        modal.style.display = "none";
    }
}


/* =========================
   POST FILE
========================= */

let selectedPostFile = null;


function handlePostFile(event) {

    selectedPostFile =
        event.target.files[0] || null;


    const display =
        document.getElementById(
            "selectedPostFile"
        );


    if (!display) {
        return;
    }


    if (selectedPostFile) {

        display.textContent =
            selectedPostFile.name;

    } else {

        display.textContent =
            "";
    }
}


/* =========================
   CREATE POST
========================= */

async function createPost() {

    const {
        data
    } =
        await supabaseClient.auth.getUser();


    const user =
        data.user;


    const error =
        document.getElementById("postError");


    error.textContent = "";


    if (!user) {

        error.textContent =
            "You must be logged in to post.";

        return;
    }


    const content =
        document
            .getElementById("postContent")
            .value
            .trim();


    if (!content && !selectedPostFile) {

        error.textContent =
            "Write something or attach a file.";

        return;
    }


    let mediaURL = null;

    let mediaType = null;


    /* =========================
       UPLOAD POST MEDIA
    ========================== */

    if (selectedPostFile) {

        const extension =
            selectedPostFile.name
                .split(".")
                .pop()
                .toLowerCase();


        const uniqueID =
            crypto.randomUUID();


        const filePath =
            "posts/" +
            user.id +
            "/" +
            uniqueID +
            "." +
            extension;


        const {
            error: uploadError
        } =
            await supabaseClient
                .storage
                .from("post-media")
                .upload(
                    filePath,
                    selectedPostFile,
                    {
                        upsert: false
                    }
                );


        if (uploadError) {

            console.error(
                "Post media upload error:",
                uploadError
            );

            error.textContent =
                uploadError.message;

            return;
        }


        const {
            data: publicData
        } =
            supabaseClient
                .storage
                .from("post-media")
                .getPublicUrl(
                    filePath
                );


        mediaURL =
            publicData.publicUrl;


        if (
            selectedPostFile.type.startsWith(
                "image/"
            )
        ) {

            mediaType = "image";

        } else if (
            selectedPostFile.type.startsWith(
                "video/"
            )
        ) {

            mediaType = "video";

        } else if (
            selectedPostFile.type.startsWith(
                "audio/"
            )
        ) {

            mediaType = "audio";

        } else {

            mediaType =
                selectedPostFile.type;
        }
    }


    /* =========================
       GET USERNAME
    ========================== */

    const username =
        user.user_metadata?.username ||
        user.email?.split("@")[0] ||
        "User";


    /* =========================
       INSERT POST
    ========================== */

    const {
        error: postError
    } =
        await supabaseClient
            .from("posts")
            .insert({

                user_id: user.id,

                username: username,

                content: content || null,

                media_url: mediaURL,

                media_type: mediaType

            });


    if (postError) {

        console.error(
            "Post creation error:",
            postError
        );

        error.textContent =
            postError.message;

        return;
    }


    /* =========================
       RESET
    ========================== */

    document
        .getElementById("postContent")
        .value = "";


    document
        .getElementById("postFile")
        .value = "";


    document
        .getElementById("selectedPostFile")
        .textContent = "";


    selectedPostFile = null;


    closeCreatePost();

    loadPosts();
}


/* =========================
   LOAD POSTS
========================= */

async function loadPosts() {

    const container =
        document.getElementById(
            "postsContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "<p>Loading posts...</p>";


    const {
        data: posts,
        error
    } =
        await supabaseClient
            .from("posts")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Post loading error:",
            error
        );

        container.innerHTML =
            "<p>Unable to load posts.</p>";

        return;
    }


    if (!posts || posts.length === 0) {

        container.innerHTML =
            "<div class='media-placeholder'>No posts yet.</div>";

        return;
    }


    container.innerHTML = "";


    for (const post of posts) {

        const postElement =
            document.createElement("div");


        postElement.className =
            "post-card";


        let mediaHTML = "";


        if (
            post.media_url &&
            post.media_type === "image"
        ) {

            mediaHTML =
                `
                <img
                    class="post-media"
                    src="${escapeHTML(post.media_url)}"
                    alt=""
                >
                `;

        } else if (
            post.media_url &&
            post.media_type === "video"
        ) {

            mediaHTML =
                `
                <video
                    class="post-media"
                    controls
                >
                    <source
                        src="${escapeHTML(post.media_url)}"
                    >
                </video>
                `;

        } else if (
            post.media_url &&
            post.media_type === "audio"
        ) {

            mediaHTML =
                `
                <audio
                    class="post-audio"
                    controls
                >
                    <source
                        src="${escapeHTML(post.media_url)}"
                    >
                </audio>
                `;
        }


        postElement.innerHTML =
            `
            <div class="post-header">

                <strong>
                    ${escapeHTML(post.username)}
                </strong>

            </div>

            ${
                post.content
                    ? `
                        <div class="post-content">
                            ${escapeHTML(post.content)}
                        </div>
                    `
                    : ""
            }

            ${mediaHTML}

            <div class="post-footer">

                <span>
                    ${new Date(
                        post.created_at
                    ).toLocaleString()}
                </span>

                <button
                    class="delete-post-button"
                    onclick="deletePost('${post.id}')"
                    style="display:none;"
                >
                    Delete
                </button>

            </div>
            `;


        container.appendChild(
            postElement
        );


        checkPostOwnership(
            postElement,
            post.user_id
        );
    }
}


/* =========================
   CHECK POST OWNERSHIP
========================= */

async function checkPostOwnership(
    postElement,
    postUserID
) {

    const {
        data
    } =
        await supabaseClient.auth.getUser();


    if (
        data.user &&
        data.user.id === postUserID
    ) {

        const deleteButton =
            postElement.querySelector(
                ".delete-post-button"
            );


        if (deleteButton) {

            deleteButton.style.display =
                "inline-block";
        }
    }
}


/* =========================
   DELETE POST
========================= */

async function deletePost(postID) {

    const {
        data
    } =
        await supabaseClient.auth.getUser();


    if (!data.user) {
        return;
    }


    const confirmed =
        confirm(
            "Delete this post?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("posts")
            .delete()
            .eq("id", postID)
            .eq(
                "user_id",
                data.user.id
            );


    if (error) {

        console.error(
            "Delete post error:",
            error
        );

        return;
    }


    loadPosts();
}


/* =========================
   MEDIA UPLOAD
========================= */

let selectedVideo = null;

let selectedThumbnail = null;


function openMediaUpload() {

    const modal =
        document.getElementById(
            "mediaUploadModal"
        );


    if (modal) {

        modal.style.display =
            "flex";
    }
}


function closeMediaUpload() {

    const modal =
        document.getElementById(
            "mediaUploadModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }
}


function handleMediaVideo(event) {

    selectedVideo =
        event.target.files[0] || null;


    const display =
        document.getElementById(
            "selectedVideo"
        );


    if (display) {

        display.textContent =
            selectedVideo
                ? selectedVideo.name
                : "";
    }
}


function handleMediaThumbnail(event) {

    selectedThumbnail =
        event.target.files[0] || null;


    const display =
        document.getElementById(
            "selectedThumbnail"
        );


    if (display) {

        display.textContent =
            selectedThumbnail
                ? selectedThumbnail.name
                : "";
    }
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


    const error =
        document.getElementById(
            "mediaUploadError"
        );


    error.textContent = "";


    if (!user) {

        error.textContent =
            "You must be logged in to upload.";

        return;
    }


    const title =
        document
            .getElementById("mediaTitle")
            .value
            .trim();


    const description =
        document
            .getElementById("mediaDescription")
            .value
            .trim();


    if (!title) {

        error.textContent =
            "Please enter a title.";

        return;
    }


    if (!selectedVideo) {

        error.textContent =
            "Please select a video.";

        return;
    }


    if (!selectedThumbnail) {

        error.textContent =
            "Please select a thumbnail.";

        return;
    }


    const videoExtension =
        selectedVideo.name
            .split(".")
            .pop()
            .toLowerCase();


    const thumbnailExtension =
        selectedThumbnail.name
            .split(".")
            .pop()
            .toLowerCase();


    const uniqueID =
        crypto.randomUUID();


    const videoPath =
        "videos/" +
        user.id +
        "/" +
        uniqueID +
        "." +
        videoExtension;


    const thumbnailPath =
        "thumbnails/" +
        user.id +
        "/" +
        uniqueID +
        "." +
        thumbnailExtension;


    /* =========================
       VIDEO
    ========================== */

    const {
        error: videoError
    } =
        await supabaseClient
            .storage
            .from("post-media")
            .upload(
                videoPath,
                selectedVideo,
                {
                    upsert: false
                }
            );


    if (videoError) {

        console.error(
            "Video upload error:",
            videoError
        );

        error.textContent =
            videoError.message;

        return;
    }


    /* =========================
       THUMBNAIL
    ========================== */

    const {
        error: thumbnailError
    } =
        await supabaseClient
            .storage
            .from("post-media")
            .upload(
                thumbnailPath,
                selectedThumbnail,
                {
                    upsert: false
                }
            );


    if (thumbnailError) {

        console.error(
            "Thumbnail upload error:",
            thumbnailError
        );

        error.textContent =
            thumbnailError.message;

        return;
    }


    const {
        data: videoPublic
    } =
        supabaseClient
            .storage
            .from("post-media")
            .getPublicUrl(
                videoPath
            );


    const {
        data: thumbnailPublic
    } =
        supabaseClient
            .storage
            .from("post-media")
            .getPublicUrl(
                thumbnailPath
            );


    const username =
        user.user_metadata?.username ||
        user.email?.split("@")[0] ||
        "User";


    /* =========================
       SAVE VIDEO
    ========================== */

    const {
        error: databaseError
    } =
        await supabaseClient
            .from("videos")
            .insert({

                user_id: user.id,

                username: username,

                title: title,

                description:
                    description || null,

                video_url:
                    videoPublic.publicUrl,

                thumbnail_url:
                    thumbnailPublic.publicUrl,

                video_format:
                    videoExtension

            });


    if (databaseError) {

        console.error(
            "Video database error:",
            databaseError
        );

        error.textContent =
            databaseError.message;

        return;
    }


    /* =========================
       RESET
    ========================== */

    document
        .getElementById("mediaTitle")
        .value = "";


    document
        .getElementById("mediaDescription")
        .value = "";


    document
        .getElementById("mediaVideo")
        .value = "";


    document
        .getElementById("mediaThumbnail")
        .value = "";


    document
        .getElementById("selectedVideo")
        .textContent = "";


    document
        .getElementById("selectedThumbnail")
        .textContent = "";


    selectedVideo = null;

    selectedThumbnail = null;


    closeMediaUpload();

    loadVideos();
}


/* =========================
   LOAD VIDEOS
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
        "<p>Loading videos...</p>";


    const {
        data: videos,
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

        console.error(
            "Video loading error:",
            error
        );

        container.innerHTML =
            "<p>Unable to load videos.</p>";

        return;
    }


    if (!videos || videos.length === 0) {

        container.innerHTML =
            "<div class='media-placeholder'>No videos yet.</div>";

        return;
    }


    container.innerHTML = "";


    videos.forEach(function(video) {

        const card =
            document.createElement("div");


        card.className =
            "media-card";


        card.innerHTML =
            `
            <img
                class="media-thumbnail"
                src="${escapeHTML(video.thumbnail_url)}"
                alt=""
            >

            <div class="media-title">
                ${escapeHTML(video.title)}
            </div>
            `;


        card.addEventListener(
            "click",
            function() {

                if (
                    typeof openVideoViewer ===
                    "function"
                ) {

                    openVideoViewer(video);
                }

            }
        );


        container.appendChild(card);
    });
}


/* =========================
   MODAL BACKGROUND CLICK
========================= */

window.addEventListener(
    "click",
    function(event) {

        const createPostModal =
            document.getElementById(
                "createPostModal"
            );

        const mediaUploadModal =
            document.getElementById(
                "mediaUploadModal"
            );

        const accountModal =
            document.getElementById(
                "accountModal"
            );


        if (
            event.target ===
            createPostModal
        ) {

            closeCreatePost();
        }


        if (
            event.target ===
            mediaUploadModal
        ) {

            closeMediaUpload();
        }


        if (
            event.target ===
            accountModal
        ) {

            closeAccount();
        }
    }
);


/* =========================
   AUTH STATE
========================= */

supabaseClient.auth.onAuthStateChange(
    function() {

        loadAccount();

        loadPosts();

        loadVideos();

    }
);


/* =========================
   INITIAL LOAD
========================= */

loadAccount();

loadPosts();

loadVideos();