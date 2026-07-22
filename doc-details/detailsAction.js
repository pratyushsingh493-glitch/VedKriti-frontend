import { domain } from "../config.js";

const tabContainer = document.querySelector(".tabs-container");
const tabBtn = tabContainer.querySelectorAll("a");
const tabPanels = document.querySelectorAll(".tabs__panel > div");

const profilePic = document.querySelector("#about img");
const inputFile = document.querySelector("#pfp");
const form = document.querySelector("#experiance form");
let exp = 1;

function showPanel(activePanel) {
    tabPanels.forEach((panel) => {
        panel.hidden = panel !== activePanel;
    });

    activePanel.dispatchEvent(
        new CustomEvent("panelactive", {
            bubbles: true
        })
    );
}

showPanel(tabPanels[0]);

tabContainer.addEventListener("click", (e) => {
    const clickedTab = e.target.closest("a");

    if (!clickedTab || !tabContainer.contains(clickedTab)) {
        return;
    }

    e.preventDefault();

    const activePanel = document.querySelector(
        clickedTab.getAttribute("href")
    );

    if (activePanel) {
        showPanel(activePanel);
    }
});

inputFile.addEventListener("change", () => {
    const file = inputFile.files[0];

    if (!file) {
        return;
    }

    profilePic.src = URL.createObjectURL(file);
});

const getStoredUser = () => {
    return {
        name: localStorage.getItem("name"),
        userId: localStorage.getItem("userId"),
        role: localStorage.getItem("role"),
        token: localStorage.getItem("token")
    };
};

const showError = (message) => {
    console.error(message);
    alert(message);
};

