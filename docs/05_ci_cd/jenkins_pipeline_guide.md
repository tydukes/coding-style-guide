---
title: "Jenkins Pipeline Guide"
description: "Comprehensive guide to building production-grade CI/CD pipelines with Jenkins, including declarative and scripted pipelines, shared libraries, deployment strategies, and security best practices"
author: "Tyler Dukes"
tags: [jenkins, ci-cd, groovy, pipeline, automation, deployment, devops, shared-libraries]
category: "CI/CD"
status: "active"
search_keywords: [jenkins, pipeline, ci cd, groovy, jenkinsfile, stages, deployment]
---

## Introduction

This guide provides comprehensive patterns and best practices for building production-grade CI/CD pipelines
with Jenkins. It covers declarative and scripted pipeline syntax, shared libraries, deployment strategies,
security integration, and performance optimization.

---

## Table of Contents

1. [Pipeline Fundamentals](#pipeline-fundamentals)
2. [Declarative Pipeline Patterns](#declarative-pipeline-patterns)
3. [Full-Stack Application Pipeline](#full-stack-application-pipeline)
4. [Deployment Strategies](#deployment-strategies)
5. [Shared Libraries](#shared-libraries)
6. [Security Integration](#security-integration)
7. [Testing Strategies](#testing-strategies)
8. [Performance Optimization](#performance-optimization)
9. [Multi-Branch Pipelines](#multi-branch-pipelines)
10. [Advanced Patterns](#advanced-patterns)

---

## Pipeline Fundamentals

### Declarative vs Scripted Pipelines

**Declarative Pipeline** (Recommended for most use cases):

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
}
```

**Scripted Pipeline** (For complex logic):

```groovy
node {
    stage('Build') {
        sh 'make build'
    }
}
```

### Best Practices for Pipeline Structure

1. **Use Declarative Syntax**: More structured, easier to read, built-in error handling
2. **Define Agent at Stage Level**: Allow different stages to run on different agents
3. **Use Environment Variables**: Centralize configuration
4. **Implement Timeouts**: Prevent hung builds
5. **Add Post Actions**: Always cleanup, notify on failure

### Basic Declarative Pipeline Template

```groovy
pipeline {
    agent none

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 1, unit: 'HOURS')
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        // Global environment variables
        PROJECT_NAME = 'my-app'
        DOCKER_REGISTRY = 'docker.io/myorg'
    }

    stages {
        stage('Checkout') {
            agent any
            steps {
                checkout scm
            }
        }

        stage('Build') {
            agent {
                docker {
                    image 'node:20-alpine'
                    reuseNode true
                }
            }
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }

        stage('Test') {
            agent {
                docker {
                    image 'node:20-alpine'
                    reuseNode true
                }
            }
            steps {
                sh 'npm test'
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

## Declarative Pipeline Patterns

### Parallel Execution

```groovy
pipeline {
    agent any

    stages {
        stage('Parallel Tests') {
            parallel {
                stage('Unit Tests') {
                    agent {
                        docker { image 'node:20-alpine' }
                    }
                    steps {
                        sh 'npm run test:unit'
                    }
                }

                stage('Integration Tests') {
                    agent {
                        docker { image 'node:20-alpine' }
                    }
                    steps {
                        sh 'npm run test:integration'
                    }
                }

                stage('Lint') {
                    agent {
                        docker { image 'node:20-alpine' }
                    }
                    steps {
                        sh 'npm run lint'
                    }
                }
            }
        }
    }
}
```

### Matrix Builds

```groovy
pipeline {
    agent none

    stages {
        stage('Test Multiple Versions') {
            matrix {
                axes {
                    axis {
                        name 'NODE_VERSION'
                        values '18', '20', '22'
                    }
                    axis {
                        name 'OS'
                        values 'linux', 'windows'
                    }
                }
                excludes {
                    exclude {
                        axis {
                            name 'NODE_VERSION'
                            values '18'
                        }
                        axis {
                            name 'OS'
                            values 'windows'
                        }
                    }
                }
                agent {
                    docker {
                        image "node:${NODE_VERSION}-alpine"
                    }
                }
                stages {
                    stage('Test') {
                        steps {
                            sh 'npm ci'
                            sh 'npm test'
                        }
                    }
                }
            }
        }
    }
}
```

### Conditional Execution

```groovy
pipeline {
    agent any

    stages {
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh './deploy-staging.sh'
            }
        }

        stage('Deploy to Production') {
            when {
                allOf {
                    branch 'main'
                    expression {
                        currentBuild.result == null || currentBuild.result == 'SUCCESS'
                    }
                }
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                sh './deploy-production.sh'
            }
        }

        stage('Build Docker Image') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    changeRequest()
                }
            }
            steps {
                sh 'docker build -t myapp:${GIT_COMMIT} .'
            }
        }
    }
}
```

### Using Credentials

```groovy
pipeline {
    agent any

    environment {
        // Username/Password credential
        DOCKER_CREDS = credentials('docker-hub-credentials')

        // Secret text credential
        API_KEY = credentials('api-key')

        // SSH key credential
        SSH_KEY = credentials('deploy-ssh-key')
    }

    stages {
        stage('Docker Login') {
            steps {
                sh '''
                    echo $DOCKER_CREDS_PSW | docker login -u $DOCKER_CREDS_USR --password-stdin
                '''
            }
        }

        stage('Use API Key') {
            steps {
                sh '''
                    curl -H "Authorization: Bearer ${API_KEY}" https://api.example.com
                '''
            }
        }

        stage('SSH Deploy') {
            steps {
                sshagent(['deploy-ssh-key']) {
                    sh '''
                        ssh user@server 'bash -s' < deploy.sh
                    '''
                }
            }
        }
    }
}
```

---

## Full-Stack Application Pipeline

### Complete Node.js + Python Pipeline

```groovy
pipeline {
    agent none

    options {
        buildDiscarder(logRotator(numToKeepStr: '30'))
        timeout(time: 1, unit: 'HOURS')
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        DOCKER_REGISTRY = 'docker.io/myorg'
        DOCKER_CREDS = credentials('docker-hub-credentials')
        AWS_CREDS = credentials('aws-credentials')
        SLACK_CHANNEL = '#deployments'
    }

    stages {
        stage('Checkout') {
            agent any
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: "git rev-parse --short HEAD",
                        returnStdout: true
                    ).trim()
                }
            }
        }

        stage('Parallel Lint & Format Check') {
            parallel {
                stage('Frontend Lint') {
                    agent {
                        docker {
                            image 'node:20-alpine'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run lint'
                            sh 'npm run format:check'
                        }
                    }
                }

                stage('Backend Lint') {
                    agent {
                        docker {
                            image 'python:3.11-slim'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('backend') {
                            sh 'pip install -q flake8 black mypy'
                            sh 'flake8 .'
                            sh 'black --check .'
                            sh 'mypy .'
                        }
                    }
                }
            }
        }

        stage('Build') {
            parallel {
                stage('Frontend Build') {
                    agent {
                        docker {
                            image 'node:20-alpine'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run build'
                            stash name: 'frontend-dist', includes: 'dist/**'
                        }
                    }
                }

                stage('Backend Build') {
                    agent {
                        docker {
                            image 'python:3.11-slim'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('backend') {
                            sh 'pip install -q build'
                            sh 'python -m build'
                            stash name: 'backend-dist', includes: 'dist/**'
                        }
                    }
                }
            }
        }

        stage('Test') {
            parallel {
                stage('Frontend Unit Tests') {
                    agent {
                        docker {
                            image 'node:20-alpine'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run test:unit -- --coverage'
                        }
                    }
                    post {
                        always {
                            publishHTML([
                                reportDir: 'frontend/coverage',
                                reportFiles: 'index.html',
                                reportName: 'Frontend Coverage Report'
                            ])
                        }
                    }
                }

                stage('Backend Unit Tests') {
                    agent {
                        docker {
                            image 'python:3.11-slim'
                            reuseNode true
                            args '-u root'
                        }
                    }
                    steps {
                        dir('backend') {
                            sh '''
                                pip install -q -e .[test]
                                pytest tests/unit -v --cov --cov-report=html --cov-report=xml
                            '''
                        }
                    }
                    post {
                        always {
                            publishHTML([
                                reportDir: 'backend/htmlcov',
                                reportFiles: 'index.html',
                                reportName: 'Backend Coverage Report'
                            ])
                            cobertura coberturaReportFile: 'backend/coverage.xml'
                        }
                    }
                }
            }
        }

        stage('Integration Tests') {
            agent {
                docker {
                    image 'docker:24-dind'
                    args '-v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                sh '''
                    docker-compose -f docker-compose.test.yml up -d
                    docker-compose -f docker-compose.test.yml run --rm api-tests
                '''
            }
            post {
                always {
                    sh 'docker-compose -f docker-compose.test.yml down -v'
                }
            }
        }

        stage('Security Scans') {
            parallel {
                stage('Frontend Security') {
                    agent {
                        docker {
                            image 'node:20-alpine'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('frontend') {
                            sh 'npm audit --audit-level=moderate'
                        }
                    }
                }

                stage('Backend Security') {
                    agent {
                        docker {
                            image 'python:3.11-slim'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('backend') {
                            sh '''
                                pip install -q safety bandit
                                safety check
                                bandit -r . -f json -o bandit-report.json || true
                            '''
                        }
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'backend/bandit-report.json', allowEmptyArchive: true
                        }
                    }
                }

                stage('Secret Scan') {
                    agent any
                    steps {
                        sh '''
                            docker run --rm -v $(pwd):/path \
                                trufflesecurity/trufflehog:latest \
                                filesystem /path --json > trufflehog-report.json || true
                        '''
                    }
                    post {
                        always {
                            archiveArtifacts artifacts: 'trufflehog-report.json', allowEmptyArchive: true
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            agent any
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                unstash 'frontend-dist'
                unstash 'backend-dist'

                sh """
                    echo \$DOCKER_CREDS_PSW | docker login -u \$DOCKER_CREDS_USR --password-stdin

                    docker build -t ${DOCKER_REGISTRY}/frontend:${GIT_COMMIT_SHORT} -f frontend/Dockerfile frontend/
                    docker build -t ${DOCKER_REGISTRY}/backend:${GIT_COMMIT_SHORT} -f backend/Dockerfile backend/

                    docker push ${DOCKER_REGISTRY}/frontend:${GIT_COMMIT_SHORT}
                    docker push ${DOCKER_REGISTRY}/backend:${GIT_COMMIT_SHORT}
                """

                script {
                    if (env.BRANCH_NAME == 'main') {
                        sh """
                            docker tag ${DOCKER_REGISTRY}/frontend:${GIT_COMMIT_SHORT} ${DOCKER_REGISTRY}/frontend:latest
                            docker tag ${DOCKER_REGISTRY}/backend:${GIT_COMMIT_SHORT} ${DOCKER_REGISTRY}/backend:latest

                            docker push ${DOCKER_REGISTRY}/frontend:latest
                            docker push ${DOCKER_REGISTRY}/backend:latest
                        """
                    }
                }
            }
        }

        stage('Deploy to Staging') {
            agent any
            when {
                branch 'develop'
            }
            steps {
                sh """
                    aws configure set aws_access_key_id \$AWS_CREDS_USR
                    aws configure set aws_secret_access_key \$AWS_CREDS_PSW
                    aws configure set region us-east-1

                    aws ecs update-service \\
                        --cluster staging-cluster \\
                        --service frontend-service \\
                        --force-new-deployment

                    aws ecs update-service \\
                        --cluster staging-cluster \\
                        --service backend-service \\
                        --force-new-deployment
                """
            }
        }

        stage('Deploy to Production') {
            agent any
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy', submitter: 'ops-team'

                sh """
                    aws configure set aws_access_key_id \$AWS_CREDS_USR
                    aws configure set aws_secret_access_key \$AWS_CREDS_PSW
                    aws configure set region us-east-1

                    # Blue-green deployment
                    aws ecs update-service \\
                        --cluster production-cluster \\
                        --service frontend-service-green \\
                        --force-new-deployment

                    aws ecs wait services-stable \\
                        --cluster production-cluster \\
                        --services frontend-service-green

                    # Switch traffic
                    aws elbv2 modify-listener \\
                        --listener-arn \$LISTENER_ARN \\
                        --default-actions Type=forward,TargetGroupArn=\$TARGET_GROUP_GREEN_ARN
                """
            }
        }

        stage('Smoke Tests') {
            agent {
                docker {
                    image 'postman/newman:alpine'
                }
            }
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    def apiUrl = env.BRANCH_NAME == 'main' ?
                        'https://api.example.com' :
                        'https://api-staging.example.com'

                    sh """
                        newman run tests/smoke-tests.postman_collection.json \\
                            --env-var baseUrl=${apiUrl} \\
                            --reporters cli,json \\
                            --reporter-json-export newman-report.json
                    """
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'newman-report.json', allowEmptyArchive: true
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            script {
                if (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'develop') {
                    def msg = "✅ Deployment succeeded: ${env.JOB_NAME} #${env.BUILD_NUMBER}\n" +
                              "Branch: ${env.BRANCH_NAME}\nCommit: ${env.GIT_COMMIT_SHORT}"
                    slackSend(
                        channel: env.SLACK_CHANNEL,
                        color: 'good',
                        message: msg
                    )
                }
            }
        }
        failure {
            slackSend(
                channel: env.SLACK_CHANNEL,
                color: 'danger',
                message: "❌ Build failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}\nBranch: ${env.BRANCH_NAME}\n${env.BUILD_URL}"
            )
        }
    }
}
```

---

## Deployment Strategies

### Blue-Green Deployment

```groovy
pipeline {
    agent any

    environment {
        CLUSTER = 'production-cluster'
        SERVICE_BLUE = 'myapp-blue'
        SERVICE_GREEN = 'myapp-green'
        ALB_LISTENER_ARN = credentials('alb-listener-arn')
        TARGET_GROUP_BLUE_ARN = credentials('target-group-blue-arn')
        TARGET_GROUP_GREEN_ARN = credentials('target-group-green-arn')
    }

    stages {
        stage('Determine Active Environment') {
            steps {
                script {
                    def currentTarget = sh(
                        script: """
                            aws elbv2 describe-listeners \\
                                --listener-arns ${ALB_LISTENER_ARN} \\
                                --query 'Listeners[0].DefaultActions[0].TargetGroupArn' \\
                                --output text
                        """,
                        returnStdout: true
                    ).trim()

                    if (currentTarget == env.TARGET_GROUP_BLUE_ARN) {
                        env.ACTIVE_ENV = 'blue'
                        env.INACTIVE_ENV = 'green'
                        env.INACTIVE_SERVICE = env.SERVICE_GREEN
                        env.INACTIVE_TARGET_GROUP = env.TARGET_GROUP_GREEN_ARN
                    } else {
                        env.ACTIVE_ENV = 'green'
                        env.INACTIVE_ENV = 'blue'
                        env.INACTIVE_SERVICE = env.SERVICE_BLUE
                        env.INACTIVE_TARGET_GROUP = env.TARGET_GROUP_BLUE_ARN
                    }

                    echo "Active environment: ${env.ACTIVE_ENV}"
                    echo "Deploying to inactive environment: ${env.INACTIVE_ENV}"
                }
            }
        }

        stage('Deploy to Inactive Environment') {
            steps {
                sh """
                    aws ecs update-service \\
                        --cluster ${CLUSTER} \\
                        --service ${INACTIVE_SERVICE} \\
                        --force-new-deployment \\
                        --task-definition myapp:${env.BUILD_NUMBER}
                """
            }
        }

        stage('Wait for Deployment') {
            steps {
                sh """
                    aws ecs wait services-stable \\
                        --cluster ${CLUSTER} \\
                        --services ${INACTIVE_SERVICE}
                """
            }
        }

        stage('Run Health Checks') {
            steps {
                script {
                    def healthCheckPassed = sh(
                        script: """
                            for i in {1..10}; do
                                STATUS=\$(aws elbv2 describe-target-health \\
                                    --target-group-arn ${INACTIVE_TARGET_GROUP} \\
                                    --query 'TargetHealthDescriptions[0].TargetHealth.State' \\
                                    --output text)

                                if [ "\$STATUS" = "healthy" ]; then
                                    echo "Health check passed"
                                    exit 0
                                fi

                                echo "Waiting for healthy status... (attempt \$i/10)"
                                sleep 30
                            done

                            echo "Health check failed"
                            exit 1
                        """,
                        returnStatus: true
                    )

                    if (healthCheckPassed != 0) {
                        error("Health checks failed on inactive environment")
                    }
                }
            }
        }

        stage('Switch Traffic') {
            steps {
                input message: "Switch traffic to ${env.INACTIVE_ENV} environment?", ok: 'Switch'

                sh """
                    aws elbv2 modify-listener \\
                        --listener-arn ${ALB_LISTENER_ARN} \\
                        --default-actions Type=forward,TargetGroupArn=${INACTIVE_TARGET_GROUP}
                """

                echo "Traffic switched to ${env.INACTIVE_ENV} environment"
            }
        }

        stage('Monitor New Environment') {
            steps {
                script {
                    echo "Monitoring new active environment for 5 minutes..."
                    sleep time: 5, unit: 'MINUTES'
                }
            }
        }
    }

    post {
        failure {
            script {
                echo "Deployment failed. Rolling back..."

                // Rollback by switching traffic back to original environment
                def targetGroup = env.ACTIVE_ENV == 'blue' ? env.TARGET_GROUP_BLUE_ARN : env.TARGET_GROUP_GREEN_ARN
                sh """
                    aws elbv2 modify-listener \\
                        --listener-arn ${ALB_LISTENER_ARN} \\
                        --default-actions Type=forward,TargetGroupArn=${targetGroup}
                """
            }
        }
    }
}
```

### Canary Deployment

```groovy
pipeline {
    agent any

    environment {
        CLUSTER = 'production-cluster'
        SERVICE_STABLE = 'myapp-stable'
        SERVICE_CANARY = 'myapp-canary'
    }

    stages {
        stage('Deploy Canary') {
            steps {
                sh """
                    aws ecs update-service \\
                        --cluster ${CLUSTER} \\
                        --service ${SERVICE_CANARY} \\
                        --force-new-deployment \\
                        --desired-count 1
                """
            }
        }

        stage('Canary 10%') {
            steps {
                sh """
                    aws elbv2 modify-target-group-attributes \\
                        --target-group-arn ${TARGET_GROUP_CANARY_ARN} \\
                        --attributes Key=deregistration_delay.timeout_seconds,Value=30

                    # Configure 10% traffic to canary
                    aws elbv2 modify-listener \\
                        --listener-arn ${LISTENER_ARN} \\
                        --default-actions '[
                            {
                                "Type": "forward",
                                "ForwardConfig": {
                                    "TargetGroups": [
                                        {"TargetGroupArn": "'${TARGET_GROUP_STABLE_ARN}'", "Weight": 90},
                                        {"TargetGroupArn": "'${TARGET_GROUP_CANARY_ARN}'", "Weight": 10}
                                    ]
                                }
                            }
                        ]'
                """

                sleep time: 5, unit: 'MINUTES'

                script {
                    def metrics = checkMetrics()
                    if (!metrics.healthy) {
                        error("Canary metrics unhealthy at 10%")
                    }
                }
            }
        }

        stage('Canary 50%') {
            steps {
                input message: 'Proceed to 50% canary?', ok: 'Proceed'

                sh """
                    aws ecs update-service \\
                        --cluster ${CLUSTER} \\
                        --service ${SERVICE_CANARY} \\
                        --desired-count 5

                    aws elbv2 modify-listener \\
                        --listener-arn ${LISTENER_ARN} \\
                        --default-actions '[
                            {
                                "Type": "forward",
                                "ForwardConfig": {
                                    "TargetGroups": [
                                        {"TargetGroupArn": "'${TARGET_GROUP_STABLE_ARN}'", "Weight": 50},
                                        {"TargetGroupArn": "'${TARGET_GROUP_CANARY_ARN}'", "Weight": 50}
                                    ]
                                }
                            }
                        ]'
                """

                sleep time: 10, unit: 'MINUTES'

                script {
                    def metrics = checkMetrics()
                    if (!metrics.healthy) {
                        error("Canary metrics unhealthy at 50%")
                    }
                }
            }
        }

        stage('Full Rollout') {
            steps {
                input message: 'Proceed with full rollout?', ok: 'Deploy'

                sh """
                    # Update stable service with new version
                    aws ecs update-service \\
                        --cluster ${CLUSTER} \\
                        --service ${SERVICE_STABLE} \\
                        --force-new-deployment

                    aws ecs wait services-stable \\
                        --cluster ${CLUSTER} \\
                        --services ${SERVICE_STABLE}

                    # Switch all traffic to stable
                    aws elbv2 modify-listener \\
                        --listener-arn ${LISTENER_ARN} \\
                        --default-actions Type=forward,TargetGroupArn=${TARGET_GROUP_STABLE_ARN}

                    # Scale down canary
                    aws ecs update-service \\
                        --cluster ${CLUSTER} \\
                        --service ${SERVICE_CANARY} \\
                        --desired-count 0
                """
            }
        }
    }

    post {
        failure {
            sh """
                # Rollback: remove canary traffic
                aws elbv2 modify-listener \\
                    --listener-arn ${LISTENER_ARN} \\
                    --default-actions Type=forward,TargetGroupArn=${TARGET_GROUP_STABLE_ARN}

                aws ecs update-service \\
                    --cluster ${CLUSTER} \\
                    --service ${SERVICE_CANARY} \\
                    --desired-count 0
            """
        }
    }
}

def checkMetrics() {
    // Check CloudWatch metrics, error rates, latency
    def errorRate = sh(
        script: """
            aws cloudwatch get-metric-statistics \\
                --namespace AWS/ApplicationELB \\
                --metric-name HTTPCode_Target_5XX_Count \\
                --dimensions Name=TargetGroup,Value=${TARGET_GROUP_CANARY_ARN} \\
                --start-time \$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \\
                --end-time \$(date -u +%Y-%m-%dT%H:%M:%S) \\
                --period 300 \\
                --statistics Sum \\
                --query 'Datapoints[0].Sum' \\
                --output text
        """,
        returnStdout: true
    ).trim()

    return [healthy: errorRate.toInteger() < 10]
}
```

---

## Shared Libraries

### Creating a Shared Library

**Directory structure**:

```text
jenkins-shared-library/
├── vars/
│   ├── buildDockerImage.groovy
│   ├── deployToK8s.groovy
│   └── notifySlack.groovy
└── src/
    └── com/
        └── mycompany/
            └── jenkins/
                └── Pipeline.groovy
```

**vars/buildDockerImage.groovy**:

```groovy
#!/usr/bin/env groovy

def call(Map config) {
    def imageName = config.imageName ?: error("imageName is required")
    def dockerfile = config.dockerfile ?: 'Dockerfile'
    def context = config.context ?: '.'
    def registry = config.registry ?: 'docker.io'
    def tag = config.tag ?: env.GIT_COMMIT?.take(7) ?: 'latest'

    def fullImageName = "${registry}/${imageName}:${tag}"

    echo "Building Docker image: ${fullImageName}"

    sh """
        docker build -t ${fullImageName} -f ${dockerfile} ${context}
    """

    if (config.push) {
        echo "Pushing Docker image: ${fullImageName}"

        withCredentials([usernamePassword(
            credentialsId: config.credentialsId ?: 'docker-hub-credentials',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS'
        )]) {
            sh """
                echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin ${registry}
                docker push ${fullImageName}
            """
        }
    }

    return fullImageName
}
```

**vars/deployToK8s.groovy**:

```groovy
#!/usr/bin/env groovy

def call(Map config) {
    def namespace = config.namespace ?: error("namespace is required")
    def deployment = config.deployment ?: error("deployment is required")
    def image = config.image ?: error("image is required")
    def container = config.container ?: deployment
    def kubeconfig = config.kubeconfig ?: 'kubeconfig-production'

    echo "Deploying ${image} to ${namespace}/${deployment}"

    withKubeConfig([credentialsId: kubeconfig]) {
        sh """
            kubectl set image deployment/${deployment} \\
                ${container}=${image} \\
                -n ${namespace}

            kubectl rollout status deployment/${deployment} \\
                -n ${namespace} \\
                --timeout=5m
        """
    }

    if (config.verify) {
        echo "Verifying deployment..."

        sh """
            kubectl get deployment ${deployment} -n ${namespace}
            kubectl get pods -n ${namespace} -l app=${deployment}
        """
    }
}
```

**vars/notifySlack.groovy**:

```groovy
#!/usr/bin/env groovy

def call(Map config) {
    def channel = config.channel ?: '#builds'
    def message = config.message ?: "Build ${currentBuild.currentResult}"
    def color = config.color ?: getColorByStatus(currentBuild.currentResult)

    def attachments = [[
        color: color,
        title: "${env.JOB_NAME} #${env.BUILD_NUMBER}",
        title_link: env.BUILD_URL,
        text: message,
        fields: [
            [title: 'Branch', value: env.BRANCH_NAME ?: 'N/A', short: true],
            [title: 'Commit', value: env.GIT_COMMIT?.take(7) ?: 'N/A', short: true],
            [title: 'Status', value: currentBuild.currentResult, short: true],
            [title: 'Duration', value: currentBuild.durationString, short: true]
        ],
        footer: 'Jenkins CI',
        ts: System.currentTimeMillis() / 1000
    ]]

    slackSend(
        channel: channel,
        attachments: attachments
    )
}

def getColorByStatus(status) {
    switch(status) {
        case 'SUCCESS':
            return 'good'
        case 'FAILURE':
            return 'danger'
        case 'UNSTABLE':
            return 'warning'
        default:
            return '#439FE0'
    }
}
```

### Using Shared Library

**Jenkinsfile**:

```groovy
@Library('my-shared-library@main') _

pipeline {
    agent any

    stages {
        stage('Build Docker Image') {
            steps {
                script {
                    env.DOCKER_IMAGE = buildDockerImage(
                        imageName: 'myapp',
                        dockerfile: 'Dockerfile',
                        registry: 'docker.io/myorg',
                        tag: env.GIT_COMMIT.take(7),
                        push: true,
                        credentialsId: 'docker-hub-credentials'
                    )
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    deployToK8s(
                        namespace: 'production',
                        deployment: 'myapp',
                        image: env.DOCKER_IMAGE,
                        container: 'myapp-container',
                        kubeconfig: 'kubeconfig-production',
                        verify: true
                    )
                }
            }
        }
    }

    post {
        always {
            script {
                notifySlack(
                    channel: '#deployments',
                    message: "Deployment ${currentBuild.currentResult}"
                )
            }
        }
    }
}
```

---

## Security Integration

### SonarQube Integration

```groovy
pipeline {
    agent any

    environment {
        SONAR_TOKEN = credentials('sonarqube-token')
    }

    stages {
        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarQubeScanner'

                    withSonarQubeEnv('SonarQube') {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \\
                                -Dsonar.projectKey=my-project \\
                                -Dsonar.sources=src \\
                                -Dsonar.tests=tests \\
                                -Dsonar.python.coverage.reportPaths=coverage.xml \\
                                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
}
```

### Snyk Security Scanning

```groovy
pipeline {
    agent any

    environment {
        SNYK_TOKEN = credentials('snyk-api-token')
    }

    stages {
        stage('Snyk Dependency Scan') {
            parallel {
                stage('Snyk - Frontend') {
                    steps {
                        dir('frontend') {
                            sh '''
                                npm ci
                                npx snyk test --severity-threshold=high --json > snyk-frontend.json || true
                                npx snyk monitor
                            '''
                        }
                    }
                }

                stage('Snyk - Backend') {
                    steps {
                        dir('backend') {
                            sh '''
                                pip install -r requirements.txt
                                snyk test --severity-threshold=high --json > snyk-backend.json || true
                                snyk monitor
                            '''
                        }
                    }
                }

                stage('Snyk - Docker') {
                    steps {
                        sh '''
                            docker build -t myapp:${GIT_COMMIT} .
                            snyk container test myapp:${GIT_COMMIT} \\
                                --severity-threshold=high \\
                                --json > snyk-docker.json || true
                        '''
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: '**/snyk-*.json', allowEmptyArchive: true
                }
            }
        }
    }
}
```

### Trivy Container Scanning

```groovy
stage('Trivy Scan') {
    steps {
        sh """
            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \\
                aquasec/trivy:latest image \\
                --severity HIGH,CRITICAL \\
                --format json \\
                --output trivy-report.json \\
                myapp:${GIT_COMMIT}
        """
    }
    post {
        always {
            archiveArtifacts artifacts: 'trivy-report.json', allowEmptyArchive: true

            script {
                def trivyReport = readJSON file: 'trivy-report.json'
                def criticalCount = trivyReport.Results?.sum {
                    it.Vulnerabilities?.count { v -> v.Severity == 'CRITICAL' } ?: 0
                } ?: 0

                if (criticalCount > 0) {
                    error("Found ${criticalCount} CRITICAL vulnerabilities")
                }
            }
        }
    }
}
```

---

## Testing Strategies

### Unit and Integration Tests

```groovy
stage('Test') {
    parallel {
        stage('Backend Tests') {
            agent {
                docker {
                    image 'python:3.11-slim'
                    reuseNode true
                }
            }
            steps {
                dir('backend') {
                    sh '''
                        pip install -e .[test]
                        pytest tests/unit -v --junitxml=junit-unit.xml --cov --cov-report=xml
                        pytest tests/integration -v --junitxml=junit-integration.xml
                    '''
                }
            }
            post {
                always {
                    junit 'backend/junit-*.xml'
                    cobertura coberturaReportFile: 'backend/coverage.xml'
                }
            }
        }

        stage('Frontend Tests') {
            agent {
                docker {
                    image 'node:20-alpine'
                    reuseNode true
                }
            }
            steps {
                dir('frontend') {
                    sh '''
                        npm ci
                        npm run test:unit -- --coverage --reporters=default --reporters=jest-junit
                    '''
                }
            }
            post {
                always {
                    junit 'frontend/junit.xml'
                    publishHTML([
                        reportDir: 'frontend/coverage',
                        reportFiles: 'index.html',
                        reportName: 'Frontend Coverage'
                    ])
                }
            }
        }
    }
}
```

### E2E Testing with Playwright

```groovy
stage('E2E Tests') {
    agent {
        docker {
            image 'mcr.microsoft.com/playwright:v1.40.0-focal'
            args '-u root -v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
    steps {
        sh '''
            # Start application
            docker-compose up -d

            # Wait for application to be ready
            sleep 30

            # Run Playwright tests
            cd e2e
            npm ci
            npx playwright test --reporter=html,junit
        '''
    }
    post {
        always {
            sh 'docker-compose down -v'
            junit 'e2e/test-results/junit.xml'
            publishHTML([
                reportDir: 'e2e/playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright Test Report'
            ])
        }
    }
}
```

### Load Testing with k6

```groovy
stage('Load Testing') {
    agent {
        docker {
            image 'grafana/k6:latest'
        }
    }
    when {
        branch 'main'
    }
    steps {
        sh '''
            k6 run --out json=k6-results.json \\
                --vus 100 \\
                --duration 5m \\
                tests/load/api-load-test.js
        '''
    }
    post {
        always {
            archiveArtifacts artifacts: 'k6-results.json', allowEmptyArchive: true

            script {
                def k6Results = readJSON file: 'k6-results.json'
                def p95 = k6Results.metrics?.http_req_duration?.values?.['p(95)']

                if (p95 && p95 > 2000) {
                    unstable(message: "P95 latency exceeded threshold: ${p95}ms")
                }
            }
        }
    }
}
```

---

## Performance Optimization

### Build Caching

```groovy
pipeline {
    agent any

    stages {
        stage('Build with Cache') {
            steps {
                script {
                    // Use Docker build cache
                    sh """
                        docker build \\
                            --cache-from ${DOCKER_REGISTRY}/myapp:latest \\
                            --build-arg BUILDKIT_INLINE_CACHE=1 \\
                            -t ${DOCKER_REGISTRY}/myapp:${GIT_COMMIT} \\
                            .
                    """
                }
            }
        }

        stage('npm ci with cache') {
            agent {
                docker {
                    image 'node:20-alpine'
                    reuseNode true
                }
            }
            steps {
                dir('frontend') {
                    // Cache npm dependencies
                    cache(maxCacheSize: 1000, caches: [
                        arbitraryFileCache(
                            path: 'node_modules',
                            cacheValidityDecidingFile: 'package-lock.json'
                        )
                    ]) {
                        sh 'npm ci'
                    }
                }
            }
        }
    }
}
```

### Stash/Unstash for Artifact Sharing

```groovy
stage('Build') {
    steps {
        sh 'npm run build'
        stash name: 'dist', includes: 'dist/**'
    }
}

stage('Test') {
    parallel {
        stage('Unit Tests') {
            agent {
                label 'test-runner-1'
            }
            steps {
                unstash 'dist'
                sh 'npm test'
            }
        }

        stage('Integration Tests') {
            agent {
                label 'test-runner-2'
            }
            steps {
                unstash 'dist'
                sh 'npm run test:integration'
            }
        }
    }
}
```

### Workspace Cleanup

```groovy
options {
    skipDefaultCheckout()  // Don't checkout automatically
    buildDiscarder(logRotator(numToKeepStr: '10'))
}

stages {
    stage('Cleanup Workspace') {
        steps {
            cleanWs()
        }
    }

    stage('Checkout') {
        steps {
            checkout scm
        }
    }
}

post {
    always {
        cleanWs(deleteDirs: true, patterns: [
            [pattern: 'node_modules', type: 'INCLUDE'],
            [pattern: '.venv', type: 'INCLUDE'],
            [pattern: '**/*.pyc', type: 'INCLUDE']
        ])
    }
}
```

---

## Multi-Branch Pipelines

### Branch-Based Configuration

```groovy
pipeline {
    agent any

    environment {
        DEPLOY_ENV = "${getBranchEnvironment()}"
        AWS_REGION = 'us-east-1'
    }

    stages {
        stage('Environment Info') {
            steps {
                echo "Branch: ${env.BRANCH_NAME}"
                echo "Deploy Environment: ${env.DEPLOY_ENV}"
            }
        }

        stage('Build') {
            steps {
                sh 'npm ci && npm run build'
            }
        }

        stage('Test') {
            when {
                not { branch 'main' }
            }
            steps {
                sh 'npm test'
            }
        }

        stage('Deploy') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    branch 'staging'
                }
            }
            steps {
                script {
                    def config = getDeployConfig(env.DEPLOY_ENV)

                    sh """
                        aws s3 sync ./dist s3://${config.bucket}/ \\
                            --region ${AWS_REGION} \\
                            --delete

                        aws cloudfront create-invalidation \\
                            --distribution-id ${config.distributionId} \\
                            --paths '/*'
                    """
                }
            }
        }
    }
}

def getBranchEnvironment() {
    switch(env.BRANCH_NAME) {
        case 'main':
            return 'production'
        case 'staging':
            return 'staging'
        case 'develop':
            return 'development'
        default:
            return 'feature'
    }
}

def getDeployConfig(environment) {
    def configs = [
        production: [
            bucket: 'myapp-prod',
            distributionId: 'E1234567890ABC'
        ],
        staging: [
            bucket: 'myapp-staging',
            distributionId: 'E0987654321XYZ'
        ],
        development: [
            bucket: 'myapp-dev',
            distributionId: 'E1111111111AAA'
        ]
    ]

    return configs[environment]
}
```

### Pull Request Validation

```groovy
pipeline {
    agent any

    stages {
        stage('PR Validation') {
            when {
                changeRequest()
            }
            steps {
                script {
                    echo "Validating PR #${env.CHANGE_ID}"
                    echo "Target Branch: ${env.CHANGE_TARGET}"
                    echo "Source Branch: ${env.CHANGE_BRANCH}"

                    // Run comprehensive validation for PRs
                    sh '''
                        npm ci
                        npm run lint
                        npm run format:check
                        npm test -- --coverage
                        npm run build
                    '''
                }
            }
        }

        stage('Update PR Status') {
            when {
                changeRequest()
            }
            steps {
                script {
                    if (currentBuild.result == 'SUCCESS' || currentBuild.result == null) {
                        githubNotify(
                            status: 'SUCCESS',
                            context: 'continuous-integration/jenkins/pr-merge',
                            description: 'All checks passed'
                        )
                    } else {
                        githubNotify(
                            status: 'FAILURE',
                            context: 'continuous-integration/jenkins/pr-merge',
                            description: 'Some checks failed'
                        )
                    }
                }
            }
        }
    }
}
```

---

## Advanced Patterns

### Dynamic Pipeline Generation

```groovy
def services = ['frontend', 'backend', 'api-gateway']

pipeline {
    agent any

    stages {
        stage('Build All Services') {
            steps {
                script {
                    def buildStages = [:]

                    services.each { service ->
                        buildStages[service] = {
                            stage("Build ${service}") {
                                docker.build("${DOCKER_REGISTRY}/${service}:${GIT_COMMIT}", "./${service}")
                            }
                        }
                    }

                    parallel buildStages
                }
            }
        }
    }
}
```

### Scripted Pipeline with Advanced Logic

```groovy
node {
    def dockerImage
    def imageTag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"

    try {
        stage('Checkout') {
            checkout scm
        }

        stage('Determine Changes') {
            def changedFiles = sh(
                script: 'git diff --name-only HEAD~1',
                returnStdout: true
            ).trim().split('\n')

            env.FRONTEND_CHANGED = changedFiles.any { it.startsWith('frontend/') }
            env.BACKEND_CHANGED = changedFiles.any { it.startsWith('backend/') }

            echo "Frontend changed: ${env.FRONTEND_CHANGED}"
            echo "Backend changed: ${env.BACKEND_CHANGED}"
        }

        if (env.FRONTEND_CHANGED == 'true') {
            stage('Frontend Build') {
                dir('frontend') {
                    sh 'npm ci && npm run build'
                }
            }

            stage('Frontend Docker Build') {
                dockerImage = docker.build(
                    "${DOCKER_REGISTRY}/frontend:${imageTag}",
                    "./frontend"
                )
            }
        }

        if (env.BACKEND_CHANGED == 'true') {
            stage('Backend Build') {
                dir('backend') {
                    sh 'pip install -e .'
                    sh 'pytest tests/'
                }
            }

            stage('Backend Docker Build') {
                dockerImage = docker.build(
                    "${DOCKER_REGISTRY}/backend:${imageTag}",
                    "./backend"
                )
            }
        }

        if (env.FRONTEND_CHANGED == 'true' || env.BACKEND_CHANGED == 'true') {
            stage('Push Images') {
                docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                    dockerImage.push()
                    dockerImage.push('latest')
                }
            }
        } else {
            echo "No relevant changes detected, skipping build"
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

### Retry and Timeout Strategies

```groovy
pipeline {
    agent any

    stages {
        stage('Flaky Integration Test') {
            steps {
                retry(3) {
                    timeout(time: 5, unit: 'MINUTES') {
                        sh './run-integration-tests.sh'
                    }
                }
            }
        }

        stage('Deploy with Retry') {
            steps {
                script {
                    def maxRetries = 3
                    def retryDelay = 30  // seconds

                    for (int i = 1; i <= maxRetries; i++) {
                        try {
                            timeout(time: 10, unit: 'MINUTES') {
                                sh './deploy.sh'
                            }
                            break
                        } catch (Exception e) {
                            if (i == maxRetries) {
                                throw e
                            }
                            echo "Deploy failed (attempt ${i}/${maxRetries}), retrying in ${retryDelay} seconds..."
                            sleep retryDelay
                        }
                    }
                }
            }
        }
    }
}
```

### Feature Flag Integration

```groovy
pipeline {
    agent any

    environment {
        LAUNCH_DARKLY_KEY = credentials('launchdarkly-sdk-key')
    }

    stages {
        stage('Check Feature Flags') {
            steps {
                script {
                    def featureEnabled = sh(
                        script: """
                            curl -s -X GET "https://app.launchdarkly.com/api/v2/flags/default/canary-deployment" \\
                                -H "Authorization: ${LAUNCH_DARKLY_KEY}" \\
                                | jq -r '.environments.production.on'
                        """,
                        returnStdout: true
                    ).trim()

                    env.CANARY_ENABLED = featureEnabled
                    echo "Canary deployment enabled: ${env.CANARY_ENABLED}"
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    if (env.CANARY_ENABLED == 'true') {
                        echo "Using canary deployment strategy"
                        sh './deploy-canary.sh'
                    } else {
                        echo "Using standard deployment strategy"
                        sh './deploy-standard.sh'
                    }
                }
            }
        }
    }
}
```

---

## Best Practices Summary

### Pipeline Structure

1. **Use Declarative Syntax**: Unless you need complex scripting logic
2. **Define Agent Per Stage**: More flexible resource allocation
3. **Implement Timeouts**: Prevent resource exhaustion
4. **Use Parallel Execution**: Speed up builds
5. **Cleanup Workspaces**: Prevent disk space issues

### Security

1. **Never Hardcode Secrets**: Always use Jenkins credentials
2. **Use Credential Scoping**: Limit credential access by folder/job
3. **Scan Dependencies**: Integrate Snyk, Trivy, or similar tools
4. **Implement RBAC**: Use Jenkins role-based access control
5. **Audit Logs**: Enable and monitor Jenkins audit logs

### Performance

1. **Cache Dependencies**: Use stash/unstash or external caching
2. **Optimize Docker Builds**: Multi-stage builds, layer caching
3. **Limit Concurrent Builds**: Prevent resource contention
4. **Clean Old Builds**: Use build discarder
5. **Monitor Build Times**: Track and optimize slow stages

### Testing

1. **Run Tests in Parallel**: Speed up feedback loop
2. **Fail Fast**: Run quick tests first
3. **Publish Test Results**: Use JUnit plugin for visibility
4. **Track Coverage**: Publish coverage reports
5. **Separate Test Types**: Unit, integration, E2E in different stages

### Deployment

1. **Use Blue-Green or Canary**: Minimize downtime and risk
2. **Implement Health Checks**: Verify deployments before traffic switch
3. **Enable Rollback**: Automate rollback on failure
4. **Manual Approval for Prod**: Use input step for production deployments
5. **Notify on Deployment**: Slack, email, or other notifications

---

## Resources

- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)
- [Declarative Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Jenkins Shared Libraries](https://www.jenkins.io/doc/book/pipeline/shared-libraries/)
- [Pipeline Best Practices](https://www.jenkins.io/doc/book/pipeline/pipeline-best-practices/)
- [Jenkins Plugins Index](https://plugins.jenkins.io/)

---

**Next Steps:**

- Review the [GitHub Actions Guide](github_actions_guide.md) for alternative CI/CD platform
- See [GitLab CI Guide](gitlab_ci_guide.md) for GitLab-specific patterns
- Check [AI Validation Pipeline](ai_validation_pipeline.md) for AI-powered code review
