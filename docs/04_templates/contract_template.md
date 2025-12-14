---
title: "CONTRACT.md Template"
description: "Standardized template for module and role contracts"
author: "Tyler Dukes"
tags: [template, iac, testing, contracts, terraform, ansible]
category: "Templates"
status: "active"
---

This template provides a standardized format for documenting explicit guarantees and promises for
Terraform modules, Ansible roles, and other Infrastructure as Code components.

## Purpose

A CONTRACT.md file serves as an explicit agreement between the module/role author and consumers,
defining testable guarantees about behavior, inputs, outputs, and platform support.

## When to Use This Template

Create a CONTRACT.md file for:

- **Reusable Terraform modules**: Any module used across multiple projects
- **Shared Ansible roles**: Roles used by multiple teams or playbooks
- **Public IaC components**: Any code published externally
- **Critical infrastructure**: Modules/roles managing production systems
- **Complex logic**: Components with non-trivial behavior

## How to Use This Template

1. Copy the template below to your module/role root directory as `CONTRACT.md`
2. Fill in all applicable sections
3. Remove sections marked `[Optional]` if not relevant
4. Keep guarantee statements numbered for test traceability
5. Update the contract whenever guarantees change
6. Reference guarantee numbers in test descriptions

---

## Template Content

````markdown
# Module Contract: [Module/Role Name]

> **Version**: [X.Y.Z]
> **Last Updated**: [YYYY-MM-DD]
> **Maintained by**: [Team Name or Individual]
> **Status**: [Active | Deprecated | Experimental]

## 1. Purpose

[One or two paragraphs describing what this module/role does and what problem it solves.
Be specific about the use case.]

## 2. Guarantees

These are explicit, testable promises about what this module/role will do:

### Resource Guarantees

[List all infrastructure resources that will be created, modified, or managed]

1. **G1**: [Specific guarantee about resource creation]
2. **G2**: [Another guarantee]
3. **G3**: [Continue numbering for traceability]

**Example**:

- **G1**: Creates exactly 1 VPC in the specified AWS region
- **G2**: VPC has DNS hostnames and DNS support enabled
- **G3**: Creates N public subnets distributed across at least 2 availability zones

### Behavior Guarantees

[Promises about how the code behaves]

1. **G4**: [Idempotency guarantee or behavioral promise]
2. **G5**: [Security or compliance guarantee]
3. **G6**: [Performance or availability guarantee]

**Example**:

- **G4**: Multiple executions produce identical results (idempotent)
- **G5**: All S3 buckets have encryption enabled by default
- **G6**: Load balancer health checks pass before marking deployment complete

### Data Integrity Guarantees [Optional]

[For modules/roles handling data]

1. **G7**: [Data protection guarantee]
2. **G8**: [Backup or recovery guarantee]

**Example**:

- **G7**: Database backups retained for 30 days minimum
- **G8**: Encryption at rest enabled for all data stores

## 3. Inputs (Parameters)

### Required Inputs

| Name | Type | Description | Validation Rules | Example |
|------|------|-------------|------------------|---------|
| `input_name` | `type` | [Description] | [Constraints] | `example_value` |

**Example**:

| Name | Type | Description | Validation Rules | Example |
|------|------|-------------|------------------|---------|
| `vpc_cidr` | `string` | VPC CIDR block | Must be valid IPv4 CIDR, /16 to /28 | `"10.0.0.0/16"` |
| `environment` | `string` | Deployment environment | Must be: dev, staging, prod | `"prod"` |
| `availability_zones` | `list(string)` | AZs for subnet distribution | Minimum 2 AZs | `["us-east-1a", "us-east-1b"]` |

### Optional Inputs

| Name | Type | Default | Description | Validation Rules | Example |
|------|------|---------|-------------|------------------|---------|
| `input_name` | `type` | `default_value` | [Description] | [Constraints] | `example_value` |

**Example**:

| Name | Type | Default | Description | Validation Rules | Example |
|------|------|---------|-------------|------------------|---------|
| `enable_nat_gateway` | `bool` | `true` | Create NAT gateways | None | `false` |
| `tags` | `map(string)` | `{}` | Additional resource tags | None | `{"Project": "MyApp"}` |

## 4. Outputs (Returns)

| Name | Type | Description | Always Available? |
|------|------|-------------|-------------------|
| `output_name` | `type` | [Description] | [Yes/No] |

**Example**:

| Name | Type | Description | Always Available? |
|------|------|-------------|-------------------|
| `vpc_id` | `string` | The ID of the created VPC | Yes |
| `public_subnet_ids` | `list(string)` | IDs of public subnets | Yes |
| `nat_gateway_ids` | `list(string)` | IDs of NAT gateways | Only if `enable_nat_gateway = true` |

## 5. Platform Requirements

### Supported Platforms

| Platform | Versions | Status | Notes |
|----------|----------|--------|-------|
| [OS/Cloud Provider] | [Versions] | ✅ Tested / ⚠️ Experimental / ❌ Not Supported | [Any notes] |

**Example**:

