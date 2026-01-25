---
title: "AWS CloudFormation Style Guide"
description: "Comprehensive style guide for AWS CloudFormation covering template structure, naming conventions, security, and best practices"
author: "Tyler Dukes"
tags: [cloudformation, aws, infrastructure, iac, yaml, json]
category: "Language Guides"
status: "active"
---

## Language Overview

**AWS CloudFormation** is AWS's native infrastructure as code service that enables you to model, provision,
and manage AWS resources using declarative templates. Templates can be written in YAML (preferred) or JSON format.

### Key Characteristics

- **Format**: YAML (preferred) or JSON
- **Type**: Declarative infrastructure as code
- **Execution**: AWS CloudFormation service
- **Primary Use Cases**:
  - Multi-account/region infrastructure deployment
  - AWS-native infrastructure automation
  - StackSets for organizational deployments
  - Change management with change sets

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Naming** | | | |
| Stack Names | `PascalCase-environment` | `VpcStack-prod` | Include environment suffix |
| Resource Logical IDs | `PascalCase` | `WebServerSecurityGroup` | Descriptive, no underscores |
| Parameter Names | `PascalCase` | `EnvironmentType` | Clear purpose |
| Output Names | `PascalCase` | `VpcId`, `SubnetIds` | Match resource being exported |
| Export Names | `StackName-ResourceName` | `${AWS::StackName}-VpcId` | Unique across region |
| **Template Sections** | | | |
| AWSTemplateFormatVersion | Required | `'2010-09-09'` | Only valid version |
| Description | Required | Max 1024 characters | Brief stack purpose |
| Parameters | Optional | Max 200 parameters | Input values |
| Mappings | Optional | Static lookups | Region/environment config |
| Conditions | Optional | Logical operators | Conditional resources |
| Resources | Required | Only required section | AWS resources |
| Outputs | Optional | Max 200 outputs | Export values |
| **Best Practices** | | | |
| YAML over JSON | Preferred | More readable | Comments supported |
| Nested Stacks | Large deployments | > 500 resources | Logical separation |
| Change Sets | Always use | Preview changes | Before production updates |
| Drift Detection | Regular checks | Monthly minimum | Infrastructure compliance |
| **Security** | | | |
| Secrets | Never hardcode | Use SSM/Secrets Manager | Dynamic references |
| IAM | Least privilege | Specific resource ARNs | No wildcards |
| Encryption | Enable by default | KMS for sensitive data | All storage resources |

---

## Template Structure

### Complete Template Example

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >-
  Production VPC infrastructure with public and private subnets,
  NAT gateways, and VPC flow logs for network monitoring.

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: Network Configuration
        Parameters:
          - VpcCidr
          - PublicSubnetCidrs
          - PrivateSubnetCidrs
      - Label:
          default: Environment
        Parameters:
          - EnvironmentName
          - CostCenter
    ParameterLabels:
      VpcCidr:
        default: VPC CIDR Block
      EnvironmentName:
        default: Environment Name

Parameters:
  EnvironmentName:
    Type: String
    AllowedValues:
      - dev
      - staging
      - prod
    Default: dev
    Description: Environment name for resource tagging

  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'
    ConstraintDescription: Must be a valid CIDR block (e.g., 10.0.0.0/16)
    Description: CIDR block for the VPC

  PublicSubnetCidrs:
    Type: CommaDelimitedList
    Default: 10.0.1.0/24,10.0.2.0/24,10.0.3.0/24
    Description: CIDR blocks for public subnets

  PrivateSubnetCidrs:
    Type: CommaDelimitedList
    Default: 10.0.11.0/24,10.0.12.0/24,10.0.13.0/24
    Description: CIDR blocks for private subnets

  CostCenter:
    Type: String
    Default: Engineering
    Description: Cost center for billing allocation

Mappings:
  RegionConfig:
    us-east-1:
      AMI: ami-0abcdef1234567890
      AZCount: 3
    us-west-2:
      AMI: ami-0fedcba0987654321
      AZCount: 3
    eu-west-1:
      AMI: ami-0123456789abcdef0
      AZCount: 3

