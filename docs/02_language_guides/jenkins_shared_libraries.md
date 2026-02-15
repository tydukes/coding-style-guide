---
title: "Jenkins Shared Libraries Style Guide"
description: "Standards for organizing, developing, and testing reusable Jenkins pipeline code"
author: "Tyler Dukes"
tags: [jenkins, groovy, shared-libraries, cicd, pipelines, automation, devops]
category: "Language Guides"
status: "active"
search_keywords: [jenkins, shared libraries, groovy, reusable, pipeline library, global vars]
---

## Overview

**Jenkins Shared Libraries** allow teams to share reusable pipeline code across multiple projects, reducing
duplication and ensuring consistent CI/CD practices. This guide covers organization, naming conventions,
parameter validation, error handling, testing, and versioning strategies.

### Key Characteristics

- **Purpose**: Share reusable pipeline steps and utilities across repositories
- **Language**: Groovy (runs in Jenkins Pipeline sandbox)
- **Location**: Separate repository configured in Jenkins global settings
- **Loading**: `@Library` annotation in Jenkinsfiles

### See Also

- [Jenkins & Groovy Style Guide](jenkins_groovy.md) - Pipeline fundamentals
- [GitHub Actions Guide](github_actions.md) - Alternative CI/CD platform

---

## Library Structure

### Standard Directory Layout

```text
jenkins-shared-library/
├── vars/                           # Global pipeline steps (most common)
│   ├── buildDockerImage.groovy     # Custom step: buildDockerImage()
│   ├── deployToKubernetes.groovy   # Custom step: deployToKubernetes()
│   ├── notifySlack.groovy          # Custom step: notifySlack()
│   ├── runTests.groovy             # Custom step: runTests()
│   └── validateConfig.groovy       # Custom step: validateConfig()
├── src/                            # Groovy classes (optional, for complex logic)
│   └── org/
│       └── company/
│           ├── Constants.groovy    # Shared constants
│           ├── Docker.groovy       # Docker utilities class
│           ├── Kubernetes.groovy   # Kubernetes utilities class
│           └── Utils.groovy        # General utilities
├── resources/                      # Static resources (templates, scripts)
│   ├── templates/
│   │   ├── Dockerfile.template     # Template files
│   │   └── k8s-deployment.yaml
│   └── scripts/
│       ├── health-check.sh         # Helper scripts
│       └── cleanup.sh
├── test/                           # Test files
│   └── groovy/
│       ├── BuildDockerImageTest.groovy
│       └── DeployToKubernetesTest.groovy
├── Jenkinsfile                     # Pipeline to test the library itself
├── build.gradle                    # Gradle build for testing
└── README.md                       # Library documentation
```

### Directory Purpose

```groovy
// vars/ - Global variables accessible directly in pipelines
// Usage in Jenkinsfile:
buildDockerImage(imageName: 'my-app', tag: 'latest')

// src/ - Groovy classes for complex logic
// Usage in Jenkinsfile:
import org.company.Docker
def docker = new Docker(this)
docker.build('my-app')

// resources/ - Static files loaded with libraryResource()
// Usage in Jenkinsfile:
def template = libraryResource('templates/Dockerfile.template')
```

---

## Global Variables (vars/)

### Basic Step Structure

```groovy
// vars/buildDockerImage.groovy
/**
 * Build and optionally push a Docker image.
 *
 * @param config Map with configuration options:
 *   - imageName (required): Name of the Docker image
 *   - tag (optional): Image tag (default: BUILD_NUMBER)
 *   - registry (optional): Docker registry URL
 *   - push (optional): Whether to push the image (default: false)
 *   - dockerfile (optional): Path to Dockerfile (default: 'Dockerfile')
 *   - context (optional): Build context path (default: '.')
 * @return String The full image name with tag
 *
 * @example
 *   buildDockerImage(imageName: 'my-app', tag: 'v1.0.0', push: true)
 */
def call(Map config) {
    // Parameter validation
    if (!config.imageName) {
        error 'imageName is required'
    }

    // Defaults
    def tag = config.tag ?: env.BUILD_NUMBER
    def registry = config.registry ?: ''
    def push = config.push ?: false
    def dockerfile = config.dockerfile ?: 'Dockerfile'
    def context = config.context ?: '.'

    // Build full image name
    def fullImageName = registry ? "${registry}/${config.imageName}:${tag}" : "${config.imageName}:${tag}"

    // Execute build
    stage('Build Docker Image') {
        echo "Building image: ${fullImageName}"
        sh "docker build -f ${dockerfile} -t ${fullImageName} ${context}"
    }

    // Optional push
    if (push) {
        stage('Push Docker Image') {
            if (registry) {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-registry-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin ${registry}"
                    sh "docker push ${fullImageName}"
                }
            } else {
                sh "docker push ${fullImageName}"
            }
        }
    }

    return fullImageName
}
```

### Step with Multiple Entry Points

```groovy
// vars/kubernetes.groovy
/**
 * Kubernetes deployment utilities.
 * Provides multiple methods for different operations.
 */

/**
 * Deploy an application to Kubernetes.
 *
 * @param config Map with deployment configuration:
 *   - namespace (required): Kubernetes namespace
 *   - deployment (required): Deployment name
 *   - image (required): Container image to deploy
 *   - replicas (optional): Number of replicas (default: 1)
 */
def deploy(Map config) {
    validateRequired(config, ['namespace', 'deployment', 'image'])

    def replicas = config.replicas ?: 1

    stage("Deploy to ${config.namespace}") {
        sh """
            kubectl set image deployment/${config.deployment} \
                ${config.deployment}=${config.image} \
                -n ${config.namespace}
            kubectl scale deployment/${config.deployment} \
                --replicas=${replicas} \
                -n ${config.namespace}
            kubectl rollout status deployment/${config.deployment} \
                -n ${config.namespace} \
                --timeout=300s
        """
    }
}

/**
 * Roll back a deployment to the previous version.
 *
 * @param config Map with rollback configuration:
 *   - namespace (required): Kubernetes namespace
 *   - deployment (required): Deployment name
 */
def rollback(Map config) {
    validateRequired(config, ['namespace', 'deployment'])

    stage("Rollback ${config.deployment}") {
        sh """
            kubectl rollout undo deployment/${config.deployment} \
                -n ${config.namespace}
            kubectl rollout status deployment/${config.deployment} \
                -n ${config.namespace} \
                --timeout=300s
        """
    }
}

/**
 * Delete a deployment.
 *
 * @param config Map with delete configuration:
 *   - namespace (required): Kubernetes namespace
 *   - deployment (required): Deployment name
 */
def delete(Map config) {
    validateRequired(config, ['namespace', 'deployment'])

    stage("Delete ${config.deployment}") {
        sh """
            kubectl delete deployment/${config.deployment} \
                -n ${config.namespace} \
                --ignore-not-found
        """
    }
}

/**
 * Get deployment status.
 *
 * @param config Map with status configuration
 * @return Map with deployment status information
 */
def status(Map config) {
    validateRequired(config, ['namespace', 'deployment'])

    def statusJson = sh(
        script: """
            kubectl get deployment/${config.deployment} \
                -n ${config.namespace} \
                -o json
        """,
        returnStdout: true
    ).trim()

    return readJSON(text: statusJson)
}

// Private helper method
private void validateRequired(Map config, List<String> required) {
    required.each { param ->
        if (!config[param]) {
            error "${param} is required"
        }
    }
}
```

