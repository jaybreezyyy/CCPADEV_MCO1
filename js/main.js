let restoGallery = document.querySelector(".restogallery");
let leftArrow = document.querySelector("#leftArrow");
let rightArrow = document.querySelector("#rightArrow");

restoGallery.addEventListener("wheel", (e) => {
    e.preventDefault();
    restoGallery.scrollLeft += e.deltaY;
    restoGallery.style.scrollBehavior = "auto";
});

rightArrow.addEventListener("click", () => {
    restoGallery.style.scrollBehavior = "smooth";
    restoGallery.scrollLeft += 900;
});

leftArrow.addEventListener("click", () => {
    restoGallery.style.scrollBehavior = "smooth";
    restoGallery.scrollLeft -= 900;
});