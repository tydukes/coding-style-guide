---
title: "Ansible Refactoring Examples"
description: "Real-world Ansible code refactoring examples with before/after comparisons"
author: "Tyler Dukes"
date: "2025-12-06"
tags: [ansible, refactoring, best-practices, examples, automation]
category: "Refactoring"
status: "active"
version: "1.0.0"
---

Real-world examples of refactoring Ansible playbooks and roles to improve maintainability, reusability, and adherence
to best practices.

## Extract Roles from Playbooks

### Problem: Monolithic playbook doing everything

**Before** (280-line playbook with everything inline):

```yaml
---
- name: Configure web servers
  hosts: webservers
  become: true
  vars:
    app_name: myapp
    app_version: 1.0.0
    app_port: 8080

  tasks:
    - name: Install system packages
      apt:
        name:
          - nginx
          - python3-pip
          - git
          - ufw
        state: present
        update_cache: yes

    - name: Create application user
      user:
        name: "{{ app_name }}"
        system: yes
        shell: /bin/bash
        home: "/opt/{{ app_name }}"

    - name: Create application directories
      file:
        path: "{{ item }}"
        state: directory
        owner: "{{ app_name }}"
        group: "{{ app_name }}"
        mode: '0755'
      loop:
        - "/opt/{{ app_name }}"
        - "/opt/{{ app_name }}/releases"
        - "/opt/{{ app_name }}/shared"
        - "/var/log/{{ app_name }}"

    - name: Clone application repository
      git:
        repo: "https://github.com/example/myapp.git"
        dest: "/opt/{{ app_name }}/releases/{{ app_version }}"
        version: "v{{ app_version }}"
      become_user: "{{ app_name }}"

    - name: Install Python dependencies
      pip:
        requirements: "/opt/{{ app_name }}/releases/{{ app_version }}/requirements.txt"
        virtualenv: "/opt/{{ app_name }}/venv"
      become_user: "{{ app_name }}"

    - name: Copy application config
      template:
        src: app_config.j2
        dest: "/opt/{{ app_name }}/shared/config.yaml"
        owner: "{{ app_name }}"
        group: "{{ app_name }}"
        mode: '0640'

    - name: Create systemd service file
      template:
        src: systemd_service.j2
        dest: "/etc/systemd/system/{{ app_name }}.service"
        mode: '0644'
      notify: reload systemd

    - name: Configure nginx
      template:
        src: nginx_config.j2
        dest: "/etc/nginx/sites-available/{{ app_name }}"
        mode: '0644'
      notify: restart nginx

    - name: Enable nginx site
      file:
        src: "/etc/nginx/sites-available/{{ app_name }}"
        dest: "/etc/nginx/sites-enabled/{{ app_name }}"
        state: link
      notify: restart nginx

    - name: Configure firewall
      ufw:
        rule: allow
        port: "{{ item }}"
        proto: tcp
      loop:
        - "80"
        - "443"
        - "{{ app_port }}"

    - name: Enable firewall
      ufw:
        state: enabled

    # ... 100+ more lines of tasks ...

  handlers:
    - name: reload systemd
      systemd:
        daemon_reload: yes

    - name: restart nginx
      service:
        name: nginx
        state: restarted

    - name: restart application
      service:
        name: "{{ app_name }}"
        state: restarted
```

**After** (modular role-based structure):

