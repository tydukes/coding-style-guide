---
title: "Documentation Heading Structure Standards"
description: "Standardized heading hierarchy and organization for all documentation files"
author: "Tyler Dukes"
tags: [standards, documentation, headings, structure, consistency]
category: "Standards"
status: "active"
search_keywords: [headings, document structure, markdown, formatting, hierarchy, h1, h2, h3]
---

## Purpose

This document defines the standardized heading structure for all documentation in the Dukes Engineering Style Guide.
Consistent heading hierarchies improve navigation, readability, and maintainability.

## General Heading Principles

### Hierarchy Rules

- **Level 1 (`#`)**: Reserved for document title (automatically generated from frontmatter `title`)
- **Level 2 (`##`)**: Major sections
- **Level 3 (`###`)**: Subsections within major sections
- **Level 4 (`####`)**: Specific topics within subsections (use sparingly)
- **Level 5 (`#####`)**: Avoid unless absolutely necessary
- **Level 6 (`######`)**: Never use

### Heading Style

- **Capitalization**: Title Case for Level 2, Sentence case for Level 3+
- **Length**: Keep headings concise (max 60 characters)
- **Keywords**: Include searchable keywords
- **Consistency**: Use consistent terminology across similar sections

## Document Type Templates

### Language Guide Template

Standard structure for all files in `docs/02_language_guides/`:

```markdown
## Language Overview
### Key Characteristics
### This Style Guide Covers / Primary Use Cases

## Quick Reference

## Naming Conventions
### [Specific elements like Variables, Functions, Classes, etc.]

## Code Formatting / Configuration
### [Language-specific formatting rules]

## Documentation Standards
### [Docstring/comment requirements]

## Error Handling
### [Exception patterns]

## Testing Requirements / Testing Standards
### [Testing patterns and requirements]

## Security Best Practices
### [Security requirements]

## Recommended Tools / Tool Configuration
### [Linters, formatters, etc.]

## Complete Example / Examples
### [Full working examples]

## Anti-Patterns (optional)
### [Common mistakes]

## See Also
### Related Language Guides
### Development Tools & Practices
### Testing & Quality
### CI/CD Integration
### Templates & Examples
### Core Documentation

## References
### [External links and resources]
```

### CI/CD Guide Template

Standard structure for files in `docs/05_ci_cd/`:

```markdown
## Overview
### What This Guide Covers
### Related Documentation
### [Optional: Workflow diagram]

## Quick Start / Getting Started
### Prerequisites
### Basic Setup

## Configuration
### [Specific configuration sections]

## Complete Examples / Pipelines
### [Full working examples]

## Advanced Patterns
### [Complex use cases]

## Security Best Practices
### [Security requirements]

## Performance Optimization (optional)
### [Performance tips]

## Troubleshooting
### Common Issues
### Debugging Tips

## See Also
### [Cross-references]

## References
### [External links]
```

### Migration Guide Template

Standard structure for files in `docs/10_migration_guides/`:

```markdown
## Overview
### What This Guide Covers
### Who Should Use This Guide

## Quick Compatibility Summary
### [Mermaid diagram]

## What Stays the Same
### [Tables showing compatible features]

## What Changes: [Old] → [New]
### [Numbered differences with descriptions]

## Tool Configuration Migration
### [From old tools to new tools]

## Migration Checklist
### Phase 1: [Phase name]
### Phase 2: [Phase name]
### [etc.]

## Common Migration Pitfalls
### [Numbered pitfalls with solutions]

## Gradual Adoption Strategy
### [Week-by-week or phase-by-phase plan]

## Success Metrics
### [Table of metrics]

## Side-by-Side Comparison (optional)
### [Comparison table]

## Support and Resources
### Documentation References
### Tool Documentation
### External References

## Conclusion
```

### Overview/Principles Document Template

Standard structure for files in `docs/01_overview/`:

```markdown
## Overview / Introduction
### [Context and purpose]

## Core Principles / Key Concepts
### [Principle 1]
### [Principle 2]
### [etc.]

## [Main Content Sections]
### [Subsections as needed]

## Implementation / Application
### [How to apply the principles]

## Examples (optional)
### [Practical examples]

## See Also / Related Topics
### [Cross-references]

## References (optional)
### [External links]
```

### Template Document Template

Standard structure for files in `docs/04_templates/`:

```markdown
## Overview
### Purpose
### When to Use This Template

## Template Structure
### [Sections of the template]

## Usage Instructions
### Step-by-Step Guide

## Customization
### [How to adapt the template]

## Complete Template
### [Full template code]

## Examples
### [Example usage]

## See Also
### [Related templates]

## References (optional)
### [External resources]
```

### Example Document Template

Standard structure for files in `docs/05_examples/`:

```markdown
## Overview
### Purpose
### What This Example Demonstrates

## Prerequisites
### Required Tools
### Required Knowledge

## Project Structure
### [Directory layout]

## Implementation
### [Step-by-step implementation]

## Testing
### [How to test the example]

## Deployment (if applicable)
### [Deployment instructions]

## See Also
### [Related examples and guides]

## References (optional)
### [External resources]
```

## Heading Naming Conventions

### Preferred Terms

Use these standardized terms for consistency:

| Concept | Preferred Term | Avoid |
|---------|---------------|-------|
| Document purpose | "Overview" | "Introduction", "About" |
| Getting started | "Quick Start" or "Getting Started" | "Setup", "Intro" |
| Configuration | "Configuration" | "Config", "Settings" |
| Code samples | "Examples" | "Samples", "Code", "Demos" |
| Full implementations | "Complete Example" | "Full Example", "Implementation" |
| Common mistakes | "Anti-Patterns" | "Bad Practices", "Mistakes" |
| Common problems | "Common Pitfalls" | "Gotchas", "Issues" |
| Problem solving | "Troubleshooting" | "Debugging", "Problems" |
| Cross-references | "See Also" | "Related", "Links" |
| External links | "References" | "Resources", "Links", "Further Reading" |
| Best practices | "Best Practices" | "Recommendations", "Guidelines" |
| Security | "Security Best Practices" | "Security", "Secure Coding" |
| Performance | "Performance Optimization" | "Optimization", "Performance" |
| Testing | "Testing Requirements" or "Testing Standards" | "Tests", "Testing" |

### Action-Oriented Headings

For procedural sections, use verb phrases:

- ✅ "Installing Dependencies"
- ✅ "Configuring the Pipeline"
- ✅ "Running Tests"
- ❌ "Dependency Installation"
- ❌ "Pipeline Configuration"
- ❌ "Test Execution"

## Standardization Checklist

When standardizing a document:

- [ ] Verify frontmatter is complete and accurate
- [ ] Ensure no Level 1 headings in content (only in frontmatter title)
- [ ] Check all Level 2 headings use Title Case
- [ ] Check all Level 3+ headings use Sentence case
- [ ] Verify heading hierarchy is logical (no skipped levels)
- [ ] Use preferred terminology from naming conventions
- [ ] Include "See Also" section with proper cross-references
- [ ] Include "References" section if external links exist
- [ ] Ensure headings are searchable and keyword-rich
- [ ] Verify heading IDs don't conflict (for anchor links)

## Implementation Notes

### Automated Checking

The following can be automated with linters:

- Heading level hierarchy (no skipped levels)
- Title case for Level 2 headings
- Maximum heading length
- No Level 1 headings in content

### Manual Review Required

These aspects require human judgment:

- Logical grouping of content
- Appropriate section naming
- Cross-reference accuracy
- Consistency with similar documents

## Version History

- **v1.0.0** (2025-12-07): Initial heading structure standards
