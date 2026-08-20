import { domain } from "../config.js";
import { apiFetch } from "../apiFetch.js";

/*
 * Change these paths if your backend uses different routes.
 */
const ENDPOINTS = {
    search:
        `/api/booking/doctor-bookings`,

    today:
        `/api/booking/doctor-bookings`,

    emergencyCancel:
        `/api/booking/emergency-cancel`,

    profile: (doctorId) =>
        `/api/doctor/profile/${
            encodeURIComponent(doctorId)
        }`,

    start: (bookingId, otp) =>
        `/api/booking/start-consultation?id=${
            encodeURIComponent(bookingId)
        }&otp=${encodeURIComponent(otp)}`,

    end: (bookingId) =>
        `/api/booking/end-consultation?id=${
            encodeURIComponent(bookingId)
        }`,

    conference: (bookingId) =>
        `/api/booking/agora-token?bookingId=${
            encodeURIComponent(bookingId)
        }`,

    uploadReport: (patientId) =>
        `/api/report/upload-report?id=${
            encodeURIComponent(patientId)
        }`
};

/* =========================================================
   HELPERS
========================================================= */

const $ = (
    selector,
    parent = document
) => parent.querySelector(selector);

const $$ = (
    selector,
    parent = document
) => [...parent.querySelectorAll(selector)];

const getToken = () =>
    localStorage.getItem("token") || "";

/*
 * The signed-in doctor's own _id.
 * Update this if your login flow stores it under a different key.
 */
const getDoctorId = () =>
    localStorage.getItem("doctorId") ||
    localStorage.getItem("docID") ||
    localStorage.getItem("userId") ||
    "";

const authHeaders = (
    includeJSON = false
) => ({
    Authorization:
        `Bearer ${getToken()}`,

    ...(includeJSON
        ? {
            "Content-Type":
                "application/json"
        }
        : {})
});

const escapeHTML = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

const renderStars = (rating) => {
    const num = Math.round(Number(rating) || 0);
    const validNum = Math.max(0, Math.min(5, num));
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= validNum) {
            starsHtml += `<img src="../media/ystar.png" alt="star" style="width:16px; height:16px; display:inline-block; margin-right:2px;" />`;
        } else {
            starsHtml += `<img src="../media/bstar.png" alt="star" style="width:16px; height:16px; display:inline-block; margin-right:2px;" />`;
        }
    }
    return `<span style="display:flex; align-items:center;">${starsHtml}</span>`;
};

const readJSON = async (response) => {
    const contentType =
        response.headers.get("content-type") || "";

    if (
        !contentType.includes("application/json")
    ) {
        throw new Error(
            "The server returned an invalid response."
        );
    }

    return response.json();
};

const extractArray = (
    responseData,
    possibleKeys
) => {
    if (Array.isArray(responseData)) {
        return responseData;
    }

    if (Array.isArray(responseData?.data)) {
        return responseData.data;
    }

    for (const key of possibleKeys) {
        if (
            Array.isArray(responseData?.[key])
        ) {
            return responseData[key];
        }

        if (
            Array.isArray(
                responseData?.data?.[key]
            )
        ) {
            return responseData.data[key];
        }
    }

    return [];
};

const setMessage = (
    element,
    text = "",
    state = ""
) => {
    if (!element) {
        return;
    }

    element.textContent = text;

    element.className =
        `message${state ? ` ${state}` : ""}`;
};

/*
 * Returns local date instead of UTC date.
 *
 * Example:
 * 2026-08-01
 */
