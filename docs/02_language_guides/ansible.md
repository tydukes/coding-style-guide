# Ansible Style Guide

- Roles in `roles/<role_name>/` with `defaults`, `vars`, `tasks`, `handlers`, `meta`.
- Use `ansible-lint` and `molecule` for testing.

## Example task header

```yaml
# @module: create_user
- name: Ensure user exists
  user:
    name: "{{ user_name }}"
```
