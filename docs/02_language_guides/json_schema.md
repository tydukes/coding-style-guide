---
title: "JSON Schema Style Guide"
description: "JSON Schema standards for API validation, configuration validation, documentation generation, and contract-first development"
author: "Tyler Dukes"
tags: [json-schema, validation, api, configuration, documentation, contracts]
category: "Language Guides"
status: "active"
---

## Language Overview

**JSON Schema** is a vocabulary for annotating and validating JSON documents. It provides a contract for
what JSON data is required, how it should be structured, and what values are acceptable.

### Key Characteristics

- **Paradigm**: Declarative schema definition
- **File Extension**: `.json`, `.schema.json`
- **Current Draft**: 2020-12 (recommended)
- **Primary Use Cases**:
  - API request/response validation
  - Configuration file validation
  - Documentation generation
  - Code generation
  - Contract-first API development

---

## Quick Reference

| **Category** | **Convention** | **Example** | **Notes** |
|-------------|----------------|-------------|-----------|
| **Schema Meta** | | | |
| Draft Version | 2020-12 | `"$schema": "https://json-schema.org/draft/2020-12/schema"` | Latest stable |
| Schema ID | URL format | `"$id": "https://example.com/schemas/user.json"` | Unique identifier |
| **Structure** | | | |
| Title | Human-readable | `"title": "User"` | Schema name |
| Description | Purpose | `"description": "A user account"` | Document intent |
| **Types** | | | |
| String | `"type": "string"` | `"name": { "type": "string" }` | Text values |
| Number | `"type": "number"` | `"price": { "type": "number" }` | Decimals allowed |
| Integer | `"type": "integer"` | `"count": { "type": "integer" }` | Whole numbers |
| Boolean | `"type": "boolean"` | `"active": { "type": "boolean" }` | true/false |
| Array | `"type": "array"` | `"tags": { "type": "array" }` | Ordered list |
| Object | `"type": "object"` | `"user": { "type": "object" }` | Key-value pairs |
| Null | `"type": "null"` | `"deleted": { "type": "null" }` | Null value |
| **Validation** | | | |
| Required | Array of names | `"required": ["id", "name"]` | Mandatory fields |
| Enum | Fixed values | `"enum": ["active", "inactive"]` | Allowed values |
| Pattern | Regex | `"pattern": "^[A-Z]{2}$"` | String format |
| **References** | | | |
| Local ref | `$ref` | `"$ref": "#/$defs/address"` | Within schema |
| External ref | URL | `"$ref": "./address.schema.json"` | Separate file |

---

## Schema Structure

### Basic Schema Template

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/user.json",
  "title": "User",
  "description": "A user account in the system",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique user identifier"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "User email address"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "User display name"
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150,
      "description": "User age in years"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "Account creation timestamp"
    }
  },
  "required": ["id", "email", "name"],
  "additionalProperties": false
}
```

### Schema with Definitions

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/order.json",
  "title": "Order",
  "description": "An e-commerce order",
  "type": "object",
  "$defs": {
    "address": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" },
        "state": { "type": "string", "pattern": "^[A-Z]{2}$" },
        "zipCode": { "type": "string", "pattern": "^\\d{5}(-\\d{4})?$" },
        "country": { "type": "string", "default": "US" }
      },
      "required": ["street", "city", "state", "zipCode"]
    },
    "lineItem": {
      "type": "object",
      "properties": {
        "productId": { "type": "string", "format": "uuid" },
        "quantity": { "type": "integer", "minimum": 1 },
        "unitPrice": { "type": "number", "minimum": 0 },
        "discount": { "type": "number", "minimum": 0, "maximum": 100, "default": 0 }
      },
      "required": ["productId", "quantity", "unitPrice"]
    },
    "money": {
      "type": "object",
      "properties": {
        "amount": { "type": "number", "minimum": 0 },
        "currency": { "type": "string", "pattern": "^[A-Z]{3}$", "default": "USD" }
      },
      "required": ["amount"]
    }
  },
  "properties": {
    "orderId": {
      "type": "string",
      "format": "uuid",
      "description": "Unique order identifier"
    },
    "customerId": {
      "type": "string",
      "format": "uuid",
      "description": "Customer who placed the order"
    },
    "status": {
      "type": "string",
      "enum": ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      "default": "pending"
    },
    "shippingAddress": {
      "$ref": "#/$defs/address"
    },
    "billingAddress": {
      "$ref": "#/$defs/address"
    },
    "items": {
      "type": "array",
      "items": { "$ref": "#/$defs/lineItem" },
      "minItems": 1
    },
    "subtotal": { "$ref": "#/$defs/money" },
    "tax": { "$ref": "#/$defs/money" },
    "total": { "$ref": "#/$defs/money" },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" }
  },
  "required": ["orderId", "customerId", "shippingAddress", "items", "total"]
}
```

---

## Validation Keywords

### String Validation

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "String Validation Examples",
  "type": "object",
  "properties": {
    "username": {
      "type": "string",
      "minLength": 3,
      "maxLength": 30,
      "pattern": "^[a-zA-Z][a-zA-Z0-9_-]*$",
      "description": "Username: 3-30 chars, starts with letter, alphanumeric with _ and -"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Valid email address"
    },
    "website": {
      "type": "string",
      "format": "uri",
      "description": "Valid URL"
    },
    "ipAddress": {
      "type": "string",
      "format": "ipv4",
      "description": "IPv4 address"
    },
    "ipv6Address": {
      "type": "string",
      "format": "ipv6",
      "description": "IPv6 address"
    },
    "uuid": {
      "type": "string",
      "format": "uuid",
      "description": "UUID v4 identifier"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "ISO 8601 date (YYYY-MM-DD)"
    },
    "dateTime": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 date-time"
    },
    "duration": {
      "type": "string",
      "format": "duration",
      "description": "ISO 8601 duration (P1DT2H3M)"
    },
    "hostname": {
      "type": "string",
      "format": "hostname",
      "description": "Valid hostname"
    },
    "phoneNumber": {
      "type": "string",
      "pattern": "^\\+?[1-9]\\d{1,14}$",
      "description": "E.164 phone number format"
    },
    "creditCard": {
      "type": "string",
      "pattern": "^[0-9]{13,19}$",
      "description": "Credit card number (digits only)"
    },
    "postalCode": {
      "type": "string",
      "pattern": "^\\d{5}(-\\d{4})?$",
      "description": "US postal code (ZIP or ZIP+4)"
    }
  }
}
```

### Number Validation

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Number Validation Examples",
  "type": "object",
  "properties": {
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150,
      "description": "Age in years"
    },
    "quantity": {
      "type": "integer",
      "minimum": 1,
      "description": "Must be at least 1"
    },
    "price": {
      "type": "number",
      "minimum": 0,
      "exclusiveMinimum": 0,
      "description": "Price must be greater than 0"
    },
    "discount": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "description": "Discount percentage (0-100)"
    },
    "rating": {
      "type": "number",
      "minimum": 1,
      "maximum": 5,
      "multipleOf": 0.5,
      "description": "Rating from 1-5 in 0.5 increments"
    },
    "temperature": {
      "type": "number",
      "minimum": -273.15,
      "description": "Temperature in Celsius (above absolute zero)"
    },
    "latitude": {
      "type": "number",
      "minimum": -90,
      "maximum": 90,
      "description": "Geographic latitude"
    },
    "longitude": {
      "type": "number",
      "minimum": -180,
      "maximum": 180,
      "description": "Geographic longitude"
    },
    "port": {
      "type": "integer",
      "minimum": 1,
      "maximum": 65535,
      "description": "Network port number"
    },
    "percentage": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100,
      "description": "Percentage as integer"
    }
  }
}
```

