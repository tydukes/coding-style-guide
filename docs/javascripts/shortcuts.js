document.addEventListener("keydown", function (e) {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    const search = document.querySelector(".md-search__input");
    if (search) {
      search.focus();
      search.select();
    }
  }
});
