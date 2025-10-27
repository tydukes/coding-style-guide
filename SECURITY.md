# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of the Coding Style Guide project seriously. If you
believe you have found a security vulnerability, please report it to us as
described below.

### Reporting Process

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **GitHub Security Advisories** (Preferred)
   - Navigate to the repository's Security tab
   - Click "Report a vulnerability"
   - Fill out the form with details

2. **Email**
   - Send an email to the repository owner
   - Include the word "SECURITY" in the subject line

### What to Include

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Status Updates**: We will send you regular updates about our progress
- **Resolution**: We aim to resolve critical issues within 90 days

### What to Expect

When you report a vulnerability, we will:

1. Confirm the receipt of your vulnerability report
2. Assess the vulnerability and determine its impact
3. Work on a fix and prepare a security advisory
4. Release a fix and publicly disclose the vulnerability (with credit to you, if desired)

### Disclosure Policy

- We request that you do not publicly disclose the vulnerability until we have had a chance to address it
- We will work with you to understand and resolve the issue promptly
- Once the issue is resolved, we will publish a security advisory
- We will credit you for the discovery (unless you prefer to remain anonymous)

### Security Update Distribution

Security updates will be released through:

1. GitHub releases with security tags
2. Security advisories on GitHub
3. Updates to this SECURITY.md file

### Best Practices for Users

When using this style guide in your projects:

1. **Keep Dependencies Updated**: Regularly update MkDocs and related dependencies
2. **Review Generated Code**: Always review AI-generated or automated code suggestions
3. **Validate Inputs**: When implementing validation pipelines, ensure proper input sanitization
4. **Secure Secrets**: Never commit secrets, API keys, or sensitive data to repositories
5. **Container Security**: When using the containerized version, keep base images updated

### Security Considerations for Style Guide Implementation

This project provides style guidelines and documentation. However, when implementing these guidelines:

- **Terraform/Terragrunt**: Ensure state files are stored securely with encryption
- **Ansible**: Use Ansible Vault for sensitive variables
- **Kubernetes**: Follow least-privilege principles for RBAC
- **CI/CD Pipelines**: Secure pipeline credentials and use secret management tools
- **Python/TypeScript**: Keep dependencies updated and scan for vulnerabilities

### Known Security Considerations

- This project uses third-party dependencies (MkDocs, Material theme, etc.)
- Container images should be scanned for vulnerabilities before deployment
- When using AI validation pipelines, ensure API keys are properly secured

### Security Resources

- [GitHub Security Advisories](https://github.com/tydukes/coding-style-guide/security/advisories)
- [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing Guidelines](CONTRIBUTING.md)

### Scope

This security policy applies to:

- The coding-style-guide repository and its documentation
- Container images built from this repository
- CI/CD workflows and automation scripts

This policy does **not** apply to:

- Third-party implementations of these guidelines
- Downstream projects that reference this style guide

## Comments on This Policy

If you have suggestions on how this process could be improved, please submit a pull request or open an issue.

---

Thank you for helping keep the Coding Style Guide project and our community safe!
