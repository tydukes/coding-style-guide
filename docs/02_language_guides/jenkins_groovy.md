---
title: "Jenkins & Groovy Style Guide"
description: "Jenkins declarative and scripted pipeline standards for CI/CD automation"
author: "Tyler Dukes"
tags: [jenkins, groovy, cicd, pipelines, automation, devops]
category: "Language Guides"
status: "active"
---

## Language Overview

**Jenkins** is an open-source automation server that enables CI/CD pipelines. **Groovy** is a JVM language used to
define Jenkins pipelines. This guide focuses on Jenkins Pipeline (as code) using declarative and scripted syntax.

### Key Characteristics

- **Paradigm**: Declarative (preferred) and Scripted (for complex logic)
- **File Name**: `Jenkinsfile`
- **Primary Use**: Continuous integration, continuous delivery, infrastructure automation
- **Jenkins Version**: Jenkins 2.x+ with Pipeline plugin

### Pipeline Types

- **Declarative Pipeline**: Simplified, structured syntax (preferred for most use cases)
- **Scripted Pipeline**: Full Groovy power for complex workflows

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **File Naming** | | | |
| Pipeline File | `Jenkinsfile` | `Jenkinsfile` | At repository root |
| Shared Library | `vars/functionName.groovy` | `vars/buildDocker.groovy` | Shared pipeline functions |
| **Declarative Pipeline** | | | |
| `pipeline` | Top-level block | `pipeline { }` | Required wrapper |
| `agent` | Execution environment | `agent any` or `agent { docker }` | Where to run |
| `stages` | Pipeline phases | `stages { }` | Container for stages |
| `stage` | Individual phase | `stage('Build') { }` | Named pipeline stage |
| `steps` | Actual commands | `steps { sh 'make' }` | Commands to execute |
| `post` | Post-build actions | `post { always { } }` | Cleanup, notifications |
| **Scripted Pipeline** | | | |
| `node` | Execution block | `node { }` | Where pipeline runs |
| `stage` | Pipeline stage | `stage('Build') { }` | Same as declarative |
| **Variables** | | | |
| Environment | `environment { }` | `environment { FOO = 'bar' }` | Environment variables |
| Parameters | `parameters { }` | `string(name: 'VERSION')` | Build parameters |
| **Common Steps** | | | |
| Shell | `sh` | `sh 'make build'` | Execute shell commands |
| Git | `git` | `git 'https://repo.git'` | Checkout code |
| Docker | `docker.build` | `docker.build('image:tag')` | Build Docker images |
| Archive | `archiveArtifacts` | `archiveArtifacts '*.jar'` | Save build artifacts |
| **Best Practices** | | | |
| Declarative | Prefer declarative | Simpler, more maintainable | Use scripted only when needed |
| Shared Libraries | DRY code | Reusable pipeline functions | Avoid duplication |
| Credentials | Use credentials() | Never hardcode secrets | Secure credential management |
| Parallel | Use parallel {} | Speed up builds | Run stages concurrently |

---

## Declarative Pipeline Structure

### Basic Declarative Pipeline

```groovy
pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        APP_NAME = 'my-application'
        BUILD_VERSION = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Build') {
            steps {
                echo "Building ${APP_NAME} version ${BUILD_VERSION}"
                sh 'make build'
            }
        }

        stage('Test') {
            steps {
                sh 'make test'
            }
        }

        stage('Deploy') {
            steps {
                sh 'make deploy'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
```

---

## Agent Configuration

### Agent Types

```groovy
pipeline {
    // Run on any available agent
    agent any
}

pipeline {
    // Run on agent with specific label
    agent {
        label 'linux-docker'
    }
}

pipeline {
    // Run in Docker container
    agent {
        docker {
            image 'node:18-alpine'
            args '-v /tmp:/tmp'
        }
    }
}

pipeline {
    // Run on Kubernetes pod
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: maven
    image: maven:3.8-jdk-11
    command: ['cat']
    tty: true
"""
        }
    }
}

pipeline {
    // No global agent, define per-stage
    agent none

    stages {
        stage('Build') {
            agent { label 'linux' }
            steps {
                sh 'make build'
            }
        }

        stage('Deploy') {
            agent { label 'production' }
            steps {
                sh 'make deploy'
            }
        }
    }
}
```

---

## Stages and Steps

### Stage Naming Conventions

Use **Title Case** for stage names:

```groovy
stages {
    stage('Checkout Code') { }
    stage('Build Application') { }
    stage('Run Unit Tests') { }
    stage('Run Integration Tests') { }
    stage('Build Docker Image') { }
    stage('Push to Registry') { }
    stage('Deploy to Development') { }
    stage('Deploy to Staging') { }
    stage('Deploy to Production') { }
}
```

### Conditional Stages

```groovy
stages {
    stage('Deploy to Production') {
        when {
            branch 'main'
        }
        steps {
            sh 'make deploy-prod'
        }
    }

    stage('Deploy to Staging') {
        when {
            not {
                branch 'main'
            }
        }
        steps {
            sh 'make deploy-staging'
        }
    }

    stage('Tag Release') {
        when {
            tag pattern: 'v\\d+\\.\\d+\\.\\d+', comparator: 'REGEXP'
        }
        steps {
            echo "Releasing version ${env.TAG_NAME}"
        }
    }
}
```

