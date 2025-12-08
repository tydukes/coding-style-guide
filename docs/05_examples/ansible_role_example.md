---
title: "Complete Ansible Role Example"
description: "Full working example of a production-ready Ansible role with best practices"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [ansible, role, example, nginx, best-practices, complete]
category: "Examples"
status: "active"
version: "1.0.0"
---

## Overview

This is a complete, production-ready Ansible role called **ansible-role-nginx** that installs and configures
Nginx web server with SSL support. It demonstrates all best practices for Ansible role development including
multi-OS support, templating, handlers, and automated testing with Molecule.

**Role Purpose**: Install and configure Nginx with SSL certificates, virtual hosts, and security hardening.

---

## Role Structure

```text
ansible-role-nginx/
├── README.md
├── meta/
│   └── main.yml
├── defaults/
│   └── main.yml
├── vars/
│   ├── Debian.yml
│   └── RedHat.yml
├── tasks/
│   ├── main.yml
│   ├── install.yml
│   ├── configure.yml
│   ├── ssl.yml
│   └── security.yml
├── handlers/
│   └── main.yml
├── templates/
│   ├── nginx.conf.j2
│   ├── site.conf.j2
│   └── ssl.conf.j2
├── files/
│   └── .gitkeep
├── molecule/
│   └── default/
│       ├── molecule.yml
│       ├── converge.yml
│       └── verify.yml
└── .yamllint
```

---

## README.md

```markdown
## Ansible Role: Nginx

[![CI](https://github.com/yourusername/ansible-role-nginx/workflows/CI/badge.svg)](https://github.com/yourusername/ansible-role-nginx/actions)
[![Ansible Galaxy](https://img.shields.io/badge/galaxy-yourusername.nginx-blue.svg)](https://galaxy.ansible.com/yourusername/nginx)

Ansible role for installing and configuring Nginx web server with SSL support.

## Requirements

- Ansible >= 2.10
- Supported platforms:
  - Ubuntu 20.04, 22.04
  - Debian 11, 12
  - RHEL/CentOS 8, 9
  - Rocky Linux 8, 9

## Role Variables

Available variables are listed below, along with default values (see `defaults/main.yml`):

\```yaml
## Nginx version (use 'latest' or specific version)
nginx_version: latest

## Enable/disable nginx service
nginx_enabled: true
nginx_state: started

## Nginx user and group
nginx_user: www-data
nginx_group: www-data

## Performance tuning
nginx_worker_processes: auto
nginx_worker_connections: 1024

## SSL configuration
nginx_ssl_enabled: true
nginx_ssl_protocols: "TLSv1.2 TLSv1.3"
nginx_ssl_ciphers: "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256"

## Virtual hosts
nginx_sites: []
##  - name: example.com
##    server_name: example.com www.example.com
##    root: /var/www/example.com
##    ssl_enabled: true
##    ssl_certificate: /etc/ssl/certs/example.com.crt
##    ssl_certificate_key: /etc/ssl/private/example.com.key
\```

## Dependencies

None.

## Example Playbook

\```yaml
- hosts: webservers
  become: true
  roles:
    - role: yourusername.nginx
      nginx_sites:
        - name: example.com
          server_name: example.com www.example.com
          root: /var/www/example.com
          ssl_enabled: true
          ssl_certificate: /etc/ssl/certs/example.com.crt
          ssl_certificate_key: /etc/ssl/private/example.com.key
\```

## Testing

This role includes Molecule tests:

\```bash
## Install dependencies
pip install molecule molecule-docker ansible-lint

## Run tests
molecule test
\```

## License

MIT

## Author Information

This role was created by [Your Name](https://github.com/yourusername).
```

---

## meta/main.yml

```yaml
---
galaxy_info:
  role_name: nginx
  author: Your Name
  description: Install and configure Nginx web server
  company: Your Company
  license: MIT
  min_ansible_version: "2.10"

  platforms:
    - name: Ubuntu
      versions:
        - focal
        - jammy
    - name: Debian
      versions:
        - bullseye
        - bookworm
    - name: EL
      versions:
        - "8"
        - "9"

  galaxy_tags:
    - nginx
    - web
    - webserver
    - ssl
    - https

dependencies: []
```

---

## defaults/main.yml

