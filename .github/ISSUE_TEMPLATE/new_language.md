---
name: New Language Request
about: Request a new language guide or propose adding a language to the style guide
title: '[LANGUAGE] Add [Language Name] Style Guide'
labels: ['type:feature', 'scope:language-guide', 'priority:medium']
assignees: ''
---

## Language Information

**Language Name**:
**Primary Use Case**: (e.g., Infrastructure as Code, Backend Development, Scripting)
**Official Website**:
**Current Stable Version**:

## Justification

Why should this language be added to the style guide?

- [ ] Widely used in DevOps/Infrastructure workflows
- [ ] Part of modern software engineering stack
- [ ] Requested by multiple community members
- [ ] Complements existing language coverage
- [ ] Other (please explain):

## Community Impact

How many projects or teams would benefit from this guide?

## Implementation Checklist

This checklist tracks all integration points for adding a new language guide:

### Documentation

- [ ] Create `docs/02_language_guides/{language}.md` following `docs/04_templates/language_guide_template.md`
- [ ] Add YAML frontmatter with all required fields (title, description, author, tags, category, status)
- [ ] Ensure **3:1 code-to-text ratio** (verified with `uv run python scripts/analyze_code_ratio.py`)
- [ ] Include proper code block language tags (no bare ``` blocks)
- [ ] Add entry to `mkdocs.yml` navigation under "Language Guides"
- [ ] Update `README.md` with new language in supported languages list
- [ ] Update `CLAUDE.md` with new language in covered languages section

### Validation & Tooling

- [ ] Add language support to `scripts/validate_metadata.py` for @module tag validation
- [ ] Add appropriate linter/formatter to `.pre-commit-config.yaml`
- [ ] Add language-specific validation rules (if applicable)
- [ ] Test metadata validation: `uv run python scripts/validate_metadata.py docs/02_language_guides/{language}.md`

### IDE Settings

- [ ] Add VS Code settings to `.vscode/settings.json`:
  - Formatter configuration
  - Linter integration
  - Language-specific rulers/tab sizes
- [ ] Add IntelliJ/PyCharm settings to `.idea/codeStyles/Project.xml`
- [ ] Add inspection profiles to `.idea/inspectionProfiles/Project.xml`
- [ ] Update `.editorconfig` with language-specific indentation rules
- [ ] Update `docs/04_templates/ide_settings_template.md` with new language examples

### CI/CD & Automation

- [ ] Add language validation to `.github/workflows/ci.yml` (if applicable)
- [ ] Add to Docker container validation in `Dockerfile` and `docker-entrypoint.sh`
- [ ] Update `docker-compose.yml` service definitions (if needed)
- [ ] Add language-specific spell check terms to `.github/cspell.json`

### Labels & Categorization

- [ ] Create language-specific label:
      `gh label create "{language}" --description "{Language} language-specific issues" --color "{color}"`
- [ ] Ensure proper labels are applied to this issue

### Version Tracking

- [ ] Document supported versions with EOL dates in guide
- [ ] Add language to version tracking system (when implemented)
- [ ] Specify minimum vs recommended version

### Examples & Templates

- [ ] Add example implementations to `docs/05_examples/`
- [ ] Create CONTRACT.md example (if applicable for IaC)
- [ ] Add anti-patterns section to `docs/08_anti_patterns/`
- [ ] Add refactoring examples to `docs/09_refactoring/`

### Testing

- [ ] Verify local build: `mkdocs serve`
- [ ] Test strict build: `mkdocs build --strict`
- [ ] Run full validation: `docker-compose run --rm validator`
- [ ] Check code ratio: `uv run python scripts/analyze_code_ratio.py`

## Reference Materials

Please provide links to:

- Official style guide (if one exists):
- Popular community style guides:
- Linter/formatter tools:
- Language version documentation:

## Related Issues

Are there existing issues or PRs related to this language?

## Willingness to Contribute

- [ ] I am willing to write the initial language guide
- [ ] I can help with IDE settings configuration
- [ ] I can help with CI/CD integration
- [ ] I can provide code examples
- [ ] I need someone else to implement this

## Additional Context

Add any other context, screenshots, or examples about the language request here.
