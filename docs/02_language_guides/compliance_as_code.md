---
title: "Compliance as Code Style Guide"
description: "Standards for automated compliance validation using InSpec, Open Policy Agent (OPA), and policy-as-code frameworks"
author: "Tyler Dukes"
tags: [compliance, inspec, opa, rego, sentinel, policy-as-code, security]
category: "Language Guides"
status: "active"
---

## Language Overview

**Compliance as Code** enables automated validation of infrastructure against compliance requirements
and security policies. This guide covers InSpec (Ruby DSL), Open Policy Agent (Rego), and Terraform
Sentinel for policy enforcement.

### Key Characteristics

- **Paradigm**: Declarative policy definition
- **Languages**: Ruby (InSpec), Rego (OPA), Sentinel (HashiCorp)
- **Typing**: Dynamic with strong validation constraints
- **Primary Use Cases**:
  - Infrastructure compliance validation
  - Kubernetes admission control
  - Terraform plan enforcement
  - Cloud security posture management

### Supported Frameworks

| Framework | Language | Primary Use Case |
|-----------|----------|------------------|
| InSpec | Ruby DSL | Infrastructure compliance testing |
| Open Policy Agent | Rego | Kubernetes/API policy enforcement |
| Sentinel | HCL-like | Terraform Cloud policy enforcement |
| Conftest | Rego | Configuration file validation |
| Checkov | Python/YAML | IaC security scanning |

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **InSpec** | | | |
| Profile names | `kebab-case` | `cis-linux-baseline` | Descriptive, framework-based |
| Control IDs | `framework-number` | `cis-1.1.1`, `pci-req-8.2` | Traceable to standard |
| Resource names | `snake_case` | `sshd_config`, `file_resource` | Ruby convention |
| **OPA/Rego** | | | |
| Package names | `dot.separated` | `kubernetes.admission` | Hierarchical namespacing |
| Rule names | `snake_case` | `deny_root_user` | Verb prefix for actions |
| Variable names | `snake_case` | `container_image` | Descriptive, lowercase |
| **Sentinel** | | | |
| Policy names | `kebab-case` | `require-s3-encryption` | Action-oriented naming |
| Rule names | `snake_case` | `main`, `s3_encrypted` | HCL-like conventions |
| Import aliases | `lowercase` | `tfplan`, `tfrun` | Short, recognizable |
| **File Structure** | | | |
| InSpec profiles | `profiles/{name}/` | `profiles/cis-linux/` | Standard InSpec layout |
| OPA policies | `policies/{domain}/` | `policies/kubernetes/` | Domain-based organization |
| Sentinel policies | `policies/{category}/` | `policies/cost/` | Category-based grouping |

---

## InSpec Standards

### Profile Structure

```text
profiles/
├── cis-linux-baseline/
│   ├── inspec.yml           # Profile metadata
│   ├── controls/
│   │   ├── filesystem.rb    # Filesystem controls
│   │   ├── ssh.rb           # SSH controls
│   │   └── audit.rb         # Audit controls
│   ├── libraries/
│   │   └── custom_resource.rb
│   ├── files/
│   │   └── expected_config.txt
│   └── README.md
├── pci-dss-baseline/
└── hipaa-baseline/
```

### Profile Metadata

```yaml
# inspec.yml
name: cis-linux-baseline
title: CIS Linux Benchmark
maintainer: Security Team
copyright: Example Corp
copyright_email: security@example.com
license: Apache-2.0
summary: InSpec profile for CIS Linux Level 1 Benchmark
version: 2.1.0
inspec_version: ">= 5.0"

supports:
  - platform-name: redhat
    release: 8.*
  - platform-name: ubuntu
    release: 22.04

depends:
  - name: linux-baseline
    url: https://github.com/dev-sec/linux-baseline/archive/master.tar.gz
    version: ">= 2.0"

attributes:
  - name: ssh_allowed_ciphers
    description: List of approved SSH ciphers
    type: array
    default:
      - aes256-gcm@openssh.com
      - aes128-gcm@openssh.com
      - aes256-ctr
```

### Control Naming and Structure

```ruby
# controls/ssh.rb
# @module ssh_controls
# @description SSH hardening controls per CIS Benchmark
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15

# CIS 5.2.1 - Ensure sshd_config permissions
control 'cis-5.2.1' do
  impact 1.0
  title 'Ensure permissions on /etc/ssh/sshd_config are configured'
  desc 'The sshd_config file needs to be protected from unauthorized changes.'
  desc 'rationale', 'Unauthorized modification could allow insecure configurations.'
  desc 'check', 'Verify file permissions are 0600 or more restrictive.'
  desc 'fix', 'Run: chmod 600 /etc/ssh/sshd_config'

  tag cis_level: 1
  tag cis_controls: ['5.1']
  tag severity: 'high'
  tag compliance: ['cis', 'pci-dss-req-2.2']

  ref 'CIS Benchmark', url: 'https://www.cisecurity.org/benchmark/linux'
  ref 'NIST 800-53', url: 'https://nvd.nist.gov/800-53'

  describe file('/etc/ssh/sshd_config') do
    it { should exist }
    it { should be_file }
    it { should be_owned_by 'root' }
    it { should be_grouped_into 'root' }
    its('mode') { should cmp '0600' }
  end
end

# CIS 5.2.2 - Ensure SSH access is limited
control 'cis-5.2.2' do
  impact 1.0
  title 'Ensure SSH access is limited'
  desc 'Restrict SSH access to authorized users and groups only.'

  tag cis_level: 1
  tag severity: 'high'

  only_if('SSH server is installed') do
    package('openssh-server').installed?
  end

  describe sshd_config do
    its('AllowUsers') { should_not be_nil }
    its('AllowGroups') { should_not be_nil }
    its('DenyUsers') { should include 'root' }
  end
end

# CIS 5.2.4 - Ensure SSH Protocol is set to 2
control 'cis-5.2.4' do
  impact 1.0
  title 'Ensure SSH Protocol is set to 2'
  desc 'SSH Protocol 1 has known vulnerabilities.'

  tag cis_level: 1

  describe sshd_config do
    its('Protocol') { should cmp 2 }
  end
end

# CIS 5.2.5 - Ensure SSH LogLevel is appropriate
control 'cis-5.2.5' do
  impact 0.5
  title 'Ensure SSH LogLevel is appropriate'
  desc 'SSH LogLevel should be set to VERBOSE or INFO.'

  tag cis_level: 1

  describe sshd_config do
    its('LogLevel') { should be_in ['VERBOSE', 'INFO'] }
  end
end
```

### SSH Configuration Controls

```ruby
# controls/ssh_hardening.rb
# Complete SSH hardening validation

control 'ssh-hardening-01' do
  impact 1.0
  title 'Ensure SSH root login is disabled'

  describe sshd_config do
    its('PermitRootLogin') { should eq 'no' }
  end
end

control 'ssh-hardening-02' do
  impact 1.0
  title 'Ensure SSH password authentication is disabled'

  describe sshd_config do
    its('PasswordAuthentication') { should eq 'no' }
    its('PubkeyAuthentication') { should eq 'yes' }
  end
end

control 'ssh-hardening-03' do
  impact 0.7
  title 'Ensure SSH idle timeout is configured'

  describe sshd_config do
    its('ClientAliveInterval') { should cmp <= 300 }
    its('ClientAliveCountMax') { should cmp <= 3 }
  end
end

control 'ssh-hardening-04' do
  impact 1.0
  title 'Ensure only approved ciphers are used'

  approved_ciphers = attribute('ssh_allowed_ciphers', default: [
    'aes256-gcm@openssh.com',
    'aes128-gcm@openssh.com',
    'aes256-ctr',
    'aes192-ctr',
    'aes128-ctr'
  ])

  describe sshd_config do
    its('Ciphers') { should_not be_nil }
  end

  sshd_config.Ciphers.to_s.split(',').each do |cipher|
    describe "Cipher #{cipher}" do
      it { expect(approved_ciphers).to include(cipher.strip) }
    end
  end
end

control 'ssh-hardening-05' do
  impact 0.7
  title 'Ensure SSH MaxAuthTries is set'

  describe sshd_config do
    its('MaxAuthTries') { should cmp <= 4 }
  end
end

control 'ssh-hardening-06' do
  impact 0.5
  title 'Ensure SSH banner is configured'

  describe sshd_config do
    its('Banner') { should eq '/etc/issue.net' }
  end

  describe file('/etc/issue.net') do
    it { should exist }
    its('content') { should match(/Authorized users only/) }
  end
end
```

### Port and Service Validation

```ruby
# controls/network.rb
# Network and port validation controls

control 'network-ports-01' do
  impact 1.0
  title 'Ensure SSH is listening on port 22'

  describe port(22) do
    it { should be_listening }
    its('protocols') { should include 'tcp' }
    its('addresses') { should_not include '0.0.0.0' }
  end
end

control 'network-ports-02' do
  impact 1.0
  title 'Ensure unnecessary ports are closed'

  unnecessary_ports = [23, 21, 25, 110, 143]

  unnecessary_ports.each do |p|
    describe port(p) do
      it { should_not be_listening }
    end
  end
end

control 'network-ports-03' do
  impact 0.7
  title 'Ensure web services use TLS'

  describe port(443) do
    it { should be_listening }
  end

  describe port(80) do
    # HTTP should redirect to HTTPS
    it { should_not be_listening }
  end
end

control 'network-firewall-01' do
  impact 1.0
  title 'Ensure firewall is active'

  describe service('firewalld') do
    it { should be_installed }
    it { should be_enabled }
    it { should be_running }
  end
end
```

