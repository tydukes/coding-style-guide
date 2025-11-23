---
title: "Ansible Style Guide"
description: "Configuration management standards for Ansible playbooks and roles"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [ansible, configuration-management, automation, devops, collections]
category: "Language Guides"
status: "needs-expansion"
version: "0.1.0"
---


- Roles in `roles/<role_name>/` with `defaults`, `vars`, `tasks`, `handlers`, `meta`.
- Use `ansible-lint` and `molecule` for testing.

## Example task header

```yaml
# @module: create_user
- name: Ensure user exists
  user:
    name: "{{ user_name }}"
```
