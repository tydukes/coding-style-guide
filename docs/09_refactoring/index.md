---
title: "Refactoring Examples"
description: "Real-world code refactoring examples with before/after comparisons and explanations"
author: "Tyler Dukes"
tags: [refactoring, code-improvement, best-practices, examples]
category: "Refactoring"
status: "active"
search_keywords: [refactoring, code improvement, restructuring, maintainability, clean code, overview]
---

This directory contains real-world refactoring examples demonstrating how to improve code quality,
maintainability, and adherence to the style guide principles. Each example shows before/after code
with detailed explanations of the refactoring patterns applied.

## What is Refactoring?

**Refactoring** is the process of restructuring existing code without changing its external behavior.
The goal is to improve:

- **Readability**: Make code easier to understand
- **Maintainability**: Reduce technical debt and complexity
- **Performance**: Optimize execution efficiency
- **Testability**: Make code easier to test
- **Reusability**: Extract common patterns
- **Security**: Remove vulnerabilities

## Refactoring vs. Rewriting

| **Refactoring** | **Rewriting** |
|----------------|---------------|
| Incremental changes | Complete replacement |
| Preserves functionality | May change functionality |
| Lower risk | Higher risk |
| Continuous improvement | One-time effort |
| Maintain tests | Rebuild tests |

## When to Refactor

### Good Times to Refactor

✅ **During feature development** - Boy Scout Rule (leave code better than you found it)
✅ **Before adding new features** - Clean up the area you'll be working in
✅ **During code review** - Address technical debt discovered
✅ **When fixing bugs** - Improve code structure to prevent similar bugs
✅ **Regular maintenance** - Scheduled refactoring sessions

### Avoid Refactoring When

❌ **Under tight deadlines** - Unless refactoring makes the deadline easier to meet
❌ **Broken code** - Fix functionality first, then refactor
❌ **No tests** - Add tests before refactoring
❌ **Unclear requirements** - Clarify expectations first

## Common Refactoring Patterns

### Code Organization

- **Extract Function**: Break large functions into smaller, focused ones
- **Extract Class**: Move related functionality into a dedicated class
- **Inline Function**: Remove unnecessary abstraction layers
- **Move Method**: Relocate methods to more appropriate classes

### Code Clarity

- **Rename**: Use descriptive, meaningful names
- **Replace Magic Numbers**: Use named constants
- **Simplify Conditionals**: Reduce complexity of if/else logic
- **Remove Dead Code**: Delete unused code

### Code Structure

- **Replace Conditional with Polymorphism**: Use inheritance instead of type checking
- **Introduce Parameter Object**: Group related parameters
- **Preserve Whole Object**: Pass objects instead of individual fields
- **Replace Temp with Query**: Replace temporary variables with method calls

### Code Quality

- **Decompose Conditional**: Break complex conditionals into well-named functions
- **Consolidate Duplicate Code**: Apply DRY principle
- **Simplify Method Chains**: Reduce coupling and improve readability
- **Replace Nested Conditional with Guard Clauses**: Early returns for error cases

## Refactoring by Language

This directory includes language-specific refactoring examples:

### Python Refactoring