### File System Controls

```ruby
# controls/filesystem.rb
# File system security controls

control 'fs-permissions-01' do
  impact 1.0
  title 'Ensure /etc/passwd permissions are secure'

  describe file('/etc/passwd') do
    it { should exist }
    its('mode') { should cmp '0644' }
    its('owner') { should eq 'root' }
    its('group') { should eq 'root' }
  end
end

control 'fs-permissions-02' do
  impact 1.0
  title 'Ensure /etc/shadow permissions are secure'

  describe file('/etc/shadow') do
    it { should exist }
    its('mode') { should cmp '0640' }
    its('owner') { should eq 'root' }
    it { should_not be_readable.by('others') }
  end
end

control 'fs-permissions-03' do
  impact 0.7
  title 'Ensure no world-writable files exist'

  describe command('find / -xdev -type f -perm -0002 2>/dev/null') do
    its('stdout') { should be_empty }
  end
end

control 'fs-permissions-04' do
  impact 0.7
  title 'Ensure no unowned files exist'

  describe command('find / -xdev -nouser 2>/dev/null') do
    its('stdout') { should be_empty }
  end
end

control 'fs-partitions-01' do
  impact 0.5
  title 'Ensure separate partitions for critical directories'

  critical_mounts = ['/tmp', '/var', '/var/log', '/var/log/audit', '/home']

  critical_mounts.each do |mount_point|
    describe mount(mount_point) do
      it { should be_mounted }
    end
  end
end

control 'fs-partitions-02' do
  impact 0.7
  title 'Ensure /tmp has noexec option'

  describe mount('/tmp') do
    it { should be_mounted }
    its('options') { should include 'noexec' }
    its('options') { should include 'nosuid' }
    its('options') { should include 'nodev' }
  end
end
```

### Custom Resources

```ruby
# libraries/aws_security_group_extended.rb
# Custom InSpec resource for enhanced AWS security group validation

class AwsSecurityGroupExtended < Inspec.resource(1)
  name 'aws_security_group_extended'
  desc 'Extended AWS Security Group resource with compliance checks'

  example <<~EXAMPLE
    describe aws_security_group_extended(group_id: 'sg-12345678') do
      it { should_not have_unrestricted_ingress }
      it { should_not allow_ingress_from_anywhere_to_port(22) }
      its('open_ports') { should_not include 3389 }
    end
  EXAMPLE

  attr_reader :group_id, :vpc_id, :ingress_rules, :egress_rules

  def initialize(opts = {})
    @group_id = opts[:group_id]
    @sg = fetch_security_group
    @ingress_rules = @sg&.ip_permissions || []
    @egress_rules = @sg&.ip_permissions_egress || []
    @vpc_id = @sg&.vpc_id
  end

  def exists?
    !@sg.nil?
  end

  def has_unrestricted_ingress?
    @ingress_rules.any? do |rule|
      rule.ip_ranges.any? { |r| r.cidr_ip == '0.0.0.0/0' } ||
        rule.ipv_6_ranges.any? { |r| r.cidr_ipv_6_block == '::/0' }
    end
  end

  def allow_ingress_from_anywhere_to_port?(port)
    @ingress_rules.any? do |rule|
      matches_port?(rule, port) &&
        (rule.ip_ranges.any? { |r| r.cidr_ip == '0.0.0.0/0' } ||
         rule.ipv_6_ranges.any? { |r| r.cidr_ipv_6_block == '::/0' })
    end
  end

  def open_ports
    ports = []
    @ingress_rules.each do |rule|
      next unless rule.ip_ranges.any? { |r| r.cidr_ip == '0.0.0.0/0' }
      if rule.from_port == rule.to_port
        ports << rule.from_port
      else
        ports.concat((rule.from_port..rule.to_port).to_a)
      end
    end
    ports.uniq
  end

  private

  def fetch_security_group
    require 'aws-sdk-ec2'
    client = Aws::EC2::Client.new
    response = client.describe_security_groups(group_ids: [@group_id])
    response.security_groups.first
  rescue Aws::EC2::Errors::InvalidGroupNotFound
    nil
  end

  def matches_port?(rule, port)
    rule.from_port <= port && rule.to_port >= port
  end
end
```

### AWS Resource Controls

```ruby
# controls/aws_security.rb
# AWS security compliance controls

control 'aws-sg-01' do
  impact 1.0
  title 'Ensure no security groups allow unrestricted SSH access'

  aws_security_groups.group_ids.each do |sg_id|
    describe aws_security_group(group_id: sg_id) do
      it { should_not allow_in(port: 22, ipv4_range: '0.0.0.0/0') }
    end
  end
end

control 'aws-sg-02' do
  impact 1.0
  title 'Ensure no security groups allow unrestricted RDP access'

  aws_security_groups.group_ids.each do |sg_id|
    describe aws_security_group(group_id: sg_id) do
      it { should_not allow_in(port: 3389, ipv4_range: '0.0.0.0/0') }
    end
  end
end

control 'aws-s3-01' do
  impact 1.0
  title 'Ensure S3 buckets have encryption enabled'

  aws_s3_buckets.bucket_names.each do |bucket|
    describe aws_s3_bucket(bucket_name: bucket) do
      it { should have_default_encryption_enabled }
    end
  end
end

control 'aws-s3-02' do
  impact 1.0
  title 'Ensure S3 buckets block public access'

  aws_s3_buckets.bucket_names.each do |bucket|
    describe aws_s3_bucket(bucket_name: bucket) do
      it { should_not be_public }
      its('public_access_block.block_public_acls') { should be true }
      its('public_access_block.block_public_policy') { should be true }
    end
  end
end

control 'aws-s3-03' do
  impact 0.7
  title 'Ensure S3 buckets have versioning enabled'

  aws_s3_buckets.bucket_names.each do |bucket|
    describe aws_s3_bucket(bucket_name: bucket) do
      it { should have_versioning_enabled }
    end
  end
end

control 'aws-s3-04' do
  impact 0.7
  title 'Ensure S3 buckets have access logging enabled'

  aws_s3_buckets.bucket_names.each do |bucket|
    describe aws_s3_bucket(bucket_name: bucket) do
      it { should have_access_logging_enabled }
    end
  end
end

control 'aws-iam-01' do
  impact 1.0
  title 'Ensure IAM password policy requires minimum length'

  describe aws_iam_password_policy do
    it { should exist }
    its('minimum_password_length') { should be >= 14 }
  end
end

control 'aws-iam-02' do
  impact 1.0
  title 'Ensure IAM password policy prevents password reuse'

  describe aws_iam_password_policy do
    its('password_reuse_prevention') { should be >= 24 }
  end
end

control 'aws-iam-03' do
  impact 1.0
  title 'Ensure MFA is enabled for root account'

  describe aws_iam_root_user do
    it { should have_mfa_enabled }
  end
end

control 'aws-rds-01' do
  impact 1.0
  title 'Ensure RDS instances have encryption enabled'

  aws_rds_instances.db_instance_identifiers.each do |db|
    describe aws_rds_instance(db_instance_identifier: db) do
      it { should have_encrypted_storage }
    end
  end
end

control 'aws-rds-02' do
  impact 0.7
  title 'Ensure RDS instances are not publicly accessible'

  aws_rds_instances.db_instance_identifiers.each do |db|
    describe aws_rds_instance(db_instance_identifier: db) do
      it { should_not be_publicly_accessible }
    end
  end
end
```

### Waivers and Exceptions

```yaml
# waivers.yml
# Compliance waivers with documented justifications

cis-5.2.1:
  expiration_date: 2025-06-30
  run: false
  justification: "Legacy server pending migration - ticket INFRA-1234"
  approver: security-team@example.com
  risk_acceptance: high

cis-5.2.2:
  run: true
  skipped_due_to: "Control handled by external SSO provider"
  alternative_control: "IDP-SSO-01"
  approver: security-team@example.com

aws-sg-01:
  run: true
  justification: "Bastion host requires SSH from VPN range"
  compensating_control: "VPN access logged and monitored"
  expiration_date: 2025-12-31
```

```ruby
# controls/with_waivers.rb
# Controls that handle waiver scenarios

control 'cis-5.2.1-waiverable' do
  impact 1.0
  title 'Ensure sshd_config permissions (with waiver support)'

  only_if('Control not waived') do
    !waiver_active?('cis-5.2.1')
  end

  describe file('/etc/ssh/sshd_config') do
    its('mode') { should cmp '0600' }
  end
end

def waiver_active?(control_id)
  waiver_file = '/etc/inspec/waivers.yml'
  return false unless File.exist?(waiver_file)

  waivers = YAML.load_file(waiver_file)
  waiver = waivers[control_id]
  return false unless waiver

  if waiver['expiration_date']
    return Date.parse(waiver['expiration_date']) >= Date.today
  end

  waiver['run'] == false
end
```

---

## Open Policy Agent (OPA) Standards

### Policy Directory Structure

```text
policies/
├── kubernetes/
│   ├── admission/
│   │   ├── pod_security.rego
│   │   ├── network_policy.rego
│   │   └── resource_limits.rego
│   ├── rbac/
│   │   └── role_restrictions.rego
│   └── data/
│       └── approved_registries.json
├── terraform/
│   ├── aws/
│   │   ├── s3_encryption.rego
│   │   ├── security_groups.rego
│   │   └── iam_policies.rego
│   └── gcp/
│       └── storage_encryption.rego
├── cicd/
│   └── pipeline_security.rego
└── lib/
    └── helpers.rego
```

