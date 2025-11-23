---
title: "[Language Name] Style Guide"
description: "Comprehensive style guide for [Language Name] covering naming, formatting, testing, and best practices"
author: "Tyler Dukes"
date: "YYYY-MM-DD"
tags: [language-name, style-guide, best-practices, standards]
category: "Language Guides"
status: "active"
version: "1.0.0"
---

<!-- This is a template for creating new language-specific style guides. -->
<!-- Replace all [bracketed placeholders] with language-specific content. -->
<!-- Delete this comment block when creating a new guide. -->

## Language Overview

**[Language Name]** is a [compiled/interpreted] [programming/scripting/markup] language primarily used for
[use cases: web development, data analysis, infrastructure automation, etc.].

### Key Characteristics

- **Paradigm**: [Object-oriented, functional, procedural, declarative, multi-paradigm]
- **Typing**: [Static/dynamic, strong/weak]
- **Runtime**: [JVM, Node.js, Python interpreter, compiled binary, etc.]
- **Primary Use Cases**:
  - [Use case 1: e.g., Backend web services]
  - [Use case 2: e.g., Data processing pipelines]
  - [Use case 3: e.g., Infrastructure as Code]

### This Style Guide Covers

- Naming conventions for variables, functions, classes, and files
- Code formatting and structure standards
- Documentation requirements and best practices
- Testing standards and coverage requirements
- Dependency management and import organization
- Security best practices and common vulnerabilities
- Performance optimization guidelines
- Anti-patterns to avoid

## Naming Conventions

### Variables

**Convention**: [snake_case, camelCase, PascalCase]

```[language-extension]
// Good
[example_good_variable_name]

// Bad
[example_bad_variable_name]
```

**Guidelines**:

- Use descriptive names that indicate purpose
- Avoid single-letter names except for loop counters (i, j, k)
- Boolean variables should ask a question: `is_active`, `has_permission`
- Avoid abbreviations unless universally understood

### Constants

**Convention**: [UPPER_SNAKE_CASE, SCREAMING_SNAKE_CASE]

```[language-extension]
// Good
[EXAMPLE_CONSTANT] = [value]

// Bad
[example_bad_constant] = [value]
```

### Functions/Methods

**Convention**: [snake_case, camelCase]

```[language-extension]
// Good
[example_function_name]([parameters]) {
    // Implementation
}

// Bad
[bad_function_name]([parameters]) {
    // Implementation
}
```

**Guidelines**:

- Use verb-noun format: `get_user()`, `calculate_total()`, `validate_input()`
- Keep names concise but descriptive
- Avoid generic names like `process()`, `handle()`, `do_stuff()`

### Classes/Types

**Convention**: [PascalCase, UpperCamelCase]

```[language-extension]
// Good
class [ExampleClassName] {
    // Implementation
}

// Bad
class [bad_class_name] {
    // Implementation
}
```

**Guidelines**:

- Use noun phrases: `UserRepository`, `PaymentProcessor`
- Avoid prefixes like `C`, `Cls`, `I` (unless language convention)
- Exception classes should end with `Error` or `Exception`

### Files and Modules

**Convention**: [snake_case.ext, kebab-case.ext, PascalCase.ext]

```text
// Good
[example_file_name].[ext]
[another-example].[ext]

// Bad
[BadFileName].[ext]
[bad.file.name].[ext]
```

**Guidelines**:

- Match file name to primary class/module name (if applicable)
- Use lowercase with separators
- Group related files in directories

## Code Formatting

### Indentation

- **Style**: [Spaces only, Tabs, Mixed]
- **Size**: [2 spaces, 4 spaces, 1 tab]

```[language-extension]
// Good
[example with proper indentation]
    [nested content]
        [more nested content]

// Bad
[example with improper indentation]
```

### Line Length

- **Maximum**: [80, 100, 120] characters per line
- **Exception**: Long strings, URLs, import statements

```[language-extension]
// Good - line broken appropriately
[example of properly broken long line]
    [continuation]

// Bad - line too long
[example of line that is too long and should be broken up for readability]
```

### Blank Lines

- **Between functions/methods**: [1, 2] blank lines
- **Within functions**: Use sparingly to separate logical blocks
- **File end**: Exactly 1 blank line

### Braces and Brackets

**Style**: [K&R, Allman, GNU, etc.]

```[language-extension]
// Good
[example with proper brace placement] {
    [content]
}

// Bad
[example with improper brace placement]
{
    [content]
}
```

### Spacing

```[language-extension]
// Good spacing
[example = value + other_value]
if ([condition]) {
    [statement]
}

// Bad spacing
[example=value+other_value]
if([condition]){
    [statement]
}
```

## Documentation Standards

### Module-Level Documentation

**Required for**: All files/modules

```[language-extension]
[comment syntax]
@module [module_name]
@description [Brief description of module purpose]
@dependencies [list, of, dependencies]
@version [1.0.0]
@author [Author Name]
@last_updated [YYYY-MM-DD]
[end comment syntax]
```

