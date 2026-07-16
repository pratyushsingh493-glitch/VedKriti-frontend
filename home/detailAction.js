// import { domain } from "../config.js";

// const showError = (message) => {
//     console.error(message);
//     alert(message);
// };

// try {
//     const response = await fetch(
//         `${domain}/api/fetch-doctor?id=${localStorage.getItem("docID")}`,
//         {
//             method: "GET",
//             headers: {Authorization: `Bearer ${localStorage.getItem("token")}`}
//         }
//     );

//     const data = await response.json();

//     if (response.ok) {
//         document.getElementById("tab4").click();
//     } else {
//         showError(data.message || "Unable to Fetch Doctor Details");
//     }
// } catch (error) {
//     showError(error.message);
// }