Conditions:
  IsProduction: !Equals [!Ref EnvironmentName, prod]
  CreateNatGateway: !Or
    - !Equals [!Ref EnvironmentName, prod]
    - !Equals [!Ref EnvironmentName, staging]
  EnableFlowLogs: !Condition IsProduction

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-vpc'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: ManagedBy
          Value: CloudFormation

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-igw'
        - Key: Environment
          Value: !Ref EnvironmentName

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [0, !Ref PublicSubnetCidrs]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-subnet-1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [1, !Ref PublicSubnetCidrs]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-subnet-2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: Public

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [0, !Ref PrivateSubnetCidrs]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-private-subnet-1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [1, !Ref PrivateSubnetCidrs]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-private-subnet-2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: Private

  # NAT Gateway (conditional)
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    Condition: CreateNatGateway
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-nat-eip'

  NatGateway:
    Type: AWS::EC2::NatGateway
    Condition: CreateNatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-nat'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-rt'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-private-rt'

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Condition: CreateNatGateway
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  # VPC Flow Logs (conditional)
  FlowLogsRole:
    Type: AWS::IAM::Role
    Condition: EnableFlowLogs
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: FlowLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/vpc/flowlogs/*'

  FlowLogsLogGroup:
    Type: AWS::Logs::LogGroup
    Condition: EnableFlowLogs
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${EnvironmentName}'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Condition: EnableFlowLogs
    Properties:
      DeliverLogsPermissionArn: !GetAtt FlowLogsRole.Arn
      LogGroupName: !Ref FlowLogsLogGroup
      ResourceId: !Ref VPC
      ResourceType: VPC
      TrafficType: ALL
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-vpc-flowlog'

Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'

  VpcCidr:
    Description: VPC CIDR block
    Value: !Ref VpcCidr
    Export:
      Name: !Sub '${AWS::StackName}-VpcCidr'

  PublicSubnetIds:
    Description: List of public subnet IDs
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnetIds'

  PrivateSubnetIds:
    Description: List of private subnet IDs
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnetIds'

  NatGatewayId:
    Condition: CreateNatGateway
    Description: NAT Gateway ID
    Value: !Ref NatGateway
    Export:
      Name: !Sub '${AWS::StackName}-NatGatewayId'
```

---

## Naming Conventions

### Stack Names

```yaml
# Good - Clear environment and purpose
MyApp-VpcStack-prod
MyApp-DatabaseStack-staging
MyApp-ApiStack-dev

# Bad - Ambiguous or missing context
vpc-stack
my-stack
Stack1
```

### Resource Logical IDs

```yaml
Resources:
  # Good - Descriptive PascalCase
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup

  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup

  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer

  # Bad - Unclear or wrong format
  sg1:
    Type: AWS::EC2::SecurityGroup

  my_subnet_group:
    Type: AWS::RDS::DBSubnetGroup

  alb:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
```

### Parameter Names

```yaml
Parameters:
  # Good - Clear purpose with constraints
  EnvironmentName:
    Type: String
    AllowedValues: [dev, staging, prod]
    Description: Deployment environment

  DatabaseInstanceClass:
    Type: String
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
    Default: db.t3.micro
    Description: RDS instance class

  VpcCidr:
    Type: String
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'
    ConstraintDescription: Must be valid CIDR (e.g., 10.0.0.0/16)

  # Bad - Vague or no constraints
  env:
    Type: String

  size:
    Type: String

  cidr:
    Type: String
```

### Output Names and Exports

```yaml
Outputs:
  # Good - Descriptive with unique exports
  VpcId:
    Description: The ID of the VPC
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'

  DatabaseEndpoint:
    Description: RDS instance endpoint
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseEndpoint'

  ApiGatewayUrl:
    Description: API Gateway invoke URL
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: !Sub '${AWS::StackName}-ApiUrl'

  # Bad - Generic names, hardcoded exports
  Output1:
    Value: !Ref VPC
    Export:
      Name: my-vpc  # Not unique, may conflict
```

---

## Intrinsic Functions

### !Ref

```yaml
Resources:
  # Reference a parameter
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr

  # Reference another resource
  Subnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref SubnetCidr
```

### !GetAtt

```yaml
Resources:
  # Get resource attributes
  SecurityGroupIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !GetAtt SecurityGroup.GroupId
      IpProtocol: tcp
      FromPort: 443
      ToPort: 443
      CidrIp: 0.0.0.0/0

Outputs:
  BucketArn:
    Value: !GetAtt S3Bucket.Arn

  DatabaseEndpoint:
    Value: !GetAtt Database.Endpoint.Address

  LambdaArn:
    Value: !GetAtt LambdaFunction.Arn

  RoleArn:
    Value: !GetAtt IAMRole.Arn
```

### !Sub

```yaml
Resources:
  # Simple variable substitution
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-${AWS::AccountId}-data'

  # Multi-line with local variables
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      Environment:
        Variables:
          TABLE_NAME: !Sub '${EnvironmentName}-users'
          REGION: !Sub '${AWS::Region}'
          ACCOUNT_ID: !Sub '${AWS::AccountId}'

  # Complex substitution with mapping
  PolicyDocument:
    Type: AWS::IAM::Policy
    Properties:
      PolicyDocument:
        Statement:
          - Effect: Allow
            Action: s3:GetObject
            Resource: !Sub
              - 'arn:aws:s3:::${BucketName}/*'
              - BucketName: !Ref DataBucket
```

### !Join

```yaml
Resources:
  # Join list of values
  SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Join
        - ' '
        - - 'Security group for'
          - !Ref EnvironmentName
          - 'environment'

Outputs:
  SubnetIds:
    Value: !Join
      - ','
      - - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  ConnectionString:
    Value: !Join
      - ''
      - - 'postgresql://'
        - !Ref DatabaseUsername
        - ':'
        - '{{resolve:secretsmanager:'
        - !Ref DatabaseSecret
        - ':SecretString:password}}'
        - '@'
        - !GetAtt Database.Endpoint.Address
        - ':'
        - !GetAtt Database.Endpoint.Port
        - '/'
        - !Ref DatabaseName
```

### !Select and !GetAZs

```yaml
Resources:
  # Select specific availability zones
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [0, !Ref PublicSubnetCidrs]

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Select [1, !Ref PublicSubnetCidrs]

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !Select [2, !Ref PublicSubnetCidrs]
```

### !If (Conditional Values)

```yaml
Conditions:
  IsProduction: !Equals [!Ref EnvironmentName, prod]
  CreateMultiAZ: !Or
    - !Equals [!Ref EnvironmentName, prod]
    - !Equals [!Ref EnvironmentName, staging]

Resources:
  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: !If
        - IsProduction
        - db.r5.large
        - db.t3.micro
      MultiAZ: !If [CreateMultiAZ, true, false]
      AllocatedStorage: !If [IsProduction, 100, 20]
      BackupRetentionPeriod: !If [IsProduction, 30, 7]
      DeletionProtection: !If [IsProduction, true, false]

  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !If
        - IsProduction
        - !Sub '${AWS::AccountId}-prod-data'
        - !Sub '${AWS::AccountId}-${EnvironmentName}-data'
      VersioningConfiguration:
        Status: !If [IsProduction, Enabled, Suspended]
```

### !Split

```yaml
Parameters:
  SubnetCidrs:
    Type: String
    Default: '10.0.1.0/24,10.0.2.0/24,10.0.3.0/24'

Resources:
  Subnet1:
    Type: AWS::EC2::Subnet
    Properties:
      CidrBlock: !Select [0, !Split [',', !Ref SubnetCidrs]]

  Subnet2:
    Type: AWS::EC2::Subnet
    Properties:
      CidrBlock: !Select [1, !Split [',', !Ref SubnetCidrs]]

  Subnet3:
    Type: AWS::EC2::Subnet
    Properties:
      CidrBlock: !Select [2, !Split [',', !Ref SubnetCidrs]]
```

### !Cidr

```yaml
Resources:
  # Generate CIDR blocks automatically
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16

  Subnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!GetAtt VPC.CidrBlock, 6, 8]]

  Subnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Cidr [!GetAtt VPC.CidrBlock, 6, 8]]

  Subnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [2, !Cidr [!GetAtt VPC.CidrBlock, 6, 8]]
```

---

## Conditions

### Basic Conditions

```yaml
Conditions:
  # Equals comparison
  IsProduction: !Equals [!Ref EnvironmentName, prod]
  IsNotProduction: !Not [!Equals [!Ref EnvironmentName, prod]]

  # Multiple conditions with Or
  CreateNatGateway: !Or
    - !Equals [!Ref EnvironmentName, prod]
    - !Equals [!Ref EnvironmentName, staging]

  # And condition
  CreateHighAvailability: !And
    - !Equals [!Ref EnvironmentName, prod]
    - !Equals [!Ref EnableHA, 'true']

  # Nested conditions
  ShouldCreateBackup: !And
    - !Condition IsProduction
    - !Not [!Equals [!Ref DisableBackups, 'true']]
```

### Conditional Resources

```yaml
Resources:
  # Resource only created in production
  ProductionOnlyBucket:
    Type: AWS::S3::Bucket
    Condition: IsProduction
    Properties:
      BucketName: !Sub '${AWS::AccountId}-prod-audit-logs'

  # NAT Gateway only in prod/staging
  NatGateway:
    Type: AWS::EC2::NatGateway
    Condition: CreateNatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  NatGatewayEIP:
    Type: AWS::EC2::EIP
    Condition: CreateNatGateway
    Properties:
      Domain: vpc
```

### Conditional Outputs

```yaml
Outputs:
  NatGatewayId:
    Condition: CreateNatGateway
    Description: NAT Gateway ID (only in prod/staging)
    Value: !Ref NatGateway
    Export:
      Name: !Sub '${AWS::StackName}-NatGatewayId'

  ProductionBucketArn:
    Condition: IsProduction
    Description: Production audit bucket ARN
    Value: !GetAtt ProductionOnlyBucket.Arn
```

---

## Parameters

### Parameter Best Practices

```yaml
Parameters:
  # With all validation options
  EnvironmentName:
    Type: String
    Description: >-
      Environment name used for resource tagging and naming.
      Choose from dev, staging, or prod.
    AllowedValues:
      - dev
      - staging
      - prod
    Default: dev
    ConstraintDescription: Must be dev, staging, or prod

  # AWS-specific parameter types
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: Select the VPC for deployment

  SubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
    Description: Select subnets for the application

  SecurityGroupId:
    Type: AWS::EC2::SecurityGroup::Id
    Description: Security group for the instances

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 key pair for SSH access

  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
      - m5.large
      - m5.xlarge
    Description: EC2 instance type

  # SSM Parameter reference
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: Latest Amazon Linux 2 AMI

  # Pattern validation
  DomainName:
    Type: String
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]\.[a-z]{2,}$'
    ConstraintDescription: Must be a valid domain name
    Description: Domain name for the application

  # Number with range
  MinCapacity:
    Type: Number
    MinValue: 1
    MaxValue: 10
    Default: 2
    Description: Minimum number of instances in ASG

  MaxCapacity:
    Type: Number
    MinValue: 1
    MaxValue: 100
    Default: 10
    Description: Maximum number of instances in ASG
```

### Parameter Grouping with Metadata

```yaml
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: Network Configuration
        Parameters:
          - VpcId
          - SubnetIds
          - SecurityGroupId
      - Label:
          default: Instance Configuration
        Parameters:
          - InstanceType
          - KeyPairName
          - LatestAmiId
      - Label:
          default: Scaling Configuration
        Parameters:
          - MinCapacity
          - MaxCapacity
      - Label:
          default: Application Settings
        Parameters:
          - EnvironmentName
          - DomainName
    ParameterLabels:
      VpcId:
        default: Which VPC should this deploy to?
      SubnetIds:
        default: Which subnets should be used?
      InstanceType:
        default: Instance Type
      MinCapacity:
        default: Minimum Capacity
      MaxCapacity:
        default: Maximum Capacity
```

---

## Mappings

### Region-Based Mappings

```yaml
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0abcdef1234567890
      ELBAccountId: '127311923021'
      S3Endpoint: s3.us-east-1.amazonaws.com
    us-west-2:
      AMI: ami-0fedcba0987654321
      ELBAccountId: '797873946194'
      S3Endpoint: s3.us-west-2.amazonaws.com
    eu-west-1:
      AMI: ami-0123456789abcdef0
      ELBAccountId: '156460612806'
      S3Endpoint: s3.eu-west-1.amazonaws.com
    ap-southeast-1:
      AMI: ami-0abcdef0123456789
      ELBAccountId: '114774131450'
      S3Endpoint: s3.ap-southeast-1.amazonaws.com

Resources:
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: t3.micro
```

### Environment-Based Mappings

```yaml
Mappings:
  EnvironmentConfig:
    dev:
      InstanceType: t3.micro
      MinSize: 1
      MaxSize: 2
      MultiAZ: false
      BackupRetention: 1
      DeletionProtection: false
    staging:
      InstanceType: t3.small
      MinSize: 2
      MaxSize: 4
      MultiAZ: false
      BackupRetention: 7
      DeletionProtection: false
    prod:
      InstanceType: m5.large
      MinSize: 3
      MaxSize: 10
      MultiAZ: true
      BackupRetention: 30
      DeletionProtection: true

Resources:
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, MinSize]
      MaxSize: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, MaxSize]
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateData:
        InstanceType: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, InstanceType]

  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      MultiAZ: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, MultiAZ]
      BackupRetentionPeriod: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, BackupRetention]
      DeletionProtection: !FindInMap [EnvironmentConfig, !Ref EnvironmentName, DeletionProtection]
```

---

## Nested Stacks

### Parent Stack

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Parent stack that orchestrates nested stacks

Parameters:
  EnvironmentName:
    Type: String
    AllowedValues: [dev, staging, prod]
  TemplatesBucket:
    Type: String
    Description: S3 bucket containing nested templates

Resources:
  # Network stack
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: !Sub 'https://${TemplatesBucket}.s3.amazonaws.com/network.yaml'
      Parameters:
        EnvironmentName: !Ref EnvironmentName
        VpcCidr: 10.0.0.0/16
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

  # Security stack (depends on network)
  SecurityStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: NetworkStack
    Properties:
      TemplateURL: !Sub 'https://${TemplatesBucket}.s3.amazonaws.com/security.yaml'
      Parameters:
        EnvironmentName: !Ref EnvironmentName
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

  # Database stack (depends on network and security)
  DatabaseStack:
    Type: AWS::CloudFormation::Stack
    DependsOn:
      - NetworkStack
      - SecurityStack
    Properties:
      TemplateURL: !Sub 'https://${TemplatesBucket}.s3.amazonaws.com/database.yaml'
      Parameters:
        EnvironmentName: !Ref EnvironmentName
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
        SubnetIds: !GetAtt NetworkStack.Outputs.PrivateSubnetIds
        SecurityGroupId: !GetAtt SecurityStack.Outputs.DatabaseSecurityGroupId
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

  # Application stack
  ApplicationStack:
    Type: AWS::CloudFormation::Stack
    DependsOn:
      - NetworkStack
      - SecurityStack
      - DatabaseStack
    Properties:
      TemplateURL: !Sub 'https://${TemplatesBucket}.s3.amazonaws.com/application.yaml'
      Parameters:
        EnvironmentName: !Ref EnvironmentName
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
        SubnetIds: !GetAtt NetworkStack.Outputs.PrivateSubnetIds
        SecurityGroupId: !GetAtt SecurityStack.Outputs.ApplicationSecurityGroupId
        DatabaseEndpoint: !GetAtt DatabaseStack.Outputs.DatabaseEndpoint
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

Outputs:
  VpcId:
    Value: !GetAtt NetworkStack.Outputs.VpcId
  DatabaseEndpoint:
    Value: !GetAtt DatabaseStack.Outputs.DatabaseEndpoint
  ApplicationUrl:
    Value: !GetAtt ApplicationStack.Outputs.LoadBalancerDNS
```

### Child Stack (Network)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Network infrastructure nested stack

Parameters:
  EnvironmentName:
    Type: String
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-vpc'

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 6, 8]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-1'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-private-1'

Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref VPC

  PublicSubnetIds:
    Description: Public subnet IDs
    Value: !Ref PublicSubnet1

  PrivateSubnetIds:
    Description: Private subnet IDs
    Value: !Ref PrivateSubnet1
```

---

## Cross-Stack References

### Exporting Values

```yaml
# network-stack.yaml
Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24

Outputs:
  VpcId:
    Description: VPC ID for cross-stack reference
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'

  VpcCidr:
    Description: VPC CIDR block
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub '${AWS::StackName}-VpcCidr'

  PublicSubnet1Id:
    Description: Public subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet1Az:
    Description: Public subnet 1 availability zone
    Value: !GetAtt PublicSubnet1.AvailabilityZone
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Az'
```

### Importing Values

```yaml
# application-stack.yaml
Parameters:
  NetworkStackName:
    Type: String
    Default: production-network
    Description: Name of the network stack to import from

Resources:
  SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Application security group
      VpcId: !ImportValue
        Fn::Sub: '${NetworkStackName}-VpcId'
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !ImportValue
            Fn::Sub: '${NetworkStackName}-VpcCidr'

  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      SubnetId: !ImportValue
        Fn::Sub: '${NetworkStackName}-PublicSubnet1Id'
      SecurityGroupIds:
        - !Ref SecurityGroup

  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Type: application
      Subnets:
        - !ImportValue
          Fn::Sub: '${NetworkStackName}-PublicSubnet1Id'
        - !ImportValue
          Fn::Sub: '${NetworkStackName}-PublicSubnet2Id'
      SecurityGroups:
        - !Ref SecurityGroup
```

---

## StackSets

### StackSet Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Multi-account/region baseline security configuration

Parameters:
  OrganizationId:
    Type: String
    Description: AWS Organizations ID

Resources:
  # CloudTrail for all accounts
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      IsLogging: true
      IsMultiRegionTrail: true
      IncludeGlobalServiceEvents: true
      S3BucketName: !Sub 'org-cloudtrail-${AWS::AccountId}'
      EnableLogFileValidation: true
      Tags:
        - Key: ManagedBy
          Value: CloudFormation-StackSet

  # GuardDuty detector
  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
      FindingPublishingFrequency: FIFTEEN_MINUTES

  # Security Hub
  SecurityHub:
    Type: AWS::SecurityHub::Hub
    Properties:
      Tags:
        ManagedBy: CloudFormation-StackSet

  # Config recorder
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
      RoleARN: !GetAtt ConfigRole.Arn

  ConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
```

### StackSet Deployment (CLI)

```bash
# Create StackSet
aws cloudformation create-stack-set \
  --stack-set-name security-baseline \
  --template-body file://security-baseline.yaml \
  --permission-model SERVICE_MANAGED \
  --auto-deployment Enabled=true,RetainStacksOnAccountRemoval=false \
  --capabilities CAPABILITY_NAMED_IAM

# Deploy to all accounts in organization
aws cloudformation create-stack-instances \
  --stack-set-name security-baseline \
  --deployment-targets OrganizationalUnitIds=ou-xxxx-xxxxxxxx \
  --regions us-east-1 us-west-2 eu-west-1 \
  --operation-preferences MaxConcurrentPercentage=10,FailureTolerancePercentage=5

# Check deployment status
aws cloudformation describe-stack-set-operation \
  --stack-set-name security-baseline \
  --operation-id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# List stack instances
aws cloudformation list-stack-instances \
  --stack-set-name security-baseline
```

---

## Secret Management

### Dynamic References to Secrets Manager

```yaml
Resources:
  # RDS with Secrets Manager password
  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-database'
      Engine: postgres
      EngineVersion: '15'
      DBInstanceClass: db.t3.micro
      MasterUsername: '{{resolve:secretsmanager:prod/db/credentials:SecretString:username}}'
      MasterUserPassword: '{{resolve:secretsmanager:prod/db/credentials:SecretString:password}}'
      AllocatedStorage: 20
      StorageEncrypted: true

  # Lambda with API key from Secrets Manager
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${EnvironmentName}-api-handler'
      Runtime: python3.11
      Handler: index.handler
      Environment:
        Variables:
          API_KEY: '{{resolve:secretsmanager:prod/api/key:SecretString:apiKey}}'
          DB_CONNECTION: '{{resolve:secretsmanager:prod/db/credentials:SecretString:connectionString}}'
```

### Dynamic References to SSM Parameter Store

```yaml
Resources:
  # EC2 with SSM parameters
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: '{{resolve:ssm:/config/instance-type:1}}'
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      KeyName: '{{resolve:ssm:/config/keypair-name}}'

  # Lambda with configuration from SSM
  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      Environment:
        Variables:
          LOG_LEVEL: '{{resolve:ssm:/config/log-level}}'
          FEATURE_FLAG: '{{resolve:ssm:/features/new-feature:1}}'
```

### Creating Secrets

```yaml
Resources:
  # Auto-generated database secret
  DatabaseSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${EnvironmentName}/database/credentials'
      Description: Database credentials
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludePunctuation: true
        ExcludeCharacters: '"@/\'

  # Secret with rotation
  RotatingSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${EnvironmentName}/api/key'
      Description: API key with automatic rotation

  SecretRotationSchedule:
    Type: AWS::SecretsManager::RotationSchedule
    DependsOn: SecretRotationLambda
    Properties:
      SecretId: !Ref RotatingSecret
      RotationLambdaARN: !GetAtt SecretRotationLambda.Arn
      RotationRules:
        AutomaticallyAfterDays: 30

  # RDS secret attachment
  DatabaseSecretAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DatabaseSecret
      TargetId: !Ref Database
      TargetType: AWS::RDS::DBInstance
```

---

## Security Best Practices

### IAM Least Privilege

```yaml
Resources:
  # Good - Specific permissions
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: MinimalAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              # Specific S3 bucket access
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub 'arn:aws:s3:::${DataBucket}/*'
              # Specific DynamoDB table access
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:Query
                Resource: !GetAtt UsersTable.Arn
              # CloudWatch Logs
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${LambdaFunction}:*'

  # Bad - Overly permissive (DO NOT USE)
  # OverlyPermissiveRole:
  #   Type: AWS::IAM::Role
  #   Properties:
  #     ManagedPolicyArns:
  #       - arn:aws:iam::aws:policy/AdministratorAccess  # Never do this!
```

### Encryption

```yaml
Resources:
  # Customer-managed KMS key
  EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: Encryption key for application data
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: kms:*
            Resource: '*'
          - Sid: Allow Lambda to use the key
            Effect: Allow
            Principal:
              AWS: !GetAtt LambdaExecutionRole.Arn
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
            Resource: '*'

  EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${EnvironmentName}/app-key'
      TargetKeyId: !Ref EncryptionKey

  # S3 bucket with encryption
  DataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::AccountId}-${EnvironmentName}-data'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref EncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled

  # RDS with encryption
  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      StorageEncrypted: true
      KmsKeyId: !Ref EncryptionKey
      DBInstanceClass: db.t3.micro
      Engine: postgres

  # EBS volume encryption
  EBSVolume:
    Type: AWS::EC2::Volume
    Properties:
      AvailabilityZone: !Select [0, !GetAZs '']
      Size: 100
      Encrypted: true
      KmsKeyId: !Ref EncryptionKey
      VolumeType: gp3
```

### Security Groups

```yaml
Resources:
  # Web tier security group
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - Description: HTTPS from anywhere
          IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - Description: HTTP redirect only
          IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - Description: HTTPS to app tier
          IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          DestinationSecurityGroupId: !Ref AppSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-web-sg'

  # App tier security group
  AppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for application servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - Description: HTTPS from web tier
          IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref WebSecurityGroup
      SecurityGroupEgress:
        - Description: PostgreSQL to database
          IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          DestinationSecurityGroupId: !Ref DatabaseSecurityGroup
        - Description: HTTPS for external APIs
          IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  # Database tier security group
  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - Description: PostgreSQL from app tier only
          IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref AppSecurityGroup
      SecurityGroupEgress: []  # No outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-db-sg'
```

---

## Change Sets and Drift Detection

### Creating Change Sets

```bash
# Create a change set
aws cloudformation create-change-set \
  --stack-name my-stack \
  --change-set-name my-change-set \
  --template-body file://template.yaml \
  --parameters ParameterKey=InstanceType,ParameterValue=t3.small \
  --capabilities CAPABILITY_IAM

# Describe change set
aws cloudformation describe-change-set \
  --stack-name my-stack \
  --change-set-name my-change-set

# Execute change set after review
aws cloudformation execute-change-set \
  --stack-name my-stack \
  --change-set-name my-change-set

# Delete change set (if not executing)
aws cloudformation delete-change-set \
  --stack-name my-stack \
  --change-set-name my-change-set
```

### Drift Detection

```bash
# Detect drift on a stack
aws cloudformation detect-stack-drift \
  --stack-name my-stack

# Check drift detection status
aws cloudformation describe-stack-drift-detection-status \
  --stack-drift-detection-id aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee

# Describe drifted resources
aws cloudformation describe-stack-resource-drifts \
  --stack-name my-stack \
  --stack-resource-drift-status-filters MODIFIED DELETED

# Detect drift on specific resource
aws cloudformation detect-stack-resource-drift \
  --stack-name my-stack \
  --logical-resource-id MyEC2Instance
```

### Automated Drift Detection Schedule

```yaml
Resources:
  DriftDetectionRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${EnvironmentName}-drift-detection'
      Description: Weekly CloudFormation drift detection
      ScheduleExpression: cron(0 9 ? * MON *)
      State: ENABLED
      Targets:
        - Id: DriftDetectionLambda
          Arn: !GetAtt DriftDetectionLambda.Arn

  DriftDetectionLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${EnvironmentName}-drift-detector'
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt DriftDetectionRole.Arn
      Timeout: 300
      Code:
        ZipFile: |
          import boto3
          import json

          def handler(event, context):
              cfn = boto3.client('cloudformation')
              sns = boto3.client('sns')

              stacks = cfn.list_stacks(
                  StackStatusFilter=['CREATE_COMPLETE', 'UPDATE_COMPLETE']
              )['StackSummaries']

              drifted_stacks = []
              for stack in stacks:
                  detection_id = cfn.detect_stack_drift(
                      StackName=stack['StackName']
                  )['StackDriftDetectionId']

                  # Wait and check
                  waiter = cfn.get_waiter('stack_drift_detection_complete')
                  waiter.wait(StackDriftDetectionId=detection_id)

                  status = cfn.describe_stack_drift_detection_status(
                      StackDriftDetectionId=detection_id
                  )

                  if status['StackDriftStatus'] == 'DRIFTED':
                      drifted_stacks.append(stack['StackName'])

              if drifted_stacks:
                  sns.publish(
                      TopicArn=os.environ['ALERT_TOPIC'],
                      Subject='CloudFormation Drift Detected',
                      Message=json.dumps(drifted_stacks)
                  )
```

---

## DependsOn

### Explicit Dependencies

```yaml
Resources:
  # Internet Gateway must be attached before creating NAT Gateway
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet

  # Route depends on NAT Gateway
  PrivateRoute:
    Type: AWS::EC2::Route
    DependsOn: NatGateway
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway
```

### Multiple Dependencies

```yaml
Resources:
  # Lambda requires both role and VPC resources
  LambdaFunction:
    Type: AWS::Lambda::Function
    DependsOn:
      - LambdaSecurityGroup
      - VPCEndpointSecretsManager
    Properties:
      FunctionName: !Sub '${EnvironmentName}-processor'
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt LambdaRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2

  # Application requires database and cache to be ready
  ECSService:
    Type: AWS::ECS::Service
    DependsOn:
      - ALBListener
      - DatabaseInstance
      - ElastiCacheCluster
    Properties:
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref TaskDefinition
      LoadBalancers:
        - ContainerName: app
          ContainerPort: 8080
          TargetGroupArn: !Ref TargetGroup
```

---

## CI/CD Integration

### cfn-lint Validation

```yaml
# .cfn-lint.yaml configuration
regions:
  - us-east-1
  - us-west-2
  - eu-west-1

include_checks:
  - I

configure_rules:
  E3012:
    strict: true

ignore_checks:
  - W3002  # Embedded code in templates

templates:
  - templates/**/*.yaml
  - templates/**/*.yml