### Usage in Jenkinsfile

```groovy
@Library('my-shared-library@v1.2.0') _

pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                // Call global variable function
                script {
                    def image = buildDockerImage(
                        imageName: 'my-app',
                        tag: env.GIT_COMMIT[0..7],
                        push: true,
                        registry: 'registry.example.com'
                    )
                    echo "Built image: ${image}"
                }
            }
        }

        stage('Deploy') {
            steps {
                // Call method on global variable
                kubernetes.deploy(
                    namespace: 'production',
                    deployment: 'my-app',
                    image: 'registry.example.com/my-app:latest',
                    replicas: 3
                )
            }
        }
    }

    post {
        failure {
            kubernetes.rollback(
                namespace: 'production',
                deployment: 'my-app'
            )
        }
    }
}
```

---

## Groovy Classes (src/)

### Utility Class Pattern

```groovy
// src/org/company/Docker.groovy
package org.company

/**
 * Docker utility class for advanced Docker operations.
 *
 * @module docker_utils
 * @description Provides Docker build, push, and management utilities
 * @version 1.0.0
 * @author Tyler Dukes
 */
class Docker implements Serializable {
    private def script
    private def registry
    private def credentialsId

    /**
     * Constructor for Docker utility class.
     *
     * @param script The pipeline script context (typically 'this')
     * @param registry Docker registry URL (optional)
     * @param credentialsId Jenkins credentials ID for registry auth
     */
    Docker(def script, String registry = '', String credentialsId = '') {
        this.script = script
        this.registry = registry
        this.credentialsId = credentialsId
    }

    /**
     * Build a Docker image with caching support.
     *
     * @param imageName Name of the image
     * @param tag Image tag
     * @param buildArgs Map of build arguments
     * @param cacheFrom Optional image to use as cache source
     * @return Full image name with tag
     */
    String build(String imageName, String tag = 'latest', Map buildArgs = [:], String cacheFrom = '') {
        def fullName = registry ? "${registry}/${imageName}:${tag}" : "${imageName}:${tag}"
        def buildArgsStr = buildArgs.collect { k, v -> "--build-arg ${k}=${v}" }.join(' ')
        def cacheFromStr = cacheFrom ? "--cache-from ${cacheFrom}" : ''

        script.sh """
            docker build \
                ${buildArgsStr} \
                ${cacheFromStr} \
                -t ${fullName} \
                .
        """

        return fullName
    }

    /**
     * Push an image to the registry.
     *
     * @param imageName Full image name with tag
     */
    void push(String imageName) {
        if (!registry) {
            script.error 'Registry must be configured for push operations'
        }

        if (credentialsId) {
            script.withCredentials([script.usernamePassword(
                credentialsId: credentialsId,
                usernameVariable: 'DOCKER_USER',
                passwordVariable: 'DOCKER_PASS'
            )]) {
                script.sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin ${registry}"
                script.sh "docker push ${imageName}"
            }
        } else {
            script.sh "docker push ${imageName}"
        }
    }

    /**
     * Build and push an image in one operation.
     *
     * @param imageName Name of the image
     * @param tag Image tag
     * @param buildArgs Map of build arguments
     * @return Full image name with tag
     */
    String buildAndPush(String imageName, String tag = 'latest', Map buildArgs = [:]) {
        def fullName = build(imageName, tag, buildArgs)
        push(fullName)
        return fullName
    }

    /**
     * Clean up local Docker images.
     *
     * @param imageName Optional image name pattern to clean
     */
    void cleanup(String imageName = '') {
        if (imageName) {
            script.sh "docker rmi \$(docker images ${imageName} -q) 2>/dev/null || true"
        } else {
            script.sh 'docker system prune -f'
        }
    }

    /**
     * Run security scan on an image.
     *
     * @param imageName Image to scan
     * @param failOnVulnerability Whether to fail on vulnerabilities
     * @return Map with scan results
     */
    Map securityScan(String imageName, boolean failOnVulnerability = false) {
        def severity = failOnVulnerability ? '--exit-code 1' : ''

        try {
            def output = script.sh(
                script: "trivy image ${severity} --format json ${imageName}",
                returnStdout: true
            )
            return script.readJSON(text: output)
        } catch (Exception e) {
            if (failOnVulnerability) {
                script.error "Security vulnerabilities found in ${imageName}"
            }
            return [vulnerabilities: [], error: e.message]
        }
    }
}
```

### Constants Class

```groovy
// src/org/company/Constants.groovy
package org.company

/**
 * Shared constants for pipeline configurations.
 *
 * @module constants
 * @description Central repository for shared constants
 * @version 1.0.0
 */
class Constants {
    // Environment names
    static final String ENV_DEV = 'development'
    static final String ENV_STAGING = 'staging'
    static final String ENV_PRODUCTION = 'production'

    // Environment list for iteration
    static final List<String> ENVIRONMENTS = [ENV_DEV, ENV_STAGING, ENV_PRODUCTION]

    // Kubernetes namespaces by environment
    static final Map<String, String> K8S_NAMESPACES = [
        (ENV_DEV): 'app-dev',
        (ENV_STAGING): 'app-staging',
        (ENV_PRODUCTION): 'app-prod'
    ]

    // Docker registries
    static final String DOCKER_REGISTRY_DEV = 'registry-dev.example.com'
    static final String DOCKER_REGISTRY_PROD = 'registry.example.com'

    // Timeouts (in minutes)
    static final int BUILD_TIMEOUT = 30
    static final int TEST_TIMEOUT = 60
    static final int DEPLOY_TIMEOUT = 15

    // Retry settings
    static final int DEFAULT_RETRIES = 3
    static final int RETRY_DELAY_SECONDS = 30

    // Notification channels
    static final Map<String, String> SLACK_CHANNELS = [
        (ENV_DEV): '#dev-builds',
        (ENV_STAGING): '#staging-builds',
        (ENV_PRODUCTION): '#prod-deploys'
    ]

    // Get registry for environment
    static String getRegistry(String environment) {
        return environment == ENV_PRODUCTION ? DOCKER_REGISTRY_PROD : DOCKER_REGISTRY_DEV
    }

    // Get namespace for environment
    static String getNamespace(String environment) {
        def namespace = K8S_NAMESPACES[environment]
        if (!namespace) {
            throw new IllegalArgumentException("Unknown environment: ${environment}")
        }
        return namespace
    }
}
```

### Using Classes in Pipeline

