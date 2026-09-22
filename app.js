/* =========================
   GENERAL HELPERS
========================= */

function escapeHTML(text) {

    if (text === null || text === undefined) {
        return "";
    }

    const div = document.createElement("div");

    div.textContent = String(text);

    return div.innerHTML;
}


/* =========================
   PAGE SWITCHING
========================= */

function switchPage(pageName) {

    const postsPage =
        document.getElementById("postsPage");

    const mediaPage =
        document.getElementById("mediaPage");

    const postsTab =
        document.getElementById("postsTab");

    const mediaTab =
        document.getElementById("mediaTab");


    if (!postsPage || !mediaPage) {

        console.error(
            "Posts or Media page element is missing."
        );

        return;
    }


    if (pageName === "mediaPage") {

        postsPage.classList.remove("active");

        mediaPage.classList.add("active");


        if (postsTab) {
            postsTab.classList.remove("active");
        }

        if (mediaTab) {
            mediaTab.classList.add("active");
        }


        if (typeof loadVideos === "function") {
            loadVideos();
        }

        return;
    }


    if (pageName === "postsPage") {

        mediaPage.classList.remove("active");

        postsPage.classList.add("active");


        if (mediaTab) {
            mediaTab.classList.remove("active");
        }

        if (postsTab) {
            postsTab.classList.add("active");
        }


        if (typeof loadPosts === "function") {
            loadPosts();
        }

        return;
    }

}


/* =========================
   LOGIN / ACCOUNT
========================= */

function showLogin() {

    const modal =
        document.getElementById("accountModal");

    if (!modal) {
        return;
    }

    modal.style.display = "flex";


    const loginForm =
        document.getElementById("loginForm");

    const signupForm =
        document.getElementById("signupForm");


    if (loginForm) {
        loginForm.style.display = "block";
    }

    if (signupForm) {
        signupForm.style.display = "none";
    }

}


function showSignup() {

    const modal =
        document.getElementById("accountModal");

    if (!modal) {
        return;
    }

    modal.style.display = "flex";


    const loginForm =
        document.getElementById("loginForm");

    const signupForm =
        document.getElementById("signupForm");


    if (loginForm) {
        loginForm.style.display = "none";
    }

    if (signupForm) {
        signupForm.style.display = "block";
    }

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

    const usernameInput =
        document.getElementById("signupUsername");

    const passwordInput =
        document.getElementById("signupPassword");

    const confirmInput =
        document.getElementById("signupPasswordConfirm");

    const errorBox =
        document.getElementById("signupError");


    if (!usernameInput || !passwordInput) {
        return;
    }


    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmInput
            ? confirmInput.value
            : "";


    if (errorBox) {
        errorBox.textContent = "";
    }


    if (!username || !password) {

        if (errorBox) {
            errorBox.textContent =
                "Username and password are required.";
        }

        return;
    }


    if (password !== confirmPassword) {

        if (errorBox) {
            errorBox.textContent =
                "Passwords do not match.";
        }

        return;
    }


    const email =
        username.toLowerCase() +
        "@accounts.sirenspace.local";


    const {
        data,
        error
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


    if (error) {

        if (errorBox) {
            errorBox.textContent =
                error.message;
        }

        return;
    }


    if (data.user) {

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
                "Profile creation error:",
                profileError
            );

        }

    }


    closeAccount();

    await loadAccount();

}


/* =========================
   LOGIN
========================= */

async function login() {

    const usernameInput =
        document.getElementById("loginUsername");

    const passwordInput =
        document.getElementById("loginPassword");

    const errorBox =
        document.getElementById("loginError");


    if (!usernameInput || !passwordInput) {
        return;
    }


    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;


    if (errorBox) {
        errorBox.textContent = "";
    }


    if (!username || !password) {

        if (errorBox) {
            errorBox.textContent =
                "Username and password are required.";
        }

        return;
    }


    const email =
        username.toLowerCase() +
        "@accounts.sirenspace.local";


    const {
        error
    } =
    await supabaseClient.auth.signInWithPassword({

        email: email,

        password: password

    });


    if (error) {

        if (errorBox) {
            errorBox.textContent =
                error.message;
        }

        return;
    }


    closeAccount();

    await loadAccount();

}