### Package Naming Conventions

```rego
# policies/kubernetes/admission/pod_security.rego

# Good - hierarchical package naming
package kubernetes.admission.pod_security

# Bad - flat naming without hierarchy
# package pod_security

# Good - domain-specific package
package aws.s3.encryption

# Good - shared library package
package lib.kubernetes.helpers
```

### Kubernetes Admission Policies

```rego
# policies/kubernetes/admission/pod_security.rego
# @module pod_security
# @description Kubernetes pod security admission policies
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15

package kubernetes.admission.pod_security

import rego.v1

# Deny pods running as root
deny contains msg if {
    input.request.kind.kind == "Pod"
    some container in input.request.object.spec.containers
    not container.securityContext.runAsNonRoot
    msg := sprintf(
        "Container '%s' must not run as root. Set securityContext.runAsNonRoot=true",
        [container.name]
    )
}

# Deny privileged containers
deny contains msg if {
    input.request.kind.kind == "Pod"
    some container in input.request.object.spec.containers
    container.securityContext.privileged == true
    msg := sprintf(
        "Container '%s' must not be privileged",
        [container.name]
    )
}

# Deny containers without resource limits
deny contains msg if {
    input.request.kind.kind == "Pod"
    some container in input.request.object.spec.containers
    not container.resources.limits.memory
    msg := sprintf(
        "Container '%s' must have memory limits defined",
        [container.name]
    )
}

deny contains msg if {
    input.request.kind.kind == "Pod"
    some container in input.request.object.spec.containers
    not container.resources.limits.cpu
    msg := sprintf(
        "Container '%s' must have CPU limits defined",
        [container.name]
    )
}

# Deny hostNetwork usage
deny contains msg if {
    input.request.kind.kind == "Pod"
    input.request.object.spec.hostNetwork == true
    msg := "Pods must not use hostNetwork"
}

# Deny hostPID usage
deny contains msg if {
    input.request.kind.kind == "Pod"
    input.request.object.spec.hostPID == true
    msg := "Pods must not use hostPID"
}

# Deny hostIPC usage
deny contains msg if {
    input.request.kind.kind == "Pod"
    input.request.object.spec.hostIPC == true
    msg := "Pods must not use hostIPC"
}
```

### Container Image Policies

```rego
# policies/kubernetes/admission/container_images.rego
# @module container_images
# @description Container image validation policies
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15

package kubernetes.admission.container_images

import rego.v1

import data.approved_registries

# Default approved registries if data not provided
default_approved_registries := [
    "gcr.io/company-project",
    "docker.io/company",
    "ghcr.io/company",
    "123456789.dkr.ecr.us-east-1.amazonaws.com"
]

# Get registries from data or use defaults
registries := object.get(data, "approved_registries", default_approved_registries)

# Deny images from unapproved registries
deny contains msg if {
    input.request.kind.kind == "Pod"
    some container in input.request.object.spec.containers
    image := container.image
    not image_from_approved_registry(image)
    msg := sprintf(
        "Container image '%s' is not from an approved registry. Approved: %v",
        [image, registries]
    )
}

# Deny images without explicit tags
deny contains msg if {
    input.request.kind.kind == "Pod"
    some container in input.request.object.spec.containers
    image := container.image
    not contains(image, "@sha256:")
    not has_version_tag(image)
    msg := sprintf(
        "Container image '%s' must use explicit version tag or digest, not 'latest'",
        [image]
    )
}

# Deny images with 'latest' tag
deny contains msg if {
    input.request.kind.kind == "Pod"
    some container in input.request.object.spec.containers
    image := container.image
    endswith(image, ":latest")
    msg := sprintf(
        "Container image '%s' must not use 'latest' tag",
        [image]
    )
}

# Helper: check if image is from approved registry
image_from_approved_registry(image) if {
    some registry in registries
    startswith(image, registry)
}

# Helper: check if image has version tag
has_version_tag(image) if {
    parts := split(image, ":")
    count(parts) == 2
    tag := parts[1]
    tag != "latest"
    re_match(`^v?\d+\.\d+`, tag)
}
```

### Network Policy Enforcement

```rego
# policies/kubernetes/admission/network_policy.rego
# @module network_policy
# @description Network policy enforcement for Kubernetes
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15

package kubernetes.admission.network_policy

import rego.v1

# Namespaces that require network policies
protected_namespaces := [
    "production",
    "staging",
    "pci-workloads",
    "hipaa-workloads"
]

# Deny deployments in protected namespaces without network policy
deny contains msg if {
    input.request.kind.kind == "Deployment"
    namespace := input.request.namespace
    namespace in protected_namespaces
    not has_network_policy(namespace, input.request.object.metadata.name)
    msg := sprintf(
        "Deployment '%s' in namespace '%s' requires a NetworkPolicy",
        [input.request.object.metadata.name, namespace]
    )
}

# Check for existing network policy
has_network_policy(namespace, app_name) if {
    # This would query existing network policies
    # In practice, use data.kubernetes.networkpolicies
    some policy in data.kubernetes.networkpolicies[namespace]
    policy.spec.podSelector.matchLabels.app == app_name
}

# Deny network policies with allow-all ingress
deny contains msg if {
    input.request.kind.kind == "NetworkPolicy"
    not input.request.object.spec.ingress
    msg := "NetworkPolicy must define explicit ingress rules, not allow-all"
}

deny contains msg if {
    input.request.kind.kind == "NetworkPolicy"
    some rule in input.request.object.spec.ingress
    count(rule) == 0
    msg := "NetworkPolicy ingress rules must not be empty (allow-all)"
}

# Warn on overly permissive egress
warn contains msg if {
    input.request.kind.kind == "NetworkPolicy"
    not input.request.object.spec.egress
    msg := "NetworkPolicy should define explicit egress rules"
}
```

### RBAC Policy Enforcement

```rego
# policies/kubernetes/rbac/role_restrictions.rego
# @module role_restrictions
# @description RBAC policy restrictions for Kubernetes
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15

package kubernetes.rbac.restrictions

import rego.v1

# Dangerous permissions that require review
dangerous_permissions := [
    {"resources": ["secrets"], "verbs": ["*"]},
    {"resources": ["*"], "verbs": ["*"]},
    {"resources": ["pods/exec"], "verbs": ["create"]},
    {"resources": ["clusterroles"], "verbs": ["bind"]},
    {"resources": ["roles"], "verbs": ["escalate"]}
]

# Deny ClusterRoleBindings to cluster-admin
deny contains msg if {
    input.request.kind.kind == "ClusterRoleBinding"
    input.request.object.roleRef.name == "cluster-admin"
    msg := "ClusterRoleBinding to cluster-admin is prohibited"
}

# Deny creation of overly permissive ClusterRoles
deny contains msg if {
    input.request.kind.kind == "ClusterRole"
    some rule in input.request.object.rules
    is_dangerous_permission(rule)
    msg := sprintf(
        "ClusterRole '%s' contains dangerous permissions: resources=%v, verbs=%v",
        [input.request.object.metadata.name, rule.resources, rule.verbs]
    )
}

# Deny wildcards in production namespaces
deny contains msg if {
    input.request.kind.kind == "Role"
    input.request.namespace == "production"
    some rule in input.request.object.rules
    "*" in rule.verbs
    msg := "Wildcard verbs are not allowed in production namespace"
}

deny contains msg if {
    input.request.kind.kind == "Role"
    input.request.namespace == "production"
    some rule in input.request.object.rules
    "*" in rule.resources
    msg := "Wildcard resources are not allowed in production namespace"
}

# Helper function to check dangerous permissions
is_dangerous_permission(rule) if {
    some perm in dangerous_permissions
    resources_match(rule.resources, perm.resources)
    verbs_match(rule.verbs, perm.verbs)
}

resources_match(actual, dangerous) if {
    some r in dangerous
    r in actual
}

resources_match(actual, dangerous) if {
    "*" in actual
}

verbs_match(actual, dangerous) if {
    some v in dangerous
    v in actual
}

verbs_match(actual, dangerous) if {
    "*" in actual
}
```

### AWS Terraform Policy

```rego
# policies/terraform/aws/s3_encryption.rego
# @module s3_encryption
# @description S3 bucket encryption enforcement for Terraform
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15

package terraform.aws.s3

import rego.v1

# Deny S3 buckets without encryption
deny contains msg if {
    some resource in input.resource_changes
    resource.type == "aws_s3_bucket"
    resource.change.after.server_side_encryption_configuration == null
    msg := sprintf(
        "S3 bucket '%s' must have server-side encryption enabled",
        [resource.address]
    )
}

# Deny S3 buckets without versioning
deny contains msg if {
    some resource in input.resource_changes
    resource.type == "aws_s3_bucket_versioning"
    resource.change.after.versioning_configuration[0].status != "Enabled"
    msg := sprintf(
        "S3 bucket versioning '%s' must be enabled",
        [resource.address]
    )
}

# Deny public S3 buckets
deny contains msg if {
    some resource in input.resource_changes
    resource.type == "aws_s3_bucket_public_access_block"
    config := resource.change.after
    not config.block_public_acls
    msg := sprintf(
        "S3 bucket '%s' must block public ACLs",
        [resource.address]
    )
}

deny contains msg if {
    some resource in input.resource_changes
    resource.type == "aws_s3_bucket_public_access_block"
    config := resource.change.after
    not config.block_public_policy
    msg := sprintf(
        "S3 bucket '%s' must block public policy",
        [resource.address]
    )
}

# Require S3 buckets have logging enabled
warn contains msg if {
    some resource in input.resource_changes
    resource.type == "aws_s3_bucket"
    not has_logging_configuration(resource.address)
    msg := sprintf(
        "S3 bucket '%s' should have access logging enabled",
        [resource.address]
    )
}

has_logging_configuration(bucket_address) if {
    some resource in input.resource_changes
    resource.type == "aws_s3_bucket_logging"
    contains(resource.address, bucket_address)
}
```