```groovy
@Library('my-shared-library@v1.2.0') _

import org.company.Docker
import org.company.Constants

pipeline {
    agent any

    options {
        timeout(time: Constants.BUILD_TIMEOUT, unit: 'MINUTES')
    }

    environment {
        DEPLOY_ENV = "${env.BRANCH_NAME == 'main' ? Constants.ENV_PRODUCTION : Constants.ENV_STAGING}"
    }

    stages {
        stage('Build') {
            steps {
                script {
                    def docker = new Docker(
                        this,
                        Constants.getRegistry(DEPLOY_ENV),
                        'docker-credentials'
                    )

                    def image = docker.buildAndPush(
                        'my-app',
                        env.BUILD_NUMBER,
                        [BUILD_DATE: new Date().format('yyyy-MM-dd')]
                    )

                    env.DOCKER_IMAGE = image
                }
            }
        }

        stage('Security Scan') {
            steps {
                script {
                    def docker = new Docker(this)
                    def results = docker.securityScan(
                        env.DOCKER_IMAGE,
                        DEPLOY_ENV == Constants.ENV_PRODUCTION
                    )

                    if (results.vulnerabilities) {
                        echo "Found ${results.vulnerabilities.size()} vulnerabilities"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                kubernetes.deploy(
                    namespace: Constants.getNamespace(DEPLOY_ENV),
                    deployment: 'my-app',
                    image: env.DOCKER_IMAGE
                )
            }
        }
    }
}
```

---

## Parameter Validation

### Comprehensive Validation Function

```groovy
// vars/validateConfig.groovy
/**
 * Validate configuration parameters with detailed error messages.
 *
 * @param config The configuration map to validate
 * @param schema The validation schema
 * @throws Error if validation fails
 *
 * @example
 *   validateConfig(
 *     [imageName: 'my-app', replicas: 3],
 *     [
 *       imageName: [required: true, type: 'string', pattern: /^[a-z][a-z0-9-]*$/],
 *       replicas: [required: false, type: 'integer', min: 1, max: 10, default: 1],
 *       environment: [required: true, type: 'enum', values: ['dev', 'staging', 'prod']]
 *     ]
 *   )
 */
def call(Map config, Map schema) {
    def errors = []
    def validated = [:]

    schema.each { paramName, rules ->
        def value = config[paramName]

        // Check required
        if (rules.required && value == null) {
            errors << "${paramName} is required"
            return
        }

        // Apply default if not provided
        if (value == null && rules.default != null) {
            validated[paramName] = rules.default
            return
        }

        // Skip validation if optional and not provided
        if (value == null) {
            return
        }

        // Type validation
        if (rules.type) {
            switch (rules.type) {
                case 'string':
                    if (!(value instanceof String)) {
                        errors << "${paramName} must be a string"
                    }
                    break
                case 'integer':
                    if (!(value instanceof Integer)) {
                        errors << "${paramName} must be an integer"
                    }
                    break
                case 'boolean':
                    if (!(value instanceof Boolean)) {
                        errors << "${paramName} must be a boolean"
                    }
                    break
                case 'list':
                    if (!(value instanceof List)) {
                        errors << "${paramName} must be a list"
                    }
                    break
                case 'map':
                    if (!(value instanceof Map)) {
                        errors << "${paramName} must be a map"
                    }
                    break
                case 'enum':
                    if (!rules.values?.contains(value)) {
                        errors << "${paramName} must be one of: ${rules.values.join(', ')}"
                    }
                    break
            }
        }

        // Pattern validation for strings
        if (rules.pattern && value instanceof String) {
            if (!(value ==~ rules.pattern)) {
                errors << "${paramName} does not match required pattern: ${rules.pattern}"
            }
        }

        // Range validation for numbers
        if (rules.min != null && value < rules.min) {
            errors << "${paramName} must be at least ${rules.min}"
        }
        if (rules.max != null && value > rules.max) {
            errors << "${paramName} must be at most ${rules.max}"
        }

        // Length validation for strings and lists
        if (rules.minLength != null && value.size() < rules.minLength) {
            errors << "${paramName} must have at least ${rules.minLength} items/characters"
        }
        if (rules.maxLength != null && value.size() > rules.maxLength) {
            errors << "${paramName} must have at most ${rules.maxLength} items/characters"
        }

        validated[paramName] = value
    }

    if (errors) {
        error "Configuration validation failed:\n  - ${errors.join('\n  - ')}"
    }

    return validated
}
```

### Using Validation in Steps

```groovy
// vars/deployApplication.groovy
/**
 * Deploy an application with comprehensive parameter validation.
 */
def call(Map config) {
    // Define validation schema
    def schema = [
        appName: [
            required: true,
            type: 'string',
            pattern: /^[a-z][a-z0-9-]{2,62}$/
        ],
        environment: [
            required: true,
            type: 'enum',
            values: ['dev', 'staging', 'production']
        ],
        version: [
            required: true,
            type: 'string',
            pattern: /^v?\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/
        ],
        replicas: [
            required: false,
            type: 'integer',
            min: 1,
            max: 100,
            default: 1
        ],
        resources: [
            required: false,
            type: 'map',
            default: [cpu: '100m', memory: '256Mi']
        ],
        healthCheckPath: [
            required: false,
            type: 'string',
            default: '/health'
        ],
        timeout: [
            required: false,
            type: 'integer',
            min: 30,
            max: 600,
            default: 300
        ]
    ]

    // Validate and get sanitized config
    def validatedConfig = validateConfig(config, schema)

    echo "Deploying ${validatedConfig.appName} v${validatedConfig.version} to ${validatedConfig.environment}"

    // Proceed with deployment using validated config
    stage("Deploy to ${validatedConfig.environment}") {
        timeout(time: validatedConfig.timeout, unit: 'SECONDS') {
            sh """
                kubectl set image deployment/${validatedConfig.appName} \
                    ${validatedConfig.appName}=registry.example.com/${validatedConfig.appName}:${validatedConfig.version} \
                    -n ${validatedConfig.environment}
                kubectl scale deployment/${validatedConfig.appName} \
                    --replicas=${validatedConfig.replicas} \
                    -n ${validatedConfig.environment}
            """
        }
    }

    return validatedConfig
}
```

### Environment-Specific Validation

```groovy
// vars/validateEnvironment.groovy
/**
 * Validate deployment configuration for specific environments.
 * Applies stricter rules for production.
 */
def call(Map config) {
    def environment = config.environment
    def errors = []

    // Base validation for all environments
    if (!config.appName) {
        errors << 'appName is required'
    }
    if (!config.version) {
        errors << 'version is required'
    }

    // Production-specific validation
    if (environment == 'production') {
        // Require semantic versioning for production
        if (config.version && !(config.version ==~ /^v?\d+\.\d+\.\d+$/)) {
            errors << 'Production deployments require semantic versioning (e.g., v1.2.3)'
        }

        // Minimum replicas for production
        if ((config.replicas ?: 1) < 2) {
            errors << 'Production deployments require at least 2 replicas'
        }

        // Require health check for production
        if (!config.healthCheckPath) {
            errors << 'Production deployments require a health check path'
        }

        // Require approval for production
        if (!config.approvedBy) {
            errors << 'Production deployments require approval (approvedBy parameter)'
        }

        // Check branch restriction
        if (env.BRANCH_NAME != 'main') {
            errors << 'Production deployments only allowed from main branch'
        }
    }

    // Staging-specific validation
    if (environment == 'staging') {
        // Warn about pre-release versions
        if (config.version?.contains('-')) {
            echo "WARNING: Deploying pre-release version ${config.version} to staging"
        }
    }

    if (errors) {
        error "Environment validation failed for ${environment}:\n  - ${errors.join('\n  - ')}"
    }

    return true
}
```