/* =========================
   LOGOUT
========================= */

async function logout() {

    const {
        error
    } =
    await supabaseClient.auth.signOut();


    if (error) {

        console.error(
            "Logout error:",
            error
        );

        return;
    }


    await loadAccount();

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


    const loginButton =
        document.getElementById("loginButton");

    const signupButton =
        document.getElementById("signupButton");

    const accountInfo =
        document.getElementById("accountInfo");

    const logoutButton =
        document.getElementById("logoutButton");


    if (user) {

        if (loginButton) {
            loginButton.style.display = "none";
        }

        if (signupButton) {
            signupButton.style.display = "none";
        }

        if (logoutButton) {
            logoutButton.style.display = "inline-block";
        }


        if (accountInfo) {

            let username =
                user.user_metadata &&
                user.user_metadata.username;


            if (!username) {

                const {
                    data: profile
                } =
                await supabaseClient
                    .from("profiles")
                    .select("username")
                    .eq("id", user.id)
                    .single();


                if (profile) {
                    username =
                        profile.username;
                }

            }


            accountInfo.textContent =
                username || "Account";

            accountInfo.style.display =
                "inline-block";

        }

    }

    else {

        if (loginButton) {
            loginButton.style.display =
                "inline-block";
        }

        if (signupButton) {
            signupButton.style.display =
                "inline-block";
        }

        if (logoutButton) {
            logoutButton.style.display =
                "none";
        }

        if (accountInfo) {
            accountInfo.style.display =
                "none";
        }

    }

}


/* =========================
   CREATE POST
========================= */

let selectedPostFile = null;


function openCreatePost() {

    const modal =
        document.getElementById(
            "createPostModal"
        );


    if (!modal) {

        console.error(
            "createPostModal was not found."
        );

        return;
    }


    modal.style.display = "flex";


    const content =
        document.getElementById(
            "postContent"
        );


    if (content) {
        content.focus();
    }

}


function closeCreatePost() {

    const modal =
        document.getElementById(
            "createPostModal"
        );


    if (modal) {
        modal.style.display = "none";
    }


    selectedPostFile = null;


    const content =
        document.getElementById(
            "postContent"
        );

    const file =
        document.getElementById(
            "postFile"
        );

    const selected =
        document.getElementById(
            "selectedPostFile"
        );

    const error =
        document.getElementById(
            "postError"
        );


    if (content) {
        content.value = "";
    }

    if (file) {
        file.value = "";
    }

    if (selected) {
        selected.textContent = "";
    }

    if (error) {
        error.textContent = "";
    }

}