```yaml
---
## Nginx version
nginx_version: latest

## Service configuration
nginx_enabled: true
nginx_state: started

## User and group (will be set per OS in vars/)
nginx_user: www-data
nginx_group: www-data

## Performance tuning
nginx_worker_processes: auto
nginx_worker_connections: 1024
nginx_multi_accept: "on"
nginx_keepalive_timeout: 65

## Buffer sizes
nginx_client_body_buffer_size: 128k
nginx_client_max_body_size: 10m

## Logging
nginx_access_log: /var/log/nginx/access.log
nginx_error_log: /var/log/nginx/error.log
nginx_log_level: warn

## SSL/TLS configuration
nginx_ssl_enabled: true
nginx_ssl_protocols: "TLSv1.2 TLSv1.3"
nginx_ssl_ciphers: >-
  ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:
  ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
nginx_ssl_prefer_server_ciphers: "off"
nginx_ssl_session_cache: "shared:SSL:10m"
nginx_ssl_session_timeout: "10m"

## Security headers
nginx_security_headers:
  X-Frame-Options: "DENY"
  X-Content-Type-Options: "nosniff"
  X-XSS-Protection: "1; mode=block"
  Referrer-Policy: "no-referrer-when-downgrade"

## Virtual hosts
nginx_sites: []

## Remove default site
nginx_remove_default_site: true

## Configuration paths
nginx_conf_path: /etc/nginx/nginx.conf
nginx_sites_available_path: /etc/nginx/sites-available
nginx_sites_enabled_path: /etc/nginx/sites-enabled
```

---

## vars/Debian.yml

```yaml
---
nginx_package: nginx
nginx_service: nginx
nginx_user: www-data
nginx_group: www-data
nginx_conf_path: /etc/nginx/nginx.conf
nginx_pid_file: /run/nginx.pid
```

---

## vars/RedHat.yml

```yaml
---
nginx_package: nginx
nginx_service: nginx
nginx_user: nginx
nginx_group: nginx
nginx_conf_path: /etc/nginx/nginx.conf
nginx_pid_file: /var/run/nginx.pid
```

---

## tasks/main.yml

```yaml
---
- name: Include OS-specific variables
  ansible.builtin.include_vars: "{{ ansible_os_family }}.yml"
  tags: [nginx, always]

- name: Include installation tasks
  ansible.builtin.include_tasks: install.yml
  tags: [nginx, nginx-install]

- name: Include configuration tasks
  ansible.builtin.include_tasks: configure.yml
  tags: [nginx, nginx-configure]

- name: Include SSL configuration tasks
  ansible.builtin.include_tasks: ssl.yml
  when: nginx_ssl_enabled | bool
  tags: [nginx, nginx-ssl]

- name: Include security tasks
  ansible.builtin.include_tasks: security.yml
  tags: [nginx, nginx-security]

- name: Ensure nginx is started and enabled
  ansible.builtin.service:
    name: "{{ nginx_service }}"
    state: "{{ nginx_state }}"
    enabled: "{{ nginx_enabled }}"
  tags: [nginx, nginx-service]
```

---

## tasks/install.yml

```yaml
---
- name: Update apt cache (Debian)
  ansible.builtin.apt:
    update_cache: true
    cache_valid_time: 3600
  when: ansible_os_family == 'Debian'
  tags: [nginx, nginx-install]

- name: Install nginx package
  ansible.builtin.package:
    name: "{{ nginx_package }}"
    state: "{{ 'latest' if nginx_version == 'latest' else 'present' }}"
  notify: Restart nginx
  tags: [nginx, nginx-install]

- name: Ensure nginx configuration directories exist
  ansible.builtin.file:
    path: "{{ item }}"
    state: directory
    owner: root
    group: root
    mode: "0755"
  loop:
    - "{{ nginx_sites_available_path }}"
    - "{{ nginx_sites_enabled_path }}"
  tags: [nginx, nginx-install]
```

---

## tasks/configure.yml

```yaml
---
- name: Deploy nginx main configuration
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: "{{ nginx_conf_path }}"
    owner: root
    group: root
    mode: "0644"
    validate: nginx -t -c %s
  notify: Reload nginx
  tags: [nginx, nginx-configure]

- name: Remove default site
  ansible.builtin.file:
    path: "{{ nginx_sites_enabled_path }}/default"
    state: absent
  when: nginx_remove_default_site | bool
  notify: Reload nginx
  tags: [nginx, nginx-configure]

- name: Configure virtual hosts
  ansible.builtin.template:
    src: site.conf.j2
    dest: "{{ nginx_sites_available_path }}/{{ item.name }}.conf"
    owner: root
    group: root
    mode: "0644"
  loop: "{{ nginx_sites }}"
  notify: Reload nginx
  tags: [nginx, nginx-configure, nginx-sites]

- name: Enable virtual hosts
  ansible.builtin.file:
    src: "{{ nginx_sites_available_path }}/{{ item.name }}.conf"
    dest: "{{ nginx_sites_enabled_path }}/{{ item.name }}.conf"
    state: link
  loop: "{{ nginx_sites }}"
  notify: Reload nginx
  tags: [nginx, nginx-configure, nginx-sites]

- name: Ensure document roots exist
  ansible.builtin.file:
    path: "{{ item.root }}"
    state: directory
    owner: "{{ nginx_user }}"
    group: "{{ nginx_group }}"
    mode: "0755"
  loop: "{{ nginx_sites }}"
  when: item.root is defined
  tags: [nginx, nginx-configure, nginx-sites]
```

