/**
 * Bookmarks - LocalStorage-based page bookmarking system
 *
 * Provides a star icon on each page to bookmark it and a dropdown in the
 * header to view/manage saved bookmarks plus recently viewed pages.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "dsg-bookmarks";
  var RECENT_KEY = "dsg-recent-pages";
  var MAX_RECENT = 10;

  // --- Storage helpers ---

  function getBookmarks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveBookmarks(bookmarks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  }

  function isBookmarked(url) {
    return getBookmarks().some(function (b) {
      return b.url === url;
    });
  }

  function addBookmark(url, title) {
    var bookmarks = getBookmarks();
    if (
      bookmarks.some(function (b) {
        return b.url === url;
      })
    ) {
      return;
    }
    bookmarks.unshift({ url: url, title: title, timestamp: Date.now() });
    saveBookmarks(bookmarks);
  }

  function removeBookmark(url) {
    var bookmarks = getBookmarks().filter(function (b) {
      return b.url !== url;
    });
    saveBookmarks(bookmarks);
  }

  function getRecentPages() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function trackPageView(url, title) {
    var recent = getRecentPages().filter(function (r) {
      return r.url !== url;
    });
    recent.unshift({ url: url, title: title, timestamp: Date.now() });
    if (recent.length > MAX_RECENT) {
      recent = recent.slice(0, MAX_RECENT);
    }
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  }

  // --- URL helpers ---

  function getCurrentUrl() {
    return window.location.pathname;
  }

  function getPageTitle() {
    var h1 = document.querySelector("article h1");
    if (h1) return h1.textContent.replace(/¶$/, "").trim();
    return document.title.split(" - ")[0].trim();
  }

  // --- SVG icons ---

  var STAR_OUTLINE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">' +
    '<path fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'd="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>' +
    "</svg>";

  var STAR_FILLED =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">' +
    '<path fill="currentColor" ' +
    'd="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>' +
    "</svg>";

  var BOOKMARK_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">' +
    '<path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>' +
    "</svg>";

  // --- Bookmark star on page ---

  function createStarButton() {
    var url = getCurrentUrl();
    var btn = document.createElement("button");
    btn.className = "bookmark-star";
    btn.setAttribute("aria-label", "Bookmark this page");
    btn.setAttribute("title", "Bookmark this page");
    btn.innerHTML = isBookmarked(url) ? STAR_FILLED : STAR_OUTLINE;

    if (isBookmarked(url)) {
      btn.classList.add("bookmark-star--active");
    }

    btn.addEventListener("click", function () {
      var pageUrl = getCurrentUrl();
      var title = getPageTitle();
      if (isBookmarked(pageUrl)) {
        removeBookmark(pageUrl);
        btn.innerHTML = STAR_OUTLINE;
        btn.classList.remove("bookmark-star--active");
        btn.setAttribute("title", "Bookmark this page");
      } else {
        addBookmark(pageUrl, title);
        btn.innerHTML = STAR_FILLED;
        btn.classList.add("bookmark-star--active");
        btn.setAttribute("title", "Remove bookmark");
      }
      updateDropdownContent();
    });

    return btn;
  }

  function insertStarButton() {
    // Remove any existing star
    var existing = document.querySelector(".bookmark-star");
    if (existing) existing.remove();

    var h1 = document.querySelector("article h1");
    if (h1) {
      var star = createStarButton();
      h1.appendChild(star);
    }
  }

  // --- Header dropdown ---

  var dropdownEl = null;

  function createHeaderButton() {
    // Don't duplicate
    if (document.querySelector(".bookmarks-toggle")) return;

    var header = document.querySelector(".md-header__inner");
    if (!header) return;

    var container = document.createElement("div");
    container.className = "bookmarks-container";

    var toggle = document.createElement("button");
    toggle.className = "bookmarks-toggle md-icon";
    toggle.setAttribute("aria-label", "Bookmarks");
    toggle.setAttribute("title", "Bookmarks");
    toggle.innerHTML = BOOKMARK_ICON;

    var count = getBookmarks().length;
    if (count > 0) {
      var badge = document.createElement("span");
      badge.className = "bookmarks-badge";
      badge.textContent = count;
      toggle.appendChild(badge);
    }

    dropdownEl = document.createElement("div");
    dropdownEl.className = "bookmarks-dropdown";
    dropdownEl.setAttribute("role", "menu");
    updateDropdownContent();

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdownEl.classList.toggle("bookmarks-dropdown--open");
      updateDropdownContent();
    });

    // Close on outside click
    document.addEventListener("click", function (e) {
      if (!container.contains(e.target)) {
        dropdownEl.classList.remove("bookmarks-dropdown--open");
      }
    });

    container.appendChild(toggle);
    container.appendChild(dropdownEl);

    // Insert before the search or repo icon
    var searchBtn =
      header.querySelector(".md-search") ||
      header.querySelector(".md-header__button");
    if (searchBtn) {
      header.insertBefore(container, searchBtn);
    } else {
      header.appendChild(container);
    }
  }

  function updateDropdownContent() {
    if (!dropdownEl) return;

    var bookmarks = getBookmarks();
    var recent = getRecentPages();
    var html = "";

    // Bookmarks section
    html += '<div class="bookmarks-dropdown__section">';
    html +=
      '<h3 class="bookmarks-dropdown__heading">Bookmarks</h3>';
    if (bookmarks.length === 0) {
      html +=
        '<p class="bookmarks-dropdown__empty">No bookmarks yet. Click the star on any page to save it.</p>';
    } else {
      html += '<ul class="bookmarks-dropdown__list">';
      for (var i = 0; i < bookmarks.length; i++) {
        html += '<li class="bookmarks-dropdown__item">';
        html +=
          '<a href="' +
          escapeHtml(bookmarks[i].url) +
          '" class="bookmarks-dropdown__link">' +
          escapeHtml(bookmarks[i].title) +
          "</a>";
        html +=
          '<button class="bookmarks-dropdown__remove" data-url="' +
          escapeHtml(bookmarks[i].url) +
          '" aria-label="Remove bookmark" title="Remove">&times;</button>';
        html += "</li>";
      }
      html += "</ul>";
    }
    html += "</div>";

    // Recently viewed section
    html += '<div class="bookmarks-dropdown__section">';
    html +=
      '<h3 class="bookmarks-dropdown__heading">Recently Viewed</h3>';
    if (recent.length === 0) {
      html +=
        '<p class="bookmarks-dropdown__empty">No recent pages.</p>';
    } else {
      html += '<ul class="bookmarks-dropdown__list">';
      var shown = 0;
      for (var j = 0; j < recent.length && shown < 5; j++) {
        // Skip current page
        if (recent[j].url === getCurrentUrl()) continue;
        html += '<li class="bookmarks-dropdown__item">';
        html +=
          '<a href="' +
          escapeHtml(recent[j].url) +
          '" class="bookmarks-dropdown__link">' +
          escapeHtml(recent[j].title) +
          "</a>";
        html += "</li>";
        shown++;
      }
      html += "</ul>";
    }
    html += "</div>";

    dropdownEl.innerHTML = html;

    // Attach remove handlers
    var removeBtns = dropdownEl.querySelectorAll(".bookmarks-dropdown__remove");
    for (var k = 0; k < removeBtns.length; k++) {
      removeBtns[k].addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var url = this.getAttribute("data-url");
        removeBookmark(url);
        updateDropdownContent();
        updateBadge();
        // Update star if on same page
        if (url === getCurrentUrl()) {
          var star = document.querySelector(".bookmark-star");
          if (star) {
            star.innerHTML = STAR_OUTLINE;
            star.classList.remove("bookmark-star--active");
          }
        }
      });
    }
  }

  function updateBadge() {
    var badge = document.querySelector(".bookmarks-badge");
    var count = getBookmarks().length;
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = "";
      } else {
        badge.style.display = "none";
      }
    } else if (count > 0) {
      var toggle = document.querySelector(".bookmarks-toggle");
      if (toggle) {
        var newBadge = document.createElement("span");
        newBadge.className = "bookmarks-badge";
        newBadge.textContent = count;
        toggle.appendChild(newBadge);
      }
    }
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // --- Initialize ---

  function init() {
    var url = getCurrentUrl();
    var title = getPageTitle();
    trackPageView(url, title);
    insertStarButton();
    createHeaderButton();
    updateBadge();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Re-run on MkDocs Material instant navigation
  if (typeof document$ !== "undefined") {
    document$.subscribe(function () {
      init();
    });
  }
})();