---

## Error Handling

### Comprehensive Error Handling Pattern

```groovy
// vars/safeExecute.groovy
/**
 * Execute a closure with comprehensive error handling.
 *
 * @param config Configuration map:
 *   - name: Name of the operation (for logging)
 *   - retries: Number of retry attempts (default: 0)
 *   - retryDelay: Delay between retries in seconds (default: 30)
 *   - failFast: Whether to fail immediately on error (default: true)
 *   - onError: Closure to execute on error
 *   - onSuccess: Closure to execute on success
 * @param body The closure to execute
 * @return Result of the closure execution
 */
def call(Map config = [:], Closure body) {
    def name = config.name ?: 'operation'
    def retries = config.retries ?: 0
    def retryDelay = config.retryDelay ?: 30
    def failFast = config.failFast != false
    def attempt = 0
    def lastError = null

    while (attempt <= retries) {
        attempt++
        try {
            echo "${name}: Attempt ${attempt}/${retries + 1}"
            def result = body()

            // Success callback
            if (config.onSuccess) {
                config.onSuccess(result)
            }

            return result

        } catch (org.jenkinsci.plugins.workflow.steps.FlowInterruptedException e) {
            // User aborted - don't retry
            echo "${name}: Aborted by user"
            throw e

        } catch (hudson.AbortException e) {
            // Pipeline aborted - don't retry
            echo "${name}: Pipeline aborted"
            throw e

        } catch (Exception e) {
            lastError = e
            echo "${name}: Failed - ${e.message}"

            // Error callback
            if (config.onError) {
                try {
                    config.onError(e, attempt)
                } catch (Exception callbackError) {
                    echo "Error in onError callback: ${callbackError.message}"
                }
            }

            if (attempt <= retries) {
                echo "${name}: Retrying in ${retryDelay} seconds..."
                sleep(retryDelay)
            }
        }
    }

    // All retries exhausted
    if (failFast) {
        error "${name}: Failed after ${attempt} attempts. Last error: ${lastError?.message}"
    } else {
        echo "${name}: Failed after ${attempt} attempts, continuing..."
        return null
    }
}
```

### Error Handling in Steps

```groovy
// vars/deployWithRollback.groovy
/**
 * Deploy with automatic rollback on failure.
 */
def call(Map config) {
    def previousVersion = null

    try {
        // Get current version for potential rollback
        previousVersion = getCurrentVersion(config)
        echo "Current version: ${previousVersion}"

        // Perform deployment
        safeExecute(
            name: "Deploy ${config.appName}",
            retries: 2,
            retryDelay: 60,
            onError: { error, attempt ->
                notifySlack(
                    channel: '#deployments',
                    message: "Deployment attempt ${attempt} failed: ${error.message}",
                    color: 'warning'
                )
            }
        ) {
            performDeployment(config)
        }

        // Verify deployment
        verifyDeployment(config)

        // Success notification
        notifySlack(
            channel: '#deployments',
            message: "Successfully deployed ${config.appName} v${config.version}",
            color: 'good'
        )

    } catch (Exception e) {
        echo "Deployment failed: ${e.message}"

        // Attempt rollback
        if (previousVersion && config.autoRollback != false) {
            echo "Rolling back to ${previousVersion}..."

            try {
                performRollback(config, previousVersion)
                notifySlack(
                    channel: '#deployments',
                    message: "Rolled back ${config.appName} to ${previousVersion} after failed deployment",
                    color: 'danger'
                )
            } catch (Exception rollbackError) {
                notifySlack(
                    channel: '#deployments',
                    message: "CRITICAL: Rollback failed for ${config.appName}! Manual intervention required.",
                    color: 'danger'
                )
                error "Deployment and rollback both failed: ${rollbackError.message}"
            }
        }

        throw e
    }
}

private def getCurrentVersion(Map config) {
    def output = sh(
        script: """
            kubectl get deployment/${config.appName} \
                -n ${config.namespace} \
                -o jsonpath='{.spec.template.spec.containers[0].image}'
        """,
        returnStdout: true
    ).trim()

    return output.split(':').last()
}

private void performDeployment(Map config) {
    sh """
        kubectl set image deployment/${config.appName} \
            ${config.appName}=${config.image} \
            -n ${config.namespace}
        kubectl rollout status deployment/${config.appName} \
            -n ${config.namespace} \
            --timeout=300s
    """
}

private void performRollback(Map config, String version) {
    sh """
        kubectl rollout undo deployment/${config.appName} \
            -n ${config.namespace}
        kubectl rollout status deployment/${config.appName} \
            -n ${config.namespace} \
            --timeout=300s
    """
}

private void verifyDeployment(Map config) {
    def healthCheckUrl = "http://${config.appName}.${config.namespace}.svc.cluster.local${config.healthCheckPath ?: '/health'}"

    safeExecute(
        name: 'Health Check',
        retries: 5,
        retryDelay: 10
    ) {
        sh "curl -f -s ${healthCheckUrl}"
    }
}
```

### Graceful Degradation

```groovy
// vars/withFallback.groovy
/**
 * Execute with fallback behavior.
 *
 * @param primary Primary closure to execute
 * @param fallback Fallback closure if primary fails
 * @param config Configuration options
 * @return Result from either primary or fallback
 */
def call(Map config = [:], Closure primary, Closure fallback) {
    try {
        return primary()
    } catch (Exception e) {
        echo "Primary operation failed: ${e.message}"

        if (config.notifyOnFallback) {
            notifySlack(
                channel: config.channel ?: '#alerts',
                message: "Using fallback for ${config.name ?: 'operation'}: ${e.message}",
                color: 'warning'
            )
        }

        return fallback()
    }
}

// Usage example
// vars/getArtifact.groovy
def call(Map config) {
    withFallback(
        name: 'Get Artifact',
        notifyOnFallback: true,
        channel: '#builds'
    ) {
        // Primary: Download from artifact repository
        sh "curl -f -O https://artifacts.example.com/${config.name}/${config.version}"
    } {
        // Fallback: Build from source
        echo "Artifact not found, building from source..."
        sh "make build"
    }
}
```

---

## Documentation Standards

### Step Documentation Template

```groovy
// vars/exampleStep.groovy
/**
 * Brief one-line description of what this step does.
 *
 * Extended description providing more context about the step's purpose,
 * when to use it, and any important considerations. This section should
 * help developers understand if this is the right step for their use case.
 *
 * @module example_step
 * @description Brief description for metadata
 * @version 1.0.0
 * @author Tyler Dukes
 * @since 2025-01-01
 *
 * @param config Map Configuration options for the step:
 *   @param config.requiredParam (required) Description of required parameter.
 *     Type: String
 *     Example: 'my-value'
 *   @param config.optionalParam (optional) Description of optional parameter.
 *     Type: Integer
 *     Default: 10
 *     Valid range: 1-100
 *   @param config.enumParam (required) Parameter with fixed values.
 *     Type: String
 *     Values: 'option1', 'option2', 'option3'
 *
 * @return Map Result containing:
 *   - success: Boolean indicating if operation succeeded
 *   - message: String with status message
 *   - data: Map with operation-specific data
 *
 * @throws ValidationError When required parameters are missing or invalid
 * @throws ExecutionError When the operation fails
 *
 * @example Basic usage
 *   exampleStep(
 *     requiredParam: 'my-value',
 *     enumParam: 'option1'
 *   )
 *
 * @example With all options
 *   def result = exampleStep(
 *     requiredParam: 'my-value',
 *     optionalParam: 50,
 *     enumParam: 'option2'
 *   )
 *   echo "Result: ${result.message}"
 *
 * @see relatedStep For related functionality
 * @see https://docs.example.com/steps/example More documentation
 */
def call(Map config) {
    // Implementation
}
```

