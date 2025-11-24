#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================="
echo "SonarQube Project Setup Helper"
echo "=================================="
echo ""

# Check if sonar-scanner is installed
if ! command -v sonar-scanner &> /dev/null; then
    echo -e "${RED}Error: sonar-scanner not installed${NC}"
    echo ""
    echo "Install it with:"
    echo "  macOS:  brew install sonar-scanner"
    echo "  Linux:  See docs/SONARQUBE-SETUP.md"
    exit 1
fi

# Check if SonarQube is accessible
if ! curl -s http://localhost:9000/api/system/status > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: SonarQube not accessible at http://localhost:9000${NC}"
    echo ""
    echo "Starting port-forward to SonarQube..."
    kubectl port-forward -n sonarqube svc/sonarqube-sonarqube 9000:9000 > /dev/null 2>&1 &
    sleep 3

    if ! curl -s http://localhost:9000/api/system/status > /dev/null 2>&1; then
        echo -e "${RED}Error: Could not access SonarQube${NC}"
        echo "Check if SonarQube pod is running:"
        echo "  kubectl get pods -n sonarqube"
        exit 1
    fi
    echo -e "${GREEN}✓ Port-forward active${NC}"
fi

echo -e "${GREEN}✓ SonarQube is accessible${NC}"
echo ""

# Get project details
read -p "Enter project key (lowercase, dashes only, e.g., my-app): " PROJECT_KEY
read -p "Enter project display name (e.g., My App): " PROJECT_NAME

# Detect project type
echo ""
echo "Detecting project type..."

PROJECT_TYPE="generic"
SOURCES="."
TESTS=""
EXCLUSIONS="**/node_modules/**,**/dist/**,**/build/**,**/target/**,**/vendor/**,**/.venv/**,**/__pycache__/**"

if [ -f "package.json" ]; then
    PROJECT_TYPE="javascript"
    SOURCES="src"
    TESTS="tests,__tests__"
    EXCLUSIONS="**/node_modules/**,**/dist/**,**/build/**,**/*.test.js,**/*.spec.js,**/*.test.ts,**/*.spec.ts"
    echo "  → Detected: JavaScript/TypeScript (Node.js)"
elif [ -f "setup.py" ] || [ -f "pyproject.toml" ]; then
    PROJECT_TYPE="python"
    SOURCES="src,."
    TESTS="tests,test"
    EXCLUSIONS="**/venv/**,**/.venv/**,**/build/**,**/__pycache__/**,**/*.pyc"
    echo "  → Detected: Python"
elif [ -f "pom.xml" ]; then
    PROJECT_TYPE="java-maven"
    SOURCES="src/main/java"
    TESTS="src/test/java"
    EXCLUSIONS="**/target/**"
    echo "  → Detected: Java (Maven)"
elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    PROJECT_TYPE="java-gradle"
    SOURCES="src/main/java"
    TESTS="src/test/java"
    EXCLUSIONS="**/build/**"
    echo "  → Detected: Java (Gradle)"
elif [ -f "go.mod" ]; then
    PROJECT_TYPE="go"
    SOURCES="."
    TESTS="."
    EXCLUSIONS="**/vendor/**"
    echo "  → Detected: Go"
else
    echo "  → Using generic configuration"
fi

# Create sonar-project.properties
echo ""
echo "Creating sonar-project.properties..."

cat > sonar-project.properties.template << EOF
# Project identification
sonar.projectKey=${PROJECT_KEY}
sonar.projectName=${PROJECT_NAME}
sonar.projectVersion=1.0

# Source code location
sonar.sources=${SOURCES}
EOF

if [ -n "$TESTS" ]; then
    echo "sonar.tests=${TESTS}" >> sonar-project.properties.template
fi

cat >> sonar-project.properties.template << EOF

# Exclusions
sonar.exclusions=${EXCLUSIONS}

# Encoding
sonar.sourceEncoding=UTF-8

# SonarQube server
sonar.host.url=http://localhost:9000

# Authentication token (use environment variable or command line)
# DO NOT commit your token to version control!
# sonar.login=YOUR_TOKEN_HERE
EOF

if [ "$PROJECT_TYPE" = "javascript" ]; then
    echo "sonar.javascript.lcov.reportPaths=coverage/lcov.info" >> sonar-project.properties.template
elif [ "$PROJECT_TYPE" = "python" ]; then
    echo "sonar.python.coverage.reportPaths=coverage.xml" >> sonar-project.properties.template
elif [ "$PROJECT_TYPE" = "go" ]; then
    echo "sonar.go.coverage.reportPaths=coverage.out" >> sonar-project.properties.template
fi

echo -e "${GREEN}✓ Created sonar-project.properties.template${NC}"

# Create .gitignore entry
if [ -f ".gitignore" ]; then
    if ! grep -q "sonar-project.properties" .gitignore; then
        echo "" >> .gitignore
        echo "# SonarQube" >> .gitignore
        echo "sonar-project.properties" >> .gitignore
        echo ".scannerwork/" >> .gitignore
        echo -e "${GREEN}✓ Added SonarQube files to .gitignore${NC}"
    fi
else
    cat > .gitignore << EOF
# SonarQube
sonar-project.properties
.scannerwork/
EOF
    echo -e "${GREEN}✓ Created .gitignore with SonarQube entries${NC}"
fi

# Create scan script
cat > scan-sonar.sh << 'EOF'
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
sonar-scanner -Dsonar.login=$TOKEN

echo ""
echo "✓ Analysis complete!"
echo "View results at: http://localhost:9000"
EOF

chmod +x scan-sonar.sh
echo -e "${GREEN}✓ Created scan-sonar.sh script${NC}"

echo ""
echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Open SonarQube:"
echo "   ${GREEN}open http://localhost:9000${NC}"
echo ""
echo "2. Login with:"
echo "   Username: admin"
echo "   Password: admin (you'll be asked to change it)"
echo ""
echo "3. Create a new project:"
echo "   - Click 'Create Project' → 'Manually'"
echo "   - Project key: ${GREEN}${PROJECT_KEY}${NC}"
echo "   - Display name: ${GREEN}${PROJECT_NAME}${NC}"
echo ""
echo "4. Generate a token:"
echo "   - Click 'Generate a token'"
echo "   - Save it securely!"
echo ""
echo "5. Copy the template and add your token:"
echo "   ${YELLOW}cp sonar-project.properties.template sonar-project.properties${NC}"
echo "   ${YELLOW}# Edit and add your token, OR use environment variable${NC}"
echo ""
echo "6. Run your first scan:"
echo "   ${GREEN}export SONAR_TOKEN=your_token_here${NC}"
echo "   ${GREEN}./scan-sonar.sh${NC}"
echo ""
echo "For detailed instructions, see: ${GREEN}docs/SONARQUBE-SETUP.md${NC}"
echo ""