function handlePostFile(event) {

    const input =
        event.target;


    const file =
        input.files[0];


    const selected =
        document.getElementById(
            "selectedPostFile"
        );

    const error =
        document.getElementById(
            "postError"
        );


    selectedPostFile = null;


    if (error) {
        error.textContent = "";
    }


    if (!file) {

        if (selected) {
            selected.textContent = "";
        }

        return;
    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const allowed = [

        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",

        "mp4",
        "mov",
        "avi",

        "mp3",
        "wav",
        "ogg"

    ];


    if (!allowed.includes(extension)) {

        input.value = "";


        if (error) {
            error.textContent =
                "That file type is not supported.";
        }


        if (selected) {
            selected.textContent = "";
        }


        return;
    }


    selectedPostFile = file;


    if (selected) {
        selected.textContent =
            "Selected: " + file.name;
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


    const contentInput =
        document.getElementById(
            "postContent"
        );

    const errorBox =
        document.getElementById(
            "postError"
        );


    const content =
        contentInput
            ? contentInput.value
            : "";


    if (!user) {

        if (errorBox) {
            errorBox.textContent =
                "You must be logged in to post.";
        }

        return;
    }


    if (
        content.trim() === "" &&
        !selectedPostFile
    ) {

        if (errorBox) {
            errorBox.textContent =
                "Write something or attach a file.";
        }

        return;
    }


    if (errorBox) {
        errorBox.textContent =
            "Posting...";
    }


    let mediaURL = null;

    let mediaType = null;


    if (selectedPostFile) {

        const extension =
            selectedPostFile.name
                .split(".")
                .pop()
                .toLowerCase();


        const filePath =
            `posts/${user.id}/${crypto.randomUUID()}.${extension}`;


        const upload =
            await supabaseClient.storage
                .from("post-media")
                .upload(
                    filePath,
                    selectedPostFile
                );


        if (upload.error) {

            if (errorBox) {
                errorBox.textContent =
                    upload.error.message;
            }

            return;
        }


        mediaURL =
            supabaseClient.storage
                .from("post-media")
                .getPublicUrl(
                    filePath
                )
                .data
                .publicUrl;


        if (
            selectedPostFile.type.startsWith(
                "image/"
            )
        ) {

            mediaType = "image";

        }

        else if (
            selectedPostFile.type.startsWith(
                "video/"
            )
        ) {

            mediaType = "video";

        }

        else if (
            selectedPostFile.type.startsWith(
                "audio/"
            )
        ) {

            mediaType = "audio";

        }

    }


    const {
        data: profile
    } =
    await supabaseClient
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();


    if (!profile) {

        if (errorBox) {
            errorBox.textContent =
                "Could not find your profile.";
        }

        return;
    }


    const {
        error
    } =
    await supabaseClient
        .from("posts")
        .insert({

            user_id:
                user.id,

            username:
                profile.username,

            content:
                content,

            media_url:
                mediaURL,

            media_type:
                mediaType

        });


    if (error) {

        if (errorBox) {
            errorBox.textContent =
                error.message;
        }

        return;
    }


    closeCreatePost();

    await loadPosts();

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
        "Loading posts...";


    const {
        data,
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

        container.textContent =
            error.message;

        return;
    }


    container.innerHTML = "";


    if (!data || data.length === 0) {

        container.innerHTML =
            "<div class=\"empty-posts\">No posts yet.</div>";

        return;
    }


    data.forEach(
        function(post) {

            const postElement =
                document.createElement(
                    "div"
                );


            postElement.className =
                "post";


            let mediaHTML = "";


            if (
                post.media_url &&
                post.media_type === "image"
            ) {

                mediaHTML = `
                    <img
                        class="post-media"
                        src="${escapeHTML(post.media_url)}"
                        alt=""
                    >
                `;

            }


            else if (
                post.media_url &&
                post.media_type === "video"
            ) {

                mediaHTML = `
                    <video
                        class="post-media"
                        controls
                    >
                        <source
                            src="${escapeHTML(post.media_url)}"
                        >
                    </video>
                `;

            }


            else if (
                post.media_url &&
                post.media_type === "audio"
            ) {

                mediaHTML = `
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


            const date =
                new Date(
                    post.created_at
                ).toLocaleString();


            postElement.innerHTML = `

                <div class="post-header">

                    <strong>
                        ${escapeHTML(post.username)}
                    </strong>

                    <span>
                        ${escapeHTML(date)}
                    </span>

                </div>


                <div class="post-content">
                    ${escapeHTML(post.content || "")}
                </div>


                ${mediaHTML}

            `;


            container.appendChild(
                postElement
            );


            checkPostOwnership(
                post,
                postElement
            );

        }
    );

}


/* =========================
   POST OWNERSHIP
========================= */

async function checkPostOwnership(
    post,
    postElement
) {

    const {
        data
    } =
    await supabaseClient.auth.getUser();


    if (
        !data.user ||
        data.user.id !== post.user_id
    ) {
        return;
    }


    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.className =
        "delete-post-button";


    deleteButton.textContent =
        "Delete";


    deleteButton.onclick =
        function() {

            deletePost(
                post.id
            );

        };


    postElement.appendChild(
        deleteButton
    );

}


/* =========================
   DELETE POST
========================= */

async function deletePost(postId) {

    const {
        error
    } =
    await supabaseClient
        .from("posts")
        .delete()
        .eq(
            "id",
            postId
        );


    if (error) {

        console.error(
            "Delete post error:",
            error
        );

        return;
    }


    await loadPosts();

}


/* =========================
   AUTH STATE
========================= */

supabaseClient.auth.onAuthStateChange(
    function() {

        loadAccount();

    }
);


/* =========================
   INITIAL LOAD
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadAccount();

        loadPosts();

    }
);