---

## tasks/ssl.yml

```yaml
---
- name: Ensure SSL directory exists
  ansible.builtin.file:
    path: /etc/nginx/ssl
    state: directory
    owner: root
    group: root
    mode: "0755"
  tags: [nginx, nginx-ssl]

- name: Deploy SSL configuration
  ansible.builtin.template:
    src: ssl.conf.j2
    dest: /etc/nginx/ssl/ssl.conf
    owner: root
    group: root
    mode: "0644"
  notify: Reload nginx
  tags: [nginx, nginx-ssl]

- name: Check SSL certificates exist
  ansible.builtin.stat:
    path: "{{ item.ssl_certificate }}"
  loop: "{{ nginx_sites }}"
  when:
    - item.ssl_enabled is defined
    - item.ssl_enabled | bool
  register: ssl_certs
  failed_when: false
  tags: [nginx, nginx-ssl]

- name: Warn about missing SSL certificates
  ansible.builtin.debug:
    msg: "Warning: SSL certificate not found: {{ item.item.ssl_certificate }}"
  loop: "{{ ssl_certs.results }}"
  when:
    - item.stat is defined
    - not item.stat.exists
  tags: [nginx, nginx-ssl]
```

---

## tasks/security.yml

```yaml
---
- name: Set proper permissions on nginx directories
  ansible.builtin.file:
    path: "{{ item }}"
    state: directory
    owner: root
    group: root
    mode: "0755"
  loop:
    - /etc/nginx
    - /var/log/nginx
  tags: [nginx, nginx-security]

- name: Ensure nginx user has minimal privileges
  ansible.builtin.user:
    name: "{{ nginx_user }}"
    shell: /usr/sbin/nologin
    system: true
    create_home: false
  tags: [nginx, nginx-security]

- name: Configure firewall for HTTP/HTTPS (UFW)
  community.general.ufw:
    rule: allow
    port: "{{ item }}"
    proto: tcp
  loop:
    - "80"
    - "443"
  when:
    - ansible_os_family == 'Debian'
    - nginx_configure_firewall | default(false) | bool
  tags: [nginx, nginx-security, nginx-firewall]

- name: Configure firewall for HTTP/HTTPS (firewalld)
  ansible.posix.firewalld:
    service: "{{ item }}"
    permanent: true
    state: enabled
  loop:
    - http
    - https
  when:
    - ansible_os_family == 'RedHat'
    - nginx_configure_firewall | default(false) | bool
  notify: Reload firewalld
  tags: [nginx, nginx-security, nginx-firewall]
```

---

## handlers/main.yml

```yaml
---
- name: Restart nginx
  ansible.builtin.service:
    name: "{{ nginx_service }}"
    state: restarted

- name: Reload nginx
  ansible.builtin.service:
    name: "{{ nginx_service }}"
    state: reloaded

- name: Reload firewalld
  ansible.builtin.service:
    name: firewalld
    state: reloaded
```

---

## templates/nginx.conf.j2

```nginx
user {{ nginx_user }} {{ nginx_group }};
worker_processes {{ nginx_worker_processes }};
pid {{ nginx_pid_file }};
error_log {{ nginx_error_log }} {{ nginx_log_level }};

events {
    worker_connections {{ nginx_worker_connections }};
    multi_accept {{ nginx_multi_accept }};
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout {{ nginx_keepalive_timeout }};
    types_hash_max_size 2048;
    server_tokens off;

    # Buffer Sizes
    client_body_buffer_size {{ nginx_client_body_buffer_size }};
    client_max_body_size {{ nginx_client_max_body_size }};

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log {{ nginx_access_log }};

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;
    gzip_disable "msie6";

{% if nginx_ssl_enabled %}
    # SSL Settings
    include /etc/nginx/ssl/ssl.conf;
{% endif %}

    # Virtual Host Configurations
    include {{ nginx_sites_enabled_path }}/*;
}
```

---

## templates/site.conf.j2