```yaml
## playbooks/configure_webservers.yml (now 20 lines)
---
- name: Configure web servers
  hosts: webservers
  become: true

  roles:
    - role: common
      tags: common

    - role: nginx
      tags: nginx

    - role: application
      vars:
        app_name: myapp
        app_version: 1.0.0
        app_port: 8080
        app_repo: "https://github.com/example/myapp.git"
      tags: application

    - role: firewall
      vars:
        firewall_allowed_ports:
          - { port: 80, proto: tcp }
          - { port: 443, proto: tcp }
          - { port: 8080, proto: tcp }
      tags: firewall

## roles/common/tasks/main.yml
---
- name: Install system packages
  apt:
    name: "{{ common_packages }}"
    state: present
    update_cache: yes
    cache_valid_time: 3600

- name: Configure timezone
  timezone:
    name: "{{ system_timezone }}"

- name: Set hostname
  hostname:
    name: "{{ inventory_hostname }}"

## roles/common/defaults/main.yml
---
common_packages:
  - curl
  - git
  - vim
  - ufw
  - python3-pip

system_timezone: "UTC"

## roles/application/tasks/main.yml
---
- name: Include user setup
  import_tasks: user.yml

- name: Include directory setup
  import_tasks: directories.yml

- name: Include deployment tasks
  import_tasks: deploy.yml

- name: Include service configuration
  import_tasks: service.yml

## roles/application/tasks/user.yml
---
- name: Create application user
  user:
    name: "{{ app_name }}"
    system: yes
    shell: /bin/bash
    home: "{{ app_home }}"
    create_home: yes

## roles/application/tasks/directories.yml
---
- name: Create application directories
  file:
    path: "{{ item }}"
    state: directory
    owner: "{{ app_name }}"
    group: "{{ app_name }}"
    mode: '0755'
  loop: "{{ app_directories }}"

## roles/application/tasks/deploy.yml
---
- name: Clone application repository
  git:
    repo: "{{ app_repo }}"
    dest: "{{ app_release_path }}"
    version: "v{{ app_version }}"
  become_user: "{{ app_name }}"
  notify: restart application

- name: Install Python dependencies
  pip:
    requirements: "{{ app_release_path }}/requirements.txt"
    virtualenv: "{{ app_venv_path }}"
  become_user: "{{ app_name }}"

- name: Copy application config
  template:
    src: config.yaml.j2
    dest: "{{ app_shared_path }}/config.yaml"
    owner: "{{ app_name }}"
    group: "{{ app_name }}"
    mode: '0640'
  notify: restart application

## roles/application/tasks/service.yml
---
- name: Create systemd service file
  template:
    src: systemd.service.j2
    dest: "/etc/systemd/system/{{ app_name }}.service"
    mode: '0644'
  notify:
    - reload systemd
    - restart application

- name: Enable and start application service
  service:
    name: "{{ app_name }}"
    enabled: yes
    state: started

## roles/application/defaults/main.yml
---
app_home: "/opt/{{ app_name }}"
app_release_path: "{{ app_home }}/releases/{{ app_version }}"
app_shared_path: "{{ app_home }}/shared"
app_venv_path: "{{ app_home }}/venv"

app_directories:
  - "{{ app_home }}"
  - "{{ app_home }}/releases"
  - "{{ app_home }}/shared"
  - "/var/log/{{ app_name }}"

## roles/application/handlers/main.yml
---
- name: reload systemd
  systemd:
    daemon_reload: yes

- name: restart application
  service:
    name: "{{ app_name }}"
    state: restarted

## roles/nginx/tasks/main.yml
---
- name: Install nginx
  apt:
    name: nginx
    state: present

- name: Configure nginx site
  template:
    src: site.conf.j2
    dest: "/etc/nginx/sites-available/{{ nginx_site_name }}"
    mode: '0644'
  notify: restart nginx

- name: Enable nginx site
  file:
    src: "/etc/nginx/sites-available/{{ nginx_site_name }}"
    dest: "/etc/nginx/sites-enabled/{{ nginx_site_name }}"
    state: link
  notify: restart nginx

- name: Start and enable nginx
  service:
    name: nginx
    enabled: yes
    state: started

## roles/firewall/tasks/main.yml
---
- name: Configure firewall rules
  ufw:
    rule: "{{ item.rule | default('allow') }}"
    port: "{{ item.port }}"
    proto: "{{ item.proto }}"
  loop: "{{ firewall_allowed_ports }}"

- name: Enable firewall
  ufw:
    state: enabled
```

**Improvements**:

- ✅ Modular structure with reusable roles
- ✅ Each role has single responsibility
- ✅ Roles can be tested independently
- ✅ Easy to reuse across different playbooks
- ✅ Clear separation of concerns
- ✅ Playbook is now 20 lines instead of 280

---

## Use Blocks for Error Handling

### Problem: No error handling, tasks fail and leave system in inconsistent state

**Before**:

