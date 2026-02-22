---
title: "Ansible Style Guide"
description: "Configuration management standards for Ansible playbooks and roles"
author: "Tyler Dukes"
tags: [ansible, configuration-management, automation, devops, collections]
category: "Language Guides"
status: "active"
search_keywords: [ansible, playbooks, roles, tasks, inventory, configuration management, automation, yaml, idempotent]
---

## Language Overview

**Ansible** is an agentless configuration management and automation platform that uses YAML-based
playbooks to define infrastructure as code. Modern Ansible development emphasizes collections
over standalone roles.

### Key Characteristics

- **Paradigm**: Declarative configuration management
- **Language**: YAML with Jinja2 templating
- **Architecture**: Agentless (SSH/WinRM)
- **Version Support**: Ansible 2.17.x through 2.19.x
- **Modern Approach**: Collections-first (not standalone roles)

### Primary Use Cases

- Configuration management
- Application deployment
- Infrastructure provisioning
- Security and compliance automation
- Orchestration and workflow automation

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Naming** | | | |
| Playbooks | `kebab-case.yml` | `deploy-app.yml`, `configure-server.yml` | Descriptive, lowercase |
| Roles | `snake_case` | `web_server`, `database_setup` | Lowercase with underscores |
| Variables | `snake_case` | `app_port`, `db_host` | Descriptive variable names |
| Collections | `namespace.collection` | `community.general`, `ansible.builtin` | Namespace required |
| **Structure** | | | |
| Collections | Use collections | `community.general.docker_container` | Modern approach |
| Playbook | YAML list of plays | `- name: Configure servers` | List of plays |
| Tasks | YAML task list | `- name: Install package` | Descriptive task names |
| **Files** | | | |
| Playbook | `playbook-name.yml` | `site.yml`, `deploy.yml` | Main playbooks |
| Inventory | `inventory.yml` or `hosts` | `inventory/production.yml` | Host definitions |
| Variables | `group_vars/`, `host_vars/` | `group_vars/webservers.yml` | Variable organization |
| Roles Dir | `roles/role_name/` | `roles/web_server/tasks/main.yml` | Standard role structure |
| **Best Practices** | | | |
| Idempotency | Always idempotent | Use `state: present` | Tasks can run multiple times |
| Task Names | Always name tasks | `name: Install Nginx` | Clear, descriptive names |
| Collections | Fully qualified | `ansible.builtin.copy` | Use FQCN (Fully Qualified Collection Name) |
| Variables | Prefix role vars | `rolename_variable` | Avoid collisions |
| **Syntax** | | | |
| Module Args | YAML dict | `state: present\n  name: nginx` | Key-value pairs |
| When | Conditional | `when: ansible_os_family == "Debian"` | Jinja2 conditions |
| Loop | `loop` keyword | `loop: "{{ users }}"` | Iterate over items |
| Handlers | Notify handlers | `notify: Restart nginx` | Triggered on changes |

---

## Collections-First Approach

**Use Ansible Collections** instead of standalone roles:

```yaml
## Good - Using collection
---
- name: Configure web servers
  hosts: webservers
  tasks:
    - name: Install nginx
      ansible.builtin.package:
        name: nginx
        state: present

    - name: Deploy website
      ansible.builtin.template:
        src: index.html.j2
        dest: /var/www/html/index.html

## Install collections from Ansible Galaxy
ansible-galaxy collection install community.general
ansible-galaxy collection install ansible.posix
```

### Collection Structure

```text
my_namespace.my_collection/
├── galaxy.yml
├── plugins/
│   ├── modules/
│   ├── inventory/
│   └── filter/
├── roles/
│   └── my_role/
│       ├── defaults/
│       ├── tasks/
│       ├── handlers/
│       └── meta/
└── playbooks/
```

---

## Playbook Structure

### Basic Playbook

```yaml
---
## @module web_server_deployment
## @description Deploy and configure nginx web servers
## @dependencies ansible.builtin, community.general
## @version 1.0.0
## @author Tyler Dukes
## @last_updated 2025-10-28

- name: Configure web servers
  hosts: webservers
  become: true
  vars:
    nginx_port: 80
    document_root: /var/www/html

  tasks:
    - name: Install nginx
      ansible.builtin.package:
        name: nginx
        state: present

    - name: Start and enable nginx
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true

    - name: Deploy website content
      ansible.builtin.copy:
        content: |
          <html><body><h1>Hello World</h1></body></html>
        dest: "{{ document_root }}/index.html"
        mode: '0644'
      notify: Reload nginx

  handlers:
    - name: Reload nginx
      ansible.builtin.service:
        name: nginx
        state: reloaded
```

### Multi-Play Playbook

```yaml
---
- name: Prepare database servers
  hosts: dbservers
  become: true
  tasks:
    - name: Install PostgreSQL
      ansible.builtin.package:
        name: postgresql-server
        state: present

- name: Configure application servers
  hosts: appservers
  become: true
  vars_files:
    - vars/app_config.yml
  tasks:
    - name: Deploy application
      ansible.builtin.include_role:
        name: my_namespace.my_collection.app_deployment

- name: Update load balancers
  hosts: loadbalancers
  become: true
  serial: 1
  tasks:
    - name: Update nginx configuration
      ansible.builtin.template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: Reload nginx
```

---

## Inventory Organization

### Static Inventory (INI format)

```ini
## inventory/production.ini
[webservers]
web1.example.com ansible_host=192.168.1.10
web2.example.com ansible_host=192.168.1.11

[dbservers]
db1.example.com ansible_host=192.168.1.20

[appservers]
app1.example.com
app2.example.com

[production:children]
webservers
dbservers
appservers

[production:vars]
ansible_user=deploy
ansible_become=true
environment=production
```

### Static Inventory (YAML format)

```yaml
## inventory/production.yml
all:
  children:
    webservers:
      hosts:
        web1.example.com:
          ansible_host: 192.168.1.10
        web2.example.com:
          ansible_host: 192.168.1.11
    dbservers:
      hosts:
        db1.example.com:
          ansible_host: 192.168.1.20
    appservers:
      hosts:
        app1.example.com:
        app2.example.com:
  vars:
    ansible_user: deploy
    ansible_become: true
    environment: production
```

### Group Variables

```text
inventory/
├── production.yml
└── group_vars/
    ├── all.yml
    ├── webservers.yml
    └── dbservers.yml
```

```yaml
## group_vars/webservers.yml
---
nginx_port: 80
nginx_worker_processes: 4
ssl_certificate: /etc/ssl/certs/example.com.crt
ssl_certificate_key: /etc/ssl/private/example.com.key
```

---

## Variable Precedence

Ansible variable precedence (lowest to highest):