const getTodayDate = () => {
    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

/*
 * Parses either an ISO date ("2026-08-09") or a loosely
 * formatted date string ("13 Jul 2026") into a Date object,
 * treating date-only values as local time (no day-shift).
 */
const parseFlexibleDate = (value) => {
    const raw = String(value ?? "").trim();

    if (!raw) {
        return null;
    }

    const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;

    const date = isoDateOnly.test(raw)
        ? new Date(`${raw}T00:00:00`)
        : new Date(raw);

    return Number.isNaN(date.getTime())
        ? null
        : date;
};

/*
 * Formats a date as "9 August 2026" (no leading zero, full
 * month name, no weekday). Falls back to the raw value when
 * it can't be parsed.
 */
const formatDate = (value) => {
    if (!value) {
        return "Date not provided";
    }

    const date =
        parseFlexibleDate(value);

    if (!date) {
        return String(value);
    }

    const month =
        date.toLocaleDateString("en-US", {
            month: "long"
        });

    return `${date.getDate()} ${month} ${date.getFullYear()}`;
};

/*
 * Same as formatDate, prefixed with a short weekday —
 * e.g. "Sun, 9 August 2026". Used on the availability cards
 * where the day of week helps at a glance.
 */
const formatDateShort = (value) => {
    if (!value) {
        return "";
    }

    const date =
        parseFlexibleDate(value);

    if (!date) {
        return String(value);
    }

    const weekday =
        date.toLocaleDateString("en-US", {
            weekday: "short"
        });

    return `${weekday}, ${formatDate(value)}`;
};

const getBookingId = (booking) =>
    booking.bookingID ||
    booking.bookingId ||
    booking.id ||
    booking._id;

/* =========================================================
   ELEMENT REFERENCES
========================================================= */

const tabContainer =
    $(".tabs-container");

const panels =
    $$(".tabs_panel > section");

const todayResults =
    $("#todayResults");

const searchResults =
    $("#searchResults");

const consultationMessage =
    $("#consultationMessage");

const searchMessage =
    $("#searchMessage");

const profileMessage =
    $("#profileMessage");

const profileAbout =
    $("#profileAbout");

const profileStats =
    $("#profileStats");

const profileExperience =
    $("#profileExperience");

const profileFeedback =
    $("#profileFeedback");

const profileAvailability =
    $("#profileAvailability");

const profileQuicknav =
    $("#profileQuicknav");

/*
 * How many items to show before collapsing long lists behind
 * a "Show more" toggle, so the page doesn't turn into one
 * giant scroll.
 */
const COLLAPSE_LIMITS = {
    experience: 3,
    feedback: 4
};

let allExperience = [];
let allFeedback = [];
let isExperienceExpanded = false;
let isFeedbackExpanded = false;

/* =========================================================
   TAB SWITCHING
========================================================= */

const openTab = async (panelId) => {
    panels.forEach((panel) => {
        panel.hidden =
            panel.id !== panelId;
    });

    $$("a", tabContainer)
        .forEach((link) => {
            const active =
                link.getAttribute("href") ===
                `#${panelId}`;

            link.classList.toggle(
                "active-tab",
                active
            );

            link.setAttribute(
                "aria-selected",
                String(active)
            );
        });

    if (panelId === "consultations") {
        await loadTodayConsultations();
    }

    if (panelId === "profile") {
        await loadDoctorProfile();
    }
};

tabContainer.addEventListener(
    "click",
    async (event) => {
        const link =
            event.target.closest("a");

        if (!link) {
            return;
        }

        event.preventDefault();

        const panelId =
            link
                .getAttribute("href")
                .slice(1);

        await openTab(panelId);
    }
);

profileQuicknav.addEventListener(
    "click",
    (event) => {
        const link =
            event.target.closest("a");

        if (!link) {
            return;
        }

        const target =
            $(link.getAttribute("href"));

        if (!target) {
            return;
        }

        event.preventDefault();

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
);

/* =========================================================
   CONSULTATION ACTION BUTTONS
========================================================= */

const consultationActions = (booking, isSearch = false) => {
    const bookingId =
        getBookingId(booking);

    const status =
        String(
            booking.status || ""
        ).toUpperCase();

    const consultationType =
        String(
            booking.consultationType ||
            "OFFLINE"
        ).toUpperCase();

    if (
        status === "WAITING" ||
        status === "WAITLISTED"
    ) {
        return `
            <button
                type="button"
                class="remove-wl"
                data-action="remove-waiting"
                data-booking-id="${escapeHTML(
                    bookingId
                )}"
            >
                Remove from Waiting List
            </button>
        `;
    }

    if (
        status === "CONFIRMED" ||
        status === "BOOKED"
    ) {
        const conferenceButton =
            consultationType === "ONLINE"
                ? `
                    <button
                        type="button"
                        class="join-conference"
                        data-action="join"
                        data-booking-id="${escapeHTML(
                            bookingId
                        )}"
                    >
                        Join Conference
                    </button>
                `
                : "";

        return `
            ${conferenceButton}
            <button
                type="button"
                class="start-consultation"
                data-action="start"
                data-booking-id="${escapeHTML(
                    bookingId
                )}"
            >
                Start Consultation
            </button>
        `;
    }

    if (status === "CONSULTING") {
        const conferenceButton =
            consultationType === "ONLINE"
                ? `
                    <button
                        type="button"
                        class="join-conference"
                        data-action="join"
                        data-booking-id="${escapeHTML(
                            bookingId
                        )}"
                    >
                        Join Conference
                    </button>
                `
                : "";

        return `
            ${conferenceButton}

            <button
                type="button"
                class="end-consultation"
                data-action="end"
                data-booking-id="${escapeHTML(
                    bookingId
                )}"
            >
                End Consultation
            </button>
        `;
    }

    if (status === "DONE" && !isSearch) {
        return `
            <label class="upload-report-btn button" style="cursor:pointer; display:inline-block; padding:8px 16px; background:var(--primary, #007bff); color:#fff; border-radius:4px; text-align:center;">
                Capture Report
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    class="upload-report-input"
                    data-action="upload-report"
                    data-booking-id="${escapeHTML(bookingId)}"
                    data-patient-id="${escapeHTML(booking.patID || booking.patient?._id || booking.patientId || '')}"
                    style="display: none;"
                />
            </label>
        `;
    }

    return "";
};

/* =========================================================
   CONSULTATION CARD
========================================================= */

const consultationCard = (booking, isSearch = false) => {
    const status =
        String(
            booking.status || "UNKNOWN"
        ).toUpperCase();

    const patientName =
        booking.patientName ||
        booking.patName ||
        booking.patient?.name ||
        booking.patID?.name ||
        "Patient";

    const slot =
        booking.slot ||
        booking.bookingSlot ||
        booking.shift ||
        "Slot not provided";

    const tokenNumber =
        booking.tokenNumber ??
        booking.tokenNo ??
        "Not assigned";

    const consultationType =
        booking.consultationType ||
        "OFFLINE";

    const bookingDate =
        booking.date ||
        booking.bookingDate;

    return `
        <article class="card">
            <div class="card-content">
                <h2>
                    ${escapeHTML(patientName)}
                </h2>

                <div class="booking-meta">
                    <span>
                        ${escapeHTML(slot)}
                    </span>

                    <span>
                        Token:
                        ${escapeHTML(tokenNumber)}
                    </span>

                    <span>
                        ${escapeHTML(
                            consultationType
                        )}
                    </span>

                    <span
                        class="status status-${
                            status.toLowerCase()
                        }"
                    >
                        ${escapeHTML(status)}
                    </span>
                </div>

                <p class="booking-date">
                    ${escapeHTML(
                        formatDate(bookingDate)
                    )}
                </p>

                ${
                    isSearch && booking.rating
                        ? `
                            <div class="rating" style="display:flex; align-items:center; gap:8px; margin-top:10px;">
                                <strong>Rating:</strong> ${renderStars(booking.rating)}
                            </div>
                        `
                        : ""
                }
                ${
                    isSearch && booking.feedback
                        ? `
                            <p class="feedback">
                                <strong>Feedback:</strong> ${escapeHTML(booking.feedback)}
                            </p>
                        `
                        : ""
                }

                ${
                    booking.reason
                        ? `
                            <p class="feedback">
                                <strong>Reason:</strong> ${escapeHTML(
                                    booking.reason
                                )}
                            </p>
                        `
                        : ""
                }
            </div>

            <div class="card-actions">
                ${consultationActions(booking, isSearch)}
            </div>
        </article>
    `;
};

const renderConsultations = (
    container,
    consultations,
    isSearch = false
) => {
    if (!consultations.length) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>No consultations found</h2>

                <p>
                    Consultations will appear here.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        consultations
            .map(c => consultationCard(c, isSearch))
            .join("");
};

/* =========================================================
   LOAD TODAY'S CONSULTATIONS
========================================================= */

const loadTodayConsultations = async () => {
    const refreshButton =
        $("#refreshConsultations");

    const today =
        getTodayDate();

    refreshButton.disabled = true;
    refreshButton.textContent =
        "Loading...";

    setMessage(
        consultationMessage,
        "Loading today's consultations..."
    );

    try {
        const response = await apiFetch(
            `${ENDPOINTS.today}?date=${
                encodeURIComponent(today)
            }`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const data =
            await readJSON(response);

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to load today's consultations."
            );
        }

        const consultations =
            extractArray(
                data,
                [
                    "consultations",
                    "bookings"
                ]
            );

        renderConsultations(
            todayResults,
            consultations
        );

        setMessage(
            consultationMessage,
            `${consultations.length} consultation(s) scheduled for today.`,
            "success"
        );
    } catch (error) {
        renderConsultations(
            todayResults,
            []
        );

        setMessage(
            consultationMessage,
            error.message,
            "error"
        );
    } finally {
        refreshButton.disabled = false;
        refreshButton.textContent =
            "Refresh";
    }
};

$("#refreshConsultations").addEventListener(
    "click",
    loadTodayConsultations
);

/* =========================================================
   EMERGENCY CANCELLATION
========================================================= */

$("#emergencyCancelForm").addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        const form =
            event.currentTarget;

        const button =
            $("#emergencyCancel");

        const reason =
            $("#emergencyReason")
                .value
                .trim();

        const today =
            getTodayDate();

        if (!reason) {
            setMessage(
                consultationMessage,
                "Please enter a cancellation reason.",
                "error"
            );

            return;
        }

        const confirmed =
            globalThis.confirm(
                `Cancel all remaining consultations for ${today}?`
            );

        if (!confirmed) {
            return;
        }

        button.disabled = true;
        button.textContent =
            "Cancelling...";

        setMessage(
            consultationMessage,
            "Cancelling today's remaining consultations..."
        );

        try {
            const response = await apiFetch(
                ENDPOINTS.emergencyCancel,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body:
                        JSON.stringify({
                            reason,
                            date: today
                        })
                }
            );

            const data =
                await readJSON(response);

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Emergency cancellation failed."
                );
            }

            form.reset();

            setMessage(
                consultationMessage,
                data.message ||
                "Today's remaining consultations were cancelled.",
                "success"
            );

            await loadTodayConsultations();
        } catch (error) {
            setMessage(
                consultationMessage,
                error.message,
                "error"
            );
        } finally {
            button.disabled = false;
            button.textContent =
                "Emergency Cancel Today";
        }
    }
);

