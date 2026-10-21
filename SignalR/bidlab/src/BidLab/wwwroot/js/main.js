const template = document.getElementById("item-page");
for (const win of document.querySelectorAll(".win")) {
  win.append(template.content.cloneNode(true));
  win.querySelector(".who").textContent = win.dataset.user === "an" ? "An" : "Bình";
}
