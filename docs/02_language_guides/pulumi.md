---
title: "Pulumi Style Guide"
description: "Infrastructure as Code standards for Pulumi using TypeScript, Python, and Go"
author: "Tyler Dukes"
tags: [pulumi, iac, infrastructure-as-code, typescript, python, go, multi-cloud]
category: "Language Guides"
status: "active"
---

## Language Overview

**Pulumi** is an Infrastructure as Code (IaC) platform that enables defining, deploying, and managing cloud
infrastructure using familiar programming languages like TypeScript, Python, Go, C#, and Java.

### Key Characteristics

- **Languages**: TypeScript (preferred), Python, Go, C#, Java, YAML
- **Paradigm**: Imperative infrastructure as code with declarative state management
- **Type System**: Full type safety in supported languages
- **State Management**: Pulumi Cloud, S3, Azure Blob, GCS, or local backends
- **Provider Ecosystem**: 100+ providers including AWS, Azure, GCP, Kubernetes
- **Version Support**: Targets Pulumi CLI **3.x**

### Primary Use Cases

- Multi-cloud infrastructure provisioning (AWS, Azure, GCP)
- Kubernetes cluster and resource management
- Serverless application infrastructure
- Network and security infrastructure
- Database and storage provisioning
- CI/CD pipeline infrastructure

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Naming** | | | |
| Projects | `kebab-case` | `my-web-app`, `vpc-network` | Project directory names |
| Stacks | `kebab-case` | `dev`, `staging`, `prod` | Environment names |
| Resources | `camelCase` | `mainVpc`, `webServer` | Resource variable names |
| Components | `PascalCase` | `VpcNetwork`, `WebCluster` | Component class names |
| Config Keys | `camelCase` | `instanceType`, `dbPassword` | Configuration keys |
| **Files (TypeScript)** | | | |
| Entry Point | `index.ts` | `index.ts` | Main Pulumi program |
| Components | `component-name.ts` | `vpc-network.ts` | Component definitions |
| Config | `config.ts` | `config.ts` | Configuration helpers |
| **Files (Python)** | | | |
| Entry Point | `__main__.py` | `__main__.py` | Main Pulumi program |
| Components | `component_name.py` | `vpc_network.py` | Component definitions |
| **Files (Go)** | | | |
| Entry Point | `main.go` | `main.go` | Main Pulumi program |
| Components | `component_name.go` | `vpc_network.go` | Component definitions |
| **Project Structure** | | | |
| Config | `Pulumi.yaml` | `Pulumi.yaml` | Project configuration |
| Stack Config | `Pulumi.<stack>.yaml` | `Pulumi.dev.yaml` | Stack-specific config |
| **Best Practices** | | | |
| TypeScript | Preferred language | Type safety, IDE support | Best developer experience |
| Components | Use ComponentResource | Reusable patterns | Encapsulate resources |
| Secrets | Use Pulumi secrets | `pulumi config set --secret` | Encrypted in state |
| Outputs | Export important values | `export const vpcId = vpc.id` | Cross-stack references |

---

## Project Structure

### TypeScript Project

```text
my-pulumi-project/
├── index.ts                    # Main entry point
├── components/                 # Reusable components
│   ├── vpc-network.ts
│   ├── database-cluster.ts
│   └── web-server.ts
├── config/                     # Configuration helpers
│   └── index.ts
├── types/                      # Type definitions
│   └── index.ts
├── Pulumi.yaml                 # Project configuration
├── Pulumi.dev.yaml             # Dev stack configuration
├── Pulumi.staging.yaml         # Staging stack configuration
├── Pulumi.prod.yaml            # Production stack configuration
├── package.json
├── tsconfig.json
└── test/
    └── index.test.ts           # Unit tests
```

### Python Project

```text
my-pulumi-project/
├── __main__.py                 # Main entry point
├── components/                 # Reusable components
│   ├── __init__.py
│   ├── vpc_network.py
│   ├── database_cluster.py
│   └── web_server.py
├── config/                     # Configuration helpers
│   ├── __init__.py
│   └── settings.py
├── Pulumi.yaml                 # Project configuration
├── Pulumi.dev.yaml             # Dev stack configuration
├── Pulumi.prod.yaml            # Production stack configuration
├── requirements.txt            # Python dependencies
├── pyproject.toml              # Project metadata
└── tests/
    └── test_components.py      # Unit tests
```

### Go Project

```text
my-pulumi-project/
├── main.go                     # Main entry point
├── components/                 # Reusable components
│   ├── vpc_network.go
│   ├── database_cluster.go
│   └── web_server.go
├── config/                     # Configuration helpers
│   └── config.go
├── Pulumi.yaml                 # Project configuration
├── Pulumi.dev.yaml             # Dev stack configuration
├── Pulumi.prod.yaml            # Production stack configuration
├── go.mod                      # Go module
├── go.sum                      # Go dependencies
└── tests/
    └── main_test.go            # Unit tests
```

---

## Basic Infrastructure

### TypeScript: Basic AWS VPC

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Get configuration
const config = new pulumi.Config();
const environment = pulumi.getStack();
const projectName = pulumi.getProject();

// Common tags for all resources
const commonTags = {
  Environment: environment,
  Project: projectName,
  ManagedBy: 'pulumi',
};

// Create VPC
const vpc = new aws.ec2.Vpc('main-vpc', {
  cidrBlock: config.get('vpcCidr') || '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    ...commonTags,
    Name: `${projectName}-${environment}-vpc`,
  },
});

// Create Internet Gateway
const igw = new aws.ec2.InternetGateway('main-igw', {
  vpcId: vpc.id,
  tags: {
    ...commonTags,
    Name: `${projectName}-${environment}-igw`,
  },
});

// Create public subnets across availability zones
const publicSubnets: aws.ec2.Subnet[] = [];
const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

availabilityZones.forEach((az, index) => {
  const subnet = new aws.ec2.Subnet(`public-subnet-${index}`, {
    vpcId: vpc.id,
    cidrBlock: `10.0.${index}.0/24`,
    availabilityZone: az,
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: `${projectName}-${environment}-public-${az}`,
      Type: 'public',
    },
  });
  publicSubnets.push(subnet);
});

// Create private subnets
const privateSubnets: aws.ec2.Subnet[] = [];

availabilityZones.forEach((az, index) => {
  const subnet = new aws.ec2.Subnet(`private-subnet-${index}`, {
    vpcId: vpc.id,
    cidrBlock: `10.0.${index + 10}.0/24`,
    availabilityZone: az,
    tags: {
      ...commonTags,
      Name: `${projectName}-${environment}-private-${az}`,
      Type: 'private',
    },
  });
  privateSubnets.push(subnet);
});

// Create public route table
const publicRouteTable = new aws.ec2.RouteTable('public-rt', {
  vpcId: vpc.id,
  routes: [
    {
      cidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    },
  ],
  tags: {
    ...commonTags,
    Name: `${projectName}-${environment}-public-rt`,
  },
});

// Associate public subnets with public route table
publicSubnets.forEach((subnet, index) => {
  new aws.ec2.RouteTableAssociation(`public-rta-${index}`, {
    subnetId: subnet.id,
    routeTableId: publicRouteTable.id,
  });
});

// Export outputs
export const vpcId = vpc.id;
export const vpcCidr = vpc.cidrBlock;
export const publicSubnetIds = publicSubnets.map((s) => s.id);
export const privateSubnetIds = privateSubnets.map((s) => s.id);
```

### Python: Basic AWS VPC

```python
import pulumi
import pulumi_aws as aws

# Get configuration
config = pulumi.Config()
environment = pulumi.get_stack()
project_name = pulumi.get_project()

# Common tags for all resources
common_tags = {
    "Environment": environment,
    "Project": project_name,
    "ManagedBy": "pulumi",
}

# Create VPC
vpc = aws.ec2.Vpc(
    "main-vpc",
    cidr_block=config.get("vpc_cidr") or "10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        **common_tags,
        "Name": f"{project_name}-{environment}-vpc",
    },
)

# Create Internet Gateway
igw = aws.ec2.InternetGateway(
    "main-igw",
    vpc_id=vpc.id,
    tags={
        **common_tags,
        "Name": f"{project_name}-{environment}-igw",
    },
)

# Create public subnets across availability zones
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnets = []

for index, az in enumerate(availability_zones):
    subnet = aws.ec2.Subnet(
        f"public-subnet-{index}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{index}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={
            **common_tags,
            "Name": f"{project_name}-{environment}-public-{az}",
            "Type": "public",
        },
    )
    public_subnets.append(subnet)

# Create private subnets
private_subnets = []

for index, az in enumerate(availability_zones):
    subnet = aws.ec2.Subnet(
        f"private-subnet-{index}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{index + 10}.0/24",
        availability_zone=az,
        tags={
            **common_tags,
            "Name": f"{project_name}-{environment}-private-{az}",
            "Type": "private",
        },
    )
    private_subnets.append(subnet)

# Create public route table
public_route_table = aws.ec2.RouteTable(
    "public-rt",
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
        )
    ],
    tags={
        **common_tags,
        "Name": f"{project_name}-{environment}-public-rt",
    },
)

# Associate public subnets with public route table
for index, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
        f"public-rta-{index}",
        subnet_id=subnet.id,
        route_table_id=public_route_table.id,
    )