### Array Validation

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Array Validation Examples",
  "type": "object",
  "properties": {
    "tags": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 },
      "minItems": 1,
      "maxItems": 10,
      "uniqueItems": true,
      "description": "1-10 unique non-empty tags"
    },
    "scores": {
      "type": "array",
      "items": { "type": "integer", "minimum": 0, "maximum": 100 },
      "description": "Array of scores (0-100)"
    },
    "coordinates": {
      "type": "array",
      "prefixItems": [
        { "type": "number", "minimum": -180, "maximum": 180 },
        { "type": "number", "minimum": -90, "maximum": 90 }
      ],
      "items": false,
      "minItems": 2,
      "maxItems": 2,
      "description": "Tuple of [longitude, latitude]"
    },
    "rgb": {
      "type": "array",
      "prefixItems": [
        { "type": "integer", "minimum": 0, "maximum": 255 },
        { "type": "integer", "minimum": 0, "maximum": 255 },
        { "type": "integer", "minimum": 0, "maximum": 255 }
      ],
      "items": false,
      "description": "RGB color tuple [R, G, B]"
    },
    "mixedTypes": {
      "type": "array",
      "prefixItems": [
        { "type": "string" },
        { "type": "integer" },
        { "type": "boolean" }
      ],
      "items": { "type": "string" },
      "description": "Tuple with additional string items allowed"
    },
    "nestedArrays": {
      "type": "array",
      "items": {
        "type": "array",
        "items": { "type": "number" },
        "minItems": 2,
        "maxItems": 2
      },
      "description": "Array of [x, y] coordinate pairs"
    },
    "nonEmpty": {
      "type": "array",
      "minItems": 1,
      "description": "Must have at least one item"
    },
    "containsAdmin": {
      "type": "array",
      "items": { "type": "string" },
      "contains": { "const": "admin" },
      "description": "Must contain 'admin' role"
    }
  }
}
```

### Object Validation

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Object Validation Examples",
  "type": "object",
  "properties": {
    "strictObject": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" }
      },
      "required": ["id", "name"],
      "additionalProperties": false,
      "description": "Only id and name allowed"
    },
    "flexibleObject": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" }
      },
      "required": ["id"],
      "additionalProperties": { "type": "string" },
      "description": "Required id, optional name, additional string properties allowed"
    },
    "dynamicKeys": {
      "type": "object",
      "propertyNames": {
        "pattern": "^[a-z][a-zA-Z0-9]*$"
      },
      "additionalProperties": { "type": "string" },
      "description": "Keys must be camelCase, values must be strings"
    },
    "sizedObject": {
      "type": "object",
      "minProperties": 1,
      "maxProperties": 10,
      "description": "Object must have 1-10 properties"
    },
    "patternProperties": {
      "type": "object",
      "patternProperties": {
        "^S_": { "type": "string" },
        "^N_": { "type": "number" },
        "^B_": { "type": "boolean" }
      },
      "additionalProperties": false,
      "description": "Properties prefixed with S_, N_, B_ for type"
    },
    "dependentRequired": {
      "type": "object",
      "properties": {
        "creditCard": { "type": "string" },
        "billingAddress": { "type": "string" }
      },
      "dependentRequired": {
        "creditCard": ["billingAddress"]
      },
      "description": "If creditCard is present, billingAddress is required"
    }
  }
}
```

---

## Schema Composition

### allOf (Intersection)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "allOf Example - Person with Contact Info",
  "$defs": {
    "person": {
      "type": "object",
      "properties": {
        "firstName": { "type": "string" },
        "lastName": { "type": "string" },
        "dateOfBirth": { "type": "string", "format": "date" }
      },
      "required": ["firstName", "lastName"]
    },
    "contactInfo": {
      "type": "object",
      "properties": {
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" }
      },
      "required": ["email"]
    },
    "employeeInfo": {
      "type": "object",
      "properties": {
        "employeeId": { "type": "string" },
        "department": { "type": "string" },
        "startDate": { "type": "string", "format": "date" }
      },
      "required": ["employeeId", "department"]
    }
  },
  "allOf": [
    { "$ref": "#/$defs/person" },
    { "$ref": "#/$defs/contactInfo" },
    { "$ref": "#/$defs/employeeInfo" }
  ],
  "description": "Employee must satisfy all three schemas"
}
```

### oneOf (Exclusive Or)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "oneOf Example - Payment Method",
  "$defs": {
    "creditCard": {
      "type": "object",
      "properties": {
        "type": { "const": "credit_card" },
        "cardNumber": { "type": "string", "pattern": "^[0-9]{16}$" },
        "expiryMonth": { "type": "integer", "minimum": 1, "maximum": 12 },
        "expiryYear": { "type": "integer", "minimum": 2024 },
        "cvv": { "type": "string", "pattern": "^[0-9]{3,4}$" }
      },
      "required": ["type", "cardNumber", "expiryMonth", "expiryYear", "cvv"],
      "additionalProperties": false
    },
    "bankTransfer": {
      "type": "object",
      "properties": {
        "type": { "const": "bank_transfer" },
        "accountNumber": { "type": "string" },
        "routingNumber": { "type": "string", "pattern": "^[0-9]{9}$" },
        "accountType": { "type": "string", "enum": ["checking", "savings"] }
      },
      "required": ["type", "accountNumber", "routingNumber", "accountType"],
      "additionalProperties": false
    },
    "paypal": {
      "type": "object",
      "properties": {
        "type": { "const": "paypal" },
        "email": { "type": "string", "format": "email" }
      },
      "required": ["type", "email"],
      "additionalProperties": false
    }
  },
  "oneOf": [
    { "$ref": "#/$defs/creditCard" },
    { "$ref": "#/$defs/bankTransfer" },
    { "$ref": "#/$defs/paypal" }
  ],
  "description": "Exactly one payment method must be valid"
}
```

