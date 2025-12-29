document.addEventListener("click", function (e) {
  if (e.target.id === "feedback-tab") {
    document.getElementById("feedback-panel").classList.toggle("open");
  }
});