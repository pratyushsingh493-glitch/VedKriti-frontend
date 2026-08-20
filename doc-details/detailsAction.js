import { apiFetch } from "../apiFetch.js";

/* =========================
   COMMON ELEMENTS
========================= */

const tabContainer = document.querySelector(".tabs-container");
const tabButtons = tabContainer ? tabContainer.querySelectorAll("a") : [];
const tabPanels = document.querySelectorAll(".tabs__panel > div");

const profilePic = document.querySelector("#about img");
const inputFile = document.getElementById("pfp");

const experienceForm = document.querySelector("#experiance form");
const addExperienceButton = document.getElementById("add");

let experienceCount = 1;
let experiencesLoaded = false;

/* =========================
   HELPER FUNCTIONS
========================= */

const getToken = () => localStorage.getItem("token");

const showError = (message) => {
    console.error(message);
    alert(message);
};

/*
 * Reads the complete JSON response.
 *
 * For an object response:
 * {
 *     status: "SUCCESS",
 *     data: {
 *         city: "Gwalior"
 *     }
 * }
 *
 * It returns:
 * {
 *     status: "SUCCESS",
 *     data: {...},
 *     city: "Gwalior"
 * }
 */
const getResponseData = async (response) => {
    try {
        const json = await response.json();
        const responseData = json?.data;

        if (
            responseData &&
            typeof responseData === "object" &&
            !Array.isArray(responseData)
        ) {
            return {
                ...json,
                ...responseData
            };
        }

        return json || {};
    } catch {
        return {};
    }
};

/*
 * Starts or stops the loader on a button.
 */
const setButtonLoading = (
    button,
    isLoading,
    loadingText = "Saving..."
) => {
    if (!button) {
        return;
    }

    if (isLoading) {
        const isInput = button.matches(
            'input[type="submit"], input[type="button"]'
        );

        button.dataset.controlType = isInput
            ? "input"
            : "button";

        button.dataset.originalContent = isInput
            ? button.value
            : button.innerHTML;

        button.disabled = true;
        button.setAttribute("aria-busy", "true");
        button.classList.add("submit-button-loading");

        if (isInput) {
            button.value = `⏳ ${loadingText}`;
        } else {
            button.innerHTML = `
                <span
                    class="submit-button-spinner"
                    aria-hidden="true"
                ></span>
                ${loadingText}
            `;
        }

        return;
    }

    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.classList.remove("submit-button-loading");

    if (button.dataset.originalContent !== undefined) {
        if (button.dataset.controlType === "input") {
            button.value = button.dataset.originalContent;
        } else {
            button.innerHTML = button.dataset.originalContent;
        }

        delete button.dataset.originalContent;
        delete button.dataset.controlType;
    }
};

/*
 * Wait for the browser to paint the loader before
 * starting the API request.
 */
const waitForNextPaint = () =>
    new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });

/*
 * Add loader styling dynamically.
 */
if (!document.getElementById("submit-button-loader-style")) {
    const loaderStyle = document.createElement("style");
    loaderStyle.id = "submit-button-loader-style";
    loaderStyle.textContent = `
        .submit-button-loading {
            cursor: wait;
            opacity: 0.8;
        }

        .submit-button-spinner {
            display: inline-block;
            width: 0.9em;
            height: 0.9em;
            margin-right: 0.5em;
            border: 2px solid currentColor;
            border-right-color: transparent;
            border-radius: 50%;
            vertical-align: -0.12em;
            animation: submit-button-spin 0.7s linear infinite;
        }

        @keyframes submit-button-spin {
            to {
                transform: rotate(360deg);
            }
        }
    `;
    document.head.appendChild(loaderStyle);
}

const formatDateForInput = (date) => {
    if (!date) {
        return "";
    }
    return String(date).split("T")[0];
};

/* =========================
   TAB HANDLING
========================= */

const showPanel = (activePanel) => {
    if (!activePanel) {
        return;
    }

    tabPanels.forEach((panel) => {
        panel.hidden = panel !== activePanel;
    });

    tabButtons.forEach((tab) => {
        const isActive =
            tab.getAttribute("href") === `#${activePanel.id}`;

        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", String(isActive));

        if (isActive) {
            tab.setAttribute("aria-current", "step");
        } else {
            tab.removeAttribute("aria-current");
        }
    });

    activePanel.dispatchEvent(
        new CustomEvent("panelactive", {
            bubbles: true
        })
    );
};

