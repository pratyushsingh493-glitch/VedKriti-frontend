gsap.registerPlugin(ScrollTrigger);

const container = document.querySelector('.container');
const sections = gsap.utils.toArray('.container div');
const text = gsap.utils.toArray('.anim');

let scrollTween = gsap.to(sections, {
  xPercent: -100 * (sections.length - 1),
  ease: "none",
  scrollTrigger: {
    trigger: ".container",
    pin: true,
    scrub: 1,
    end: "+=3000"
  }
});

sections.forEach((section) => {
  let text = section.querySelectorAll(".anim");

  gsap.from(text, {
    y: -130,
    opacity: 0,
    duration: 2,
    ease: "elastic",
    stagger: 0.1,
    scrollTrigger: {
      trigger: section,
      containerAnimation: scrollTween,
      start: "left center"
    }
  });
});

document.getElementById("login").addEventListener("click", () => {
  localStorage.setItem("mode", "signin");
  window.location.href = "auth/auth.html";
});

document.getElementById("create").addEventListener("click", () => {
  localStorage.setItem("mode", "create");
  window.location.href = "auth/auth.html";
});