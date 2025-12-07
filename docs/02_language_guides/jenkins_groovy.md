---
title: "Jenkins & Groovy Style Guide"
description: "Jenkins declarative and scripted pipeline standards for CI/CD automation"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [jenkins, groovy, cicd, pipelines, automation, devops]
category: "Language Guides"
status: "active"
version: "1.0.0"
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
# Validate Jenkinsfile syntax
curl -X POST -F "jenkinsfile=<Jenkinsfile" http://jenkins.example.com/pipeline-model-converter/validate

# Use Jenkins CLI
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
**Last Updated**: 2025-10-28
**Status**: Active