| Platform | Versions | Status | Notes |
|----------|----------|--------|-------|
| AWS | us-east-1, us-west-2, eu-west-1 | ✅ Tested | Primary support |
| Ubuntu | 20.04, 22.04 | ✅ Tested | LTS versions only |
| RHEL | 8, 9 | ✅ Tested | Requires EPEL repo |
| Windows Server | 2019, 2022 | ⚠️ Experimental | Limited testing |

### Tool Requirements

| Tool | Minimum Version | Recommended Version |
|------|----------------|---------------------|
| Terraform | `>= 1.3.0` | `1.6.0` |
| Terraform Provider (AWS) | `>= 4.0.0, < 6.0.0` | `5.x` |

**Or for Ansible**:

| Tool | Minimum Version | Recommended Version |
|------|----------------|---------------------|
| Ansible | `>= 2.14` | `2.16` |
| Python (control node) | `>= 3.8` | `3.11` |
| Python (managed nodes) | `>= 3.6` | `3.9` |

## 6. Dependencies

### Module/Role Dependencies

[List any other modules or roles that this depends on]

**Example** (Terraform):

```hcl
# This module depends on:
# - Network module (for VPC ID)
# - Security module (for security groups)
```

**Example** (Ansible):

```yaml
# meta/main.yml
dependencies:
  - role: common_setup
    vars:
      setup_firewall: true
  - role: ssl_certificates
    when: enable_ssl | bool
```

### Collection Dependencies [Ansible Only]

- `ansible.builtin` (core modules)
- `community.general` >= 5.0.0
- `ansible.posix` >= 1.4.0

### External Service Dependencies [Optional]

[APIs, external services required]

**Example**:

- AWS IAM for resource creation
- Route53 for DNS management (if `create_dns_records = true`)

## 7. Pre-requisites

### IAM Permissions Required [Cloud Providers]

**Example** (AWS):

```json
{
  "Effect": "Allow",
  "Action": [
    "ec2:CreateVpc",
    "ec2:DescribeVpcs",
    "ec2:ModifyVpcAttribute",
    "ec2:CreateSubnet",
    "ec2:DescribeSubnets",
    "ec2:CreateInternetGateway",
    "ec2:AttachInternetGateway",
    "ec2:CreateNatGateway",
    "ec2:DescribeNatGateways",
    "ec2:AllocateAddress",
    "ec2:DescribeAddresses",
    "ec2:CreateRouteTable",
    "ec2:CreateRoute",
    "ec2:AssociateRouteTable"
  ],
  "Resource": "*"
}
```

### Network Requirements [Optional]

- Outbound internet access for package downloads
- Access to package repositories (apt, yum, etc.)
- Specific port access (list ports)

### Existing Resources Required [Optional]

[If module requires pre-existing infrastructure]

**Example**:

- S3 bucket for Terraform state (if using remote backend)
- KMS key for encryption (provide ARN via `kms_key_arn` variable)

## 8. Side Effects

### Resources Created

[Comprehensive list of all resources this creates]

**Example**:

- 1 VPC
- N public subnets (configurable)
- N private subnets (configurable)
- 1 Internet Gateway
- N NAT Gateways (one per AZ)
- N Elastic IPs (for NAT Gateways)
- Route tables and associations

### Resources Modified [Optional]

[If this modifies existing resources]

**Example**:

- Updates security group rules for existing EC2 instances
- Modifies Route53 DNS records

### State Changes

[What changes in Terraform state or system state]

**Example**:

- Terraform state includes all VPC resources
- AWS CloudFormation stack created (if applicable)

### Network Impact [Optional]

[If this affects network connectivity]

**Example**:

- Creates new network segments
- May cause brief connectivity interruption during NAT Gateway creation
- Adds routes to existing route tables

### Cost Implications

[Estimated cost impact]

**Example**:

- **Estimated Monthly Cost**: $50-200 (varies by region and NAT Gateway data transfer)
- **Cost Drivers**: NAT Gateways ($0.045/hour each), Elastic IPs, data transfer

## 9. Idempotency Contract [Ansible Only]

### Idempotency Guarantees

1. **I1**: Running role multiple times produces no additional changes
2. **I2**: Tasks report "changed" only when actual changes are made
3. **I3**: Service restarts only occur when configuration changes

### Safe Rerun Scenarios

- After failed execution (safe to retry)
- During configuration drift remediation
- As part of regular compliance runs

### Changed vs Unchanged Detection

[How the role detects if changes are needed]

**Example**:

- Package installation: Only reports changed if package version differs
- Service state: Only reports changed if service was not running
- File content: Only reports changed if file content differs

## 10. Testing Requirements

### Minimum Test Coverage

- ✅ Static analysis (lint, format) passes
- ✅ Unit tests verify all guarantees (G1-GN)
- ✅ Idempotency tests pass (2 runs, 0 changes on run 2)
- ✅ All supported platforms tested
- ✅ Security scans pass (no HIGH or CRITICAL findings)

### Required Test Scenarios

1. **Scenario**: Basic deployment with default values
   - **Tests**: G1, G2, G3, G4
