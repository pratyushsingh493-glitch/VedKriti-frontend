import { domain } from "../config.js";

const showError = (message) => {
    console.error(message);
    alert(message);
};

const displayDoctor = (doctor) => {
    const find = document.getElementById("find");
    find.insertAdjacentHTML("afterbegin",`

    `)
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
                <b>${details.speciality1}, ${details.speciality2}, ${details.specialit3}</b>
                <br>
                <b>${details.country}, ${details.state}, ${details.city}</b>
                <p>${details.facilityName}</p>
                <br>
                <p>${details.about}</p>
            </div>
            <div class="price">
                Consultation Fee : 
                &#8377;${details.consultationFee}
            </div>
        </div>
    `);

    document.getElementById(`${details.docID}`).addEventListener("click",()=>{
        try {
            const response = await fetch(
                `${domain}/api/fetch-doctor?id=${localStorage.getItem("docID")}`,
                {
                    method: "GET",
                    headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}
                }
            );

            const data = await response.json();

            if (response.ok) {
                document.getElementById("filter").remove();
                document.getElementById("searchResult").remove();
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