### Security Group Policy

```rego
# policies/terraform/aws/security_groups.rego
# @module security_groups
# @description Security group policy enforcement for Terraform
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15

package terraform.aws.security_groups

import rego.v1

# Restricted ports that should never be open to the internet
restricted_ports := [22, 3389, 3306, 5432, 27017, 6379, 11211]

# Deny security groups with unrestricted ingress on restricted ports
deny contains msg if {
    some resource in input.resource_changes
    resource.type == "aws_security_group_rule"
    resource.change.after.type == "ingress"
    port := resource.change.after.from_port
    port in restricted_ports
    is_unrestricted_cidr(resource.change.after.cidr_blocks)
    msg := sprintf(
        "Security group rule '%s' allows unrestricted access to port %d",
        [resource.address, port]
    )
}

# Deny security groups with 0.0.0.0/0 on any port range
deny contains msg if {
    some resource in input.resource_changes
    resource.type == "aws_security_group"
    some ingress in resource.change.after.ingress
    is_unrestricted_cidr(ingress.cidr_blocks)
    ingress.from_port != ingress.to_port
    msg := sprintf(
        "Security group '%s' allows unrestricted access to port range %d-%d",
        [resource.address, ingress.from_port, ingress.to_port]
    )
}

# Deny security groups without descriptions
deny contains msg if {
    some resource in input.resource_changes
    resource.type == "aws_security_group"
    description := object.get(resource.change.after, "description", "")
    description == ""
    msg := sprintf(
        "Security group '%s' must have a description",
        [resource.address]
    )
}

# Warn on overly broad egress rules
warn contains msg if {
    some resource in input.resource_changes
    resource.type == "aws_security_group"
    some egress in resource.change.after.egress
    is_unrestricted_cidr(egress.cidr_blocks)
    egress.from_port == 0
    egress.to_port == 65535
    msg := sprintf(
        "Security group '%s' has overly broad egress rules",
        [resource.address]
    )
}

# Helper to check for unrestricted CIDR
is_unrestricted_cidr(cidrs) if {
    "0.0.0.0/0" in cidrs
}

is_unrestricted_cidr(cidrs) if {
    "::/0" in cidrs
}
```

### OPA Policy Unit Tests

```rego
# policies/kubernetes/admission/pod_security_test.rego
# @module pod_security_test
# @description Unit tests for pod security policies
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15

package kubernetes.admission.pod_security_test

import rego.v1

import data.kubernetes.admission.pod_security

# Test: should deny pod running as root
test_deny_root_container if {
    result := pod_security.deny with input as {
        "request": {
            "kind": {"kind": "Pod"},
            "object": {
                "spec": {
                    "containers": [{
                        "name": "app",
                        "securityContext": {"runAsNonRoot": false}
                    }]
                }
            }
        }
    }
    count(result) > 0
}

# Test: should allow pod with runAsNonRoot=true
test_allow_non_root_container if {
    result := pod_security.deny with input as {
        "request": {
            "kind": {"kind": "Pod"},
            "object": {
                "spec": {
                    "containers": [{
                        "name": "app",
                        "securityContext": {"runAsNonRoot": true}
                    }]
                }
            }
        }
    }
    count(result) == 0
}

# Test: should deny privileged container
test_deny_privileged_container if {
    result := pod_security.deny with input as {
        "request": {
            "kind": {"kind": "Pod"},
            "object": {
                "spec": {
                    "containers": [{
                        "name": "app",
                        "securityContext": {
                            "runAsNonRoot": true,
                            "privileged": true
                        }
                    }]
                }
            }
        }
    }
    count(result) > 0
}

# Test: should deny container without memory limits
test_deny_missing_memory_limits if {
    result := pod_security.deny with input as {
        "request": {
            "kind": {"kind": "Pod"},
            "object": {
                "spec": {
                    "containers": [{
                        "name": "app",
                        "securityContext": {"runAsNonRoot": true},
                        "resources": {"limits": {"cpu": "100m"}}
                    }]
                }
            }
        }
    }
    count(result) > 0
}

# Test: should allow properly configured container
test_allow_compliant_container if {
    result := pod_security.deny with input as {
        "request": {
            "kind": {"kind": "Pod"},
            "object": {
                "spec": {
                    "containers": [{
                        "name": "app",
                        "securityContext": {
                            "runAsNonRoot": true,
                            "privileged": false
                        },
                        "resources": {
                            "limits": {
                                "cpu": "100m",
                                "memory": "128Mi"
                            }
                        }
                    }]
                }
            }
        }
    }
    count(result) == 0
}

# Test: should deny hostNetwork
test_deny_host_network if {
    result := pod_security.deny with input as {
        "request": {
            "kind": {"kind": "Pod"},
            "object": {
                "spec": {
                    "hostNetwork": true,
                    "containers": [{
                        "name": "app",
                        "securityContext": {"runAsNonRoot": true},
                        "resources": {
                            "limits": {"cpu": "100m", "memory": "128Mi"}
                        }
                    }]
                }
            }
        }
    }
    count(result) > 0
}
```

---

## Terraform Sentinel Standards

### Policy Structure

```text
policies/
├── sentinel.hcl           # Policy configuration
├── common/
│   └── tfplan-functions/
│       └── tfplan-functions.sentinel
├── aws/
│   ├── require-s3-encryption.sentinel
│   ├── restrict-security-groups.sentinel
│   └── require-tags.sentinel
├── cost/
│   ├── limit-instance-size.sentinel
│   └── restrict-regions.sentinel
└── test/
    ├── require-s3-encryption/
    │   ├── pass.hcl
    │   ├── fail.hcl
    │   └── mock-tfplan.sentinel
    └── restrict-security-groups/
        ├── pass.hcl
        └── fail.hcl
```

### Sentinel Configuration

```hcl
# sentinel.hcl
# Sentinel policy configuration

policy "require-s3-encryption" {
  source            = "./aws/require-s3-encryption.sentinel"
  enforcement_level = "hard-mandatory"
}

policy "restrict-security-groups" {
  source            = "./aws/restrict-security-groups.sentinel"
  enforcement_level = "hard-mandatory"
}

policy "require-tags" {
  source            = "./aws/require-tags.sentinel"
  enforcement_level = "soft-mandatory"
}

policy "limit-instance-size" {
  source            = "./cost/limit-instance-size.sentinel"
  enforcement_level = "advisory"
}

policy "restrict-regions" {
  source            = "./cost/restrict-regions.sentinel"
  enforcement_level = "soft-mandatory"
}

module "tfplan-functions" {
  source = "./common/tfplan-functions/tfplan-functions.sentinel"
}
```

### S3 Encryption Policy

```hcl
# aws/require-s3-encryption.sentinel
# @module require-s3-encryption
# @description Ensures all S3 buckets have encryption enabled
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15

import "tfplan/v2" as tfplan

# Get all S3 bucket resources
s3_buckets = filter tfplan.resource_changes as _, rc {
    rc.type is "aws_s3_bucket" and
    (rc.change.actions contains "create" or rc.change.actions contains "update")
}

# Get all S3 bucket encryption configurations
s3_encryption_configs = filter tfplan.resource_changes as _, rc {
    rc.type is "aws_s3_bucket_server_side_encryption_configuration" and
    (rc.change.actions contains "create" or rc.change.actions contains "update")
}

# Check if bucket has encryption configuration
bucket_has_encryption = func(bucket_address) {
    return any s3_encryption_configs as _, config {
        # Extract bucket name from address
        config.change.after.bucket is not null
    }
}

# Main rule - all S3 buckets must have encryption
main = rule {
    all s3_buckets as _, bucket {
        bucket_has_encryption(bucket.address)
    }
}

# Output message for failures
print_violations = func() {
    for s3_buckets as address, bucket {
        if not bucket_has_encryption(address) {
            print("S3 bucket", address, "must have encryption enabled")
        }
    }
    return true
}

# Execute print on failure
validate = rule when not main {
    print_violations()
}
```

### Security Group Restriction Policy