```

```bash
# Install cfn-lint
pip install cfn-lint

# Validate single template
cfn-lint template.yaml

# Validate all templates
cfn-lint templates/**/*.yaml

# Output as JSON for CI
cfn-lint template.yaml --format json

# With specific rules
cfn-lint template.yaml --include-checks I --ignore-checks W3002
```

### cfn-nag Security Scanning

```bash
# Install cfn-nag
gem install cfn-nag

# Scan single template
cfn_nag_scan --input-path template.yaml

# Scan directory
cfn_nag_scan --input-path templates/

# Output as JSON
cfn_nag_scan --input-path template.yaml --output-format json

# With custom rules
cfn_nag_scan --input-path template.yaml --rule-directory custom_rules/
```

### GitHub Actions Workflow

```yaml
name: CloudFormation CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'cloudformation/**'
  pull_request:
    branches: [main]
    paths:
      - 'cloudformation/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install cfn-lint
        run: pip install cfn-lint

      - name: Lint CloudFormation templates
        run: cfn-lint cloudformation/**/*.yaml

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'

      - name: Install cfn-nag
        run: gem install cfn-nag

      - name: Security scan
        run: cfn_nag_scan --input-path cloudformation/

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Validate templates with AWS
        run: |
          for template in cloudformation/**/*.yaml; do
            aws cloudformation validate-template \
              --template-body file://$template
          done

  deploy-dev:
    needs: validate
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: development
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to dev
        run: |
          aws cloudformation deploy \
            --template-file cloudformation/main.yaml \
            --stack-name myapp-dev \
            --parameter-overrides EnvironmentName=dev \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
            --no-fail-on-empty-changeset

  deploy-prod:
    needs: deploy-dev
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Create change set
        run: |
          aws cloudformation create-change-set \
            --stack-name myapp-prod \
            --template-body file://cloudformation/main.yaml \
            --change-set-name prod-$(date +%Y%m%d%H%M%S) \
            --parameters ParameterKey=EnvironmentName,ParameterValue=prod \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

      - name: Wait for change set
        run: |
          aws cloudformation wait change-set-create-complete \
            --stack-name myapp-prod \
            --change-set-name prod-$(date +%Y%m%d%H%M%S)

      - name: Execute change set
        run: |
          aws cloudformation execute-change-set \
            --stack-name myapp-prod \
            --change-set-name prod-$(date +%Y%m%d%H%M%S)

      - name: Wait for stack update
        run: |
          aws cloudformation wait stack-update-complete \
            --stack-name myapp-prod