# Export outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("vpc_cidr", vpc.cidr_block)
pulumi.export("public_subnet_ids", [s.id for s in public_subnets])
pulumi.export("private_subnet_ids", [s.id for s in private_subnets])
```

### Go: Basic AWS VPC

```go
package main

import (
    "fmt"

    "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi"
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
    pulumi.Run(func(ctx *pulumi.Context) error {
        // Get configuration
        cfg := config.New(ctx, "")
        environment := ctx.Stack()
        projectName := ctx.Project()

        // Common tags for all resources
        commonTags := pulumi.StringMap{
            "Environment": pulumi.String(environment),
            "Project":     pulumi.String(projectName),
            "ManagedBy":   pulumi.String("pulumi"),
        }

        // Get VPC CIDR from config or use default
        vpcCidr := cfg.Get("vpcCidr")
        if vpcCidr == "" {
            vpcCidr = "10.0.0.0/16"
        }

        // Create VPC
        vpc, err := ec2.NewVpc(ctx, "main-vpc", &ec2.VpcArgs{
            CidrBlock:          pulumi.String(vpcCidr),
            EnableDnsHostnames: pulumi.Bool(true),
            EnableDnsSupport:   pulumi.Bool(true),
            Tags: pulumi.StringMap{
                "Environment": commonTags["Environment"],
                "Project":     commonTags["Project"],
                "ManagedBy":   commonTags["ManagedBy"],
                "Name":        pulumi.Sprintf("%s-%s-vpc", projectName, environment),
            },
        })
        if err != nil {
            return err
        }

        // Create Internet Gateway
        igw, err := ec2.NewInternetGateway(ctx, "main-igw", &ec2.InternetGatewayArgs{
            VpcId: vpc.ID(),
            Tags: pulumi.StringMap{
                "Environment": commonTags["Environment"],
                "Project":     commonTags["Project"],
                "ManagedBy":   commonTags["ManagedBy"],
                "Name":        pulumi.Sprintf("%s-%s-igw", projectName, environment),
            },
        })
        if err != nil {
            return err
        }

        // Create public subnets
        availabilityZones := []string{"us-east-1a", "us-east-1b", "us-east-1c"}
        publicSubnetIds := pulumi.StringArray{}

        for i, az := range availabilityZones {
            subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("public-subnet-%d", i), &ec2.SubnetArgs{
                VpcId:               vpc.ID(),
                CidrBlock:           pulumi.Sprintf("10.0.%d.0/24", i),
                AvailabilityZone:    pulumi.String(az),
                MapPublicIpOnLaunch: pulumi.Bool(true),
                Tags: pulumi.StringMap{
                    "Environment": commonTags["Environment"],
                    "Project":     commonTags["Project"],
                    "ManagedBy":   commonTags["ManagedBy"],
                    "Name":        pulumi.Sprintf("%s-%s-public-%s", projectName, environment, az),
                    "Type":        pulumi.String("public"),
                },
            })
            if err != nil {
                return err
            }
            publicSubnetIds = append(publicSubnetIds, subnet.ID())
        }

        // Create private subnets
        privateSubnetIds := pulumi.StringArray{}

        for i, az := range availabilityZones {
            subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("private-subnet-%d", i), &ec2.SubnetArgs{
                VpcId:            vpc.ID(),
                CidrBlock:        pulumi.Sprintf("10.0.%d.0/24", i+10),
                AvailabilityZone: pulumi.String(az),
                Tags: pulumi.StringMap{
                    "Environment": commonTags["Environment"],
                    "Project":     commonTags["Project"],
                    "ManagedBy":   commonTags["ManagedBy"],
                    "Name":        pulumi.Sprintf("%s-%s-private-%s", projectName, environment, az),
                    "Type":        pulumi.String("private"),
                },
            })
            if err != nil {
                return err
            }
            privateSubnetIds = append(privateSubnetIds, subnet.ID())
        }

        // Create public route table
        publicRouteTable, err := ec2.NewRouteTable(ctx, "public-rt", &ec2.RouteTableArgs{
            VpcId: vpc.ID(),
            Routes: ec2.RouteTableRouteArray{
                &ec2.RouteTableRouteArgs{
                    CidrBlock: pulumi.String("0.0.0.0/0"),
                    GatewayId: igw.ID(),
                },
            },
            Tags: pulumi.StringMap{
                "Environment": commonTags["Environment"],
                "Project":     commonTags["Project"],
                "ManagedBy":   commonTags["ManagedBy"],
                "Name":        pulumi.Sprintf("%s-%s-public-rt", projectName, environment),
            },
        })
        if err != nil {
            return err
        }

        // Associate public subnets with route table
        for i := range availabilityZones {
            _, err := ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("public-rta-%d", i),
                &ec2.RouteTableAssociationArgs{
                    SubnetId:     publicSubnetIds[i],
                    RouteTableId: publicRouteTable.ID(),
                })
            if err != nil {
                return err
            }
        }

        // Export outputs
        ctx.Export("vpcId", vpc.ID())
        ctx.Export("vpcCidr", vpc.CidrBlock)
        ctx.Export("publicSubnetIds", publicSubnetIds)
        ctx.Export("privateSubnetIds", privateSubnetIds)

        return nil
    })
}
```

---

## Component Resources

### TypeScript: Reusable VPC Component

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Component input properties interface
export interface VpcNetworkArgs {
  cidrBlock: string;
  availabilityZones: string[];
  enableNatGateway?: boolean;
  singleNatGateway?: boolean;
  tags?: { [key: string]: string };
}

// VPC Network Component Resource
export class VpcNetwork extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(
    name: string,
    args: VpcNetworkArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:network:VpcNetwork', name, {}, opts);

    const defaultTags = args.tags || {};

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: args.cidrBlock,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...defaultTags,
          Name: `${name}-vpc`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...defaultTags,
          Name: `${name}-igw`,
        },
      },
      { parent: this }
    );

    // Create public subnets
    this.publicSubnets = args.availabilityZones.map((az, index) => {
      return new aws.ec2.Subnet(
        `${name}-public-${index}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...defaultTags,
            Name: `${name}-public-${az}`,
            Type: 'public',
          },
        },
        { parent: this }
      );
    });

    // Create private subnets
    this.privateSubnets = args.availabilityZones.map((az, index) => {
      return new aws.ec2.Subnet(
        `${name}-private-${index}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index + 10}.0/24`,
          availabilityZone: az,
          tags: {
            ...defaultTags,
            Name: `${name}-private-${az}`,
            Type: 'private',
          },
        },
        { parent: this }
      );
    });

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt`,
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: this.internetGateway.id,
          },
        ],
        tags: {
          ...defaultTags,
          Name: `${name}-public-rt`,
        },
      },
      { parent: this }
    );

    // Associate public subnets
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `${name}-public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create NAT Gateways if enabled
    this.natGateways = [];
    if (args.enableNatGateway) {
      const natCount = args.singleNatGateway ? 1 : args.availabilityZones.length;

      for (let i = 0; i < natCount; i++) {
        const eip = new aws.ec2.Eip(
          `${name}-nat-eip-${i}`,
          {
            domain: 'vpc',
            tags: {
              ...defaultTags,
              Name: `${name}-nat-eip-${i}`,
            },
          },
          { parent: this }
        );

        const natGateway = new aws.ec2.NatGateway(
          `${name}-nat-${i}`,
          {
            allocationId: eip.id,
            subnetId: this.publicSubnets[i].id,
            tags: {
              ...defaultTags,
              Name: `${name}-nat-${i}`,
            },
          },
          { parent: this, dependsOn: [this.internetGateway] }
        );

        this.natGateways.push(natGateway);
      }

      // Create private route tables with NAT Gateway routes
      this.privateSubnets.forEach((subnet, index) => {
        const natIndex = args.singleNatGateway ? 0 : index;
        const privateRouteTable = new aws.ec2.RouteTable(
          `${name}-private-rt-${index}`,
          {
            vpcId: this.vpc.id,
            routes: [
              {
                cidrBlock: '0.0.0.0/0',
                natGatewayId: this.natGateways[natIndex].id,
              },
            ],
            tags: {
              ...defaultTags,
              Name: `${name}-private-rt-${index}`,
            },
          },
          { parent: this }
        );

        new aws.ec2.RouteTableAssociation(
          `${name}-private-rta-${index}`,
          {
            subnetId: subnet.id,
            routeTableId: privateRouteTable.id,
          },
          { parent: this }
        );
      });
    }

    // Export convenience properties
    this.vpcId = this.vpc.id;
    this.publicSubnetIds = this.publicSubnets.map((s) => s.id);
    this.privateSubnetIds = this.privateSubnets.map((s) => s.id);

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}

// Usage example
const network = new VpcNetwork('production', {
  cidrBlock: '10.0.0.0/16',
  availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
  enableNatGateway: true,
  singleNatGateway: false,
  tags: {
    Environment: 'production',
    Team: 'platform',
  },
});

export const vpcId = network.vpcId;
export const publicSubnetIds = network.publicSubnetIds;
export const privateSubnetIds = network.privateSubnetIds;
```

### Python: Reusable VPC Component

```python
import pulumi
from pulumi import ComponentResource, ResourceOptions
import pulumi_aws as aws
from typing import Optional, List, Dict