/* =========================================================
   SEARCH CONSULTATIONS
========================================================= */

$("#searchForm").addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        const searchButton =
            $("#search");

        const selectedDate =
            $("#date").value;

        if (!selectedDate) {
            setMessage(
                searchMessage,
                "Please select a date.",
                "error"
            );

            return;
        }

        searchButton.disabled = true;
        searchButton.textContent =
            "Searching...";

        setMessage(
            searchMessage,
            "Searching consultations..."
        );

        try {
            const response = await apiFetch(
                `${ENDPOINTS.search}?date=${
                    encodeURIComponent(
                        selectedDate
                    )
                }`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const data =
                await readJSON(response);

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to search consultations."
                );
            }

            const consultations =
                extractArray(
                    data,
                    [
                        "consultations",
                        "bookings"
                    ]
                );

            renderConsultations(
                searchResults,
                consultations,
                true
            );

            setMessage(
                searchMessage,
                `${consultations.length} result(s) found.`,
                "success"
            );
        } catch (error) {
            renderConsultations(
                searchResults,
                []
            );

            setMessage(
                searchMessage,
                error.message,
                "error"
            );
        } finally {
            searchButton.disabled = false;
            searchButton.textContent =
                "Search";
        }
    }
);

/* =========================================================
   CONSULTATION ACTIONS
========================================================= */