### Class Documentation Template

```groovy
// src/org/company/ExampleClass.groovy
package org.company

/**
 * Brief description of the class purpose.
 *
 * Extended description explaining the class's role in the shared library,
 * typical use cases, and how it integrates with other components.
 *
 * <h3>Usage Example</h3>
 * <pre>
 * {@code
 * def example = new ExampleClass(this, 'config-value')
 * example.performAction()
 * }
 * </pre>
 *
 * <h3>Thread Safety</h3>
 * This class is thread-safe / not thread-safe.
 *
 * @module example_class
 * @description Brief description for metadata
 * @version 1.0.0
 * @author Tyler Dukes
 * @since 2025-01-01
 */
class ExampleClass implements Serializable {
    private static final long serialVersionUID = 1L

    /** The pipeline script context */
    private final def script

    /** Configuration value */
    private final String configValue

    /**
     * Creates a new ExampleClass instance.
     *
     * @param script The pipeline script context (typically 'this')
     * @param configValue Configuration value for the instance
     * @throws IllegalArgumentException if configValue is null or empty
     */
    ExampleClass(def script, String configValue) {
        if (!configValue) {
            throw new IllegalArgumentException('configValue cannot be null or empty')
        }
        this.script = script
        this.configValue = configValue
    }

    /**
     * Performs the main action of this class.
     *
     * Detailed description of what this method does, any side effects,
     * and important considerations.
     *
     * @param input The input to process
     * @return Processed result
     * @throws ProcessingException if processing fails
     */
    String performAction(String input) {
        // Implementation
    }
}
```

### README Documentation

````markdown
<!-- README.md at repository root -->
# My Jenkins Shared Library

Reusable pipeline code for CI/CD automation.

## Installation

### Global Configuration

1. Navigate to **Manage Jenkins** > **Configure System**
2. Scroll to **Global Pipeline Libraries**
3. Add new library:
   - **Name**: `my-shared-library`
   - **Default version**: `main`
   - **Retrieval method**: Modern SCM
   - **Source Code Management**: Git
   - **Project Repository**: `https://github.com/company/jenkins-shared-library.git`

### Per-Pipeline Usage

```groovy
@Library('my-shared-library@v1.2.0') _
```

## Available Steps

| Step | Description | Example |
|------|-------------|---------|
| `buildDockerImage` | Build Docker images | `buildDockerImage(imageName: 'app')` |
| `deployToKubernetes` | Deploy to K8s | `deployToKubernetes(namespace: 'prod')` |
| `notifySlack` | Send Slack notification | `notifySlack(channel: '#builds')` |

## Quick Start

```groovy
@Library('my-shared-library@v1.2.0') _

pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                buildDockerImage(
                    imageName: 'my-app',
                    push: true
                )
            }
        }
    }
}
```

## Contributing

See CONTRIBUTING.md for development guidelines.
````

---

## Testing

### Test Setup with Gradle

```groovy
// build.gradle
plugins {
    id 'groovy'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.codehaus.groovy:groovy-all:3.0.19'

    testImplementation 'com.lesfurets:jenkins-pipeline-unit:1.19'
    testImplementation 'org.spockframework:spock-core:2.4-M1-groovy-3.0'
    testImplementation 'junit:junit:4.13.2'
}

sourceSets {
    main {
        groovy {
            srcDirs = ['src', 'vars']
        }
    }
    test {
        groovy {
            srcDirs = ['test/groovy']
        }
    }
}

test {
    useJUnitPlatform()
    testLogging {
        events 'passed', 'skipped', 'failed'
    }
}
```

### Unit Testing with Spock

```groovy
// test/groovy/BuildDockerImageTest.groovy
import spock.lang.Specification
import com.lesfurets.jenkins.unit.BasePipelineTest

class BuildDockerImageTest extends BasePipelineTest {

    def script

    def setup() {
        super.setUp()

        // Load the shared library step
        script = loadScript('vars/buildDockerImage.groovy')

        // Register mock methods
        helper.registerAllowedMethod('stage', [String, Closure], { name, body ->
            body()
        })

        helper.registerAllowedMethod('echo', [String], { msg ->
            println "[ECHO] ${msg}"
        })

        helper.registerAllowedMethod('sh', [String], { cmd ->
            println "[SH] ${cmd}"
            return 0
        })

        helper.registerAllowedMethod('withCredentials', [List, Closure], { creds, body ->
            body()
        })
    }

    def 'should fail when imageName is not provided'() {
        when:
            script.call([:])

        then:
            def e = thrown(Exception)
            e.message.contains('imageName is required')
    }

    def 'should build image with default tag'() {
        given:
            binding.setVariable('env', [BUILD_NUMBER: '42'])

        when:
            def result = script.call([imageName: 'my-app'])

        then:
            result == 'my-app:42'
    }

    def 'should build image with custom tag'() {
        when:
            def result = script.call([
                imageName: 'my-app',
                tag: 'v1.0.0'
            ])

        then:
            result == 'my-app:v1.0.0'
    }

    def 'should build image with registry'() {
        when:
            def result = script.call([
                imageName: 'my-app',
                tag: 'latest',
                registry: 'registry.example.com'
            ])

        then:
            result == 'registry.example.com/my-app:latest'
    }

    def 'should push image when push is true'() {
        given:
            def commands = []
            helper.registerAllowedMethod('sh', [String], { cmd ->
                commands << cmd
                return 0
            })

        when:
            script.call([
                imageName: 'my-app',
                tag: 'latest',
                push: true
            ])

        then:
            commands.any { it.contains('docker push') }
    }
}
```

### Testing Classes

