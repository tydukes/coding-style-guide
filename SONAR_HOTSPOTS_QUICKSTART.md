# SonarCloud Security Hotspots - Quick Start Guide

## Problem

SonarCloud reports 5 security hotspots for using version tags (e.g., `@v6.0.1`) instead of
full commit SHA hashes in GitHub Actions workflows.

**This is intentional** per our `SECURITY.md` policy.

## Solution: Mark Hotspots as Safe (Permanent)

You have **3 options** to permanently resolve this:

---

## Option 1: Manual Review in SonarCloud UI (Recommended - 2 minutes)

**This is permanent and survives new scans.**

### Steps

1. Go to: <https://sonarcloud.io/project/security_hotspots?id=coding-style-guide>

2. Click on each hotspot (should be 5 total)

3. For each one:
   - Click **"Safe"** or **"Mark as Safe"**
   - Add this comment:

     ```text
     Accepted Risk: Version tags intentionally used per SECURITY.md policy.
     See: https://github.com/tydukes/coding-style-guide/blob/main/SECURITY.md
     ```

   - Click **"Confirm"**

4. Done! These won't appear in future scans.

**Bulk Review** (if you have permissions):

- Select all 5 using checkboxes → "Bulk change" → "Mark as Safe" → Add comment → Confirm

---

## Option 2: Automated Script (One Command)

**Requires SonarCloud API token but reviews all hotspots automatically.**

### Prerequisites

```bash
# Install jq if you don't have it
brew install jq  # macOS
# or
sudo apt-get install jq  # Linux
```

### Get SonarCloud Token

1. Go to: <https://sonarcloud.io/account/security>
2. Generate a new token (name it "Hotspot Review")
3. Copy the token

### Run Script

```bash
# Set your token
export SONAR_TOKEN="your-token-here"

# Run the script
bash scripts/mark_sonar_hotspots_safe.sh
```

The script will:

- ✅ Find all open GitHub Actions version pinning hotspots
- ✅ Mark each as "Safe" with appropriate comment
- ✅ Show summary of what was reviewed

---

## Option 3: SonarCloud API (For CI/CD Integration)

**Use this if you want to automate in CI pipeline.**

```bash
# Set environment variables
export SONAR_TOKEN="your-token"
export SONAR_PROJECT="coding-style-guide"

# Get hotspot keys
HOTSPOTS=$(curl -u "${SONAR_TOKEN}:" \
  "https://sonarcloud.io/api/hotspots/search?projectKey=${SONAR_PROJECT}&status=TO_REVIEW&rule=yaml:S6270" \
  | jq -r '.hotspots[].key')

# Mark each as safe
for HOTSPOT in $HOTSPOTS; do
  curl -u "${SONAR_TOKEN}:" -X POST \
    "https://sonarcloud.io/api/hotspots/change_status" \
    -d "hotspot=${HOTSPOT}" \
    -d "status=REVIEWED" \
    -d "resolution=SAFE" \
    -d "comment=Accepted Risk per SECURITY.md"
done
```

---

## Why This is Safe

Per our `SECURITY.md`:

1. ✅ **Official Actions Only**: We use version tags only for GitHub-maintained actions
2. ✅ **Dependabot**: Automatically updates to latest secure versions
3. ✅ **Audit Trail**: Git history tracks all version changes
4. ✅ **Signed Releases**: Official actions are signed and verified
5. ✅ **Maintainable**: 40-character SHAs are hard to read and maintain

## Expected Hotspots (5 total)

These are the likely hotspots you'll see:

| File | Line | Action |
|------|------|--------|
| `.github/workflows/ci.yml` | ~15 | `actions/checkout@v6.0.1` |
| `.github/workflows/ci.yml` | ~24 | `actions/cache@v5` |
| `.github/workflows/ci.yml` | ~47 | `actions/upload-artifact@v6` |
| `.github/workflows/deploy.yml` | ~15 | `actions/checkout@v6` |
| `.github/workflows/container.yml` | ~20 | `docker/setup-buildx-action@v3` |

## Verification

After marking as safe, verify at:
<https://sonarcloud.io/project/security_hotspots?id=coding-style-guide>

You should see:

- ✅ Status: "Reviewed"
- ✅ Resolution: "Safe"
- ✅ Your comment visible

## FAQ

**Q: Will these come back on next scan?**
A: No! Once marked as "Safe", they won't reappear unless the line changes.

**Q: What if I add new workflows?**
A: New workflows will trigger new hotspots. Just repeat the process.

**Q: Can I automate this in CI?**
A: Yes! Use Option 2 or 3 and run in your CI pipeline after SonarCloud scan.

**Q: Is this really safe?**
A: Yes! See `SECURITY.md` for our full security policy and rationale.

---

**Quick Recommendation**: Use **Option 1** (manual UI review) - it's fastest and most permanent.

For detailed documentation, see: `.sonarcloud-hotspot-review.md`