```hcl
# aws/restrict-security-groups.sentinel
# @module restrict-security-groups
# @description Prevents unrestricted ingress on sensitive ports
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15

import "tfplan/v2" as tfplan
import "tfplan-functions" as plan

# Restricted ports that should never be open to the world
restricted_ports = [22, 3389, 3306, 5432, 27017, 6379]

# Get all security group rules
sg_rules = filter tfplan.resource_changes as _, rc {
    rc.type is "aws_security_group_rule" and
    rc.change.after.type is "ingress" and
    (rc.change.actions contains "create" or rc.change.actions contains "update")
}

# Get all security groups with inline rules
security_groups = filter tfplan.resource_changes as _, rc {
    rc.type is "aws_security_group" and
    (rc.change.actions contains "create" or rc.change.actions contains "update")
}

# Check if CIDR is unrestricted
is_unrestricted = func(cidr_blocks) {
    if cidr_blocks is null {
        return false
    }
    return cidr_blocks contains "0.0.0.0/0" or cidr_blocks contains "::/0"
}

# Check if port is in restricted list
is_restricted_port = func(from_port, to_port) {
    for restricted_ports as port {
        if from_port <= port and to_port >= port {
            return true
        }
    }
    return false
}

# Validate security group rules
valid_sg_rules = rule {
    all sg_rules as _, rule {
        not (is_unrestricted(rule.change.after.cidr_blocks) and
             is_restricted_port(rule.change.after.from_port, rule.change.after.to_port))
    }
}

# Validate inline security group ingress rules
valid_sg_inline = rule {
    all security_groups as _, sg {
        all sg.change.after.ingress else [] as ingress {
            not (is_unrestricted(ingress.cidr_blocks) and
                 is_restricted_port(ingress.from_port, ingress.to_port))
        }
    }
}

# Combined main rule
main = rule {
    valid_sg_rules and valid_sg_inline
}

# Print violations for debugging
print_violations = func() {
    for sg_rules as address, rule {
        if is_unrestricted(rule.change.after.cidr_blocks) and
           is_restricted_port(rule.change.after.from_port, rule.change.after.to_port) {
            print("Security group rule", address, "has unrestricted access to port",
                  rule.change.after.from_port)
        }
    }
    return true
}
```

### Resource Tagging Policy

```hcl
# aws/require-tags.sentinel
# @module require-tags
# @description Ensures all resources have required tags
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15

import "tfplan/v2" as tfplan

# Required tags for all resources
required_tags = ["Environment", "Owner", "CostCenter", "Project"]

# Resource types that support tags
taggable_resources = [
    "aws_instance",
    "aws_s3_bucket",
    "aws_rds_instance",
    "aws_vpc",
    "aws_subnet",
    "aws_security_group",
    "aws_lambda_function",
    "aws_dynamodb_table",
    "aws_sqs_queue",
    "aws_sns_topic",
    "aws_ecs_cluster",
    "aws_ecs_service",
    "aws_eks_cluster",
    "aws_elasticache_cluster",
]

# Get all taggable resources being created or updated
resources = filter tfplan.resource_changes as _, rc {
    rc.type in taggable_resources and
    (rc.change.actions contains "create" or rc.change.actions contains "update")
}

# Check if resource has all required tags
has_required_tags = func(resource) {
    tags = resource.change.after.tags else {}
    if tags is null {
        return false
    }
    for required_tags as tag {
        if tag not in keys(tags) {
            return false
        }
        if tags[tag] is "" or tags[tag] is null {
            return false
        }
    }
    return true
}

# Main rule
main = rule {
    all resources as _, resource {
        has_required_tags(resource)
    }
}

# Print missing tags for debugging
print_missing_tags = func() {
    for resources as address, resource {
        tags = resource.change.after.tags else {}
        for required_tags as tag {
            if tag not in keys(tags) or tags[tag] is "" {
                print("Resource", address, "is missing required tag:", tag)
            }
        }
    }
    return true
}

# Execute on failure
validate = rule when not main {
    print_missing_tags()
}
```

### Instance Size Limit Policy

```hcl
# cost/limit-instance-size.sentinel
# @module limit-instance-size
# @description Limits EC2 instance sizes for cost control
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15

import "tfplan/v2" as tfplan

# Allowed instance types by environment
allowed_instances = {
    "development": [
        "t3.micro",
        "t3.small",
        "t3.medium",
    ],
    "staging": [
        "t3.micro",
        "t3.small",
        "t3.medium",
        "t3.large",
        "m5.large",
    ],
    "production": [
        "t3.small",
        "t3.medium",
        "t3.large",
        "t3.xlarge",
        "m5.large",
        "m5.xlarge",
        "m5.2xlarge",
        "r5.large",
        "r5.xlarge",
    ],
}

# Prohibited instance types (very expensive)
prohibited_instances = [
    "p3.16xlarge",
    "p4d.24xlarge",
    "x1e.32xlarge",
    "x2idn.32xlarge",
    "u-6tb1.metal",
    "u-12tb1.metal",
]

# Get all EC2 instances
ec2_instances = filter tfplan.resource_changes as _, rc {
    rc.type is "aws_instance" and
    (rc.change.actions contains "create" or rc.change.actions contains "update")
}

# Get environment from tags or default to development
get_environment = func(instance) {
    tags = instance.change.after.tags else {}
    return tags["Environment"] else "development"
}

# Check if instance type is allowed for environment
instance_type_allowed = func(instance) {
    instance_type = instance.change.after.instance_type
    environment = get_environment(instance)

    # Always deny prohibited instances
    if instance_type in prohibited_instances {
        return false
    }

    # Check environment-specific allowlist
    if environment in keys(allowed_instances) {
        return instance_type in allowed_instances[environment]
    }

    # Default to development restrictions
    return instance_type in allowed_instances["development"]
}

# Main rule
main = rule {
    all ec2_instances as _, instance {
        instance_type_allowed(instance)
    }
}

# Print violations
print_violations = func() {
    for ec2_instances as address, instance {
        if not instance_type_allowed(instance) {
            environment = get_environment(instance)
            print("Instance", address, "type",
                  instance.change.after.instance_type,
                  "is not allowed for environment", environment)
        }
    }
    return true
}
```

### Region Restriction Policy

```hcl
# cost/restrict-regions.sentinel
# @module restrict-regions
# @description Restricts resources to approved AWS regions
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-01-15

import "tfplan/v2" as tfplan
import "tfrun"

# Approved regions
approved_regions = [
    "us-east-1",
    "us-west-2",
    "eu-west-1",
    "eu-central-1",
]

# Get configured region from tfrun
configured_region = tfrun.workspace.metadata.configuration_version.provider_config.aws.config.region else ""

# Main rule - workspace must be in approved region
main = rule {
    configured_region in approved_regions
}

# Print message for invalid region
print_violation = rule when not main {
    print("Region", configured_region, "is not in approved list:", approved_regions)
}
```

### Sentinel Test Configuration

```hcl
# test/require-s3-encryption/pass.hcl
# Test case: S3 bucket with encryption passes

mock "tfplan/v2" {
  module {
    source = "./mock-tfplan-pass.sentinel"
  }
}

test {
  rules = {
    main = true
  }
}
```

```hcl
# test/require-s3-encryption/fail.hcl
# Test case: S3 bucket without encryption fails

mock "tfplan/v2" {
  module {
    source = "./mock-tfplan-fail.sentinel"
  }
}

test {
  rules = {
    main = false
  }
}
```

```hcl
# test/require-s3-encryption/mock-tfplan-pass.sentinel
# Mock data for passing test

resource_changes = {
    "aws_s3_bucket.example": {
        "address": "aws_s3_bucket.example",
        "type": "aws_s3_bucket",
        "change": {
            "actions": ["create"],
            "after": {
                "bucket": "my-encrypted-bucket",
            },
        },
    },
    "aws_s3_bucket_server_side_encryption_configuration.example": {
        "address": "aws_s3_bucket_server_side_encryption_configuration.example",
        "type": "aws_s3_bucket_server_side_encryption_configuration",
        "change": {
            "actions": ["create"],
            "after": {
                "bucket": "my-encrypted-bucket",
                "rule": [{
                    "apply_server_side_encryption_by_default": [{
                        "sse_algorithm": "aws:kms",
                    }],
                }],
            },
        },
    },
}
```

---

## CI/CD Integration

### GitHub Actions InSpec Workflow

```yaml
# .github/workflows/inspec-compliance.yml
name: InSpec Compliance

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * *'

jobs:
  compliance-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'
          bundler-cache: true

      - name: Install InSpec
        run: |
          gem install inspec-bin
          inspec version

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - name: Run AWS compliance scan
        run: |
          inspec exec profiles/aws-cis-baseline \
            --target aws:// \
            --reporter cli json:results/aws-compliance.json \
            --waiver-file waivers.yml

      - name: Upload compliance results
        uses: actions/upload-artifact@v4
        with:
          name: inspec-results
          path: results/

      - name: Check compliance status
        run: |
          python scripts/check_compliance.py results/aws-compliance.json

      - name: Fail on critical findings
        if: failure()
        run: |
          echo "Critical compliance findings detected"
          exit 1
```

### OPA Conftest Integration

```yaml
# .github/workflows/opa-validation.yml
name: OPA Policy Validation

on:
  push:
    paths:
      - '**.tf'
      - '**.yaml'
      - '**.yml'
      - 'policies/**'
  pull_request:
    paths:
      - '**.tf'
      - '**.yaml'
      - '**.yml'
      - 'policies/**'

jobs:
  policy-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup OPA
        uses: open-policy-agent/setup-opa@v2
        with:
          version: latest

      - name: Run OPA unit tests
        run: |
          opa test policies/ -v

      - name: Install Conftest
        run: |
          wget -q https://github.com/open-policy-agent/conftest/releases/download/v0.50.0/conftest_0.50.0_Linux_x86_64.tar.gz
          tar xzf conftest_0.50.0_Linux_x86_64.tar.gz
          sudo mv conftest /usr/local/bin/

      - name: Validate Kubernetes manifests
        run: |
          conftest test kubernetes/*.yaml \
            --policy policies/kubernetes/ \
            --output json > results/kubernetes-policy.json
        continue-on-error: true

      - name: Validate Terraform configs
        run: |
          conftest test terraform/*.tf \
            --policy policies/terraform/ \
            --output json > results/terraform-policy.json
        continue-on-error: true

      - name: Upload policy results
        uses: actions/upload-artifact@v4
        with:
          name: policy-results
          path: results/

      - name: Check for policy violations
        run: |
          if jq -e '.[] | select(.failures | length > 0)' results/*.json > /dev/null 2>&1; then
            echo "Policy violations found"
            jq '.[] | select(.failures | length > 0)' results/*.json
            exit 1
          fi
```