### anyOf (Union)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "anyOf Example - Contact Preference",
  "type": "object",
  "properties": {
    "userId": { "type": "string", "format": "uuid" },
    "contact": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "email": { "type": "string", "format": "email" }
          },
          "required": ["email"]
        },
        {
          "type": "object",
          "properties": {
            "phone": { "type": "string", "pattern": "^\\+?[1-9]\\d{1,14}$" }
          },
          "required": ["phone"]
        },
        {
          "type": "object",
          "properties": {
            "address": {
              "type": "object",
              "properties": {
                "street": { "type": "string" },
                "city": { "type": "string" },
                "country": { "type": "string" }
              },
              "required": ["street", "city", "country"]
            }
          },
          "required": ["address"]
        }
      ],
      "description": "Must have at least one: email, phone, or address"
    }
  },
  "required": ["userId", "contact"]
}
```

### not (Negation)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "not Example - Restricted Values",
  "type": "object",
  "properties": {
    "username": {
      "type": "string",
      "minLength": 3,
      "not": {
        "enum": ["admin", "root", "system", "administrator", "superuser"]
      },
      "description": "Username cannot be a reserved name"
    },
    "password": {
      "type": "string",
      "minLength": 8,
      "not": {
        "pattern": "^(password|12345678|qwerty)$"
      },
      "description": "Password cannot be a common weak password"
    },
    "port": {
      "type": "integer",
      "minimum": 1,
      "maximum": 65535,
      "not": {
        "enum": [22, 23, 25, 110, 143]
      },
      "description": "Cannot use reserved service ports"
    }
  }
}
```

---

## Conditional Schemas

### if/then/else

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Conditional Schema - Shipping",
  "type": "object",
  "properties": {
    "shippingMethod": {
      "type": "string",
      "enum": ["standard", "express", "pickup"]
    },
    "shippingAddress": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" },
        "zipCode": { "type": "string" }
      }
    },
    "pickupLocation": {
      "type": "string",
      "enum": ["store-1", "store-2", "warehouse"]
    },
    "expressDeliveryTime": {
      "type": "string",
      "enum": ["morning", "afternoon", "evening"]
    }
  },
  "required": ["shippingMethod"],
  "allOf": [
    {
      "if": {
        "properties": {
          "shippingMethod": { "const": "standard" }
        }
      },
      "then": {
        "required": ["shippingAddress"]
      }
    },
    {
      "if": {
        "properties": {
          "shippingMethod": { "const": "express" }
        }
      },
      "then": {
        "required": ["shippingAddress", "expressDeliveryTime"]
      }
    },
    {
      "if": {
        "properties": {
          "shippingMethod": { "const": "pickup" }
        }
      },
      "then": {
        "required": ["pickupLocation"]
      },
      "else": {
        "properties": {
          "pickupLocation": false
        }
      }
    }
  ]
}
```

### Complex Conditional - User Types

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "User Registration with Type-Specific Fields",
  "type": "object",
  "properties": {
    "userType": {
      "type": "string",
      "enum": ["individual", "business", "nonprofit"]
    },
    "email": { "type": "string", "format": "email" },
    "name": { "type": "string" },
    "taxId": { "type": "string" },
    "companyName": { "type": "string" },
    "nonprofitId": { "type": "string" },
    "missionStatement": { "type": "string" }
  },
  "required": ["userType", "email", "name"],
  "allOf": [
    {
      "if": {
        "properties": { "userType": { "const": "individual" } }
      },
      "then": {
        "properties": {
          "companyName": false,
          "nonprofitId": false,
          "missionStatement": false
        }
      }
    },
    {
      "if": {
        "properties": { "userType": { "const": "business" } }
      },
      "then": {
        "required": ["taxId", "companyName"],
        "properties": {
          "nonprofitId": false,
          "missionStatement": false
        }
      }
    },
    {
      "if": {
        "properties": { "userType": { "const": "nonprofit" } }
      },
      "then": {
        "required": ["nonprofitId", "companyName", "missionStatement"],
        "properties": {
          "taxId": false
        }
      }
    }
  ]
}
```

### Dependent Schemas

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Dependent Schemas Example",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "creditCard": { "type": "string" },
    "billingAddress": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" },
        "zipCode": { "type": "string" }
      },
      "required": ["street", "city", "zipCode"]
    },
    "useShippingAsBilling": { "type": "boolean" }
  },
  "dependentSchemas": {
    "creditCard": {
      "oneOf": [
        {
          "properties": {
            "useShippingAsBilling": { "const": true }
          },
          "required": ["useShippingAsBilling"]
        },
        {
          "required": ["billingAddress"]
        }
      ]
    }
  }
}
```

---

## Schema Reuse and Modularity

### External References

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/order.json",
  "title": "Order",
  "type": "object",
  "properties": {
    "orderId": { "type": "string", "format": "uuid" },
    "customer": {
      "$ref": "https://example.com/schemas/customer.json"
    },
    "shippingAddress": {
      "$ref": "https://example.com/schemas/address.json"
    },
    "billingAddress": {
      "$ref": "https://example.com/schemas/address.json"
    },
    "items": {
      "type": "array",
      "items": {
        "$ref": "https://example.com/schemas/line-item.json"
      }
    },
    "payment": {
      "$ref": "https://example.com/schemas/payment-method.json"
    }
  }
}
```