- [Extract function from long method](python_refactoring.md#extract-function)
- [Replace magic numbers with constants](python_refactoring.md#magic-numbers)
- [Simplify complex conditionals](python_refactoring.md#conditionals)
- [Use comprehensions effectively](python_refactoring.md#comprehensions)
- [Apply type hints](python_refactoring.md#type-hints)

### TypeScript Refactoring

- [Extract components from monolithic files](typescript_refactoring.md#extract-components)
- [Replace any with proper types](typescript_refactoring.md#replace-any)
- [Simplify async/await chains](typescript_refactoring.md#async-await)
- [Use modern ES6+ features](typescript_refactoring.md#es6-features)
- [Apply functional programming patterns](typescript_refactoring.md#functional)

### Terraform Refactoring

- [Extract reusable modules](terraform_refactoring.md#extract-modules)
- [Simplify variable structures](terraform_refactoring.md#variables)
- [Use for_each instead of count](terraform_refactoring.md#for-each)
- [Apply locals for DRY](terraform_refactoring.md#locals)
- [Improve resource naming](terraform_refactoring.md#naming)

### Ansible Refactoring

- [Extract roles from playbooks](ansible_refactoring.md#extract-roles)
- [Use blocks for error handling](ansible_refactoring.md#blocks)
- [Apply handlers effectively](ansible_refactoring.md#handlers)
- [Simplify conditionals](ansible_refactoring.md#conditionals)
- [Use collections](ansible_refactoring.md#collections)

### Bash Refactoring

- [Extract functions from scripts](bash_refactoring.md#extract-functions)
- [Add error handling](bash_refactoring.md#error-handling)
- [Use arrays instead of strings](bash_refactoring.md#arrays)
- [Apply POSIX compliance](bash_refactoring.md#posix)
- [Improve variable quoting](bash_refactoring.md#quoting)

## Refactoring Workflow

### 1. Ensure Tests Exist

```bash
## Run existing tests before refactoring
pytest tests/
npm test
terraform test
```

**If no tests exist**: Write tests first to ensure refactoring doesn't break functionality.

### 2. Make Small, Incremental Changes

- One refactoring at a time
- Commit after each successful refactoring
- Run tests after each change

### 3. Use Automated Tools

- **Python**: `black`, `isort`, `pylint`, `mypy`
- **TypeScript**: `prettier`, `eslint`, `tsc --strict`
- **Terraform**: `terraform fmt`, `tflint`, `terrascan`
- **Ansible**: `ansible-lint`, `yamllint`
- **Bash**: `shellcheck`, `shfmt`

### 4. Code Review

- Peer review refactored code
- Ensure changes are understood
- Verify tests pass in CI/CD

### 5. Document Rationale

```git
## Good commit message
refactor: extract user validation into separate function

Moved user input validation from main() into validate_user()
to improve testability and reusability. Reduces main() function
complexity from 150 to 80 lines.

Closes #123
```

## Measuring Refactoring Success

### Code Metrics

- **Cyclomatic Complexity**: Lower is better (aim for < 10 per function)
- **Lines per Function**: Smaller functions (aim for < 50 lines)
- **Code Duplication**: Reduce duplicate code (aim for < 5%)
- **Test Coverage**: Maintain or improve (aim for > 80%)

### Tools for Measurement

- **Python**: `radon`, `pylint`, `coverage`
- **TypeScript**: `complexity-report`, `istanbul`, `sonarqube`
- **Terraform**: `terraform validate`, `tflint`
- **General**: `sonarqube`, `code-climate`

## Best Practices

1. **Test First**: Always have tests before refactoring
2. **Small Steps**: Make incremental changes
3. **Commit Often**: Checkpoint after each successful refactoring
4. **Code Review**: Get feedback on refactoring decisions
5. **Document Why**: Explain the reasoning behind changes
6. **Measure Impact**: Track improvements with metrics
7. **Avoid Scope Creep**: Stick to one refactoring pattern at a time
8. **Preserve Behavior**: Don't mix refactoring with feature changes

## Anti-Patterns to Avoid

❌ **Big Bang Refactoring**: Rewriting large portions of code at once
❌ **Refactoring Without Tests**: Changing code without safety net
❌ **Premature Optimization**: Refactoring before understanding performance needs
❌ **Over-Engineering**: Adding unnecessary abstraction
❌ **Mixing Concerns**: Refactoring and adding features simultaneously
❌ **Ignoring Style Guide**: Refactoring without following project standards

## Resources

### Books

- [Refactoring: Improving the Design of Existing Code][refactoring-fowler] by Martin Fowler
- [Clean Code][clean-code] by Robert C. Martin
- [Working Effectively with Legacy Code][legacy-code] by Michael Feathers

[refactoring-fowler]: https://martinfowler.com/books/refactoring.html
[clean-code]: https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882
[legacy-code]: https://www.amazon.com/Working-Effectively-Legacy-Michael-Feathers/dp/0131177052

### Online Resources

- [Refactoring Guru](https://refactoring.guru/) - Refactoring patterns and examples
- [Source Making](https://sourcemaking.com/refactoring) - Design patterns and refactorings
- [Code Smells](https://refactoring.guru/refactoring/smells) - Identifying code that needs refactoring

### Related Documentation

- [Anti-Patterns](../08_anti_patterns/index.md) - Common mistakes to avoid
- [Language Guides](../02_language_guides/) - Language-specific best practices
- [Examples](../05_examples/) - Complete project examples
- [Testing Strategies](../05_ci_cd/testing_strategies.md) - Testing approaches for refactored code

---

**Maintainer**: Tyler Dukes