2. **Scenario**: Deployment with custom configuration
   - **Tests**: G1-G6, input validation
3. **Scenario**: Multi-platform deployment
   - **Tests**: All guarantees on each supported platform

### Compliance Checks Required [Optional]

[For compliance-sensitive modules]

**Example**:

- CIS AWS Foundations Benchmark (applicable controls)
- PCI-DSS requirements for network segmentation
- HIPAA encryption requirements

## 11. Breaking Changes Policy

### Semantic Versioning

This module/role follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes to interface, behavior, or resource names
- **MINOR** (x.Y.0): New features, backward-compatible changes, new guarantees
- **PATCH** (x.y.Z): Bug fixes, documentation updates

### What Constitutes a Breaking Change

- Renaming input variables
- Changing input types or validation rules
- Removing output values
- Changing resource names (causes Terraform recreation)
- Removing or renaming resources
- Changing default values that affect behavior
- Removing platform support

### Deprecation Timeline

Breaking changes follow this timeline:

1. **Announce**: Document in CHANGELOG.md at least 2 minor versions before removal
2. **Warn**: Add deprecation warnings to code/documentation
3. **Migrate**: Provide migration guide with examples
4. **Remove**: Remove in next major version

**Example Timeline**:

- v1.2.0: Announce `old_var` will be replaced by `new_var`
- v1.3.0: Support both `old_var` and `new_var`, warn on `old_var` usage
- v1.4.0: Continue supporting both with warnings
- v2.0.0: Remove `old_var`, only support `new_var`

### Backwards Compatibility Promise

- All minor versions within a major version are backward-compatible
- Deprecated features supported for minimum 2 minor versions
- Migration guides provided for all breaking changes

## 12. Known Limitations

### Current Constraints

[List any known limitations or constraints]

**Example**:

- Maximum of 5 NAT Gateways per VPC (AWS limit)
- Cannot modify VPC CIDR after creation
- Windows support is experimental (limited testing)

### Unsupported Scenarios

[Scenarios that are explicitly not supported]

**Example**:

- IPv6-only VPCs (not currently supported)
- VPC peering across regions (use separate module)
- Multi-region deployments (use multiple module instances)

### Future Enhancements Planned [Optional]

[Planned improvements]

**Example**:

- v2.0: Add support for IPv6
- v2.1: Add VPC Flow Logs integration
- v3.0: Support for Transit Gateway attachments

## 13. Support and Maintenance

- **Maintained by**: [Team Name / Individual]
- **Contact**: [Email or Slack channel]
- **Documentation**: [Link to full documentation]
- **Source Code**: [GitHub/GitLab repository URL]
- **Issues**: [Issue tracker URL]
- **License**: [MIT / Apache 2.0 / Proprietary]

### Support Level

- **Active Support**: Bug fixes, security patches, new features
- **Maintenance Mode**: Critical bug fixes and security patches only
- **Deprecated**: No active support, migration path provided

### Review Schedule

- **Quarterly Review**: Update guarantees, platform support, dependencies
- **Annual Review**: Major version planning, breaking changes assessment

---

## Usage Example

See [README.md](README.md) for complete usage examples.

**Quick Start**:

```hcl
# Terraform example
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr           = "10.0.0.0/16"
  environment        = "prod"
  availability_zones = ["us-east-1a", "us-east-1b"]

  tags = {
    Project = "MyApp"
    Owner   = "DevOps"
  }
}
```

```yaml
# Ansible example
- name: Deploy web server
  hosts: webservers
  roles:
    - role: webserver
      vars:
        nginx_version: "1.24"
        enable_ssl: true
        ssl_certificate_path: "/etc/ssl/certs/server.crt"
```

---

## Testing This Contract

All guarantees in this contract are verified by automated tests:

```bash
# Terraform
terraform test                           # Native Terraform tests
cd tests && go test -v -timeout 30m      # Terratest Go tests

# Ansible
molecule test                            # Full test sequence
molecule test -s compliance              # Compliance scenario
```

**Test Mapping**:

- `test_vpc_creation.go`: Tests G1, G2
- `test_subnets.go`: Tests G3
- `test_nat_gateways.go`: Tests G5
- `test_idempotency.go`: Tests G4

---

*This contract is a living document. Update it whenever module/role behavior changes.*

````

---

## Examples

### Example 1: Terraform VPC Module Contract

See the [Terraform guide Testing section](../02_language_guides/terraform.md#module-contracts) for a complete
VPC module CONTRACT.md example.

### Example 2: Ansible Webserver Role Contract

See the [Ansible guide Testing section](../02_language_guides/ansible.md#role-contracts) for a complete
webserver role CONTRACT.md example.

## Additional Resources

- [IaC Testing Standards](../05_ci_cd/iac_testing_standards.md#contract-based-development) - Contract-based development philosophy
- [Terraform Testing Guide](../02_language_guides/terraform.md#testing) - Terraform-specific testing
- [Ansible Testing Guide](../02_language_guides/ansible.md#testing-with-molecule) - Ansible-specific testing

---

*Template Version: 1.0.0*
*Last Updated: 2025-01-15*