todayResults.addEventListener(
    "click",
    async (event) => {
        const button =
            event.target.closest(
                "button[data-action]"
            );

        if (!button) {
            return;
        }

        const bookingId =
            button.dataset.bookingId;

        const action =
            button.dataset.action;

        if (!bookingId) {
            setMessage(
                consultationMessage,
                "Booking ID is missing.",
                "error"
            );

            return;
        }

        if (action === "join") {
            await joinConference(
                bookingId,
                button
            );

            return;
        }

        if (
            action === "remove-waiting"
        ) {
            setMessage(
                consultationMessage,
                "Connect this button to your waiting-list removal endpoint.",
                "error"
            );

            return;
        }

        if (
            action !== "start" &&
            action !== "end"
        ) {
            return;
        }

        const isStarting =
            action === "start";

        const originalText =
            button.textContent;

        button.disabled = true;

        button.textContent =
            isStarting
                ? "Starting..."
                : "Ending...";

        try {
            let endpoint;

            if (isStarting) {
                const otp = globalThis.prompt(
                    "Enter the OTP to start this consultation:"
                );

                if (otp === null) {
                    button.disabled = false;
                    button.textContent = originalText;
                    return;
                }

                endpoint = ENDPOINTS.start(bookingId, otp.trim());
            } else {
                endpoint = ENDPOINTS.end(bookingId);
            }

            const response = await apiFetch(
                endpoint,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const data =
                await readJSON(response);

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    `Unable to update consultation.`
                );
            }

            setMessage(
                consultationMessage,
                data.message ||
                `Consultation updated.`,
                "success"
            );

            await loadTodayConsultations();
        } catch (error) {
            setMessage(
                consultationMessage,
                error.message,
                "error"
            );

            button.disabled = false;
            button.textContent =
                originalText;
        }
    }
);

todayResults.addEventListener(
    "change",
    async (event) => {
        const input = event.target;

        if (!input.classList.contains("upload-report-input")) {
            return;
        }

        const file = input.files[0];
        if (!file) return;

        const bookingId = input.dataset.bookingId;
        const patientId = input.dataset.patientId || "unknown";

        const formData = new FormData();
        formData.append("report", file);
        formData.append("title", "Consultation Report");
        formData.append("category", "PRESCRIPTION");
        formData.append("bookingId", bookingId);

        setMessage(
            consultationMessage,
            "Uploading report..."
        );

        try {
            const response = await apiFetch(
                ENDPOINTS.uploadReport(patientId),
                {
                    method: "PUT",
                    body: formData
                }
            );

            const data = await readJSON(response);

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to upload report."
                );
            }

            setMessage(
                consultationMessage,
                "Report uploaded successfully.",
                "success"
            );
            
            // Clear input so it can be uploaded again if needed
            input.value = "";
        } catch (error) {
            setMessage(
                consultationMessage,
                error.message,
                "error"
            );
            input.value = "";
        }
    }
);

/* =========================================================
   JOIN ONLINE CONFERENCE
========================================================= */