```

### TaskCat Testing

```yaml
# .taskcat.yml
project:
  name: my-cloudformation-project
  regions:
    - us-east-1
    - us-west-2
    - eu-west-1

tests:
  vpc-test:
    template: templates/vpc.yaml
    parameters:
      EnvironmentName: test
      VpcCidr: 10.0.0.0/16

  app-test:
    template: templates/app.yaml
    parameters:
      EnvironmentName: test
    regions:
      - us-east-1
```

```bash
# Install taskcat
pip install taskcat

# Run tests
taskcat test run

# Clean up test stacks
taskcat test clean

# Lint only
taskcat lint run
```

---

## Common Patterns

### Application Load Balancer with Auto Scaling

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: ALB with Auto Scaling Group

Parameters:
  EnvironmentName:
    Type: String
  VpcId:
    Type: AWS::EC2::VPC::Id
  SubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
  InstanceType:
    Type: String
    Default: t3.micro

Resources:
  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: ALB Security Group
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0

  InstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: EC2 Instance Security Group
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${EnvironmentName}-alb'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets: !Ref SubnetIds
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${EnvironmentName}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VpcId
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 5
      TargetType: instance

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${EnvironmentName}-lt'
      LaunchTemplateData:
        ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: !Ref InstanceType
        SecurityGroupIds:
          - !Ref InstanceSecurityGroup
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "Hello from $(hostname)" > /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${EnvironmentName}-instance'

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${EnvironmentName}-asg'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 10
      DesiredCapacity: 2
      VPCZoneIdentifier: !Ref SubnetIds
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
          PropagateAtLaunch: true

  # Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref AutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70

Outputs:
  LoadBalancerDNS:
    Description: ALB DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALBDNSName'
```

