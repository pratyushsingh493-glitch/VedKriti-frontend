import { domain } from "../config.js";

const showError = (message) => {
    console.error(message);
    alert(message);
};

const displayDoctor = (doctor) => {
    const find = document.getElementById("find");
    find.insertAdjacentHTML("beforeend",`<div class="carousel"></div>`);
    doctor.availablity.forEach((avl)=>{
        document.querySelector(".carousel").insertAdjacentHTML("beforeend",`
            <div class="date" id="${avl.date}">
                <h3>${avl.date}</h3>
                <button class="MORNING">Morning ${avl.morningCapacity - avl.morningBookings} slots available</button>
                <button class="AFTERNOON">Afternoon ${avl.afternoonCapacity - avl.afternoonBookings} slots available</button>
                <button class="EVENING">Evening ${avl.eveningCapacity - avl.eveningBookings} slots available</button>
            </div>
        `)
        document.querySelectorAll(`#${avl.date} button`).forEach((button)=>{
            const shift = button.className;
            const patID = localStorage.getItem("userID");
            const date = avl.date;
            try {
                const response = await fetch(
                    `${domain}/api/book-doctor`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        },
                        body: {
                            patID,
                            date,
                            shift
                        }
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    alert("Booking Successful!")
                } else {
                    showError(data.message || "Unable to Book The slot");
                }
            } catch (error) {
                showError(error.message);
            }
        })
    });
    find.insertAdjacentHTML("beforeend",`
        <div class="card" id="${doctor.docID}">
            <div>
                <img src="${doctor.photo}" alt="Profile">
            </div>
            <div class="details">
                <h1>${doctor.name}</h1>
                <br>
                <b>${doctor.degreeType} - ${doctor.degreeName} - ${doctor.fieldOfStudy}</b>
                <b>${doctor.institute}</b>
                <b>${doctor.specialization1}, ${doctor.specialization2}, ${doctor.specialization3}</b>
                <br>
                <b>${doctor.country}, ${doctor.state}, ${doctor.city}</b>
                <p>${doctor.facilityName}</p>
                <br>
                <p>${doctor.address}</p>
                <br>
                <b>More about ${doctor.name}</b>
                <p>${doctor.about}</p>
            </div>
            <div class="price">
                Consultation Fee : 
                &#8377;${doctor.consultationFee}
            </div>
        </div>
    `);
    find.insertAdjacentHTML("beforeend",`<div class="timeline"></div>`)
    let idx = 0;
    doctor.experiance.forEach((exp)=>{
        const label = ((idx%2==0)?"left":"right");
        idx++;
        document.querySelector(".timeline").insertAdjacentHTML("afterbegin",`
            <div class="container ${label}">
                <img src="../media/point.webp">
                <div class="text-box">
                    <h2>${exp.facilityName}</h2>
                    <small>${exp.startDate} - ${exp.endDate}</small>
                    <p>${exp.designation}</p>
                    <span class="${label}-arrow"></span>
                </div>
            </div>
        `)
    });
    doctor.patients.forEach((patient)=>{
        find.insertAdjacentHTML("beforeend",`
            <div class="card" id="${patient.patID}">
                <div>
                    <img src="${patient.photo}" alt="Profile">
                </div>
                <div class="details">
                    <h1 style="text-align: left;">${patient.name}</h1>
                    <div class="star"></div>
                    <br>
                    <p>${patient.feedback}</p>
                </div>
            </div>
        `)

        for(let i=0;i<5;i++){
            let c = "n";
            if(i<patient.rating) c = "y";
            document.querySelector(`#${patient.patID} .star`).insertAdjacentHTML("beforeend",`<img src="../media/${c}star.png">`)
        }
    })
}

const addResults = (details) => {
    const search = document.getElementById("searchResults");
    search.insertAdjacentHTML("afterbegin",`
        <div class="card" id="${details.docID}">
            <div>
                <img src="${details.photo}" alt="Profile">
            </div>
            <div class="details">
                <h1>${details.name}</h1>
                <br>
                <b>${details.degreeType} - ${details.degreeName} - ${details.fieldOfStudy}</b>
                <b>${details.institute}</b>
                <b>${details.specialization1}, ${details.specialization2}, ${details.specialization3}</b>
                <br>
                <b>${details.country}, ${details.state}, ${details.city}</b>
                <p>${details.facilityName}</p>
                <br>
                <p>${details.address}</p>
                <br>
                <b>More about ${details.name}</b>
                <p>${details.about}</p>
            </div>
            <div class="price">
                Consultation Fee : 
                &#8377;${details.consultationFee}
            </div>
        </div>
    `);

    document.getElementById(`${details.docID}`).addEventListener("click",async()=>{
        try {
            const response = await fetch(
                `${domain}/api/fetch-doctor?id=${encodeURIComponent(details.docID)}`,
                {
                    method: "GET",
                    headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}
                }
            );

            const data = await response.json();

            if (response.ok) {
                document.getElementById("filter").remove();
                document.getElementById("searchResults").remove();
                document.querySelector("title").innerText = data.name;
                displayDoctor(data);
            } else {
                showError(data.message || "Unable to Fetch Doctor Details");
            }
        } catch (error) {
            showError(error.message);
        }
    })
}

document.getElementById("search").addEventListener("click",async(e)=>{
    e.preventDefault()
    const city = document.getElementById("city").value;
    const speciality = document.getElementById("speciality").value;
    const facility = document.getElementById("facility").value;
    const name = document.getElementById("name").value;
    const date = document.getElementById("date").value;
    const slot = document.getElementById("slot").value;

    const formData = new FormData();

    formData.append("city",city);
    formData.append("speciality",speciality);
    formData.append("facility",facility);
    formData.append("name",name);
    formData.append("date",date);
    formData.append("slot",slot);

    try {
        const response = await fetch(
            `${domain}/api/find-doctor`,
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
            const searchResults = document.getElementById("searchResults");

            searchResults.innerHTML = "";

            if (data.doctors.length === 0) {
                searchResults.textContent = "No doctors found";
                return;
            }

            data.doctors.forEach((doctor) => {
                addResults(doctor);
            });
        } else {
            showError(data.message || "Unable to fetch doctor details");
        }
    } catch (error) {
        showError(error.message);
    }
})