const joinConference = async (
    bookingId,
    button
) => {
    const originalText =
        button.textContent;

    button.disabled = true;
    button.textContent =
        "Joining...";

    try {
        const response = await apiFetch(
            ENDPOINTS.conference(
                bookingId
            ),
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        await console.log(response);

        const data =
            await readJSON(response);

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to fetch conference credentials."
            );
        }

        const credentials =
            data.data || data;

        console.log(
            "Conference credentials received:",
            credentials
        );

        const appId =
            credentials.appId ||
            credentials.agoraAppId;

        const channel =
            credentials.channelName ||
            credentials.channel;

        const conferenceToken =
            credentials.token ||
            credentials.rtcToken;

        const conferenceUid =
            Number(credentials.uid);

        if (
            !appId ||
            !channel ||
            !conferenceToken ||
            !Number.isInteger(conferenceUid) ||
            conferenceUid <= 0
        ) {
            throw new Error(
                "The backend returned incomplete Agora credentials."
            );
        }

        localStorage.setItem(
            "agoraAppId",
            appId
        );

        localStorage.setItem(
            "conferenceChannel",
            channel
        );

        localStorage.setItem(
            "conferenceToken",
            conferenceToken
        );

        localStorage.setItem(
            "conferenceUid",
            String(conferenceUid)
        );

        localStorage.setItem(
            "currentConsultationBookingId",
            bookingId
        );

        console.log(
            "Saved conference UID:",
            localStorage.getItem("conferenceUid")
        );

        globalThis.location.href =
            "../conference/index.html";
    } catch (error) {
        setMessage(
            consultationMessage,
            error.message,
            "error"
        );

        button.disabled = false;
        button.textContent =
            originalText;
    }
};

/* =========================================================
   MY PROFILE — RENDER HELPERS
========================================================= */

/*
 * Photo can arrive as: a plain base64 string, a data URI, an
 * http(s) URL, or a JSON-serialized Mongoose Buffer
 * ({ type: "Buffer", data: [...] }). This normalizes all of
 * those into something an <img src> can use, or returns null
 * so the initials fallback avatar is shown instead.
 */
const resolvePhotoSrc = (photo) => {
    if (!photo) {
        return null;
    }

    if (typeof photo === "string") {
        if (
            photo.startsWith("data:") ||
            photo.startsWith("http")
        ) {
            return photo;
        }

        return `data:image/jpeg;base64,${photo}`;
    }

    const bufferData =
        photo.data || photo.buffer?.data;

    if (Array.isArray(bufferData)) {
        const bytes =
            new Uint8Array(bufferData);

        let binary = "";

        bytes.forEach((byte) => {
            binary += String.fromCharCode(byte);
        });

        return `data:image/jpeg;base64,${btoa(binary)}`;
    }

    return null;
};

const getInitials = (name) =>
    String(name || "Dr")
        .trim()
        .split(/\s+/)
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

const specialityList = (doctor) =>
    [
        doctor.specialization,
        doctor.specialization1,
        doctor.specialization2,
        doctor.specialization3
    ]
        .filter(Boolean)
        .filter(
            (value, index, all) =>
                all.indexOf(value) === index
        );

const renderAbout = (doctor, avgRating, consultedCount) => {
    const specialities =
        specialityList(doctor);

    const qualification =
        [
            doctor.degreeType,
            doctor.fieldOfStudy &&
                `(${doctor.fieldOfStudy})`,
            doctor.institute &&
                `from ${doctor.institute}`
        ]
            .filter(Boolean)
            .join(" ");

    const address =
        [
            doctor.facilityName,
            doctor.address,
            doctor.city,
            doctor.state,
            doctor.country,
            doctor.pin && `PIN: ${doctor.pin}`
        ]
            .filter(Boolean)
            .join(", ");

    const photoSrc =
        resolvePhotoSrc(doctor.photo);

    const initials =
        getInitials(doctor.name);

    profileAbout.innerHTML = `
        <div class="profile-block about-doctor">
            <div class="profile-photo">
                <div class="avatar-wrap">
                    ${
                        photoSrc
                            ? `
                                <img
                                    class="avatar-img"
                                    src="${photoSrc}"
                                    alt=""
                                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                                >
                            `
                            : ""
                    }

                    <div
                        class="avatar-fallback"
                        style="display:${photoSrc ? "none" : "flex"};"
                    >
                        ${escapeHTML(initials)}
                    </div>
                </div>

                ${
                    doctor.verified
                        ? `<span class="verified-badge">Verified</span>`
                        : ""
                }
            </div>

            <div class="about-details">
                <h3>Dr. ${escapeHTML(doctor.name || "Unnamed")}</h3>

                <p class="about-line">
                    ${escapeHTML(doctor.email || "Email not provided")}
                </p>

                ${
                    doctor.specialization
                        ? `
                            <p class="about-line">
                                ${escapeHTML(doctor.specialization)}
                            </p>
                        `
                        : ""
                }

                ${
                    specialities.length
                        ? `
                            <p class="about-line">
                                <strong>Specialities:</strong>
                                ${escapeHTML(specialities.join(", "))}
                            </p>
                        `
                        : ""
                }

                ${
                    qualification
                        ? `
                            <p class="about-line">
                                <strong>Qualification:</strong>
                                ${escapeHTML(qualification)}
                            </p>
                        `
                        : ""
                }

                ${
                    address
                        ? `
                            <p class="about-line">
                                <strong>Facility &amp; Address:</strong>
                                ${escapeHTML(address)}
                            </p>
                        `
                        : ""
                }

                <div class="info-chips">
                    ${
                        doctor.consultationFee != null
                            ? `
                                <span class="chip-fee">
                                    Consultation Fee: &#8377;${escapeHTML(
                                        doctor.consultationFee
                                    )}
                                </span>
                            `
                            : ""
                    }

                    <span class="chip-rating">
                        Rating: ${avgRating.toFixed(1)} / 5
                    </span>

                    <span class="chip-consulted">
                        Patients Consulted: ${consultedCount}
                    </span>
                </div>

                <div class="about-bio">
                    Working as a doctor brings a daily mix of hard work
                    and deep reward. Every consultation is a chance to
                    ease a patient's concerns and help them get back to
                    feeling their best.
                </div>
            </div>
        </div>
    `;
};