const switchToTab = (tabIdOrHref) => {
    let selector = tabIdOrHref;
    if (!selector.startsWith("#")) {
        const tabEl = document.getElementById(tabIdOrHref);
        if (tabEl && tabEl.getAttribute("href")) {
            selector = tabEl.getAttribute("href");
        } else {
            selector = `#${tabIdOrHref}`;
        }
    }

    const targetPanel = document.querySelector(selector);
    if (targetPanel) {
        showPanel(targetPanel);
        targetPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
};

if (tabContainer) {
    tabContainer.addEventListener("click", (event) => {
        const clickedTab = event.target.closest("a");

        if (!clickedTab || !tabContainer.contains(clickedTab)) {
            return;
        }

        event.preventDefault();

        const panelSelector = clickedTab.getAttribute("href");
        const activePanel = document.querySelector(panelSelector);

        if (activePanel) {
            showPanel(activePanel);
        }
    });
}

/* =========================
   PROFILE-PICTURE PREVIEW
========================= */

if (inputFile && profilePic) {
    inputFile.addEventListener("change", () => {
        const file = inputFile.files[0];

        if (!file) {
            return;
        }

        profilePic.src = URL.createObjectURL(file);
    });
}

/* =========================
   PRACTICE LOCATION
========================= */

const locationPanel = document.getElementById("location");
const locationForm = locationPanel ? locationPanel.querySelector("form") : null;

if (locationPanel) {
    locationPanel.addEventListener("panelactive", async () => {
        try {
            const response = await apiFetch(
                "/api/doctor/get-practiceLocation",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await getResponseData(response);

            if (!response.ok) {
                console.warn("No existing practice location:", data.message);
                return;
            }

            const cityEl = document.getElementById("city");
            const stateEl = document.getElementById("state");
            const countryEl = document.getElementById("country");
            const addressEl = document.getElementById("address");
            const pinEl = document.getElementById("PIN");
            const facilityEl = document.getElementById("facility");
            const feeEl = document.getElementById("fee");

            if (cityEl) cityEl.value = data.city || "";
            if (stateEl) stateEl.value = data.state || "";
            if (countryEl) countryEl.value = data.country || "";
            if (addressEl) addressEl.value = data.address || "";
            if (pinEl) pinEl.value = data.pin || "";
            if (facilityEl) facilityEl.value = data.facilityName || "";
            if (feeEl) feeEl.value = data.consultationFee ?? "";
        } catch (error) {
            console.warn("Failed to load practice-location:", error.message);
        }
    });
}

const handleLocationSubmit = async (event) => {
    event.preventDefault();

    const form = locationForm || (event.currentTarget.closest ? event.currentTarget.closest("form") : null);
    if (!form) return;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const submitButton = form.querySelector('[type="submit"]') || document.getElementById("btnLoc") || document.getElementById("btnLocation");

    const city = document.getElementById("city") ? document.getElementById("city").value.trim() : "";
    const state = document.getElementById("state") ? document.getElementById("state").value.trim() : "";
    const country = document.getElementById("country") ? document.getElementById("country").value.trim() : "";
    const address = document.getElementById("address") ? document.getElementById("address").value.trim() : "";
    const pin = document.getElementById("PIN") ? document.getElementById("PIN").value.trim() : "";
    const facilityName = document.getElementById("facility") ? document.getElementById("facility").value.trim() : "";
    const consultationFee = document.getElementById("fee") ? Number(document.getElementById("fee").value) : 0;

    setButtonLoading(submitButton, true, "Saving...");
    await waitForNextPaint();

    try {
        const response = await apiFetch(
            "/api/doctor/set-practiceLocation",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
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

        const data = await getResponseData(response);

        if (!response.ok) {
            showError(
                data.message ||
                "Unable to save practice-location details."
            );
            return;
        }

        switchToTab("tab2");
    } catch (error) {
        showError(error.message);
    } finally {
        setButtonLoading(submitButton, false);
    }
};

if (locationForm) {
    locationForm.addEventListener("submit", handleLocationSubmit);
}

const locBtn = document.getElementById("btnLoc") || document.getElementById("btnLocation");
if (locBtn && locBtn.form !== locationForm) {
    locBtn.addEventListener("click", handleLocationSubmit);
}

/* =========================
   EDUCATION
========================= */

const educationPanel = document.getElementById("education");
const educationForm = educationPanel ? educationPanel.querySelector("form") : null;

if (educationPanel) {
    educationPanel.addEventListener("panelactive", async () => {
        try {
            const response = await apiFetch(
                "/api/doctor/get-education",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await getResponseData(response);

            if (!response.ok) {
                console.warn("No existing education details:", data.message);
                return;
            }

            const instituteEl = document.getElementById("institute");
            const degTypeEl = document.getElementById("deg_type");
            const degNameEl = document.getElementById("deg_name");
            const fieldOfStudyEl = document.getElementById("feildOfStudy");
            const s1El = document.getElementById("s1");
            const s2El = document.getElementById("s2");
            const s3El = document.getElementById("s3");

            if (instituteEl) instituteEl.value = data.institute || "";
            if (degTypeEl) degTypeEl.value = data.degreeType || "";
            if (degNameEl) degNameEl.value = data.degreeName || "";
            if (fieldOfStudyEl) fieldOfStudyEl.value = data.fieldOfStudy || data.feildOfStudy || "";
            if (s1El) s1El.value = data.specialization1 || "";
            if (s2El) s2El.value = data.specialization2 || "";
            if (s3El) s3El.value = data.specialization3 || "";
        } catch (error) {
            console.warn("Failed to load education details:", error.message);
        }
    });
}

const handleEducationSubmit = async (event) => {
    event.preventDefault();

    const form = educationForm || (event.currentTarget.closest ? event.currentTarget.closest("form") : null);
    if (!form) return;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const submitButton = form.querySelector('[type="submit"]') || document.getElementById("btnEdu");

    const institute = document.getElementById("institute") ? document.getElementById("institute").value.trim() : "";
    const degreeType = document.getElementById("deg_type") ? document.getElementById("deg_type").value.trim() : "";
    const degreeName = document.getElementById("deg_name") ? document.getElementById("deg_name").value.trim() : "";
    const fieldOfStudy = document.getElementById("feildOfStudy") ? document.getElementById("feildOfStudy").value.trim() : "";
    const specialization1 = document.getElementById("s1") ? document.getElementById("s1").value.trim() : "";
    const specialization2 = document.getElementById("s2") ? document.getElementById("s2").value.trim() : "";
    const specialization3 = document.getElementById("s3") ? document.getElementById("s3").value.trim() : "";

    setButtonLoading(submitButton, true, "Saving...");
    await waitForNextPaint();

    try {
        const response = await apiFetch(
            "/api/doctor/set-education",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
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

        const data = await getResponseData(response);

        if (!response.ok) {
            showError(
                data.message ||
                "Unable to save education details."
            );
            return;
        }

        switchToTab("tab3");
    } catch (error) {
        showError(error.message);
    } finally {
        setButtonLoading(submitButton, false);
    }
};

if (educationForm) {
    educationForm.addEventListener("submit", handleEducationSubmit);
}

const eduBtn = document.getElementById("btnEdu");
if (eduBtn && eduBtn.form !== educationForm) {
    eduBtn.addEventListener("click", handleEducationSubmit);
}

/* =========================
   EXPERIENCE
========================= */

const createExperienceFields = (experience = {}) => {
    experienceCount++;

    const experienceBlock = document.createElement("span");
    experienceBlock.id = `exp_${experienceCount}`;
    experienceBlock.className = "experience-entry";

    experienceBlock.innerHTML = `
        <div>
            <label for="exp_facility_${experienceCount}">
                Facility Name:
                <input
                    type="text"
                    id="exp_facility_${experienceCount}"
                    name="exp_facility_${experienceCount}"
                    placeholder="Enter Facility Name"
                    value="${experience.facilityName || ""}"
                    required
                >
            </label>

            <label for="exp_designation_${experienceCount}">
                Designation:
                <input
                    type="text"
                    id="exp_designation_${experienceCount}"
                    name="exp_designation_${experienceCount}"
                    placeholder="Enter Designation"
                    value="${experience.designation || ""}"
                    required
                >
            </label>
        </div>

        <br>

        <div>
            <label for="start_${experienceCount}">
                Start Date:
                <input
                    type="date"
                    id="start_${experienceCount}"
                    name="start_${experienceCount}"
                    value="${formatDateForInput(experience.startDate)}"
                    required
                >
            </label>

            <label for="end_${experienceCount}">
                End Date:
                <input
                    type="date"
                    id="end_${experienceCount}"
                    name="end_${experienceCount}"
                    value="${formatDateForInput(experience.endDate)}"
                    required
                >
            </label>
        </div>

        <br>

        <button
            type="button"
            class="delBtn"
        >
            Delete Experience
        </button>

        <br>
        <br>
    `;

    if (addExperienceButton) {
        const buttonContainer = addExperienceButton.parentElement;
        if (experienceForm && buttonContainer) {
            experienceForm.insertBefore(experienceBlock, buttonContainer);
        }
    }
};

if (addExperienceButton) {
    addExperienceButton.addEventListener("click", (event) => {
        event.preventDefault();
        createExperienceFields();
    });
}

if (experienceForm) {
    experienceForm.addEventListener("click", (event) => {
        const deleteButton = event.target.closest(".delBtn");
        if (!deleteButton) {
            return;
        }

        event.preventDefault();
        const experienceBlock = deleteButton.closest(".experience-entry");
        if (experienceBlock) {
            experienceBlock.remove();
        }
    });
}

const experiencePanel = document.getElementById("experiance");
if (experiencePanel) {
    experiencePanel.addEventListener("panelactive", async () => {
        if (experiencesLoaded) {
            return;
        }

        try {
            const response = await apiFetch(
                "/api/doctor/getexperience",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const result = await response.json();

            if (!response.ok) {
                console.warn("No existing experience details:", result.message);
                return;
            }

            const experiences = Array.isArray(result.data) ? result.data : [];

            if (experiences.length === 0) {
                experiencesLoaded = true;
                return;
            }

            const firstExperience = experiences[0];
            const firstFacility = document.getElementById("exp_facility_1");
            const firstDesignation = document.getElementById("exp_designation_1");
            const firstStart = document.getElementById("start_1");
            const firstEnd = document.getElementById("end_1");

            if (firstFacility) firstFacility.value = firstExperience.facilityName || "";
            if (firstDesignation) firstDesignation.value = firstExperience.designation || "";
            if (firstStart) firstStart.value = formatDateForInput(firstExperience.startDate);
            if (firstEnd) firstEnd.value = formatDateForInput(firstExperience.endDate);

            experiences.slice(1).forEach((experience) => {
                createExperienceFields(experience);
            });

            experiencesLoaded = true;
        } catch (error) {
            console.warn("Failed to load experience details:", error.message);
        }
    });
}

const handleExperienceSubmit = async (event) => {
    event.preventDefault();

    const form = experienceForm || (event.currentTarget.closest ? event.currentTarget.closest("form") : null);
    if (!form) return;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const submitButton = form.querySelector('[type="submit"]') || document.getElementById("btnExp");

    const experiences = [];
    const firstFacility = document.getElementById("exp_facility_1");
    const firstDesignation = document.getElementById("exp_designation_1");
    const firstStart = document.getElementById("start_1");
    const firstEnd = document.getElementById("end_1");

    if (firstFacility && firstDesignation && firstStart && firstEnd) {
        experiences.push({
            facilityName: firstFacility.value.trim(),
            designation: firstDesignation.value.trim(),
            startDate: firstStart.value,
            endDate: firstEnd.value
        });
    }

    form.querySelectorAll(".experience-entry").forEach((block) => {
        const number = block.id.replace("exp_", "");
        const fac = document.getElementById(`exp_facility_${number}`);
        const des = document.getElementById(`exp_designation_${number}`);
        const st = document.getElementById(`start_${number}`);
        const en = document.getElementById(`end_${number}`);

        if (fac && des && st && en) {
            experiences.push({
                facilityName: fac.value.trim(),
                designation: des.value.trim(),
                startDate: st.value,
                endDate: en.value
            });
        }
    });

    setButtonLoading(submitButton, true, "Saving...");
    await waitForNextPaint();

    try {
        const response = await apiFetch(
            "/api/doctor/addexperience",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    experiences
                })
            }
        );

        const data = await getResponseData(response);

        if (!response.ok) {
            showError(
                data.message ||
                "Unable to save experience details."
            );
            return;
        }

        switchToTab("tab4");
    } catch (error) {
        showError(error.message);
    } finally {
        setButtonLoading(submitButton, false);
    }
};

if (experienceForm) {
    experienceForm.addEventListener("submit", handleExperienceSubmit);
}

const expBtn = document.getElementById("btnExp");
if (expBtn && expBtn.form !== experienceForm) {
    expBtn.addEventListener("click", handleExperienceSubmit);
}

/* =========================
   OPERATIONAL DETAILS
========================= */

const operationalPanel = document.getElementById("operational");
const operationalForm = operationalPanel ? operationalPanel.querySelector("form") : null;

if (operationalPanel) {
    operationalPanel.addEventListener("panelactive", async () => {
        try {
            const response = await apiFetch(
                "/api/doctor/get-operationalDetails",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await getResponseData(response);

            if (!response.ok) {
                console.warn("No existing operational details:", data.message);
                return;
            }

            const mCap = document.getElementById("m_cap");
            const aCap = document.getElementById("a_cap");
            const eCap = document.getElementById("e_cap");

            if (mCap) mCap.value = data.morningCapacity ?? "";
            if (aCap) aCap.value = data.afternoonCapacity ?? "";
            if (eCap) eCap.value = data.eveningCapacity ?? "";

            const holiday = String(data.holidays || "");

            document
                .querySelectorAll('input[name="holiday"]')
                .forEach((checkbox, index) => {
                    checkbox.checked = holiday.includes(String(index + 1));
                });
        } catch (error) {
            console.warn("Failed to load operational details:", error.message);
        }
    });
}

const handleOperationalSubmit = async (event) => {
    event.preventDefault();

    const form = operationalForm || (event.currentTarget.closest ? event.currentTarget.closest("form") : null);
    if (!form) return;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const submitButton = form.querySelector('[type="submit"]') || document.getElementById("btnOps");

    const mCapEl = document.getElementById("m_cap");
    const aCapEl = document.getElementById("a_cap");
    const eCapEl = document.getElementById("e_cap");

    const morningCapacity = mCapEl ? Number(mCapEl.value) : 0;
    const afternoonCapacity = aCapEl ? Number(aCapEl.value) : 0;
    const eveningCapacity = eCapEl ? Number(eCapEl.value) : 0;

    const dayMap = {
        Monday: "1",
        Tuesday: "2",
        Wednesday: "3",
        Thursday: "4",
        Friday: "5",
        Saturday: "6",
        Sunday: "7"
    };

    let holidayValue = "";

    document
        .querySelectorAll('input[name="holiday"]:checked')
        .forEach((checkbox) => {
            if (dayMap[checkbox.value]) {
                holidayValue += dayMap[checkbox.value];
            }
        });

    const holidays = holidayValue === "" ? 0 : Number(holidayValue);

    setButtonLoading(submitButton, true, "Saving...");
    await waitForNextPaint();

    try {
        const response = await apiFetch(
            "/api/doctor/set-operationalDetails",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    morningCapacity,
                    afternoonCapacity,
                    eveningCapacity,
                    holidays
                })
            }
        );

        const data = await getResponseData(response);

        if (!response.ok) {
            showError(
                data.message ||
                "Unable to save operational details."
            );
            return;
        }

        switchToTab("tab5");
    } catch (error) {
        showError(error.message);
    } finally {
        setButtonLoading(submitButton, false);
    }
};

if (operationalForm) {
    operationalForm.addEventListener("submit", handleOperationalSubmit);
}

const opsBtn = document.getElementById("btnOps");
if (opsBtn && opsBtn.form !== operationalForm) {
    opsBtn.addEventListener("click", handleOperationalSubmit);
}

/* =========================
   ABOUT
========================= */

const aboutPanel = document.getElementById("about");
const aboutForm = aboutPanel ? aboutPanel.querySelector("form") : null;

if (aboutPanel) {
    aboutPanel.addEventListener("panelactive", async () => {
        try {
            const response = await apiFetch(
                "/api/doctor/get-about",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await getResponseData(response);

            if (!response.ok) {
                console.warn("No existing about details:", data.message);
                return;
            }

            const desEl = document.getElementById("designation");
            const descEl = document.getElementById("desc");

            if (desEl) desEl.value = data.designation || "";
            if (descEl) descEl.value = data.about || "";

            if (data.photo && profilePic) {
                profilePic.src = data.photo;
            }
        } catch (error) {
            console.warn("Failed to load about details:", error.message);
        }
    });
}

const handleAboutSubmit = async (event) => {
    event.preventDefault();

    const form = aboutForm || (event.currentTarget.closest ? event.currentTarget.closest("form") : null);
    if (!form) return;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const submitButton = form.querySelector('[type="submit"]') || document.getElementById("btnAbout");

    const desEl = document.getElementById("designation");
    const descEl = document.getElementById("desc");
    const pfpEl = document.getElementById("pfp");

    const designation = desEl ? desEl.value.trim() : "";
    const about = descEl ? descEl.value.trim() : "";
    const profileFile = pfpEl ? pfpEl.files[0] : null;

    const formData = new FormData();
    formData.append("designation", designation);
    formData.append("about", about);

    if (profileFile) {
        formData.append("photo", profileFile);
    }

    setButtonLoading(submitButton, true, "Saving...");
    await waitForNextPaint();

    try {
        const response = await apiFetch(
            "/api/doctor/set-about",
            {
                method: "PUT",
                body: formData
            }
        );

        const data = await getResponseData(response);

        if (!response.ok) {
            showError(
                data.message ||
                "Unable to save profile details."
            );
            return;
        }

        switchToTab("tab6");
    } catch (error) {
        showError(error.message);
    } finally {
        setButtonLoading(submitButton, false);
    }
};

if (aboutForm) {
    aboutForm.addEventListener("submit", handleAboutSubmit);
}

const aboutBtn = document.getElementById("btnAbout");
if (aboutBtn && aboutBtn.form !== aboutForm) {
    aboutBtn.addEventListener("click", handleAboutSubmit);
}

/* =========================
   VERIFICATION RECORDS
========================= */

const recordsPanel = document.getElementById("records");
const recordsForm = recordsPanel ? (recordsPanel.querySelector("form") || document.getElementById("recordsForm")) : null;

const handleRecordsSubmit = async (event) => {
    event.preventDefault();

    const form = recordsForm || (event.currentTarget.closest ? event.currentTarget.closest("form") : null);
    if (!form) return;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const submitButton = form.querySelector('[type="submit"]') || document.getElementById("btnRecords");

    const governmentIdEl = document.getElementById("governmentId");
    const medicalCertEl = document.getElementById("medicalCertificate");

    const governmentId = governmentIdEl ? governmentIdEl.files[0] : null;
    const medicalCertificate = medicalCertEl ? medicalCertEl.files[0] : null;

    if (!governmentId || !medicalCertificate) {
        showError("Please upload both documents.");
        return;
    }

    const medicalCertForm = new FormData();
    medicalCertForm.append("document", medicalCertificate);
    medicalCertForm.append("title", "Medical Certificate");
    medicalCertForm.append("isPublic", "true");

    const governmentIdForm = new FormData();
    governmentIdForm.append("document", governmentId);
    governmentIdForm.append("title", "Government ID");
    governmentIdForm.append("isPublic", "true");

    setButtonLoading(submitButton, true, "Uploading...");
    await waitForNextPaint();

    try {
        /*
         * Upload the medical certificate.
         */
        const medicalResponse = await apiFetch(
            "/api/doctor/upload-document",
            {
                method: "POST",
                body: medicalCertForm
            }
        );

        const medicalData = await getResponseData(medicalResponse);

        if (!medicalResponse.ok) {
            showError(
                medicalData.message ||
                "Unable to upload medical certificate."
            );
            return;
        }

        /*
         * Upload the government ID.
         */
        const governmentResponse = await apiFetch(
            "/api/doctor/upload-document",
            {
                method: "POST",
                body: governmentIdForm
            }
        );

        const governmentData = await getResponseData(governmentResponse);

        if (!governmentResponse.ok) {
            showError(
                governmentData.message ||
                "Unable to upload government ID."
            );
            return;
        }

        alert(
            "Documents uploaded successfully! Your details have been submitted for verification."
        );

        window.location.href = "../doc-dashboard/home.html";
    } catch (error) {
        showError(error.message);
    } finally {
        setButtonLoading(submitButton, false);
    }
};

if (recordsForm) {
    recordsForm.addEventListener("submit", handleRecordsSubmit);
}

const recordsBtn = document.getElementById("btnRecords");
if (recordsBtn && recordsBtn.form !== recordsForm) {
    recordsBtn.addEventListener("click", handleRecordsSubmit);
}

/* =========================
   INITIALIZATION
========================= */

/*
 * Show the initial panel only after all panelactive
 * event listeners have been registered.
 */
if (tabPanels.length > 0) {
    const hash = window.location.hash;
    const initialPanel = (hash && document.querySelector(hash)) || tabPanels[0];
    showPanel(initialPanel);
}