```yaml
---
- name: Deploy application
  hosts: webservers
  become: true

  tasks:
    - name: Stop application service
      service:
        name: myapp
        state: stopped

    - name: Backup current version
      archive:
        path: /opt/myapp/current
        dest: /opt/myapp/backups/backup-{{ ansible_date_time.epoch }}.tar.gz

    - name: Download new version
      get_url:
        url: "https://releases.example.com/myapp/v2.0.0.tar.gz"
        dest: /tmp/myapp-v2.0.0.tar.gz

    - name: Extract new version
      unarchive:
        src: /tmp/myapp-v2.0.0.tar.gz
        dest: /opt/myapp/current
        remote_src: yes

    - name: Run database migrations
      command: /opt/myapp/current/bin/migrate
      # If this fails, app is stopped and new version is broken!

    - name: Start application service
      service:
        name: myapp
        state: started
      # This never runs if migration fails
```

**After**:

```yaml
---
- name: Deploy application
  hosts: webservers
  become: true

  tasks:
    - name: Deploy application with rollback on failure
      block:
        - name: Stop application service
          service:
            name: myapp
            state: stopped

        - name: Backup current version
          archive:
            path: /opt/myapp/current
            dest: /opt/myapp/backups/backup-{{ ansible_date_time.epoch }}.tar.gz
          register: backup_result

        - name: Download new version
          get_url:
            url: "{{ app_release_url }}"
            dest: "/tmp/{{ app_package_name }}"
            checksum: "{{ app_checksum }}"
          register: download_result

        - name: Create staging directory
          file:
            path: /opt/myapp/staging
            state: directory
            mode: '0755'

        - name: Extract new version to staging
          unarchive:
            src: "/tmp/{{ app_package_name }}"
            dest: /opt/myapp/staging
            remote_src: yes

        - name: Run database migrations
          command: /opt/myapp/staging/bin/migrate
          environment:
            DATABASE_URL: "{{ database_url }}"
          register: migration_result
          changed_when: "'Applied' in migration_result.stdout"

        - name: Smoke test new version
          uri:
            url: "http://localhost:8080/health"
            status_code: 200
          register: health_check
          retries: 3
          delay: 5

        - name: Replace current with new version
          shell: |
            rm -rf /opt/myapp/current
            mv /opt/myapp/staging /opt/myapp/current
          args:
            warn: false

        - name: Start application service
          service:
            name: myapp
            state: started

        - name: Wait for application to be ready
          uri:
            url: "http://localhost:8080/health"
            status_code: 200
          register: final_health_check
          until: final_health_check.status == 200
          retries: 10
          delay: 5

      rescue:
        - name: Log deployment failure
          debug:
            msg: "Deployment failed. Rolling back to previous version."

        - name: Stop failed application
          service:
            name: myapp
            state: stopped
          ignore_errors: yes

        - name: Restore backup
          unarchive:
            src: "{{ backup_result.dest }}"
            dest: /opt/myapp/current
            remote_src: yes
          when: backup_result is defined and backup_result.dest is defined

        - name: Rollback database migrations
          command: /opt/myapp/current/bin/migrate rollback
          environment:
            DATABASE_URL: "{{ database_url }}"
          ignore_errors: yes

        - name: Start application service (previous version)
          service:
            name: myapp
            state: started

        - name: Verify rollback succeeded
          uri:
            url: "http://localhost:8080/health"
            status_code: 200
          register: rollback_health_check
          retries: 5
          delay: 5

        - name: Fail with clear error message
          fail:
            msg: |
              Deployment failed and rolled back to previous version.
              Error: {{ ansible_failed_result.msg | default('Unknown error') }}

      always:
        - name: Clean up temporary files
          file:
            path: "{{ item }}"
            state: absent
          loop:
            - "/tmp/{{ app_package_name }}"
            - /opt/myapp/staging
          ignore_errors: yes

        - name: Send deployment notification
          uri:
            url: "{{ slack_webhook_url }}"
            method: POST
            body_format: json
            body:
              text: |
                Deployment {{ 'succeeded' if ansible_failed_task is not defined else 'failed' }}
                Host: {{ inventory_hostname }}
                Version: {{ app_version }}
          when: slack_webhook_url is defined
          delegate_to: localhost
```