---

## Environment Variables

### Global and Stage-Specific Variables

```groovy
pipeline {
    agent any

    environment {
        // Global environment variables
        DOCKER_REGISTRY = 'registry.example.com'
        APP_NAME = 'my-app'
        SLACK_CHANNEL = '#builds'
    }

    stages {
        stage('Build') {
            environment {
                // Stage-specific environment variables
                BUILD_TYPE = 'release'
            }
            steps {
                sh "docker build -t ${DOCKER_REGISTRY}/${APP_NAME}:${env.BUILD_NUMBER} ."
            }
        }

        stage('Deploy') {
            environment {
                DEPLOY_ENV = "${env.BRANCH_NAME == 'main' ? 'production' : 'staging'}"
            }
            steps {
                echo "Deploying to ${DEPLOY_ENV}"
            }
        }
    }
}
```

### Built-in Environment Variables

```groovy
// Common Jenkins environment variables
${env.BUILD_NUMBER}      // Build number
${env.BUILD_ID}          // Build ID (same as BUILD_NUMBER)
${env.JOB_NAME}          // Job name
${env.WORKSPACE}         // Workspace directory
${env.BRANCH_NAME}       // Git branch name
${env.GIT_COMMIT}        // Git commit SHA
${env.GIT_URL}           // Git repository URL
```

---

## Parameters and Triggers

### Pipeline Parameters

```groovy
pipeline {
    agent any

    parameters {
        string(
            name: 'DEPLOY_ENV',
            defaultValue: 'staging',
            description: 'Deployment environment'
        )
        choice(
            name: 'BUILD_TYPE',
            choices: ['debug', 'release'],
            description: 'Build type'
        )
        booleanParam(
            name: 'RUN_TESTS',
            defaultValue: true,
            description: 'Run tests before deployment'
        )
        text(
            name: 'RELEASE_NOTES',
            defaultValue: '',
            description: 'Release notes for this deployment'
        )
    }

    stages {
        stage('Deploy') {
            steps {
                echo "Deploying to ${params.DEPLOY_ENV}"
                echo "Build type: ${params.BUILD_TYPE}"
                echo "Run tests: ${params.RUN_TESTS}"
                echo "Release notes: ${params.RELEASE_NOTES}"
            }
        }
    }
}
```

### Pipeline Triggers

```groovy
pipeline {
    agent any

    triggers {
        // Poll SCM every 5 minutes
        pollSCM('H/5 * * * *')

        // Run at midnight daily
        cron('0 0 * * *')

        // Trigger on upstream job completion
        upstream(
            upstreamProjects: 'upstream-job-name',
            threshold: hudson.model.Result.SUCCESS
        )
    }
}
```

---

## Credentials Management

### Using Credentials

```groovy
pipeline {
    agent any

    environment {
        // Username/password credential
        DOCKER_CREDS = credentials('docker-hub-credentials')
    }

    stages {
        stage('Login to Docker') {
            steps {
                sh 'echo $DOCKER_CREDS_PSW | docker login -u $DOCKER_CREDS_USR --password-stdin'
            }
        }

        stage('Use Secret File') {
            steps {
                withCredentials([file(credentialsId: 'secret-config', variable: 'CONFIG_FILE')]) {
                    sh 'cat $CONFIG_FILE'
                }
            }
        }

        stage('Use SSH Key') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'ssh-key-id',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USER'
                )]) {
                    sh 'ssh -i $SSH_KEY $SSH_USER@server.example.com "ls -la"'
                }
            }
        }

        stage('Use AWS Credentials') {
            steps {
                withCredentials([aws(credentialsId: 'aws-credentials')]) {
                    sh 'aws s3 ls'
                }
            }
        }
    }
}
```

---

## Shared Libraries

### Using Shared Libraries

```groovy
// At the top of Jenkinsfile
@Library('my-shared-library@main') _

pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                // Call shared library function
                buildDockerImage(
                    imageName: 'my-app',
                    tag: env.BUILD_NUMBER
                )
            }
        }

        stage('Deploy') {
            steps {
                deployToKubernetes(
                    namespace: 'production',
                    deployment: 'my-app'
                )
            }
        }
    }
}
```

### Creating Shared Library Functions

```groovy
// vars/buildDockerImage.groovy
def call(Map config) {
    def imageName = config.imageName
    def tag = config.tag
    def registry = config.registry ?: 'docker.io'

    sh """
        docker build -t ${registry}/${imageName}:${tag} .
        docker push ${registry}/${imageName}:${tag}
    """
}

// vars/sendSlackNotification.groovy
def call(String channel, String message, String color = 'good') {
    slackSend(
        channel: channel,
        message: message,
        color: color
    )
}
```

---

## Post Actions

### Post Block Types