### Function/Method Documentation

**Required for**: Public functions, complex logic

```[language-extension]
[comment syntax]
[Function description]

@param {[type]} [parameter_name] - [Parameter description]
@param {[type]} [another_parameter] - [Another description]
@returns {[type]} [Return value description]
@throws {[ErrorType]} [When this error is thrown]
@example
    [example_usage]
[end comment syntax]
```

### Inline Comments

**Guidelines**:

- Explain **why**, not **what** (code should be self-explanatory)
- Place comments above the code they describe
- Keep comments up-to-date with code changes

```[language-extension]
// Good - explains why
// Use exponential backoff to avoid overwhelming the API
[retry_logic]

// Bad - explains what (obvious from code)
// Increment counter by 1
counter += 1
```

## Error Handling

### Exception Handling

**Strategy**: [Fail-fast, graceful degradation, retry logic]

```[language-extension]
// Good
try {
    [risky_operation]
} catch ([SpecificException] e) {
    [handle specific error]
} catch ([AnotherException] e) {
    [handle another error]
} finally {
    [cleanup resources]
}

// Bad
try {
    [risky_operation]
} catch ([Exception] e) {
    // Silent failure
}
```

**Guidelines**:

- Catch specific exceptions, not generic `Exception`
- Always log errors with context (user ID, request ID, timestamp)
- Clean up resources in `finally` blocks
- Re-throw exceptions if you can't handle them properly

### Error Messages

```[language-extension]
// Good - specific, actionable
throw new [ValidationError]("Invalid email format: must contain @ symbol")

// Bad - vague, unhelpful
throw new [Error]("Invalid input")
```

### Logging

**Levels**: DEBUG, INFO, WARN, ERROR, CRITICAL

```[language-extension]
// Good
logger.error("Failed to connect to database", {
    error: error.message,
    host: db_host,
    user: db_user,
    timestamp: new Date()
})

// Bad
console.log("error")
```

## Testing Requirements

### Coverage Requirements

- **Unit Tests**: [80%, 90%, 100%] coverage for business logic
- **Integration Tests**: All API endpoints, database operations
- **End-to-End Tests**: Critical user flows

### Test File Organization

```text
[src or main directory]/
    [module_name].[ext]

[tests or test directory]/
    [module_name]_test.[ext]
    [module_name].test.[ext]
```

### Test Naming

**Convention**: [test_should_behavior_when_condition, describe_behavior_it_should_do_something]

```[language-extension]
// Good
test_[should_calculate_discount_when_user_is_premium]() {
    // Test implementation
}

// Bad
test_[discount]() {
    // Test implementation
}
```

### Test Structure

**Pattern**: [Arrange-Act-Assert, Given-When-Then]

```[language-extension]
test_[example_test]() {
    // Arrange: Set up test data
    [setup_code]

    // Act: Execute the function
    [result] = [function_call]

    // Assert: Verify the result
    [assertion]
}
```

### Mocking and Stubbing

```[language-extension]
// Good - mock external dependencies
[mock_external_api]
[result] = [function_that_calls_api]
[verify_mock_was_called]

// Bad - make real API calls in tests
[result] = [function_that_calls_real_api]  // Flaky, slow, expensive
```

## Dependencies and Imports

### Import Organization

**Order**: [standard library, third-party, local modules]

```[language-extension]
// Good
[standard_library_imports]

[third_party_imports]

[local_module_imports]

// Bad - mixed order
[random_import_order]
```

### Dependency Declaration

```[language-extension]
// Good - pinned versions
[dependency_name] == [exact.version.number]
[another_dependency] >= [minimum.version], < [maximum.version]

// Bad - unpinned versions
[dependency_name]  // Any version (dangerous)
```

### Avoiding Circular Dependencies

```[language-extension]
// Bad - circular dependency
[ModuleA] imports [ModuleB]
[ModuleB] imports [ModuleA]

// Good - extract common code to third module
[ModuleA] imports [SharedModule]
[ModuleB] imports [SharedModule]
```

## Performance Considerations

### Algorithm Complexity

- Prefer O(1) or O(log n) algorithms when possible
- Avoid O(n²) or worse unless dataset is guaranteed small
- Document complexity in comments for non-obvious algorithms

```[language-extension]
// Good - O(1) lookup
[hash_map_lookup]

// Bad - O(n) lookup when hash map available
[linear_search_through_list]
```

### Resource Management

```[language-extension]
// Good - explicit resource cleanup
[open_resource]
try {
    [use_resource]
} finally {
    [close_resource]
}

// Bad - relying on garbage collector
[open_resource_without_cleanup]
```

### Caching

```[language-extension]
// Good - cache expensive operations
if ([cache_contains_key]) {
    return [cached_value]
}
[result] = [expensive_computation]
[cache_result]
return [result]
```

