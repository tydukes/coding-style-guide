"""
@module generate_page_index
@description MkDocs hook to generate page-index.json for related pages
@version 1.0.0
@author Tyler Dukes
@last_updated 2026-02-15
@status stable
"""

import json
import logging
import os

log = logging.getLogger("mkdocs.hooks.generate_page_index")

_pages = []


def on_page_context(context, page, config, nav):
    """Collect page metadata during build."""
    meta = page.meta or {}
    tags = meta.get("tags", [])
    category = meta.get("category", "")
    title = meta.get("title", page.title or "")

    if tags or category:
        _pages.append(
            {
                "url": page.url,
                "title": title,
                "tags": tags if isinstance(tags, list) else [tags],
                "category": category,
            }
        )
    return context


def on_post_build(config):
    """Write collected page metadata to page-index.json."""
    site_dir = config["site_dir"]
    output_path = os.path.join(site_dir, "page-index.json")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(_pages, f, ensure_ascii=False)

    log.info(f"Generated page-index.json with {len(_pages)} pages")
    _pages.clear()
