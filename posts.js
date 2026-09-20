/* =========================
   POSTS.JS
   Creating + Loading + Deleting Posts
========================= */


/* =========================
   CREATE POST MODAL
========================= */

function openCreatePost() {

    supabaseClient.auth.getUser()
        .then(function(result) {


            if (!result.data.user) {

                showLogin();

                document.getElementById(
                    "accountError"
                ).textContent =
                    "You must be logged in to create a post.";

                return;

            }


            document.getElementById(
                "createPostModal"
            ).style.display = "block";


            document.getElementById(
                "postError"
            ).textContent = "";

        });

}



function closeCreatePost() {

    document.getElementById(
        "createPostModal"
    ).style.display = "none";


    document.getElementById(
        "postContent"
    ).value = "";


    document.getElementById(
        "postFile"
    ).value = "";


    document.getElementById(
        "selectedFile"
    ).textContent = "";

}



/* =========================
   POST FILE SELECT
========================= */

function handlePostFile(input) {


    const file =
        input.files[0];


    const display =
        document.getElementById(
            "selectedFile"
        );



    if (!file) {

        display.textContent = "";

        return;

    }



    display.textContent =
        "Selected: " + file.name;

}



/* =========================
   CREATE POST
========================= */

async function createPost() {


    const {
        data:userData
    } =
    await supabaseClient.auth.getUser();


    const user =
        userData.user;



    const error =
        document.getElementById(
            "postError"
        );



    error.textContent = "";



    if (!user) {


        error.textContent =
            "You must be logged in to post.";


        return;

    }



    const content =
        document.getElementById(
            "postContent"
        ).value.trim();



    const fileInput =
        document.getElementById(
            "postFile"
        );



    const file =
        fileInput.files[0];



    let mediaURL = null;

    let mediaType = null;



    const {
        data:profile
    }
    =
    await supabaseClient

        .from("profiles")

        .select("username")

        .eq(
            "id",
            user.id
        )

        .single();



    const username =
        profile?.username ||
        "Unknown";




    if(file){


        const filePath =
            "posts/" +
            user.id +
            "/" +
            crypto.randomUUID() +
            "-" +
            file.name;



        const {
            error:uploadError
        }
        =
        await supabaseClient.storage

            .from("post-media")

            .upload(
                filePath,
                file
            );



        if(uploadError){


            error.textContent =
                uploadError.message;


            return;

        }



        const {
            data:publicData
        }
        =
        supabaseClient.storage

            .from("post-media")

            .getPublicUrl(
                filePath
            );



        mediaURL =
            publicData.publicUrl;


        mediaType =
            file.type;

    }




    const {
        error:postError
    }
    =
    await supabaseClient

        .from("posts")

        .insert({

            user_id:user.id,

            username:username,

            content:
                content || null,

            media_url:
                mediaURL,

            media_type:
                mediaType

        });



    if(postError){


        error.textContent =
            postError.message;


        return;

    }



    closeCreatePost();


    loadPosts();

}



/* =========================
   LOAD POSTS
========================= */

async function loadPosts(){


    const container =
        document.getElementById(
            "postsContainer"
        );


    if(!container){

        return;

    }



    container.innerHTML =
        "Loading posts...";



    const {
        data,
        error
    }
    =
    await supabaseClient

        .from("posts")

        .select("*")

        .order(
            "created_at",
            {
                ascending:false
            }
        );



    if(error){


        container.textContent =
            error.message;


        return;

    }



    if(!data || data.length === 0){


        container.textContent =
            "No posts yet.";


        return;

    }



    container.innerHTML = "";



    const {
        data:userData
    }
    =
    await supabaseClient.auth.getUser();



    const currentUser =
        userData.user;



    data.forEach(post=>{


        const element =
            document.createElement(
                "div"
            );


        element.className =
            "post";



        let media = "";



        if(post.media_url){



            if(
                post.media_type?.startsWith(
                    "image/"
                )
            ){

                media = `

                <img
                    src="${escapeHTML(post.media_url)}"
                    class="post-media"
                >

                `;

            }



            else if(
                post.media_type?.startsWith(
                    "video/"
                )
            ){

                media = `

                <video
                    src="${escapeHTML(post.media_url)}"
                    class="post-media"
                    controls
                ></video>

                `;

            }



            else if(
                post.media_type?.startsWith(
                    "audio/"
                )
            ){

                media = `

                <audio
                    src="${escapeHTML(post.media_url)}"
                    controls
                ></audio>

                `;

            }

        }



        const deleteButton =
            currentUser &&
            currentUser.id === post.user_id

            ?

            `

            <button
                class="delete-post-button"
                onclick="deletePost('${post.id}')"
            >
                Delete
            </button>

            `

            :

            "";




        element.innerHTML = `


        <div class="post-header">

            <strong>
                ${escapeHTML(post.username)}
            </strong>

        </div>



        ${
            post.content

            ?

            `

            <div class="post-content">

                ${escapeHTML(post.content)}

            </div>

            `

            :

            ""

        }



        ${media}



        <div class="post-footer">

            <span>
                ${new Date(
                    post.created_at
                ).toLocaleString()}
            </span>


            ${deleteButton}


        </div>


        `;



        container.appendChild(element);


    });


}



/* =========================
   DELETE POST
========================= */

async function deletePost(postId){


    const {
        error
    }
    =
    await supabaseClient

        .from("posts")

        .delete()

        .eq(
            "id",
            postId
        );



    if(error){


        alert(
            error.message
        );


        return;

    }



    loadPosts();


}