class VpcNetworkArgs:
    """Arguments for VpcNetwork component."""

    def __init__(
        self,
        cidr_block: str,
        availability_zones: List[str],
        enable_nat_gateway: bool = False,
        single_nat_gateway: bool = True,
        tags: Optional[Dict[str, str]] = None,
    ):
        self.cidr_block = cidr_block
        self.availability_zones = availability_zones
        self.enable_nat_gateway = enable_nat_gateway
        self.single_nat_gateway = single_nat_gateway
        self.tags = tags or {}


class VpcNetwork(ComponentResource):
    """Reusable VPC Network component."""

    def __init__(
        self,
        name: str,
        args: VpcNetworkArgs,
        opts: Optional[ResourceOptions] = None,
    ):
        super().__init__("custom:network:VpcNetwork", name, {}, opts)

        default_tags = args.tags

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"{name}-vpc",
            cidr_block=args.cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **default_tags,
                "Name": f"{name}-vpc",
            },
            opts=ResourceOptions(parent=self),
        )

        # Create Internet Gateway
        self.internet_gateway = aws.ec2.InternetGateway(
            f"{name}-igw",
            vpc_id=self.vpc.id,
            tags={
                **default_tags,
                "Name": f"{name}-igw",
            },
            opts=ResourceOptions(parent=self),
        )

        # Create public subnets
        self.public_subnets: List[aws.ec2.Subnet] = []
        for index, az in enumerate(args.availability_zones):
            subnet = aws.ec2.Subnet(
                f"{name}-public-{index}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{index}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **default_tags,
                    "Name": f"{name}-public-{az}",
                    "Type": "public",
                },
                opts=ResourceOptions(parent=self),
            )
            self.public_subnets.append(subnet)

        # Create private subnets
        self.private_subnets: List[aws.ec2.Subnet] = []
        for index, az in enumerate(args.availability_zones):
            subnet = aws.ec2.Subnet(
                f"{name}-private-{index}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{index + 10}.0/24",
                availability_zone=az,
                tags={
                    **default_tags,
                    "Name": f"{name}-private-{az}",
                    "Type": "private",
                },
                opts=ResourceOptions(parent=self),
            )
            self.private_subnets.append(subnet)

        # Create public route table
        public_route_table = aws.ec2.RouteTable(
            f"{name}-public-rt",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.internet_gateway.id,
                )
            ],
            tags={
                **default_tags,
                "Name": f"{name}-public-rt",
            },
            opts=ResourceOptions(parent=self),
        )

        # Associate public subnets
        for index, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{name}-public-rta-{index}",
                subnet_id=subnet.id,
                route_table_id=public_route_table.id,
                opts=ResourceOptions(parent=self),
            )

        # Create NAT Gateways if enabled
        self.nat_gateways: List[aws.ec2.NatGateway] = []
        if args.enable_nat_gateway:
            nat_count = 1 if args.single_nat_gateway else len(args.availability_zones)

            for i in range(nat_count):
                eip = aws.ec2.Eip(
                    f"{name}-nat-eip-{i}",
                    domain="vpc",
                    tags={
                        **default_tags,
                        "Name": f"{name}-nat-eip-{i}",
                    },
                    opts=ResourceOptions(parent=self),
                )

                nat_gateway = aws.ec2.NatGateway(
                    f"{name}-nat-{i}",
                    allocation_id=eip.id,
                    subnet_id=self.public_subnets[i].id,
                    tags={
                        **default_tags,
                        "Name": f"{name}-nat-{i}",
                    },
                    opts=ResourceOptions(
                        parent=self, depends_on=[self.internet_gateway]
                    ),
                )
                self.nat_gateways.append(nat_gateway)

            # Create private route tables with NAT Gateway routes
            for index, subnet in enumerate(self.private_subnets):
                nat_index = 0 if args.single_nat_gateway else index
                private_route_table = aws.ec2.RouteTable(
                    f"{name}-private-rt-{index}",
                    vpc_id=self.vpc.id,
                    routes=[
                        aws.ec2.RouteTableRouteArgs(
                            cidr_block="0.0.0.0/0",
                            nat_gateway_id=self.nat_gateways[nat_index].id,
                        )
                    ],
                    tags={
                        **default_tags,
                        "Name": f"{name}-private-rt-{index}",
                    },
                    opts=ResourceOptions(parent=self),
                )

                aws.ec2.RouteTableAssociation(
                    f"{name}-private-rta-{index}",
                    subnet_id=subnet.id,
                    route_table_id=private_route_table.id,
                    opts=ResourceOptions(parent=self),
                )

        # Export convenience properties
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [s.id for s in self.public_subnets]
        self.private_subnet_ids = [s.id for s in self.private_subnets]

        # Register outputs
        self.register_outputs(
            {
                "vpc_id": self.vpc_id,
                "public_subnet_ids": self.public_subnet_ids,
                "private_subnet_ids": self.private_subnet_ids,
            }
        )


# Usage example
network = VpcNetwork(
    "production",
    VpcNetworkArgs(
        cidr_block="10.0.0.0/16",
        availability_zones=["us-east-1a", "us-east-1b", "us-east-1c"],
        enable_nat_gateway=True,
        single_nat_gateway=False,
        tags={
            "Environment": "production",
            "Team": "platform",
        },
    ),
)

pulumi.export("vpc_id", network.vpc_id)
pulumi.export("public_subnet_ids", network.public_subnet_ids)
pulumi.export("private_subnet_ids", network.private_subnet_ids)
```

### Go: Reusable VPC Component

```go
package components

