import { domain } from "./config.js";

let refreshPromise = null;

async function refreshAccessToken() {
    if (!refreshPromise) {
        refreshPromise = fetch(`${domain}/api/auth/refresh`, {
            method: "POST",
            credentials: "include"
        }).finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

export async function apiFetch(endpoint, options = {}) {
    const url = endpoint.startsWith("http://") || endpoint.startsWith("https://")
        ? endpoint
        : `${domain}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    // 1. Make original request
    let response = await fetch(url, {
        ...options,
        credentials: "include"
    });

    // 2. Request successful / other response
    if (response.status !== 401) {
        return response;
    }

    // 3. Access token expired
    console.log("Access token expired. Attempting refresh...");

    const refreshResponse = await refreshAccessToken();

    // 4. Refresh failed
    if (!refreshResponse.ok) {
        console.error("Session expired completely.");
        localStorage.clear();
        window.location.href = "/auth/auth.html";
        return response;
    }

    // 5. Refresh successful
    console.log("Refresh successful. Retrying original request...");

    // 6. Retry original request
    response = await fetch(url, {
        ...options,
        credentials: "include"
    });

    return response;
}