### Relative References

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/order.json",
  "title": "Order with Relative References",
  "type": "object",
  "properties": {
    "customer": {
      "$ref": "./customer.json"
    },
    "shippingAddress": {
      "$ref": "./common/address.json"
    },
    "billingAddress": {
      "$ref": "./common/address.json"
    },
    "items": {
      "type": "array",
      "items": {
        "$ref": "./line-item.json"
      }
    }
  }
}
```

### Schema Directory Structure

```text
schemas/
├── common/
│   ├── address.json          # Reusable address schema
│   ├── money.json            # Currency/amount schema
│   ├── pagination.json       # Pagination parameters
│   └── timestamps.json       # createdAt, updatedAt fields
├── entities/
│   ├── user.json             # User entity schema
│   ├── product.json          # Product entity schema
│   ├── order.json            # Order entity schema
│   └── payment.json          # Payment method schema
├── requests/
│   ├── create-user.json      # POST /users request body
│   ├── update-user.json      # PATCH /users/:id request body
│   ├── create-order.json     # POST /orders request body
│   └── search-params.json    # Query parameter schemas
├── responses/
│   ├── user-response.json    # GET /users/:id response
│   ├── user-list.json        # GET /users response
│   ├── order-response.json   # GET /orders/:id response
│   └── error.json            # Error response schema
└── index.json                # Bundle/registry of all schemas
```

### Common Schema - address.json

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/common/address.json",
  "title": "Address",
  "description": "A postal address",
  "type": "object",
  "properties": {
    "line1": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "Street address line 1"
    },
    "line2": {
      "type": "string",
      "maxLength": 100,
      "description": "Street address line 2 (optional)"
    },
    "city": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "City name"
    },
    "state": {
      "type": "string",
      "pattern": "^[A-Z]{2}$",
      "description": "State/province code (2 letters)"
    },
    "postalCode": {
      "type": "string",
      "pattern": "^[0-9]{5}(-[0-9]{4})?$",
      "description": "Postal code (ZIP or ZIP+4)"
    },
    "country": {
      "type": "string",
      "pattern": "^[A-Z]{2}$",
      "default": "US",
      "description": "ISO 3166-1 alpha-2 country code"
    }
  },
  "required": ["line1", "city", "state", "postalCode", "country"]
}
```

### Common Schema - money.json

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/common/money.json",
  "title": "Money",
  "description": "Monetary amount with currency",
  "type": "object",
  "properties": {
    "amount": {
      "type": "integer",
      "minimum": 0,
      "description": "Amount in smallest currency unit (cents for USD)"
    },
    "currency": {
      "type": "string",
      "pattern": "^[A-Z]{3}$",
      "default": "USD",
      "description": "ISO 4217 currency code"
    }
  },
  "required": ["amount", "currency"],
  "examples": [
    { "amount": 1999, "currency": "USD" },
    { "amount": 5000, "currency": "EUR" }
  ]
}
```

### Common Schema - timestamps.json

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/common/timestamps.json",
  "title": "Timestamps",
  "description": "Standard timestamp fields for entities",
  "type": "object",
  "properties": {
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "readOnly": true,
      "description": "When the resource was created"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "readOnly": true,
      "description": "When the resource was last updated"
    },
    "deletedAt": {
      "type": ["string", "null"],
      "format": "date-time",
      "readOnly": true,
      "description": "When the resource was soft-deleted (null if active)"
    }
  }
}
```

---

## API Contract Validation

### OpenAPI Integration

```yaml
# openapi.yaml
openapi: 3.1.0
info:
  title: User API
  version: 1.0.0
paths:
  /users:
    post:
      summary: Create a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: './schemas/requests/create-user.json'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: './schemas/responses/user-response.json'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: './schemas/responses/error.json'
  /users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: './schemas/responses/user-response.json'
```

### Request Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/requests/create-user.json",
  "title": "Create User Request",
  "description": "Request body for POST /users",
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "description": "User email address (must be unique)"
    },
    "password": {
      "type": "string",
      "minLength": 8,
      "maxLength": 128,
      "pattern": "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
      "description": "Password (min 8 chars, must contain upper, lower, digit)",
      "writeOnly": true
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "User display name"
    },
    "role": {
      "type": "string",
      "enum": ["user", "admin", "moderator"],
      "default": "user",
      "description": "User role"
    },
    "profile": {
      "type": "object",
      "properties": {
        "bio": { "type": "string", "maxLength": 500 },
        "avatarUrl": { "type": "string", "format": "uri" },
        "timezone": { "type": "string", "default": "UTC" }
      }
    }
  },
  "required": ["email", "password", "name"],
  "additionalProperties": false
}
```

### Response Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/responses/user-response.json",
  "title": "User Response",
  "description": "Response body for user endpoints",
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid",
          "readOnly": true
        },
        "email": {
          "type": "string",
          "format": "email"
        },
        "name": {
          "type": "string"
        },
        "role": {
          "type": "string",
          "enum": ["user", "admin", "moderator"]
        },
        "profile": {
          "type": "object",
          "properties": {
            "bio": { "type": "string" },
            "avatarUrl": { "type": "string", "format": "uri" },
            "timezone": { "type": "string" }
          }
        },
        "createdAt": {
          "type": "string",
          "format": "date-time",
          "readOnly": true
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time",
          "readOnly": true
        }
      },
      "required": ["id", "email", "name", "role", "createdAt", "updatedAt"]
    },
    "meta": {
      "type": "object",
      "properties": {
        "requestId": { "type": "string" },
        "timestamp": { "type": "string", "format": "date-time" }
      }
    }
  },
  "required": ["data"]
}
```

### Error Response Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/responses/error.json",
  "title": "Error Response",
  "description": "Standard error response format",
  "type": "object",
  "properties": {
    "error": {
      "type": "object",
      "properties": {
        "code": {
          "type": "string",
          "description": "Machine-readable error code",
          "examples": ["VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED"]
        },
        "message": {
          "type": "string",
          "description": "Human-readable error message"
        },
        "details": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "field": { "type": "string" },
              "message": { "type": "string" },
              "code": { "type": "string" }
            },
            "required": ["field", "message"]
          },
          "description": "Field-level validation errors"
        },
        "requestId": {
          "type": "string",
          "description": "Request ID for debugging"
        }
      },
      "required": ["code", "message"]
    }
  },
  "required": ["error"],
  "examples": [
    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Request validation failed",
        "details": [
          {
            "field": "email",
            "message": "Invalid email format",
            "code": "FORMAT_ERROR"
          }
        ],
        "requestId": "req_abc123"
      }
    }
  ]
}
```

---

## Version Management

### Schema Versioning Strategies

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/v2/user.json",
  "title": "User (v2)",
  "description": "User schema version 2 - added profile object",
  "$comment": "Breaking change: 'firstName' and 'lastName' replaced with 'name' object",
  "type": "object",
  "properties": {
    "$schemaVersion": {
      "const": "2.0.0",
      "description": "Schema version for this document"
    },
    "id": { "type": "string", "format": "uuid" },
    "email": { "type": "string", "format": "email" },
    "name": {
      "type": "object",
      "properties": {
        "first": { "type": "string" },
        "last": { "type": "string" },
        "display": { "type": "string" }
      },
      "required": ["first", "last"]
    },
    "profile": {
      "type": "object",
      "properties": {
        "bio": { "type": "string" },
        "avatar": { "type": "string", "format": "uri" }
      }
    }
  },
  "required": ["id", "email", "name"]
}
```

