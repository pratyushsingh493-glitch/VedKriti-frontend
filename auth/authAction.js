const submit = document.getElementById("button");
const mode = localStorage.getItem("mode");
localStorage.clear();
import { domain } from "../config.js";
console.log("Domain =", domain);

if (mode === "create"){
    document.getElementById("create").checked = true;
}else{
    document.getElementById("login").checked = true;
}

localStorage.clear();

submit.addEventListener("click",async(e)=>{
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const email = document.getElementById("email").value;
    const role = document.getElementById("role").value;
    let response;

    if(document.getElementById("create").checked) response = await fetch(`${domain}/signin-user`,{
        method : "POST" ,
        headers : {
            "Content-Type": "application/json"
        },
        body : JSON.stringify({
            "username" : username,
            "password" : password,
            "email" : email,
            "role" : role
        })
    });

    response = await fetch(`${domain}/login-user`,{
        method : "POST" ,
        headers : {
            "Content-Type": "application/json"
        },
        body : JSON.stringify({
            "username" : username,
            "password" : password,
            "email" : email,
            "role" : role
        })
    })
    const data = await response.json();
    console.dir(response);

    if (response.status === 200 || response.status === 201) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("role", data.role);
        localStorage.setItem("name", data.name);
        globalThis.location.href = "../otp/otp.html";
    } else {
        document.getElementById("err").innerText = data.message;
    }
});