---
title: "AWS CDK Style Guide"
description: "AWS Cloud Development Kit standards for infrastructure as code with TypeScript"
author: "Tyler Dukes"
date: "2025-10-28"
tags: [aws-cdk, cdk, aws, infrastructure, typescript, iac]
category: "Language Guides"
status: "active"
version: "1.0.0"
---

## Language Overview

**AWS Cloud Development Kit (CDK)** is an infrastructure as code framework that lets you define cloud resources using
familiar programming languages. This guide focuses on TypeScript CDK, covering best practices for creating
maintainable, reusable infrastructure code.

### Key Characteristics

- **Languages**: TypeScript (preferred), Python, Java, C#, Go
- **Primary Use**: Infrastructure as code on AWS
- **Key Concepts**: Apps, Stacks, Constructs, Props
- **Version**: CDK v2 (recommended)

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Naming** | | | |
| Apps | `PascalCase` | `MyInfraApp` | CDK application class |
| Stacks | `PascalCase` | `VpcStack`, `DatabaseStack` | Stack class names |
| Constructs | `PascalCase` | `ApiGateway`, `LambdaFunction` | Custom construct classes |
| Props Interfaces | `PascalCaseProps` | `VpcStackProps`, `ApiProps` | Props interface suffix |
| Resources | `camelCase` | `myBucket`, `userTable` | Resource variables |
| **File Naming** | | | |
| App Entry | `bin/app-name.ts` | `bin/my-app.ts` | Application entry point |
| Stacks | `lib/stack-name-stack.ts` | `lib/vpc-stack.ts` | Stack definitions |
| Constructs | `lib/construct-name.ts` | `lib/api-gateway.ts` | Reusable constructs |
| **Key Concepts** | | | |
| App | Top-level container | `new cdk.App()` | CDK application |
| Stack | Deployment unit | `new cdk.Stack(app, 'MyStack')` | CloudFormation stack |
| Construct | Reusable component | Custom infrastructure patterns | Building blocks |
| Props | Configuration | Interfaces for construct config | Type-safe configuration |
| **Best Practices** | | | |
| CDK v2 | Use CDK v2 | `aws-cdk-lib` | Single package |
| TypeScript | Preferred language | Type safety, IDE support | Better developer experience |
| Constructs | L3 > L2 > L1 | Use higher-level constructs | Opinionated patterns |
| Environment | Pass explicitly | `env: { account, region }` | Avoid implicit environments |
| Props | Required vs optional | Use TypeScript optionals | Clear interfaces |
| **Common Patterns** | | | |
| Stacks | One stack per env | `VpcStack`, `AppStack` | Logical separation |
| Cross-Stack Refs | Export/import | `stack.export()` | Share resources |
| Context | Use cdk.json | Configuration values | Environment-specific config |

---

## Project Structure

### Basic CDK Project

```text
my-cdk-app/
├── bin/
│   └── my-cdk-app.ts          # App entry point
├── lib/
│   ├── my-cdk-app-stack.ts    # Stack definitions
│   ├── constructs/             # Custom constructs
│   │   ├── api-construct.ts
│   │   └── database-construct.ts
│   └── config/                 # Configuration
│       ├── dev.ts
│       └── prod.ts
├── test/
│   └── my-cdk-app.test.ts     # Tests
├── cdk.json                    # CDK configuration
├── package.json
└── tsconfig.json
```

---

## Basic Stack

### Simple Stack Definition

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket
    new s3.Bucket(this, 'MyBucket', {
      bucketName: 'my-app-bucket',
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
  }
}
```

### App Entry Point

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MyStack } from '../lib/my-cdk-app-stack';

const app = new cdk.App();

new MyStack(app, 'MyStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags: {
    Environment: 'production',
    ManagedBy: 'CDK',
  },
});

app.synth();
```

---

## Constructs

### L1 Constructs (CloudFormation Resources)