```groovy
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'make build'
            }
        }
    }

    post {
        always {
            // Always runs, regardless of build result
            echo 'Pipeline completed'
            cleanWs()
        }

        success {
            // Runs only if build succeeds
            echo 'Build succeeded!'
            slackSend channel: '#builds', message: "Build ${env.BUILD_NUMBER} succeeded"
        }

        failure {
            // Runs only if build fails
            echo 'Build failed!'
            slackSend channel: '#builds', message: "Build ${env.BUILD_NUMBER} failed", color: 'danger'
        }

        unstable {
            // Runs if build is unstable (tests failed but build succeeded)
            echo 'Build is unstable'
        }

        changed {
            // Runs if build status changed from previous build
            echo 'Build status changed'
        }

        fixed {
            // Runs if build was broken and is now fixed
            echo 'Build is fixed!'
        }

        regression {
            // Runs if build was successful and is now unstable/failed
            echo 'Build regressed'
        }

        cleanup {
            // Always runs after all other post conditions
            echo 'Final cleanup'
        }
    }
}
```

---

## Parallel Execution

### Parallel Stages

```groovy
pipeline {
    agent any

    stages {
        stage('Tests') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'make test-unit'
                    }
                }

                stage('Integration Tests') {
                    steps {
                        sh 'make test-integration'
                    }
                }

                stage('E2E Tests') {
                    steps {
                        sh 'make test-e2e'
                    }
                }
            }
        }

        stage('Multi-Platform Build') {
            parallel {
                stage('Build AMD64') {
                    agent { label 'amd64' }
                    steps {
                        sh 'docker build --platform linux/amd64 -t app:amd64 .'
                    }
                }

                stage('Build ARM64') {
                    agent { label 'arm64' }
                    steps {
                        sh 'docker build --platform linux/arm64 -t app:arm64 .'
                    }
                }
            }
        }
    }
}
```

---

## Scripted Pipeline

### When to Use Scripted Pipeline

Use scripted pipelines for:

- Complex conditional logic
- Dynamic stage generation
- Advanced error handling
- Integration with custom Groovy code

```groovy
node('linux') {
    def deployEnv = 'staging'

    try {
        stage('Checkout') {
            checkout scm
        }

        stage('Build') {
            sh 'make build'
        }

        stage('Test') {
            try {
                sh 'make test'
            } catch (Exception e) {
                echo "Tests failed: ${e.message}"
                currentBuild.result = 'UNSTABLE'
            }
        }

        // Dynamic stage generation
        def environments = ['dev', 'staging', 'prod']
        for (env in environments) {
            stage("Deploy to ${env}") {
                if (env == 'prod' && env.BRANCH_NAME != 'main') {
                    echo "Skipping production deployment for non-main branch"
                    continue
                }
                sh "make deploy-${env}"
            }
        }
    } catch (Exception e) {
        currentBuild.result = 'FAILURE'
        throw e
    } finally {
        stage('Cleanup') {
            cleanWs()
        }
    }
}
```

---

## Error Handling

### Try-Catch in Declarative Pipeline

```groovy
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                script {
                    try {
                        sh 'make build'
                    } catch (Exception e) {
                        echo "Build failed: ${e.message}"
                        error("Build step failed")
                    }
                }
            }
        }

        stage('Test with Retry') {
            steps {
                retry(3) {
                    sh 'make test'
                }
            }
        }

        stage('Test with Timeout') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    sh 'make test'
                }
            }
        }
    }
}
```

---

## Testing

### Testing Pipelines with Jenkins Pipeline Unit