### Backward Compatible Changes

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/v1.1/user.json",
  "title": "User (v1.1)",
  "description": "User schema v1.1 - added optional 'nickname' field (backward compatible)",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "email": { "type": "string", "format": "email" },
    "firstName": { "type": "string" },
    "lastName": { "type": "string" },
    "nickname": {
      "type": "string",
      "description": "Added in v1.1 - optional display nickname"
    }
  },
  "required": ["id", "email", "firstName", "lastName"]
}
```

### Version Migration Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Multi-Version User Schema",
  "description": "Accepts both v1 and v2 user formats",
  "oneOf": [
    {
      "type": "object",
      "properties": {
        "$schemaVersion": { "const": "1.0.0" },
        "id": { "type": "string" },
        "firstName": { "type": "string" },
        "lastName": { "type": "string" }
      },
      "required": ["id", "firstName", "lastName"]
    },
    {
      "type": "object",
      "properties": {
        "$schemaVersion": { "const": "2.0.0" },
        "id": { "type": "string" },
        "name": {
          "type": "object",
          "properties": {
            "first": { "type": "string" },
            "last": { "type": "string" }
          },
          "required": ["first", "last"]
        }
      },
      "required": ["id", "name", "$schemaVersion"]
    }
  ]
}
```

---

## Documentation Generation

### Schema with Rich Documentation

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/product.json",
  "title": "Product",
  "description": "A product in the catalog. Products can be physical goods, digital items, or services.",
  "type": "object",
  "properties": {
    "sku": {
      "type": "string",
      "pattern": "^[A-Z]{2}-[0-9]{6}$",
      "description": "Stock Keeping Unit - unique product identifier",
      "examples": ["AB-123456", "CD-789012"]
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200,
      "description": "Product display name"
    },
    "description": {
      "type": "string",
      "maxLength": 5000,
      "description": "Detailed product description (supports Markdown)"
    },
    "category": {
      "type": "string",
      "enum": ["electronics", "clothing", "home", "books", "other"],
      "description": "Product category for filtering and organization"
    },
    "price": {
      "type": "object",
      "description": "Product pricing information",
      "properties": {
        "amount": {
          "type": "integer",
          "minimum": 0,
          "description": "Price in cents (e.g., 1999 = $19.99)"
        },
        "currency": {
          "type": "string",
          "pattern": "^[A-Z]{3}$",
          "default": "USD",
          "description": "ISO 4217 currency code"
        },
        "compareAt": {
          "type": "integer",
          "minimum": 0,
          "description": "Original price for sale items (in cents)"
        }
      },
      "required": ["amount", "currency"],
      "examples": [
        { "amount": 1999, "currency": "USD" },
        { "amount": 2999, "currency": "USD", "compareAt": 3999 }
      ]
    },
    "inventory": {
      "type": "object",
      "description": "Inventory tracking",
      "properties": {
        "quantity": {
          "type": "integer",
          "minimum": 0,
          "description": "Available stock quantity"
        },
        "reserved": {
          "type": "integer",
          "minimum": 0,
          "default": 0,
          "description": "Quantity reserved in carts"
        },
        "trackInventory": {
          "type": "boolean",
          "default": true,
          "description": "Whether to track inventory levels"
        }
      },
      "required": ["quantity"]
    },
    "status": {
      "type": "string",
      "enum": ["draft", "active", "archived"],
      "default": "draft",
      "description": "Product publication status"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 },
      "uniqueItems": true,
      "maxItems": 20,
      "description": "Tags for search and filtering",
      "examples": [["sale", "featured", "new-arrival"]]
    },
    "metadata": {
      "type": "object",
      "additionalProperties": { "type": "string" },
      "description": "Custom key-value metadata",
      "examples": [{ "vendor": "Acme Corp", "warehouse": "WH-001" }]
    }
  },
  "required": ["sku", "name", "price", "status"],
  "additionalProperties": false,
  "examples": [
    {
      "sku": "EL-001234",
      "name": "Wireless Bluetooth Headphones",
      "description": "High-quality wireless headphones with noise cancellation.",
      "category": "electronics",
      "price": { "amount": 7999, "currency": "USD" },
      "inventory": { "quantity": 150, "trackInventory": true },
      "status": "active",
      "tags": ["electronics", "audio", "wireless"]
    }
  ]
}
```

### Generating Documentation

```bash
# Install json-schema-for-humans
pip install json-schema-for-humans

# Generate HTML documentation
generate-schema-doc schemas/product.json docs/product.html

# Generate Markdown documentation
generate-schema-doc --config template_name=md schemas/product.json docs/product.md

# Generate documentation for all schemas
generate-schema-doc schemas/ docs/api/
```

```yaml
# json-schema-for-humans config (config.yaml)
template_name: js
show_breadcrumbs: true
collapse_long_descriptions: true
link_to_reused_ref: true
show_toc: true
```

---

## Validation Implementation

### Node.js with Ajv

```typescript
// validators/user-validator.ts
import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import createUserSchema from '../schemas/requests/create-user.json';
import updateUserSchema from '../schemas/requests/update-user.json';

// Initialize Ajv with options
const ajv = new Ajv({
  allErrors: true,        // Report all errors, not just the first
  coerceTypes: false,     // Don't coerce types automatically
  useDefaults: true,      // Apply default values
  removeAdditional: true, // Remove additional properties
  strict: true,           // Enable strict mode
});

// Add format validation (email, uri, date-time, etc.)
addFormats(ajv);

// Compile schemas once at startup
const validateCreateUser = ajv.compile(createUserSchema);
const validateUpdateUser = ajv.compile(updateUserSchema);

// Validation result type
interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

// Transform Ajv errors to API format
function formatErrors(errors: ErrorObject[] | null | undefined): ValidationResult<never>['errors'] {
  if (!errors) return [];

  return errors.map(error => ({
    field: error.instancePath.replace(/^\//, '').replace(/\//g, '.') || error.params.missingProperty || 'unknown',
    message: error.message || 'Validation failed',
    code: error.keyword.toUpperCase(),
  }));
}

// Generic validation function
function validate<T>(
  validator: ValidateFunction,
  data: unknown
): ValidationResult<T> {
  const valid = validator(data);

  if (valid) {
    return { valid: true, data: data as T };
  }

  return {
    valid: false,
    errors: formatErrors(validator.errors),
  };
}

// Exported validators
export function validateCreateUserRequest(data: unknown) {
  return validate<CreateUserRequest>(validateCreateUser, data);
}

export function validateUpdateUserRequest(data: unknown) {
  return validate<UpdateUserRequest>(validateUpdateUser, data);
}

// Express middleware
export function validateBody(validator: ValidateFunction) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validate(validator, req.body);

    if (!result.valid) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: result.errors,
        },
      });
    }

    req.body = result.data;
    next();
  };
}
```

### Python with jsonschema

```python
# validators/schema_validator.py
"""JSON Schema validation utilities."""

