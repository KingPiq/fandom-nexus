
/* Disable right-click context menu */
document.addEventListener("contextmenu", function (event) {
    event.preventDefault();
});

/* Disable text selection */
document.addEventListener("selectstart", function (event) {
    event.preventDefault();
});