```typescript
import * as cdk from 'aws-cdk-lib';

// Raw CloudFormation resource
const cfnBucket = new cdk.aws_s3.CfnBucket(this, 'MyCfnBucket', {
  bucketName: 'my-cfn-bucket',
  versioningConfiguration: {
    status: 'Enabled',
  },
});
```

### L2 Constructs (AWS Constructs - Preferred)

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';

const bucket = new s3.Bucket(this, 'MyBucket', {
  bucketName: 'my-app-bucket',
  versioned: true,
  encryption: s3.BucketEncryption.S3_MANAGED,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

### L3 Constructs (Custom Patterns)

```typescript
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export interface StaticWebsiteProps {
  domainName: string;
  certificateArn: string;
}

export class StaticWebsite extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: StaticWebsiteProps) {
    super(scope, id);

    // S3 bucket for website content
    this.bucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: [props.domainName],
      certificate: acm.Certificate.fromCertificateArn(
        this,
        'Certificate',
        props.certificateArn
      ),
    });
  }
}
```

---

## Common Patterns

### VPC Stack

```typescript
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Add VPC Flow Logs
    this.vpc.addFlowLog('FlowLog', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
    });
  }
}
```

### RDS Database Stack

```typescript
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc, props?: cdk.StackProps) {
    super(scope, id, props);

    // Security group
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSG', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    // Database credentials
    const dbCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
    });

    // RDS instance
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbCredentials),
      multiAz: true,
      allocatedStorage: 100,
      maxAllocatedStorage: 200,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });
  }
}
```

### Lambda + API Gateway Stack

```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function
    const handler = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: 'my-table',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'My API',
      description: 'API Gateway for my application',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
    });

    const integration = new apigateway.LambdaIntegration(handler);

    // Add resources and methods
    const items = api.root.addResource('items');
    items.addMethod('GET', integration);
    items.addMethod('POST', integration);

    const item = items.addResource('{id}');
    item.addMethod('GET', integration);
    item.addMethod('PUT', integration);
    item.addMethod('DELETE', integration);

    // Output API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });
  }
}
```

---

## Environment Configuration

### Environment-Specific Configuration

```typescript
// lib/config/dev.ts
export const devConfig = {
  env: {
    account: '111111111111',
    region: 'us-east-1',
  },
  tags: {
    Environment: 'development',
    CostCenter: 'Engineering',
  },
  vpc: {
    maxAzs: 2,
    natGateways: 1,
  },
  rds: {
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
    multiAz: false,
  },
};

// lib/config/prod.ts
export const prodConfig = {
  env: {
    account: '222222222222',
    region: 'us-east-1',
  },
  tags: {
    Environment: 'production',
    CostCenter: 'Engineering',
  },
  vpc: {
    maxAzs: 3,
    natGateways: 3,
  },
  rds: {
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.R5, ec2.InstanceSize.LARGE),
    multiAz: true,
  },
};

// bin/my-cdk-app.ts
import { devConfig } from '../lib/config/dev';
import { prodConfig } from '../lib/config/prod';

const environment = process.env.ENVIRONMENT || 'dev';
const config = environment === 'prod' ? prodConfig : devConfig;

new MyStack(app, `MyStack-${environment}`, {
  env: config.env,
  tags: config.tags,
  config,
});
```

---

## Testing

### Unit Tests with Jest

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MyStack } from '../lib/my-cdk-app-stack';

describe('MyStack', () => {
  test('S3 Bucket Created', () => {
    const app = new cdk.App();
    const stack = new MyStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::S3::Bucket', 1);

    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('Bucket has encryption enabled', () => {
    const app = new cdk.App();
    const stack = new MyStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
    });
  });
});
```

---

## CDK Commands

### Common Commands

```bash
# Initialize new CDK project
cdk init app --language typescript

# Install dependencies
npm install

# Synthesize CloudFormation template
cdk synth

# Diff against deployed stack
cdk diff

# Deploy stack
cdk deploy

# Deploy all stacks
cdk deploy --all

# Deploy with approval
cdk deploy --require-approval never

# Destroy stack
cdk destroy

# List all stacks
cdk list

# View documentation
cdk doctor

# Bootstrap environment (first time only)
cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

---

## Best Practices

### Use Stack Outputs

```typescript
new cdk.CfnOutput(this, 'BucketName', {
  value: bucket.bucketName,
  description: 'The name of the S3 bucket',
  exportName: 'MyBucketName',
});
```

### Tagging

```typescript
cdk.Tags.of(this).add('Project', 'MyProject');
cdk.Tags.of(this).add('Owner', 'Platform Team');
cdk.Tags.of(myResource).add('Critical', 'true');
```

### Removal Policies

```typescript
// Development - destroy resources
new s3.Bucket(this, 'DevBucket', {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});

// Production - retain resources
new s3.Bucket(this, 'ProdBucket', {
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});

// Snapshot before deletion
new rds.DatabaseInstance(this, 'Database', {
  removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
});
```

---

## Anti-Patterns

### ❌ Avoid: Hardcoded Values

```typescript
// Bad
new s3.Bucket(this, 'Bucket', {
  bucketName: 'my-hardcoded-bucket-name',
});

// Good - Let CDK generate names
new s3.Bucket(this, 'Bucket');

// Good - Use configuration
new s3.Bucket(this, 'Bucket', {
  bucketName: props.bucketName,
});
```

### ❌ Avoid: Not Using TypeScript Strict Mode

```json
// tsconfig.json - Enable strict mode
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

### ❌ Avoid: No Tests

```typescript
// Always write tests for your stacks
describe('MyStack', () => {
  test('Stack creates resources', () => {
    const app = new cdk.App();
    const stack = new MyStack(app, 'TestStack');
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });
});
```

---

## Tool Configuration

### cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

### package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "cdk": "cdk",
    "synth": "cdk synth",
    "deploy": "cdk deploy",
    "deploy:all": "cdk deploy --all",
    "diff": "cdk diff",
    "destroy": "cdk destroy",
    "bootstrap": "cdk bootstrap",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write \"**/*.ts\"",
    "format:check": "prettier --check \"**/*.ts\"",
    "validate": "npm run lint && npm run format:check && npm run test"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "aws-cdk": "^2.100.0",
    "eslint": "^8.50.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.2.0"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
  },
  ignorePatterns: ['*.js', '*.d.ts', 'node_modules/', 'cdk.out/'],
};
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.d.ts',
    '!lib/**/*.test.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
```

### Prettier Configuration

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        types_or: [javascript, jsx, ts, tsx, json]

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \.[jt]sx?$
        types: [file]
        additional_dependencies:
          - eslint@8.56.0
          - '@typescript-eslint/eslint-plugin@6.21.0'
          - '@typescript-eslint/parser@6.21.0'
```

### VS Code Settings

```json
{
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    }
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "cdk.path": "node_modules/.bin/cdk"
}
```

### Makefile

```makefile
# Makefile
.PHONY: install build test deploy clean

install:
 npm install

build:
 npm run build

test:
 npm run test

test-coverage:
 npm run test:coverage

lint:
 npm run lint

lint-fix:
 npm run lint:fix

format:
 npm run format

format-check:
 npm run format:check

validate: lint format-check test
 @echo "✓ All validations passed"

synth:
 npm run synth

diff:
 npm run diff

deploy:
 npm run deploy

deploy-all:
 npm run deploy:all

destroy:
 npm run destroy

clean:
 rm -rf node_modules cdk.out coverage .nyc_output
 rm -f *.js *.d.ts

bootstrap:
 npm run bootstrap
```

---

## References

### Official Documentation

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [CDK API Reference](https://docs.aws.amazon.com/cdk/api/v2/)
- [CDK Workshop](https://cdkworkshop.com/)

### Additional Resources

- [Best Practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html)
- [CDK Patterns](https://cdkpatterns.com/)

---

**Version**: 1.0.0
**Last Updated**: 2025-10-28
**Status**: Active
