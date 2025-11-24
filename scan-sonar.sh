#!/usr/bin/env bash
set -euo pipefail

# Check if token is set
if [ -z "${SONAR_TOKEN:-}" ]; then
    echo "Error: SONAR_TOKEN environment variable not set"
    echo ""
    echo "Set it with:"
    echo "  export SONAR_TOKEN=your_token_here"
    echo ""
    echo "Or pass it as an argument:"
    echo "  ./scan-sonar.sh YOUR_TOKEN"
    exit 1
fi

# Use argument if provided
TOKEN=${1:-$SONAR_TOKEN}

# Check if sonar-scanner is installed
if ! command -v sonar-scanner &> /dev/null; then
    echo "Error: sonar-scanner not installed"
    exit 1
fi

# Check if SonarQube is accessible
if ! curl -s http://localhost:9000/api/system/status > /dev/null 2>&1; then
    echo "Error: SonarQube not accessible at http://localhost:9000"
    echo "Run: kubectl port-forward -n sonarqube svc/sonarqube-sonarqube 9000:9000 &"
    exit 1
fi

echo "Starting SonarQube analysis..."
sonar-scanner -Dsonar.token=$TOKEN

echo ""
echo "✓ Analysis complete!"
echo "View results at: http://localhost:9000"