document.getElementById("location").addEventListener("panelactive",async(e)=>{
    try {
        const response = await fetch(
            `${domain}/api/doctor/get-practiceLocation`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        const data = await response.json();

        if (response.ok) {
            document.getElementById("city").value = data.city;
            document.getElementById("state").value = data.state;
            document.getElementById("country").value = data.country;
            document.getElementById("address").value = data.address;
            document.getElementById("PIN").value = data.pin;
            document.getElementById("facility").value = data.facilityName;
            document.getElementById("fee").value = data.consultationFee;
        } else {
            showError(data.message || "Unable to get practice location");
        }
    } catch (error) {
        showError(error.message);
    }
})

document.getElementById("btnLoc").addEventListener("click", async (e) => {
    e.preventDefault();

    const form = e.target.closest("form");

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value.trim();
    const country = document.getElementById("country").value.trim();
    const address = document.getElementById("address").value.trim();
    const pin = document.getElementById("PIN").value.trim();
    const facilityName = document.getElementById("facility").value.trim();
    const consultationFee = document.getElementById("fee").value;

    try {
        const response = await fetch(
            `${domain}/api/doctor/set-practiceLocation`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    city,
                    state,
                    country,
                    address,
                    pin,
                    facilityName,
                    consultationFee
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            document.getElementById("tab2").click();
        } else {
            showError(data.message || "Unable to save practice location");
        }
    } catch (error) {
        showError(error.message);
    }
});

document.getElementById("education").addEventListener("panelactive",async(e)=>{
    try {
        const response = await fetch(
            `${domain}/api/doctor/get-education`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        const data = await response.json();

        if (response.ok) {
            document.getElementById("institute").value = data.institute;
            document.getElementById("deg_type").value = data.degreeType;
            document.getElementById("deg_name").value = data.degreeName;
            document.getElementById("feildOfStudy").value = data.feildOfStudy;
            document.getElementById("s1").value = data.specialization1;
            document.getElementById("s2").value = data.specialization2;
            document.getElementById("s3").value = data.specialization3;
        } else {
            showError(data.message || "Unable to get education details");
        }
    } catch (error) {
        showError(error.message);
    }
})

document.getElementById("btnEdu").addEventListener("click", async (e) => {
    e.preventDefault();

    const form = e.target.closest("form");

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const institute = document.getElementById("institute").value.trim();
    const degreeType = document.getElementById("deg_type").value.trim();
    const degreeName = document.getElementById("deg_name").value.trim();
    const fieldOfStudy = document.getElementById("feildOfStudy").value.trim();
    const specialization1 = document.getElementById("s1").value.trim();
    const specialization2 = document.getElementById("s2").value.trim();
    const specialization3 = document.getElementById("s3").value.trim();

    try {
        const response = await fetch(
            `${domain}/api/doctor/set-education`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    institute,
                    degreeType,
                    degreeName,
                    fieldOfStudy,
                    specialization1,
                    specialization2,
                    specialization3
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            document.getElementById("tab3").click();
        } else {
            showError(data.message || "Unable to save education details");
        }
    } catch (error) {
        showError(error.message);
    }
});

document.getElementById("add").addEventListener("click",(e)=>{
    e.preventDefault();
    exp++;
    form.insertAdjacentHTML("afterbegin", `
        <span id="exp_${exp}">
            <div>
                <label for="exp_facility_${exp}">Facility Name : <input type="text" id="exp_facility_${exp}" name="exp_facility_${exp}" placeholder="Enter Facility Name" required></label>
                <label for="exp_designation_${exp}">Designation : <input type="text" id="exp_designation_${exp}" name="exp_designation_${exp}" placeholder="Enter Designation" required></label>
            </div>
            <br>
            <div>
                <label for="start_${exp}">Start Date : <input type="date" id="start_${exp}" name="start_${exp}" required></label>
                <label for="end_${exp}">End Date : <input type="date" id="end_${exp}" name="end_${exp}" required></label>
            </div>
            <br>
            <button type="button" class="delBtn" id="delete_${exp}">Delete Experiance</button>
            <br>
            <br>
        </span>
    `);
    document.getElementById(`delete_${exp}`).addEventListener("click",(e)=>{
        e.preventDefault();
        const id = e.currentTarget.id;
        const xp = Number(id.replace("delete_", ""));
        document.getElementById(`exp_${xp}`).remove();
        console.log(`removed button with id = exp_${xp}`)
    })
})

document.getElementById("experiance").addEventListener("panelactive",async(e)=>{
    try{
        const response = await fetch(`${domain}/api/doctor/getexperience`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            data.experiences.forEach((experiance)=>{
                document.getElementById("add").click();
                document.getElementById(`exp_facility_${exp}`).value = experiance.facilityName;
                document.getElementById(`exp_designation_${exp}`).value = experiance.designation;
                document.getElementById(`start_${exp}`).value = experiance.startDate;
                document.getElementById(`end_${exp}`).value = experiance.endDate;
            })
        } else {
            showError(data.message || "Unable to get experiance details");
        }

    }catch(error){
        showError(error.message);
    }
})

document.getElementById("btnExp").addEventListener("click",async(e)=>{
    e.preventDefault();

    const form = e.target.closest("form");

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    let experiences = [...form.querySelectorAll('span[id^="exp_"]')].map((block) => {
        const number = block.id.replace("exp_", "");

        return {
            facilityName: document.getElementById(`exp_facility_${number}`).value,
            designation: document.getElementById(`exp_designation_${number}`).value,
            startDate: document.getElementById(`start_${number}`).value,
            endDate: document.getElementById(`end_${number}`).value
        };
    });

    let experiance = {
        facilityName: document.getElementById(`exp_facility_1`).value,
        designation: document.getElementById(`exp_designation_1`).value,
        startDate: document.getElementById(`start_1`).value,
        endDate: document.getElementById(`end_1`).value
    }

    experiences.push(experiance);

    console.dir(experiences);

    try{
        const response = await fetch(`${domain}/api/doctor/addexperience`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ experiences })
        });
    }catch(error){
        showError(error.message);
    }

    const data = await response.json();
    console.log(data);
})