```groovy
// test/groovy/DockerTest.groovy
import spock.lang.Specification
import org.company.Docker

class DockerTest extends Specification {

    def script
    def commandsExecuted

    def setup() {
        commandsExecuted = []

        // Create mock script context
        script = [
            sh: { cmd ->
                if (cmd instanceof Map) {
                    commandsExecuted << cmd.script
                    return cmd.returnStdout ? '{"vulnerabilities": []}' : 0
                }
                commandsExecuted << cmd
                return 0
            },
            error: { msg -> throw new RuntimeException(msg) },
            withCredentials: { creds, body -> body() },
            readJSON: { args -> return [vulnerabilities: []] },
            usernamePassword: { args -> return args }
        ]
    }

    def 'should build image with default settings'() {
        given:
            def docker = new Docker(script)

        when:
            def result = docker.build('my-app')

        then:
            result == 'my-app:latest'
            commandsExecuted.any { it.contains('docker build') }
    }

    def 'should build image with registry'() {
        given:
            def docker = new Docker(script, 'registry.example.com')

        when:
            def result = docker.build('my-app', 'v1.0.0')

        then:
            result == 'registry.example.com/my-app:v1.0.0'
    }

    def 'should include build args'() {
        given:
            def docker = new Docker(script)

        when:
            docker.build('my-app', 'latest', [
                BUILD_DATE: '2025-01-01',
                VERSION: '1.0.0'
            ])

        then:
            commandsExecuted.any {
                it.contains('--build-arg BUILD_DATE=2025-01-01') &&
                it.contains('--build-arg VERSION=1.0.0')
            }
    }

    def 'should fail push without registry'() {
        given:
            def docker = new Docker(script)

        when:
            docker.push('my-app:latest')

        then:
            thrown(RuntimeException)
    }
}
```

### Integration Testing

```groovy
// test/integration/Jenkinsfile.test
@Library('my-shared-library') _

pipeline {
    agent any

    options {
        skipDefaultCheckout()
        timeout(time: 10, unit: 'MINUTES')
    }

    stages {
        stage('Test buildDockerImage') {
            steps {
                script {
                    // Create test Dockerfile
                    writeFile file: 'Dockerfile', text: '''
                        FROM alpine:3.19
                        RUN echo "test"
                    '''

                    // Test the shared library step
                    def image = buildDockerImage(
                        imageName: 'test-image',
                        tag: 'integration-test',
                        push: false
                    )

                    assert image == 'test-image:integration-test'
                }
            }
        }

        stage('Test validateConfig') {
            steps {
                script {
                    // Test valid config
                    def config = validateConfig(
                        [name: 'test', count: 5],
                        [
                            name: [required: true, type: 'string'],
                            count: [required: false, type: 'integer', default: 1]
                        ]
                    )
                    assert config.name == 'test'
                    assert config.count == 5

                    // Test default values
                    def configWithDefaults = validateConfig(
                        [name: 'test'],
                        [
                            name: [required: true, type: 'string'],
                            count: [required: false, type: 'integer', default: 10]
                        ]
                    )
                    assert configWithDefaults.count == 10
                }
            }
        }

        stage('Test error handling') {
            steps {
                script {
                    def attempts = 0

                    safeExecute(
                        name: 'Retry Test',
                        retries: 2,
                        retryDelay: 1
                    ) {
                        attempts++
                        if (attempts < 3) {
                            throw new Exception("Attempt ${attempts} failed")
                        }
                        return 'success'
                    }

                    assert attempts == 3
                }
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

### CI Pipeline for Library

```groovy
// Jenkinsfile (for the shared library repository itself)
pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Lint') {
            steps {
                sh 'npm install -g npm-groovy-lint'
                sh 'npm-groovy-lint --path . --format json --output lint-report.json || true'
                archiveArtifacts artifacts: 'lint-report.json', allowEmptyArchive: true
            }
        }

        stage('Unit Tests') {
            steps {
                sh './gradlew test'
            }
            post {
                always {
                    junit 'build/test-results/**/*.xml'
                }
            }
        }

        stage('Integration Tests') {
            when {
                branch 'main'
            }
            steps {
                build job: 'shared-library-integration-tests',
                    parameters: [
                        string(name: 'LIBRARY_BRANCH', value: env.GIT_COMMIT)
                    ]
            }
        }

        stage('Documentation') {
            steps {
                sh './gradlew groovydoc'
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'build/docs/groovydoc',
                    reportFiles: 'index.html',
                    reportName: 'Groovy Documentation'
                ])
            }
        }
    }

    post {
        success {
            script {
                if (env.TAG_NAME) {
                    echo "New version released: ${env.TAG_NAME}"
                }
            }
        }
        failure {
            emailext(
                subject: "Shared Library Build Failed: ${env.JOB_NAME}",
                body: "Build ${env.BUILD_NUMBER} failed. Check console output.",
                recipientProviders: [developers()]
            )
        }
    }
}
```

---

## Versioning and Release

### Semantic Versioning

```groovy
// vars/libraryVersion.groovy
/**
 * Get the current library version.
 * Uses Git tags for versioning.
 */
@NonCPS
def call() {
    def tag = sh(
        script: 'git describe --tags --abbrev=0 2>/dev/null || echo "0.0.0"',
        returnStdout: true
    ).trim()

    return tag.replaceFirst('^v', '')
}

/**
 * Check if running a specific minimum version.
 */
def isMinimumVersion(String required) {
    def current = call()
    return compareVersions(current, required) >= 0
}

@NonCPS
private int compareVersions(String v1, String v2) {
    def parts1 = v1.tokenize('.').collect { it.toInteger() }
    def parts2 = v2.tokenize('.').collect { it.toInteger() }

    for (int i = 0; i < Math.max(parts1.size(), parts2.size()); i++) {
        def p1 = i < parts1.size() ? parts1[i] : 0
        def p2 = i < parts2.size() ? parts2[i] : 0

        if (p1 != p2) {
            return p1 <=> p2
        }
    }

    return 0
}
```

### Loading Specific Versions

```groovy
// Using exact version tag
@Library('my-shared-library@v1.2.3') _

// Using branch
@Library('my-shared-library@main') _

// Using commit SHA
@Library('my-shared-library@abc123def') _

// Multiple libraries
@Library(['my-shared-library@v1.2.3', 'other-library@v2.0.0']) _

// Dynamic version loading
library identifier: "my-shared-library@${params.LIBRARY_VERSION}",
        retriever: modernSCM([
            $class: 'GitSCMSource',
            remote: 'https://github.com/company/jenkins-shared-library.git'
        ])
```

### Version Compatibility

```groovy
// vars/requireVersion.groovy
/**
 * Ensure minimum library version is loaded.
 */
def call(String minVersion) {
    def currentVersion = libraryVersion()

    if (!libraryVersion.isMinimumVersion(minVersion)) {
        error """
            This pipeline requires shared library version ${minVersion} or higher.
            Current version: ${currentVersion}

            Update your @Library annotation:
            @Library('my-shared-library@v${minVersion}') _
        """
    }

    echo "Using shared library version ${currentVersion}"
}

// Usage in Jenkinsfile
@Library('my-shared-library@v1.2.0') _

pipeline {
    agent any
    stages {
        stage('Check Version') {
            steps {
                requireVersion('1.2.0')
            }
        }
    }
}
```

### Changelog Management

```groovy
// vars/generateChangelog.groovy
/**
 * Generate changelog from Git commits.
 */
def call(String fromTag = '', String toTag = 'HEAD') {
    def from = fromTag ?: sh(
        script: 'git describe --tags --abbrev=0 HEAD^ 2>/dev/null || git rev-list --max-parents=0 HEAD',
        returnStdout: true
    ).trim()

    def log = sh(
        script: """
            git log ${from}..${toTag} \
                --pretty=format:'- %s (%an)' \
                --no-merges
        """,
        returnStdout: true
    ).trim()

    return """
## Changes since ${from}

${log}

## Upgrade Instructions

Update your Jenkinsfile:
  @Library('my-shared-library@${toTag}') _
"""
}