1. Command line values (--extra-vars)
2. Role defaults (defaults/main.yml)
3. Inventory file or script group vars
4. Inventory group_vars/all
5. Playbook group_vars/all
6. Inventory group_vars/*
7. Playbook group_vars/*
8. Inventory file or script host vars
9. Inventory host_vars/*
10. Playbook host_vars/*
11. Host facts / cached set_facts
12. Play vars
13. Play vars_prompt
14. Play vars_files
15. Role vars (vars/main.yml)
16. Block vars (only for tasks in block)
17. Task vars (only for the task)
18. Include vars
19. Set_facts / registered vars
20. Role (and include_role) params
21. Include params
22. Extra vars (always win precedence)

```yaml
## Example showing variable override
---
- name: Variable precedence example
  hosts: all
  vars:
    app_port: 8080  # Play vars
  tasks:
    - name: Show port (will use 9000 from task vars)
      ansible.builtin.debug:
        msg: "Port is {{ app_port }}"
      vars:
        app_port: 9000  # Task vars (higher precedence)
```

---

## Role Structure

### Modern Role with Collection

```text
roles/webserver/
├── defaults/
│   └── main.yml          # Default variables (lowest precedence)
├── vars/
│   └── main.yml          # Role variables (higher precedence)
├── tasks/
│   └── main.yml          # Main task list
├── handlers/
│   └── main.yml          # Handler definitions
├── templates/
│   └── nginx.conf.j2     # Jinja2 templates
├── files/
│   └── ssl_cert.crt      # Static files
├── meta/
│   └── main.yml          # Role metadata and dependencies
└── README.md             # Role documentation
```

### Role Example

```yaml
## roles/webserver/tasks/main.yml
---
- name: Install nginx
  ansible.builtin.package:
    name: "{{ nginx_package_name }}"
    state: present

- name: Create document root
  ansible.builtin.file:
    path: "{{ nginx_document_root }}"
    state: directory
    owner: "{{ nginx_user }}"
    group: "{{ nginx_group }}"
    mode: '0755'

- name: Deploy nginx configuration
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
    validate: nginx -t -c %s
  notify: Reload nginx

- name: Ensure nginx is running
  ansible.builtin.service:
    name: nginx
    state: started
    enabled: true
```

```yaml
## roles/webserver/defaults/main.yml
---
nginx_package_name: nginx
nginx_user: www-data
nginx_group: www-data
nginx_document_root: /var/www/html
nginx_port: 80
nginx_worker_processes: auto
```

```yaml
## roles/webserver/meta/main.yml
---
galaxy_info:
  author: Tyler Dukes
  description: Configure nginx web server
  min_ansible_version: "2.17"
  platforms:
    - name: Ubuntu
      versions:
        - focal
        - jammy
  galaxy_tags:
    - web
    - nginx

dependencies:
  - role: my_namespace.my_collection.common
    vars:
      common_packages:
        - curl
        - vim
```

---

## Handlers

```yaml
## handlers/main.yml
---
- name: Reload nginx
  ansible.builtin.service:
    name: nginx
    state: reloaded

- name: Restart nginx
  ansible.builtin.service:
    name: nginx
    state: restarted

- name: Reload systemd
  ansible.builtin.systemd:
    daemon_reload: true

## Using handlers in tasks
---
- name: Update nginx configuration
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  notify:
    - Reload systemd
    - Reload nginx  # Handlers run in order defined

## Force handler execution
- name: Flush handlers
  ansible.builtin.meta: flush_handlers
```

---

## Jinja2 Templates

```jinja2
{# templates/nginx.conf.j2 #}
user {{ nginx_user }};
worker_processes {{ nginx_worker_processes }};

events {
    worker_connections {{ nginx_worker_connections | default(1024) }};
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    {% for server in nginx_servers %}
    server {
        listen {{ server.port | default(80) }};
        server_name {{ server.name }};
        root {{ server.document_root }};

        {% if server.ssl_enabled | default(false) %}
        ssl_certificate {{ server.ssl_cert }};
        ssl_certificate_key {{ server.ssl_key }};
        {% endif %}

        location / {
            try_files $uri $uri/ =404;
        }
    }
    {% endfor %}
}
```

### Jinja2 Filters

```yaml
## Common filters
- name: Use filters in templates
  ansible.builtin.debug:
    msg: |
      Uppercase: {{ hostname | upper }}
      Lowercase: {{ hostname | lower }}
      Default: {{ port | default(8080) }}
      String to int: {{ "42" | int }}
      Join list: {{ ['a', 'b', 'c'] | join(',') }}
      Regex replace: {{ 'foo bar' | regex_replace('bar', 'baz') }}
      To JSON: {{ my_dict | to_json }}
      To YAML: {{ my_dict | to_nice_yaml }}
```

---

## Ansible Vault

```bash
## Create encrypted file
ansible-vault create secrets.yml

## Edit encrypted file
ansible-vault edit secrets.yml

## Encrypt existing file
ansible-vault encrypt vars/secrets.yml

## Decrypt file
ansible-vault decrypt vars/secrets.yml

## View encrypted file
ansible-vault view secrets.yml

## Rekey (change password)
ansible-vault rekey secrets.yml
```

### Using Vault in Playbooks

```yaml
## Store sensitive data in vault
## vars/secrets.yml (encrypted)
---
db_password: super_secret_password
api_key: secret_api_key_12345

## Reference vault file in playbook
---
- name: Deploy application
  hosts: appservers
  vars_files:
    - vars/secrets.yml
  tasks:
    - name: Configure database connection
      ansible.builtin.template:
        src: database.yml.j2
        dest: /etc/app/database.yml
      no_log: true  # Don't log sensitive data

## Run playbook with vault password
ansible-playbook site.yml --ask-vault-pass
ansible-playbook site.yml --vault-password-file ~/.vault_pass
```

---

## Tags Strategy

```yaml
---
- name: Full application deployment
  hosts: appservers
  tasks:
    - name: Install dependencies
      ansible.builtin.package:
        name: "{{ item }}"
        state: present
      loop:
        - python3
        - python3-pip
      tags:
        - packages
        - dependencies

    - name: Deploy application code
      ansible.builtin.git:
        repo: https://github.com/example/app.git
        dest: /opt/app
        version: main
      tags:
        - deploy
        - code

    - name: Run database migrations
      ansible.builtin.command:
        cmd: python3 manage.py migrate
        chdir: /opt/app
      tags:
        - deploy
        - database
        - migrations

    - name: Restart application service
      ansible.builtin.service:
        name: myapp
        state: restarted
      tags:
        - deploy
        - restart

## Run specific tags
## ansible-playbook site.yml --tags "deploy"
## ansible-playbook site.yml --tags "packages,database"
## ansible-playbook site.yml --skip-tags "migrations"
```

---

## Error Handling

```yaml
---
- name: Error handling examples
  hosts: all
  tasks:
    # Ignore errors
    - name: Try to stop service (may not exist)
      ansible.builtin.service:
        name: optional-service
        state: stopped
      ignore_errors: true

    # Conditional failure
    - name: Check disk space
      ansible.builtin.shell: df -h / | awk 'NR==2 {print $5}' | sed 's/%//'
      register: disk_usage
      failed_when: disk_usage.stdout | int > 90
      changed_when: false

    # Custom failure message
    - name: Validate configuration
      ansible.builtin.command: validate-config.sh
      register: validation
      failed_when:
        - validation.rc != 0
        - "'CRITICAL' in validation.stderr"

    # Block with rescue
    - name: Deploy with rollback
      block:
        - name: Deploy new version
          ansible.builtin.copy:
            src: app-v2.jar
            dest: /opt/app/app.jar
          notify: Restart app

        - name: Run health check
          ansible.builtin.uri:
            url: http://localhost:8080/health
            status_code: 200
          retries: 5
          delay: 10

      rescue:
        - name: Rollback to previous version
          ansible.builtin.copy:
            src: app-v1.jar
            dest: /opt/app/app.jar
          notify: Restart app

        - name: Send alert
          ansible.builtin.debug:
            msg: "Deployment failed, rolled back to v1"

      always:
        - name: Cleanup temp files
          ansible.builtin.file:
            path: /tmp/deploy
            state: absent
```

---

## Testing with Molecule

```bash
## Initialize molecule scenario
molecule init scenario default

## Run full test sequence
molecule test

## Individual steps
molecule create       # Create test instances
molecule converge     # Run playbook
molecule verify       # Run test assertions
molecule destroy      # Destroy test instances
```

### Molecule Configuration

```yaml
## molecule/default/molecule.yml
---
driver:
  name: docker

platforms:
  - name: ubuntu-22.04
    image: ubuntu:22.04
    pre_build_image: true

provisioner:
  name: ansible
  config_options:
    defaults:
      callbacks_enabled: profile_tasks

verifier:
  name: ansible

scenario:
  test_sequence:
    - destroy
    - create
    - converge
    - verify
    - destroy
```

### Molecule Verify

```yaml
## molecule/default/verify.yml
---
- name: Verify
  hosts: all
  gather_facts: false
  tasks:
    - name: Check nginx is installed
      ansible.builtin.package:
        name: nginx
        state: present
      check_mode: true
      register: nginx_check
      failed_when: nginx_check.changed

    - name: Check nginx is running
      ansible.builtin.service:
        name: nginx
        state: started
      check_mode: true
      register: nginx_service
      failed_when: nginx_service.changed

    - name: Test HTTP response
      ansible.builtin.uri:
        url: http://localhost:80
        return_content: true
      register: http_response
      failed_when: "'Hello World' not in http_response.content"
```

### Role Testing Best Practices

#### When to Write Tests

Write tests for Ansible roles when:

- **Reusable roles**: Any role used across multiple projects, teams, or playbooks
- **Critical infrastructure**: Roles managing production systems, security configurations, or compliance requirements
- **Complex logic**: Roles with conditional tasks, dynamic includes, or computed variables
- **Public roles**: Any role shared on Ansible Galaxy or internally across teams
- **Compliance requirements**: Roles requiring audit trails or regulatory compliance evidence

#### What to Test

Test the following aspects of your Ansible roles:

1. **Task Execution**: Verify all tasks execute successfully on target platforms
2. **Idempotency**: Ensure role runs produce no changes on subsequent executions
3. **Service State**: Validate services are running and configured correctly
4. **File Content**: Check configuration files contain expected values
5. **Network Connectivity**: Test ports are open and services are accessible
6. **Security Posture**: Verify permissions, ownership, and security settings
7. **Cross-Platform**: Test on all supported operating systems

### Tiered Testing Strategy

Implement a three-tier approach to balance speed, coverage, and confidence:

#### Tier 1: Static Analysis (< 30 seconds)

Fast linting and syntax validation that runs on every commit:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/ansible/ansible-lint
    rev: v24.2.0
    hooks:
      - id: ansible-lint
        args: [--strict]
        files: \.(yaml|yml)$

  - repo: https://github.com/adrienverge/yamllint
    rev: v1.35.1
    hooks:
      - id: yamllint
        args: [-c=.yamllint.yml]
```

```yaml
# .yamllint.yml
---
extends: default

rules:
  line-length:
    max: 120
    level: warning
  comments:
    min-spaces-from-content: 1
  indentation:
    spaces: 2
    indent-sequences: true
```

```yaml
# .ansible-lint
---
profile: production

exclude_paths:
  - .github/
  - .cache/
  - molecule/

skip_list:
  - yaml[line-length]  # Handled by yamllint

warn_list:
  - experimental
  - role-name

enable_list:
  - no-same-owner  # Ensure different owner/group
  - args  # Check task arguments
  - empty-string-compare  # Prefer not item.foo
  - no-log-password  # Mark password tasks with no_log
  - name[casing]  # Enforce task name casing
```

#### Tier 2: Role Execution Tests (< 5 minutes)

Molecule converge tests that run on pull requests:

```yaml
# molecule/default/molecule.yml
---
driver:
  name: docker

platforms:
  - name: ubuntu-22.04
    image: geerlingguy/docker-ubuntu2204-ansible:latest
    pre_build_image: true
    privileged: true
    command: /lib/systemd/systemd
    volumes:
      - /sys/fs/cgroup:/sys/fs/cgroup:ro

  - name: rhel-9
    image: geerlingguy/docker-rockylinux9-ansible:latest
    pre_build_image: true
    privileged: true
    command: /usr/sbin/init
    volumes:
      - /sys/fs/cgroup:/sys/fs/cgroup:ro

provisioner:
  name: ansible
  config_options:
    defaults:
      callbacks_enabled: profile_tasks,timer
      stdout_callback: yaml
  inventory:
    host_vars:
      ubuntu-22.04:
        ansible_python_interpreter: /usr/bin/python3
      rhel-9:
        ansible_python_interpreter: /usr/bin/python3

verifier:
  name: ansible

scenario:
  name: default
  test_sequence:
    - dependency
    - cleanup
    - destroy
    - syntax
    - create
    - prepare
    - converge
    - idempotence
    - side_effect
    - verify
    - cleanup
    - destroy
```

#### Tier 3: Compliance Verification (< 15 minutes)

InSpec integration for security and compliance testing (nightly or pre-release):

```yaml
# molecule/compliance/molecule.yml
---
driver:
  name: docker

platforms:
  - name: ubuntu-22.04-compliance
    image: geerlingguy/docker-ubuntu2204-ansible:latest
    pre_build_image: true
    privileged: true
    command: /lib/systemd/systemd

provisioner:
  name: ansible

verifier:
  name: testinfra
  additional_files_or_dirs:
    - ../compliance/
  env:
    PYTHONWARNINGS: ignore

scenario:
  name: compliance
  test_sequence:
    - destroy
    - create
    - converge
    - verify
    - destroy
```

```ruby
# molecule/compliance/tests/test_security.rb
control 'nginx-security' do
  title 'NGINX Security Configuration'
  desc 'Verify NGINX is configured securely'

  describe package('nginx') do
    it { should be_installed }
  end

  describe service('nginx') do
    it { should be_installed }
    it { should be_enabled }
    it { should be_running }
  end

  describe file('/etc/nginx/nginx.conf') do
    it { should exist }
    it { should be_file }
    it { should be_owned_by 'root' }
    it { should be_grouped_into 'root' }
    it { should_not be_readable.by('others') }
    it { should_not be_writable.by('others') }
    it { should_not be_executable.by('others') }
  end

  describe nginx_conf('/etc/nginx/nginx.conf') do
    its('params') { should include 'server_tokens' => ['off'] }
    its('params') { should include 'ssl_protocols' => [['TLSv1.2', 'TLSv1.3']] }
  end

  describe port(80) do
    it { should be_listening }
    its('protocols') { should include 'tcp' }
  end

  describe port(443) do
    it { should be_listening }
    its('protocols') { should include 'tcp' }
  end

  describe file('/var/www/html') do
    it { should exist }
    it { should be_directory }
    it { should be_owned_by 'www-data' }
  end
end

control 'cis-benchmark' do
  title 'CIS Ubuntu 22.04 Benchmark Checks'
  desc 'Verify compliance with CIS benchmarks'

  describe file('/etc/ssh/sshd_config') do
    its('content') { should match /^PermitRootLogin no/ }
    its('content') { should match /^PasswordAuthentication no/ }
    its('content') { should match /^X11Forwarding no/ }
  end

  describe file('/etc/audit/auditd.conf') do
    it { should exist }
    its('content') { should match /^max_log_file_action = keep_logs/ }
  end
end
```

### Role Contracts

Define explicit guarantees for each role using a CONTRACT.md file:

````markdown
# Role Contract: Web Server

## Purpose
Deploys and configures NGINX web server with TLS support, security hardening, and monitoring.

## Guarantees

### Tasks Performed
- Install NGINX from official repository
- Configure virtual hosts with TLS certificates
- Set up security headers and SSL/TLS best practices
- Configure log rotation and monitoring
- Enable and start NGINX service

### Behavior Guarantees
1. **Idempotency**: Multiple runs produce no changes after initial deployment
2. **Service Availability**: NGINX service running and enabled on boot
3. **Security**: TLS 1.2+ only, server tokens disabled, secure headers configured
4. **Permissions**: All config files owned by root with 0644, private keys 0600
5. **Compatibility**: Supports Ubuntu 20.04+, RHEL 8+, Debian 11+

### Required Variables
```yaml
# Required inputs with validation
nginx_server_name: "example.com"  # Must be valid FQDN
nginx_document_root: "/var/www/html"  # Must be absolute path
nginx_ssl_certificate: "/etc/ssl/certs/server.crt"  # Must exist
nginx_ssl_certificate_key: "/etc/ssl/private/server.key"  # Must exist, mode 0600

# Optional with defaults
nginx_worker_processes: "auto"  # Number or 'auto'
nginx_worker_connections: 1024  # Integer >= 512
nginx_keepalive_timeout: 65  # Integer in seconds
nginx_enable_ssl: true  # Boolean
nginx_ssl_protocols: "TLSv1.2 TLSv1.3"  # String
```

### Post-Conditions

After successful execution, the following conditions are guaranteed:

- NGINX package is installed (latest stable version)
- Service is running and enabled
- Port 80 (HTTP) is listening
- Port 443 (HTTPS) is listening if `nginx_enable_ssl: true`
- Configuration passes `nginx -t` validation
- Log files exist at `/var/log/nginx/` with proper rotation
- User `www-data` exists with appropriate permissions

### Platform Support Matrix

| Platform | Versions | Status | Notes |
|----------|----------|--------|-------|
| Ubuntu | 20.04, 22.04 | ✅ Tested | Primary support |
| Debian | 11, 12 | ✅ Tested | Full support |
| RHEL | 8, 9 | ✅ Tested | Uses EPEL repo |
| Rocky Linux | 8, 9 | ✅ Tested | RHEL equivalent |
| CentOS Stream | 9 | ⚠️ Experimental | Limited testing |
| Windows | N/A | ❌ Not supported | Use IIS role |

## Breaking Changes Policy

### Semantic Versioning

- **Major version bump**: Breaking changes to role interface (variables, tasks, handlers)
- **Minor version bump**: New features, backward-compatible changes
- **Patch version bump**: Bug fixes, documentation updates

### Deprecation Notice Period

Breaking changes will be:

1. Announced in CHANGELOG.md at least one minor version in advance
2. Marked with deprecation warnings in task output
3. Documented in migration guides with examples

## Testing Requirements

### Minimum Test Coverage

- ✅ ansible-lint with production profile passes
- ✅ yamllint with strict config passes
- ✅ Molecule converge succeeds on all supported platforms
- ✅ Idempotence test passes (second run makes no changes)
- ✅ InSpec security tests pass (if compliance scenario exists)
- ✅ Service verification (ports open, service running)

### CI/CD Requirements

- All tier 1 tests (static analysis) on every commit
- Tier 2 tests (converge + idempotence) on every PR
- Tier 3 tests (compliance) nightly or on release tag

## Dependencies

### Role Dependencies

```yaml
# meta/main.yml
dependencies:
  - role: common_setup
    vars:
      setup_firewall: true
  - role: ssl_certificates
    when: nginx_enable_ssl | bool
```

### Collection Dependencies

- `ansible.builtin` (core Ansible modules)
- `community.general` >= 5.0.0 (for advanced features)
- `ansible.posix` >= 1.4.0 (for sysctl, firewall)

### System Dependencies

- Python 3.8+ on control node
- Python 3.6+ on managed nodes
- OpenSSL 1.1.1+ for TLS support

## Support and Maintenance

- **Maintained by**: DevOps Team
- **Contact**: <devops@example.com>
- **Documentation**: <https://docs.example.com/roles/web_server>
- **Source**: <https://github.com/example/ansible-roles>
- **License**: MIT

````

### Idempotency Verification

Idempotency is critical for Ansible roles. Ensure roles can be run multiple times without making changes:

#### Testing Idempotency with Molecule

```bash
# Run converge twice and check for changes
molecule converge
molecule converge  # Should report 0 changes

# Or use built-in idempotence test
molecule test  # Includes idempotence check in sequence
```

Molecule's idempotence test runs the playbook twice and fails if the second run makes any changes:

```yaml
# molecule/default/molecule.yml - idempotence is built into test_sequence
scenario:
  test_sequence:
    - destroy
    - create
    - converge
    - idempotence  # Fails if second converge makes changes
    - verify
    - destroy
```

#### Common Idempotency Issues

```yaml
# BAD - Always reports changed
- name: Configure application
  ansible.builtin.shell: |
    echo "config=true" >> /etc/app.conf
  # Always appends, never idempotent

# GOOD - Idempotent configuration
- name: Configure application
  ansible.builtin.lineinfile:
    path: /etc/app.conf
    line: "config=true"
    create: true
  # Only adds line if not present
```

```yaml
# BAD - Timestamp always changes
- name: Deploy configuration
  ansible.builtin.template:
    src: config.j2
    dest: /etc/app/config.yml
  # If template includes {{ ansible_date_time }}, always changes

# GOOD - Stable template
- name: Deploy configuration
  ansible.builtin.template:
    src: config.j2
    dest: /etc/app/config.yml
  # Template content deterministic, only changes when needed
```

```yaml
# BAD - Command module always shows changed
- name: Create user
  ansible.builtin.command: useradd myuser
  # Fails on subsequent runs, not idempotent

# GOOD - User module is idempotent
- name: Create user
  ansible.builtin.user:
    name: myuser
    state: present
  # Creates user if absent, no change if exists
```

### Multi-Platform Testing

Test roles across different operating systems and versions:

```yaml
# molecule/multi-platform/molecule.yml
---
driver:
  name: docker

platforms:
  # Debian family
  - name: ubuntu-20-04
    image: geerlingguy/docker-ubuntu2004-ansible:latest
    pre_build_image: true
    privileged: true
    command: /lib/systemd/systemd

  - name: ubuntu-22-04
    image: geerlingguy/docker-ubuntu2204-ansible:latest
    pre_build_image: true
    privileged: true
    command: /lib/systemd/systemd

  - name: debian-11
    image: geerlingguy/docker-debian11-ansible:latest
    pre_build_image: true
    privileged: true
    command: /lib/systemd/systemd

  # RHEL family
  - name: rhel-8
    image: geerlingguy/docker-rockylinux8-ansible:latest
    pre_build_image: true
    privileged: true
    command: /usr/sbin/init

  - name: rhel-9
    image: geerlingguy/docker-rockylinux9-ansible:latest
    pre_build_image: true
    privileged: true
    command: /usr/sbin/init

  # Windows (requires different driver)
  # - name: windows-2022
  #   image: jborean93/ansible-windows:2022
  #   pre_build_image: true

provisioner:
  name: ansible
  inventory:
    group_vars:
      all:
        ansible_python_interpreter: /usr/bin/python3
    host_vars:
      ubuntu-20-04:
        nginx_package: nginx
      ubuntu-22-04:
        nginx_package: nginx
      debian-11:
        nginx_package: nginx
      rhel-8:
        nginx_package: nginx
        nginx_service: nginx
      rhel-9:
        nginx_package: nginx
        nginx_service: nginx

verifier:
  name: ansible

scenario:
  name: multi-platform
  test_sequence:
    - destroy
    - create
    - converge
    - idempotence
    - verify
    - destroy
```

#### Platform-Specific Tasks

```yaml
# tasks/main.yml
---
- name: Include OS-specific variables
  ansible.builtin.include_vars: "{{ ansible_os_family }}.yml"

- name: Install NGINX (Debian/Ubuntu)
  ansible.builtin.apt:
    name: "{{ nginx_package }}"
    state: present
    update_cache: true
  when: ansible_os_family == "Debian"

- name: Install NGINX (RHEL/Rocky)
  ansible.builtin.yum:
    name: "{{ nginx_package }}"
    state: present
    enablerepo: epel
  when: ansible_os_family == "RedHat"

- name: Configure NGINX
  ansible.builtin.template:
    src: "nginx.conf.j2"
    dest: "{{ nginx_config_path }}"
    owner: root
    group: root
    mode: '0644'
  notify: Reload NGINX
```

```yaml
# vars/Debian.yml
---
nginx_package: nginx
nginx_config_path: /etc/nginx/nginx.conf
nginx_service: nginx
nginx_user: www-data
```

```yaml
# vars/RedHat.yml
---
nginx_package: nginx
nginx_config_path: /etc/nginx/nginx.conf
nginx_service: nginx
nginx_user: nginx
```

### CI/CD Integration

#### GitHub Actions Pipeline

```yaml
# .github/workflows/ansible-ci.yml
name: Ansible Role CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

env:
  PYTHON_VERSION: '3.11'
  ANSIBLE_VERSION: '2.18'

jobs:
  # Tier 1: Fast Static Analysis
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          pip install ansible-lint yamllint ansible==${{ env.ANSIBLE_VERSION }}

      - name: Run yamllint
        run: yamllint .

      - name: Run ansible-lint
        run: ansible-lint --strict

  # Tier 2: Molecule Tests
  molecule:
    name: Molecule Test (${{ matrix.distro }})
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      fail-fast: false
      matrix:
        distro:
          - ubuntu2204
          - debian11
          - rockylinux9

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          pip install molecule[docker] ansible==${{ env.ANSIBLE_VERSION }}
          pip install molecule-plugins[docker]

      - name: Run Molecule
        run: molecule test
        env:
          MOLECULE_DISTRO: ${{ matrix.distro }}
          PY_COLORS: 1
          ANSIBLE_FORCE_COLOR: 1

      - name: Upload molecule logs
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: molecule-logs-${{ matrix.distro }}
          path: |
            molecule/default/*.log
            /tmp/molecule/**

  # Tier 3: Compliance Tests (only on main branch)
  compliance:
    name: Compliance Tests
    runs-on: ubuntu-latest
    needs: molecule
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          pip install molecule[docker] ansible==${{ env.ANSIBLE_VERSION }}
          pip install inspec-bin

      - name: Run compliance scenario
        run: molecule test -s compliance

      - name: Upload compliance reports
        uses: actions/upload-artifact@v4
        with:
          name: compliance-reports
          path: molecule/compliance/reports/
```

#### GitLab CI Pipeline

```yaml
# .gitlab-ci.yml
---
stages:
  - lint
  - test
  - compliance

variables:
  PYTHON_VERSION: "3.11"
  ANSIBLE_VERSION: "2.18"
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

cache:
  paths:
    - .cache/pip

# Tier 1: Static Analysis
yamllint:
  stage: lint
  image: python:${PYTHON_VERSION}
  before_script:
    - pip install yamllint
  script:
    - yamllint .
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'

ansible-lint:
  stage: lint
  image: python:${PYTHON_VERSION}
  before_script:
    - pip install ansible-lint ansible==${ANSIBLE_VERSION}
  script:
    - ansible-lint --strict
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'

# Tier 2: Molecule Tests
.molecule_template: &molecule_template
  stage: test
  image: python:${PYTHON_VERSION}
  services:
    - docker:dind
  variables:
    DOCKER_HOST: tcp://docker:2375
    DOCKER_TLS_CERTDIR: ""
  before_script:
    - pip install molecule[docker] ansible==${ANSIBLE_VERSION}
    - pip install molecule-plugins[docker]
  script:
    - molecule test
  artifacts:
    when: on_failure
    paths:
      - molecule/default/*.log
    expire_in: 1 week
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'

molecule-ubuntu:
  <<: *molecule_template
  variables:
    MOLECULE_DISTRO: ubuntu2204

molecule-debian:
  <<: *molecule_template
  variables:
    MOLECULE_DISTRO: debian11

molecule-rocky:
  <<: *molecule_template
  variables:
    MOLECULE_DISTRO: rockylinux9

# Tier 3: Compliance
compliance:
  stage: compliance
  image: python:${PYTHON_VERSION}
  services:
    - docker:dind
  variables:
    DOCKER_HOST: tcp://docker:2375
    DOCKER_TLS_CERTDIR: ""
  before_script:
    - pip install molecule[docker] ansible==${ANSIBLE_VERSION}
    - pip install inspec-bin
  script:
    - molecule test -s compliance
  artifacts:
    paths:
      - molecule/compliance/reports/
    expire_in: 30 days
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
    - if: '$CI_PIPELINE_SOURCE == "schedule"'
```

### Test Coverage Requirements

Establish minimum coverage thresholds for roles:

#### Coverage Metrics

1. **Task Coverage**: All tasks executed at least once in tests
2. **Platform Coverage**: Tested on all supported OS families
3. **Variable Coverage**: All required and optional variables tested
4. **Handler Coverage**: All handlers triggered and verified
5. **Conditional Coverage**: All `when` conditions tested (true/false paths)
6. **Error Coverage**: Error handling tested with invalid inputs

#### Measuring Coverage

```yaml
# molecule/default/verify.yml
---
- name: Verify role behavior
  hosts: all
  gather_facts: true
  tasks:
    # Service state verification
    - name: Check service is running
      ansible.builtin.service_facts:

    - name: Assert NGINX is running
      ansible.builtin.assert:
        that:
          - "'nginx' in services"
          - "services['nginx'].state == 'running'"
          - "services['nginx'].status == 'enabled'"
        fail_msg: "NGINX service not running or not enabled"

    # Port verification
    - name: Check HTTP port is listening
      ansible.builtin.wait_for:
        port: 80
        state: started
        timeout: 5

    - name: Check HTTPS port is listening
      ansible.builtin.wait_for:
        port: 443
        state: started
        timeout: 5
      when: nginx_enable_ssl | default(true) | bool

    # Configuration file verification
    - name: Check NGINX config exists
      ansible.builtin.stat:
        path: /etc/nginx/nginx.conf
      register: nginx_conf

    - name: Assert NGINX config is correct
      ansible.builtin.assert:
        that:
          - nginx_conf.stat.exists
          - nginx_conf.stat.mode == '0644'
          - nginx_conf.stat.pw_name == 'root'

    # Content verification
    - name: Read NGINX config
      ansible.builtin.slurp:
        src: /etc/nginx/nginx.conf
      register: nginx_config_content

    - name: Verify security headers
      ansible.builtin.assert:
        that:
          - "'server_tokens off' in nginx_config_content['content'] | b64decode"
        fail_msg: "Security headers not configured"

    # HTTP response verification
    - name: Test HTTP response
      ansible.builtin.uri:
        url: http://localhost
        return_content: true
        status_code: 200
      register: http_response

    - name: Verify response content
      ansible.builtin.assert:
        that:
          - http_response.status == 200
          - "'nginx' in http_response.server.lower()"

    # Log file verification
    - name: Check log files exist
      ansible.builtin.stat:
        path: "{{ item }}"
      register: log_files
      loop:
        - /var/log/nginx/access.log
        - /var/log/nginx/error.log

    - name: Assert log files configured
      ansible.builtin.assert:
        that:
          - item.stat.exists
        fail_msg: "Log file {{ item.item }} does not exist"
      loop: "{{ log_files.results }}"
```

#### Role README Testing Section

Include testing instructions in role README:

````markdown
## Testing

This role includes comprehensive tests using Molecule and InSpec.

### Prerequisites
- Docker (for Molecule container-based testing)
- Python 3.8+
- pip packages: `molecule[docker]`, `ansible-lint`, `yamllint`

### Quick Start
```bash
# Install dependencies
pip install molecule[docker] molecule-plugins[docker] ansible-lint yamllint

# Run full test suite
molecule test

# Run specific scenarios
molecule test -s default      # Default platform tests
molecule test -s compliance   # Security compliance tests
molecule test -s multi-platform  # All supported platforms
```

### Test Scenarios

#### Default Scenario

Tests role on Ubuntu 22.04 with default variables:

```bash
molecule converge  # Deploy role
molecule verify    # Run assertions
molecule destroy   # Clean up
```

#### Compliance Scenario

Runs InSpec security and compliance tests:

```bash
molecule test -s compliance
```

#### Multi-Platform Scenario

Tests across Ubuntu, Debian, and RHEL:

```bash
molecule test -s multi-platform
```

### Continuous Integration

All tests run automatically on:

- Every commit: Static analysis (lint)
- Every PR: Molecule converge and idempotence tests
- Main branch: Full compliance suite
- Nightly: Multi-platform tests

### Coverage Reports

Test coverage reports are generated in `molecule/reports/`:

- `coverage.json`: Task and platform coverage
- `compliance.json`: InSpec compliance results
- `idempotence.log`: Idempotence test output

````

---

## Common Pitfalls

### Variable Precedence Confusion

**Issue**: Ansible has 22 levels of variable precedence, and misunderstanding this order causes
unexpected variable values at runtime.

**Example**:

```yaml
## playbook.yml
- name: Deploy application
  hosts: webservers
  vars:
    app_port: 8080  # Play vars (precedence: 12)
  roles:
    - role: deploy_app
      vars:
        app_port: 9000  # Role params (precedence: 20)
```

```yaml
## roles/deploy_app/defaults/main.yml
app_port: 3000  # Role defaults (precedence: 2)
```

```yaml
## group_vars/webservers.yml
app_port: 5000  # Group vars (precedence: 7)
```

**Solution**: Use extra vars (highest precedence) for overrides, role defaults for fallbacks,
and document which vars are meant to be overridden.

```yaml
## Good - Clear hierarchy
## ansible-playbook site.yml -e "app_port=9000"  # Extra vars always win
```

**Key Points**:

- Extra vars (`-e` or `--extra-vars`) always win (precedence 22)
- Role vars override almost everything (precedence 15)
- Use role defaults for sensible fallback values
- Document expected override points in role README

### Handler Notification Timing

**Issue**: Handlers only run at the end of a play, not immediately when notified, causing race conditions.

**Example**:

```yaml
## Bad - Config updated but service not reloaded yet
- name: Update nginx config
  template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  notify: Reload nginx

- name: Test nginx configuration  # Runs BEFORE reload!
  uri:
    url: http://localhost/health
    status_code: 200
```

**Solution**: Use `meta: flush_handlers` to force handler execution at specific points.

```yaml
## Good - Force handler execution before testing
- name: Update nginx config
  template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  notify: Reload nginx

- name: Flush handlers
  meta: flush_handlers

- name: Test nginx configuration  # Now runs AFTER reload
  uri:
    url: http://localhost/health
    status_code: 200
```

**Key Points**:

- Handlers run at play end by default
- Use `meta: flush_handlers` to force immediate execution
- Handlers run once even if notified multiple times
- Failed tasks prevent handler execution unless `force_handlers: true`

### Changed When Detection

**Issue**: Shell/command tasks always report "changed" status, polluting change reports and
triggering unnecessary handler notifications.

**Example**:

```yaml
## Bad - Always shows as changed
- name: Check if file exists
  command: test -f /etc/myapp/config.yml
  register: config_check
  ignore_errors: true
```

**Solution**: Use `changed_when` to properly indicate actual changes.

```yaml
## Good - Only marks as changed when appropriate
- name: Check if file exists
  command: test -f /etc/myapp/config.yml
  register: config_check
  failed_when: false
  changed_when: false  # This is just a check, not a change

## Good - Detect actual changes
- name: Add user to group
  command: usermod -aG docker {{ username }}
  register: usermod_result
  changed_when: "'no changes' not in usermod_result.stderr"
```

**Key Points**:

- Commands/shell tasks default to "changed" status
- Use `changed_when: false` for read-only operations
- Parse output to detect actual changes
- Prevents unnecessary handler notifications

### Loop Variable Shadowing

**Issue**: Using `loop` creates an `item` variable that shadows outer loop variables, causing nested loop failures.

**Example**:

```yaml
## Bad - Inner loop shadows outer 'item'
- name: Create user directories
  file:
    path: "/home/{{ item.username }}/{{ item }}"  # Which 'item'?
    state: directory
  loop: "{{ users }}"
  with_items:
    - documents
    - downloads
```

**Solution**: Use `loop_control` to rename loop variables.

```yaml
## Good - Explicit loop variable names
- name: Create user directories
  file:
    path: "/home/{{ user.username }}/{{ folder }}"
    state: directory
  loop: "{{ users }}"
  loop_control:
    loop_var: user
  with_nested:
    - "{{ users }}"
    - ['documents', 'downloads']
  loop_control:
    loop_var: folder
```

**Key Points**:

- Default loop variable is `item`
- Nested loops shadow outer `item` variables
- Use `loop_control: { loop_var: custom_name }` for clarity
- Name loop variables descriptively

### Template Rendering Errors

**Issue**: Jinja2 template errors only appear at runtime on target hosts, making debugging difficult.

**Example**:

```jinja2
{# templates/config.j2 - Runtime error! #}
server_url = {{ api_url }}  # Missing quotes for string value
database_host = {{ db_host | default(localhost) }}  # Undefined variable 'localhost'
workers = {{ worker_count + 10 }}  # TypeError if worker_count is string
```

**Solution**: Use proper Jinja2 syntax, test templates locally, and use `template` module's `validate` parameter.

```jinja2
## Good - Proper Jinja2 syntax
server_url = "{{ api_url }}"
database_host = "{{ db_host | default('localhost') }}"
workers = {{ worker_count | int + 10 }}

{# Use filters for type conversion #}
enabled = {{ feature_enabled | bool }}
timeout = {{ timeout_seconds | int }}
```

```yaml
## Good - Validate template after deployment
- name: Deploy nginx config
  template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
    validate: 'nginx -t -c %s'  # Test config before replacing
```

**Key Points**:

- Quote string values in templates
- Use `| default('value')` with quotes for string defaults
- Use type filters: `| int`, `| bool`, `| string`
- Use `validate` parameter to test rendered configs
- Test templates with `--check --diff` mode

### Fact Gathering Performance

**Issue**: Fact gathering runs on every play by default, adding 2-5 seconds per host even when facts aren't needed.

**Example**:

```yaml
## Bad - Gathers facts unnecessarily
- name: Simple file copy
  hosts: all
  tasks:  # Waits 3 seconds gathering facts we don't use
    - name: Copy file
      copy:
        src: app.jar
        dest: /opt/app/
```

**Solution**: Disable fact gathering when not needed, use smart gathering, or cache facts.

```yaml
## Good - Disable when not needed
- name: Simple file copy
  hosts: all
  gather_facts: false  # Skip fact gathering
  tasks:
    - name: Copy file
      copy:
        src: app.jar
        dest: /opt/app/

## Good - Use smart gathering (ansible.cfg)
## [defaults]
## gathering = smart
## fact_caching = jsonfile
## fact_caching_connection = /tmp/ansible_facts
## fact_caching_timeout = 3600
```

**Key Points**:

- Default gathering adds 2-5s per host per play
- Set `gather_facts: false` when facts aren't needed
- Use `gathering = smart` to cache facts
- Manually gather facts with `setup` module when needed
- Use `gather_subset` to collect only required facts

---

## Anti-Patterns

### ❌ Avoid: Shell/Command for Everything

```yaml
## Bad - Using shell when module exists
- name: Install package
  ansible.builtin.shell: apt-get install -y nginx

## Good - Use appropriate module
- name: Install package
  ansible.builtin.package:
    name: nginx
    state: present
```

### ❌ Avoid: Hardcoded Values

```yaml
## Bad - Hardcoded paths and values
- name: Deploy config
  ansible.builtin.copy:
    src: app.conf
    dest: /opt/myapp/config/app.conf
    owner: ubuntu
    mode: '0644'

## Good - Use variables
- name: Deploy config
  ansible.builtin.copy:
    src: app.conf
    dest: "{{ app_config_dir }}/app.conf"
    owner: "{{ app_user }}"
    mode: "{{ app_config_mode }}"
```

### ❌ Avoid: No Idempotency

```yaml
## Bad - Not idempotent (runs every time)
- name: Download file
  ansible.builtin.command: wget https://example.com/file.tar.gz
  args:
    chdir: /tmp

## Good - Idempotent check
- name: Download file
  ansible.builtin.get_url:
    url: https://example.com/file.tar.gz
    dest: /tmp/file.tar.gz
    mode: '0644'
```

### ❌ Avoid: Ignoring Return Codes

```yaml
## Bad - Ignoring all errors
- name: Stop service
  ansible.builtin.command: systemctl stop myapp
  ignore_errors: true

## Good - Specific error handling
- name: Stop service
  ansible.builtin.service:
    name: myapp
    state: stopped
  register: service_stop
  failed_when:
    - service_stop.failed
    - "'could not be found' not in service_stop.msg"
```

### ❌ Avoid: Not Using Roles

```yaml
## Bad - Everything in one massive playbook
- name: Configure web server
  hosts: webservers
  tasks:
    - name: Install nginx
      ansible.builtin.package:
        name: nginx
        state: present
    - name: Copy nginx config
      ansible.builtin.template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
    # ... 50 more tasks ...

## Good - Organized into roles
- name: Configure web server
  hosts: webservers
  roles:
    - role: nginx
      vars:
        nginx_worker_processes: 4
    - role: ssl_certificates
    - role: application
```

### ❌ Avoid: Using Loop with Package Module

```yaml
## Bad - Inefficient loop
- name: Install packages
  ansible.builtin.package:
    name: "{{ item }}"
    state: present
  loop:
    - nginx
    - postgresql
    - redis

## Good - Install all at once
- name: Install packages
  ansible.builtin.package:
    name:
      - nginx
      - postgresql
      - redis
    state: present
```

### ❌ Avoid: No Proper Secret Management

```yaml
## Bad - Secrets in plain text
- name: Configure database
  ansible.builtin.template:
    src: database.yml.j2
    dest: /etc/app/database.yml
  vars:
    db_password: "MySecretPassword123"  # ❌ Plain text!

## Good - Use Ansible Vault
## Encrypt with: ansible-vault encrypt vars/secrets.yml
- name: Configure database
  ansible.builtin.template:
    src: database.yml.j2
    dest: /etc/app/database.yml
  vars_files:
    - vars/secrets.yml  # ✅ Encrypted vault file

## Or use vault inline
- name: Configure database
  ansible.builtin.template:
    src: database.yml.j2
    dest: /etc/app/database.yml
  vars:
    db_password: "{{ vault_db_password }}"  # ✅ From vault
```

---

## Security Best Practices

### Ansible Vault for Secrets

Always encrypt sensitive data using Ansible Vault.

```yaml
## Bad - Plain text secrets in vars file
## vars/database.yml
db_host: "prod-db.example.com"
db_user: "app_user"
db_password: "SuperSecret123"  # NEVER store plain text passwords!
api_key: "sk_live_abc123xyz"   # Exposed in version control!

## Good - Use Ansible Vault for secrets
## vars/vault.yml (encrypted with ansible-vault)
vault_db_password: "SuperSecret123"
vault_api_key: "sk_live_abc123xyz"

## vars/database.yml (references vault variables)
db_host: "prod-db.example.com"
db_user: "app_user"
db_password: "{{ vault_db_password }}"
api_key: "{{ vault_api_key }}"
```

```bash
## Encrypt entire file
ansible-vault encrypt vars/vault.yml

## Encrypt specific string
ansible-vault encrypt_string 'SuperSecret123' --name 'vault_db_password'

## Run playbook with vault password
ansible-playbook site.yml --ask-vault-pass

## Use password file (ensure file has restricted permissions)
ansible-playbook site.yml --vault-password-file ~/.vault_pass
```

### Privilege Escalation Security

Use `become` safely and only when necessary.

```yaml
## Bad - Running everything as root
- name: Deploy application
  hosts: webservers
  become: yes  # Don't use become for entire play!
  tasks:
    - name: Copy config file
      copy:
        src: config.yml
        dest: /home/appuser/config.yml  # Doesn't need root!

## Good - Use become only for tasks that require it
- name: Deploy application
  hosts: webservers
  tasks:
    - name: Install system package
      become: yes  # Only escalate when needed
      apt:
        name: nginx
        state: present

    - name: Copy config file
      copy:
        src: config.yml
        dest: /home/appuser/config.yml
        owner: appuser
        group: appuser
        mode: '0644'

    - name: Start service
      become: yes
      systemd:
        name: nginx
        state: started
```

### Safe Command Execution

Prevent command injection when using shell/command modules.

```yaml
## Bad - Vulnerable to injection
- name: Process user input
  shell: "grep {{ user_search }} /var/log/app.log"  # Injection risk!
  vars:
    user_search: "{{ lookup('env', 'USER_INPUT') }}"

## Good - Use command module with arguments
- name: Process user input safely
  command:
    cmd: grep
    argv:
      - "{{ user_search | quote }}"
      - /var/log/app.log

## Good - Validate input with assertions
- name: Validate input
  assert:
    that:
      - user_search is regex('^[a-zA-Z0-9_-]+$')
    fail_msg: "Invalid search input format"

- name: Process validated input
  shell: "grep {{ user_search | quote }} /var/log/app.log"
```

### SSH Key Management

```yaml
## Bad - Disabling host key checking globally
## ansible.cfg
[defaults]
host_key_checking = False  # SECURITY RISK!

## Good - Manage SSH known hosts properly
- name: Add SSH host key to known_hosts
  known_hosts:
    name: "{{ inventory_hostname }}"
    key: "{{ lookup('pipe', 'ssh-keyscan -H ' + inventory_hostname) }}"
    state: present

## Good - Use SSH key with passphrase
## ansible.cfg
[defaults]
private_key_file = ~/.ssh/ansible_deploy_key
host_key_checking = True  # Keep enabled!

## Ensure SSH key has proper permissions
- name: Set SSH key permissions
  file:
    path: ~/.ssh/ansible_deploy_key
    mode: '0600'
  delegate_to: localhost
```

### Secure File Permissions

Always set appropriate file permissions.

```yaml
## Bad - World-readable sensitive files
- name: Deploy database config
  copy:
    src: database.conf
    dest: /etc/app/database.conf  # Default permissions too open!

## Good - Restrict sensitive file permissions
- name: Deploy database config
  copy:
    src: database.conf
    dest: /etc/app/database.conf
    owner: appuser
    group: appuser
    mode: '0600'  # Only owner can read/write

## Good - Secure directory permissions
- name: Create config directory
  file:
    path: /etc/app/secrets
    state: directory
    owner: appuser
    group: appuser
    mode: '0750'  # Owner: rwx, Group: rx, Other: none
```

### Inventory Security

Protect inventory files and limit exposure.

```yaml
## Bad - Sensitive data in inventory
## inventory/production.ini
[webservers]
web1.example.com ansible_ssh_pass=MyPassword123  # NEVER!
web2.example.com ansible_become_pass=RootPass456  # EXPOSED!

## Good - Use vault for inventory variables
## inventory/production.yml
all:
  children:
    webservers:
      hosts:
        web1.example.com:
        web2.example.com:
      vars:
        ansible_ssh_pass: "{{ vault_ssh_password }}"
        ansible_become_pass: "{{ vault_become_password }}"

## Better - Use SSH keys instead of passwords
[webservers]
web1.example.com ansible_ssh_private_key_file=~/.ssh/deploy_key
web2.example.com ansible_ssh_private_key_file=~/.ssh/deploy_key
```

### Secure Downloads and Package Installation

Verify checksums and signatures when downloading files.

```yaml
## Bad - Download without verification
- name: Download binary
  get_url:
    url: https://example.com/app.tar.gz
    dest: /tmp/app.tar.gz  # No verification!

## Good - Verify checksum
- name: Download and verify binary
  get_url:
    url: https://releases.example.com/app-v1.2.3.tar.gz
    dest: /tmp/app.tar.gz
    checksum: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

## Good - Use official package repositories
- name: Install from trusted repository
  apt:
    name: nginx
    state: present
    update_cache: yes
  become: yes
```

### Audit Logging

Enable logging for security auditing.

```yaml
## ansible.cfg
[defaults]
log_path = /var/log/ansible/ansible.log
callback_whitelist = profile_tasks, timer

## Playbook example with logging
- name: Security-sensitive operations
  hosts: all
  tasks:
    - name: Log security action
      debug:
        msg: "User {{ ansible_user }} performed security action at {{ ansible_date_time.iso8601 }}"

    - name: Perform sensitive operation
      # ...
      register: result

    - name: Log operation result
      lineinfile:
        path: /var/log/app_security.log
        line: "{{ ansible_date_time.iso8601 }} - {{ ansible_user }} - {{ result.changed }}"
        create: yes
        mode: '0640'
```

### No Log for Sensitive Output

Prevent sensitive data from appearing in logs.

```yaml
## Bad - Passwords logged in output
- name: Set database password
  mysql_user:
    name: appuser
    password: "{{ db_password }}"
    state: present
  # Password will appear in Ansible logs!

## Good - Suppress logging of sensitive tasks
- name: Set database password
  mysql_user:
    name: appuser
    password: "{{ db_password }}"
    state: present
  no_log: true  # Prevents password from appearing in output

## Good - Selectively show safe data
- name: Deploy application
  copy:
    src: app.jar
    dest: /opt/app/app.jar
  register: deploy_result

- name: Show deployment status (safe)
  debug:
    msg: "Deployment changed: {{ deploy_result.changed }}"
```

---

## Tool Configuration

### ansible.cfg

```ini
[defaults]
inventory = inventory/production.yml
remote_user = deploy
host_key_checking = False
retry_files_enabled = False
gathering = smart
fact_caching = jsonfile
fact_caching_connection = /tmp/ansible_facts
fact_caching_timeout = 3600
forks = 20
timeout = 30

[privilege_escalation]
become = True
become_method = sudo
become_user = root
become_ask_pass = False

[ssh_connection]
pipelining = True
control_path = /tmp/ansible-ssh-%%h-%%p-%%r
```

### ansible-lint Configuration

```yaml
## .ansible-lint
---
skip_list:
  - yaml[line-length]  # Ignore long lines

use_default_rules: true
enable_list:
  - no-log-password
  - no-same-owner

kinds:
  - yaml: "*.yaml"
  - yaml: "*.yml"
```

---

## Best Practices

### Always Use Fully Qualified Collection Names (FQCN)

Use explicit collection names to avoid ambiguity and future-proof playbooks:

```yaml
# Good - Fully qualified collection name
- name: Install nginx
  ansible.builtin.package:
    name: nginx
    state: present

- name: Copy configuration
  ansible.builtin.copy:
    src: config.yml
    dest: /etc/app/config.yml

# Bad - Short module name (deprecated)
- name: Install nginx
  package:
    name: nginx
    state: present
```

### Always Name Tasks

Provide descriptive names for every task:

```yaml
# Good - Clear, descriptive task names
- name: Install PostgreSQL database server
  ansible.builtin.package:
    name: postgresql-server
    state: present

- name: Create application database and user
  community.postgresql.postgresql_db:
    name: appdb
    state: present

# Bad - No task names
- ansible.builtin.package:
    name: postgresql-server
    state: present
```

### Ensure Idempotency

Write tasks that can be run multiple times without causing issues:

```yaml
# Good - Idempotent operations
- name: Ensure nginx is installed
  ansible.builtin.package:
    name: nginx
    state: present  # Idempotent: installs only if missing

- name: Ensure directory exists
  ansible.builtin.file:
    path: /opt/app
    state: directory
    mode: '0755'

# Bad - Not idempotent
- name: Download file
  ansible.builtin.command: wget https://example.com/file.tar.gz -O /tmp/file.tar.gz
  # This re-downloads every time, even if file exists

# Good - Idempotent download
- name: Download file
  ansible.builtin.get_url:
    url: https://example.com/file.tar.gz
    dest: /tmp/file.tar.gz
    mode: '0644'
    checksum: sha256:abc123...
```

### Use Variables Instead of Hardcoding

Parameterize playbooks with variables:

```yaml
# Good - Variables for flexibility
---
- name: Deploy application
  hosts: webservers
  vars:
    app_name: myapp
    app_port: 8080
    app_user: appuser
    app_dir: /opt/{{ app_name }}
  tasks:
    - name: Create application directory
      ansible.builtin.file:
        path: "{{ app_dir }}"
        state: directory
        owner: "{{ app_user }}"
        mode: '0755'

# Bad - Hardcoded values
- name: Create application directory
  ansible.builtin.file:
    path: /opt/myapp
    state: directory
    owner: appuser
    mode: '0755'
```

### Organize with Roles

Structure complex playbooks using roles:

```yaml
# Good - Organized with roles
---
- name: Configure web infrastructure
  hosts: webservers
  roles:
    - role: common
      vars:
        common_packages:
          - vim
          - curl
          - git
    - role: nginx
      vars:
        nginx_worker_processes: 4
    - role: ssl_certificates
    - role: application

# Bad - Everything in one playbook
- name: Configure web infrastructure
  hosts: webservers
  tasks:
    - name: Install common packages
      ansible.builtin.package:
        name: "{{ item }}"
        state: present
      loop: [vim, curl, git]
    # ... 100 more tasks ...
```

### Use Tags for Flexibility

Tag tasks for selective execution:

```yaml
---
- name: Complete application deployment
  hosts: appservers
  tasks:
    - name: Install dependencies
      ansible.builtin.package:
        name: "{{ item }}"
        state: present
      loop:
        - python3
        - python3-pip
      tags:
        - packages
        - setup

    - name: Deploy application code
      ansible.builtin.git:
        repo: "{{ app_repo }}"
        dest: /opt/app
        version: "{{ app_version }}"
      tags:
        - deploy
        - code

    - name: Run database migrations
      ansible.builtin.command:
        cmd: python3 manage.py migrate
        chdir: /opt/app
      tags:
        - deploy
        - database

# Run only deployment tasks
# ansible-playbook site.yml --tags "deploy"

# Skip database migrations
# ansible-playbook site.yml --skip-tags "database"
```

### Implement Proper Error Handling

Use blocks with rescue for robust error handling:

```yaml
---
- name: Deploy with automatic rollback
  hosts: appservers
  tasks:
    - name: Deployment with rollback
      block:
        - name: Stop application
          ansible.builtin.service:
            name: myapp
            state: stopped

        - name: Deploy new version
          ansible.builtin.copy:
            src: app-v2.jar
            dest: /opt/app/app.jar
            backup: true
          register: deploy_result

        - name: Start application
          ansible.builtin.service:
            name: myapp
            state: started

        - name: Wait for health check
          ansible.builtin.uri:
            url: http://localhost:8080/health
            status_code: 200
          retries: 10
          delay: 5

      rescue:
        - name: Rollback on failure
          ansible.builtin.copy:
            src: "{{ deploy_result.backup_file }}"
            dest: /opt/app/app.jar
            remote_src: true
          when: deploy_result.backup_file is defined

        - name: Restart with previous version
          ansible.builtin.service:
            name: myapp
            state: restarted

        - name: Send failure notification
          ansible.builtin.debug:
            msg: "Deployment failed, rolled back to previous version"

      always:
        - name: Clean up temporary files
          ansible.builtin.file:
            path: /tmp/deploy
            state: absent
```

### Use Ansible Vault for Secrets

Never store secrets in plain text:

```yaml
# Good - Use vault for secrets
---
# vars/vault.yml (encrypted)
vault_db_password: "SuperSecret123"
vault_api_key: "sk_live_abc123"

# playbook.yml
- name: Configure application
  hosts: appservers
  vars_files:
    - vars/vault.yml
  tasks:
    - name: Deploy configuration
      ansible.builtin.template:
        src: config.yml.j2
        dest: /etc/app/config.yml
        mode: '0600'
      no_log: true  # Prevent secrets in output

# Run with: ansible-playbook playbook.yml --ask-vault-pass
```

```bash
# Encrypt secrets file
ansible-vault encrypt vars/vault.yml

# Encrypt inline string
ansible-vault encrypt_string 'SuperSecret123' --name 'vault_db_password'
```

### Disable Fact Gathering When Not Needed

Improve performance by skipping unnecessary fact gathering:

```yaml
# Good - Disable when facts not needed
---
- name: Simple file deployment
  hosts: all
  gather_facts: false  # Saves 2-5 seconds per host
  tasks:
    - name: Copy application files
      ansible.builtin.copy:
        src: app.jar
        dest: /opt/app/

# Good - Gather only required facts
- name: OS-specific configuration
  hosts: all
  gather_facts: true
  gather_subset:
    - '!all'
    - '!min'
    - network
    - virtual
  tasks:
    - name: Configure based on OS
      ansible.builtin.template:
        src: "config_{{ ansible_os_family }}.j2"
        dest: /etc/app/config.yml
```

### Use Check Mode for Dry Runs

Test playbooks before execution:

```bash
# Run in check mode (dry run)
ansible-playbook site.yml --check

# Show differences that would be made
ansible-playbook site.yml --check --diff

# Limit to specific hosts
ansible-playbook site.yml --check --limit webservers
```

```yaml
# Mark tasks that support check mode
- name: Create directory
  ansible.builtin.file:
    path: /opt/app
    state: directory
  check_mode: yes  # Always runs in check mode

# Mark tasks that should run even in check mode
- name: Gather current state
  ansible.builtin.command: cat /etc/app/version
  check_mode: no  # Runs even when --check is used
  changed_when: false
```

### Version Pin Collections

Specify collection versions in requirements.yml:

```yaml
# collections/requirements.yml
---
collections:
  - name: community.general
    version: ">=5.0.0,<6.0.0"
  - name: ansible.posix
    version: "1.5.4"
  - name: community.docker
    version: "3.4.8"

# Install collections
# ansible-galaxy collection install -r collections/requirements.yml
```

### Document Playbooks and Roles

Add clear documentation to playbooks and roles:

```yaml
---
# playbooks/deploy-app.yml

## @module application_deployment
## @description Deploy application to production servers
## @dependencies ansible.builtin, community.general
## @version 2.1.0
## @author DevOps Team
## @tags deployment, production, application
##
## Variables:
##   app_version: Application version to deploy (required)
##   app_environment: Target environment (dev/staging/prod)
##   skip_migrations: Skip database migrations (default: false)
##
## Usage:
##   ansible-playbook playbooks/deploy-app.yml -e "app_version=1.2.3"

- name: Deploy application to production
  hosts: appservers
  vars:
    app_environment: production
    skip_migrations: false
  tasks:
    # ... tasks ...
```

### Use Handlers Correctly

Trigger handlers efficiently and flush when needed:

```yaml
---
- name: Configure nginx
  hosts: webservers
  tasks:
    - name: Update nginx main configuration
      ansible.builtin.template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: Reload nginx

    - name: Update virtual host configuration
      ansible.builtin.template:
        src: vhost.conf.j2
        dest: /etc/nginx/sites-enabled/{{ item }}
      loop: "{{ nginx_vhosts }}"
      notify: Reload nginx

    # Handler runs once even though notified twice

  handlers:
    - name: Reload nginx
      ansible.builtin.service:
        name: nginx
        state: reloaded

# Force handler execution before testing
- name: Test configuration
  hosts: webservers
  tasks:
    - name: Update nginx config
      ansible.builtin.template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: Reload nginx

    - name: Force handler execution
      ansible.builtin.meta: flush_handlers

    - name: Test nginx is responding
      ansible.builtin.uri:
        url: http://localhost/health
        status_code: 200
```

### Validate Templates

Use the validate parameter to test configurations before deployment:

```yaml
---
- name: Deploy nginx configuration
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
    validate: 'nginx -t -c %s'
    backup: true
  notify: Reload nginx

- name: Deploy SSH daemon config
  ansible.builtin.template:
    src: sshd_config.j2
    dest: /etc/ssh/sshd_config
    validate: '/usr/sbin/sshd -t -f %s'
    mode: '0600'
  notify: Restart sshd
```

### Use Assertions for Prerequisites

Validate requirements before executing playbooks:

```yaml
---
- name: Deploy application
  hosts: appservers
  tasks:
    - name: Verify required variables are defined
      ansible.builtin.assert:
        that:
          - app_version is defined
          - app_version is match('^\d+\.\d+\.\d+$')
          - app_environment in ['dev', 'staging', 'prod']
          - db_host is defined
        fail_msg: "Required variables are missing or invalid"
        success_msg: "All prerequisites validated"

    - name: Check disk space before deployment
      ansible.builtin.assert:
        that:
          - ansible_mounts | selectattr('mount', 'equalto', '/opt') | map(attribute='size_available') | first > 5000000000
        fail_msg: "Insufficient disk space on /opt (need 5GB)"

    - name: Proceed with deployment
      # ... deployment tasks ...
```

### Use Delegation Appropriately

Run tasks on different hosts when needed:

```yaml
---
- name: Database operations
  hosts: appservers
  tasks:
    - name: Run database migration (on db server)
      ansible.builtin.command: /opt/scripts/migrate.sh
      delegate_to: "{{ groups['dbservers'][0] }}"
      run_once: true  # Run only once, not for each appserver

    - name: Add host to monitoring (on monitoring server)
      community.general.datadog_monitor:
        name: "{{ inventory_hostname }}"
        state: present
      delegate_to: monitoring.example.com

    - name: Update load balancer (locally)
      ansible.builtin.uri:
        url: "https://lb.example.com/api/update"
        method: POST
        body_format: json
        body:
          server: "{{ inventory_hostname }}"
      delegate_to: localhost
```

### Optimize with Async and Polling

Run long tasks asynchronously:

```yaml
---
- name: Long-running tasks
  hosts: appservers
  tasks:
    - name: Start long backup process
      ansible.builtin.command: /usr/local/bin/backup.sh
      async: 3600  # Allow up to 1 hour
      poll: 0  # Fire and forget
      register: backup_job

    - name: Continue with other tasks
      ansible.builtin.debug:
        msg: "Backup running in background"

    - name: Check backup job status
      ansible.builtin.async_status:
        jid: "{{ backup_job.ansible_job_id }}"
      register: backup_result
      until: backup_result.finished
      retries: 60
      delay: 60  # Check every minute

# Run tasks in parallel across hosts
- name: Install packages in parallel
  hosts: all
  strategy: free  # Don't wait for all hosts to finish each task
  tasks:
    - name: Install updates
      ansible.builtin.package:
        name: "*"
        state: latest
```

### Use Includes and Imports Strategically

Break up large playbooks:

```yaml
# main.yml
---
- name: Full infrastructure deployment
  hosts: all
  tasks:
    - name: Include pre-deployment checks
      ansible.builtin.include_tasks: tasks/pre_checks.yml

    - name: Import common configuration (static)
      ansible.builtin.import_tasks: tasks/common_setup.yml

    - name: Include environment-specific tasks (dynamic)
      ansible.builtin.include_tasks: "tasks/{{ app_environment }}_setup.yml"

    - name: Import roles based on host group
      ansible.builtin.include_role:
        name: "{{ item }}"
      loop: "{{ group_names }}"
      when: item in ['webserver', 'database', 'cache']
```

---

## References

### Official Documentation

- [Ansible Documentation](https://docs.ansible.com/)
- [Ansible Collections](https://docs.ansible.com/ansible/latest/collections_guide/index.html)
- [Ansible Best Practices](https://docs.ansible.com/ansible/latest/tips_tricks/ansible_tips_tricks.html)

### Tools

- [ansible-lint](https://ansible-lint.readthedocs.io/) - Linter for Ansible playbooks
- [Molecule](https://molecule.readthedocs.io/) - Testing framework for Ansible roles
- [Ansible Galaxy](https://galaxy.ansible.com/) - Repository for collections and roles

### Community Resources

- [Ansible Community Guide](https://docs.ansible.com/ansible/latest/community/index.html)
- [Ansible Collections on GitHub](https://github.com/ansible-collections)

---

**Status**: Active