Use [Jenkins Pipeline Unit](https://github.com/jenkinsci/JenkinsPipelineUnit) to test Groovy pipelines:

```groovy
## build.gradle
dependencies {
    testImplementation 'com.lesfurets:jenkins-pipeline-unit:1.19'
    testImplementation 'junit:junit:4.13.2'
}
```

### Unit Test Example

```groovy
## test/groovy/TestJenkinsfile.groovy
import com.lesfurets.jenkins.unit.BasePipelineTest
import org.junit.Before
import org.junit.Test

class TestJenkinsfile extends BasePipelineTest {

    @Override
    @Before
    void setUp() {
        super.setUp()

        // Mock pipeline steps
        helper.registerAllowedMethod('sh', [String.class], { String cmd ->
            return "mocked output"
        })

        helper.registerAllowedMethod('checkout', [Map.class], null)
        helper.registerAllowedMethod('junit', [String.class], null)
    }

    @Test
    void testPipelineSuccess() {
        def script = loadScript('Jenkinsfile')
        script.execute()

        printCallStack()

        // Verify expected steps were called
        assertJobStatusSuccess()
    }

    @Test
    void testBuildStage() {
        def script = loadScript('Jenkinsfile')

        binding.setVariable('env', [BRANCH_NAME: 'main'])

        script.execute()

        // Verify build commands
        assertTrue(helper.callStack.findAll {
            it.methodName == 'sh'
        }.any {
            it.args[0].toString().contains('npm run build')
        })
    }
}
```

### Testing Shared Libraries

```groovy
## vars/deployApp.groovy
def call(Map config) {
    pipeline {
        agent any
        stages {
            stage('Deploy') {
                steps {
                    script {
                        sh "kubectl apply -f ${config.manifestPath}"
                    }
                }
            }
        }
    }
}

## test/groovy/DeployAppTest.groovy
import com.lesfurets.jenkins.unit.BasePipelineTest
import org.junit.Test

class DeployAppTest extends BasePipelineTest {

    @Test
    void testDeployAppCall() {
        def script = loadScript('vars/deployApp.groovy')

        helper.registerAllowedMethod('sh', [String.class], { cmd ->
            assert cmd.contains('kubectl apply')
        })

        script.call([manifestPath: '/path/to/manifest.yaml'])
    }
}
```

### Linting with npm-groovy-lint

```bash
## Install npm-groovy-lint
npm install -g npm-groovy-lint

## Lint Jenkinsfile
npm-groovy-lint Jenkinsfile

## Lint with auto-fix
npm-groovy-lint --fix Jenkinsfile

## Lint all Groovy files
npm-groovy-lint "**/*.groovy"
```

### Configuration for npm-groovy-lint

```json
## .groovylintrc.json
{
  "extends": "recommended",
  "rules": {
    "CompileStatic": "off",
    "DuplicateStringLiteral": "warning",
    "LineLength": {
      "length": 120
    },
    "MethodSize": {
      "maxLines": 50
    }
  }
}
```

### Validating Jenkinsfile Syntax

```bash
## Using Jenkins CLI
java -jar jenkins-cli.jar -s http://jenkins:8080/ \
    declarative-linter < Jenkinsfile

## Using curl with Jenkins API
curl -X POST -F "jenkinsfile=<Jenkinsfile" \
    http://jenkins:8080/pipeline-model-converter/validate
```

### Integration Testing

Test pipeline integration in actual Jenkins:

```groovy
## tests/integration/Jenkinsfile.test
@Library('shared-library@main') _

pipeline {
    agent any

    options {
        skipDefaultCheckout()
    }

    stages {
        stage('Test Pipeline Integration') {
            steps {
                script {
                    // Test shared library functions
                    def result = deployApp([
                        environment: 'test',
                        version: '1.0.0'
                    ])

                    assert result.status == 'success'
                }
            }
        }
    }
}
```

### CI/CD for Pipeline Testing

```groovy
## Jenkinsfile.test
pipeline {
    agent any

    stages {
        stage('Lint') {
            steps {
                sh 'npm-groovy-lint Jenkinsfile'
            }
        }

        stage('Unit Tests') {
            steps {
                sh './gradlew test'
            }
        }

        stage('Validate Syntax') {
            steps {
                sh '''
                    curl -X POST -F "jenkinsfile=<Jenkinsfile" \
                        http://localhost:8080/pipeline-model-converter/validate
                '''
            }
        }
    }

    post {
        always {
            junit 'build/test-results/**/*.xml'
        }
    }
}
```

### Testing with Different Agents

```groovy
def testOnAgent(String agentLabel, Closure testClosure) {
    node(agentLabel) {
        try {
            testClosure()
            echo "Tests passed on ${agentLabel}"
        } catch (Exception e) {
            error "Tests failed on ${agentLabel}: ${e.message}"
        }
    }
}

// Usage in pipeline
pipeline {
    agent none

    stages {
        stage('Cross-Platform Tests') {
            parallel {
                stage('Linux') {
                    steps {
                        script {
                            testOnAgent('linux') {
                                sh 'make test'
                            }
                        }
                    }
                }

                stage('Windows') {
                    steps {
                        script {
                            testOnAgent('windows') {
                                bat 'nmake test'
                            }
                        }
                    }
                }
            }
        }
    }
}
```

### Mock External Dependencies

```groovy
## Test with mocked HTTP calls
@Test
void testAPICall() {
    helper.registerAllowedMethod('httpRequest', [Map.class], { Map args ->
        return [
            status: 200,
            content: '{"success": true}'
        ]
    })

    def script = loadScript('Jenkinsfile')
    script.execute()

    assertJobStatusSuccess()
}
```

### Performance Testing

Test pipeline performance:

```groovy
pipeline {
    agent any

    stages {
        stage('Performance Test') {
            steps {
                script {
                    def startTime = System.currentTimeMillis()

                    // Run pipeline stages
                    sh 'npm run build'
                    sh 'npm test'

                    def duration = System.currentTimeMillis() - startTime

                    echo "Pipeline took ${duration}ms"

                    if (duration > 600000) { // 10 minutes
                        error "Pipeline exceeds time threshold"
                    }
                }
            }
        }
    }
}
```

---

## Security Best Practices

### Secure Credentials Management

Never hardcode credentials in Jenkinsfiles:

```groovy
// Bad - Hardcoded credentials
pipeline {
    agent any
    stages {
        stage('Deploy') {
            steps {
                sh 'docker login -u myuser -p mypassword'  // ❌ Exposed!
                sh 'aws configure set aws_access_key_id AKIAIOSFODNN7EXAMPLE'  // ❌ Hardcoded!
            }
        }
    }
}

// Good - Use Jenkins credentials
pipeline {
    agent any
    environment {
        DOCKER_CREDS = credentials('docker-hub-credentials')
    }
    stages {
        stage('Deploy') {
            steps {
                sh 'echo $DOCKER_CREDS_PSW | docker login -u $DOCKER_CREDS_USR --password-stdin'
            }
        }
    }
}

// Good - Use withCredentials for temporary access
pipeline {
    agent any
    stages {
        stage('Deploy') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'aws-credentials',
                    usernameVariable: 'AWS_ACCESS_KEY_ID',
                    passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                )]) {
                    sh 'aws s3 sync ./dist s3://my-bucket'
                }
            }
        }
    }
}

// Good - SSH private key
pipeline {
    agent any
    stages {
        stage('Deploy') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'ssh-deploy-key',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USER'
                )]) {
                    sh 'ssh -i $SSH_KEY $SSH_USER@server.example.com "deploy.sh"'
                }
            }
        }
    }
}
```

**Key Points**:

- Store credentials in Jenkins Credentials Manager
- Use `credentials()` helper or `withCredentials` block
- Never commit credentials to version control
- Rotate credentials regularly
- Use least-privilege service accounts
- Mask credentials in console output

### Code Injection Prevention

Prevent command injection in pipeline scripts:

```groovy
// Bad - Unvalidated user input
pipeline {
    agent any
    parameters {
        string(name: 'BRANCH_NAME', defaultValue: 'main')
    }
    stages {
        stage('Build') {
            steps {
                // ❌ Command injection vulnerability!
                sh "git checkout ${params.BRANCH_NAME}"
            }
        }
    }
}

// Good - Validate and sanitize inputs
pipeline {
    agent any
    parameters {
        string(name: 'BRANCH_NAME', defaultValue: 'main')
    }
    stages {
        stage('Validate Input') {
            steps {
                script {
                    // Validate branch name format
                    if (!params.BRANCH_NAME.matches('^[a-zA-Z0-9/_-]+$')) {
                        error("Invalid branch name format")
                    }
                    // Verify branch exists
                    def branches = sh(
                        script: 'git branch -r',
                        returnStdout: true
                    ).trim()
                    if (!branches.contains(params.BRANCH_NAME)) {
                        error("Branch does not exist")
                    }
                }
            }
        }
        stage('Build') {
            steps {
                sh "git checkout ${params.BRANCH_NAME}"
            }
        }
    }
}

// Good - Use allow-lists for dynamic values
pipeline {
    agent any
    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['dev', 'staging', 'production'],  // ✅ Restricted choices
            description: 'Deployment environment'
        )
    }
    stages {
        stage('Deploy') {
            steps {
                sh "./deploy.sh ${params.ENVIRONMENT}"
            }
        }
    }
}
```

**Key Points**:

- Always validate user inputs
- Use `choice` parameters instead of `string` when possible
- Sanitize all external inputs
- Use allow-lists for dynamic values
- Avoid string interpolation with untrusted data
- Never use Groovy `evaluate()` with user input

### Script Security Plugin

Enable and configure Script Security:

```groovy
// Good - Use approved script methods
@Library('my-shared-library') _

pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                script {
                    // Approved methods only
                    def result = readFile('config.json')
                    def config = readJSON text: result

                    // Use shared library functions (pre-approved)
                    buildDockerImage(
                        imageName: config.imageName,
                        tag: env.BUILD_NUMBER
                    )
                }
            }
        }
    }
}

// Bad - Unapproved methods can be security risks
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                script {
                    // ❌ May require admin approval
                    def proc = "ls -la".execute()
                    proc.waitFor()
                }
            }
        }
    }
}
```

**Key Points**:

- Enable Script Security plugin
- Review and approve script methods carefully
- Use declarative pipelines over scripted when possible
- Limit who can approve script methods
- Audit approved methods regularly
- Use shared libraries for complex logic

### Access Control and Authorization

Implement proper access controls:

```groovy
// Good - Restrict who can trigger builds
pipeline {
    agent any

    // Require specific user permissions
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    parameters {
        string(name: 'DEPLOY_ENV', defaultValue: 'staging')
    }

    stages {
        stage('Authorization Check') {
            steps {
                script {
                    // Check if user is authorized for production deployments
                    if (params.DEPLOY_ENV == 'production') {
                        def user = currentBuild.getBuildCauses()[0]?.userId
                        def authorizedUsers = ['admin', 'ops-team']

                        if (!authorizedUsers.contains(user)) {
                            error("User ${user} not authorized for production deployments")
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                sh "./deploy.sh ${params.DEPLOY_ENV}"
            }
        }
    }
}

// Good - Use manual approval for critical stages
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'make build'
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?',
                      ok: 'Deploy',
                      submitter: 'admin,ops-team'  // Only specific users can approve

                sh './deploy-production.sh'
            }
        }
    }
}
```

**Key Points**:

- Configure matrix-based security
- Use folder-level permissions
- Restrict who can trigger sensitive jobs
- Implement approval gates for critical deployments
- Use role-based access control (RBAC)
- Audit user permissions regularly

### Agent and Node Security

Secure Jenkins agents and build nodes:

```groovy
// Good - Use specific agent labels
pipeline {
    agent {
        label 'docker-trusted'  // Only run on trusted agents
    }
    stages {
        stage('Build') {
            steps {
                sh 'docker build -t myapp .'
            }
        }
    }
}

// Good - Use Docker agents with security constraints
pipeline {
    agent {
        docker {
            image 'node:18-alpine'
            args '-u root:root --read-only --tmpfs /tmp'  // Security constraints
        }
    }
    stages {
        stage('Build') {
            steps {
                sh 'npm ci && npm run build'
            }
        }
    }
}

// Good - Separate agents by environment
pipeline {
    agent none
    stages {
        stage('Build') {
            agent { label 'build-agents' }
            steps {
                sh 'make build'
            }
        }

        stage('Deploy Production') {
            agent { label 'production-agents' }  // Dedicated production agents
            when {
                branch 'main'
            }
            steps {
                sh './deploy.sh'
            }
        }
    }
}
```

**Key Points**:

- Use dedicated agents for different environments
- Restrict agent access to sensitive resources
- Use Docker agents for isolation
- Implement agent authentication
- Monitor agent activity
- Keep agents updated and patched

### Artifact Security

Secure build artifacts:

```groovy
// Good - Archive artifacts securely
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'make build'
            }
            post {
                success {
                    // Archive with fingerprinting for integrity
                    archiveArtifacts artifacts: 'dist/**/*',
                                   fingerprint: true,
                                   allowEmptyArchive: false

                    // Calculate and store checksums
                    sh '''
                        cd dist
                        sha256sum * > SHA256SUMS
                    '''
                    archiveArtifacts artifacts: 'dist/SHA256SUMS'
                }
            }
        }
    }
}

// Good - Sign artifacts
pipeline {
    agent any
    stages {
        stage('Build and Sign') {
            steps {
                sh 'make build'

                withCredentials([file(credentialsId: 'gpg-key', variable: 'GPG_KEY')]) {
                    sh '''
                        gpg --import $GPG_KEY
                        gpg --armor --detach-sign dist/myapp.jar
                    '''
                }

                archiveArtifacts artifacts: 'dist/myapp.jar*', fingerprint: true
            }
        }
    }
}
```

**Key Points**:

- Enable artifact fingerprinting
- Sign critical artifacts
- Generate checksums for verification
- Limit artifact retention time
- Control artifact access permissions
- Scan artifacts for vulnerabilities

### Dependency and Plugin Security

Manage dependencies and plugins securely:

```groovy
// Good - Pin dependency versions
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                // Use lock files for reproducible builds
                sh 'npm ci'  // Uses package-lock.json

                // Audit dependencies
                sh 'npm audit --audit-level=high'
            }
        }
    }
}

// Good - Verify plugin signatures
// Configure in Jenkins > Manage Jenkins > Configure System
// Enable "Check plugin signatures" option
```

**Key Points**:

- Keep Jenkins and plugins updated
- Enable plugin signature verification
- Use dependency lock files
- Run dependency audits in pipelines
- Review plugin permissions
- Remove unused plugins

### Audit Logging

Enable comprehensive audit logging:

```groovy
// Good - Log security-relevant events
pipeline {
    agent any
    stages {
        stage('Deploy') {
            steps {
                script {
                    def user = currentBuild.getBuildCauses()[0]?.userId ?: 'UNKNOWN'
                    def timestamp = new Date().format('yyyy-MM-dd HH:mm:ss')

                    echo "AUDIT: Deployment initiated by ${user} at ${timestamp}"
                    echo "AUDIT: Target environment: ${params.DEPLOY_ENV}"
                    echo "AUDIT: Build number: ${env.BUILD_NUMBER}"
                }

                sh './deploy.sh'
            }
            post {
                always {
                    script {
                        def status = currentBuild.currentResult
                        echo "AUDIT: Deployment ${status} at ${new Date().format('yyyy-MM-dd HH:mm:ss')}"
                    }
                }
            }
        }
    }
}
```

**Key Points**:

- Enable audit trail plugin
- Log all credential access
- Track who triggered builds
- Monitor failed login attempts
- Review audit logs regularly
- Retain logs for compliance

### Network Security

Secure network communications:

```groovy
// Good - Use HTTPS for external calls
pipeline {
    agent any
    stages {
        stage('API Call') {
            steps {
                script {
                    // Always use HTTPS
                    def response = httpRequest(
                        url: 'https://api.example.com/data',
                        authentication: 'api-token-credential',
                        validResponseCodes: '200',
                        timeout: 30
                    )
                }
            }
        }
    }
}

// Good - Restrict outbound connections
// Configure in Jenkins security settings:
// - Use proxy for external connections
// - Whitelist allowed domains
// - Block access to internal networks from build agents
```

**Key Points**:

- Always use HTTPS for external communications
- Verify SSL/TLS certificates
- Use proxies for outbound connections
- Implement network segmentation
- Restrict agent network access
- Monitor network traffic

---

## Common Pitfalls

### Workspace Conflicts in Parallel Builds

**Issue**: Parallel stages using same workspace cause file conflicts and corrupted builds.

**Example**:

```groovy
## Bad - Parallel stages share workspace
pipeline {
    agent any
    stages {
        stage('Parallel') {
            parallel {
                stage('Test A') {
                    steps {
                        sh 'npm test > results.txt'  // ❌ Both write to same file!
                    }
                }
                stage('Test B') {
                    steps {
                        sh 'npm test > results.txt'  // ❌ Conflicts with Test A
                    }
                }
            }
        }
    }
}
```

**Solution**: Use separate workspaces or different file names.

```groovy
## Good - Separate workspaces
pipeline {
    agent any
    stages {
        stage('Parallel') {
            parallel {
                stage('Test A') {
                    agent {
                        label 'test-agent'
                    }
                    steps {
                        sh 'npm test > results-a.txt'  // ✅ Unique filename
                    }
                }
                stage('Test B') {
                    agent {
                        label 'test-agent'
                    }
                    steps {
                        sh 'npm test > results-b.txt'  // ✅ Different file
                    }
                }
            }
        }
    }
}

## Good - Use ws() to create separate workspace
stage('Test A') {
    steps {
        ws("workspace-a") {  // ✅ Separate workspace
            sh 'npm test'
        }
    }
}
```

**Key Points**:

- Parallel stages share workspace by default
- Use unique filenames or separate agents
- Use `ws()` step for custom workspace paths
- Consider using `stash`/`unstash` for artifacts

### withCredentials Scope Leakage

**Issue**: Credentials exposed outside withCredentials block through environment variables.

**Example**:

```groovy
## Bad - Credential leaks to environment
pipeline {
    environment {
        SECRET = credentials('my-secret')  // ❌ Available to all stages!
    }
    stages {
        stage('Build') {
            steps {
                sh 'echo $SECRET'  // Exposed
            }
        }
    }
}
```

**Solution**: Use `withCredentials` in smallest possible scope.

```groovy
## Good - Scoped credentials
pipeline {
    agent any
    stages {
        stage('Deploy') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'deploy-creds',
                        usernameVariable: 'USER',
                        passwordVariable: 'PASS'
                    )
                ]) {
                    sh '''
                        echo "Deploying as $USER"
                        deploy.sh  # ✅ Creds only in this scope
                    '''
                }
                // ✅ USER and PASS not available here
            }
        }
    }
}
```

**Key Points**:

- Use `withCredentials` block, not `environment`
- Minimize credential scope
- Credentials auto-masked in console output
- Use credential-specific helper methods

### Not Checking Sh Return Status

**Issue**: Pipeline continues after command failures, masking errors.

**Example**:

```groovy
## Bad - Ignores command failures
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'make build'  // ❌ If fails, what happens?
                sh 'make test'   // Runs even if build fails!
            }
        }
    }
}
```

**Solution**: Check return status or use proper error handling.

```groovy
## Good - Check return status
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                script {
                    def result = sh(script: 'make build', returnStatus: true)
                    if (result != 0) {
                        error("Build failed with code ${result}")  # ✅ Fail pipeline
                    }
                }
                sh 'make test'  // ✅ Only runs if build succeeded
            }
        }
    }
}

## Good - Capture output
stage('Check Version') {
    steps {
        script {
            def version = sh(
                script: 'cat VERSION',
                returnStdout: true
            ).trim()  // ✅ Capture and use output
            echo "Building version ${version}"
        }
    }
}
```

**Key Points**:

- By default, `sh` step fails pipeline on non-zero exit
- Use `returnStatus: true` to capture exit code
- Use `returnStdout: true` to capture output
- Pipeline fails by default on errors (can override)

### Declarative vs Scripted Syntax Mixing

**Issue**: Mixing declarative and scripted syntax incorrectly causes syntax errors.

**Example**:

```groovy
## Bad - Invalid syntax mixing
pipeline {
    agent any
    stages {
        stage('Build') {
            def version = '1.0'  // ❌ Can't use def at stage level!
            steps {
                echo version
            }
        }
    }
}
```

**Solution**: Use `script` blocks for scripted code in declarative pipelines.

```groovy
## Good - Proper script block usage
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                script {
                    def version = '1.0'  // ✅ Inside script block
                    echo "Version: ${version}"
                }
            }
        }
    }
}

## Good - Declarative only
pipeline {
    agent any
    environment {
        VERSION = '1.0'  // ✅ Declarative environment
    }
    stages {
        stage('Build') {
            steps {
                echo "Version: ${VERSION}"  // ✅ No script block needed
            }
        }
    }
}
```

**Key Points**:

- Declarative syntax requires specific structure
- Use `script {}` for Groovy code in declarative pipeline
- Keep scripts minimal, prefer declarative syntax
- `def`, loops, conditionals require `script {}` block

### Agent Reuse Assumptions

**Issue**: Assuming agent state persists between stages causes failures.

**Example**:

```groovy
## Bad - Assumes agent state persists
pipeline {
    agent any
    stages {
        stage('Setup') {
            steps {
                sh 'npm install'  // ❌ May run on agent A
            }
        }
        stage('Test') {
            agent {
                label 'different-agent'  // ❌ Runs on agent B!
            }
            steps {
                sh 'npm test'  // ❌ node_modules not present!
            }
        }
    }
}
```

**Solution**: Use same agent or stash/unstash artifacts.

```groovy
## Good - Single agent for all stages
pipeline {
    agent { label 'nodejs' }  // ✅ Same agent
    stages {
        stage('Setup') {
            steps {
                sh 'npm install'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'  // ✅ node_modules available
            }
        }
    }
}

## Good - Stash and unstash
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'npm run build'
                stash name: 'dist', includes: 'dist/**'  // ✅ Save artifacts
            }
        }
        stage('Deploy') {
            agent { label 'deploy-agent' }
            steps {
                unstash 'dist'  // ✅ Restore artifacts
                sh './deploy.sh'
            }
        }
    }
}
```

**Key Points**:

- Each stage with different agent gets fresh workspace
- Use top-level `agent` for shared state
- Use `stash`/`unstash` to transfer files between agents
- Workspace cleanup between builds prevents state leaks

---

## Anti-Patterns

### ❌ Avoid: Hardcoded Credentials

```groovy
// Bad - Hardcoded credentials
stage('Deploy') {
    steps {
        sh 'docker login -u myuser -p mypassword'
    }
}

// Good - Use Jenkins credentials
stage('Deploy') {
    environment {
        DOCKER_CREDS = credentials('docker-hub-credentials')
    }
    steps {
        sh 'echo $DOCKER_CREDS_PSW | docker login -u $DOCKER_CREDS_USR --password-stdin'
    }
}
```

### ❌ Avoid: Overly Complex Pipelines

```groovy
// Bad - Too much logic in Jenkinsfile
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                script {
                    // 200 lines of complex Groovy logic...
                }
            }
        }
    }
}

// Good - Use shared libraries
@Library('my-shared-library') _

pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                buildApplication(config: readYaml(file: 'build.yaml'))
            }
        }
    }
}
```

### ❌ Avoid: No Cleanup

```groovy
// Bad - No cleanup
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'make build'
            }
        }
    }
}

// Good - Always cleanup workspace
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'make build'
            }
        }
    }
    post {
        always {
            cleanWs()
        }
    }
}
```

### ❌ Avoid: Not Using Parallel Stages

```groovy
// Bad - Sequential execution
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'npm run test:unit'      // Runs first
                sh 'npm run test:integration' // Then this
                sh 'npm run test:e2e'        // Then this
            }
        }
    }
}

// Good - Parallel execution
pipeline {
    agent any
    stages {
        stage('Test') {
            parallel {
                stage('Unit') {
                    steps { sh 'npm run test:unit' }
                }
                stage('Integration') {
                    steps { sh 'npm run test:integration' }
                }
                stage('E2E') {
                    steps { sh 'npm run test:e2e' }
                }
            }
        }
    }
}
```

### ❌ Avoid: No Timeouts

```groovy
// Bad - Can hang indefinitely
pipeline {
    agent any
    stages {
        stage('Deploy') {
            steps {
                sh './deploy.sh'  // ❌ No timeout
            }
        }
    }
}

// Good - Set timeouts
pipeline {
    agent any
    options {
        timeout(time: 1, unit: 'HOURS')  // ✅ Pipeline timeout
    }
    stages {
        stage('Deploy') {
            options {
                timeout(time: 30, unit: 'MINUTES')  // ✅ Stage timeout
            }
            steps {
                sh './deploy.sh'
            }
        }
    }
}
```

### ❌ Avoid: Using 'node' Instead of 'agent'

```groovy
// Bad - Old scripted pipeline syntax
node {
    stage('Build') {
        checkout scm
        sh 'make build'
    }
}

// Good - Declarative pipeline with agent
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                checkout scm
                sh 'make build'
            }
        }
    }
}
```

### ❌ Avoid: Not Handling Build Artifacts

```groovy
// Bad - No artifact preservation
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'make build'  // ❌ Artifacts lost after build
            }
        }
    }
}

// Good - Archive and stash artifacts
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'make build'
            }
            post {
                success {
                    archiveArtifacts artifacts: 'dist/**/*', fingerprint: true
                    stash name: 'build-artifacts', includes: 'dist/**/*'
                }
            }
        }
        stage('Test') {
            steps {
                unstash 'build-artifacts'  // ✅ Retrieve artifacts
                sh 'make test'
            }
        }
    }
}
```

---

## Tool Configurations

### Jenkinsfile Validation

```bash
## Validate Jenkinsfile syntax
curl -X POST -F "jenkinsfile=<Jenkinsfile" http://jenkins.example.com/pipeline-model-converter/validate

## Use Jenkins CLI
java -jar jenkins-cli.jar -s http://jenkins.example.com/ declarative-linter < Jenkinsfile
```

### VSCode Extensions

- **Jenkins Pipeline Linter Connector**: Validate Jenkinsfiles
- **Jenkins Jack**: Manage Jenkins jobs from VSCode
- **Groovy**: Syntax highlighting for Groovy

---

## References

### Official Documentation

- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)
- [Pipeline Syntax Reference](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Shared Libraries](https://www.jenkins.io/doc/book/pipeline/shared-libraries/)

### Tools

- [Jenkins Configuration as Code (JCasC)](https://www.jenkins.io/projects/jcasc/)
- [Jenkins CLI](https://www.jenkins.io/doc/book/managing/cli/)
- [Blue Ocean](https://www.jenkins.io/projects/blueocean/) - Modern Jenkins UI

### Best Practices

- [Jenkins Best Practices](https://www.jenkins.io/doc/book/pipeline/pipeline-best-practices/)
- [CloudBees Pipeline Best Practices](https://www.cloudbees.com/blog/top-10-best-practices-jenkins-pipeline-plugin)

---

**Version**: 1.0.0
**Status**: Active