document.getElementById("operational").addEventListener("panelactive",async(e)=>{
    try{
        const response = await fetch(`${domain}/api/doctor/set-operationalDetails`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        const data = await response.json();

        let idx = 1;
        if (response.ok) {
            document.getElementById("m_cap").value = data.morningCapacity;
            document.getElementById("a_cap").value = data.afternoonCapacity;
            document.getElementById("e_cap").value = data.eveningCapacity;
            document.querySelectorAll('input[name="holiday"]').forEach((checkbox) => {
                checkbox.checked = holiday.includes(`${idx}`);
                idx++;
            });
        } else {
            showError(data.message || "Unable to get operational details");
        }

    }catch(error){
        showError(error.message);
    }
})

document.getElementById("btnOps").addEventListener("click", async (e) => {
    e.preventDefault();

    const form = e.target.closest("form");

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const morningCapacity = document.getElementById("m_cap").value;
    const afternoonCapacity = document.getElementById("a_cap").value;
    const eveningCapacity = document.getElementById("e_cap").value;

    const dayMap = {
    Monday: "1",
    Tuesday: "2",
    Wednesday: "3",
    Thursday: "4",
    Friday: "5",
    Saturday: "6",
    Sunday: "7"
    };

    let holiday = "";

    document.querySelectorAll('input[name="holiday"]:checked').forEach((checkbox) => {
        holiday += dayMap[checkbox.value];
    });

    holiday = Number(holidays);

    try {
        const response = await fetch(
            `${domain}/api/doctor/set-operationalDetails`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    morningCapacity,
                    afternoonCapacity,
                    eveningCapacity,
                    holiday
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            document.getElementById("tab4").click();
        } else {
            showError(data.message || "Unable to save operational details");
        }
    } catch (error) {
        showError(error.message);
    }
});

document.getElementById("about").addEventListener("panelactive",async(e)=>{
    try{
        const response = await fetch(
            `${domain}/get-about`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        const data = await response.json();

        if (response.ok) {
            document.getElementById("designation").value = data.designation;
            document.getElementById("desc").value = data.about;
            document.getElementById("pfp").files[0] = data.dphoto;
        } else {
            showError(data.message || "Unable to get profile details");
        }
    }catch(error){
        showError(error.message);
    }
})

document.getElementById("btnAbout").addEventListener("click", async (e) => {
    e.preventDefault();

    const form = e.target.closest("form");

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const designation = document.getElementById("designation").value.trim();
    const description = document.getElementById("desc").value.trim();
    const profileFile = document.getElementById("pfp").files[0];

    const formData = new FormData();

    formData.append("designation", designation);
    formData.append("description", description);

    if (profileFile) {
        formData.append("photo", profileFile);
    }

    try {
        const response = await fetch(
            `${domain}/api/doctor/set-about`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: formData
            }
        );

        const data = await response.json();

        if (response.ok) {
            document.getElementById("tab5").click();
        } else {
            showError(data.message || "Unable to save profile details");
        }
    } catch (error) {
        showError(error.message);
    }
});

document.getElementById("btnRecords").addEventListener("click", async (e) => {
    e.preventDefault();

    const form = e.target.closest("form");

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const governmentId =
        document.getElementById("governmentId").files[0];

    const medicalCertificate =
        document.getElementById("medicalCertificate").files[0];

    if (!governmentId || !medicalCertificate) {
        showError("Please upload both documents");
        return;
    }

    const formData = new FormData();

    formData.append("governmentId", governmentId);
    formData.append("medicalCertificate", medicalCertificate);

    try {
        const response = await fetch(
            `${domain}/api/doctor/get-about`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: formData
            }
        );

        const data = await response.json();

        if (response.ok) {
            alert("Please Wait Until We Verify Your Credentials");
        } else {
            showError(data.message || "Unable to upload documents");
        }
    } catch (error) {
        showError(error.message);
    }
});