---
title: "Kubernetes & Helm Style Guide"
description: "Container orchestration standards for Kubernetes manifests and Helm charts"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [kubernetes, helm, containers, orchestration, k8s]
category: "Language Guides"
status: "needs-creation"
version: "0.1.0"
---


- Strict naming, labels, annotations; validate manifests with `kubeval`/`kubectl --dry-run`.
- Templates should be linted with `helm lint` and schema-validated.
