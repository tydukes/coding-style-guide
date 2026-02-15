---
title: "Code Signing Guide"
description: "Comprehensive guide to code signing standards for commits, artifacts, and container images using GPG, Sigstore, and cosign for cryptographic verification of code authenticity and integrity"
author: "Tyler Dukes"
tags: [security, signing, gpg, sigstore, cosign, commits, containers, artifacts, cryptography, verification]
category: "CI/CD"
status: "active"
search_keywords: [code signing, gpg, signatures, verification, trust, security, commits]
---

## Introduction

Code signing provides cryptographic verification of code authenticity and integrity throughout the software supply chain.
This guide covers comprehensive code signing standards for Git commits, container images, binary artifacts, and
package releases using GPG, Sigstore, and cosign.

Code signing enables:

- **Authenticity**: Verify who created the code
- **Integrity**: Detect unauthorized modifications
- **Non-repudiation**: Prove who signed the code
- **Trust chains**: Build verifiable supply chains
- **Compliance**: Meet regulatory requirements

---

## Table of Contents

1. [GPG Commit Signing](#gpg-commit-signing)
2. [Sigstore and Cosign for Containers](#sigstore-and-cosign-for-containers)
3. [Signing Artifacts](#signing-artifacts)
4. [CI/CD Integration](#cicd-integration)
5. [Key Management](#key-management)
6. [Verification Policies](#verification-policies)
7. [Signing Targets](#signing-targets)
8. [Best Practices](#best-practices)

---

## GPG Commit Signing

### Initial Setup

**Generate GPG key**:

```bash
# Generate new GPG key (RSA 4096-bit)
gpg --full-generate-key

# Interactive prompts:
# - Key type: (1) RSA and RSA
# - Key size: 4096
# - Expiration: 2y (recommended)
# - Real name: Your Name
# - Email: your.email@example.com
# - Passphrase: Strong passphrase
```

**List keys**:

```bash
# List all secret keys with long format
gpg --list-secret-keys --keyid-format=long

# Output:
# sec   rsa4096/ABCD1234EFGH5678 2025-01-11 [SC] [expires: 2027-01-11]
#       1234567890ABCDEF1234567890ABCDEF12345678
# uid                 [ultimate] Your Name <your.email@example.com>
# ssb   rsa4096/IJKL9012MNOP3456 2025-01-11 [E] [expires: 2027-01-11]

# Extract key ID (ABCD1234EFGH5678 from above)
GPG_KEY_ID="ABCD1234EFGH5678"
```

**Configure Git**:

```bash
# Set signing key globally
git config --global user.signingkey $GPG_KEY_ID

# Enable commit signing by default
git config --global commit.gpgsign true

# Enable tag signing by default
git config --global tag.gpgsign true

# Configure GPG program (if needed)
git config --global gpg.program gpg

# Set commit signing format (default: openpgp)
git config --global gpg.format openpgp
```

**Export public key for GitHub/GitLab**:

```bash
# Export ASCII-armored public key
gpg --armor --export $GPG_KEY_ID

# Copy output and add to:
# - GitHub: Settings → SSH and GPG keys → New GPG key
# - GitLab: Preferences → GPG Keys → Add GPG key

# Or export to file
gpg --armor --export $GPG_KEY_ID > public_key.asc
```

### Signing Commits

**Sign commits automatically**:

```bash
# Commits are signed automatically with commit.gpgsign=true
git commit -m "feat: add authentication module"

# Verify commit was signed
git log --show-signature -1

# Output includes:
# gpg: Signature made Sat Jan 11 10:00:00 2025 PST
# gpg:                using RSA key ABCD1234EFGH5678
# gpg: Good signature from "Your Name <your.email@example.com>"
```

**Sign commits explicitly**:

```bash
# Sign single commit with -S flag
git commit -S -m "fix: resolve authentication bug"

# Sign commit with specific key
git commit -S --gpg-sign=$GPG_KEY_ID -m "docs: update API documentation"

# Amend commit with signature
git commit --amend -S --no-edit
```

**Sign tags**:

```bash
# Create signed annotated tag
git tag -s v1.0.0 -m "Release version 1.0.0"

# Create signed tag with specific key
git tag -s v1.0.0 -u $GPG_KEY_ID -m "Release version 1.0.0"

# Verify signed tag
git tag -v v1.0.0

# Output:
# object a1b2c3d4...
# type commit
# tag v1.0.0
# tagger Your Name <your.email@example.com> 1736611200 -0800
#
# Release version 1.0.0
# gpg: Signature made Sat Jan 11 10:00:00 2025 PST
# gpg: Good signature from "Your Name <your.email@example.com>"
```

### Verification

**Verify commit signatures**:

```bash
# Show signature for latest commit
git log --show-signature -1

# Show signatures for last 10 commits
git log --show-signature -10

# Show signatures with format
git log --pretty=format:"%h %G? %aN %s" -10

# Signature status codes:
# G = Good signature
# B = Bad signature
# U = Good signature, unknown validity
# X = Good signature, expired
# Y = Good signature, expired key
# R = Good signature, revoked key
# E = Signature cannot be checked
```

**Verify all commits in range**:

```bash
# Verify all commits between tags
git log --show-signature v1.0.0..v2.0.0

# Verify all commits in branch
git log --show-signature origin/main..HEAD

# Check if all commits are signed
git log --pretty=format:"%h %G?" | grep -v "G" || echo "All commits signed"
```

**Configure Git to require signatures**:

```bash
# Reject unsigned commits in receive hook (server-side)
git config --global receive.fsckObjects true
git config --global receive.advertisePushOptions true

# In .git/hooks/pre-receive (server-side):
#!/bin/bash
while read oldrev newrev refname; do
  for commit in $(git rev-list $oldrev..$newrev); do
    if ! git verify-commit $commit 2>/dev/null; then
      echo "Error: Commit $commit is not signed"
      exit 1
    fi
  done
done
```

### Troubleshooting

**GPG agent issues**:

```bash
# Check GPG agent status
gpg-connect-agent --no-autostart /bye

# Restart GPG agent
gpgconf --kill gpg-agent
gpg-agent --daemon

# Set GPG TTY for terminal prompts
export GPG_TTY=$(tty)

# Add to ~/.bashrc or ~/.zshrc
echo 'export GPG_TTY=$(tty)' >> ~/.bashrc
```

**Passphrase caching**:

```bash
# Configure GPG agent cache (in ~/.gnupg/gpg-agent.conf)
default-cache-ttl 3600
max-cache-ttl 86400

# Reload configuration
gpgconf --reload gpg-agent
```

**Signing errors**:

```bash
# Test GPG signing
echo "test" | gpg --clearsign

# Debug Git GPG signing
GIT_TRACE=1 git commit -S -m "test"

# Verify GPG key configuration
git config --global --get user.signingkey
gpg --list-secret-keys $GPG_KEY_ID
```

---

## Sigstore and Cosign for Containers

### Installation

**Install cosign**:

```bash
# Using Homebrew (macOS)
brew install sigstore/tap/cosign

# Using go install
go install github.com/sigstore/cosign/v2/cmd/cosign@latest

# Using binary release (Linux)
COSIGN_VERSION="v2.2.2"
curl -L "https://github.com/sigstore/cosign/releases/download/${COSIGN_VERSION}/cosign-linux-amd64" -o cosign
chmod +x cosign
sudo mv cosign /usr/local/bin/

# Verify installation
cosign version
```

**Install Rekor CLI** (transparency log):

```bash
# Using Homebrew
brew install sigstore/tap/rekor-cli

# Using go install
go install github.com/sigstore/rekor/cmd/rekor-cli@latest

# Verify installation
rekor-cli version
```

### Key-based Signing

**Generate cosign key pair**:

```bash
# Generate key pair with passphrase
cosign generate-key-pair

# Generates:
# - cosign.key (private key, encrypted)
# - cosign.pub (public key)

# Store private key securely:
# - Hardware security module (HSM)
# - Cloud KMS (AWS KMS, GCP KMS, Azure Key Vault)
# - Kubernetes secret (for CI/CD)
# - Password manager
```

**Sign container image**:

```bash
# Sign image with private key
cosign sign --key cosign.key myregistry.io/myapp:v1.0.0

# Sign with passphrase from environment
export COSIGN_PASSWORD="your-passphrase"
cosign sign --key cosign.key myregistry.io/myapp:v1.0.0

# Sign with annotations (metadata)
cosign sign --key cosign.key \
  -a author="Tyler Dukes" \
  -a version="1.0.0" \
  -a commit="${GIT_COMMIT}" \
  myregistry.io/myapp:v1.0.0

# Sign image digest (recommended for immutability)
IMAGE_DIGEST="myregistry.io/myapp@sha256:abc123..."
cosign sign --key cosign.key $IMAGE_DIGEST
```

**Verify signature**:

```bash
# Verify with public key
cosign verify --key cosign.pub myregistry.io/myapp:v1.0.0

# Output (successful verification):
# Verification for myregistry.io/myapp:v1.0.0 --
# The following checks were performed on each of these signatures:
#   - The cosign claims were validated
#   - The signatures were verified against the specified public key

# Verify with policy
cosign verify --key cosign.pub \
  -a author="Tyler Dukes" \
  myregistry.io/myapp:v1.0.0
```

### Keyless Signing (OIDC)

**Sign with OIDC identity**:

```bash
# Interactive keyless signing (opens browser for OIDC auth)
cosign sign myregistry.io/myapp:v1.0.0

# In CI/CD with OIDC token
export COSIGN_EXPERIMENTAL=1
cosign sign myregistry.io/myapp:v1.0.0

# Automatically uses OIDC provider:
# - GitHub Actions: GITHUB_TOKEN
# - GitLab CI: CI_JOB_JWT
# - Google Cloud: gcloud credentials
```

**Verify keyless signature**:

```bash
# Verify with OIDC issuer
export COSIGN_EXPERIMENTAL=1
cosign verify \
  --certificate-identity="your.email@example.com" \
  --certificate-oidc-issuer="https://github.com/login/oauth" \
  myregistry.io/myapp:v1.0.0

# Verify with certificate chain
cosign verify \
  --certificate-identity-regexp=".*@example.com" \
  --certificate-oidc-issuer="https://accounts.google.com" \
  myregistry.io/myapp:v1.0.0
```

### SBOM Attestation

**Attach SBOM to image**:

```bash
# Generate SBOM with Syft
syft myregistry.io/myapp:v1.0.0 -o json > sbom.json

# Attach SBOM as attestation
cosign attest --key cosign.key \
  --predicate sbom.json \
  --type spdxjson \
  myregistry.io/myapp:v1.0.0

# Or use in-toto attestation format
cosign attest --key cosign.key \
  --predicate sbom.json \
  --type https://spdx.dev/Document \
  myregistry.io/myapp:v1.0.0
```

**Verify SBOM attestation**:

```bash
# Verify attestation exists
cosign verify-attestation --key cosign.pub \
  --type spdxjson \
  myregistry.io/myapp:v1.0.0

# Extract and view SBOM
cosign verify-attestation --key cosign.pub \
  --type spdxjson \
  myregistry.io/myapp:v1.0.0 | jq -r .payload | base64 -d | jq
```

### Provenance Attestation

**Attach build provenance**:

```bash
# Generate SLSA provenance
cat <<EOF > provenance.json
{
  "builder": {
    "id": "https://github.com/actions/runner"
  },
  "buildType": "https://github.com/actions/workflow",
  "invocation": {
    "configSource": {
      "uri": "git+https://github.com/example/repo@refs/heads/main",
      "digest": {"sha1": "abc123..."},
      "entryPoint": ".github/workflows/build.yml"
    }
  },
  "metadata": {
    "buildStartedOn": "2025-01-11T10:00:00Z",
    "buildFinishedOn": "2025-01-11T10:05:00Z",
    "completeness": {"parameters": true, "environment": false, "materials": true},
    "reproducible": false
  },
  "materials": [
    {"uri": "git+https://github.com/example/repo", "digest": {"sha1": "abc123..."}}
  ]
}
EOF

# Attach provenance
cosign attest --key cosign.key \
  --predicate provenance.json \
  --type slsaprovenance \
  myregistry.io/myapp:v1.0.0
```

**Verify provenance**:

```bash
# Verify provenance attestation
cosign verify-attestation --key cosign.pub \
  --type slsaprovenance \
  myregistry.io/myapp:v1.0.0

# Verify specific provenance fields
cosign verify-attestation --key cosign.pub \
  --type slsaprovenance \
  myregistry.io/myapp:v1.0.0 | jq -r .payload | base64 -d | \
  jq '.predicate.builder.id'
```

### Policy Enforcement

**Create admission policy with Rego**:

```rego
# policy.rego
package signature

import future.keywords.if
import future.keywords.in

# Deny unsigned images
deny[msg] if {
  not input.verified
  msg := "Image must be signed"
}

# Require specific signer
deny[msg] if {
  input.verified
  not valid_signer
  msg := sprintf("Image must be signed by authorized signer, got: %v", [input.signer])
}

valid_signer if {
  input.signer == "your.email@example.com"
}

# Require SBOM attestation
deny[msg] if {
  not has_sbom
  msg := "Image must have SBOM attestation"
}

has_sbom if {
  some attestation in input.attestations
  attestation.type == "spdxjson"
}
```

**Verify with policy**:

```bash
# Verify with Rego policy
cosign verify --key cosign.pub \
  --policy policy.rego \
  myregistry.io/myapp:v1.0.0

# Use Kubernetes admission controller
kubectl apply -f - <<EOF
apiVersion: policy.sigstore.dev/v1beta1
kind: ClusterImagePolicy
metadata:
  name: require-signed-images
spec:
  images:
    - glob: "myregistry.io/**"
  authorities:
    - key:
        data: |
          $(cat cosign.pub)
EOF
```

---

## Signing Artifacts

### Sign Binary Artifacts

**Sign release binaries**:

```bash
# Sign binary with GPG
gpg --armor --detach-sign --output myapp.sig myapp

# Verify signature
gpg --verify myapp.sig myapp

# Sign with cosign (for blobs)
cosign sign-blob --key cosign.key myapp > myapp.sig

# Verify blob signature
cosign verify-blob --key cosign.pub --signature myapp.sig myapp
```

**Sign with checksum file**:

```bash
# Generate checksums
sha256sum myapp-linux-amd64 myapp-darwin-amd64 myapp-windows-amd64.exe > checksums.txt

# Sign checksum file
gpg --armor --detach-sign checksums.txt

# Users verify:
gpg --verify checksums.txt.asc checksums.txt
sha256sum --check checksums.txt
```

### Sign Helm Charts

**Package and sign Helm chart**:

```bash
# Package chart
helm package mychart/

# Sign chart with GPG
helm package --sign --key "Your Name" --keyring ~/.gnupg/secring.gpg mychart/

# Generates:
# - mychart-1.0.0.tgz (chart package)
# - mychart-1.0.0.tgz.prov (provenance file with signature)

# Verify chart
helm verify mychart-1.0.0.tgz
```

**Sign with cosign**:

```bash
# Push chart to OCI registry
helm push mychart-1.0.0.tgz oci://myregistry.io/charts

# Sign chart in registry
cosign sign --key cosign.key \
  oci://myregistry.io/charts/mychart:1.0.0

# Verify chart signature
cosign verify --key cosign.pub \
  oci://myregistry.io/charts/mychart:1.0.0
```

### Sign Terraform Modules

**Sign module releases**:

```bash
# Package module as tarball
tar -czf terraform-aws-vpc-v1.0.0.tar.gz terraform-aws-vpc/

# Generate checksum
sha256sum terraform-aws-vpc-v1.0.0.tar.gz > terraform-aws-vpc-v1.0.0.tar.gz.sha256

# Sign checksum
gpg --armor --detach-sign terraform-aws-vpc-v1.0.0.tar.gz.sha256

# Attach signatures to GitHub release
gh release create v1.0.0 \
  terraform-aws-vpc-v1.0.0.tar.gz \
  terraform-aws-vpc-v1.0.0.tar.gz.sha256 \
  terraform-aws-vpc-v1.0.0.tar.gz.sha256.asc \
  --notes "Release v1.0.0"
```

**Verify module**:

```bash
# Download release artifacts
gh release download v1.0.0

# Verify signature
gpg --verify terraform-aws-vpc-v1.0.0.tar.gz.sha256.asc terraform-aws-vpc-v1.0.0.tar.gz.sha256

# Verify checksum
sha256sum --check terraform-aws-vpc-v1.0.0.tar.gz.sha256
```

### Sign Python Packages

**Sign Python wheel/sdist**:

```bash
# Build package
python -m build

# Sign with GPG
gpg --armor --detach-sign dist/mypackage-1.0.0-py3-none-any.whl
gpg --armor --detach-sign dist/mypackage-1.0.0.tar.gz

# Upload to PyPI with signatures
twine upload dist/* --sign --identity your.email@example.com

# Or upload existing signatures
twine upload dist/mypackage-1.0.0-py3-none-any.whl dist/mypackage-1.0.0-py3-none-any.whl.asc
```

**Verify package**:

```bash
# Download package and signature from PyPI
pip download --no-deps mypackage==1.0.0
# Download .asc file from PyPI web interface

# Verify signature
gpg --verify mypackage-1.0.0-py3-none-any.whl.asc mypackage-1.0.0-py3-none-any.whl
```

---

## CI/CD Integration

### GitHub Actions

**GPG commit signing in CI**:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Import GPG key
        uses: crazy-max/ghaction-import-gpg@v6
        with:
          gpg_private_key: ${{ secrets.GPG_PRIVATE_KEY }}
          passphrase: ${{ secrets.GPG_PASSPHRASE }}
          git_user_signingkey: true
          git_commit_gpgsign: true
          git_tag_gpgsign: true

      - name: Create signed commit
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          echo "Release ${{ github.ref_name }}" >> CHANGELOG.md
          git add CHANGELOG.md
          git commit -S -m "chore: update changelog for ${{ github.ref_name }}"

      - name: Push signed commit
        run: git push origin HEAD:${{ github.ref_name }}
```

**Container signing with cosign**:

```yaml
name: Build and Sign Container

on:
  push:
    branches:
      - main

permissions:
  contents: read
  packages: write
  id-token: write  # For keyless signing

jobs:
  build-and-sign:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          outputs: type=image,name=ghcr.io/${{ github.repository }},push=true

      - name: Install cosign
        uses: sigstore/cosign-installer@v3

      - name: Sign container image (keyless)
        run: |
          cosign sign --yes \
            -a repo="${{ github.repository }}" \
            -a workflow="${{ github.workflow }}" \
            -a ref="${{ github.ref }}" \
            -a sha="${{ github.sha }}" \
            ghcr.io/${{ github.repository }}@${{ steps.build.outputs.digest }}
        env:
          COSIGN_EXPERIMENTAL: 1

      - name: Generate and attach SBOM
        run: |
          # Generate SBOM with Syft
          syft ghcr.io/${{ github.repository }}@${{ steps.build.outputs.digest }} \
            -o spdx-json > sbom.json

          # Attest SBOM
          cosign attest --yes \
            --predicate sbom.json \
            --type spdxjson \
            ghcr.io/${{ github.repository }}@${{ steps.build.outputs.digest }}
        env:
          COSIGN_EXPERIMENTAL: 1
```

**Key-based signing with secrets**:

```yaml
name: Sign with Key

on:
  release:
    types: [published]

jobs:
  sign:
    runs-on: ubuntu-latest
    steps:
      - name: Install cosign
        uses: sigstore/cosign-installer@v3

      - name: Log in to registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Sign image with key
        run: |
          echo "${{ secrets.COSIGN_PRIVATE_KEY }}" > cosign.key
          cosign sign --key cosign.key \
            -a tag="${{ github.event.release.tag_name }}" \
            ghcr.io/${{ github.repository }}:${{ github.event.release.tag_name }}
        env:
          COSIGN_PASSWORD: ${{ secrets.COSIGN_PASSWORD }}

      - name: Cleanup
        if: always()
        run: rm -f cosign.key
```

### GitLab CI/CD

**Container signing in GitLab**:

```yaml
# .gitlab-ci.yml
stages:
  - build
  - sign

variables:
  IMAGE_NAME: ${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHORT_SHA}

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $IMAGE_NAME .
    - docker push $IMAGE_NAME

sign:
  stage: sign
  image: gcr.io/projectsigstore/cosign:v2.2.2
  dependencies:
    - build
  script:
    # Keyless signing with GitLab OIDC
    - export COSIGN_EXPERIMENTAL=1
    - cosign sign $IMAGE_NAME
  only:
    - main
    - tags
```

**GPG signing in GitLab**:

```yaml
sign-artifacts:
  stage: sign
  image: alpine:latest
  before_script:
    - apk add --no-cache gnupg
    - echo "$GPG_PRIVATE_KEY" | gpg --import
  script:
    - gpg --armor --detach-sign dist/myapp
    - gpg --armor --detach-sign dist/myapp.tar.gz
  artifacts:
    paths:
      - dist/*.sig
      - dist/*.asc
  only:
    - tags
```

### Jenkins Pipeline

**Container signing in Jenkins**:

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        IMAGE_NAME = "myregistry.io/myapp:${env.BUILD_NUMBER}"
        COSIGN_EXPERIMENTAL = '1'
    }

    stages {
        stage('Build') {
            steps {
                script {
                    docker.build(env.IMAGE_NAME)
                }
            }
        }

        stage('Push') {
            steps {
                script {
                    docker.withRegistry('https://myregistry.io', 'registry-credentials') {
                        docker.image(env.IMAGE_NAME).push()
                    }
                }
            }
        }

        stage('Sign') {
            steps {
                sh '''
                    # Install cosign
                    curl -L https://github.com/sigstore/cosign/releases/download/v2.2.2/cosign-linux-amd64 -o cosign
                    chmod +x cosign

                    # Sign with keyless
                    ./cosign sign --yes \
                        -a build="${BUILD_NUMBER}" \
                        -a job="${JOB_NAME}" \
                        ${IMAGE_NAME}
                '''
            }
        }
    }
}
```

---

## Key Management

### Key Generation Best Practices

**GPG key requirements**:

```bash
# Minimum key requirements:
# - Algorithm: RSA or EdDSA
# - Key size: 4096 bits (RSA) or Curve25519 (EdDSA)
# - Expiration: 1-2 years (renewable)
# - Passphrase: Strong, unique, stored securely

# Generate EdDSA key (modern, faster)
gpg --full-generate-key --expert
# Select: (9) ECC and ECC
# Select: (1) Curve 25519
# Expiration: 2y
```

**Cosign key requirements**:

```bash
# Generate with strong passphrase
COSIGN_PASSWORD="$(openssl rand -base64 32)"
echo "$COSIGN_PASSWORD" | cosign generate-key-pair --output-key-prefix=prod

# Store:
# - prod.key in secure vault (encrypted)
# - prod.pub in version control (public)
# - COSIGN_PASSWORD in secrets manager
```

### Key Storage

**Local development**:

```bash
# GPG keys: ~/.gnupg/
# - Protected by OS permissions (chmod 700)
# - Passphrase required for signing

# Cosign keys: Secure directory
mkdir -p ~/.config/cosign
chmod 700 ~/.config/cosign
mv cosign.key ~/.config/cosign/
chmod 600 ~/.config/cosign/cosign.key

# Public keys: Version control
git add cosign.pub
git commit -m "chore: add signing public key"
```

**CI/CD secrets**:

```bash
# GitHub Secrets:
# Settings → Secrets → Actions → New repository secret
# - GPG_PRIVATE_KEY: gpg --armor --export-secret-key $KEY_ID
# - GPG_PASSPHRASE: Your GPG passphrase
# - COSIGN_PRIVATE_KEY: cat cosign.key
# - COSIGN_PASSWORD: Your cosign passphrase

# GitLab CI/CD Variables:
# Settings → CI/CD → Variables → Add variable
# - Masked: Yes
# - Protected: Yes (for main/tags only)

# Jenkins Credentials:
# Manage Jenkins → Credentials → Add Credentials
# - Kind: Secret text or Secret file
# - Scope: Global or Project
```

**Cloud KMS**:

```bash
# AWS KMS
cosign generate-key-pair --kms awskms:///arn:aws:kms:us-east-1:123456789012:key/abc-def-ghi

# Sign with KMS
cosign sign --key awskms:///[KMS_ARN] myregistry.io/myapp:v1.0.0

# GCP KMS
cosign generate-key-pair --kms gcpkms://projects/PROJECT/locations/LOCATION/keyRings/RING/cryptoKeys/KEY

# Azure Key Vault
cosign generate-key-pair --kms azurekms://vault.azure.net/keys/keyname
```

**Hardware security modules (HSM)**:

```bash
# YubiKey setup for GPG
gpg --card-status
gpg --card-edit
# > admin
# > generate

# Sign commits with YubiKey
git config --global user.signingkey $(gpg --card-status | grep 'Signature key' | awk '{print $NF}')
git commit -S -m "Signed with YubiKey"
```

### Key Rotation

**GPG key rotation**:

```bash
# Extend expiration (preferred)
gpg --edit-key $KEY_ID
# > expire
# > 2y
# > save

# Re-export and update in GitHub/GitLab
gpg --armor --export $KEY_ID > new_public_key.asc

# Create new key (if compromised)
gpg --full-generate-key
# Update git config with new key ID
git config --global user.signingkey $NEW_KEY_ID

# Revoke old key
gpg --gen-revoke $OLD_KEY_ID > revocation.asc
gpg --import revocation.asc
gpg --send-keys $OLD_KEY_ID
```

**Cosign key rotation**:

```bash
# Generate new key pair
cosign generate-key-pair --output-key-prefix=prod-2025

# Re-sign all images with new key
for image in $(crane ls myregistry.io/myapp); do
  cosign sign --key prod-2025.key myregistry.io/myapp:$image
done

# Update verification policies
# - Replace old public key with new in admission controllers
# - Update CI/CD secrets with new private key

# Archive old key securely
gpg --encrypt --recipient you@example.com prod.key
rm prod.key
```

### Key Backup and Recovery

**Backup GPG keys**:

```bash
# Export all keys
gpg --export --armor --output public-keys.asc
gpg --export-secret-keys --armor --output private-keys.asc
gpg --export-ownertrust > ownertrust.txt

# Encrypt backups
gpg --symmetric --cipher-algo AES256 private-keys.asc

# Store securely:
# - Encrypted USB drive (offline)
# - Password manager (encrypted)
# - Paper backup (QR code)

# Recovery
gpg --import public-keys.asc
gpg --import private-keys.asc
gpg --import-ownertrust ownertrust.txt
```

**Backup cosign keys**:

```bash
# Encrypt private key
openssl enc -aes-256-cbc -in cosign.key -out cosign.key.enc

# Store:
# - cosign.key.enc in secure vault
# - Passphrase in password manager
# - cosign.pub in version control

# Recovery
openssl enc -d -aes-256-cbc -in cosign.key.enc -out cosign.key
chmod 600 cosign.key
```

---

## Verification Policies

### Repository Policies

**Require signed commits**:

```bash
# GitHub branch protection
# Settings → Branches → Branch protection rules
# ☑ Require signed commits

# GitLab push rules
# Settings → Repository → Push Rules
# ☑ Reject unsigned commits

# Pre-receive hook (self-hosted)
#!/bin/bash
# .git/hooks/pre-receive
while read oldrev newrev refname; do
  for commit in $(git rev-list $oldrev..$newrev); do
    if ! git verify-commit $commit 2>/dev/null; then
      echo "ERROR: Commit $commit is not GPG signed"
      echo "Please sign commits with: git commit -S"
      exit 1
    fi
  done
done
```

### Container Registry Policies

**Require signed images (Kubernetes)**:

```yaml
# Install Sigstore Policy Controller
kubectl apply -f https://github.com/sigstore/policy-controller/releases/latest/download/policy-controller.yaml

# Create ClusterImagePolicy
apiVersion: policy.sigstore.dev/v1beta1
kind: ClusterImagePolicy
metadata:
  name: signed-images-only
spec:
  images:
    - glob: "myregistry.io/**"
  authorities:
    - keyless:
        url: https://fulcio.sigstore.dev
        identities:
          - issuer: https://github.com/login/oauth
            subject: "https://github.com/myorg/*"
    - key:
        data: |
          -----BEGIN PUBLIC KEY-----
          ...
          -----END PUBLIC KEY-----
```

**Docker Content Trust**:

```bash
# Enable Docker Content Trust
export DOCKER_CONTENT_TRUST=1

# Push signed image (automatically signs)
docker push myregistry.io/myapp:v1.0.0

# Pull signed image (automatically verifies)
docker pull myregistry.io/myapp:v1.0.0

# Disable for specific pull
docker pull --disable-content-trust myregistry.io/myapp:v1.0.0
```

### Artifact Repository Policies

**Helm repository policy**:

```bash
# Require signature verification
helm repo add myrepo https://charts.example.com --verify

# Install only verified charts
helm install myapp myrepo/mychart --verify

# helm install will fail if:
# - Chart is not signed
# - Signature verification fails
# - Public key not in keyring
```

**PyPI package verification**:

```bash
# Download with signature verification
pip download --require-hashes mypackage==1.0.0

# Use pip-audit for signature verification
pip-audit --require-hashes --fix
```

---

## Signing Targets

### Git Commits and Tags

**What to sign**:

```bash
# ✅ Sign these commits:
# - Releases (tags)
# - Merges to main/production branches
# - Security patches
# - Configuration changes
# - Infrastructure changes

# ⚠️ Optional for these commits:
# - Development branch commits
# - WIP commits
# - Automated dependency updates

# ❌ Don't waste effort signing:
# - Temporary/throwaway branches
# - Local experiments
```

**Tag signing policy**:

```bash
# Always sign release tags
git tag -s v1.0.0 -m "Release v1.0.0"

# Sign pre-release tags
git tag -s v1.0.0-rc.1 -m "Release candidate 1"

# Don't sign development tags
git tag v1.0.0-dev  # Unsigned, for internal use
```

### Container Images

**Image signing matrix**:

```bash
# ✅ Always sign:
# - Production releases (myapp:v1.0.0)
# - Stable tags (myapp:latest, myapp:stable)
# - Release candidates (myapp:v1.0.0-rc.1)

# ⚠️ Consider signing:
# - Development builds (myapp:dev)
# - Feature branches (myapp:feature-auth)

# ❌ Don't sign:
# - Build artifacts (myapp:build-123)
# - Temporary test images (myapp:test-xyz)
```

**Multi-arch image signing**:

```bash
# Build multi-arch manifest
docker buildx build --platform linux/amd64,linux/arm64 \
  -t myregistry.io/myapp:v1.0.0 --push .

# Sign manifest and all platform images
IMAGE_DIGEST=$(docker buildx imagetools inspect myregistry.io/myapp:v1.0.0 --raw | sha256sum | cut -d' ' -f1)
cosign sign --key cosign.key myregistry.io/myapp@sha256:$IMAGE_DIGEST
```

### Binary Artifacts

**Release artifact checklist**:

```bash
# For each platform binary:
# 1. Build binary
# 2. Generate checksum
# 3. Sign checksum
# 4. Upload all to release

# Example release structure:
# - myapp-linux-amd64
# - myapp-linux-arm64
# - myapp-darwin-amd64
# - myapp-darwin-arm64
# - myapp-windows-amd64.exe
# - checksums.txt (SHA256 hashes)
# - checksums.txt.sig (GPG signature)
# - checksums.txt.asc (ASCII-armored signature)
```

### Package Releases

**Python package signing**:

```bash
# Build distributions
python -m build

# Sign all distributions
for file in dist/*; do
  gpg --armor --detach-sign "$file"
done

# Upload with signatures
twine upload dist/*

# Users verify
pip download mypackage==1.0.0
gpg --verify mypackage-1.0.0-py3-none-any.whl.asc
```

**npm package signing**:

```bash
# Sign package tarball
npm pack
gpg --armor --detach-sign mypackage-1.0.0.tgz

# Publish with provenance (automatic signing)
npm publish --provenance

# Users verify
npm install mypackage@1.0.0
npm audit signatures
```

---

## Best Practices

### Organizational Standards

**Signing policy template**:

```markdown
# Code Signing Policy

## Scope
All production artifacts must be cryptographically signed.

## Requirements
1. **Commits**: All commits to main/production branches must be GPG signed
2. **Tags**: All release tags must be GPG signed
3. **Containers**: All production container images must be cosign signed
4. **Artifacts**: All release binaries must have GPG-signed checksums
5. **Packages**: All package releases must be signed when supported

## Key Management
- **Generation**: 4096-bit RSA or Curve25519 EdDSA keys
- **Storage**: Private keys in secure vault, public keys in version control
- **Rotation**: Keys expire every 2 years, rotation 30 days before expiration
- **Backup**: Encrypted backups stored offline

## Verification
- **CI/CD**: All pipelines verify signatures before deployment
- **Kubernetes**: Admission controller rejects unsigned images
- **Local**: Developers verify signatures before using artifacts

## Exceptions
Requests for exceptions must be approved by security team.
```

### Developer Workflow

**Daily signing workflow**:

```bash
# Morning: Check GPG agent
gpg-connect-agent /bye

# During work: Sign commits automatically
git commit -m "feat: add feature"  # Automatically signed

# Before push: Verify signatures
git log --show-signature -5

# Release: Sign tag
git tag -s v1.0.0 -m "Release v1.0.0"

# Evening: Lock GPG agent
gpgconf --kill gpg-agent
```

### Automation and Tooling

**Pre-commit hook for signature verification**:

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Verify GPG is configured
if ! git config --get user.signingkey >/dev/null; then
  echo "ERROR: GPG signing key not configured"
  echo "Run: git config --global user.signingkey YOUR_KEY_ID"
  exit 1
fi

# Verify GPG agent is running
if ! gpg-connect-agent --no-autostart /bye >/dev/null 2>&1; then
  echo "ERROR: GPG agent not running"
  echo "Run: gpg-agent --daemon"
  exit 1
fi

# Test signing
if ! echo "test" | gpg --clearsign >/dev/null 2>&1; then
  echo "ERROR: GPG signing failed"
  echo "Check: gpg --list-secret-keys"
  exit 1
fi

exit 0
```

**Makefile targets**:

```makefile
# Makefile

.PHONY: sign-release verify-release

GPG_KEY_ID ?= $(shell git config --get user.signingkey)
VERSION ?= $(shell git describe --tags --abbrev=0)

sign-release:
 @echo "Signing release artifacts for $(VERSION)"
 @for file in dist/*; do \
  gpg --armor --detach-sign "$$file"; \
 done
 @sha256sum dist/* > dist/checksums.txt
 @gpg --armor --detach-sign dist/checksums.txt
 @echo "✅ All artifacts signed"

verify-release:
 @echo "Verifying release signatures for $(VERSION)"
 @gpg --verify dist/checksums.txt.asc dist/checksums.txt
 @cd dist && sha256sum --check checksums.txt
 @echo "✅ All signatures valid"

sign-container:
 @echo "Signing container image"
 @cosign sign --key cosign.key $(IMAGE_NAME)
 @echo "✅ Container signed"

verify-container:
 @echo "Verifying container signature"
 @cosign verify --key cosign.pub $(IMAGE_NAME)
 @echo "✅ Container signature valid"
```

### Security Considerations

**Threat model**:

```text
Threats Mitigated by Code Signing:
✅ Unauthorized code modifications
✅ Supply chain attacks (compromised dependencies)
✅ Man-in-the-middle attacks during distribution
✅ Impersonation of trusted developers/organizations
✅ Tampering with released artifacts

Threats NOT Mitigated:
❌ Vulnerabilities in signed code (sign ≠ secure)
❌ Compromised signing keys (requires key rotation)
❌ Social engineering attacks
❌ Zero-day exploits
```

**Defense in depth**:

```bash
# Layer 1: Commit signing
git config commit.gpgsign true

# Layer 2: Tag signing
git config tag.gpgsign true

# Layer 3: Container signing
cosign sign --key cosign.key $IMAGE

# Layer 4: SBOM attestation
cosign attest --type spdxjson --predicate sbom.json $IMAGE

# Layer 5: Provenance attestation
cosign attest --type slsaprovenance --predicate provenance.json $IMAGE

# Layer 6: Admission control
kubectl apply -f clusterimagepolicy.yaml

# Layer 7: Runtime verification
cosign verify --key cosign.pub $IMAGE
```

### Compliance and Auditing

**Audit trail**:

```bash
# Verify all commits in repository are signed
git log --all --pretty=format:"%h %G? %aN %s" | grep -v "^[^ ]* G " || echo "✅ All commits signed"

# Export signed commits log
git log --show-signature --since="2025-01-01" > audit-2025-q1.log

# Verify all images in registry are signed
for image in $(crane ls myregistry.io/myapp); do
  if cosign verify --key cosign.pub myregistry.io/myapp:$image >/dev/null 2>&1; then
    echo "✅ $image"
  else
    echo "❌ $image - UNSIGNED"
  fi
done
```

**Compliance reporting**:

```bash
# Generate compliance report
cat <<EOF > compliance-report.md
# Code Signing Compliance Report

**Period**: Q1 2025
**Generated**: $(date -I)

## Commit Signing
- Total commits: $(git rev-list --count --all)
- Signed commits: $(git log --all --pretty=format:"%G?" | grep -c "G")
- Compliance: $(git log --all --pretty=format:"%G?" | grep -c "G")%

## Container Signing
- Total images: $(crane ls myregistry.io/myapp | wc -l)
- Signed images: $(verify-all-images.sh | grep -c "✅")
- Compliance: $(calculate-percentage.sh)%

## Key Rotation
- GPG key expiration: $(gpg --list-keys --with-colons | grep "^pub" | cut -d: -f7)
- Last rotation: 2024-01-15
- Next rotation: 2026-01-15

## Findings
- ✅ All production releases signed
- ⚠️ 5 development images unsigned (acceptable)
- ❌ 0 compliance violations
EOF
```

---

## Additional Resources

### Official Documentation

- [GPG Documentation](https://gnupg.org/documentation/)
- [Sigstore Documentation](https://docs.sigstore.dev/)
- [Cosign GitHub Repository](https://github.com/sigstore/cosign)
- [SLSA Provenance Specification](https://slsa.dev/provenance/)
- [in-toto Attestation Framework](https://in-toto.io/)

### Tools and Utilities

**Signing tools**:

- [cosign](https://github.com/sigstore/cosign) - Container signing
- [gpg](https://gnupg.org/) - GPG signing
- [signify](https://www.openbsd.org/papers/bsdcan-signify.html) - OpenBSD signing tool
- [minisign](https://jedisct1.github.io/minisign/) - Lightweight signing

**Verification tools**:

- [rekor-cli](https://github.com/sigstore/rekor) - Transparency log
- [crane](https://github.com/google/go-containerregistry/tree/main/cmd/crane) - Container inspection
- [syft](https://github.com/anchore/syft) - SBOM generation
- [policy-controller](https://github.com/sigstore/policy-controller) - Kubernetes admission

**Supporting tools**:

- [gh](https://cli.github.com/) - GitHub CLI
- [glab](https://gitlab.com/gitlab-org/cli) - GitLab CLI
- [helm](https://helm.sh/) - Kubernetes package manager
- [twine](https://twine.readthedocs.io/) - Python package uploads

### Learning Resources

- [Sigstore The Hard Way](https://github.com/lukehinds/sigstore-the-hard-way)
- [Software Supply Chain Security](https://www.cncf.io/blog/2021/12/14/improving-software-supply-chain-security/)
- [SLSA Framework](https://slsa.dev/)
- [Supply-chain Levels for Software Artifacts](https://github.com/slsa-framework/slsa)

### Example Repositories

- [sigstore/cosign-gatekeeper-provider](https://github.com/sigstore/cosign-gatekeeper-provider)
- [sigstore/policy-controller](https://github.com/sigstore/policy-controller)
- [chainguard-dev/actions](https://github.com/chainguard-dev/actions)

---

**Template Version**: 1.0.0
**Last Updated**: 2025-01-11