```

---

## Loading Libraries

### Global Configuration

```groovy
// Configure in Jenkins: Manage Jenkins > Configure System > Global Pipeline Libraries
// Or using Jenkins Configuration as Code (JCasC):

// jenkins.yaml
unclassified:
  globalLibraries:
    libraries:
      - name: 'my-shared-library'
        defaultVersion: 'main'
        implicit: false
        allowVersionOverride: true
        includeInChangesets: true
        retriever:
          modernSCM:
            scm:
              git:
                remote: 'https://github.com/company/jenkins-shared-library.git'
                credentialsId: 'github-token'
                traits:
                  - gitBranchDiscovery
                  - gitTagDiscovery
```

### Dynamic Library Loading

```groovy
// vars/loadSharedLib.groovy
/**
 * Dynamically load a shared library.
 *
 * @param name Library name
 * @param version Version to load
 * @param repo Repository URL (optional, uses global config if not provided)
 */
def call(Map config) {
    def name = config.name
    def version = config.version ?: 'main'
    def repo = config.repo

    if (repo) {
        library identifier: "${name}@${version}",
                retriever: modernSCM([
                    $class: 'GitSCMSource',
                    remote: repo,
                    credentialsId: config.credentialsId
                ])
    } else {
        library "${name}@${version}"
    }

    echo "Loaded ${name}@${version}"
}

// Usage in Jenkinsfile
pipeline {
    agent any
    stages {
        stage('Setup') {
            steps {
                script {
                    // Load library dynamically based on environment
                    def libVersion = env.BRANCH_NAME == 'main' ? 'v1.2.0' : 'develop'
                    loadSharedLib(
                        name: 'my-shared-library',
                        version: libVersion
                    )
                }
            }
        }
    }
}
```

### Multiple Libraries

```groovy
// Loading multiple libraries with explicit names
@Library([
    'my-shared-library@v1.2.0',
    'common-steps@v2.0.0',
    'notification-library@v1.0.0'
]) _

// With aliasing to avoid conflicts
@Library('my-shared-library@v1.2.0')
import org.company.Docker as MyDocker

@Library('other-library@v1.0.0')
import org.other.Docker as OtherDocker

pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                script {
                    def myDocker = new MyDocker(this)
                    def otherDocker = new OtherDocker(this)
                }
            }
        }
    }
}
```

### Folder-Level Libraries

```groovy
// Configure library at folder level in Jenkins UI
// Properties > Pipeline Libraries

