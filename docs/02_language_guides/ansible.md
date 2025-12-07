---
title: "Ansible Style Guide"
description: "Configuration management standards for Ansible playbooks and roles"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [ansible, configuration-management, automation, devops, collections]
category: "Language Guides"
status: "active"
version: "1.0.0"
---

## Language Overview

**Ansible** is an agentless configuration management and automation platform that uses YAML-based
playbooks to define infrastructure as code. Modern Ansible development emphasizes collections
over standalone roles.

### Key Characteristics

- **Paradigm**: Declarative configuration management
- **Language**: YAML with Jinja2 templating
- **Architecture**: Agentless (SSH/WinRM)
- **Version Support**: Ansible 2.15.x through 2.17.x
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
# Good - Using collection
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

# Install collections from Ansible Galaxy
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
# @module web_server_deployment
# @description Deploy and configure nginx web servers
# @dependencies ansible.builtin, community.general
# @version 1.0.0
# @author Tyler Dukes
# @last_updated 2025-10-28

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
# inventory/production.ini
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
# inventory/production.yml
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
# group_vars/webservers.yml
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
# Example showing variable override
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
# roles/webserver/tasks/main.yml
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
# roles/webserver/defaults/main.yml
---
nginx_package_name: nginx
nginx_user: www-data
nginx_group: www-data
nginx_document_root: /var/www/html
nginx_port: 80
nginx_worker_processes: auto
```

```yaml
# roles/webserver/meta/main.yml
---
galaxy_info:
  author: Tyler Dukes
  description: Configure nginx web server
  min_ansible_version: "2.15"
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
# handlers/main.yml
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

# Using handlers in tasks
---
- name: Update nginx configuration
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  notify:
    - Reload systemd
    - Reload nginx  # Handlers run in order defined

# Force handler execution
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
# Common filters
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
# Create encrypted file
ansible-vault create secrets.yml

# Edit encrypted file
ansible-vault edit secrets.yml

# Encrypt existing file
ansible-vault encrypt vars/secrets.yml

# Decrypt file
ansible-vault decrypt vars/secrets.yml

# View encrypted file
ansible-vault view secrets.yml

# Rekey (change password)
ansible-vault rekey secrets.yml
```

### Using Vault in Playbooks

```yaml
# Store sensitive data in vault
# vars/secrets.yml (encrypted)
---
db_password: super_secret_password
api_key: secret_api_key_12345

# Reference vault file in playbook
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

# Run playbook with vault password
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

# Run specific tags
# ansible-playbook site.yml --tags "deploy"
# ansible-playbook site.yml --tags "packages,database"
# ansible-playbook site.yml --skip-tags "migrations"
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
# Initialize molecule scenario
molecule init scenario default

# Run full test sequence
molecule test

# Individual steps
molecule create       # Create test instances
molecule converge     # Run playbook
molecule verify       # Run test assertions
molecule destroy      # Destroy test instances
```

### Molecule Configuration

```yaml
# molecule/default/molecule.yml
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
# molecule/default/verify.yml
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

---

## Anti-Patterns

### ❌ Avoid: Shell/Command for Everything

```yaml
# Bad - Using shell when module exists
- name: Install package
  ansible.builtin.shell: apt-get install -y nginx

# Good - Use appropriate module
- name: Install package
  ansible.builtin.package:
    name: nginx
    state: present
```

### ❌ Avoid: Hardcoded Values

```yaml
# Bad - Hardcoded paths and values
- name: Deploy config
  ansible.builtin.copy:
    src: app.conf
    dest: /opt/myapp/config/app.conf
    owner: ubuntu
    mode: '0644'

# Good - Use variables
- name: Deploy config
  ansible.builtin.copy:
    src: app.conf
    dest: "{{ app_config_dir }}/app.conf"
    owner: "{{ app_user }}"
    mode: "{{ app_config_mode }}"
```

### ❌ Avoid: No Idempotency

```yaml
# Bad - Not idempotent (runs every time)
- name: Download file
  ansible.builtin.command: wget https://example.com/file.tar.gz
  args:
    chdir: /tmp

# Good - Idempotent check
- name: Download file
  ansible.builtin.get_url:
    url: https://example.com/file.tar.gz
    dest: /tmp/file.tar.gz
    mode: '0644'
```

### ❌ Avoid: Ignoring Return Codes

```yaml
# Bad - Ignoring all errors
- name: Stop service
  ansible.builtin.command: systemctl stop myapp
  ignore_errors: true

# Good - Specific error handling
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
# Bad - Everything in one massive playbook
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

# Good - Organized into roles
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
# Bad - Inefficient loop
- name: Install packages
  ansible.builtin.package:
    name: "{{ item }}"
    state: present
  loop:
    - nginx
    - postgresql
    - redis

# Good - Install all at once
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
# Bad - Secrets in plain text
- name: Configure database
  ansible.builtin.template:
    src: database.yml.j2
    dest: /etc/app/database.yml
  vars:
    db_password: "MySecretPassword123"  # ❌ Plain text!

# Good - Use Ansible Vault
# Encrypt with: ansible-vault encrypt vars/secrets.yml
- name: Configure database
  ansible.builtin.template:
    src: database.yml.j2
    dest: /etc/app/database.yml
  vars_files:
    - vars/secrets.yml  # ✅ Encrypted vault file

# Or use vault inline
- name: Configure database
  ansible.builtin.template:
    src: database.yml.j2
    dest: /etc/app/database.yml
  vars:
    db_password: "{{ vault_db_password }}"  # ✅ From vault
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
# .ansible-lint
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

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