import (
    "fmt"

    "github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// VpcNetworkArgs contains the arguments for the VpcNetwork component
type VpcNetworkArgs struct {
    CidrBlock          string
    AvailabilityZones  []string
    EnableNatGateway   bool
    SingleNatGateway   bool
    Tags               map[string]string
}

// VpcNetwork is a reusable component for VPC infrastructure
type VpcNetwork struct {
    pulumi.ResourceState

    Vpc              *ec2.Vpc
    InternetGateway  *ec2.InternetGateway
    PublicSubnets    []*ec2.Subnet
    PrivateSubnets   []*ec2.Subnet
    NatGateways      []*ec2.NatGateway
    VpcId            pulumi.IDOutput
    PublicSubnetIds  pulumi.StringArrayOutput
    PrivateSubnetIds pulumi.StringArrayOutput
}

// NewVpcNetwork creates a new VPC network component
func NewVpcNetwork(
    ctx *pulumi.Context,
    name string,
    args *VpcNetworkArgs,
    opts ...pulumi.ResourceOption,
) (*VpcNetwork, error) {
    component := &VpcNetwork{}
    err := ctx.RegisterComponentResource("custom:network:VpcNetwork", name, component, opts...)
    if err != nil {
        return nil, err
    }

    defaultTags := pulumi.StringMap{}
    for k, v := range args.Tags {
        defaultTags[k] = pulumi.String(v)
    }

    // Create VPC
    vpc, err := ec2.NewVpc(ctx, fmt.Sprintf("%s-vpc", name), &ec2.VpcArgs{
        CidrBlock:          pulumi.String(args.CidrBlock),
        EnableDnsHostnames: pulumi.Bool(true),
        EnableDnsSupport:   pulumi.Bool(true),
        Tags: pulumi.StringMap{
            "Name": pulumi.Sprintf("%s-vpc", name),
        }.ToStringMapOutput().ApplyT(func(m map[string]string) map[string]string {
            for k, v := range args.Tags {
                m[k] = v
            }
            return m
        }).(pulumi.StringMapOutput),
    }, pulumi.Parent(component))
    if err != nil {
        return nil, err
    }
    component.Vpc = vpc
    component.VpcId = vpc.ID()

    // Create Internet Gateway
    igw, err := ec2.NewInternetGateway(ctx, fmt.Sprintf("%s-igw", name), &ec2.InternetGatewayArgs{
        VpcId: vpc.ID(),
        Tags: pulumi.StringMap{
            "Name": pulumi.Sprintf("%s-igw", name),
        },
    }, pulumi.Parent(component))
    if err != nil {
        return nil, err
    }
    component.InternetGateway = igw

    // Create public subnets
    publicSubnetIds := pulumi.StringArray{}
    for i, az := range args.AvailabilityZones {
        subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("%s-public-%d", name, i), &ec2.SubnetArgs{
            VpcId:               vpc.ID(),
            CidrBlock:           pulumi.Sprintf("10.0.%d.0/24", i),
            AvailabilityZone:    pulumi.String(az),
            MapPublicIpOnLaunch: pulumi.Bool(true),
            Tags: pulumi.StringMap{
                "Name": pulumi.Sprintf("%s-public-%s", name, az),
                "Type": pulumi.String("public"),
            },
        }, pulumi.Parent(component))
        if err != nil {
            return nil, err
        }
        component.PublicSubnets = append(component.PublicSubnets, subnet)
        publicSubnetIds = append(publicSubnetIds, subnet.ID())
    }
    component.PublicSubnetIds = publicSubnetIds.ToStringArrayOutput()

    // Create private subnets
    privateSubnetIds := pulumi.StringArray{}
    for i, az := range args.AvailabilityZones {
        subnet, err := ec2.NewSubnet(ctx, fmt.Sprintf("%s-private-%d", name, i), &ec2.SubnetArgs{
            VpcId:            vpc.ID(),
            CidrBlock:        pulumi.Sprintf("10.0.%d.0/24", i+10),
            AvailabilityZone: pulumi.String(az),
            Tags: pulumi.StringMap{
                "Name": pulumi.Sprintf("%s-private-%s", name, az),
                "Type": pulumi.String("private"),
            },
        }, pulumi.Parent(component))
        if err != nil {
            return nil, err
        }
        component.PrivateSubnets = append(component.PrivateSubnets, subnet)
        privateSubnetIds = append(privateSubnetIds, subnet.ID())
    }
    component.PrivateSubnetIds = privateSubnetIds.ToStringArrayOutput()

    // Create public route table
    publicRouteTable, err := ec2.NewRouteTable(ctx, fmt.Sprintf("%s-public-rt", name), &ec2.RouteTableArgs{
        VpcId: vpc.ID(),
        Routes: ec2.RouteTableRouteArray{
            &ec2.RouteTableRouteArgs{
                CidrBlock: pulumi.String("0.0.0.0/0"),
                GatewayId: igw.ID(),
            },
        },
        Tags: pulumi.StringMap{
            "Name": pulumi.Sprintf("%s-public-rt", name),
        },
    }, pulumi.Parent(component))
    if err != nil {
        return nil, err
    }

    // Associate public subnets
    for i, subnet := range component.PublicSubnets {
        _, err := ec2.NewRouteTableAssociation(ctx, fmt.Sprintf("%s-public-rta-%d", name, i),
            &ec2.RouteTableAssociationArgs{
                SubnetId:     subnet.ID(),
                RouteTableId: publicRouteTable.ID(),
            }, pulumi.Parent(component))
        if err != nil {
            return nil, err
        }
    }

    // Register outputs
    ctx.RegisterResourceOutputs(component, pulumi.Map{
        "vpcId":            component.VpcId,
        "publicSubnetIds":  component.PublicSubnetIds,
        "privateSubnetIds": component.PrivateSubnetIds,
    })

    return component, nil
}
```

---

## Multi-Cloud Patterns

### TypeScript: Multi-Cloud Storage

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as azure from '@pulumi/azure-native';
import * as gcp from '@pulumi/gcp';

const config = new pulumi.Config();
const cloudProvider = config.require('cloudProvider'); // aws, azure, or gcp
const environment = pulumi.getStack();

// Common interface for storage outputs
interface StorageOutputs {
  bucketName: pulumi.Output<string>;
  bucketArn: pulumi.Output<string>;
}

function createAwsStorage(): StorageOutputs {
  const bucket = new aws.s3.BucketV2('app-storage', {
    bucket: `myapp-${environment}-storage`,
    tags: {
      Environment: environment,
      ManagedBy: 'pulumi',
    },
  });

  new aws.s3.BucketVersioningV2('app-storage-versioning', {
    bucket: bucket.id,
    versioningConfiguration: {
      status: 'Enabled',
    },
  });

  new aws.s3.BucketServerSideEncryptionConfigurationV2('app-storage-encryption', {
    bucket: bucket.id,
    rules: [
      {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
      },
    ],
  });

  new aws.s3.BucketPublicAccessBlock('app-storage-public-access', {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  });

  return {
    bucketName: bucket.id,
    bucketArn: bucket.arn,
  };
}

function createAzureStorage(): StorageOutputs {
  const resourceGroup = new azure.resources.ResourceGroup('app-rg', {
    resourceGroupName: `myapp-${environment}-rg`,
    location: 'eastus',
    tags: {
      Environment: environment,
      ManagedBy: 'pulumi',
    },
  });

  const storageAccount = new azure.storage.StorageAccount('appstorage', {
    resourceGroupName: resourceGroup.name,
    accountName: `myapp${environment}storage`,
    location: resourceGroup.location,
    sku: {
      name: 'Standard_LRS',
    },
    kind: 'StorageV2',
    enableHttpsTrafficOnly: true,
    minimumTlsVersion: 'TLS1_2',
    tags: {
      Environment: environment,
      ManagedBy: 'pulumi',
    },
  });

  const container = new azure.storage.BlobContainer('app-container', {
    resourceGroupName: resourceGroup.name,
    accountName: storageAccount.name,
    containerName: 'app-data',
    publicAccess: 'None',
  });

  return {
    bucketName: container.name,
    bucketArn: storageAccount.id,
  };
}

function createGcpStorage(): StorageOutputs {
  const bucket = new gcp.storage.Bucket('app-storage', {
    name: `myapp-${environment}-storage`,
    location: 'US',
    uniformBucketLevelAccess: true,
    versioning: {
      enabled: true,
    },
    labels: {
      environment: environment,
      managed_by: 'pulumi',
    },
  });

  return {
    bucketName: bucket.name,
    bucketArn: bucket.selfLink,
  };
}

// Create storage based on cloud provider
let storage: StorageOutputs;
switch (cloudProvider) {
  case 'aws':
    storage = createAwsStorage();
    break;
  case 'azure':
    storage = createAzureStorage();
    break;
  case 'gcp':
    storage = createGcpStorage();
    break;
  default:
    throw new Error(`Unsupported cloud provider: ${cloudProvider}`);
}

export const bucketName = storage.bucketName;
export const bucketArn = storage.bucketArn;
```

### TypeScript: Kubernetes Deployment

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as k8s from '@pulumi/kubernetes';

const config = new pulumi.Config();
const appName = config.get('appName') || 'my-app';
const appImage = config.require('appImage');
const replicas = config.getNumber('replicas') || 3;
const environment = pulumi.getStack();

// Create namespace
const namespace = new k8s.core.v1.Namespace('app-namespace', {
  metadata: {
    name: `${appName}-${environment}`,
    labels: {
      app: appName,
      environment: environment,
    },
  },
});

// Create ConfigMap
const configMap = new k8s.core.v1.ConfigMap('app-config', {
  metadata: {
    name: `${appName}-config`,
    namespace: namespace.metadata.name,
  },
  data: {
    LOG_LEVEL: 'info',
    ENVIRONMENT: environment,
  },
});

// Create Secret
const secret = new k8s.core.v1.Secret('app-secret', {
  metadata: {
    name: `${appName}-secret`,
    namespace: namespace.metadata.name,
  },
  type: 'Opaque',
  stringData: {
    DATABASE_URL: config.requireSecret('databaseUrl'),
    API_KEY: config.requireSecret('apiKey'),
  },
});

// Create Deployment
const deployment = new k8s.apps.v1.Deployment('app-deployment', {
  metadata: {
    name: appName,
    namespace: namespace.metadata.name,
    labels: {
      app: appName,
    },
  },
  spec: {
    replicas: replicas,
    selector: {
      matchLabels: {
        app: appName,
      },
    },
    template: {
      metadata: {
        labels: {
          app: appName,
          version: 'v1',
        },
        annotations: {
          'prometheus.io/scrape': 'true',
          'prometheus.io/port': '8080',
        },
      },
      spec: {
        containers: [
          {
            name: appName,
            image: appImage,
            ports: [
              {
                containerPort: 8080,
                name: 'http',
              },
            ],
            envFrom: [
              {
                configMapRef: {
                  name: configMap.metadata.name,
                },
              },
              {
                secretRef: {
                  name: secret.metadata.name,
                },
              },
            ],
            resources: {
              requests: {
                cpu: '100m',
                memory: '128Mi',
              },
              limits: {
                cpu: '500m',
                memory: '512Mi',
              },
            },
            livenessProbe: {
              httpGet: {
                path: '/health',
                port: 'http',
              },
              initialDelaySeconds: 30,
              periodSeconds: 10,
            },
            readinessProbe: {
              httpGet: {
                path: '/ready',
                port: 'http',
              },
              initialDelaySeconds: 5,
              periodSeconds: 5,
            },
            securityContext: {
              runAsNonRoot: true,
              runAsUser: 1000,
              readOnlyRootFilesystem: true,
              allowPrivilegeEscalation: false,
            },
          },
        ],
        serviceAccountName: appName,
        securityContext: {
          fsGroup: 1000,
        },
      },
    },
  },
});

// Create Service
const service = new k8s.core.v1.Service('app-service', {
  metadata: {
    name: appName,
    namespace: namespace.metadata.name,
    labels: {
      app: appName,
    },
  },
  spec: {
    type: 'ClusterIP',
    ports: [
      {
        port: 80,
        targetPort: 8080,
        protocol: 'TCP',
        name: 'http',
      },
    ],
    selector: {
      app: appName,
    },
  },
});

// Create HorizontalPodAutoscaler
const hpa = new k8s.autoscaling.v2.HorizontalPodAutoscaler('app-hpa', {
  metadata: {
    name: `${appName}-hpa`,
    namespace: namespace.metadata.name,
  },
  spec: {
    scaleTargetRef: {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      name: deployment.metadata.name,
    },
    minReplicas: replicas,
    maxReplicas: replicas * 3,
    metrics: [
      {
        type: 'Resource',
        resource: {
          name: 'cpu',
          target: {
            type: 'Utilization',
            averageUtilization: 70,
          },
        },
      },
      {
        type: 'Resource',
        resource: {
          name: 'memory',
          target: {
            type: 'Utilization',
            averageUtilization: 80,
          },
        },
      },
    ],
  },
});

// Create ServiceAccount
const serviceAccount = new k8s.core.v1.ServiceAccount('app-sa', {
  metadata: {
    name: appName,
    namespace: namespace.metadata.name,
  },
});