import json
from pathlib import Path
from typing import Any, TypeVar, Generic
from dataclasses import dataclass

from jsonschema import Draft202012Validator, ValidationError
from jsonschema.validators import validator_for
import jsonschema


@dataclass
class FieldError:
    """Individual field validation error."""
    field: str
    message: str
    code: str


@dataclass
class ValidationResult(Generic[TypeVar('T')]):
    """Result of schema validation."""
    valid: bool
    data: Any | None = None
    errors: list[FieldError] | None = None


class SchemaValidator:
    """JSON Schema validator with schema caching and error formatting."""

    def __init__(self, schema_dir: Path | str):
        """Initialize validator with schema directory."""
        self.schema_dir = Path(schema_dir)
        self._validators: dict[str, Draft202012Validator] = {}
        self._schemas: dict[str, dict] = {}

    def _load_schema(self, schema_name: str) -> dict:
        """Load and cache schema from file."""
        if schema_name not in self._schemas:
            schema_path = self.schema_dir / f"{schema_name}.json"
            with open(schema_path) as f:
                self._schemas[schema_name] = json.load(f)
        return self._schemas[schema_name]

    def _get_validator(self, schema_name: str) -> Draft202012Validator:
        """Get or create cached validator for schema."""
        if schema_name not in self._validators:
            schema = self._load_schema(schema_name)
            validator_cls = validator_for(schema)
            validator_cls.check_schema(schema)
            self._validators[schema_name] = validator_cls(
                schema,
                format_checker=jsonschema.FormatChecker()
            )
        return self._validators[schema_name]

    def _format_errors(self, errors: list[ValidationError]) -> list[FieldError]:
        """Convert jsonschema errors to API format."""
        formatted = []
        for error in errors:
            field = ".".join(str(p) for p in error.absolute_path) or "root"
            formatted.append(FieldError(
                field=field,
                message=error.message,
                code=error.validator.upper()
            ))
        return formatted

    def validate(self, schema_name: str, data: Any) -> ValidationResult:
        """Validate data against named schema."""
        validator = self._get_validator(schema_name)
        errors = list(validator.iter_errors(data))

        if not errors:
            return ValidationResult(valid=True, data=data)

        return ValidationResult(
            valid=False,
            errors=self._format_errors(errors)
        )


# Usage example
validator = SchemaValidator("./schemas/requests")

def validate_create_user(data: dict) -> ValidationResult:
    """Validate create user request."""
    return validator.validate("create-user", data)


# Flask decorator
from functools import wraps
from flask import request, jsonify

