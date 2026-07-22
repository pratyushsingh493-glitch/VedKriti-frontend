const submit = document.getElementById("button");
const mode = localStorage.getItem("mode");
import { domain } from "../config.js";
console.log("Domain =", domain);

if (mode === "create"){
    document.getElementById("create").checked = true;
}else{
    document.getElementById("login").checked = true;
}

submit.addEventListener("click",async(e)=>{
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const email = document.getElementById("email").value;
    const role = document.getElementById("role").value;
    let response;

    if(document.getElementById("create").checked) {
        response = await fetch(`${domain}/api/auth/signin-user`,{
            method : "POST" ,
            headers : {
                "Content-Type": "application/json"
            },
            body : JSON.stringify({
                "name" : username,
                "password" : password,
                "email" : email,
                "role" : role
            })
        });
        
        if(response.status === 201){
            globalThis.location.href = "../otp/otp.html";
        }else{
            document.getElementById("err").innerText = data.message;
        }
    }else{
        response = await fetch(`${domain}/api/auth/login-user`,{
            method : "POST" ,
            headers : {
                "Content-Type": "application/json"
            },
            body : JSON.stringify({
                "name" : username,
                "password" : password,
                "email" : email,
                "role" : role
            })
        })
        const data = await response.json();
        console.dir(response);
        if (response.status === 200 || response.status === 201) {
            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("userId", data.userId);
            localStorage.setItem("role", data.role);
            localStorage.setItem("name", data.name);
            localStorage.setItem("email",email);
            if(localStorage.getItem("role")==="patient") globalThis.location.href = "../pat-details/details.html";
            else globalThis.location.href = "../doc-details/details.html";
        } else {
            document.getElementById("err").innerText = data.message;
        }
    }
});