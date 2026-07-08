const submit = document.getElementById("button");
const mode = localStorage.getItem("mode");
import { domain } from "./config.js";

if (mode === "signup"){
    document.getElementById("login").checked = true;
}else{
    document.getElementById("signin").checked = true;
}

submit.addEventListener("click",async(e)=>{
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const email = document.getElementById("email").value;
    let response;

    if(document.getElementById("signin").checked) response = await fetch(`${domain}/signin-user`,{
        method : "POST" ,
        headers : {
            "Content-Type": "application/json"
        },
        body : JSON.stringify({
            "username" : username,
            "password" : password,
            "email" : email
        })
    });

    else if((document.getElementById("login").checked)) response = await fetch(`${domain}/login-user`,{
        method : "POST" ,
        headers : {
            "Content-Type": "application/json"
        },
        body : JSON.stringify({
            "username" : username,
            "password" : password,
            "email" : email
        })
    })
    const data = await response.json();
    console.dir(response);
    if(response.status == 201){
        globalThis.location.href = "otp.html";
    }else if(response.status == 200){
        globalThis.location.href = "home.html";
    }else{
        document.getElementById("err").innerText = data.message;
    }
});