### Terraform Plan with OPA

```yaml
# .github/workflows/terraform-opa.yml
name: Terraform with OPA

on:
  pull_request:
    paths:
      - 'terraform/**'

jobs:
  terraform-plan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.7.0
          terraform_wrapper: false

      - name: Setup OPA
        uses: open-policy-agent/setup-opa@v2

      - name: Terraform Init
        working-directory: terraform
        run: terraform init

      - name: Terraform Plan
        working-directory: terraform
        run: |
          terraform plan -out=tfplan
          terraform show -json tfplan > tfplan.json

      - name: Run OPA against Terraform plan
        run: |
          opa eval \
            --data policies/terraform/ \
            --input terraform/tfplan.json \
            --format pretty \
            "data.terraform.aws.s3.deny" \
            "data.terraform.aws.security_groups.deny"

      - name: Check for violations
        run: |
          VIOLATIONS=$(opa eval \
            --data policies/terraform/ \
            --input terraform/tfplan.json \
            --format json \
            "data.terraform.aws.s3.deny" | jq -r '.result[0].expressions[0].value | length')

          if [ "$VIOLATIONS" -gt 0 ]; then
            echo "Policy violations found in Terraform plan"
            exit 1
          fi
```

### Kubernetes Admission Controller

```yaml
# kubernetes/opa-gatekeeper.yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          type: object
          properties:
            labels:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredlabels

        import rego.v1

        violation contains {"msg": msg, "details": {"missing_labels": missing}} if {
          provided := {label | input.review.object.metadata.labels[label]}
          required := {label | label := input.parameters.labels[_]}
          missing := required - provided
          count(missing) > 0
          msg := sprintf("Missing required labels: %v", [missing])
        }
---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: require-team-label
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Namespace"]
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
  parameters:
    labels:
      - "team"
      - "environment"
      - "app"
```

---

## Compliance Framework Mapping

### CIS Benchmark Mapping

```ruby
# profiles/cis-aws-foundations/controls/iam.rb
# CIS AWS Foundations Benchmark - IAM Controls

# CIS 1.1 - Avoid the use of root account
control 'cis-aws-1.1' do
  impact 1.0
  title 'Avoid the use of root account'
  desc 'The root account has unrestricted access. Avoid using it for daily tasks.'

  tag cis_benchmark: 'CIS AWS Foundations'
  tag cis_version: '1.4.0'
  tag cis_control: '1.1'
  tag cis_level: 1
  tag nist: ['AC-2', 'AC-6']
  tag pci_dss: ['7.1', '7.2']
  tag hipaa: ['164.312(a)(1)']
  tag soc2: ['CC6.1', 'CC6.2']

  describe aws_iam_root_user do
    it { should have_mfa_enabled }
    it { should_not have_access_key }
  end
end

# CIS 1.4 - Ensure access keys are rotated every 90 days or less
control 'cis-aws-1.4' do
  impact 0.7
  title 'Ensure access keys are rotated every 90 days or less'

  tag cis_benchmark: 'CIS AWS Foundations'
  tag cis_version: '1.4.0'
  tag cis_control: '1.4'
  tag cis_level: 1
  tag nist: ['AC-2']

  aws_iam_access_keys.entries.each do |key|
    describe "Access key #{key.access_key_id} for user #{key.username}" do
      subject { key }
      its('created_days_ago') { should be <= 90 }
    end
  end
end

# CIS 1.5 - Ensure IAM password policy requires at least one uppercase letter
control 'cis-aws-1.5' do
  impact 0.5
  title 'Ensure IAM password policy requires uppercase'

  tag cis_benchmark: 'CIS AWS Foundations'
  tag cis_control: '1.5'
  tag cis_level: 1

  describe aws_iam_password_policy do
    its('require_uppercase_characters') { should be true }
  end
end

# CIS 1.6 - Ensure IAM password policy requires at least one lowercase letter
control 'cis-aws-1.6' do
  impact 0.5
  title 'Ensure IAM password policy requires lowercase'

  tag cis_benchmark: 'CIS AWS Foundations'
  tag cis_control: '1.6'
  tag cis_level: 1

  describe aws_iam_password_policy do
    its('require_lowercase_characters') { should be true }
  end
end

# CIS 1.7 - Ensure IAM password policy requires at least one symbol
control 'cis-aws-1.7' do
  impact 0.5
  title 'Ensure IAM password policy requires symbols'

  tag cis_benchmark: 'CIS AWS Foundations'
  tag cis_control: '1.7'
  tag cis_level: 1

  describe aws_iam_password_policy do
    its('require_symbols') { should be true }
  end
end

# CIS 1.8 - Ensure IAM password policy requires at least one number
control 'cis-aws-1.8' do
  impact 0.5
  title 'Ensure IAM password policy requires numbers'

  tag cis_benchmark: 'CIS AWS Foundations'
  tag cis_control: '1.8'
  tag cis_level: 1

  describe aws_iam_password_policy do
    its('require_numbers') { should be true }
  end
end

# CIS 1.9 - Ensure IAM password policy requires minimum length of 14 or greater
control 'cis-aws-1.9' do
  impact 1.0
  title 'Ensure IAM password policy requires minimum length of 14'

  tag cis_benchmark: 'CIS AWS Foundations'
  tag cis_control: '1.9'
  tag cis_level: 1

  describe aws_iam_password_policy do
    its('minimum_password_length') { should be >= 14 }
  end
end

# CIS 1.10 - Ensure IAM password policy prevents password reuse
control 'cis-aws-1.10' do
  impact 0.7
  title 'Ensure IAM password policy prevents password reuse'

  tag cis_benchmark: 'CIS AWS Foundations'
  tag cis_control: '1.10'
  tag cis_level: 1

  describe aws_iam_password_policy do
    its('password_reuse_prevention') { should be >= 24 }
  end
end
```

### PCI-DSS Mapping

```ruby
# profiles/pci-dss/controls/requirement_2.rb
# PCI-DSS Requirement 2: Do not use vendor-supplied defaults

# Requirement 2.1 - Change vendor-supplied defaults
control 'pci-dss-2.1' do
  impact 1.0
  title 'Change vendor-supplied defaults before system installation'

  tag pci_dss: 'Requirement 2.1'
  tag pci_dss_version: '3.2.1'
  tag cis_controls: ['5.1']
  tag nist: ['CM-6', 'CM-7']

  # SSH should not use default port
  describe port(22) do
    it { should_not be_listening }
  end

  # Check for non-default SSH port
  describe sshd_config do
    its('Port') { should_not eq 22 }
  end
end

# Requirement 2.2 - Configuration standards
control 'pci-dss-2.2' do
  impact 1.0
  title 'Develop configuration standards for all system components'

  tag pci_dss: 'Requirement 2.2'

  # Primary function only
  describe service('telnet') do
    it { should_not be_installed }
  end

  describe service('rsh-server') do
    it { should_not be_installed }
  end
end

# Requirement 2.2.2 - Enable only necessary services
control 'pci-dss-2.2.2' do
  impact 1.0
  title 'Enable only necessary services, protocols, daemons'

  tag pci_dss: 'Requirement 2.2.2'

  unnecessary_services = %w[
    cups
    avahi-daemon
    nfs
    rpcbind
    bluetooth
  ]

  unnecessary_services.each do |svc|
    describe service(svc) do
      it { should_not be_running }
      it { should_not be_enabled }
    end
  end
end

# Requirement 2.2.4 - Configure security parameters
control 'pci-dss-2.2.4' do
  impact 1.0
  title 'Configure system security parameters'

  tag pci_dss: 'Requirement 2.2.4'

  describe kernel_parameter('net.ipv4.ip_forward') do
    its('value') { should eq 0 }
  end

  describe kernel_parameter('net.ipv4.conf.all.accept_redirects') do
    its('value') { should eq 0 }
  end

  describe kernel_parameter('net.ipv4.conf.all.send_redirects') do
    its('value') { should eq 0 }
  end
end

# Requirement 2.3 - Encrypt non-console admin access
control 'pci-dss-2.3' do
  impact 1.0
  title 'Encrypt all non-console administrative access'

  tag pci_dss: 'Requirement 2.3'

  describe sshd_config do
    its('Protocol') { should cmp 2 }
    its('Ciphers') { should_not match(/3des|arcfour|blowfish/) }
  end
end
```

### HIPAA Mapping

