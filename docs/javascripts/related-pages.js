/**
 * Related Pages - Auto-generated "See Also" suggestions based on tag similarity
 *
 * Fetches page-index.json (generated at build time) and displays related pages
 * at the bottom of each documentation page.
 */
(function () {
  "use strict";

  var MAX_RELATED = 5;
  var MIN_SIMILARITY = 1;

  function getCurrentPageUrl() {
    var path = window.location.pathname;
    var base = document.querySelector('meta[name="base_url"]');
    if (base) {
      path = path.replace(base.getAttribute("content"), "");
    }
    // Normalize: remove leading slash, trailing index.html
    path = path.replace(/^\//, "").replace(/index\.html$/, "");
    // Remove site prefix if present (e.g., /coding-style-guide/)
    var link = document.querySelector('link[rel="canonical"]');
    if (link) {
      try {
        var canonical = new URL(link.getAttribute("href"));
        var siteBase = canonical.pathname.split("/").slice(0, -2).join("/");
        if (siteBase && path.indexOf(siteBase.replace(/^\//, "")) === 0) {
          path = path.replace(siteBase.replace(/^\//, "") + "/", "");
        }
      } catch (e) {
        // ignore
      }
    }
    return path;
  }

  function calculateSimilarity(tagsA, tagsB) {
    var shared = 0;
    for (var i = 0; i < tagsA.length; i++) {
      if (tagsB.indexOf(tagsA[i]) !== -1) {
        shared++;
      }
    }
    return shared;
  }

  function findRelatedPages(currentUrl, pages) {
    var currentPage = null;
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].url === currentUrl) {
        currentPage = pages[i];
        break;
      }
    }
    if (!currentPage || !currentPage.tags || currentPage.tags.length === 0) {
      return [];
    }

    var scored = [];
    for (var j = 0; j < pages.length; j++) {
      var page = pages[j];
      if (page.url === currentUrl) continue;
      if (!page.tags || page.tags.length === 0) continue;

      var tagScore = calculateSimilarity(currentPage.tags, page.tags);
      var categoryBonus = page.category === currentPage.category ? 1 : 0;
      var total = tagScore + categoryBonus;

      if (total >= MIN_SIMILARITY) {
        scored.push({ page: page, score: total });
      }
    }

    scored.sort(function (a, b) {
      return b.score - a.score;
    });

    return scored.slice(0, MAX_RELATED).map(function (item) {
      return item.page;
    });
  }

  function resolvePageHref(pageUrl) {
    // Build relative URL from site root
    var base =
      document.querySelector('base[href]') ||
      document.querySelector('meta[name="base_url"]');
    var prefix = "";
    if (base) {
      prefix = base.getAttribute("href") || base.getAttribute("content") || "";
    }
    if (prefix && prefix.charAt(prefix.length - 1) !== "/") {
      prefix += "/";
    }
    return prefix + pageUrl;
  }

  function renderRelatedPages(related) {
    if (related.length === 0) return;

    var article = document.querySelector("article.md-content__inner");
    if (!article) return;

    var section = document.createElement("div");
    section.className = "related-pages";
    section.setAttribute("role", "complementary");
    section.setAttribute("aria-label", "Related pages");

    var heading = document.createElement("h2");
    heading.className = "related-pages__title";
    heading.textContent = "See Also";

    var list = document.createElement("ul");
    list.className = "related-pages__list";

    for (var i = 0; i < related.length; i++) {
      var page = related[i];
      var li = document.createElement("li");
      li.className = "related-pages__item";

      var link = document.createElement("a");
      link.className = "related-pages__link";
      link.href = resolvePageHref(page.url);
      link.textContent = page.title;

      if (page.category) {
        var badge = document.createElement("span");
        badge.className = "related-pages__badge";
        badge.textContent = page.category;
        li.appendChild(link);
        li.appendChild(badge);
      } else {
        li.appendChild(link);
      }

      list.appendChild(li);
    }

    section.appendChild(heading);
    section.appendChild(list);

    // Insert before footer/last-updated or at end of article
    var footer = article.querySelector(".md-source-file");
    if (footer) {
      article.insertBefore(section, footer);
    } else {
      article.appendChild(section);
    }
  }

  function init() {
    // Determine base URL for fetching page-index.json
    var base =
      document.querySelector('base[href]') ||
      document.querySelector('meta[name="base_url"]');
    var prefix = "";
    if (base) {
      prefix = base.getAttribute("href") || base.getAttribute("content") || "";
    }
    if (prefix && prefix.charAt(prefix.length - 1) !== "/") {
      prefix += "/";
    }

    var indexUrl = prefix + "page-index.json";

    fetch(indexUrl)
      .then(function (response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(function (pages) {
        if (!pages) return;

        var currentUrl = getCurrentPageUrl();
        var related = findRelatedPages(currentUrl, pages);
        renderRelatedPages(related);
      })
      .catch(function () {
        // Silently fail - related pages are non-critical
      });
  }

  // Run after DOM is ready
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
