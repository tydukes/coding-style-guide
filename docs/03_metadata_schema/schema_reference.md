---
title: "Metadata Schema Reference"
description: "Comprehensive metadata tag schema for code annotations and AI integration"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [metadata, schema, annotations, ai, validation]
category: "Metadata Schema"
status: "needs-expansion"
version: "0.1.0"
---



Metadata is embedded inline as comment-based tags. Use language-appropriate comment syntax.

Common tags:

- `@module: <name>`
- `@vars: name,type,required; name2,type,optional,default=...`
- `@outputs: name,description`
- `@depends_on: path,to,other_module`
- `@env: prod|staging|dev`

Example (Terraform file header):

```hcl
# @module: vpc
# @vars: name,string,required; cidr,string,optional,default="10.0.0.0/16"
# @outputs: vpc_id,The ID of the created VPC
```