const renderStats = (
    doctor,
    experiance,
    availability,
    feedback,
    avgRating
) => {
    const totalConsulted =
        feedback.length;

    const writtenReviews =
        feedback.filter(
            (item) => (item.feedback || "").trim()
        ).length;

    const fiveStarCount =
        feedback.filter(
            (item) => Number(item.rating) === 5
        ).length;

    const upcomingOpenSlots =
        availability.reduce(
            (total, day) => {
                const morningOpen =
                    Math.max(
                        0,
                        (day.morningCapacity || 0) -
                            (day.morningBookings || 0)
                    );

                const afternoonOpen =
                    Math.max(
                        0,
                        (day.afternoonCapacity || 0) -
                            (day.afternoonBookings || 0)
                    );

                const eveningOpen =
                    Math.max(
                        0,
                        (day.eveningCapacity || 0) -
                            (day.eveningBooking || 0)
                    );

                return (
                    total +
                    morningOpen +
                    afternoonOpen +
                    eveningOpen
                );
            },
            0
        );

    const yearsOfExperience =
        experiance.length
            ? new Date().getFullYear() -
              new Date(
                  experiance[experiance.length - 1].startDate
              ).getFullYear()
            : doctor.experiance || 0;

    const stats = [
        { value: avgRating.toFixed(1), label: "Average Rating" },
        { value: totalConsulted, label: "Patients Consulted" },
        { value: fiveStarCount, label: "5-Star Reviews" },
        { value: writtenReviews, label: "Written Reviews" },
        { value: upcomingOpenSlots, label: "Open Slots (14 days)" },
        { value: `${yearsOfExperience}+`, label: "Years of Experience" }
    ];

    profileStats.innerHTML = `
        <div class="profile-block">
            <h2>Quick Stats</h2>

            <div class="stats-grid">
                ${stats
                    .map(
                        (stat) => `
                            <div class="stat-card">
                                <div class="stat-value">
                                    ${escapeHTML(stat.value)}
                                </div>

                                <div class="stat-label">
                                    ${escapeHTML(stat.label)}
                                </div>
                            </div>
                        `
                    )
                    .join("")}
            </div>
        </div>
    `;
};

const renderExperience = (experiance) => {
    allExperience = experiance;

    if (!experiance.length) {
        profileExperience.innerHTML = `
            <div class="profile-block">
                <h2> Experience &amp; Hospital Work</h2>

                <div class="empty-state">
                    <h2>No experience added yet</h2>
                    <p>Add your hospital history to build patient trust.</p>
                </div>
            </div>
        `;

        return;
    }

    const limit =
        COLLAPSE_LIMITS.experience;

    const visibleItems =
        isExperienceExpanded
            ? experiance
            : experiance.slice(0, limit);

    const hiddenCount =
        experiance.length - visibleItems.length;

    profileExperience.innerHTML = `
        <div class="profile-block">
            <h2> Experience &amp; Hospital Work</h2>

            <div class="timeline">
                ${visibleItems
                    .map(
                        (item) => `
                            <div class="timeline-item">
                                <div class="facility-name">
                                    ${escapeHTML(item.facilityName)}
                                </div>

                                <div class="facility-dates">
                                    ${escapeHTML(formatDate(item.startDate))} -
                                    ${escapeHTML(
                                        item.endDate
                                            ? formatDate(item.endDate)
                                            : "Present"
                                    )}
                                </div>

                                ${
                                    item.designation
                                        ? `
                                            <div class="facility-role">
                                                ${escapeHTML(item.designation)}
                                            </div>
                                        `
                                        : ""
                                }
                            </div>
                        `
                    )
                    .join("")}
            </div>

            ${
                experiance.length > limit
                    ? `
                        <div class="show-toggle-row">
                            <button
                                type="button"
                                class="show-toggle"
                                data-toggle="experience"
                            >
                                ${
                                    isExperienceExpanded
                                        ? "Show less"
                                        : `Show ${hiddenCount} more`
                                }
                            </button>
                        </div>
                    `
                    : ""
            }
        </div>
    `;
};