```nginx
{% if item.ssl_enabled | default(false) %}
## Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name {{ item.server_name }};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name {{ item.server_name }};

    ssl_certificate {{ item.ssl_certificate }};
    ssl_certificate_key {{ item.ssl_certificate_key }};

{% else %}
server {
    listen 80;
    listen [::]:80;
    server_name {{ item.server_name }};
{% endif %}

    root {{ item.root }};
    index index.html index.htm index.nginx-debian.html;

    # Security Headers
{% for header, value in nginx_security_headers.items() %}
    add_header {{ header }} "{{ value }}" always;
{% endfor %}

    location / {
        try_files $uri $uri/ =404;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Custom error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;

    # Access and error logs
    access_log /var/log/nginx/{{ item.name }}_access.log;
    error_log /var/log/nginx/{{ item.name }}_error.log;
}
```

---

## templates/ssl.conf.j2

```nginx
## SSL Protocols and Ciphers
ssl_protocols {{ nginx_ssl_protocols }};
ssl_ciphers {{ nginx_ssl_ciphers }};
ssl_prefer_server_ciphers {{ nginx_ssl_prefer_server_ciphers }};

## SSL Session
ssl_session_cache {{ nginx_ssl_session_cache }};
ssl_session_timeout {{ nginx_ssl_session_timeout }};
ssl_session_tickets off;

## OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

## Security Headers
add_header Strict-Transport-Security "max-age=63072000" always;
```

---

## molecule/default/molecule.yml

```yaml
---
dependency:
  name: galaxy

driver:
  name: docker

platforms:
  - name: ubuntu-22
    image: geerlingguy/docker-ubuntu2204-ansible:latest
    command: ""
    volumes:
      - /sys/fs/cgroup:/sys/fs/cgroup:rw
    cgroupns_mode: host
    privileged: true
    pre_build_image: true

  - name: debian-12
    image: geerlingguy/docker-debian12-ansible:latest
    command: ""
    volumes:
      - /sys/fs/cgroup:/sys/fs/cgroup:rw
    cgroupns_mode: host
    privileged: true
    pre_build_image: true

provisioner:
  name: ansible
  config_options:
    defaults:
      callbacks_enabled: profile_tasks, timer, yaml
  playbooks:
    converge: converge.yml

verifier:
  name: ansible
```

---

## molecule/default/converge.yml

```yaml
---
- name: Converge
  hosts: all
  become: true

  vars:
    nginx_sites:
      - name: test-site
        server_name: test.example.com
        root: /var/www/test-site
        ssl_enabled: false

  roles:
    - role: ansible-role-nginx
```

---

## molecule/default/verify.yml

```yaml
---
- name: Verify
  hosts: all
  become: true

  tasks:
    - name: Check nginx is installed
      ansible.builtin.package_facts:
        manager: auto

    - name: Assert nginx package is installed
      ansible.builtin.assert:
        that:
          - "'nginx' in ansible_facts.packages"

    - name: Check nginx service is running
      ansible.builtin.service_facts:

    - name: Assert nginx service is running
      ansible.builtin.assert:
        that:
          - ansible_facts.services['nginx.service'].state == 'running'

    - name: Check nginx is listening on port 80
      ansible.builtin.wait_for:
        port: 80
        timeout: 10

    - name: Check nginx configuration is valid
      ansible.builtin.command: nginx -t
      changed_when: false

    - name: Check test site is configured
      ansible.builtin.stat:
        path: /etc/nginx/sites-enabled/test-site.conf
      register: test_site

    - name: Assert test site configuration exists
      ansible.builtin.assert:
        that:
          - test_site.stat.exists
```

---

## .yamllint

```yaml
---
extends: default

rules:
  line-length:
    max: 120
    level: warning
  indentation:
    spaces: 2
    indent-sequences: true
  truthy:
    allowed-values: ['true', 'false', 'yes', 'no']
```

---

## Key Features Demonstrated

This complete Ansible role example demonstrates:

1. **Multi-OS Support**: Variables per OS family (Debian/RedHat)
2. **Idempotency**: All tasks are idempotent and can be run multiple times
3. **Templating**: Jinja2 templates for nginx configuration
4. **Handlers**: Restart/reload nginx only when configuration changes
5. **Variables**: Defaults, vars, and role variables with proper precedence
6. **Tasks Organization**: Separate task files for logical grouping
7. **Tags**: Granular control over which tasks to run
8. **Validation**: nginx -t validation before applying configuration
9. **Security**: Security headers, SSL configuration, minimal privileges
10. **Testing**: Molecule tests with Docker for automated validation
11. **Documentation**: Comprehensive README with examples
12. **Metadata**: Galaxy metadata for role distribution

The role is production-ready and follows Ansible best practices for reusability and maintainability.

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