### Lazy Loading

```[language-extension]
// Good - load only when needed
if ([resource_is_needed]) {
    [load_resource]
}

// Bad - eager loading everything
[load_all_resources_upfront]
```

## Security Best Practices

### Input Validation

```[language-extension]
// Good - validate and sanitize
[validated_input] = [validate_and_sanitize]([user_input])
if (![is_valid]) {
    throw new [ValidationError]("Invalid input format")
}

// Bad - trust user input
[use_raw_user_input_directly]
```

### SQL Injection Prevention

```[language-extension]
// Good - parameterized queries
[query] = "SELECT * FROM users WHERE id = ?"
[execute_query]([query], [user_id])

// Bad - string concatenation
[query] = "SELECT * FROM users WHERE id = " + [user_id]  // Vulnerable!
```

### Secret Management

```[language-extension]
// Good - environment variables or secret manager
[api_key] = [get_from_environment]("API_KEY")

// Bad - hardcoded secrets
[api_key] = "sk_live_abc123xyz..."  // Never do this!
```

### Authentication and Authorization

```[language-extension]
// Good - check permissions before action
if (![user_has_permission]([required_permission])) {
    throw new [ForbiddenError]("Insufficient permissions")
}
[perform_protected_action]

// Bad - assume user has permission
[perform_protected_action]
```

## Anti-Patterns to Avoid

### [Anti-Pattern Name 1]

**Description**: [Brief description of the anti-pattern]

**Why It's Bad**: [Explanation of negative consequences]

```[language-extension]
// Bad
[example_of_anti_pattern]

// Good
[correct_alternative]
```

### [Anti-Pattern Name 2]

**Description**: [Brief description]

**Why It's Bad**: [Explanation]

```[language-extension]
// Bad
[example_of_anti_pattern]

// Good
[correct_alternative]
```

### [Anti-Pattern Name 3]

**Description**: [Brief description]

**Why It's Bad**: [Explanation]

```[language-extension]
// Bad
[example_of_anti_pattern]

// Good
[correct_alternative]
```

## Recommended Tools

### Formatters

- **[Tool Name]**: [Description and usage]
  - Installation: `[install_command]`
  - Configuration: [config_file_name]
  - Run: `[run_command]`

### Linters

- **[Linter Name]**: [Description and what it checks]
  - Installation: `[install_command]`
  - Configuration: [config_file_name]
  - Run: `[run_command]`

### Type Checkers (if applicable)

- **[Type Checker Name]**: [Description]
  - Installation: `[install_command]`
  - Configuration: [config_file_name]
  - Run: `[run_command]`

### IDE Extensions

- **[Extension Name]** ([IDE]): [Description]
- **[Another Extension]** ([IDE]): [Description]

### Pre-commit Configuration

```yaml
# .pre-commit-config.yaml
repos:
  - repo: [formatter_repo_url]
    hooks:
      - id: [formatter_hook_id]
  - repo: [linter_repo_url]
    hooks:
      - id: [linter_hook_id]
```

## Examples

### Example 1: [Use Case Name]

**Scenario**: [Brief description of the use case]

```[language-extension]
[complete_example_with_comments]
```

**Key Points**:

- [Point 1 about this example]
- [Point 2 about this example]
- [Point 3 about this example]

### Example 2: [Another Use Case]

**Scenario**: [Brief description]

```[language-extension]
[complete_example_with_comments]
```

**Key Points**:

- [Point 1]
- [Point 2]
- [Point 3]

### Example 3: [Common Pattern]

**Scenario**: [Brief description]

```[language-extension]
[complete_example_with_comments]
```

**Key Points**:

- [Point 1]
- [Point 2]
- [Point 3]

## References

### Official Documentation

- [Language Official Docs](https://example.com/docs)
- [Language Style Guide](https://example.com/style-guide)
- [Language Best Practices](https://example.com/best-practices)

### Community Style Guides

- [Company/Organization Style Guide](https://example.com/company-style)
- [Popular Open Source Project Style](https://example.com/project-style)

### Books and Resources

- [Book Title](https://example.com/book) - [Author Name]
- [Another Resource](https://example.com/resource)

### Tools and Utilities

- [Formatter Documentation](https://example.com/formatter)
- [Linter Documentation](https://example.com/linter)
- [Testing Framework](https://example.com/testing)

### Related Guides

<!-- Uncomment and customize these links when creating a new language guide -->
<!-- - [Python Style Guide](../02_language_guides/python.md) -->
<!-- - [Terraform Style Guide](../02_language_guides/terraform.md) -->
- [Metadata Schema Reference](../03_metadata_schema/schema_reference.md)

---

**Template Version**: 1.0.0
**Last Updated**: 2025-10-28
**Maintainer**: Tyler Dukes

**Note**: This template should be customized for each language. Delete placeholder text and fill in
language-specific examples, conventions, and best practices.
