const headersPareto = document.querySelectorAll(".accordion-header");

headersPareto.forEach(header => {
  header.addEventListener("click", () => {
    const content = header.nextElementSibling;
    const isOpen = header.classList.contains("active");

    headersPareto.forEach(h => {
      h.classList.remove("active");
      h.nextElementSibling.style.maxHeight = null;
    });


    if (!isOpen) {
      header.classList.add("active");
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
});