const renderFeedback = (feedback) => {
    allFeedback = feedback;

    if (!feedback.length) {
        profileFeedback.innerHTML = `
            <div class="profile-block">
                <h2> Patient Feedback &amp; Reviews (0)</h2>

                <div class="empty-state">
                    <h2>No reviews yet</h2>
                    <p>Reviews from patients will show up here.</p>
                </div>
            </div>
        `;

        return;
    }

    const limit =
        COLLAPSE_LIMITS.feedback;

    const visibleItems =
        isFeedbackExpanded
            ? feedback
            : feedback.slice(0, limit);

    const hiddenCount =
        feedback.length - visibleItems.length;

    profileFeedback.innerHTML = `
        <div class="profile-block">
            <h2> Patient Feedback &amp; Reviews (${feedback.length})</h2>

            <div class="feedback-grid">
                ${visibleItems
                    .map((item) => {
                        const patientName =
                            item.patID?.name || "Patient";

                        const reviewText =
                            (item.feedback || "").trim() ||
                            "No written review.";

                        return `
                            <div class="feedback-card">
                                <div class="feedback-top">
                                    <span class="patient-name">
                                        ${escapeHTML(patientName)}
                                    </span>

                                    <span class="stars">
                                        ${renderStars(item.rating)}
                                    </span>
                                </div>

                                <p class="review-text">
                                    ${escapeHTML(reviewText)}
                                </p>
                            </div>
                        `;
                    })
                    .join("")}
            </div>

            ${
                feedback.length > limit
                    ? `
                        <div class="show-toggle-row">
                            <button
                                type="button"
                                class="show-toggle"
                                data-toggle="feedback"
                            >
                                ${
                                    isFeedbackExpanded
                                        ? "Show less"
                                        : `Show ${hiddenCount} more`
                                }
                            </button>
                        </div>
                    `
                    : ""
            }
        </div>
    `;
};

const availabilitySlotRow = (
    label,
    capacity,
    booked
) => {
    const remaining =
        Math.max(0, (capacity || 0) - (booked || 0));

    const isFull =
        (capacity || 0) > 0 && remaining === 0;

    return `
        <div class="slot-row">
            <span class="slot-name">${label}</span>

            <span class="slot-count${isFull ? " is-full" : ""}">
                ${
                    (capacity || 0) === 0
                        ? "Holiday"
                        : `${remaining} / ${capacity} available`
                }
            </span>
        </div>
    `;
};

const renderAvailability = (availability) => {
    if (!availability.length) {
        profileAvailability.innerHTML = `
            <div class="profile-block">
                <h2> Available Booking Slots</h2>

                <div class="empty-state">
                    <h2>No availability set for the next 14 days</h2>
                    <p>Set your availability so patients can book you.</p>
                </div>
            </div>
        `;

        return;
    }

    profileAvailability.innerHTML = `
        <div class="profile-block">
            <h2> Available Booking Slots</h2>

            <p class="about-line" style="margin-bottom:1rem;">
                Read-only view of your next 14 days. Booking is disabled
                here — this is how patients see your open slots.
            </p>

            <div class="availability-grid">
                ${availability
                    .map((day) => {
                        const isHoliday =
                            !(day.morningCapacity || 0) &&
                            !(day.afternoonCapacity || 0) &&
                            !(day.eveningCapacity || 0);

                        return `
                            <div class="day-card${
                                isHoliday ? " is-holiday" : ""
                            }">
                                <div class="day-title">
                                    <span>${escapeHTML(
                                        formatDateShort(day.date)
                                    )}</span>

                                    ${
                                        isHoliday
                                            ? `<span class="holiday-tag">Holiday</span>`
                                            : ""
                                    }
                                </div>

                                ${availabilitySlotRow(
                                    "Morning",
                                    day.morningCapacity,
                                    day.morningBookings
                                )}
                                ${availabilitySlotRow(
                                    "Afternoon",
                                    day.afternoonCapacity,
                                    day.afternoonBookings
                                )}
                                ${availabilitySlotRow(
                                    "Evening",
                                    day.eveningCapacity,
                                    day.eveningBooking
                                )}
                            </div>
                        `;
                    })
                    .join("")}
            </div>
        </div>
    `;
};

/* =========================================================
   LOAD DOCTOR PROFILE
========================================================= */