```ruby
# profiles/hipaa/controls/access_controls.rb
# HIPAA Security Rule - Access Controls

# 164.312(a)(1) - Access Control
control 'hipaa-164.312(a)(1)' do
  impact 1.0
  title 'Implement access controls for ePHI systems'

  tag hipaa: '164.312(a)(1)'
  tag hipaa_section: 'Technical Safeguards'
  tag hipaa_standard: 'Access Control'
  tag nist: ['AC-2', 'AC-3']

  # Unique user identification
  describe passwd.where { user == 'root' } do
    its('entries.length') { should eq 1 }
  end

  # No shared accounts
  describe shadow.where { password != '*' && password != '!' } do
    its('users') { should_not include 'shared' }
    its('users') { should_not include 'generic' }
  end
end

# 164.312(a)(2)(i) - Unique User Identification
control 'hipaa-164.312(a)(2)(i)' do
  impact 1.0
  title 'Assign unique user identification'

  tag hipaa: '164.312(a)(2)(i)'
  tag hipaa_standard: 'Unique User Identification'

  # All users should have unique UIDs
  user_uids = {}
  passwd.entries.each do |user|
    if user_uids.key?(user.uid)
      describe "User #{user.user} UID #{user.uid}" do
        it { should_not eq user_uids[user.uid] }
      end
    end
    user_uids[user.uid] = user.user
  end
end

# 164.312(a)(2)(iii) - Automatic Logoff
control 'hipaa-164.312(a)(2)(iii)' do
  impact 0.7
  title 'Implement automatic logoff'

  tag hipaa: '164.312(a)(2)(iii)'
  tag hipaa_standard: 'Automatic Logoff'

  describe sshd_config do
    its('ClientAliveInterval') { should cmp <= 300 }
    its('ClientAliveCountMax') { should cmp <= 0 }
  end

  describe file('/etc/profile.d/tmout.sh') do
    it { should exist }
    its('content') { should match(/TMOUT=\d+/) }
  end
end

# 164.312(a)(2)(iv) - Encryption and Decryption
control 'hipaa-164.312(a)(2)(iv)' do
  impact 1.0
  title 'Implement encryption mechanism for ePHI'

  tag hipaa: '164.312(a)(2)(iv)'
  tag hipaa_standard: 'Encryption and Decryption'

  # Disk encryption
  describe command('lsblk -o NAME,FSTYPE,MOUNTPOINT | grep crypt') do
    its('stdout') { should_not be_empty }
  end

  # TLS for network communications
  describe ssl_certificate(host: 'localhost', port: 443) do
    it { should exist }
    its('protocol') { should match(/TLSv1\.[23]/) }
  end
end

# 164.312(b) - Audit Controls
control 'hipaa-164.312(b)' do
  impact 1.0
  title 'Implement audit controls for ePHI access'

  tag hipaa: '164.312(b)'
  tag hipaa_section: 'Technical Safeguards'
  tag hipaa_standard: 'Audit Controls'

  describe service('auditd') do
    it { should be_installed }
    it { should be_enabled }
    it { should be_running }
  end

  describe auditd_conf do
    its('space_left_action') { should eq 'SYSLOG' }
    its('admin_space_left_action') { should eq 'SUSPEND' }
    its('disk_full_action') { should eq 'SUSPEND' }
  end
end

# 164.312(c)(1) - Integrity Controls
control 'hipaa-164.312(c)(1)' do
  impact 1.0
  title 'Implement integrity controls for ePHI'

  tag hipaa: '164.312(c)(1)'
  tag hipaa_standard: 'Integrity'

  describe package('aide') do
    it { should be_installed }
  end

  describe file('/etc/aide.conf') do
    it { should exist }
  end
end

# 164.312(d) - Person or Entity Authentication
control 'hipaa-164.312(d)' do
  impact 1.0
  title 'Verify person or entity seeking access to ePHI'

  tag hipaa: '164.312(d)'
  tag hipaa_standard: 'Authentication'

  describe sshd_config do
    its('PubkeyAuthentication') { should eq 'yes' }
    its('PasswordAuthentication') { should eq 'no' }
  end

  describe pam('/etc/pam.d/common-auth') do
    its('lines') { should include(/pam_faillock/) }
  end
end
```

---

## Reporting and Dashboards

### InSpec JSON Reporter

```ruby
# scripts/compliance_report.rb
# Generate compliance report from InSpec JSON output

require 'json'
require 'erb'
require 'time'

class ComplianceReport
  def initialize(json_file)
    @data = JSON.parse(File.read(json_file))
    @results = parse_results
  end

  def parse_results
    {
      passed: [],
      failed: [],
      skipped: [],
      error: []
    }
  end

  def summary
    {
      total: @data['controls'].length,
      passed: count_by_status('passed'),
      failed: count_by_status('failed'),
      skipped: count_by_status('skipped'),
      score: calculate_score
    }
  end

  def count_by_status(status)
    @data['controls'].count { |c| c['results'].all? { |r| r['status'] == status } }
  end

  def calculate_score
    passed = count_by_status('passed')
    total = @data['controls'].length - count_by_status('skipped')
    return 0 if total.zero?
    ((passed.to_f / total) * 100).round(2)
  end

  def by_severity
    severity_map = { 'critical' => [], 'high' => [], 'medium' => [], 'low' => [] }
    @data['controls'].each do |control|
      impact = control['impact']
      severity = case impact
                 when 0.9..1.0 then 'critical'
                 when 0.7...0.9 then 'high'
                 when 0.4...0.7 then 'medium'
                 else 'low'
                 end
      if control['results'].any? { |r| r['status'] == 'failed' }
        severity_map[severity] << control
      end
    end
    severity_map
  end

  def to_html
    template = ERB.new(File.read('templates/report.html.erb'))
    template.result(binding)
  end

  def to_markdown
    template = ERB.new(File.read('templates/report.md.erb'))
    template.result(binding)
  end
end

# Usage
if __FILE__ == $PROGRAM_NAME
  report = ComplianceReport.new(ARGV[0])
  puts report.summary.to_json
end
```

### Compliance Dashboard YAML

```yaml
# monitoring/grafana/dashboards/compliance.yaml
apiVersion: 1
providers:
  - name: Compliance Dashboards
    folder: Compliance
    type: file
    options:
      path: /etc/grafana/dashboards/compliance

# Dashboard JSON
---
{
  "dashboard": {
    "title": "Compliance Overview",
    "tags": ["compliance", "security"],
    "panels": [
      {
        "title": "Overall Compliance Score",
        "type": "stat",
        "gridPos": { "x": 0, "y": 0, "w": 6, "h": 4 },
        "targets": [
          {
            "expr": "compliance_score_percentage",
            "legendFormat": "Score"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                { "value": 0, "color": "red" },
                { "value": 70, "color": "yellow" },
                { "value": 90, "color": "green" }
              ]
            },
            "unit": "percent"
          }
        }
      },
      {
        "title": "Controls by Status",
        "type": "piechart",
        "gridPos": { "x": 6, "y": 0, "w": 6, "h": 8 },
        "targets": [
          {
            "expr": "sum(compliance_controls_total) by (status)",
            "legendFormat": "{{status}}"
          }
        ]
      },
      {
        "title": "Failed Controls by Severity",
        "type": "bargauge",
        "gridPos": { "x": 12, "y": 0, "w": 6, "h": 8 },
        "targets": [
          {
            "expr": "sum(compliance_controls_failed) by (severity)",
            "legendFormat": "{{severity}}"
          }
        ]
      },
      {
        "title": "Compliance Trend",
        "type": "timeseries",
        "gridPos": { "x": 0, "y": 8, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "compliance_score_percentage",
            "legendFormat": "Compliance Score"
          }
        ]
      },
      {
        "title": "Framework Coverage",
        "type": "table",
        "gridPos": { "x": 12, "y": 8, "w": 12, "h": 8 },
        "targets": [
          {
            "expr": "compliance_framework_coverage",
            "format": "table"
          }
        ],
        "transformations": [
          {
            "id": "organize",
            "options": {
              "indexByName": {
                "framework": 0,
                "passed": 1,
                "failed": 2,
                "total": 3,
                "coverage": 4
              }
            }
          }
        ]
      }
    ]
  }
}
```

### Prometheus Metrics Exporter