**Improvements**:

- ✅ Automatic rollback on failure
- ✅ Database migrations are reversible
- ✅ Cleanup happens regardless of success/failure
- ✅ Clear error messages
- ✅ Notifications sent for all outcomes
- ✅ System never left in inconsistent state

---

## Apply Handlers Effectively

### Problem: Tasks restart services multiple times unnecessarily

**Before**:

```yaml
---
- name: Configure web server
  hosts: webservers
  become: true

  tasks:
    - name: Update nginx config
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        mode: '0644'

    - name: Restart nginx
      service:
        name: nginx
        state: restarted

    - name: Update site config
      template:
        src: site.conf.j2
        dest: /etc/nginx/sites-available/mysite
        mode: '0644'

    - name: Restart nginx again
      service:
        name: nginx
        state: restarted

    - name: Copy SSL certificate
      copy:
        src: "{{ item }}"
        dest: /etc/nginx/ssl/
        mode: '0600'
      loop:
        - cert.pem
        - key.pem

    - name: Restart nginx yet again
      service:
        name: nginx
        state: restarted
    # Nginx restarted 3 times when once at the end would suffice!
```

**After**:

```yaml
---
- name: Configure web server
  hosts: webservers
  become: true

  tasks:
    - name: Update nginx config
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        mode: '0644'
        validate: 'nginx -t -c %s'
      notify: reload nginx

    - name: Update site config
      template:
        src: site.conf.j2
        dest: /etc/nginx/sites-available/mysite
        mode: '0644'
      notify: reload nginx

    - name: Enable site
      file:
        src: /etc/nginx/sites-available/mysite
        dest: /etc/nginx/sites-enabled/mysite
        state: link
      notify: reload nginx

    - name: Copy SSL certificate
      copy:
        src: cert.pem
        dest: /etc/nginx/ssl/cert.pem
        mode: '0600'
      notify: reload nginx

    - name: Copy SSL private key
      copy:
        src: key.pem
        dest: /etc/nginx/ssl/key.pem
        mode: '0600'
      notify: reload nginx

    # Nginx will only reload once at the end, after all tasks complete

  handlers:
    - name: reload nginx
      service:
        name: nginx
        state: reloaded
      # Use reload instead of restart for zero-downtime

    - name: restart nginx
      service:
        name: nginx
        state: restarted
      # Keep restart handler for when reload isn't enough

    - name: validate nginx config
      command: nginx -t
      changed_when: false
      # Validation handler for manual triggering
```

**Even Better** (with handler dependencies):

```yaml
---
- name: Configure web server with handler dependencies
  hosts: webservers
  become: true

  tasks:
    - name: Update nginx config
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        mode: '0644'
      notify: validate and reload nginx

    - name: Update site config
      template:
        src: site.conf.j2
        dest: /etc/nginx/sites-available/mysite
        mode: '0644'
      notify: validate and reload nginx

    - name: Update SSL configuration
      template:
        src: ssl.conf.j2
        dest: /etc/nginx/conf.d/ssl.conf
        mode: '0644'
      notify: validate and reload nginx

  handlers:
    - name: validate and reload nginx
      listen: "validate and reload nginx"
      block:
        - name: Validate nginx configuration
          command: nginx -t
          changed_when: false

        - name: Reload nginx
          service:
            name: nginx
            state: reloaded

      rescue:
        - name: Log validation failure
          debug:
            msg: "Nginx configuration validation failed. Not reloading."

        - name: Restore previous configuration
          command: cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
          when: nginx_backup_exists

        - name: Fail with error
          fail:
            msg: "Nginx configuration is invalid. Check your templates."
```

**Improvements**:

- ✅ Service reloaded once instead of multiple times
- ✅ Use reload instead of restart (zero-downtime)
- ✅ Configuration validated before reload
- ✅ Handler runs only if notified
- ✅ Handler runs at end of play (all changes applied at once)
- ✅ Automatic rollback if validation fails

---

## Simplify Conditionals

### Problem: Complex when conditions repeated across tasks

**Before**:

```yaml
---
- name: Configure application
  hosts: all
  become: true

  tasks:
    - name: Install package for production Ubuntu
      apt:
        name: myapp-pro
        state: present
      when:
        - environment == "production"
        - ansible_distribution == "Ubuntu"
        - ansible_distribution_major_version|int >= 20

    - name: Install package for production CentOS
      yum:
        name: myapp-pro
        state: present
      when:
        - environment == "production"
        - ansible_distribution == "CentOS"
        - ansible_distribution_major_version|int >= 8

    - name: Install package for staging Ubuntu
      apt:
        name: myapp-staging
        state: present
      when:
        - environment == "staging"
        - ansible_distribution == "Ubuntu"
        - ansible_distribution_major_version|int >= 20

    - name: Configure production database for Ubuntu
      template:
        src: db_config_prod.j2
        dest: /etc/myapp/database.yml
      when:
        - environment == "production"
        - ansible_distribution == "Ubuntu"
        - ansible_distribution_major_version|int >= 20

    # Repeated conditionals throughout...
```

**After** (using includes and group_vars):

```yaml
## group_vars/production.yml
---
environment: production
app_package: myapp-pro
db_config_template: db_config_prod.j2
log_level: info
enable_monitoring: true

## group_vars/staging.yml
---
environment: staging
app_package: myapp-staging
db_config_template: db_config_staging.j2
log_level: debug
enable_monitoring: false

## playbook.yml
---
- name: Configure application
  hosts: all
  become: true

  tasks:
    - name: Include OS-specific variables
      include_vars: "{{ item }}"
      with_first_found:
        - "{{ ansible_distribution }}-{{ ansible_distribution_major_version }}.yml"
        - "{{ ansible_distribution }}.yml"
        - "default.yml"

    - name: Include OS-specific tasks
      include_tasks: "{{ ansible_os_family | lower }}.yml"

## tasks/debian.yml (for Ubuntu/Debian)
---
- name: Install application package (Debian)
  apt:
    name: "{{ app_package }}"
    state: present
    update_cache: yes
  when: ansible_distribution_major_version|int >= 20

- name: Configure database (Debian)
  template:
    src: "{{ db_config_template }}"
    dest: /etc/myapp/database.yml
    mode: '0640'

## tasks/redhat.yml (for CentOS/RHEL)
---
- name: Install application package (RedHat)
  yum:
    name: "{{ app_package }}"
    state: present
  when: ansible_distribution_major_version|int >= 8

- name: Configure database (RedHat)
  template:
    src: "{{ db_config_template }}"
    dest: /etc/myapp/database.yml
    mode: '0640'
```

**Alternative** (using set_fact for complex conditions):

```yaml
---
- name: Configure application
  hosts: all
  become: true

  tasks:
    - name: Set environment facts
      set_fact:
        is_production_ubuntu: >-
          {{ environment == 'production' and
             ansible_distribution == 'Ubuntu' and
             ansible_distribution_major_version|int >= 20 }}
        is_production_centos: >-
          {{ environment == 'production' and
             ansible_distribution == 'CentOS' and
             ansible_distribution_major_version|int >= 8 }}
        is_staging: >-
          {{ environment == 'staging' }}

    - name: Install package for production Ubuntu
      apt:
        name: myapp-pro
        state: present
      when: is_production_ubuntu | bool

    - name: Install package for production CentOS
      yum:
        name: myapp-pro
        state: present
      when: is_production_centos | bool

    - name: Configure production database
      template:
        src: db_config_prod.j2
        dest: /etc/myapp/database.yml
      when: is_production_ubuntu | bool or is_production_centos | bool
```

**Improvements**:

- ✅ No repeated complex conditionals
- ✅ Environment-specific vars in group_vars
- ✅ OS-specific tasks in separate files
- ✅ Clear, readable conditions
- ✅ Easy to add new environments or OS types

---

## Use Collections

### Problem: Using deprecated or built-in modules with limited functionality

**Before** (using built-in modules):