const loadDoctorProfile = async () => {
    const refreshButton =
        $("#refreshProfile");

    const doctorId =
        getDoctorId();

    if (!doctorId) {
        setMessage(
            profileMessage,
            "No doctor ID found. Please sign in again.",
            "error"
        );

        return;
    }

    refreshButton.disabled = true;
    refreshButton.textContent =
        "Loading...";

    setMessage(
        profileMessage,
        "Loading your profile..."
    );

    isExperienceExpanded = false;
    isFeedbackExpanded = false;

    try {
        const response = await apiFetch(
            ENDPOINTS.profile(doctorId),
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const data =
            await readJSON(response);

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to load your profile."
            );
        }

        const doctor =
            data.data?.doctor || {};

        const experiance =
            data.data?.experiance || [];

        const availability =
            data.data?.availability || [];

        const feedback =
            data.data?.feedback || [];

        const ratedFeedback =
            feedback.filter(
                (item) => Number(item.rating) > 0
            );

        const avgRating =
            ratedFeedback.length
                ? ratedFeedback.reduce(
                      (total, item) =>
                          total + Number(item.rating),
                      0
                  ) / ratedFeedback.length
                : 0;

        renderAbout(
            doctor,
            avgRating,
            feedback.length
        );

        renderStats(
            doctor,
            experiance,
            availability,
            feedback,
            avgRating
        );

        renderExperience(experiance);
        renderFeedback(feedback);
        renderAvailability(availability);

        setMessage(
            profileMessage,
            "Profile loaded.",
            "success"
        );
    } catch (error) {
        setMessage(
            profileMessage,
            error.message,
            "error"
        );
    } finally {
        refreshButton.disabled = false;
        refreshButton.textContent =
            "Refresh";
    }
};

$("#refreshProfile").addEventListener(
    "click",
    loadDoctorProfile
);

profileExperience.addEventListener(
    "click",
    (event) => {
        const button =
            event.target.closest(
                '[data-toggle="experience"]'
            );

        if (!button) {
            return;
        }

        isExperienceExpanded =
            !isExperienceExpanded;

        renderExperience(allExperience);
    }
);

profileFeedback.addEventListener(
    "click",
    (event) => {
        const button =
            event.target.closest(
                '[data-toggle="feedback"]'
            );

        if (!button) {
            return;
        }

        isFeedbackExpanded =
            !isFeedbackExpanded;

        renderFeedback(allFeedback);
    }
);

/* =========================================================
   INITIAL PAGE SETUP
========================================================= */
$("#date").min = getTodayDate(); 

openTab("profile");

/* =========================================================
   OPERATIONAL DETAILS MODAL
========================================================= */

const btnUpdateOperational = document.getElementById("btnUpdateOperational");
const operationalModal = document.getElementById("operationalModal");
const closeOperationalModal = document.getElementById("closeOperationalModal");
const operationalForm = document.getElementById("operationalForm");
const morningCapacityInput = document.getElementById("morningCapacityInput");
const afternoonCapacityInput = document.getElementById("afternoonCapacityInput");
const eveningCapacityInput = document.getElementById("eveningCapacityInput");
const operationalDateInput = document.getElementById("operationalDateInput");

if (btnUpdateOperational) {
    btnUpdateOperational.addEventListener("click", async () => {
        try {
            const originalText = btnUpdateOperational.textContent;
            btnUpdateOperational.textContent = "Loading...";
            btnUpdateOperational.disabled = true;

            const response = await apiFetch("/api/doctor/get-operationalDetails", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            
            const result = await readJSON(response);
            if (response.ok && result.data) {
                morningCapacityInput.value = result.data.morningCapacity || 0;
                afternoonCapacityInput.value = result.data.afternoonCapacity || 0;
                eveningCapacityInput.value = result.data.eveningCapacity || 0;
                if (operationalDateInput) operationalDateInput.value = "";
                operationalModal.style.display = "flex";
            } else {
                alert(result.message || "Unable to fetch operational details");
            }

            btnUpdateOperational.textContent = originalText;
            btnUpdateOperational.disabled = false;
        } catch (error) {
            console.error(error);
            alert("Error fetching operational details.");
            btnUpdateOperational.textContent = "Update Operational Details";
            btnUpdateOperational.disabled = false;
        }
    });
}

if (closeOperationalModal) {
    closeOperationalModal.addEventListener("click", () => {
        operationalModal.style.display = "none";
    });
}

if (operationalForm) {
    operationalForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const morningCapacity = parseInt(morningCapacityInput.value) || 0;
        const afternoonCapacity = parseInt(afternoonCapacityInput.value) || 0;
        const eveningCapacity = parseInt(eveningCapacityInput.value) || 0;
        const date = operationalDateInput.value;

        if (!date) {
            alert("Date is required.");
            return;
        }

        const submitBtn = document.getElementById("saveOperationalBtn");
        const originalText = submitBtn ? submitBtn.textContent : "Save";
        if (submitBtn) {
            submitBtn.textContent = "Saving...";
            submitBtn.disabled = true;
        }

        try {
            const response = await apiFetch("/api/booking/update-capacity", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    date,
                    morningCapacity,
                    afternoonCapacity,
                    eveningCapacity
                })
            });
            
            const result = await readJSON(response);
            if (response.ok) {
                alert("Capacity updated. Overflows waitlisted, free space assigned.");
                operationalModal.style.display = "none";
                if (typeof loadDoctorProfile === "function") {
                    loadDoctorProfile();
                }
            } else {
                alert(result.message || "Failed to update details.");
            }
        } catch (error) {
            console.error(error);
            alert("Error updating operational details.");
        } finally {
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    });
}
