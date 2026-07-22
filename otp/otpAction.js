import { domain } from "../config.js";

const submit = document.querySelector(".verifyButton");
const resend = document.querySelector(".resendBtn");

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
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body : JSON.stringify({
            "otp" : otp,
            "email" : localStorage.getItem("email")
        })
    });
    const status = response.status;
    const data = await response.json();
    if(status==200){
        if(localStorage.getItem("role")==="patient") globalThis.location.href = "../pat-details/details.html";
        else globalThis.location.href = "../doc-details/details.html";
    }else{
        document.getElementById("err").innerText = data.message;
    }
})

resend.addEventListener("click",async(e)=>{
    e.preventDefault();
    const response = await fetch(`${domain}/api/auth/resend-otp`,{
        method : "POST",
        headers : {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body : JSON.stringify({
            "email" : localStorage.getItem("email")
        })
    });
    const status = response.status;
    const data = await response.json();
    if(status==200){
        alert(data.message);
    }else{
        document.getElementById("err").innerText = data.message;
    }
})