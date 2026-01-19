---
title: "Seed Data Management Guide"
description: "Comprehensive guide to test data generation, database seeding, fixture organization, data anonymization, and synthetic data generation for all supported languages"
author: "Tyler Dukes"
tags: [testing, seed-data, fixtures, faker, anonymization, synthetic-data, database-seeding]
category: "CI/CD"
status: "active"
---

## Introduction

This guide provides comprehensive standards for managing test data across all environments. It covers seed data
generation strategies, fixture organization, data anonymization for test environments, and synthetic data generation
for realistic testing scenarios.

---

## Table of Contents

1. [Seed Data Philosophy](#seed-data-philosophy)
2. [Database Seeding Scripts](#database-seeding-scripts)
3. [Fixture Organization](#fixture-organization)
4. [Data Anonymization](#data-anonymization)
5. [Synthetic Data Generation](#synthetic-data-generation)
6. [Environment-Specific Seeding](#environment-specific-seeding)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)

---

## Seed Data Philosophy

### Principles

```text
                    ┌─────────────────────┐
                    │   Production Data   │
                    │   (Real, Sensitive) │
                    └──────────┬──────────┘
                               │
                               │ Anonymize
                               ▼
                    ┌─────────────────────┐
                    │   Staging Data      │
                    │   (Anonymized Copy) │
                    └──────────┬──────────┘
                               │
                               │ Subset
                               ▼
                    ┌─────────────────────┐
                    │   Test Data         │
                    │   (Minimal, Fast)   │
                    └──────────┬──────────┘
                               │
                               │ Generate
                               ▼
                    ┌─────────────────────┐
                    │   Development Data  │
                    │   (Synthetic, Safe) │
                    └─────────────────────┘
```

**Key Principles**:

- **Never use production data directly in tests**
- **Generate reproducible test data** with fixed seeds
- **Keep seed data minimal** for fast test execution
- **Version control all seed scripts**
- **Document data relationships and dependencies**

---

## Database Seeding Scripts

### Python (SQLAlchemy + Faker)

**Project structure**:

```text
seeds/
├── __init__.py
├── base.py
├── users.py
├── products.py
├── orders.py
├── relationships.py
└── runner.py
```

**Base seeder class**:

```python
# seeds/base.py
from abc import ABC, abstractmethod
from typing import Any, List
from faker import Faker
from sqlalchemy.orm import Session

class BaseSeeder(ABC):
    """Base class for all database seeders."""

    def __init__(self, session: Session, seed: int = 42):
        self.session = session
        self.fake = Faker()
        Faker.seed(seed)
        self._created_records: List[Any] = []

    @abstractmethod
    def run(self) -> List[Any]:
        """Execute the seeder and return created records."""
        pass

    def cleanup(self) -> None:
        """Remove all records created by this seeder."""
        for record in reversed(self._created_records):
            self.session.delete(record)
        self.session.commit()
        self._created_records.clear()

    def _track(self, record: Any) -> Any:
        """Track a record for cleanup."""
        self._created_records.append(record)
        return record
```

**Users seeder**:

```python
# seeds/users.py
from typing import List, Optional
from faker import Faker
from sqlalchemy.orm import Session

from models import User, UserRole
from seeds.base import BaseSeeder

class UserSeeder(BaseSeeder):
    """Seeder for user test data."""

    def __init__(
        self,
        session: Session,
        seed: int = 42,
        count: int = 100,
        roles: Optional[List[str]] = None
    ):
        super().__init__(session, seed)
        self.count = count
        self.roles = roles or ["user", "admin", "moderator"]

    def run(self) -> List[User]:
        """Generate and persist user records."""
        users = []
        for i in range(self.count):
            user = self._create_user(i)
            self.session.add(user)
            users.append(self._track(user))
        self.session.commit()
        return users

    def _create_user(self, index: int) -> User:
        """Create a single user record."""
        role = self.roles[index % len(self.roles)]
        return User(
            email=self.fake.unique.email(),
            username=self.fake.unique.user_name(),
            first_name=self.fake.first_name(),
            last_name=self.fake.last_name(),
            hashed_password=self._hash_password("TestPassword123!"),
            role=UserRole(role),
            is_active=self.fake.boolean(chance_of_getting_true=90),
            created_at=self.fake.date_time_this_year(),
            phone=self.fake.phone_number() if self.fake.boolean() else None,
            address=self._generate_address(),
        )

    def _generate_address(self) -> dict:
        """Generate a random address."""
        return {
            "street": self.fake.street_address(),
            "city": self.fake.city(),
            "state": self.fake.state_abbr(),
            "zip_code": self.fake.zipcode(),
            "country": "US",
        }

    @staticmethod
    def _hash_password(password: str) -> str:
        """Hash a password for storage."""
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()
```

**Products seeder**:

```python
# seeds/products.py
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session

from models import Product, Category
from seeds.base import BaseSeeder

class ProductSeeder(BaseSeeder):
    """Seeder for product test data."""

    CATEGORIES = [
        ("electronics", "Electronics & Gadgets"),
        ("clothing", "Clothing & Apparel"),
        ("books", "Books & Media"),
        ("home", "Home & Garden"),
        ("sports", "Sports & Outdoors"),
    ]

    def __init__(
        self,
        session: Session,
        seed: int = 42,
        count: int = 50,
        categories: Optional[List[Category]] = None
    ):
        super().__init__(session, seed)
        self.count = count
        self.categories = categories

    def run(self) -> List[Product]:
        """Generate and persist product records."""
        if not self.categories:
            self.categories = self._create_categories()

        products = []
        for _ in range(self.count):
            product = self._create_product()
            self.session.add(product)
            products.append(self._track(product))
        self.session.commit()
        return products

    def _create_categories(self) -> List[Category]:
        """Create product categories."""
        categories = []
        for slug, name in self.CATEGORIES:
            category = Category(slug=slug, name=name)
            self.session.add(category)
            categories.append(self._track(category))
        self.session.commit()
        return categories

    def _create_product(self) -> Product:
        """Create a single product record."""
        base_price = Decimal(str(self.fake.pyfloat(min_value=10, max_value=1000)))
        return Product(
            name=self.fake.catch_phrase(),
            description=self.fake.paragraph(nb_sentences=3),
            sku=self.fake.unique.bothify(text="???-#####").upper(),
            price=base_price.quantize(Decimal("0.01")),
            sale_price=self._calculate_sale_price(base_price),
            category=self.fake.random_element(self.categories),
            stock_quantity=self.fake.random_int(min=0, max=500),
            is_active=self.fake.boolean(chance_of_getting_true=85),
            weight=self.fake.pyfloat(min_value=0.1, max_value=50.0),
            dimensions=self._generate_dimensions(),
            tags=self.fake.words(nb=3),
            created_at=self.fake.date_time_this_year(),
        )

    def _calculate_sale_price(self, base_price: Decimal) -> Optional[Decimal]:
        """Calculate sale price with 30% chance of discount."""
        if self.fake.boolean(chance_of_getting_true=30):
            discount = Decimal(str(self.fake.pyfloat(min_value=0.1, max_value=0.4)))
            return (base_price * (1 - discount)).quantize(Decimal("0.01"))
        return None

    def _generate_dimensions(self) -> dict:
        """Generate product dimensions."""
        return {
            "length": round(self.fake.pyfloat(min_value=1, max_value=100), 2),
            "width": round(self.fake.pyfloat(min_value=1, max_value=100), 2),
            "height": round(self.fake.pyfloat(min_value=1, max_value=100), 2),
            "unit": "cm",
        }
```

**Orders seeder with relationships**:

```python
# seeds/orders.py
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List
from sqlalchemy.orm import Session

from models import Order, OrderItem, OrderStatus, User, Product
from seeds.base import BaseSeeder

class OrderSeeder(BaseSeeder):
    """Seeder for order test data with relationships."""

    def __init__(
        self,
        session: Session,
        users: List[User],
        products: List[Product],
        seed: int = 42,
        count: int = 200
    ):
        super().__init__(session, seed)
        self.users = users
        self.products = products
        self.count = count

    def run(self) -> List[Order]:
        """Generate and persist order records with items."""
        orders = []
        for _ in range(self.count):
            order = self._create_order()
            self.session.add(order)
            orders.append(self._track(order))
        self.session.commit()
        return orders

    def _create_order(self) -> Order:
        """Create a single order with items."""
        user = self.fake.random_element(self.users)
        order_date = self.fake.date_time_between(
            start_date="-90d",
            end_date="now"
        )

        order = Order(
            user=user,
            order_number=self.fake.unique.bothify(text="ORD-########"),
            status=self._determine_status(order_date),
            shipping_address=self._generate_shipping_address(),
            billing_address=user.address,
            created_at=order_date,
            updated_at=order_date + timedelta(hours=self.fake.random_int(1, 48)),
        )

        items = self._create_order_items(order)
        order.items = items
        order.subtotal = sum(item.total for item in items)
        order.tax = (order.subtotal * Decimal("0.08")).quantize(Decimal("0.01"))
        order.shipping_cost = self._calculate_shipping(order.subtotal)
        order.total = order.subtotal + order.tax + order.shipping_cost

        return order

    def _create_order_items(self, order: Order) -> List[OrderItem]:
        """Create order items for an order."""
        num_items = self.fake.random_int(min=1, max=5)
        items = []
        selected_products = self.fake.random_elements(
            elements=self.products,
            length=num_items,
            unique=True
        )

        for product in selected_products:
            quantity = self.fake.random_int(min=1, max=3)
            price = product.sale_price or product.price
            item = OrderItem(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=price,
                total=price * quantity,
            )
            items.append(item)

        return items

    def _determine_status(self, order_date: datetime) -> OrderStatus:
        """Determine order status based on age."""
        age_days = (datetime.now() - order_date).days
        if age_days > 14:
            return self.fake.random_element([
                OrderStatus.DELIVERED,
                OrderStatus.COMPLETED,
            ])
        elif age_days > 7:
            return self.fake.random_element([
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED,
            ])
        elif age_days > 2:
            return self.fake.random_element([
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPED,
            ])
        else:
            return self.fake.random_element([
                OrderStatus.PENDING,
                OrderStatus.PROCESSING,
            ])

    def _generate_shipping_address(self) -> dict:
        """Generate shipping address."""
        return {
            "name": self.fake.name(),
            "street": self.fake.street_address(),
            "city": self.fake.city(),
            "state": self.fake.state_abbr(),
            "zip_code": self.fake.zipcode(),
            "country": "US",
        }

    def _calculate_shipping(self, subtotal: Decimal) -> Decimal:
        """Calculate shipping cost."""
        if subtotal >= Decimal("100"):
            return Decimal("0.00")
        elif subtotal >= Decimal("50"):
            return Decimal("5.99")
        else:
            return Decimal("9.99")
```

**Seed runner**:

```python
# seeds/runner.py
import argparse
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from seeds.users import UserSeeder
from seeds.products import ProductSeeder
from seeds.orders import OrderSeeder

@contextmanager
def get_session(database_url: str) -> Generator[Session, None, None]:
    """Create a database session."""
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def seed_database(
    database_url: str,
    seed: int = 42,
    user_count: int = 100,
    product_count: int = 50,
    order_count: int = 200,
    verbose: bool = True
) -> dict:
    """Seed database with test data."""
    results = {}

    with get_session(database_url) as session:
        if verbose:
            print("Seeding users...")
        user_seeder = UserSeeder(session, seed=seed, count=user_count)
        results["users"] = user_seeder.run()
        if verbose:
            print(f"  Created {len(results['users'])} users")

        if verbose:
            print("Seeding products...")
        product_seeder = ProductSeeder(session, seed=seed, count=product_count)
        results["products"] = product_seeder.run()
        if verbose:
            print(f"  Created {len(results['products'])} products")

        if verbose:
            print("Seeding orders...")
        order_seeder = OrderSeeder(
            session,
            users=results["users"],
            products=results["products"],
            seed=seed,
            count=order_count
        )
        results["orders"] = order_seeder.run()
        if verbose:
            print(f"  Created {len(results['orders'])} orders")

    return results

def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(description="Seed database with test data")
    parser.add_argument(
        "--database-url",
        default="postgresql://localhost/testdb",
        help="Database connection URL"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility"
    )
    parser.add_argument(
        "--users",
        type=int,
        default=100,
        help="Number of users to create"
    )
    parser.add_argument(
        "--products",
        type=int,
        default=50,
        help="Number of products to create"
    )
    parser.add_argument(
        "--orders",
        type=int,
        default=200,
        help="Number of orders to create"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress output"
    )

    args = parser.parse_args()
    seed_database(
        database_url=args.database_url,
        seed=args.seed,
        user_count=args.users,
        product_count=args.products,
        order_count=args.orders,
        verbose=not args.quiet
    )

if __name__ == "__main__":
    main()
```

**Run seeds**:

```bash
## Seed with defaults
python -m seeds.runner

## Seed with custom counts
python -m seeds.runner --users 500 --products 200 --orders 1000

## Seed with specific seed for reproducibility
python -m seeds.runner --seed 12345

## Seed specific database
python -m seeds.runner --database-url postgresql://user:pass@localhost/mydb
```

### TypeScript (Prisma + Faker)

**Project structure**:

```text
prisma/
├── seeds/
│   ├── index.ts
│   ├── base.seeder.ts
│   ├── user.seeder.ts
│   ├── product.seeder.ts
│   └── order.seeder.ts
└── seed.ts
```

**Base seeder class**:

```typescript
// prisma/seeds/base.seeder.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export abstract class BaseSeeder<T> {
  protected prisma: PrismaClient;
  protected records: T[] = [];

  constructor(prisma: PrismaClient, seed: number = 42) {
    this.prisma = prisma;
    faker.seed(seed);
  }

  abstract run(): Promise<T[]>;

  getRecords(): T[] {
    return this.records;
  }

  protected track(record: T): T {
    this.records.push(record);
    return record;
  }
}
```

**User seeder**:

```typescript
// prisma/seeds/user.seeder.ts
import { PrismaClient, User, Role } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { BaseSeeder } from './base.seeder';
import * as bcrypt from 'bcrypt';

export class UserSeeder extends BaseSeeder<User> {
  private count: number;
  private roles: Role[];

  constructor(
    prisma: PrismaClient,
    seed: number = 42,
    count: number = 100,
    roles: Role[] = [Role.USER, Role.ADMIN, Role.MODERATOR]
  ) {
    super(prisma, seed);
    this.count = count;
    this.roles = roles;
  }

  async run(): Promise<User[]> {
    const users: User[] = [];

    for (let i = 0; i < this.count; i++) {
      const user = await this.createUser(i);
      users.push(this.track(user));
    }

    return users;
  }

  private async createUser(index: number): Promise<User> {
    const role = this.roles[index % this.roles.length];
    const password = await bcrypt.hash('TestPassword123!', 10);

    return this.prisma.user.create({
      data: {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password,
        role,
        isActive: faker.datatype.boolean({ probability: 0.9 }),
        phone: faker.datatype.boolean() ? faker.phone.number() : null,
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state({ abbreviated: true }),
          zipCode: faker.location.zipCode(),
          country: 'US',
        },
        createdAt: faker.date.past({ years: 1 }),
      },
    });
  }
}
```

**Product seeder**:

```typescript
// prisma/seeds/product.seeder.ts
import { PrismaClient, Product, Category } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { BaseSeeder } from './base.seeder';

interface CategoryData {
  slug: string;
  name: string;
}

export class ProductSeeder extends BaseSeeder<Product> {
  private count: number;
  private categories: Category[] = [];

  private static readonly CATEGORIES: CategoryData[] = [
    { slug: 'electronics', name: 'Electronics & Gadgets' },
    { slug: 'clothing', name: 'Clothing & Apparel' },
    { slug: 'books', name: 'Books & Media' },
    { slug: 'home', name: 'Home & Garden' },
    { slug: 'sports', name: 'Sports & Outdoors' },
  ];

  constructor(
    prisma: PrismaClient,
    seed: number = 42,
    count: number = 50,
    categories?: Category[]
  ) {
    super(prisma, seed);
    this.count = count;
    if (categories) {
      this.categories = categories;
    }
  }

  async run(): Promise<Product[]> {
    if (this.categories.length === 0) {
      await this.createCategories();
    }

    const products: Product[] = [];

    for (let i = 0; i < this.count; i++) {
      const product = await this.createProduct();
      products.push(this.track(product));
    }

    return products;
  }

  private async createCategories(): Promise<void> {
    for (const { slug, name } of ProductSeeder.CATEGORIES) {
      const category = await this.prisma.category.create({
        data: { slug, name },
      });
      this.categories.push(category);
    }
  }

  private async createProduct(): Promise<Product> {
    const basePrice = faker.number.float({ min: 10, max: 1000, fractionDigits: 2 });
    const hasSalePrice = faker.datatype.boolean({ probability: 0.3 });
    const salePrice = hasSalePrice
      ? basePrice * (1 - faker.number.float({ min: 0.1, max: 0.4 }))
      : null;

    return this.prisma.product.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        sku: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
        price: basePrice,
        salePrice: salePrice ? Number(salePrice.toFixed(2)) : null,
        categoryId: faker.helpers.arrayElement(this.categories).id,
        stockQuantity: faker.number.int({ min: 0, max: 500 }),
        isActive: faker.datatype.boolean({ probability: 0.85 }),
        weight: faker.number.float({ min: 0.1, max: 50, fractionDigits: 2 }),
        dimensions: {
          length: faker.number.float({ min: 1, max: 100, fractionDigits: 2 }),
          width: faker.number.float({ min: 1, max: 100, fractionDigits: 2 }),
          height: faker.number.float({ min: 1, max: 100, fractionDigits: 2 }),
          unit: 'cm',
        },
        tags: faker.helpers.arrayElements(
          ['new', 'sale', 'bestseller', 'limited', 'eco-friendly'],
          { min: 1, max: 3 }
        ),
        createdAt: faker.date.past({ years: 1 }),
      },
    });
  }
}
```

**Order seeder**:

```typescript
// prisma/seeds/order.seeder.ts
import { PrismaClient, Order, OrderStatus, User, Product } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { BaseSeeder } from './base.seeder';

export class OrderSeeder extends BaseSeeder<Order> {
  private count: number;
  private users: User[];
  private products: Product[];

  constructor(
    prisma: PrismaClient,
    users: User[],
    products: Product[],
    seed: number = 42,
    count: number = 200
  ) {
    super(prisma, seed);
    this.users = users;
    this.products = products;
    this.count = count;
  }

  async run(): Promise<Order[]> {
    const orders: Order[] = [];

    for (let i = 0; i < this.count; i++) {
      const order = await this.createOrder();
      orders.push(this.track(order));
    }

    return orders;
  }

  private async createOrder(): Promise<Order> {
    const user = faker.helpers.arrayElement(this.users);
    const orderDate = faker.date.recent({ days: 90 });
    const items = this.generateOrderItems();

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = Number((subtotal * 0.08).toFixed(2));
    const shippingCost = this.calculateShipping(subtotal);

    return this.prisma.order.create({
      data: {
        userId: user.id,
        orderNumber: `ORD-${faker.string.numeric(8)}`,
        status: this.determineStatus(orderDate),
        shippingAddress: {
          name: faker.person.fullName(),
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state({ abbreviated: true }),
          zipCode: faker.location.zipCode(),
          country: 'US',
        },
        billingAddress: user.address as object,
        subtotal,
        tax,
        shippingCost,
        total: subtotal + tax + shippingCost,
        createdAt: orderDate,
        updatedAt: new Date(orderDate.getTime() + faker.number.int({ min: 1, max: 48 }) * 3600000),
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: { items: true },
    });
  }

  private generateOrderItems(): Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }> {
    const numItems = faker.number.int({ min: 1, max: 5 });
    const selectedProducts = faker.helpers.arrayElements(this.products, numItems);

    return selectedProducts.map((product) => {
      const quantity = faker.number.int({ min: 1, max: 3 });
      const unitPrice = product.salePrice ?? product.price;
      return {
        productId: product.id,
        quantity,
        unitPrice,
        total: Number((unitPrice * quantity).toFixed(2)),
      };
    });
  }

  private determineStatus(orderDate: Date): OrderStatus {
    const ageDays = Math.floor(
      (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (ageDays > 14) {
      return faker.helpers.arrayElement([OrderStatus.DELIVERED, OrderStatus.COMPLETED]);
    } else if (ageDays > 7) {
      return faker.helpers.arrayElement([OrderStatus.SHIPPED, OrderStatus.DELIVERED]);
    } else if (ageDays > 2) {
      return faker.helpers.arrayElement([OrderStatus.PROCESSING, OrderStatus.SHIPPED]);
    } else {
      return faker.helpers.arrayElement([OrderStatus.PENDING, OrderStatus.PROCESSING]);
    }
  }

  private calculateShipping(subtotal: number): number {
    if (subtotal >= 100) return 0;
    if (subtotal >= 50) return 5.99;
    return 9.99;
  }
}
```

**Main seed runner**:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { UserSeeder } from './seeds/user.seeder';
import { ProductSeeder } from './seeds/product.seeder';
import { OrderSeeder } from './seeds/order.seeder';

const prisma = new PrismaClient();

interface SeedOptions {
  seed?: number;
  userCount?: number;
  productCount?: number;
  orderCount?: number;
}

async function main(options: SeedOptions = {}): Promise<void> {
  const { seed = 42, userCount = 100, productCount = 50, orderCount = 200 } = options;

  console.log('Seeding database...');

  console.log('  Creating users...');
  const userSeeder = new UserSeeder(prisma, seed, userCount);
  const users = await userSeeder.run();
  console.log(`    Created ${users.length} users`);

  console.log('  Creating products...');
  const productSeeder = new ProductSeeder(prisma, seed, productCount);
  const products = await productSeeder.run();
  console.log(`    Created ${products.length} products`);

  console.log('  Creating orders...');
  const orderSeeder = new OrderSeeder(prisma, users, products, seed, orderCount);
  const orders = await orderSeeder.run();
  console.log(`    Created ${orders.length} orders`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**package.json scripts**:

```json
{
  "scripts": {
    "db:seed": "ts-node prisma/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "db:fresh": "prisma migrate reset --force && npm run db:seed"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

**Run seeds**:

```bash
## Run seed script directly
npm run db:seed

## Reset database and run seeds
npm run db:fresh

## Run via Prisma
npx prisma db seed
```

---

## Fixture Organization

### JSON Fixtures

**Project structure**:

```text
tests/
├── fixtures/
│   ├── users/
│   │   ├── admin.json
│   │   ├── regular-user.json
│   │   └── inactive-user.json
│   ├── products/
│   │   ├── electronics.json
│   │   ├── out-of-stock.json
│   │   └── on-sale.json
│   ├── orders/
│   │   ├── pending-order.json
│   │   ├── completed-order.json
│   │   └── cancelled-order.json
│   └── index.ts
```

**User fixtures**:

```json
// tests/fixtures/users/admin.json
{
  "id": "usr_admin_001",
  "email": "admin@example.com",
  "username": "admin",
  "firstName": "Admin",
  "lastName": "User",
  "role": "ADMIN",
  "isActive": true,
  "permissions": ["read", "write", "delete", "manage_users"],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

```json
// tests/fixtures/users/regular-user.json
{
  "id": "usr_regular_001",
  "email": "user@example.com",
  "username": "regularuser",
  "firstName": "Regular",
  "lastName": "User",
  "role": "USER",
  "isActive": true,
  "permissions": ["read"],
  "createdAt": "2024-06-15T10:30:00.000Z"
}
```

```json
// tests/fixtures/users/inactive-user.json
{
  "id": "usr_inactive_001",
  "email": "inactive@example.com",
  "username": "inactiveuser",
  "firstName": "Inactive",
  "lastName": "User",
  "role": "USER",
  "isActive": false,
  "deactivatedAt": "2024-08-01T00:00:00.000Z",
  "deactivationReason": "Account suspended"
}
```

**Product fixtures**:

```json
// tests/fixtures/products/electronics.json
{
  "id": "prod_elec_001",
  "name": "Wireless Bluetooth Headphones",
  "description": "High-quality wireless headphones with noise cancellation",
  "sku": "WBH-12345",
  "price": 149.99,
  "salePrice": null,
  "category": "electronics",
  "stockQuantity": 50,
  "isActive": true,
  "tags": ["wireless", "audio", "bluetooth"]
}
```

```json
// tests/fixtures/products/out-of-stock.json
{
  "id": "prod_oos_001",
  "name": "Limited Edition Watch",
  "description": "Exclusive limited edition timepiece",
  "sku": "LEW-54321",
  "price": 999.99,
  "salePrice": null,
  "category": "accessories",
  "stockQuantity": 0,
  "isActive": true,
  "tags": ["limited", "luxury"],
  "restockDate": "2025-03-01T00:00:00.000Z"
}
```

```json
// tests/fixtures/products/on-sale.json
{
  "id": "prod_sale_001",
  "name": "Summer Collection T-Shirt",
  "description": "Comfortable cotton t-shirt from summer collection",
  "sku": "SCT-67890",
  "price": 39.99,
  "salePrice": 24.99,
  "category": "clothing",
  "stockQuantity": 200,
  "isActive": true,
  "tags": ["sale", "summer", "cotton"],
  "saleEndDate": "2025-02-28T23:59:59.000Z"
}
```

**Fixture loader (TypeScript)**:

```typescript
// tests/fixtures/index.ts
import * as fs from 'fs';
import * as path from 'path';

type FixtureType = 'users' | 'products' | 'orders';

interface FixtureCache {
  [key: string]: unknown;
}

class FixtureLoader {
  private basePath: string;
  private cache: FixtureCache = {};

  constructor(basePath: string = path.join(__dirname)) {
    this.basePath = basePath;
  }

  load<T>(type: FixtureType, name: string): T {
    const cacheKey = `${type}/${name}`;
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey] as T;
    }

    const filePath = path.join(this.basePath, type, `${name}.json`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content) as T;
    this.cache[cacheKey] = data;
    return data;
  }

  loadAll<T>(type: FixtureType): T[] {
    const dirPath = path.join(this.basePath, type);
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));
    return files.map((file) => this.load<T>(type, file.replace('.json', '')));
  }

  clearCache(): void {
    this.cache = {};
  }
}

export const fixtures = new FixtureLoader();

// Convenience functions
export const loadUser = <T>(name: string): T => fixtures.load<T>('users', name);
export const loadProduct = <T>(name: string): T => fixtures.load<T>('products', name);
export const loadOrder = <T>(name: string): T => fixtures.load<T>('orders', name);
export const loadAllUsers = <T>(): T[] => fixtures.loadAll<T>('users');
export const loadAllProducts = <T>(): T[] => fixtures.loadAll<T>('products');
```

**Usage in tests**:

```typescript
// tests/user.service.test.ts
import { loadUser, loadAllUsers } from './fixtures';
import { User } from '../src/models/user';
import { UserService } from '../src/services/user.service';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('should allow admin to manage users', async () => {
    const admin = loadUser<User>('admin');
    const result = await userService.canManageUsers(admin);
    expect(result).toBe(true);
  });

  it('should deny regular user from managing users', async () => {
    const regularUser = loadUser<User>('regular-user');
    const result = await userService.canManageUsers(regularUser);
    expect(result).toBe(false);
  });

  it('should reject inactive user login', async () => {
    const inactiveUser = loadUser<User>('inactive-user');
    await expect(userService.login(inactiveUser.email, 'password')).rejects.toThrow(
      'Account is inactive'
    );
  });

  it('should load all test users', () => {
    const allUsers = loadAllUsers<User>();
    expect(allUsers.length).toBeGreaterThan(0);
    expect(allUsers.every((u) => u.email)).toBe(true);
  });
});
```

### Python Fixtures (pytest)

**Fixture conftest**:

```python
# tests/conftest.py
import json
from pathlib import Path
from typing import Any, Dict, List

import pytest

FIXTURES_PATH = Path(__file__).parent / "fixtures"

def load_fixture(fixture_type: str, name: str) -> Dict[str, Any]:
    """Load a JSON fixture file."""
    file_path = FIXTURES_PATH / fixture_type / f"{name}.json"
    with open(file_path) as f:
        return json.load(f)

def load_all_fixtures(fixture_type: str) -> List[Dict[str, Any]]:
    """Load all fixtures of a given type."""
    dir_path = FIXTURES_PATH / fixture_type
    fixtures = []
    for file_path in dir_path.glob("*.json"):
        with open(file_path) as f:
            fixtures.append(json.load(f))
    return fixtures

@pytest.fixture
def admin_user() -> Dict[str, Any]:
    """Load admin user fixture."""
    return load_fixture("users", "admin")

@pytest.fixture
def regular_user() -> Dict[str, Any]:
    """Load regular user fixture."""
    return load_fixture("users", "regular-user")

@pytest.fixture
def inactive_user() -> Dict[str, Any]:
    """Load inactive user fixture."""
    return load_fixture("users", "inactive-user")

@pytest.fixture
def all_users() -> List[Dict[str, Any]]:
    """Load all user fixtures."""
    return load_all_fixtures("users")

@pytest.fixture
def electronics_product() -> Dict[str, Any]:
    """Load electronics product fixture."""
    return load_fixture("products", "electronics")

@pytest.fixture
def out_of_stock_product() -> Dict[str, Any]:
    """Load out of stock product fixture."""
    return load_fixture("products", "out-of-stock")

@pytest.fixture
def on_sale_product() -> Dict[str, Any]:
    """Load on sale product fixture."""
    return load_fixture("products", "on-sale")

@pytest.fixture
def all_products() -> List[Dict[str, Any]]:
    """Load all product fixtures."""
    return load_all_fixtures("products")
```

**Usage in tests**:

```python
# tests/test_user_service.py
import pytest
from services.user_service import UserService

class TestUserService:
    """Tests for UserService."""

    def test_admin_can_manage_users(self, admin_user):
        """Test that admin users can manage other users."""
        service = UserService()
        result = service.can_manage_users(admin_user)
        assert result is True

    def test_regular_user_cannot_manage_users(self, regular_user):
        """Test that regular users cannot manage other users."""
        service = UserService()
        result = service.can_manage_users(regular_user)
        assert result is False

    def test_inactive_user_cannot_login(self, inactive_user):
        """Test that inactive users cannot login."""
        service = UserService()
        with pytest.raises(ValueError, match="Account is inactive"):
            service.login(inactive_user["email"], "password")

    def test_all_users_have_email(self, all_users):
        """Test that all user fixtures have email addresses."""
        assert len(all_users) > 0
        assert all(user.get("email") for user in all_users)
```

---

## Data Anonymization

### Python Anonymization Library

**Anonymizer module**:

```python
# anonymizer/core.py
import hashlib
import re
from datetime import date, datetime, timedelta
from typing import Any, Callable, Dict, List, Optional

from faker import Faker

class DataAnonymizer:
    """Anonymize sensitive data while preserving structure and relationships."""

    def __init__(self, seed: int = 42, locale: str = "en_US"):
        self.fake = Faker(locale)
        Faker.seed(seed)
        self._email_map: Dict[str, str] = {}
        self._name_map: Dict[str, str] = {}
        self._phone_map: Dict[str, str] = {}
        self._ssn_map: Dict[str, str] = {}

    def anonymize_email(self, email: str, preserve_domain: bool = False) -> str:
        """Anonymize email address, optionally preserving domain."""
        if email in self._email_map:
            return self._email_map[email]

        if preserve_domain:
            domain = email.split("@")[1]
            new_email = f"{self.fake.user_name()}@{domain}"
        else:
            new_email = self.fake.email()

        self._email_map[email] = new_email
        return new_email

    def anonymize_name(self, name: str) -> str:
        """Anonymize a person's name consistently."""
        if name in self._name_map:
            return self._name_map[name]

        new_name = self.fake.name()
        self._name_map[name] = new_name
        return new_name

    def anonymize_phone(self, phone: str) -> str:
        """Anonymize phone number while preserving format."""
        if phone in self._phone_map:
            return self._phone_map[phone]

        digits_only = re.sub(r"\D", "", phone)
        new_digits = "".join(str(self.fake.random_digit()) for _ in digits_only)
        new_phone = phone
        idx = 0
        result = []
        for char in phone:
            if char.isdigit():
                result.append(new_digits[idx])
                idx += 1
            else:
                result.append(char)
        new_phone = "".join(result)
        self._phone_map[phone] = new_phone
        return new_phone

    def anonymize_ssn(self, ssn: str) -> str:
        """Anonymize SSN while preserving format."""
        if ssn in self._ssn_map:
            return self._ssn_map[ssn]

        new_ssn = self.fake.ssn()
        self._ssn_map[ssn] = new_ssn
        return new_ssn

    def anonymize_address(self, address: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize address while preserving structure."""
        return {
            "street": self.fake.street_address(),
            "city": self.fake.city(),
            "state": self.fake.state_abbr(),
            "zip_code": self.fake.zipcode(),
            "country": address.get("country", "US"),
        }

    def anonymize_date(
        self,
        original_date: date,
        variance_days: int = 30,
        preserve_year: bool = False
    ) -> date:
        """Anonymize date with configurable variance."""
        delta = timedelta(days=self.fake.random_int(-variance_days, variance_days))
        new_date = original_date + delta

        if preserve_year:
            new_date = new_date.replace(year=original_date.year)

        return new_date

    def anonymize_ip(self, ip: str) -> str:
        """Anonymize IP address."""
        if ":" in ip:
            return self.fake.ipv6()
        return self.fake.ipv4()

    def hash_identifier(self, identifier: str, salt: str = "") -> str:
        """Create consistent hash for an identifier."""
        combined = f"{identifier}{salt}"
        return hashlib.sha256(combined.encode()).hexdigest()[:16]

    def anonymize_credit_card(self, card_number: str) -> str:
        """Anonymize credit card, preserving last 4 digits."""
        last_four = card_number[-4:]
        return f"{'*' * 12}{last_four}"

    def anonymize_record(
        self,
        record: Dict[str, Any],
        field_handlers: Dict[str, Callable[[Any], Any]]
    ) -> Dict[str, Any]:
        """Anonymize a record using specified field handlers."""
        result = record.copy()
        for field, handler in field_handlers.items():
            if field in result and result[field] is not None:
                result[field] = handler(result[field])
        return result

    def anonymize_records(
        self,
        records: List[Dict[str, Any]],
        field_handlers: Dict[str, Callable[[Any], Any]]
    ) -> List[Dict[str, Any]]:
        """Anonymize multiple records consistently."""
        return [self.anonymize_record(r, field_handlers) for r in records]
```

**Anonymization runner**:

```python
# anonymizer/runner.py
import argparse
import json
from typing import Any, Dict, List

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from anonymizer.core import DataAnonymizer

def anonymize_users_table(
    source_url: str,
    target_url: str,
    batch_size: int = 1000
) -> int:
    """Anonymize users table from source to target database."""
    anonymizer = DataAnonymizer()

    source_engine = create_engine(source_url)
    target_engine = create_engine(target_url)

    field_handlers = {
        "email": lambda x: anonymizer.anonymize_email(x, preserve_domain=True),
        "first_name": lambda x: anonymizer.fake.first_name(),
        "last_name": lambda x: anonymizer.fake.last_name(),
        "phone": anonymizer.anonymize_phone,
        "ssn": anonymizer.anonymize_ssn,
        "address": anonymizer.anonymize_address,
    }

    total_processed = 0
    offset = 0

    with source_engine.connect() as source_conn:
        with target_engine.connect() as target_conn:
            while True:
                result = source_conn.execute(
                    text(f"SELECT * FROM users LIMIT {batch_size} OFFSET {offset}")
                )
                rows = [dict(row._mapping) for row in result]

                if not rows:
                    break

                anonymized_rows = anonymizer.anonymize_records(rows, field_handlers)

                for row in anonymized_rows:
                    columns = ", ".join(row.keys())
                    placeholders = ", ".join(f":{k}" for k in row.keys())
                    target_conn.execute(
                        text(f"INSERT INTO users ({columns}) VALUES ({placeholders})"),
                        row
                    )

                target_conn.commit()
                total_processed += len(rows)
                offset += batch_size
                print(f"Processed {total_processed} records...")

    return total_processed

def anonymize_json_file(
    input_path: str,
    output_path: str,
    field_config: Dict[str, str]
) -> None:
    """Anonymize a JSON file based on field configuration."""
    anonymizer = DataAnonymizer()

    handler_map = {
        "email": lambda x: anonymizer.anonymize_email(x),
        "name": anonymizer.anonymize_name,
        "phone": anonymizer.anonymize_phone,
        "ssn": anonymizer.anonymize_ssn,
        "address": anonymizer.anonymize_address,
        "ip": anonymizer.anonymize_ip,
        "credit_card": anonymizer.anonymize_credit_card,
    }

    field_handlers = {
        field: handler_map[handler_type]
        for field, handler_type in field_config.items()
        if handler_type in handler_map
    }

    with open(input_path) as f:
        data = json.load(f)

    if isinstance(data, list):
        anonymized = anonymizer.anonymize_records(data, field_handlers)
    else:
        anonymized = anonymizer.anonymize_record(data, field_handlers)

    with open(output_path, "w") as f:
        json.dump(anonymized, f, indent=2, default=str)

def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(description="Anonymize sensitive data")
    subparsers = parser.add_subparsers(dest="command")

    db_parser = subparsers.add_parser("database", help="Anonymize database")
    db_parser.add_argument("--source", required=True, help="Source database URL")
    db_parser.add_argument("--target", required=True, help="Target database URL")
    db_parser.add_argument("--batch-size", type=int, default=1000)

    json_parser = subparsers.add_parser("json", help="Anonymize JSON file")
    json_parser.add_argument("--input", required=True, help="Input JSON file")
    json_parser.add_argument("--output", required=True, help="Output JSON file")
    json_parser.add_argument(
        "--config",
        required=True,
        help="Field config JSON (e.g., {\"email\": \"email\", \"name\": \"name\"})"
    )

    args = parser.parse_args()

    if args.command == "database":
        count = anonymize_users_table(args.source, args.target, args.batch_size)
        print(f"Anonymized {count} records")
    elif args.command == "json":
        field_config = json.loads(args.config)
        anonymize_json_file(args.input, args.output, field_config)
        print(f"Anonymized {args.input} -> {args.output}")

if __name__ == "__main__":
    main()
```

**Run anonymization**:

```bash
## Anonymize database
python -m anonymizer.runner database \
  --source postgresql://prod:pass@prod-db/app \
  --target postgresql://test:pass@test-db/app \
  --batch-size 5000

## Anonymize JSON file
python -m anonymizer.runner json \
  --input users_export.json \
  --output users_anonymized.json \
  --config '{"email": "email", "full_name": "name", "phone_number": "phone"}'
```

### TypeScript Anonymization

**Anonymizer class**:

```typescript
// src/anonymizer/index.ts
import { faker } from '@faker-js/faker';
import * as crypto from 'crypto';

interface AnonymizerOptions {
  seed?: number;
  locale?: string;
}

interface FieldHandlers {
  [key: string]: (value: unknown) => unknown;
}

export class DataAnonymizer {
  private emailMap: Map<string, string> = new Map();
  private nameMap: Map<string, string> = new Map();
  private phoneMap: Map<string, string> = new Map();

  constructor(options: AnonymizerOptions = {}) {
    const { seed = 42, locale = 'en' } = options;
    faker.seed(seed);
    faker.setDefaultRefDate(new Date());
  }

  anonymizeEmail(email: string, preserveDomain = false): string {
    if (this.emailMap.has(email)) {
      return this.emailMap.get(email)!;
    }

    let newEmail: string;
    if (preserveDomain) {
      const domain = email.split('@')[1];
      newEmail = `${faker.internet.userName()}@${domain}`;
    } else {
      newEmail = faker.internet.email();
    }

    this.emailMap.set(email, newEmail);
    return newEmail;
  }

  anonymizeName(name: string): string {
    if (this.nameMap.has(name)) {
      return this.nameMap.get(name)!;
    }

    const newName = faker.person.fullName();
    this.nameMap.set(name, newName);
    return newName;
  }

  anonymizePhone(phone: string): string {
    if (this.phoneMap.has(phone)) {
      return this.phoneMap.get(phone)!;
    }

    const digitsOnly = phone.replace(/\D/g, '');
    const newDigits = Array.from(digitsOnly, () =>
      faker.number.int({ min: 0, max: 9 }).toString()
    ).join('');

    let idx = 0;
    const newPhone = phone
      .split('')
      .map((char) => {
        if (/\d/.test(char)) {
          return newDigits[idx++];
        }
        return char;
      })
      .join('');

    this.phoneMap.set(phone, newPhone);
    return newPhone;
  }

  anonymizeAddress(address: Record<string, unknown>): Record<string, unknown> {
    return {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode(),
      country: address.country ?? 'US',
    };
  }

  anonymizeDate(originalDate: Date, varianceDays = 30): Date {
    const variance = faker.number.int({ min: -varianceDays, max: varianceDays });
    const newDate = new Date(originalDate);
    newDate.setDate(newDate.getDate() + variance);
    return newDate;
  }

  anonymizeIp(ip: string): string {
    return ip.includes(':') ? faker.internet.ipv6() : faker.internet.ipv4();
  }

  hashIdentifier(identifier: string, salt = ''): string {
    const combined = `${identifier}${salt}`;
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
  }

  anonymizeCreditCard(cardNumber: string): string {
    const lastFour = cardNumber.slice(-4);
    return `${'*'.repeat(12)}${lastFour}`;
  }

  anonymizeRecord<T extends Record<string, unknown>>(
    record: T,
    fieldHandlers: FieldHandlers
  ): T {
    const result = { ...record };
    for (const [field, handler] of Object.entries(fieldHandlers)) {
      if (field in result && result[field] != null) {
        (result as Record<string, unknown>)[field] = handler(result[field]);
      }
    }
    return result;
  }

  anonymizeRecords<T extends Record<string, unknown>>(
    records: T[],
    fieldHandlers: FieldHandlers
  ): T[] {
    return records.map((record) => this.anonymizeRecord(record, fieldHandlers));
  }
}

// Factory function
export function createAnonymizer(options?: AnonymizerOptions): DataAnonymizer {
  return new DataAnonymizer(options);
}
```

**Usage example**:

```typescript
// scripts/anonymize-export.ts
import * as fs from 'fs';
import { createAnonymizer } from '../src/anonymizer';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: Record<string, unknown>;
  ssn: string;
  createdAt: string;
}

async function anonymizeUserExport(inputPath: string, outputPath: string): Promise<void> {
  const anonymizer = createAnonymizer({ seed: 42 });

  const rawData = fs.readFileSync(inputPath, 'utf-8');
  const users: User[] = JSON.parse(rawData);

  const fieldHandlers = {
    email: (v: unknown) => anonymizer.anonymizeEmail(v as string, true),
    name: (v: unknown) => anonymizer.anonymizeName(v as string),
    phone: (v: unknown) => anonymizer.anonymizePhone(v as string),
    address: (v: unknown) => anonymizer.anonymizeAddress(v as Record<string, unknown>),
    ssn: () => '***-**-****',
  };

  const anonymizedUsers = anonymizer.anonymizeRecords(users, fieldHandlers);

  fs.writeFileSync(outputPath, JSON.stringify(anonymizedUsers, null, 2));
  console.log(`Anonymized ${users.length} users to ${outputPath}`);
}

anonymizeUserExport('./data/users-export.json', './data/users-anonymized.json');
```

---

## Synthetic Data Generation

### Factory Pattern (Python)

**Factory module**:

```python
# factories/base.py
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar
from faker import Faker

T = TypeVar("T")

class Factory(Generic[T]):
    """Base factory for generating test data."""

    model: Type[T]
    fake: Faker = Faker()

    _sequence: int = 0

    @classmethod
    def _get_sequence(cls) -> int:
        """Get next sequence number."""
        cls._sequence += 1
        return cls._sequence

    @classmethod
    def reset_sequence(cls) -> None:
        """Reset sequence counter."""
        cls._sequence = 0

    @classmethod
    def build(cls, **overrides: Any) -> T:
        """Build an instance without persisting."""
        data = cls._get_defaults()
        data.update(overrides)
        return cls.model(**data)

    @classmethod
    def build_batch(cls, count: int, **overrides: Any) -> List[T]:
        """Build multiple instances without persisting."""
        return [cls.build(**overrides) for _ in range(count)]

    @classmethod
    def _get_defaults(cls) -> Dict[str, Any]:
        """Get default values for the model. Override in subclasses."""
        raise NotImplementedError
```

**User factory**:

```python
# factories/user.py
from datetime import datetime
from typing import Any, Dict

from models import User, UserRole
from factories.base import Factory

class UserFactory(Factory[User]):
    """Factory for generating User instances."""

    model = User

    @classmethod
    def _get_defaults(cls) -> Dict[str, Any]:
        """Get default values for User."""
        seq = cls._get_sequence()
        return {
            "email": f"user{seq}@example.com",
            "username": f"user{seq}",
            "first_name": cls.fake.first_name(),
            "last_name": cls.fake.last_name(),
            "hashed_password": "hashed_test_password",
            "role": UserRole.USER,
            "is_active": True,
            "created_at": datetime.utcnow(),
        }

    @classmethod
    def admin(cls, **overrides: Any) -> User:
        """Create an admin user."""
        defaults = {"role": UserRole.ADMIN, "is_active": True}
        defaults.update(overrides)
        return cls.build(**defaults)

    @classmethod
    def inactive(cls, **overrides: Any) -> User:
        """Create an inactive user."""
        defaults = {"is_active": False}
        defaults.update(overrides)
        return cls.build(**defaults)

    @classmethod
    def with_profile(cls, **overrides: Any) -> User:
        """Create a user with complete profile."""
        defaults = {
            "phone": cls.fake.phone_number(),
            "bio": cls.fake.paragraph(),
            "avatar_url": cls.fake.image_url(),
            "address": {
                "street": cls.fake.street_address(),
                "city": cls.fake.city(),
                "state": cls.fake.state_abbr(),
                "zip_code": cls.fake.zipcode(),
            },
        }
        defaults.update(overrides)
        return cls.build(**defaults)
```

**Product factory**:

```python
# factories/product.py
from decimal import Decimal
from typing import Any, Dict, Optional

from models import Product
from factories.base import Factory

class ProductFactory(Factory[Product]):
    """Factory for generating Product instances."""

    model = Product

    @classmethod
    def _get_defaults(cls) -> Dict[str, Any]:
        """Get default values for Product."""
        seq = cls._get_sequence()
        price = Decimal(str(cls.fake.pyfloat(min_value=10, max_value=500)))
        return {
            "name": cls.fake.catch_phrase(),
            "description": cls.fake.paragraph(nb_sentences=3),
            "sku": f"SKU-{seq:06d}",
            "price": price.quantize(Decimal("0.01")),
            "sale_price": None,
            "stock_quantity": cls.fake.random_int(min=1, max=100),
            "is_active": True,
        }

    @classmethod
    def on_sale(cls, discount_percent: int = 20, **overrides: Any) -> Product:
        """Create a product on sale."""
        product = cls.build(**overrides)
        discount = Decimal(str(discount_percent)) / 100
        product.sale_price = (product.price * (1 - discount)).quantize(Decimal("0.01"))
        return product

    @classmethod
    def out_of_stock(cls, **overrides: Any) -> Product:
        """Create an out-of-stock product."""
        defaults = {"stock_quantity": 0}
        defaults.update(overrides)
        return cls.build(**defaults)

    @classmethod
    def expensive(cls, min_price: Decimal = Decimal("500"), **overrides: Any) -> Product:
        """Create an expensive product."""
        price = Decimal(str(cls.fake.pyfloat(min_value=float(min_price), max_value=5000)))
        defaults = {"price": price.quantize(Decimal("0.01"))}
        defaults.update(overrides)
        return cls.build(**defaults)

    @classmethod
    def with_variants(cls, variant_count: int = 3, **overrides: Any) -> Product:
        """Create a product with variants."""
        base_product = cls.build(**overrides)
        base_product.variants = [
            {
                "name": f"Variant {i + 1}",
                "sku": f"{base_product.sku}-V{i + 1}",
                "price_modifier": Decimal(str(cls.fake.pyfloat(-10, 10))),
                "stock": cls.fake.random_int(0, 50),
            }
            for i in range(variant_count)
        ]
        return base_product
```

**Usage in tests**:

```python
# tests/test_order_service.py
import pytest
from factories.user import UserFactory
from factories.product import ProductFactory
from services.order_service import OrderService

class TestOrderService:
    """Tests for OrderService using factories."""

    @pytest.fixture(autouse=True)
    def reset_factories(self):
        """Reset factory sequences before each test."""
        UserFactory.reset_sequence()
        ProductFactory.reset_sequence()

    def test_create_order(self):
        """Test creating an order."""
        user = UserFactory.build()
        products = ProductFactory.build_batch(3)
        service = OrderService()

        order = service.create_order(user, products)

        assert order.user_id == user.id
        assert len(order.items) == 3

    def test_admin_can_cancel_any_order(self):
        """Test that admin users can cancel any order."""
        admin = UserFactory.admin()
        regular_user = UserFactory.build()
        products = ProductFactory.build_batch(2)
        service = OrderService()

        order = service.create_order(regular_user, products)
        result = service.cancel_order(admin, order)

        assert result.success is True

    def test_out_of_stock_product_not_orderable(self):
        """Test that out-of-stock products cannot be ordered."""
        user = UserFactory.build()
        product = ProductFactory.out_of_stock()
        service = OrderService()

        with pytest.raises(ValueError, match="out of stock"):
            service.create_order(user, [product])

    def test_sale_price_applied_to_order(self):
        """Test that sale prices are applied correctly."""
        user = UserFactory.build()
        product = ProductFactory.on_sale(discount_percent=25)
        service = OrderService()

        order = service.create_order(user, [product])

        assert order.items[0].unit_price == product.sale_price
```

### Factory Pattern (TypeScript)

**Factory module**:

```typescript
// tests/factories/base.factory.ts
import { faker } from '@faker-js/faker';

export abstract class Factory<T> {
  protected static sequence = 0;

  protected static getSequence(): number {
    return ++this.sequence;
  }

  static resetSequence(): void {
    this.sequence = 0;
  }

  abstract build(overrides?: Partial<T>): T;

  buildBatch(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}
```

**User factory**:

```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import { User, UserRole } from '../../src/models/user';
import { Factory } from './base.factory';

export class UserFactory extends Factory<User> {
  private static seq = 0;

  build(overrides: Partial<User> = {}): User {
    const seq = ++UserFactory.seq;

    const defaults: User = {
      id: `usr_${faker.string.alphanumeric(10)}`,
      email: `user${seq}@example.com`,
      username: `user${seq}`,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: 'hashed_test_password',
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { ...defaults, ...overrides };
  }

  admin(overrides: Partial<User> = {}): User {
    return this.build({ role: UserRole.ADMIN, isActive: true, ...overrides });
  }

  inactive(overrides: Partial<User> = {}): User {
    return this.build({ isActive: false, ...overrides });
  }

  withProfile(overrides: Partial<User> = {}): User {
    return this.build({
      phone: faker.phone.number(),
      bio: faker.lorem.paragraph(),
      avatarUrl: faker.image.avatar(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode(),
      },
      ...overrides,
    });
  }

  static reset(): void {
    UserFactory.seq = 0;
  }
}

export const userFactory = new UserFactory();
```

**Product factory**:

```typescript
// tests/factories/product.factory.ts
import { faker } from '@faker-js/faker';
import { Product } from '../../src/models/product';
import { Factory } from './base.factory';

export class ProductFactory extends Factory<Product> {
  private static seq = 0;

  build(overrides: Partial<Product> = {}): Product {
    const seq = ++ProductFactory.seq;
    const price = faker.number.float({ min: 10, max: 500, fractionDigits: 2 });

    const defaults: Product = {
      id: `prod_${faker.string.alphanumeric(10)}`,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      sku: `SKU-${String(seq).padStart(6, '0')}`,
      price,
      salePrice: null,
      stockQuantity: faker.number.int({ min: 1, max: 100 }),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { ...defaults, ...overrides };
  }

  onSale(discountPercent = 20, overrides: Partial<Product> = {}): Product {
    const product = this.build(overrides);
    product.salePrice = Number((product.price * (1 - discountPercent / 100)).toFixed(2));
    return product;
  }

  outOfStock(overrides: Partial<Product> = {}): Product {
    return this.build({ stockQuantity: 0, ...overrides });
  }

  expensive(minPrice = 500, overrides: Partial<Product> = {}): Product {
    const price = faker.number.float({ min: minPrice, max: 5000, fractionDigits: 2 });
    return this.build({ price, ...overrides });
  }

  static reset(): void {
    ProductFactory.seq = 0;
  }
}

export const productFactory = new ProductFactory();
```

**Usage in tests**:

```typescript
// tests/order.service.test.ts
import { userFactory, UserFactory } from './factories/user.factory';
import { productFactory, ProductFactory } from './factories/product.factory';
import { OrderService } from '../src/services/order.service';

describe('OrderService', () => {
  let orderService: OrderService;

  beforeEach(() => {
    UserFactory.reset();
    ProductFactory.reset();
    orderService = new OrderService();
  });

  it('should create an order', async () => {
    const user = userFactory.build();
    const products = productFactory.buildBatch(3);

    const order = await orderService.createOrder(user, products);

    expect(order.userId).toBe(user.id);
    expect(order.items).toHaveLength(3);
  });

  it('should allow admin to cancel any order', async () => {
    const admin = userFactory.admin();
    const regularUser = userFactory.build();
    const products = productFactory.buildBatch(2);

    const order = await orderService.createOrder(regularUser, products);
    const result = await orderService.cancelOrder(admin, order);

    expect(result.success).toBe(true);
  });

  it('should reject order for out-of-stock product', async () => {
    const user = userFactory.build();
    const product = productFactory.outOfStock();

    await expect(orderService.createOrder(user, [product])).rejects.toThrow('out of stock');
  });

  it('should apply sale price to order', async () => {
    const user = userFactory.build();
    const product = productFactory.onSale(25);

    const order = await orderService.createOrder(user, [product]);

    expect(order.items[0].unitPrice).toBe(product.salePrice);
  });
});
```

---

## Environment-Specific Seeding

### Makefile Commands

```makefile
# Makefile
.PHONY: seed-dev seed-staging seed-test seed-demo clean-db

# Development environment - full synthetic data
seed-dev:
 @echo "Seeding development database..."
 python -m seeds.runner \
  --database-url $(DEV_DATABASE_URL) \
  --users 500 \
  --products 200 \
  --orders 1000 \
  --seed 42

# Staging environment - anonymized production subset
seed-staging:
 @echo "Anonymizing and seeding staging database..."
 python -m anonymizer.runner database \
  --source $(PROD_DATABASE_URL) \
  --target $(STAGING_DATABASE_URL) \
  --batch-size 10000
 @echo "Staging seeding complete"

# Test environment - minimal data for fast tests
seed-test:
 @echo "Seeding test database..."
 python -m seeds.runner \
  --database-url $(TEST_DATABASE_URL) \
  --users 10 \
  --products 20 \
  --orders 50 \
  --seed 12345 \
  --quiet

# Demo environment - curated showcase data
seed-demo:
 @echo "Seeding demo database..."
 python -m seeds.demo_runner \
  --database-url $(DEMO_DATABASE_URL)

# Clean all test data
clean-db:
 @echo "Cleaning database..."
 python -m seeds.cleanup --database-url $(DATABASE_URL)
```

**Run commands**:

```bash
## Seed development environment
make seed-dev

## Seed staging with anonymized data
make seed-staging

## Seed test environment
make seed-test

## Seed demo environment
make seed-demo

## Clean database
make clean-db
```

### Docker Compose Seeding

**docker-compose.seed.yml**:

```yaml
version: '3.8'

services:
  seed-dev:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://dev:devpass@postgres:5432/devdb
      SEED_COUNT_USERS: 500
      SEED_COUNT_PRODUCTS: 200
      SEED_COUNT_ORDERS: 1000
      SEED_RANDOM_SEED: 42
    command: python -m seeds.runner
    depends_on:
      postgres:
        condition: service_healthy

  seed-test:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://test:testpass@postgres:5432/testdb
      SEED_COUNT_USERS: 10
      SEED_COUNT_PRODUCTS: 20
      SEED_COUNT_ORDERS: 50
      SEED_RANDOM_SEED: 12345
    command: python -m seeds.runner --quiet
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5
    volumes:
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql
```

**Run seeding**:

```bash
## Seed development database
docker-compose -f docker-compose.seed.yml run --rm seed-dev

## Seed test database
docker-compose -f docker-compose.seed.yml run --rm seed-test

## Seed both
docker-compose -f docker-compose.seed.yml up seed-dev seed-test
```

---

## CI/CD Integration

### GitHub Actions Seed Workflow

```yaml
name: Database Seeding

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - development
          - staging
          - test
      user_count:
        description: 'Number of users to seed'
        required: false
        default: '100'
      seed:
        description: 'Random seed for reproducibility'
        required: false
        default: '42'

jobs:
  seed-database:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -e .[seed]

      - name: Run database migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          alembic upgrade head

      - name: Seed database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          python -m seeds.runner \
            --database-url "$DATABASE_URL" \
            --users ${{ github.event.inputs.user_count }} \
            --seed ${{ github.event.inputs.seed }}

      - name: Verify seeding
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          python -m seeds.verify --database-url "$DATABASE_URL"
```

### Pre-Test Seeding

```yaml
name: Tests with Seeding

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -e .[test]

      - name: Run migrations
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
        run: |
          alembic upgrade head

      - name: Seed test database
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
        run: |
          python -m seeds.runner \
            --database-url "$DATABASE_URL" \
            --users 10 \
            --products 20 \
            --orders 50 \
            --seed 12345 \
            --quiet

      - name: Run tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
        run: |
          pytest tests/ -v --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
```

---

## Best Practices

### Seed Data Checklist

```text
✅ Use fixed random seeds for reproducibility
✅ Version control all seed scripts
✅ Document data relationships and dependencies
✅ Keep test seeds minimal for fast execution
✅ Never use production data directly
✅ Anonymize all PII before using in non-prod
✅ Use factories for flexible test data generation
✅ Reset sequences between tests
✅ Clean up seed data after tests
✅ Validate seed data integrity
```

### Data Generation Guidelines

```python
# guidelines.py
"""
Seed data generation guidelines and examples.
"""

# DO: Use fixed seeds for reproducibility
from faker import Faker
fake = Faker()
Faker.seed(42)  # Always reproducible

# DO: Generate realistic but clearly fake data
def generate_test_email(user_id: int) -> str:
    return f"test.user.{user_id}@example.com"

# DO: Use obvious test values
TEST_PASSWORD = "TestPassword123!"
TEST_API_KEY = "test_api_key_do_not_use_in_production"

# DON'T: Use real-looking sensitive data
# BAD: ssn = "123-45-6789"
# GOOD: ssn = "000-00-0000"

# DO: Document data relationships
"""
User -> Order relationship:
- Each user can have 0-N orders
- Orders reference user.id as foreign key
- Seed users before orders
"""

# DO: Provide cleanup mechanisms
class Seeder:
    def __init__(self):
        self._created_ids = []

    def cleanup(self):
        for id in reversed(self._created_ids):
            self.delete(id)
```

### Performance Considerations

```python
# performance.py
"""
Performance-optimized seeding strategies.
"""
from contextlib import contextmanager
from sqlalchemy.orm import Session

# DO: Use bulk inserts for large datasets
def seed_bulk(session: Session, records: list, batch_size: int = 1000):
    """Bulk insert records in batches."""
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        session.bulk_save_objects(batch)
        session.commit()

# DO: Disable constraints temporarily for large seeds
@contextmanager
def disable_constraints(session: Session):
    """Temporarily disable foreign key checks."""
    session.execute("SET session_replication_role = 'replica';")
    try:
        yield
    finally:
        session.execute("SET session_replication_role = 'origin';")

# DO: Use connection pooling
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20
)

# DO: Index after bulk insert
def seed_with_deferred_indexes(session: Session, records: list):
    """Seed with deferred index creation."""
    session.execute("DROP INDEX IF EXISTS idx_users_email;")
    seed_bulk(session, records)
    session.execute("CREATE INDEX idx_users_email ON users(email);")
```

---

## Resources

- [Faker Documentation (Python)](https://faker.readthedocs.io/)
- [Faker.js Documentation](https://fakerjs.dev/)
- [Factory Boy](https://factoryboy.readthedocs.io/)
- [Prisma Seeding](https://www.prisma.io/docs/guides/database/seed-database)
- [Data Anonymization Best Practices](https://www.datanami.com/2021/03/08/best-practices-for-data-anonymization/)

---

**Next Steps:**

- Review the [Environment Configuration Guide](environment_configuration.md) for multi-environment management
- See [Testing Strategies](testing_strategies.md) for test data usage patterns
- Check [CI/CD Integration](github_actions_guide.md) for automated seeding workflows