// Or using JCasC:
jobs:
  - script: |
      folder('my-team') {
        properties {
          folderLibraries {
            libraries {
              libraryConfiguration {
                name 'team-library'
                defaultVersion 'main'
                implicit true
                retriever {
                  modernSCM {
                    scm {
                      git {
                        remote 'https://github.com/team/shared-library.git'
                        credentialsId 'github-token'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
```

---

## Common Patterns

### Pipeline Template Pattern

```groovy
// vars/standardPipeline.groovy
/**
 * Standard pipeline template for microservices.
 * Provides consistent CI/CD workflow across all services.
 */
def call(Map config, Closure body = null) {
    // Validate configuration
    validateConfig(config, [
        appName: [required: true, type: 'string'],
        language: [required: true, type: 'enum', values: ['java', 'python', 'node', 'go']],
        deployEnvironments: [required: false, type: 'list', default: ['dev', 'staging', 'prod']]
    ])

    pipeline {
        agent any

        options {
            buildDiscarder(logRotator(numToKeepStr: '20'))
            timestamps()
            timeout(time: 60, unit: 'MINUTES')
            disableConcurrentBuilds()
        }

        environment {
            APP_NAME = "${config.appName}"
            DOCKER_REGISTRY = 'registry.example.com'
        }

        stages {
            stage('Checkout') {
                steps {
                    checkout scm
                }
            }

            stage('Build') {
                steps {
                    script {
                        buildForLanguage(config.language)
                    }
                }
            }

            stage('Test') {
                steps {
                    script {
                        testForLanguage(config.language)
                    }
                }
                post {
                    always {
                        publishTestResults(config.language)
                    }
                }
            }

            stage('Security Scan') {
                steps {
                    securityScan(appName: config.appName)
                }
            }

            stage('Build Image') {
                steps {
                    script {
                        env.DOCKER_IMAGE = buildDockerImage(
                            imageName: config.appName,
                            push: true
                        )
                    }
                }
            }

            stage('Deploy') {
                when {
                    anyOf {
                        branch 'main'
                        branch 'develop'
                        buildingTag()
                    }
                }
                steps {
                    script {
                        def environment = determineEnvironment()
                        deployToKubernetes(
                            namespace: environment,
                            deployment: config.appName,
                            image: env.DOCKER_IMAGE
                        )
                    }
                }
            }

            stage('Custom Steps') {
                when {
                    expression { body != null }
                }
                steps {
                    script {
                        body()
                    }
                }
            }
        }

        post {
            success {
                notifySlack(
                    channel: '#builds',
                    message: "Build succeeded: ${config.appName} #${env.BUILD_NUMBER}",
                    color: 'good'
                )
            }
            failure {
                notifySlack(
                    channel: '#builds',
                    message: "Build failed: ${config.appName} #${env.BUILD_NUMBER}",
                    color: 'danger'
                )
            }
            always {
                cleanWs()
            }
        }
    }
}

private void buildForLanguage(String language) {
    switch (language) {
        case 'java':
            sh './gradlew build -x test'
            break
        case 'python':
            sh 'pip install -e . && python -m build'
            break
        case 'node':
            sh 'npm ci && npm run build'
            break
        case 'go':
            sh 'go build ./...'
            break
    }
}

private void testForLanguage(String language) {
    switch (language) {
        case 'java':
            sh './gradlew test'
            break
        case 'python':
            sh 'pytest --junitxml=test-results.xml'
            break
        case 'node':
            sh 'npm test'
            break
        case 'go':
            sh 'go test -v ./... -coverprofile=coverage.out'
            break
    }
}

private String determineEnvironment() {
    if (env.TAG_NAME) {
        return 'production'
    } else if (env.BRANCH_NAME == 'main') {
        return 'staging'
    } else {
        return 'development'
    }
}
```

### Usage of Pipeline Template

```groovy
// Jenkinsfile in application repository
@Library('my-shared-library@v1.2.0') _

standardPipeline(
    appName: 'user-service',
    language: 'java',
    deployEnvironments: ['dev', 'staging', 'prod']
) {
    // Optional custom steps
    stage('Database Migration') {
        sh './gradlew flywayMigrate'
    }
}
```

### Decorator Pattern

```groovy
// vars/withStandardOptions.groovy
/**
 * Wrap a closure with standard pipeline options.
 */
def call(Map config = [:], Closure body) {
    def buildTimeout = config.timeout ?: 60

    timestamps {
        timeout(time: buildTimeout, unit: 'MINUTES') {
            ansiColor('xterm') {
                body()
            }
        }
    }
}

// vars/withNotifications.groovy
/**
 * Wrap a closure with start/end notifications.
 */
def call(Map config, Closure body) {
    def channel = config.channel ?: '#builds'
    def startMessage = config.startMessage ?: "Build started: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
    def successMessage = config.successMessage ?: "Build succeeded: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
    def failureMessage = config.failureMessage ?: "Build failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"

    try {
        notifySlack(channel: channel, message: startMessage, color: '#439FE0')
        body()
        notifySlack(channel: channel, message: successMessage, color: 'good')
    } catch (Exception e) {
        notifySlack(channel: channel, message: failureMessage, color: 'danger')
        throw e
    }
}

// Usage
withStandardOptions(timeout: 30) {
    withNotifications(channel: '#deployments') {
        // Pipeline logic here
    }
}
```

---

## Anti-Patterns

### ❌ Avoid: Hardcoded Values

```groovy
// Bad - Hardcoded values in shared library
def call(Map config) {
    sh 'docker push registry.company.com/app:latest'  // ❌ Hardcoded registry
    sh 'kubectl apply -f deployment.yaml -n production'  // ❌ Hardcoded namespace
}

// Good - Parameterized and configurable
def call(Map config) {
    def registry = config.registry ?: env.DOCKER_REGISTRY
    def namespace = config.namespace

    if (!registry) {
        error 'Registry must be provided or set in DOCKER_REGISTRY environment variable'
    }
    if (!namespace) {
        error 'namespace is required'
    }

    sh "docker push ${registry}/${config.imageName}:${config.tag}"
    sh "kubectl apply -f deployment.yaml -n ${namespace}"
}
```

### ❌ Avoid: No Error Context

```groovy
// Bad - Generic error with no context
def call(Map config) {
    if (!config.appName) {
        error 'Invalid configuration'  // ❌ What's invalid?
    }
}

// Good - Specific error with context
def call(Map config) {
    if (!config.appName) {
        error """
            Configuration error in deployApplication step:
            - appName is required but was not provided

            Example usage:
            deployApplication(
                appName: 'my-app',
                environment: 'staging'
            )
        """
    }
}
```

### ❌ Avoid: Blocking Operations Without Timeout

```groovy
// Bad - No timeout on blocking operation
def call(Map config) {
    sh 'kubectl rollout status deployment/app'  // ❌ Can hang forever
}

// Good - Timeout on all blocking operations
def call(Map config) {
    def timeoutSeconds = config.timeout ?: 300

    timeout(time: timeoutSeconds, unit: 'SECONDS') {
        sh """
            kubectl rollout status deployment/${config.appName} \
                -n ${config.namespace} \
                --timeout=${timeoutSeconds}s
        """
    }
}
```

### ❌ Avoid: Swallowing Exceptions

```groovy
// Bad - Silent failure
def call(Map config) {
    try {
        sh 'make deploy'
    } catch (Exception e) {
        echo 'Deployment failed'  // ❌ Continues as if nothing happened
    }
}

// Good - Proper error handling
def call(Map config) {
    try {
        sh 'make deploy'
    } catch (Exception e) {
        echo "Deployment failed: ${e.message}"

        // Attempt cleanup
        try {
            sh 'make rollback'
        } catch (Exception rollbackError) {
            echo "Rollback also failed: ${rollbackError.message}"
        }

        // Re-throw to fail the build
        throw e
    }
}
```

### ❌ Avoid: Global State Modification

```groovy
// Bad - Modifying global state
class DeploymentHelper {
    static String lastDeployedVersion  // ❌ Global mutable state

    def call(Map config) {
        // ...
        lastDeployedVersion = config.version  // ❌ Race condition risk
    }
}

// Good - Return values and pass state explicitly
def call(Map config) {
    def result = performDeployment(config)
    return [
        version: config.version,
        timestamp: new Date(),
        status: result.status
    ]
}
```

### ❌ Avoid: Missing Serializable

```groovy
// Bad - Class not serializable (will fail on Jenkins restart)
class DeploymentConfig {  // ❌ Missing implements Serializable
    String appName
    String version
}

// Good - Properly serializable
class DeploymentConfig implements Serializable {
    private static final long serialVersionUID = 1L

    String appName
    String version
}
```

---

## Security Considerations

### Credential Handling

```groovy
// vars/secureCredentials.groovy
/**
 * Securely handle credentials with minimal exposure.
 */
def call(String credentialsId, Closure body) {
    // Validate credentials exist before use
    def creds = com.cloudbees.plugins.credentials.CredentialsProvider.lookupCredentials(
        com.cloudbees.plugins.credentials.common.StandardCredentials.class,
        Jenkins.instance,
        null,
        null
    ).find { it.id == credentialsId }

    if (!creds) {
        error "Credentials '${credentialsId}' not found. Please configure in Jenkins Credentials."
    }

    // Use withCredentials for minimal exposure
    withCredentials([usernamePassword(
        credentialsId: credentialsId,
        usernameVariable: 'CRED_USER',
        passwordVariable: 'CRED_PASS'
    )]) {
        // Credentials only available in this scope
        body()
    }

    // Credentials automatically cleared after scope
}
```

### Input Sanitization

```groovy
// vars/sanitizeInput.groovy
/**
 * Sanitize user inputs to prevent injection attacks.
 */
def call(String input, String type = 'general') {
    if (input == null) {
        return null
    }

    switch (type) {
        case 'shell':
            // Escape shell metacharacters
            return input.replaceAll(/[;&|`\$\(\)\{\}\[\]<>\\!"']/, '\\\\$0')

        case 'docker':
            // Only allow safe characters in Docker image names
            if (!(input ==~ /^[a-z0-9][a-z0-9._-]*[a-z0-9]$/)) {
                error "Invalid Docker image name: ${input}"
            }
            return input

        case 'kubernetes':
            // Only allow DNS-compatible names
            if (!(input ==~ /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/)) {
                error "Invalid Kubernetes resource name: ${input}"
            }
            return input

        default:
            // Remove potentially dangerous characters
            return input.replaceAll(/[<>&;|`]/, '')
    }
}

// Usage
def call(Map config) {
    def safeName = sanitizeInput(config.appName, 'kubernetes')
    sh "kubectl get deployment ${safeName}"
}
```

---

## References

### Official Documentation

- [Jenkins Shared Libraries](https://www.jenkins.io/doc/book/pipeline/shared-libraries/)
- [Pipeline Syntax Reference](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Pipeline Best Practices](https://www.jenkins.io/doc/book/pipeline/pipeline-best-practices/)

### Testing Resources

- [Jenkins Pipeline Unit](https://github.com/jenkinsci/JenkinsPipelineUnit)
- [Spock Framework](https://spockframework.org/)
- [Groovy Testing Guide](https://groovy-lang.org/testing.html)

### Tools

- [npm-groovy-lint](https://github.com/nvuillam/npm-groovy-lint)
- [Jenkins Configuration as Code](https://www.jenkins.io/projects/jcasc/)

### Related Guides

- [Jenkins & Groovy Style Guide](jenkins_groovy.md)
- [GitHub Actions Guide](github_actions.md)
- [GitLab CI Guide](gitlab_ci.md)

---

**Maintainer**: Tyler Dukes
