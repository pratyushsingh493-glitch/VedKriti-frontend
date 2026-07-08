import { domain } from "./config.js";

const submit = document.querySelector("button");

submit.addEventListener("click",async(e)=>{
    e.preventDefault();
    let dom = document.querySelectorAll("input");
    let otp;
    dom.forEach(x=>{
        otp+=x.value;
    });
    const response = await fetch(`${domain}/verify-user`,{
        method : "POST",
        headers : {
            "Content-Type": "application/json"
        },
        body : JSON.stringify({
            "otp" : otp
        })
    });
    const status = response.status;
    const data = await response.json();
    if(status==200){
        globalThis.location.href = "home.html";
    }else{
        document.getElementById("err").innerText = data.message;
    }
})