// Create Ingress
const ingress = new k8s.networking.v1.Ingress('app-ingress', {
  metadata: {
    name: `${appName}-ingress`,
    namespace: namespace.metadata.name,
    annotations: {
      'kubernetes.io/ingress.class': 'nginx',
      'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
      'nginx.ingress.kubernetes.io/ssl-redirect': 'true',
    },
  },
  spec: {
    tls: [
      {
        hosts: [`${appName}.example.com`],
        secretName: `${appName}-tls`,
      },
    ],
    rules: [
      {
        host: `${appName}.example.com`,
        http: {
          paths: [
            {
              path: '/',
              pathType: 'Prefix',
              backend: {
                service: {
                  name: service.metadata.name,
                  port: {
                    number: 80,
                  },
                },
              },
            },
          ],
        },
      },
    ],
  },
});

export const namespaceName = namespace.metadata.name;
export const deploymentName = deployment.metadata.name;
export const serviceName = service.metadata.name;
export const ingressHost = ingress.spec.rules[0].host;
```

---

## Configuration Management

### Stack Configuration

```yaml
# Pulumi.yaml - Project configuration
name: my-infrastructure
runtime: nodejs
description: Production infrastructure for MyApp
config:
  pulumi:tags:
    value:
      pulumi:template: aws-typescript

# Pulumi.dev.yaml - Development stack
config:
  aws:region: us-east-1
  my-infrastructure:vpcCidr: 10.0.0.0/16
  my-infrastructure:instanceType: t3.micro
  my-infrastructure:minInstances: "1"
  my-infrastructure:maxInstances: "2"

# Pulumi.staging.yaml - Staging stack
config:
  aws:region: us-east-1
  my-infrastructure:vpcCidr: 10.1.0.0/16
  my-infrastructure:instanceType: t3.small
  my-infrastructure:minInstances: "2"
  my-infrastructure:maxInstances: "4"

# Pulumi.prod.yaml - Production stack
config:
  aws:region: us-east-1
  my-infrastructure:vpcCidr: 10.2.0.0/16
  my-infrastructure:instanceType: t3.medium
  my-infrastructure:minInstances: "3"
  my-infrastructure:maxInstances: "10"
```

### TypeScript: Configuration Helper

```typescript
import * as pulumi from '@pulumi/pulumi';

// Define configuration schema
interface AppConfig {
  vpcCidr: string;
  instanceType: string;
  minInstances: number;
  maxInstances: number;
  databasePassword: pulumi.Output<string>;
  enableMonitoring: boolean;
}

// Load and validate configuration
export function loadConfig(): AppConfig {
  const config = new pulumi.Config();

  return {
    vpcCidr: config.get('vpcCidr') || '10.0.0.0/16',
    instanceType: config.get('instanceType') || 't3.micro',
    minInstances: config.getNumber('minInstances') || 1,
    maxInstances: config.getNumber('maxInstances') || 3,
    databasePassword: config.requireSecret('databasePassword'),
    enableMonitoring: config.getBoolean('enableMonitoring') ?? true,
  };
}

// Environment-aware configuration
export function getEnvironmentConfig() {
  const stack = pulumi.getStack();
  const project = pulumi.getProject();

  const environments: Record<string, { isProduction: boolean; logLevel: string }> = {
    dev: { isProduction: false, logLevel: 'debug' },
    staging: { isProduction: false, logLevel: 'info' },
    prod: { isProduction: true, logLevel: 'warn' },
  };

  const envConfig = environments[stack] || environments.dev;

  return {
    stack,
    project,
    ...envConfig,
    resourcePrefix: `${project}-${stack}`,
  };
}

// Usage
const appConfig = loadConfig();
const envConfig = getEnvironmentConfig();

console.log(`Deploying to ${envConfig.stack} (production: ${envConfig.isProduction})`);
```

### Python: Configuration Helper

```python
import pulumi
from dataclasses import dataclass
from typing import Optional


@dataclass
class AppConfig:
    """Application configuration loaded from Pulumi config."""

    vpc_cidr: str
    instance_type: str
    min_instances: int
    max_instances: int
    database_password: pulumi.Output[str]
    enable_monitoring: bool


def load_config() -> AppConfig:
    """Load and validate configuration from Pulumi config."""
    config = pulumi.Config()

    return AppConfig(
        vpc_cidr=config.get("vpc_cidr") or "10.0.0.0/16",
        instance_type=config.get("instance_type") or "t3.micro",
        min_instances=config.get_int("min_instances") or 1,
        max_instances=config.get_int("max_instances") or 3,
        database_password=config.require_secret("database_password"),
        enable_monitoring=config.get_bool("enable_monitoring") or True,
    )


@dataclass
class EnvironmentConfig:
    """Environment-specific configuration."""

    stack: str
    project: str
    is_production: bool
    log_level: str
    resource_prefix: str


def get_environment_config() -> EnvironmentConfig:
    """Get environment-aware configuration."""
    stack = pulumi.get_stack()
    project = pulumi.get_project()

    environments = {
        "dev": {"is_production": False, "log_level": "debug"},
        "staging": {"is_production": False, "log_level": "info"},
        "prod": {"is_production": True, "log_level": "warn"},
    }

    env_config = environments.get(stack, environments["dev"])

    return EnvironmentConfig(
        stack=stack,
        project=project,
        is_production=env_config["is_production"],
        log_level=env_config["log_level"],
        resource_prefix=f"{project}-{stack}",
    )


# Usage
app_config = load_config()
env_config = get_environment_config()

pulumi.log.info(
    f"Deploying to {env_config.stack} (production: {env_config.is_production})"
)
```

---

## Secret Management

### TypeScript: Secrets Best Practices

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

const config = new pulumi.Config();

// Good - Use Pulumi secrets for sensitive configuration
const databasePassword = config.requireSecret('databasePassword');
const apiKey = config.requireSecret('apiKey');

// Good - Create AWS Secrets Manager secret
const dbSecret = new aws.secretsmanager.Secret('db-credentials', {
  name: `${pulumi.getProject()}-${pulumi.getStack()}-db-credentials`,
  description: 'Database credentials for the application',
  tags: {
    Environment: pulumi.getStack(),
    ManagedBy: 'pulumi',
  },
});

// Store secret value (encrypted in state)
const dbSecretVersion = new aws.secretsmanager.SecretVersion('db-credentials-value', {
  secretId: dbSecret.id,
  secretString: pulumi.interpolate`{
    "username": "admin",
    "password": "${databasePassword}"
  }`,
});

// Good - Reference secrets in resources without exposing
const lambdaFunction = new aws.lambda.Function('api-handler', {
  functionName: `${pulumi.getProject()}-${pulumi.getStack()}-api`,
  runtime: aws.lambda.Runtime.NodeJS18dX,
  handler: 'index.handler',
  role: lambdaRole.arn,
  code: new pulumi.asset.AssetArchive({
    '.': new pulumi.asset.FileArchive('./lambda'),
  }),
  environment: {
    variables: {
      // Good - Reference secret ARN, not value
      DB_SECRET_ARN: dbSecret.arn,
      // Bad - Never do this (would expose in CloudFormation)
      // DB_PASSWORD: databasePassword,
    },
  },
});

// Good - Grant Lambda permission to read secret
const secretPolicy = new aws.iam.RolePolicy('lambda-secret-access', {
  role: lambdaRole.name,
  policy: pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "${dbSecret.arn}"
    }]
  }`,
});

// Export secret ARN (safe - just the reference)
export const dbSecretArn = dbSecret.arn;

// Bad - Never export secret values
// export const dbPassword = databasePassword;
```

### Python: Secrets Best Practices

```python
import pulumi
import pulumi_aws as aws
import json

config = pulumi.Config()

# Good - Use Pulumi secrets for sensitive configuration
database_password = config.require_secret("database_password")
api_key = config.require_secret("api_key")

# Good - Create AWS Secrets Manager secret
db_secret = aws.secretsmanager.Secret(
    "db-credentials",
    name=f"{pulumi.get_project()}-{pulumi.get_stack()}-db-credentials",
    description="Database credentials for the application",
    tags={
        "Environment": pulumi.get_stack(),
        "ManagedBy": "pulumi",
    },
)

# Store secret value (encrypted in state)
db_secret_version = aws.secretsmanager.SecretVersion(
    "db-credentials-value",
    secret_id=db_secret.id,
    secret_string=database_password.apply(
        lambda pwd: json.dumps({"username": "admin", "password": pwd})
    ),
)


# Good - Create function to reference secret
def create_lambda_with_secret(secret_arn: pulumi.Output[str]):
    """Create Lambda function that can access secrets."""
    lambda_role = aws.iam.Role(
        "lambda-role",
        assume_role_policy=json.dumps(
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"},
                    }
                ],
            }
        ),
    )

    # Grant secret access
    aws.iam.RolePolicy(
        "lambda-secret-access",
        role=lambda_role.name,
        policy=secret_arn.apply(
            lambda arn: json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": ["secretsmanager:GetSecretValue"],
                            "Resource": arn,
                        }
                    ],
                }
            )
        ),
    )

    return aws.lambda_.Function(
        "api-handler",
        function_name=f"{pulumi.get_project()}-{pulumi.get_stack()}-api",
        runtime="nodejs18.x",
        handler="index.handler",
        role=lambda_role.arn,
        code=pulumi.AssetArchive({".": pulumi.FileArchive("./lambda")}),
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables={
                # Good - Reference secret ARN, not value
                "DB_SECRET_ARN": secret_arn,
            }
        ),
    )


lambda_function = create_lambda_with_secret(db_secret.arn)