```python
#!/usr/bin/env python3
# scripts/compliance_metrics_exporter.py
# Export InSpec results to Prometheus metrics

"""
@module compliance_metrics_exporter
@description Export compliance scan results to Prometheus
@version 1.0.0
@author Tyler Dukes
@last_updated 2025-01-15
"""

import json
import sys
from prometheus_client import Gauge, Counter, start_http_server
import time

# Define metrics
COMPLIANCE_SCORE = Gauge(
    'compliance_score_percentage',
    'Overall compliance score as percentage',
    ['profile', 'target']
)

CONTROLS_TOTAL = Gauge(
    'compliance_controls_total',
    'Total number of controls',
    ['profile', 'status']
)

CONTROLS_BY_SEVERITY = Gauge(
    'compliance_controls_by_severity',
    'Controls grouped by severity',
    ['profile', 'severity', 'status']
)

FRAMEWORK_COVERAGE = Gauge(
    'compliance_framework_coverage',
    'Coverage by compliance framework',
    ['framework', 'profile']
)

SCAN_DURATION = Gauge(
    'compliance_scan_duration_seconds',
    'Duration of compliance scan',
    ['profile']
)

LAST_SCAN_TIMESTAMP = Gauge(
    'compliance_last_scan_timestamp',
    'Timestamp of last compliance scan',
    ['profile']
)


def parse_inspec_json(filepath):
    """Parse InSpec JSON output file."""
    with open(filepath, 'r') as f:
        return json.load(f)


def calculate_severity(impact):
    """Calculate severity level from impact score."""
    if impact >= 0.9:
        return 'critical'
    elif impact >= 0.7:
        return 'high'
    elif impact >= 0.4:
        return 'medium'
    else:
        return 'low'


def extract_framework_tags(control):
    """Extract compliance framework tags from control."""
    frameworks = []
    tags = control.get('tags', {})
    framework_keys = ['cis_benchmark', 'pci_dss', 'hipaa', 'soc2', 'nist']
    for key in framework_keys:
        if key in tags:
            frameworks.append(key.upper().replace('_', '-'))
    return frameworks


def update_metrics(data):
    """Update Prometheus metrics from InSpec data."""
    profile_name = data.get('name', 'unknown')
    target = data.get('platform', {}).get('target', 'local')

    controls = data.get('controls', [])
    status_counts = {'passed': 0, 'failed': 0, 'skipped': 0, 'error': 0}
    severity_counts = {
        'critical': {'passed': 0, 'failed': 0},
        'high': {'passed': 0, 'failed': 0},
        'medium': {'passed': 0, 'failed': 0},
        'low': {'passed': 0, 'failed': 0}
    }
    framework_counts = {}

    for control in controls:
        results = control.get('results', [])
        impact = control.get('impact', 0.5)
        severity = calculate_severity(impact)

        # Determine overall status for this control
        if all(r.get('status') == 'passed' for r in results):
            status = 'passed'
        elif any(r.get('status') == 'failed' for r in results):
            status = 'failed'
        elif all(r.get('status') == 'skipped' for r in results):
            status = 'skipped'
        else:
            status = 'error'

        status_counts[status] += 1
        severity_counts[severity][status if status in ['passed', 'failed'] else 'failed'] += 1

        # Track framework coverage
        frameworks = extract_framework_tags(control)
        for framework in frameworks:
            if framework not in framework_counts:
                framework_counts[framework] = {'passed': 0, 'failed': 0}
            framework_counts[framework][status if status in ['passed', 'failed'] else 'failed'] += 1

    # Update status metrics
    for status, count in status_counts.items():
        CONTROLS_TOTAL.labels(profile=profile_name, status=status).set(count)

    # Update severity metrics
    for severity, counts in severity_counts.items():
        for status, count in counts.items():
            CONTROLS_BY_SEVERITY.labels(
                profile=profile_name,
                severity=severity,
                status=status
            ).set(count)

    # Calculate and update compliance score
    total_applicable = status_counts['passed'] + status_counts['failed']
    if total_applicable > 0:
        score = (status_counts['passed'] / total_applicable) * 100
    else:
        score = 0
    COMPLIANCE_SCORE.labels(profile=profile_name, target=target).set(score)

    # Update framework coverage
    for framework, counts in framework_counts.items():
        total = counts['passed'] + counts['failed']
        coverage = (counts['passed'] / total * 100) if total > 0 else 0
        FRAMEWORK_COVERAGE.labels(framework=framework, profile=profile_name).set(coverage)

    # Update scan metadata
    LAST_SCAN_TIMESTAMP.labels(profile=profile_name).set(time.time())

    duration = data.get('statistics', {}).get('duration', 0)
    SCAN_DURATION.labels(profile=profile_name).set(duration)


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: compliance_metrics_exporter.py <inspec_json_file> [port]")
        sys.exit(1)

    json_file = sys.argv[1]
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 9100

    # Start Prometheus HTTP server
    start_http_server(port)
    print(f"Serving metrics on port {port}")

    # Initial load
    data = parse_inspec_json(json_file)
    update_metrics(data)

    # Keep running and allow for file updates
    while True:
        time.sleep(60)
        try:
            data = parse_inspec_json(json_file)
            update_metrics(data)
        except Exception as e:
            print(f"Error updating metrics: {e}")


if __name__ == '__main__':
    main()
```

---

## Recommended Tools

### InSpec Tools

- **InSpec CLI**: Core compliance testing tool
  - Installation: `gem install inspec-bin`
  - Run: `inspec exec profile_path --target ssh://user@host`

- **InSpec Automate**: Enterprise compliance dashboard
  - Installation: Chef Automate deployment
  - Integration: `inspec exec . --reporter automate`

- **Kitchen-InSpec**: Test Kitchen integration
  - Installation: `gem install kitchen-inspec`
  - Configuration: `.kitchen.yml` with InSpec verifier

### OPA Tools

- **OPA CLI**: Policy engine and testing
  - Installation: `brew install opa` or binary download
  - Run: `opa eval --data policies/ --input input.json "data.policy.deny"`

- **Conftest**: Configuration file testing
  - Installation: `brew install conftest`
  - Run: `conftest test --policy policies/ config.yaml`

- **Gatekeeper**: Kubernetes admission controller
  - Installation: `kubectl apply -f gatekeeper.yaml`
  - Integration: Native Kubernetes admission webhooks

### Sentinel Tools

- **Sentinel CLI**: Policy testing
  - Installation: Download from HashiCorp
  - Run: `sentinel test`

- **Terraform Cloud**: Sentinel integration
  - Configuration: Policy sets in TFC organization
  - Integration: Automatic policy checks on runs

### IDE Extensions

- **VS Code InSpec Extension**: Syntax highlighting and snippets
- **VS Code OPA Extension**: Rego syntax and evaluation
- **VS Code Sentinel Extension**: Sentinel syntax highlighting

### Pre-commit Configuration

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/open-policy-agent/conftest
    rev: v0.50.0
    hooks:
      - id: conftest-verify
        args: ['--policy', 'policies/']
        files: \.(yaml|yml|json|tf)$

  - repo: local
    hooks:
      - id: opa-fmt
        name: OPA Format
        entry: opa fmt -w
        language: system
        files: \.rego$

      - id: opa-check
        name: OPA Check
        entry: opa check
        language: system
        files: \.rego$
        args: ['policies/']

      - id: inspec-check
        name: InSpec Check
        entry: inspec check
        language: system
        files: (controls/.*\.rb|inspec\.yml)$
        pass_filenames: false
        args: ['profiles/']
```

---

## Anti-Patterns to Avoid

### Overly Permissive Policies

```rego
# Bad - policy that allows everything
package kubernetes.admission

# This policy never denies anything
deny[msg] {
    false
    msg := "This will never trigger"
}
```

```rego
# Good - explicit allow with default deny
package kubernetes.admission

import rego.v1

default allow := false

allow if {
    input.request.kind.kind == "Pod"
    image := input.request.object.spec.containers[_].image
    startswith(image, "approved-registry.com/")
}

deny contains msg if {
    not allow
    msg := "Request denied by default policy"
}
```

### Hardcoded Values

```ruby
# Bad - hardcoded IP addresses and values
control 'network-01' do
  describe host('192.168.1.100') do
    it { should be_reachable }
  end
end
```

```ruby
# Good - use attributes for configurable values
control 'network-01' do
  allowed_hosts = attribute('allowed_hosts', default: [])

  allowed_hosts.each do |host_ip|
    describe host(host_ip) do
      it { should be_reachable }
    end
  end
end
```

### Missing Error Context

```rego
# Bad - vague error message
deny[msg] {
    input.request.kind.kind == "Pod"
    not valid_image
    msg := "Invalid image"
}
```

```rego
# Good - detailed error message with context
deny contains msg if {
    input.request.kind.kind == "Pod"
    some container in input.request.object.spec.containers
    image := container.image
    not image_from_approved_registry(image)
    msg := sprintf(
        "Container '%s' uses image '%s' which is not from an approved registry. Approved registries: %v",
        [container.name, image, data.approved_registries]
    )
}
```

### Untestable Policies

```hcl
# Bad - policy with no clear test cases
policy "check-something" {
  main = rule {
    # Complex nested logic that's hard to test
    all resources as _, r {
      some_complex_condition(r) or
      another_condition(r) or
      yet_another_condition(r)
    }
  }
}
```

```hcl
# Good - modular, testable policy
policy "check-encryption" {
  # Single responsibility - check encryption only
  main = rule {
    all s3_buckets as _, bucket {
      bucket_has_encryption(bucket)
    }
  }
}

# Separate helper that can be tested independently
bucket_has_encryption = func(bucket) {
  return bucket.change.after.server_side_encryption_configuration is not null
}
```

---

## References

### Official Documentation

- [InSpec Documentation](https://docs.chef.io/inspec/)
- [Open Policy Agent Documentation](https://www.openpolicyagent.org/docs/)
- [Terraform Sentinel Documentation](https://developer.hashicorp.com/sentinel/docs)
- [Conftest Documentation](https://www.conftest.dev/)
- [Gatekeeper Documentation](https://open-policy-agent.github.io/gatekeeper/)

### Compliance Frameworks

- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [PCI DSS Standards](https://www.pcisecuritystandards.org/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [SOC 2 Compliance](https://www.aicpa.org/soc)

### Community Resources

- [DevSec Hardening Framework](https://dev-sec.io/)
- [InSpec AWS Resource Pack](https://github.com/inspec/inspec-aws)
- [OPA Playground](https://play.openpolicyagent.org/)
- [Rego Style Guide](https://github.com/StyraInc/rego-style-guide)

### Related Guides

- [Terraform Style Guide](terraform.md)
- [Kubernetes Style Guide](kubernetes.md)
- [GitHub Actions Style Guide](github_actions.md)
- [Security Scanning Guide](../05_ci_cd/security_scanning_guide.md)

---

**Maintainer**: Tyler Dukes