### Lambda with API Gateway

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Serverless API with Lambda and API Gateway

Transform: AWS::Serverless-2016-10-31

Parameters:
  EnvironmentName:
    Type: String
  LogRetentionDays:
    Type: Number
    Default: 30

Globals:
  Function:
    Runtime: python3.11
    Timeout: 30
    MemorySize: 256
    Environment:
      Variables:
        ENVIRONMENT: !Ref EnvironmentName

Resources:
  # API Gateway
  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub '${EnvironmentName}-api'
      Description: REST API for application
      EndpointConfiguration:
        Types:
          - REGIONAL

  # Lambda Execution Role
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-lambda-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt DataTable.Arn

  # Lambda Function
  ApiHandler:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${EnvironmentName}-api-handler'
      Role: !GetAtt LambdaExecutionRole.Arn
      Handler: index.handler
      Runtime: python3.11
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          TABLE_NAME: !Ref DataTable
      Code:
        ZipFile: |
          import json
          import os
          import boto3

          dynamodb = boto3.resource('dynamodb')
          table = dynamodb.Table(os.environ['TABLE_NAME'])

          def handler(event, context):
              http_method = event['httpMethod']
              path = event['path']

              if http_method == 'GET':
                  response = table.scan()
                  return {
                      'statusCode': 200,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps(response['Items'])
                  }
              elif http_method == 'POST':
                  body = json.loads(event['body'])
                  table.put_item(Item=body)
                  return {
                      'statusCode': 201,
                      'headers': {'Content-Type': 'application/json'},
                      'body': json.dumps({'message': 'Created'})
                  }

              return {
                  'statusCode': 404,
                  'body': 'Not Found'
              }

  # Log Group
  ApiHandlerLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ApiHandler}'
      RetentionInDays: !Ref LogRetentionDays

  # API Gateway Resources
  ItemsResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId: !Ref ApiGateway
      ParentId: !GetAtt ApiGateway.RootResourceId
      PathPart: items

  ItemsMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGateway
      ResourceId: !Ref ItemsResource
      HttpMethod: ANY
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ApiHandler.Arn}/invocations'

  # Lambda Permission
  LambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ApiHandler
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*'

  # API Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn: ItemsMethod
    Properties:
      RestApiId: !Ref ApiGateway

  ApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref ApiGateway
      DeploymentId: !Ref ApiDeployment
      StageName: !Ref EnvironmentName
      MethodSettings:
        - ResourcePath: /*
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true

  # DynamoDB Table
  DataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${EnvironmentName}-data'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true

Outputs:
  ApiUrl:
    Description: API Gateway URL
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentName}'
    Export:
      Name: !Sub '${AWS::StackName}-ApiUrl'

  TableName:
    Description: DynamoDB Table Name
    Value: !Ref DataTable
    Export:
      Name: !Sub '${AWS::StackName}-TableName'
```

---

## Anti-Patterns

### Hardcoded Values

```yaml
# Bad - Hardcoded values
Resources:
  SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: My security group
      VpcId: vpc-12345678  # Hardcoded VPC ID
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 203.0.113.50/32  # Hardcoded IP

# Good - Use parameters and references
Parameters:
  VpcId:
    Type: AWS::EC2::VPC::Id
  AllowedCidr:
    Type: String
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'

Resources:
  SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub '${EnvironmentName} security group'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedCidr
```

### Missing Tags

```yaml
# Bad - No tags
Resources:
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-bucket

# Good - Comprehensive tagging
Resources:
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-${AWS::AccountId}-data'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-data-bucket'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: !Ref CostCenter
        - Key: Owner
          Value: !Ref TeamName
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Project
          Value: !Ref ProjectName
```

### Overly Permissive IAM

```yaml
# Bad - Overly permissive
Resources:
  LambdaRole:
    Type: AWS::IAM::Role
    Properties:
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AdministratorAccess  # Never do this!

# Good - Least privilege
Resources:
  LambdaRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: MinimalAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub '${DataBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${FunctionName}:*'
```

### No Encryption

```yaml
# Bad - Unencrypted resources
Resources:
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-bucket
      # No encryption!

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.micro
      # StorageEncrypted: false (default)

# Good - Always encrypt
Resources:
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::AccountId}-encrypted-data'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref EncryptionKey

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.micro
      StorageEncrypted: true
      KmsKeyId: !Ref EncryptionKey
```

### Missing DeletionPolicy

```yaml
# Bad - No deletion policy (may lose data)
Resources:
  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: prod-database
      # DeletionPolicy defaults to Delete!

# Good - Protect critical resources
Resources:
  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentName}-database'
      DeletionProtection: true

  DataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub '${AWS::AccountId}-critical-data'
```

---

## Tool Configuration

### Pre-commit Configuration

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/aws-cloudformation/cfn-lint
    rev: v0.83.0
    hooks:
      - id: cfn-lint
        files: cloudformation/.*\.(yaml|yml|json)$

  - repo: https://github.com/stelligent/cfn_nag
    rev: v0.8.10
    hooks:
      - id: cfn-nag
        entry: cfn_nag_scan --input-path
        files: cloudformation/.*\.(yaml|yml|json)$

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-yaml
        args: ['--unsafe']
      - id: end-of-file-fixer
      - id: trailing-whitespace
```

### VS Code Settings

```json
{
  "yaml.schemas": {
    "https://raw.githubusercontent.com/awslabs/goformation/master/schema/cloudformation.schema.json": [
      "cloudformation/**/*.yaml",
      "cloudformation/**/*.yml"
    ]
  },
  "yaml.customTags": [
    "!Ref",
    "!Sub",
    "!GetAtt",
    "!Join sequence",
    "!Select sequence",
    "!Split sequence",
    "!If sequence",
    "!Equals sequence",
    "!Or sequence",
    "!And sequence",
    "!Not sequence",
    "!Condition",
    "!FindInMap sequence",
    "!Base64",
    "!Cidr sequence",
    "!ImportValue",
    "!GetAZs"
  ],
  "[yaml]": {
    "editor.defaultFormatter": "redhat.vscode-yaml",
    "editor.formatOnSave": true,
    "editor.tabSize": 2
  }
}
```

---

## References

### Official Documentation

- [AWS CloudFormation User Guide](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/)
- [CloudFormation Template Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-reference.html)
- [Intrinsic Function Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html)
- [CloudFormation Best Practices](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/best-practices.html)

### Tools

- [cfn-lint](https://github.com/aws-cloudformation/cfn-lint) - CloudFormation linter
- [cfn-nag](https://github.com/stelligent/cfn_nag) - Security scanner
- [TaskCat](https://github.com/aws-ia/taskcat) - Testing framework
- [cfn-diagram](https://github.com/mhlabs/cfn-diagram) - Visualization tool

### Related Guides

- [AWS CDK Style Guide](cdk.md)
- [Terraform Style Guide](terraform.md)
- [YAML Style Guide](yaml.md)

---

**Status**: Active