# Export secret ARN (safe - just the reference)
pulumi.export("db_secret_arn", db_secret.arn)
```

---

## Testing

### TypeScript: Unit Tests with Mocks

```typescript
import * as pulumi from '@pulumi/pulumi';
import { expect } from 'chai';

// Mock Pulumi runtime for testing
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, unknown>;
  } {
    return {
      id: `${args.name}-id`,
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

// Import after setting mocks
import * as infra from '../index';

describe('Infrastructure', function () {
  describe('VPC', function () {
    it('should create VPC with correct CIDR', async function () {
      const vpcCidr = await new Promise<string>((resolve) => {
        infra.vpcCidr.apply((cidr) => resolve(cidr));
      });
      expect(vpcCidr).to.equal('10.0.0.0/16');
    });

    it('should create VPC with DNS enabled', async function () {
      const vpc = await new Promise<Record<string, unknown>>((resolve) => {
        infra.vpc.apply((v) => resolve(v as Record<string, unknown>));
      });
      expect(vpc.enableDnsHostnames).to.be.true;
      expect(vpc.enableDnsSupport).to.be.true;
    });
  });

  describe('Subnets', function () {
    it('should create 3 public subnets', async function () {
      const publicSubnetIds = await new Promise<string[]>((resolve) => {
        pulumi.all(infra.publicSubnetIds).apply((ids) => resolve(ids));
      });
      expect(publicSubnetIds).to.have.lengthOf(3);
    });

    it('should create 3 private subnets', async function () {
      const privateSubnetIds = await new Promise<string[]>((resolve) => {
        pulumi.all(infra.privateSubnetIds).apply((ids) => resolve(ids));
      });
      expect(privateSubnetIds).to.have.lengthOf(3);
    });
  });

  describe('Tags', function () {
    it('should apply environment tag to all resources', async function () {
      const vpcTags = await new Promise<Record<string, string>>((resolve) => {
        infra.vpc.apply((v) => {
          const vpc = v as { tags?: Record<string, string> };
          resolve(vpc.tags || {});
        });
      });
      expect(vpcTags).to.have.property('Environment');
      expect(vpcTags).to.have.property('ManagedBy', 'pulumi');
    });
  });
});
```

### Python: Unit Tests with Mocks

```python
import unittest
from unittest.mock import patch, MagicMock
import pulumi


class PulumiMocks(pulumi.runtime.Mocks):
    """Mock Pulumi runtime for testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resource."""
        return [f"{args.name}-id", args.inputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Handle function calls."""
        return args.inputs


# Set up mocks before importing infrastructure code
pulumi.runtime.set_mocks(PulumiMocks())


class TestInfrastructure(unittest.TestCase):
    """Test infrastructure resources."""

    @pulumi.runtime.test
    def test_vpc_cidr(self):
        """Test VPC has correct CIDR block."""
        # Import after mocks are set
        from __main__ import vpc

        def check_cidr(cidr):
            self.assertEqual(cidr, "10.0.0.0/16")

        vpc.cidr_block.apply(check_cidr)

    @pulumi.runtime.test
    def test_vpc_dns_enabled(self):
        """Test VPC has DNS enabled."""
        from __main__ import vpc

        def check_dns_hostnames(enabled):
            self.assertTrue(enabled)

        def check_dns_support(enabled):
            self.assertTrue(enabled)

        vpc.enable_dns_hostnames.apply(check_dns_hostnames)
        vpc.enable_dns_support.apply(check_dns_support)

    @pulumi.runtime.test
    def test_public_subnet_count(self):
        """Test correct number of public subnets."""
        from __main__ import public_subnets

        self.assertEqual(len(public_subnets), 3)

    @pulumi.runtime.test
    def test_private_subnet_count(self):
        """Test correct number of private subnets."""
        from __main__ import private_subnets

        self.assertEqual(len(private_subnets), 3)

    @pulumi.runtime.test
    def test_vpc_tags(self):
        """Test VPC has required tags."""
        from __main__ import vpc

        def check_tags(tags):
            self.assertIn("Environment", tags)
            self.assertEqual(tags.get("ManagedBy"), "pulumi")

        vpc.tags.apply(check_tags)


class TestComponentResource(unittest.TestCase):
    """Test custom component resources."""

    @pulumi.runtime.test
    def test_vpc_network_component(self):
        """Test VpcNetwork component creates expected resources."""
        from components.vpc_network import VpcNetwork, VpcNetworkArgs

        network = VpcNetwork(
            "test-network",
            VpcNetworkArgs(
                cidr_block="10.0.0.0/16",
                availability_zones=["us-east-1a", "us-east-1b"],
                enable_nat_gateway=False,
                tags={"Environment": "test"},
            ),
        )

        # Verify component created expected resources
        self.assertIsNotNone(network.vpc)
        self.assertIsNotNone(network.internet_gateway)
        self.assertEqual(len(network.public_subnets), 2)
        self.assertEqual(len(network.private_subnets), 2)


if __name__ == "__main__":
    unittest.main()
```

### Go: Unit Tests

```go
package main

import (
    "testing"

    "github.com/pulumi/pulumi/sdk/v3/go/common/resource"
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi"
    "github.com/stretchr/testify/assert"
)

// Mocks for Pulumi runtime
type mocks int

func (mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
    return args.Name + "-id", args.Inputs, nil
}

func (mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
    return args.Args, nil
}

func TestInfrastructure(t *testing.T) {
    err := pulumi.RunErr(func(ctx *pulumi.Context) error {
        // Create infrastructure
        infra, err := createInfrastructure(ctx)
        if err != nil {
            return err
        }

        // Test VPC CIDR
        pulumi.All(infra.VpcCidr).ApplyT(func(all []interface{}) error {
            cidr := all[0].(string)
            assert.Equal(t, "10.0.0.0/16", cidr)
            return nil
        })

        // Test subnet counts
        assert.Len(t, infra.PublicSubnets, 3)
        assert.Len(t, infra.PrivateSubnets, 3)

        return nil
    }, pulumi.WithMocks("project", "stack", mocks(0)))

    assert.NoError(t, err)
}

func TestVpcNetworkComponent(t *testing.T) {
    err := pulumi.RunErr(func(ctx *pulumi.Context) error {
        // Create component
        network, err := NewVpcNetwork(ctx, "test-network", &VpcNetworkArgs{
            CidrBlock:         "10.0.0.0/16",
            AvailabilityZones: []string{"us-east-1a", "us-east-1b"},
            EnableNatGateway:  false,
            Tags:              map[string]string{"Environment": "test"},
        })
        if err != nil {
            return err
        }

        // Verify resources created
        assert.NotNil(t, network.Vpc)
        assert.NotNil(t, network.InternetGateway)
        assert.Len(t, network.PublicSubnets, 2)
        assert.Len(t, network.PrivateSubnets, 2)

        return nil
    }, pulumi.WithMocks("project", "stack", mocks(0)))

    assert.NoError(t, err)
}

func TestSecurityGroupRules(t *testing.T) {
    err := pulumi.RunErr(func(ctx *pulumi.Context) error {
        // Test security group creation
        sg, err := createSecurityGroup(ctx, "test-sg", &SecurityGroupArgs{
            VpcId:       pulumi.String("vpc-123"),
            Description: "Test security group",
            IngressRules: []IngressRule{
                {Port: 443, Protocol: "tcp", CidrBlocks: []string{"0.0.0.0/0"}},
            },
        })
        if err != nil {
            return err
        }

        // Verify security group
        assert.NotNil(t, sg)

        return nil
    }, pulumi.WithMocks("project", "stack", mocks(0)))

    assert.NoError(t, err)
}
```

---

## Policy as Code (CrossGuard)

### TypeScript: Policy Pack

```typescript
import * as policy from '@pulumi/policy';
import * as aws from '@pulumi/aws';

// Create policy pack
new policy.PolicyPack('aws-security-policies', {
  policies: [
    // Require encryption on S3 buckets
    {
      name: 's3-bucket-encryption',
      description: 'S3 buckets must have server-side encryption enabled',
      enforcementLevel: 'mandatory',
      validateResource: policy.validateResourceOfType(aws.s3.BucketV2, (bucket, args, reportViolation) => {
        // Check if encryption is configured
        // Note: BucketV2 requires separate encryption configuration resource
        reportViolation(
          'S3 bucket must have a BucketServerSideEncryptionConfigurationV2 resource configured'
        );
      }),
    },

    // Require public access block on S3 buckets
    {
      name: 's3-no-public-access',
      description: 'S3 buckets must block public access',
      enforcementLevel: 'mandatory',
      validateResource: policy.validateResourceOfType(
        aws.s3.BucketPublicAccessBlock,
        (block, args, reportViolation) => {
          if (!block.blockPublicAcls) {
            reportViolation('S3 bucket must block public ACLs');
          }
          if (!block.blockPublicPolicy) {
            reportViolation('S3 bucket must block public policies');
          }
          if (!block.ignorePublicAcls) {
            reportViolation('S3 bucket must ignore public ACLs');
          }
          if (!block.restrictPublicBuckets) {
            reportViolation('S3 bucket must restrict public buckets');
          }
        }
      ),
    },

    // Require tags on all resources
    {
      name: 'require-tags',
      description: 'All resources must have Environment and ManagedBy tags',
      enforcementLevel: 'mandatory',
      validateResource: (args, reportViolation) => {
        const tags = (args.props as { tags?: Record<string, string> }).tags;
        if (tags === undefined) {
          reportViolation('Resource must have tags');
          return;
        }
        if (!tags.Environment) {
          reportViolation('Resource must have Environment tag');
        }
        if (!tags.ManagedBy) {
          reportViolation('Resource must have ManagedBy tag');
        }
      },
    },

    // Restrict instance types in production
    {
      name: 'approved-instance-types',
      description: 'EC2 instances must use approved instance types',
      enforcementLevel: 'mandatory',
      validateResource: policy.validateResourceOfType(
        aws.ec2.Instance,
        (instance, args, reportViolation) => {
          const approvedTypes = [
            't3.micro',
            't3.small',
            't3.medium',
            't3.large',
            'm5.large',
            'm5.xlarge',
          ];
          if (!approvedTypes.includes(instance.instanceType || '')) {
            reportViolation(
              `Instance type ${instance.instanceType} is not approved. ` +
                `Use one of: ${approvedTypes.join(', ')}`
            );
          }
        }
      ),
    },

    // Require VPC for databases
    {
      name: 'rds-in-vpc',
      description: 'RDS instances must be deployed in a VPC',
      enforcementLevel: 'mandatory',
      validateResource: policy.validateResourceOfType(
        aws.rds.Instance,
        (instance, args, reportViolation) => {
          if (!instance.dbSubnetGroupName) {
            reportViolation('RDS instance must be deployed in a VPC (requires db_subnet_group_name)');
          }
        }
      ),
    },

    // Require encryption for RDS
    {
      name: 'rds-encryption',
      description: 'RDS instances must have storage encryption enabled',
      enforcementLevel: 'mandatory',
      validateResource: policy.validateResourceOfType(
        aws.rds.Instance,
        (instance, args, reportViolation) => {
          if (!instance.storageEncrypted) {
            reportViolation('RDS instance must have storage encryption enabled');
          }
        }
      ),
    },

    // Prevent public IPs on EC2 instances
    {
      name: 'no-public-ip',
      description: 'EC2 instances should not have public IPs in production',
      enforcementLevel: 'advisory',
      validateResource: policy.validateResourceOfType(
        aws.ec2.Instance,
        (instance, args, reportViolation) => {
          if (instance.associatePublicIpAddress) {
            reportViolation(
              'EC2 instance should not have a public IP. ' + 'Use a load balancer or NAT gateway instead.'
            );
          }
        }
      ),
    },

    // Require deletion protection for production databases
    {
      name: 'rds-deletion-protection',
      description: 'RDS instances must have deletion protection enabled',
      enforcementLevel: 'mandatory',
      validateStack: (args, reportViolation) => {
        // Check if this is a production stack
        if (args.getConfig('environment') === 'prod') {
          for (const resource of args.resources) {
            if (resource.type === 'aws:rds/instance:Instance') {
              const props = resource.props as { deletionProtection?: boolean };
              if (!props.deletionProtection) {
                reportViolation(
                  `RDS instance ${resource.name} must have deletion protection enabled in production`
                );
              }
            }
          }
        }
      },
    },
  ],
});
```

### Python: Policy Pack

```python
from pulumi_policy import (
    EnforcementLevel,
    PolicyPack,
    ReportViolation,
    ResourceValidationArgs,
    ResourceValidationPolicy,
    StackValidationArgs,
    StackValidationPolicy,
)


def s3_bucket_encryption_validator(
    args: ResourceValidationArgs, report_violation: ReportViolation
):
    """Validate S3 bucket encryption."""
    if args.resource_type == "aws:s3/bucketV2:BucketV2":
        report_violation(
            "S3 bucket must have a BucketServerSideEncryptionConfigurationV2 "
            "resource configured"
        )


def s3_public_access_validator(
    args: ResourceValidationArgs, report_violation: ReportViolation
):
    """Validate S3 bucket public access block."""
    if args.resource_type == "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock":
        if not args.props.get("blockPublicAcls"):
            report_violation("S3 bucket must block public ACLs")
        if not args.props.get("blockPublicPolicy"):
            report_violation("S3 bucket must block public policies")
        if not args.props.get("ignorePublicAcls"):
            report_violation("S3 bucket must ignore public ACLs")
        if not args.props.get("restrictPublicBuckets"):
            report_violation("S3 bucket must restrict public buckets")


def require_tags_validator(
    args: ResourceValidationArgs, report_violation: ReportViolation
):
    """Validate required tags on resources."""
    tags = args.props.get("tags")
    if tags is None:
        report_violation("Resource must have tags")
        return
    if "Environment" not in tags:
        report_violation("Resource must have Environment tag")
    if "ManagedBy" not in tags:
        report_violation("Resource must have ManagedBy tag")


def approved_instance_types_validator(
    args: ResourceValidationArgs, report_violation: ReportViolation
):
    """Validate EC2 instance types."""
    if args.resource_type == "aws:ec2/instance:Instance":
        approved_types = [
            "t3.micro",
            "t3.small",
            "t3.medium",
            "t3.large",
            "m5.large",
            "m5.xlarge",
        ]
        instance_type = args.props.get("instanceType")
        if instance_type not in approved_types:
            report_violation(
                f"Instance type {instance_type} is not approved. "
                f"Use one of: {', '.join(approved_types)}"
            )


def rds_encryption_validator(
    args: ResourceValidationArgs, report_violation: ReportViolation
):
    """Validate RDS encryption."""
    if args.resource_type == "aws:rds/instance:Instance":
        if not args.props.get("storageEncrypted"):
            report_violation("RDS instance must have storage encryption enabled")


def rds_deletion_protection_validator(
    args: StackValidationArgs, report_violation: ReportViolation
):
    """Validate RDS deletion protection in production."""
    environment = args.get_config("environment")
    if environment == "prod":
        for resource in args.resources:
            if resource.resource_type == "aws:rds/instance:Instance":
                if not resource.props.get("deletionProtection"):
                    report_violation(
                        f"RDS instance {resource.name} must have deletion "
                        "protection enabled in production"
                    )


PolicyPack(
    name="aws-security-policies",
    enforcement_level=EnforcementLevel.MANDATORY,
    policies=[
        ResourceValidationPolicy(
            name="s3-bucket-encryption",
            description="S3 buckets must have server-side encryption enabled",
            validate=s3_bucket_encryption_validator,
        ),
        ResourceValidationPolicy(
            name="s3-no-public-access",
            description="S3 buckets must block public access",
            validate=s3_public_access_validator,
        ),
        ResourceValidationPolicy(
            name="require-tags",
            description="All resources must have Environment and ManagedBy tags",
            validate=require_tags_validator,
        ),
        ResourceValidationPolicy(
            name="approved-instance-types",
            description="EC2 instances must use approved instance types",
            validate=approved_instance_types_validator,
        ),
        ResourceValidationPolicy(
            name="rds-encryption",
            description="RDS instances must have storage encryption enabled",
            validate=rds_encryption_validator,
        ),
        StackValidationPolicy(
            name="rds-deletion-protection",
            description="RDS instances must have deletion protection enabled",
            validate=rds_deletion_protection_validator,
        ),
    ],
)
```

---

## CLI Commands

### Common Pulumi Commands

```bash
## Project initialization
pulumi new aws-typescript              # Create new TypeScript project
pulumi new aws-python                  # Create new Python project
pulumi new aws-go                      # Create new Go project

## Stack management
pulumi stack init dev                  # Create new stack
pulumi stack select prod               # Switch to stack
pulumi stack ls                        # List all stacks
pulumi stack rm dev --yes              # Delete stack

## Configuration
pulumi config set aws:region us-east-1        # Set config value
pulumi config set --secret dbPassword p@ss    # Set secret
pulumi config get dbPassword                  # Get config value
pulumi config                                 # List all config

## Preview and deploy
pulumi preview                         # Preview changes
pulumi preview --diff                  # Preview with detailed diff
pulumi up                              # Deploy changes
pulumi up --yes                        # Deploy without confirmation
pulumi up --target 'urn:...'           # Deploy specific resource

## State management
pulumi refresh                         # Refresh state from cloud
pulumi refresh --yes                   # Refresh without confirmation
pulumi state delete 'urn:...'          # Remove resource from state
pulumi import aws:s3/bucket:Bucket my-bucket bucket-name  # Import existing

## Destroy
pulumi destroy                         # Destroy all resources
pulumi destroy --yes                   # Destroy without confirmation
pulumi destroy --target 'urn:...'      # Destroy specific resource

## Outputs
pulumi stack output                    # Show all outputs
pulumi stack output vpcId              # Show specific output
pulumi stack output --json             # JSON format

## History and logs
pulumi stack history                   # Show deployment history
pulumi logs                            # Show logs
pulumi logs --follow                   # Stream logs

## Policy
pulumi policy new aws-typescript       # Create policy pack
pulumi policy publish org/pack         # Publish policy pack
pulumi preview --policy-pack ./policy  # Preview with local policy
```

### Backend Configuration

```bash
## Pulumi Cloud (default)
pulumi login                           # Login to Pulumi Cloud

## Self-managed backends
pulumi login s3://my-bucket            # S3 backend
pulumi login azblob://container        # Azure Blob backend
pulumi login gs://my-bucket            # GCS backend
pulumi login file://~/.pulumi          # Local file backend

## Backend with passphrase encryption
export PULUMI_CONFIG_PASSPHRASE="secret"
pulumi login s3://my-bucket
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Pulumi Deploy

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

env:
  PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  AWS_REGION: us-east-1

jobs:
  preview:
    name: Preview
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Pulumi Preview
        uses: pulumi/actions@v5
        with:
          command: preview
          stack-name: org/project/dev
          comment-on-pr: true
          github-token: ${{ secrets.GITHUB_TOKEN }}

  deploy-dev:
    name: Deploy to Dev
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Pulumi Deploy
        uses: pulumi/actions@v5
        with:
          command: up
          stack-name: org/project/dev

  deploy-prod:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-dev
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Pulumi Deploy
        uses: pulumi/actions@v5
        with:
          command: up
          stack-name: org/project/prod
```

### GitLab CI Pipeline

```yaml
stages:
  - test
  - preview
  - deploy

variables:
  PULUMI_ACCESS_TOKEN: $PULUMI_ACCESS_TOKEN
  AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
  AWS_REGION: us-east-1

.pulumi-base:
  image: pulumi/pulumi-nodejs:latest
  before_script:
    - npm ci
    - pulumi login

test:
  extends: .pulumi-base
  stage: test
  script:
    - npm test
    - npm run lint

preview:
  extends: .pulumi-base
  stage: preview
  script:
    - pulumi stack select dev
    - pulumi preview
  only:
    - merge_requests

deploy-dev:
  extends: .pulumi-base
  stage: deploy
  script:
    - pulumi stack select dev
    - pulumi up --yes
  only:
    - main

deploy-prod:
  extends: .pulumi-base
  stage: deploy
  script:
    - pulumi stack select prod
    - pulumi up --yes
  only:
    - main
  when: manual
  environment:
    name: production
```

---

## Anti-Patterns

### Hardcoded Resource Names

```typescript
// Bad - Hardcoded names prevent multiple environments
const bucket = new aws.s3.BucketV2('bucket', {
  bucket: 'my-app-bucket', // Cannot deploy to multiple environments
});

// Good - Use stack/project for uniqueness
const bucket = new aws.s3.BucketV2('bucket', {
  bucket: `my-app-${pulumi.getStack()}-bucket`,
});

// Good - Let Pulumi auto-name
const bucket = new aws.s3.BucketV2('app-bucket'); // Pulumi adds unique suffix
```

### Secrets in Plain Text

```typescript
// Bad - Secret exposed in state and logs
const config = new pulumi.Config();
const password = config.require('password');

// Good - Use Pulumi secrets
const password = config.requireSecret('password');

// Bad - Secret in code
const apiKey = 'sk_live_abc123'; // NEVER do this

// Good - From configuration
const apiKey = config.requireSecret('apiKey');
```

### Missing Error Handling

```typescript
// Bad - No error handling for async operations
const bucket = new aws.s3.BucketV2('bucket');
bucket.id.apply((id) => {
  // Assuming id is always valid
  console.log(id);
});

// Good - Handle potential undefined
bucket.id.apply((id) => {
  if (id) {
    console.log(`Bucket created: ${id}`);
  } else {
    console.error('Bucket ID not available');
  }
});
```

### Circular Dependencies

```typescript
// Bad - Circular dependency between resources
const sgA = new aws.ec2.SecurityGroup('sg-a', {
  ingress: [
    {
      securityGroups: [sgB.id], // sgB not defined yet!
    },
  ],
});

const sgB = new aws.ec2.SecurityGroup('sg-b', {
  ingress: [
    {
      securityGroups: [sgA.id],
    },
  ],
});

// Good - Use security group rules separately
const sgA = new aws.ec2.SecurityGroup('sg-a', {});
const sgB = new aws.ec2.SecurityGroup('sg-b', {});

new aws.ec2.SecurityGroupRule('sg-a-from-b', {
  securityGroupId: sgA.id,
  sourceSecurityGroupId: sgB.id,
  type: 'ingress',
  protocol: 'tcp',
  fromPort: 443,
  toPort: 443,
});

new aws.ec2.SecurityGroupRule('sg-b-from-a', {
  securityGroupId: sgB.id,
  sourceSecurityGroupId: sgA.id,
  type: 'ingress',
  protocol: 'tcp',
  fromPort: 443,
  toPort: 443,
});
```

### Not Using Components

```typescript
// Bad - Repeated infrastructure code
const vpcDev = new aws.ec2.Vpc('dev-vpc', {
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
});
const igwDev = new aws.ec2.InternetGateway('dev-igw', {
  vpcId: vpcDev.id,
});
// ... 50 more lines for dev

const vpcProd = new aws.ec2.Vpc('prod-vpc', {
  cidrBlock: '10.1.0.0/16',
  enableDnsHostnames: true,
});
const igwProd = new aws.ec2.InternetGateway('prod-igw', {
  vpcId: vpcProd.id,
});
// ... 50 more lines for prod (duplicated!)

// Good - Use ComponentResource
const devNetwork = new VpcNetwork('dev', {
  cidrBlock: '10.0.0.0/16',
  availabilityZones: ['us-east-1a', 'us-east-1b'],
});

const prodNetwork = new VpcNetwork('prod', {
  cidrBlock: '10.1.0.0/16',
  availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
});
```

### Ignoring Stack Outputs

```typescript
// Bad - No outputs for cross-stack references
const vpc = new aws.ec2.Vpc('vpc', {
  cidrBlock: '10.0.0.0/16',
});
// Other stacks can't reference this VPC!

// Good - Export important values
export const vpcId = vpc.id;
export const vpcCidr = vpc.cidrBlock;
export const vpcArn = vpc.arn;

// In another stack, reference using StackReference
const networkStack = new pulumi.StackReference('org/network/prod');
const vpcId = networkStack.getOutput('vpcId');
```

---

## Tool Configuration

### TypeScript: package.json

```json
{
  "name": "my-pulumi-project",
  "main": "index.ts",
  "devDependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0",
    "@pulumi/policy": "^1.0.0",
    "@types/chai": "^4.3.0",
    "@types/mocha": "^10.0.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "chai": "^4.3.0",
    "eslint": "^8.50.0",
    "eslint-config-prettier": "^9.0.0",
    "mocha": "^10.2.0",
    "prettier": "^3.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.2.0"
  },
  "scripts": {
    "build": "tsc",
    "test": "mocha -r ts-node/register test/**/*.test.ts",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --write '**/*.ts'",
    "format:check": "prettier --check '**/*.ts'",
    "validate": "npm run lint && npm run format:check && npm run test"
  }
}
```

### Python: pyproject.toml

```toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "my-pulumi-project"
version = "0.1.0"
description = "Pulumi infrastructure project"
readme = "README.md"
requires-python = ">=3.9"
dependencies = [
    "pulumi>=3.0.0",
    "pulumi-aws>=6.0.0",
    "pulumi-policy>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-cov>=4.0.0",
    "black>=23.0.0",
    "flake8>=6.0.0",
    "mypy>=1.0.0",
    "isort>=5.12.0",
]

[tool.black]
line-length = 100
target-version = ["py39", "py310", "py311"]

[tool.isort]
profile = "black"
line_length = 100

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
ignore_missing_imports = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
addopts = "-v --cov=. --cov-report=term-missing"
```

### Go: go.mod

```go
module my-pulumi-project

go 1.21

require (
    github.com/pulumi/pulumi-aws/sdk/v6 v6.0.0
    github.com/pulumi/pulumi/sdk/v3 v3.0.0
    github.com/stretchr/testify v1.8.4
)
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
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: ['*.js', '*.d.ts', 'node_modules/'],
};
```

### Pre-commit Configuration

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
      - id: detect-private-key

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
        types_or: [javascript, jsx, ts, tsx, json]

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \.tsx?$
        types: [file]
        additional_dependencies:
          - eslint@8.56.0
          - '@typescript-eslint/eslint-plugin@6.21.0'
          - '@typescript-eslint/parser@6.21.0'
          - eslint-config-prettier@9.1.0

  - repo: https://github.com/psf/black
    rev: 24.1.0
    hooks:
      - id: black

  - repo: https://github.com/pycqa/flake8
    rev: 7.0.0
    hooks:
      - id: flake8

  - repo: https://github.com/pycqa/isort
    rev: 5.13.0
    hooks:
      - id: isort
```

---

## References

### Official Documentation

- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [Pulumi API Reference](https://www.pulumi.com/docs/reference/pkg/)
- [Pulumi Examples](https://github.com/pulumi/examples)
- [Pulumi Blog](https://www.pulumi.com/blog/)

### Best Practices

- [Organizing Projects and Stacks](https://www.pulumi.com/docs/intro/concepts/organizing-stacks-projects/)
- [State and Backends](https://www.pulumi.com/docs/intro/concepts/state/)
- [Secrets Management](https://www.pulumi.com/docs/intro/concepts/secrets/)
- [Testing Pulumi Programs](https://www.pulumi.com/docs/guides/testing/)

### Provider Documentation

- [AWS Provider](https://www.pulumi.com/registry/packages/aws/)
- [Azure Provider](https://www.pulumi.com/registry/packages/azure-native/)
- [GCP Provider](https://www.pulumi.com/registry/packages/gcp/)
- [Kubernetes Provider](https://www.pulumi.com/registry/packages/kubernetes/)

### Related Guides

- [Terraform Style Guide](terraform.md)
- [AWS CDK Style Guide](cdk.md)
- [Kubernetes Style Guide](kubernetes.md)

---

**Status**: Active
