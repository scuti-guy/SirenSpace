/* =========================
   APP.JS
   Navigation + Accounts + Startup
========================= */


/* =========================
   SECURITY
========================= */

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text ?? "";

    return div.innerHTML;
}



/* =========================
   PAGE NAVIGATION
========================= */

function switchPage(pageName) {


    document.querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active");

        });


    document.querySelectorAll(".nav-tab")
        .forEach(tab => {

            tab.classList.remove("active");

        });


    const page =
        document.getElementById(
            pageName + "Page"
        );


    const tab =
        document.querySelector(
            `.nav-tab[data-page="${pageName}"]`
        );


    if (page) {

        page.classList.add("active");

    }


    if (tab) {

        tab.classList.add("active");

    }


    if (pageName === "posts") {

        loadPosts();

    }


    if (pageName === "media") {

        loadVideos();

    }


    try {

        sessionStorage.setItem(
            "sirenspacePage",
            pageName
        );

    }

    catch(error) {}



    window.scrollTo({

        top: 0,

        behavior: "instant"

    });

}



/* =========================
   ACCOUNT MODALS
========================= */

function showLogin() {


    document.getElementById(
        "accountModal"
    ).style.display = "block";


    document.getElementById(
        "loginForm"
    ).style.display = "block";


    document.getElementById(
        "signupForm"
    ).style.display = "none";


    document.getElementById(
        "accountError"
    ).textContent = "";

}



function showSignup() {


    document.getElementById(
        "accountModal"
    ).style.display = "block";


    document.getElementById(
        "loginForm"
    ).style.display = "none";


    document.getElementById(
        "signupForm"
    ).style.display = "block";


    document.getElementById(
        "accountError"
    ).textContent = "";

}



function closeAccount() {


    document.getElementById(
        "accountModal"
    ).style.display = "none";

}



/* =========================
   SIGN UP
========================= */

async function signup() {


    const username =
        document.getElementById(
            "signupUsername"
        ).value.trim();


    const password =
        document.getElementById(
            "signupPassword"
        ).value;


    const error =
        document.getElementById(
            "accountError"
        );



    if (!username || !password) {


        error.textContent =
            "Enter a username and password.";


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



    if (data.user) {


        await supabaseClient

            .from("profiles")

            .upsert({

                id: data.user.id,

                username: username

            });

    }



    closeAccount();

    loadAccount();

}



/* =========================
   LOGIN
========================= */

async function login() {


    const username =
        document.getElementById(
            "loginUsername"
        ).value.trim();



    const password =
        document.getElementById(
            "loginPassword"
        ).value;



    const error =
        document.getElementById(
            "accountError"
        );



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
        document.getElementById(
            "loginButton"
        );


    const signupButton =
        document.getElementById(
            "signupButton"
        );


    const accountInfo =
        document.getElementById(
            "accountInfo"
        );


    const logoutButton =
        document.getElementById(
            "logoutButton"
        );



    if (!user) {


        loginButton.style.display =
            "inline-block";


        signupButton.style.display =
            "inline-block";


        accountInfo.style.display =
            "none";


        logoutButton.style.display =
            "none";


        return;

    }



    loginButton.style.display =
        "none";


    signupButton.style.display =
        "none";


    accountInfo.style.display =
        "inline-block";


    logoutButton.style.display =
        "inline-block";



    const {
        data: profile
    } =
    await supabaseClient

        .from("profiles")

        .select("username")

        .eq("id", user.id)

        .single();



    accountInfo.textContent =
        profile?.username ||
        "Account";

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
   MODAL CLICKING
========================= */

window.addEventListener(
"click",
function(event){



    const accountModal =
        document.getElementById(
            "accountModal"
        );


    const postModal =
        document.getElementById(
            "createPostModal"
        );


    const mediaModal =
        document.getElementById(
            "mediaUploadModal"
        );



    if(event.target === accountModal){

        closeAccount();

    }



    if(event.target === postModal){

        closeCreatePost();

    }



    if(event.target === mediaModal){

        closeMediaUpload();

    }


});



/* =========================
   AUTH STATE
========================= */

supabaseClient.auth.onAuthStateChange(
function(){

    loadAccount();

    loadPosts();

    loadVideos();

});



/* =========================
   INITIAL LOAD
========================= */

async function initializeSite(){


    switchPage("posts");


    await loadAccount();


    loadPosts();


    loadVideos();


}



initializeSite();