```yaml
---
- name: Manage AWS resources
  hosts: localhost
  gather_facts: no

  tasks:
    - name: Create EC2 instance (deprecated module)
      ec2:
        key_name: mykey
        instance_type: t3.medium
        image: ami-12345
        wait: yes
        group: webserver
        count: 1
        vpc_subnet_id: subnet-12345
        assign_public_ip: yes

    - name: Create S3 bucket (limited functionality)
      s3_bucket:
        name: my-bucket
        state: present

    - name: Manage RDS instance (basic module)
      rds:
        command: create
        instance_name: mydb
        db_engine: postgres
        size: 20
        instance_type: db.t3.medium
        username: admin
        password: "{{ db_password }}"
```

**After** (using amazon.aws collection):

```yaml
---
- name: Manage AWS resources
  hosts: localhost
  gather_facts: no

  collections:
    - amazon.aws
    - community.aws

  tasks:
    - name: Create EC2 instance (modern module)
      ec2_instance:
        key_name: mykey
        instance_type: t3.medium
        image_id: ami-12345
        wait: yes
        security_groups:
          - webserver
        vpc_subnet_id: subnet-12345
        network:
          assign_public_ip: yes
        tags:
          Name: "{{ instance_name }}"
          Environment: "{{ environment }}"
        state: running

    - name: Create S3 bucket with advanced features
      s3_bucket:
        name: my-bucket
        state: present
        encryption: "AES256"
        versioning: yes
        public_access:
          block_public_acls: yes
          block_public_policy: yes
          ignore_public_acls: yes
          restrict_public_buckets: yes
        tags:
          Environment: "{{ environment }}"

    - name: Create RDS instance with full configuration
      rds_instance:
        db_instance_identifier: mydb
        engine: postgres
        engine_version: "13.7"
        db_instance_class: db.t3.medium
        allocated_storage: 20
        storage_type: gp3
        storage_encrypted: yes
        master_username: admin
        master_user_password: "{{ db_password }}"
        vpc_security_group_ids:
          - "{{ db_security_group_id }}"
        db_subnet_group_name: "{{ db_subnet_group }}"
        backup_retention_period: 7
        preferred_backup_window: "03:00-04:00"
        preferred_maintenance_window: "sun:04:00-sun:05:00"
        multi_az: yes
        auto_minor_version_upgrade: yes
        tags:
          Name: mydb
          Environment: "{{ environment }}"
        state: present

    - name: Query EC2 instance info
      ec2_instance_info:
        filters:
          "tag:Environment": "{{ environment }}"
          instance-state-name: running
      register: ec2_info

    - name: Display instance IPs
      debug:
        msg: "Instance {{ item.tags.Name }} has IP {{ item.public_ip_address }}"
      loop: "{{ ec2_info.instances }}"
```

**Using Multiple Collections**:

```yaml
---
- name: Complete infrastructure setup
  hosts: localhost
  gather_facts: no

  collections:
    - amazon.aws
    - community.aws
    - community.general
    - ansible.posix

  tasks:
    - name: Create VPC
      ec2_vpc_net:
        name: "{{ vpc_name }}"
        cidr_block: "{{ vpc_cidr }}"
        region: "{{ aws_region }}"
        tags: "{{ common_tags }}"
        state: present
      register: vpc

    - name: Create CloudWatch log group (community.aws)
      cloudwatchlogs_log_group:
        log_group_name: "/aws/{{ environment }}/{{ app_name }}"
        retention: 7
        state: present

    - name: Send Slack notification (community.general)
      slack:
        token: "{{ slack_token }}"
        msg: "Infrastructure provisioning started for {{ environment }}"
        channel: "#ops"
      delegate_to: localhost
```

**Improvements**:

- ✅ Modern, maintained modules with full features
- ✅ Better error handling and return values
- ✅ Support for latest AWS features
- ✅ Consistent module interface across providers
- ✅ Community-maintained collections stay up-to-date
- ✅ Access to specialized modules (monitoring, logging, etc.)

---

## Resources

### Tools

- **ansible-lint**: Linting for playbooks and roles
- **yamllint**: YAML syntax checking
- **molecule**: Role testing framework
- **ansible-playbook --syntax-check**: Syntax validation

### Related Documentation

- [Ansible Style Guide](../02_language_guides/ansible.md)
- [YAML Style Guide](../02_language_guides/yaml.md)
- [Testing Strategies](../05_ci_cd/testing_strategies.md)

---

**Version**: 1.0.0
**Last Updated**: 2025-12-06
