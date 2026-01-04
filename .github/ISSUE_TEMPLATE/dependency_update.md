---
name: Dependency Update Notification
about: Report outdated dependencies or version updates needed
title: '[DEPENDENCY] Update [Package/Action/Language] to [Version]'
labels: ['type:maintenance', 'scope:dependencies', 'priority:medium']
assignees: ''
---

## Dependency Information

**Dependency Type**: (Python package, GitHub Action, Docker image, Language version, etc.)
**Current Version**:
**Latest Version**:
**Package/Component Name**:

## Update Justification

Why should this dependency be updated?

- [ ] Security vulnerability (CVE ID if applicable):
- [ ] Bug fixes in newer version
- [ ] New features that would benefit the project
- [ ] EOL/deprecation of current version
- [ ] Performance improvements
- [ ] Dependency of another package requiring update
- [ ] Other (please explain):

## Breaking Changes

Are there any breaking changes in the new version?

- [ ] Yes (please describe below)
- [ ] No
- [ ] Unknown - needs investigation

**Details**:

## Migration Requirements

What needs to be updated to accommodate this dependency update?

- [ ] Code changes required
- [ ] Configuration file updates
- [ ] Documentation updates
- [ ] CI/CD workflow modifications
- [ ] No changes required - drop-in replacement
- [ ] Other (please specify):

## Testing Impact

How should this update be tested?

- [ ] Run existing test suite
- [ ] Add new tests for new features
- [ ] Manual testing required
- [ ] Integration testing with dependent packages
- [ ] No testing required (documentation/config only)

## EOL Information

Is the current version approaching or past End of Life?

**EOL Date** (if known):
**Support Status**:

## Related Dependencies

List any related dependencies that might also need updating:

1.
2.
3.

## Automation Check

- [ ] This was detected by automated tooling (Dependabot, language tracker, etc.)
- [ ] This was manually discovered
- [ ] This was reported by a community member

## Priority Assessment

How urgent is this update?

- [ ] **Critical** - Active security vulnerability or EOL
- [ ] **High** - Important bug fixes or approaching EOL
- [ ] **Medium** - Feature enhancements or routine updates
- [ ] **Low** - Minor improvements or optional updates

## Additional Context

Add any other context about the dependency update here:

- Release notes link:
- Migration guide link:
- Related issues or PRs:

## Validation Checklist

Before merging the update:

- [ ] All CI checks pass
- [ ] Documentation updated (if needed)
- [ ] CHANGELOG.md updated
- [ ] Version bumped in `pyproject.toml` (if applicable)
- [ ] Tested locally with `mkdocs serve`
- [ ] No breaking changes introduced (or documented if unavoidable)