def validate_request(schema_name: str):
    """Flask decorator for request validation."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            result = validator.validate(schema_name, request.get_json())
            if not result.valid:
                return jsonify({
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Request validation failed",
                        "details": [
                            {"field": e.field, "message": e.message, "code": e.code}
                            for e in result.errors
                        ]
                    }
                }), 400
            return f(*args, **kwargs)
        return wrapper
    return decorator


# Example route
@app.route("/users", methods=["POST"])
@validate_request("create-user")
def create_user():
    """Create a new user."""
    data = request.get_json()
    # Data is validated, proceed with creation
    user = user_service.create(data)
    return jsonify({"data": user}), 201
```

### Go with gojsonschema

```go
// validators/validator.go
package validators

import (
    "embed"
    "encoding/json"
    "fmt"
    "strings"
    "sync"

    "github.com/xeipuuv/gojsonschema"
)

//go:embed schemas/*.json
var schemaFS embed.FS

// FieldError represents a single validation error
type FieldError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
    Code    string `json:"code"`
}

// ValidationResult holds the validation outcome
type ValidationResult struct {
    Valid  bool         `json:"valid"`
    Data   interface{}  `json:"data,omitempty"`
    Errors []FieldError `json:"errors,omitempty"`
}

// SchemaValidator caches compiled schemas
type SchemaValidator struct {
    schemas map[string]*gojsonschema.Schema
    mu      sync.RWMutex
}

// NewSchemaValidator creates a new validator instance
func NewSchemaValidator() *SchemaValidator {
    return &SchemaValidator{
        schemas: make(map[string]*gojsonschema.Schema),
    }
}

// LoadSchema loads and caches a schema by name
func (v *SchemaValidator) LoadSchema(name string) (*gojsonschema.Schema, error) {
    v.mu.RLock()
    if schema, ok := v.schemas[name]; ok {
        v.mu.RUnlock()
        return schema, nil
    }
    v.mu.RUnlock()

    // Load schema file
    data, err := schemaFS.ReadFile(fmt.Sprintf("schemas/%s.json", name))
    if err != nil {
        return nil, fmt.Errorf("failed to load schema %s: %w", name, err)
    }

    loader := gojsonschema.NewBytesLoader(data)
    schema, err := gojsonschema.NewSchema(loader)
    if err != nil {
        return nil, fmt.Errorf("failed to compile schema %s: %w", name, err)
    }

    v.mu.Lock()
    v.schemas[name] = schema
    v.mu.Unlock()

    return schema, nil
}

// Validate validates data against a named schema
func (v *SchemaValidator) Validate(schemaName string, data interface{}) (*ValidationResult, error) {
    schema, err := v.LoadSchema(schemaName)
    if err != nil {
        return nil, err
    }

    // Convert data to JSON for validation
    jsonData, err := json.Marshal(data)
    if err != nil {
        return nil, fmt.Errorf("failed to marshal data: %w", err)
    }

    documentLoader := gojsonschema.NewBytesLoader(jsonData)
    result, err := schema.Validate(documentLoader)
    if err != nil {
        return nil, fmt.Errorf("validation error: %w", err)
    }

    if result.Valid() {
        return &ValidationResult{Valid: true, Data: data}, nil
    }

    // Format errors
    errors := make([]FieldError, 0, len(result.Errors()))
    for _, err := range result.Errors() {
        field := err.Field()
        if field == "(root)" {
            field = "root"
        }
        errors = append(errors, FieldError{
            Field:   field,
            Message: err.Description(),
            Code:    strings.ToUpper(err.Type()),
        })
    }

    return &ValidationResult{Valid: false, Errors: errors}, nil
}

// Global validator instance
var defaultValidator = NewSchemaValidator()

// ValidateCreateUser validates create user request
func ValidateCreateUser(data interface{}) (*ValidationResult, error) {
    return defaultValidator.Validate("create-user", data)
}

// ValidateUpdateUser validates update user request
func ValidateUpdateUser(data interface{}) (*ValidationResult, error) {
    return defaultValidator.Validate("update-user", data)
}
```

---

## IDE Integration

### VS Code Settings

```json
{
  "json.schemas": [
    {
      "fileMatch": ["schemas/**/*.json"],
      "url": "https://json-schema.org/draft/2020-12/schema"
    },
    {
      "fileMatch": ["config.json", "config.*.json"],
      "url": "./schemas/config.schema.json"
    },
    {
      "fileMatch": ["package.json"],
      "url": "https://json.schemastore.org/package.json"
    },
    {
      "fileMatch": ["tsconfig.json", "tsconfig.*.json"],
      "url": "https://json.schemastore.org/tsconfig.json"
    },
    {
      "fileMatch": [".prettierrc", ".prettierrc.json"],
      "url": "https://json.schemastore.org/prettierrc.json"
    },
    {
      "fileMatch": [".eslintrc", ".eslintrc.json"],
      "url": "https://json.schemastore.org/eslintrc.json"
    }
  ],
  "json.validate.enable": true,
  "json.format.enable": true,
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.tabSize": 2
  }
}
```

### IntelliJ IDEA Settings

```xml
<!-- .idea/jsonSchemas.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="JsonSchemaMappingsProjectConfiguration">
    <state>
      <map>
        <entry key="Config Schema">
          <value>
            <SchemaInfo>
              <option name="name" value="Config Schema" />
              <option name="relativePathToSchema" value="schemas/config.schema.json" />
              <option name="patterns">
                <list>
                  <Item>
                    <option name="path" value="config.json" />
                  </Item>
                  <Item>
                    <option name="path" value="config.*.json" />
                  </Item>
                </list>
              </option>
            </SchemaInfo>
          </value>
        </entry>
      </map>
    </state>
  </component>
</project>
```

### Schema Store Integration

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/myapp-config.json",
  "title": "MyApp Configuration",
  "description": "Configuration schema for MyApp",
  "fileMatch": [
    "myapp.config.json",
    ".myapprc",
    ".myapprc.json"
  ],
  "type": "object",
  "properties": {
    "$schema": {
      "type": "string",
      "description": "Schema reference"
    }
  }
}
```

---

## Testing Schemas

### Schema Test Suite

```json
{
  "description": "Test suite for User schema",
  "schema": { "$ref": "./schemas/entities/user.json" },
  "tests": [
    {
      "description": "Valid user with all fields",
      "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "user",
        "createdAt": "2024-01-15T10:30:00Z"
      },
      "valid": true
    },
    {
      "description": "Valid user with minimal fields",
      "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "name": "Jane"
      },
      "valid": true
    },
    {
      "description": "Invalid - missing required email",
      "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe"
      },
      "valid": false
    },
    {
      "description": "Invalid - malformed email",
      "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "not-an-email",
        "name": "John Doe"
      },
      "valid": false
    },
    {
      "description": "Invalid - wrong role value",
      "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "superadmin"
      },
      "valid": false
    }
  ]
}
```

### Jest Schema Tests

```typescript
// __tests__/schemas/user.schema.test.ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import userSchema from '../../schemas/entities/user.json';

describe('User Schema', () => {
  let ajv: Ajv;
  let validate: ReturnType<Ajv['compile']>;

  beforeAll(() => {
    ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    validate = ajv.compile(userSchema);
  });

  describe('valid users', () => {
    it('should accept user with all required fields', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'user',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      };

      expect(validate(user)).toBe(true);
      expect(validate.errors).toBeNull();
    });

    it('should accept user with minimal required fields', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        name: 'Jane',
      };

      expect(validate(user)).toBe(true);
    });

    it('should apply default role when not provided', () => {
      const ajvWithDefaults = new Ajv({ useDefaults: true });
      addFormats(ajvWithDefaults);
      const validateWithDefaults = ajvWithDefaults.compile(userSchema);

      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        name: 'Jane',
      };

      validateWithDefaults(user);
      expect(user).toHaveProperty('role', 'user');
    });
  });

  describe('invalid users', () => {
    it('should reject user without email', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe',
      };

      expect(validate(user)).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          keyword: 'required',
          params: { missingProperty: 'email' },
        })
      );
    });

    it('should reject invalid email format', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'not-an-email',
        name: 'John Doe',
      };

      expect(validate(user)).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          keyword: 'format',
          params: { format: 'email' },
        })
      );
    });

    it('should reject invalid role', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'superadmin',
      };

      expect(validate(user)).toBe(false);
      expect(validate.errors).toContainEqual(
        expect.objectContaining({
          keyword: 'enum',
        })
      );
    });

    it('should reject additional properties when strict', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        name: 'John Doe',
        unknownField: 'value',
      };

      expect(validate(user)).toBe(false);
    });
  });
});
```

### Python pytest Tests

```python
# tests/test_schemas.py
"""Schema validation tests."""

import pytest
import json
from pathlib import Path
from jsonschema import Draft202012Validator, ValidationError
from jsonschema.validators import validator_for
import jsonschema


@pytest.fixture
def schema_dir():
    """Return schema directory path."""
    return Path(__file__).parent.parent / "schemas"


@pytest.fixture
def user_schema(schema_dir):
    """Load user schema."""
    with open(schema_dir / "entities" / "user.json") as f:
        return json.load(f)


@pytest.fixture
def user_validator(user_schema):
    """Create user schema validator."""
    validator_cls = validator_for(user_schema)
    return validator_cls(user_schema, format_checker=jsonschema.FormatChecker())


class TestUserSchema:
    """Tests for user schema validation."""

    def test_valid_user_all_fields(self, user_validator):
        """Should accept user with all required fields."""
        user = {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "user@example.com",
            "name": "John Doe",
            "role": "user",
            "createdAt": "2024-01-15T10:30:00Z",
            "updatedAt": "2024-01-15T10:30:00Z",
        }

        errors = list(user_validator.iter_errors(user))
        assert len(errors) == 0

    def test_valid_user_minimal_fields(self, user_validator):
        """Should accept user with minimal required fields."""
        user = {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "user@example.com",
            "name": "Jane",
        }

        errors = list(user_validator.iter_errors(user))
        assert len(errors) == 0

    def test_invalid_missing_email(self, user_validator):
        """Should reject user without email."""
        user = {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "John Doe",
        }

        errors = list(user_validator.iter_errors(user))
        assert len(errors) > 0
        assert any(e.validator == "required" for e in errors)

    def test_invalid_email_format(self, user_validator):
        """Should reject invalid email format."""
        user = {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "not-an-email",
            "name": "John Doe",
        }

        errors = list(user_validator.iter_errors(user))
        assert len(errors) > 0
        assert any(e.validator == "format" for e in errors)

    def test_invalid_role(self, user_validator):
        """Should reject invalid role value."""
        user = {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "user@example.com",
            "name": "John Doe",
            "role": "superadmin",
        }

        errors = list(user_validator.iter_errors(user))
        assert len(errors) > 0
        assert any(e.validator == "enum" for e in errors)

    @pytest.mark.parametrize("invalid_email", [
        "plainaddress",
        "@no-local-part.com",
        "missing-at-sign.com",
        "missing-domain@.com",
    ])
    def test_various_invalid_emails(self, user_validator, invalid_email):
        """Should reject various invalid email formats."""
        user = {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": invalid_email,
            "name": "John Doe",
        }

        errors = list(user_validator.iter_errors(user))
        assert len(errors) > 0
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/validate-schemas.yml
name: Validate JSON Schemas

on:
  push:
    paths:
      - 'schemas/**'
      - '.github/workflows/validate-schemas.yml'
  pull_request:
    paths:
      - 'schemas/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Validate schema syntax
        run: |
          for file in schemas/**/*.json; do
            echo "Validating $file"
            npx ajv compile -s "$file" --spec=draft2020
          done

      - name: Run schema tests
        run: npm run test:schemas

      - name: Check for breaking changes
        run: |
          if [ "${{ github.event_name }}" == "pull_request" ]; then
            npm run schema:check-breaking
          fi

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Lint JSON files
        run: |
          npx prettier --check 'schemas/**/*.json'

      - name: Check schema naming conventions
        run: |
          # All schema files should be kebab-case
          find schemas -name '*.json' | while read file; do
            basename=$(basename "$file" .json)
            if [[ ! "$basename" =~ ^[a-z][a-z0-9-]*$ ]]; then
              echo "Invalid schema name: $file (use kebab-case)"
              exit 1
            fi
          done
```

### Pre-commit Hook

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-json
        files: \.json$
      - id: pretty-format-json
        args: ['--autofix', '--indent=2', '--no-sort-keys']
        files: schemas/.*\.json$

  - repo: local
    hooks:
      - id: validate-schemas
        name: Validate JSON Schemas
        entry: npx ajv compile --spec=draft2020
        language: system
        files: schemas/.*\.json$
        args: ['-s']

      - id: schema-tests
        name: Run schema tests
        entry: npm run test:schemas
        language: system
        pass_filenames: false
        files: schemas/.*\.json$
```

---

## Anti-Patterns

### Avoid: Overly Permissive Schemas

```json
{
  "title": "Bad - No validation",
  "type": "object"
}
```

```json
{
  "title": "Good - Explicit validation",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "email": { "type": "string", "format": "email" }
  },
  "required": ["id", "email"],
  "additionalProperties": false
}
```

### Avoid: Missing Descriptions

```json
{
  "type": "object",
  "properties": {
    "x": { "type": "number" },
    "y": { "type": "number" }
  }
}
```

```json
{
  "title": "Coordinates",
  "description": "Geographic coordinates in decimal degrees",
  "type": "object",
  "properties": {
    "latitude": {
      "type": "number",
      "minimum": -90,
      "maximum": 90,
      "description": "Latitude in decimal degrees"
    },
    "longitude": {
      "type": "number",
      "minimum": -180,
      "maximum": 180,
      "description": "Longitude in decimal degrees"
    }
  },
  "required": ["latitude", "longitude"]
}
```

### Avoid: Deeply Nested Schemas

```json
{
  "type": "object",
  "properties": {
    "user": {
      "type": "object",
      "properties": {
        "profile": {
          "type": "object",
          "properties": {
            "address": {
              "type": "object",
              "properties": {
                "location": {
                  "type": "object"
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

```json
{
  "$defs": {
    "address": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" }
      }
    },
    "profile": {
      "type": "object",
      "properties": {
        "address": { "$ref": "#/$defs/address" }
      }
    }
  },
  "type": "object",
  "properties": {
    "profile": { "$ref": "#/$defs/profile" }
  }
}
```

### Avoid: Duplicate Schema Definitions

```json
{
  "type": "object",
  "properties": {
    "shippingAddress": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" },
        "zipCode": { "type": "string" }
      }
    },
    "billingAddress": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" },
        "zipCode": { "type": "string" }
      }
    }
  }
}
```

```json
{
  "$defs": {
    "address": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" },
        "zipCode": { "type": "string" }
      },
      "required": ["street", "city", "zipCode"]
    }
  },
  "type": "object",
  "properties": {
    "shippingAddress": { "$ref": "#/$defs/address" },
    "billingAddress": { "$ref": "#/$defs/address" }
  }
}
```

---

## Best Practices Summary

### Schema Design

- Always specify `$schema` and `$id`
- Use `title` and `description` for documentation
- Define `$defs` for reusable components
- Use `additionalProperties: false` for strict validation
- Add `examples` for documentation and testing

### Validation

- Validate at API boundaries
- Return detailed error messages
- Use format validators for common patterns
- Cache compiled schemas for performance

### Organization

- Use consistent naming (kebab-case for files)
- Organize schemas by purpose (requests, responses, entities)
- Keep common definitions in shared files
- Version schemas for breaking changes

### Testing

- Write comprehensive test suites
- Test both valid and invalid cases
- Use parameterized tests for edge cases
- Integrate schema tests in CI/CD

---

## References

### Official Documentation

- [JSON Schema Specification](https://json-schema.org/specification)
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/release-notes)
- [Understanding JSON Schema](https://json-schema.org/understanding-json-schema/)

### Tools

- [Ajv](https://ajv.js.org/) - Fast JSON Schema validator for JavaScript
- [jsonschema](https://python-jsonschema.readthedocs.io/) - Python JSON Schema validator
- [JSON Schema Store](https://www.schemastore.org/) - Repository of JSON schemas
- [json-schema-for-humans](https://github.com/coveooss/json-schema-for-humans) - Documentation generator

### Related Guides

- [JSON Style Guide](json.md) - General JSON formatting standards
- [YAML Style Guide](yaml.md) - YAML formatting standards
- [TypeScript Style Guide](typescript.md) - TypeScript standards (for validation code)

---

**Status**: Active
