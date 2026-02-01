---
title: "Code Smell Catalog"
description: "Comprehensive catalog of code smells with detection strategies and refactoring solutions"
author: "Tyler Dukes"
tags: [code-smells, anti-patterns, refactoring, code-quality, best-practices]
category: "Anti-Patterns"
status: "active"
---

## Overview

Code smells are surface indications of deeper problems in code. They are not bugs—the code works—but
they indicate weaknesses that may slow development or increase the risk of bugs or failures.

---

## Bloaters

Bloaters are code, methods, and classes that grow excessively over time, becoming too large to work with.

---

### Long Method

**Description**: A method containing too many lines of code, making it hard to understand and maintain.

**Detection**:

- Method exceeds 20-30 lines
- Method does multiple unrelated things
- Difficult to name the method concisely
- Requires scrolling to read

**Bad Example**:

```python
def process_order(order_data: dict) -> dict:
    # Validate order
    if not order_data.get("customer_id"):
        raise ValueError("Customer ID required")
    if not order_data.get("items"):
        raise ValueError("Items required")
    if not isinstance(order_data["items"], list):
        raise ValueError("Items must be a list")
    for item in order_data["items"]:
        if not item.get("product_id"):
            raise ValueError("Product ID required")
        if not item.get("quantity") or item["quantity"] < 1:
            raise ValueError("Valid quantity required")
        if item["quantity"] > 100:
            raise ValueError("Quantity exceeds maximum")

    # Calculate totals
    subtotal = 0
    for item in order_data["items"]:
        product = get_product(item["product_id"])
        if not product:
            raise ValueError(f"Product {item['product_id']} not found")
        item_total = product["price"] * item["quantity"]
        if item.get("discount_percent"):
            item_total *= (1 - item["discount_percent"] / 100)
        subtotal += item_total

    # Apply customer discount
    customer = get_customer(order_data["customer_id"])
    if customer.get("tier") == "gold":
        subtotal *= 0.9
    elif customer.get("tier") == "platinum":
        subtotal *= 0.85

    # Calculate tax
    tax_rate = get_tax_rate(customer.get("state", "CA"))
    tax = subtotal * tax_rate
    total = subtotal + tax

    # Calculate shipping
    if total > 100:
        shipping = 0
    elif total > 50:
        shipping = 5.99
    else:
        shipping = 9.99

    # Create order record
    order = {
        "id": generate_order_id(),
        "customer_id": order_data["customer_id"],
        "items": order_data["items"],
        "subtotal": subtotal,
        "tax": tax,
        "shipping": shipping,
        "total": total + shipping,
        "status": "pending",
        "created_at": datetime.now().isoformat(),
    }

    # Save to database
    save_order(order)

    # Send confirmation email
    customer_email = customer.get("email")
    if customer_email:
        send_email(
            to=customer_email,
            subject=f"Order {order['id']} Confirmed",
            body=f"Thank you for your order of ${order['total']:.2f}",
        )

    # Update inventory
    for item in order_data["items"]:
        update_inventory(item["product_id"], -item["quantity"])

    return order
```

**Refactored**:

```python
from dataclasses import dataclass
from typing import Optional


@dataclass
class OrderTotals:
    subtotal: float
    tax: float
    shipping: float
    total: float


class OrderProcessor:
    def __init__(self, order_data: dict):
        self.order_data = order_data
        self.customer: Optional[dict] = None
        self.items_with_prices: list[dict] = []

    def process(self) -> dict:
        self._validate_order()
        self._load_customer()
        totals = self._calculate_totals()
        order = self._create_order_record(totals)
        self._save_and_notify(order)
        return order

    def _validate_order(self) -> None:
        self._validate_customer_id()
        self._validate_items()

    def _validate_customer_id(self) -> None:
        if not self.order_data.get("customer_id"):
            raise ValueError("Customer ID required")

    def _validate_items(self) -> None:
        items = self.order_data.get("items")
        if not items:
            raise ValueError("Items required")
        if not isinstance(items, list):
            raise ValueError("Items must be a list")
        for item in items:
            self._validate_item(item)

    def _validate_item(self, item: dict) -> None:
        if not item.get("product_id"):
            raise ValueError("Product ID required")
        quantity = item.get("quantity", 0)
        if quantity < 1:
            raise ValueError("Valid quantity required")
        if quantity > 100:
            raise ValueError("Quantity exceeds maximum")

    def _load_customer(self) -> None:
        self.customer = get_customer(self.order_data["customer_id"])

    def _calculate_totals(self) -> OrderTotals:
        subtotal = self._calculate_subtotal()
        subtotal = self._apply_customer_discount(subtotal)
        tax = self._calculate_tax(subtotal)
        shipping = self._calculate_shipping(subtotal)
        return OrderTotals(
            subtotal=subtotal,
            tax=tax,
            shipping=shipping,
            total=subtotal + tax + shipping,
        )

    def _calculate_subtotal(self) -> float:
        total = 0.0
        for item in self.order_data["items"]:
            total += self._calculate_item_total(item)
        return total

    def _calculate_item_total(self, item: dict) -> float:
        product = get_product(item["product_id"])
        if not product:
            raise ValueError(f"Product {item['product_id']} not found")
        item_total = product["price"] * item["quantity"]
        if discount := item.get("discount_percent"):
            item_total *= (1 - discount / 100)
        return item_total

    def _apply_customer_discount(self, subtotal: float) -> float:
        tier_discounts = {"gold": 0.9, "platinum": 0.85}
        tier = self.customer.get("tier", "")
        return subtotal * tier_discounts.get(tier, 1.0)

    def _calculate_tax(self, subtotal: float) -> float:
        state = self.customer.get("state", "CA")
        return subtotal * get_tax_rate(state)

    def _calculate_shipping(self, subtotal: float) -> float:
        if subtotal > 100:
            return 0
        if subtotal > 50:
            return 5.99
        return 9.99

    def _create_order_record(self, totals: OrderTotals) -> dict:
        return {
            "id": generate_order_id(),
            "customer_id": self.order_data["customer_id"],
            "items": self.order_data["items"],
            "subtotal": totals.subtotal,
            "tax": totals.tax,
            "shipping": totals.shipping,
            "total": totals.total,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
        }

    def _save_and_notify(self, order: dict) -> None:
        save_order(order)
        self._send_confirmation_email(order)
        self._update_inventory()

    def _send_confirmation_email(self, order: dict) -> None:
        if email := self.customer.get("email"):
            send_email(
                to=email,
                subject=f"Order {order['id']} Confirmed",
                body=f"Thank you for your order of ${order['total']:.2f}",
            )

    def _update_inventory(self) -> None:
        for item in self.order_data["items"]:
            update_inventory(item["product_id"], -item["quantity"])


def process_order(order_data: dict) -> dict:
    return OrderProcessor(order_data).process()
```

---

### Large Class (God Object)

**Description**: A class that knows too much or does too much, violating the Single Responsibility Principle.

**Detection**:

- Class has 20+ methods
- Class has 10+ instance variables
- Class name contains "Manager", "Helper", "Util", or "Handler"
- Class is imported in many unrelated modules
- Methods operate on different subsets of fields

**Bad Example**:

```python
class UserManager:
    def __init__(self, db_connection, email_client, cache, logger):
        self.db = db_connection
        self.email = email_client
        self.cache = cache
        self.logger = logger

    # User CRUD operations
    def create_user(self, data):
        user = {"id": uuid4(), **data}
        self.db.insert("users", user)
        self.cache.invalidate("users:all")
        return user

    def get_user(self, user_id):
        cached = self.cache.get(f"user:{user_id}")
        if cached:
            return cached
        user = self.db.find_one("users", {"id": user_id})
        self.cache.set(f"user:{user_id}", user)
        return user

    def update_user(self, user_id, data):
        self.db.update("users", {"id": user_id}, data)
        self.cache.invalidate(f"user:{user_id}")

    def delete_user(self, user_id):
        self.db.delete("users", {"id": user_id})
        self.cache.invalidate(f"user:{user_id}")

    # Authentication
    def hash_password(self, password):
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt())

    def verify_password(self, password, hashed):
        return bcrypt.checkpw(password.encode(), hashed)

    def generate_token(self, user_id):
        return jwt.encode({"user_id": user_id}, SECRET_KEY)

    def verify_token(self, token):
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

    def login(self, email, password):
        user = self.db.find_one("users", {"email": email})
        if not user or not self.verify_password(password, user["password"]):
            raise AuthenticationError("Invalid credentials")
        return self.generate_token(user["id"])

    def logout(self, token):
        self.cache.set(f"blacklist:{token}", True, ttl=3600)

    # Email operations
    def send_welcome_email(self, user):
        self.email.send(
            to=user["email"],
            subject="Welcome!",
            template="welcome",
            data={"name": user["name"]},
        )

    def send_password_reset(self, user):
        token = self.generate_token(user["id"])
        self.email.send(
            to=user["email"],
            subject="Password Reset",
            template="reset",
            data={"token": token},
        )

    def send_verification_email(self, user):
        token = self.generate_token(user["id"])
        self.email.send(
            to=user["email"],
            subject="Verify Email",
            template="verify",
            data={"token": token},
        )

    # Validation
    def validate_email(self, email):
        pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
        return bool(re.match(pattern, email))

    def validate_password(self, password):
        if len(password) < 8:
            return False
        if not re.search(r"[A-Z]", password):
            return False
        if not re.search(r"[0-9]", password):
            return False
        return True

    def validate_username(self, username):
        if len(username) < 3 or len(username) > 20:
            return False
        return bool(re.match(r"^[a-zA-Z0-9_]+$", username))

    # Profile operations
    def update_avatar(self, user_id, image_data):
        path = f"avatars/{user_id}.png"
        save_image(path, image_data)
        self.update_user(user_id, {"avatar": path})

    def get_user_stats(self, user_id):
        orders = self.db.count("orders", {"user_id": user_id})
        reviews = self.db.count("reviews", {"user_id": user_id})
        return {"orders": orders, "reviews": reviews}

    # Logging
    def log_login(self, user_id, ip_address):
        self.logger.info(f"User {user_id} logged in from {ip_address}")
        self.db.insert("login_history", {
            "user_id": user_id,
            "ip": ip_address,
            "timestamp": datetime.now(),
        })
```

**Refactored**:

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass


# Separate repository for data access
class UserRepository:
    def __init__(self, db_connection, cache):
        self.db = db_connection
        self.cache = cache

    def create(self, data: dict) -> dict:
        user = {"id": uuid4(), **data}
        self.db.insert("users", user)
        self.cache.invalidate("users:all")
        return user

    def find_by_id(self, user_id: str) -> dict | None:
        cache_key = f"user:{user_id}"
        if cached := self.cache.get(cache_key):
            return cached
        user = self.db.find_one("users", {"id": user_id})
        if user:
            self.cache.set(cache_key, user)
        return user

    def find_by_email(self, email: str) -> dict | None:
        return self.db.find_one("users", {"email": email})

    def update(self, user_id: str, data: dict) -> None:
        self.db.update("users", {"id": user_id}, data)
        self.cache.invalidate(f"user:{user_id}")

    def delete(self, user_id: str) -> None:
        self.db.delete("users", {"id": user_id})
        self.cache.invalidate(f"user:{user_id}")


# Separate service for authentication
class AuthenticationService:
    def __init__(self, user_repository: UserRepository, cache, secret_key: str):
        self.users = user_repository
        self.cache = cache
        self.secret_key = secret_key

    def hash_password(self, password: str) -> bytes:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt())

    def verify_password(self, password: str, hashed: bytes) -> bool:
        return bcrypt.checkpw(password.encode(), hashed)

    def generate_token(self, user_id: str) -> str:
        return jwt.encode({"user_id": user_id}, self.secret_key)

    def verify_token(self, token: str) -> dict:
        if self.cache.get(f"blacklist:{token}"):
            raise AuthenticationError("Token has been revoked")
        return jwt.decode(token, self.secret_key, algorithms=["HS256"])

    def login(self, email: str, password: str) -> str:
        user = self.users.find_by_email(email)
        if not user or not self.verify_password(password, user["password"]):
            raise AuthenticationError("Invalid credentials")
        return self.generate_token(user["id"])

    def logout(self, token: str) -> None:
        self.cache.set(f"blacklist:{token}", True, ttl=3600)


# Separate service for email notifications
class UserEmailService:
    def __init__(self, email_client, auth_service: AuthenticationService):
        self.email = email_client
        self.auth = auth_service

    def send_welcome(self, user: dict) -> None:
        self.email.send(
            to=user["email"],
            subject="Welcome!",
            template="welcome",
            data={"name": user["name"]},
        )

    def send_password_reset(self, user: dict) -> None:
        token = self.auth.generate_token(user["id"])
        self.email.send(
            to=user["email"],
            subject="Password Reset",
            template="reset",
            data={"token": token},
        )

    def send_verification(self, user: dict) -> None:
        token = self.auth.generate_token(user["id"])
        self.email.send(
            to=user["email"],
            subject="Verify Email",
            template="verify",
            data={"token": token},
        )


# Separate validator class
@dataclass
class ValidationResult:
    is_valid: bool
    errors: list[str]


class UserValidator:
    EMAIL_PATTERN = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")
    USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]+$")

    def validate_email(self, email: str) -> ValidationResult:
        if not self.EMAIL_PATTERN.match(email):
            return ValidationResult(False, ["Invalid email format"])
        return ValidationResult(True, [])

    def validate_password(self, password: str) -> ValidationResult:
        errors = []
        if len(password) < 8:
            errors.append("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", password):
            errors.append("Password must contain uppercase letter")
        if not re.search(r"[0-9]", password):
            errors.append("Password must contain a number")
        return ValidationResult(len(errors) == 0, errors)

    def validate_username(self, username: str) -> ValidationResult:
        errors = []
        if len(username) < 3:
            errors.append("Username must be at least 3 characters")
        if len(username) > 20:
            errors.append("Username must be at most 20 characters")
        if not self.USERNAME_PATTERN.match(username):
            errors.append("Username can only contain letters, numbers, underscore")
        return ValidationResult(len(errors) == 0, errors)


# Separate service for user activity logging
class UserActivityLogger:
    def __init__(self, db_connection, logger):
        self.db = db_connection
        self.logger = logger

    def log_login(self, user_id: str, ip_address: str) -> None:
        self.logger.info(f"User {user_id} logged in from {ip_address}")
        self.db.insert("login_history", {
            "user_id": user_id,
            "ip": ip_address,
            "timestamp": datetime.now(),
        })


# Facade for common operations
class UserService:
    def __init__(
        self,
        repository: UserRepository,
        auth: AuthenticationService,
        email: UserEmailService,
        validator: UserValidator,
    ):
        self.repository = repository
        self.auth = auth
        self.email = email
        self.validator = validator

    def register(self, data: dict) -> dict:
        email_result = self.validator.validate_email(data["email"])
        if not email_result.is_valid:
            raise ValidationError(email_result.errors)

        password_result = self.validator.validate_password(data["password"])
        if not password_result.is_valid:
            raise ValidationError(password_result.errors)

        data["password"] = self.auth.hash_password(data["password"])
        user = self.repository.create(data)
        self.email.send_welcome(user)
        return user
```

---

### Long Parameter List

**Description**: A method that takes too many parameters, making it hard to call and understand.

**Detection**:

- Function has 4+ parameters
- Parameters are often passed as None or default values
- Related parameters are passed together repeatedly
- Boolean flag parameters control branching

**Bad Example**:

```typescript
function createUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  phone: string | null,
  address: string | null,
  city: string | null,
  state: string | null,
  zipCode: string | null,
  country: string,
  isAdmin: boolean,
  isVerified: boolean,
  sendWelcomeEmail: boolean,
  subscribeToNewsletter: boolean
): User {
  const user = {
    id: generateId(),
    firstName,
    lastName,
    email,
    password: hashPassword(password),
    phone,
    address: {
      street: address,
      city,
      state,
      zipCode,
      country,
    },
    isAdmin,
    isVerified,
    createdAt: new Date(),
  };

  saveUser(user);

  if (sendWelcomeEmail) {
    sendEmail(email, "Welcome!", "Thank you for joining");
  }

  if (subscribeToNewsletter) {
    addToNewsletter(email);
  }

  return user;
}

// Hard to read call site
const user = createUser(
  "John",
  "Doe",
  "john@example.com",
  "secret123",
  null,
  "123 Main St",
  "Springfield",
  "IL",
  "62701",
  "USA",
  false,
  false,
  true,
  false
);
```

**Refactored**:

```typescript
// Group related data into objects
interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
}

interface UserOptions {
  isAdmin?: boolean;
  isVerified?: boolean;
  sendWelcomeEmail?: boolean;
  subscribeToNewsletter?: boolean;
}

interface CreateUserRequest {
  personal: PersonalInfo;
  address: Address;
  options?: UserOptions;
}

function createUser(request: CreateUserRequest): User {
  const { personal, address, options = {} } = request;

  const user: User = {
    id: generateId(),
    firstName: personal.firstName,
    lastName: personal.lastName,
    email: personal.email,
    password: hashPassword(personal.password),
    phone: personal.phone ?? null,
    address: {
      street: address.street ?? null,
      city: address.city ?? null,
      state: address.state ?? null,
      zipCode: address.zipCode ?? null,
      country: address.country,
    },
    isAdmin: options.isAdmin ?? false,
    isVerified: options.isVerified ?? false,
    createdAt: new Date(),
  };

  saveUser(user);
  handlePostCreation(user, options);

  return user;
}

function handlePostCreation(user: User, options: UserOptions): void {
  if (options.sendWelcomeEmail) {
    sendEmail(user.email, "Welcome!", "Thank you for joining");
  }

  if (options.subscribeToNewsletter) {
    addToNewsletter(user.email);
  }
}

// Clean, readable call site
const user = createUser({
  personal: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: "secret123",
  },
  address: {
    street: "123 Main St",
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
    country: "USA",
  },
  options: {
    sendWelcomeEmail: true,
  },
});
```

---

### Primitive Obsession

**Description**: Using primitive types instead of small objects for simple tasks (currency, ranges, phone numbers).

**Detection**:

- Using strings for emails, phone numbers, URLs
- Using numbers for money, percentages, temperatures
- Passing parallel arrays instead of objects
- Using constants for type codes

**Bad Example**:

```python
def process_payment(
    amount: float,
    currency_code: str,
    card_number: str,
    card_expiry_month: int,
    card_expiry_year: int,
    card_cvv: str,
    billing_street: str,
    billing_city: str,
    billing_zip: str,
    billing_country: str,
) -> dict:
    # Validate currency
    if currency_code not in ["USD", "EUR", "GBP"]:
        raise ValueError("Invalid currency")

    # Validate card number (Luhn check)
    digits = [int(d) for d in card_number.replace(" ", "")]
    checksum = 0
    for i, digit in enumerate(reversed(digits)):
        if i % 2 == 1:
            digit *= 2
            if digit > 9:
                digit -= 9
        checksum += digit
    if checksum % 10 != 0:
        raise ValueError("Invalid card number")

    # Check expiry
    now = datetime.now()
    if card_expiry_year < now.year:
        raise ValueError("Card expired")
    if card_expiry_year == now.year and card_expiry_month < now.month:
        raise ValueError("Card expired")

    # Process...
    return {"status": "success", "amount": amount}


# Prone to errors - easy to mix up parameters
result = process_payment(
    99.99,
    "USD",
    "4111111111111111",
    12,
    2025,
    "123",
    "123 Main St",
    "New York",
    "10001",
    "USA",
)
```

**Refactored**:

```python
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from enum import Enum
import re


class Currency(Enum):
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"


@dataclass(frozen=True)
class Money:
    amount: Decimal
    currency: Currency

    def __post_init__(self):
        if self.amount < 0:
            raise ValueError("Amount cannot be negative")

    def __str__(self) -> str:
        symbols = {Currency.USD: "$", Currency.EUR: "€", Currency.GBP: "£"}
        return f"{symbols[self.currency]}{self.amount:.2f}"


@dataclass(frozen=True)
class CardNumber:
    value: str

    def __post_init__(self):
        cleaned = self.value.replace(" ", "").replace("-", "")
        if not cleaned.isdigit() or len(cleaned) < 13:
            raise ValueError("Invalid card number format")
        if not self._passes_luhn(cleaned):
            raise ValueError("Invalid card number")

    @staticmethod
    def _passes_luhn(number: str) -> bool:
        digits = [int(d) for d in number]
        checksum = 0
        for i, digit in enumerate(reversed(digits)):
            if i % 2 == 1:
                digit *= 2
                if digit > 9:
                    digit -= 9
            checksum += digit
        return checksum % 10 == 0

    @property
    def masked(self) -> str:
        cleaned = self.value.replace(" ", "").replace("-", "")
        return f"****-****-****-{cleaned[-4:]}"


@dataclass(frozen=True)
class CardExpiry:
    month: int
    year: int

    def __post_init__(self):
        if not 1 <= self.month <= 12:
            raise ValueError("Invalid month")
        if self.year < 2000:
            raise ValueError("Invalid year")

    @property
    def is_expired(self) -> bool:
        today = date.today()
        expiry_date = date(self.year, self.month, 1)
        return expiry_date < today.replace(day=1)


@dataclass(frozen=True)
class CVV:
    value: str

    def __post_init__(self):
        if not self.value.isdigit() or len(self.value) not in (3, 4):
            raise ValueError("Invalid CVV")


@dataclass(frozen=True)
class Address:
    street: str
    city: str
    postal_code: str
    country: str

    def __post_init__(self):
        if not all([self.street, self.city, self.postal_code, self.country]):
            raise ValueError("All address fields are required")


@dataclass
class PaymentCard:
    number: CardNumber
    expiry: CardExpiry
    cvv: CVV

    def validate(self) -> None:
        if self.expiry.is_expired:
            raise ValueError("Card has expired")


@dataclass
class PaymentRequest:
    amount: Money
    card: PaymentCard
    billing_address: Address


def process_payment(request: PaymentRequest) -> dict:
    request.card.validate()

    # Process payment with validated, type-safe data
    return {
        "status": "success",
        "amount": str(request.amount),
        "card": request.card.number.masked,
    }


# Type-safe and self-documenting
result = process_payment(
    PaymentRequest(
        amount=Money(Decimal("99.99"), Currency.USD),
        card=PaymentCard(
            number=CardNumber("4111 1111 1111 1111"),
            expiry=CardExpiry(month=12, year=2025),
            cvv=CVV("123"),
        ),
        billing_address=Address(
            street="123 Main St",
            city="New York",
            postal_code="10001",
            country="USA",
        ),
    )
)
```

---

### Data Clumps

**Description**: Groups of data items that always appear together in multiple places.

**Detection**:

- Same 3+ fields passed to multiple functions
- Same field prefix in multiple classes (user_name, user_email, user_phone)
- Parameters that are always passed together

**Bad Example**:

```typescript
// Same data appears everywhere
function validateShipping(
  street: string,
  city: string,
  state: string,
  zipCode: string,
  country: string
): boolean {
  if (!street || !city || !country) return false;
  if (country === "USA" && !state) return false;
  return true;
}

function calculateShippingCost(
  street: string,
  city: string,
  state: string,
  zipCode: string,
  country: string,
  weight: number
): number {
  const zone = getShippingZone(country, state);
  return weight * zone.ratePerPound;
}

function formatAddress(
  street: string,
  city: string,
  state: string,
  zipCode: string,
  country: string
): string {
  const lines = [street, `${city}, ${state} ${zipCode}`, country];
  return lines.filter(Boolean).join("\n");
}

interface Order {
  id: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  shippingCountry: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingZipCode: string;
  billingCountry: string;
}

function processOrder(order: Order): void {
  const isValid = validateShipping(
    order.shippingStreet,
    order.shippingCity,
    order.shippingState,
    order.shippingZipCode,
    order.shippingCountry
  );

  const cost = calculateShippingCost(
    order.shippingStreet,
    order.shippingCity,
    order.shippingState,
    order.shippingZipCode,
    order.shippingCountry,
    10
  );
}
```

**Refactored**:

```typescript
// Extract Address as a proper class
class Address {
  constructor(
    public readonly street: string,
    public readonly city: string,
    public readonly state: string | null,
    public readonly zipCode: string | null,
    public readonly country: string
  ) {}

  static create(data: Partial<Address>): Address {
    return new Address(
      data.street ?? "",
      data.city ?? "",
      data.state ?? null,
      data.zipCode ?? null,
      data.country ?? ""
    );
  }

  isValid(): boolean {
    if (!this.street || !this.city || !this.country) {
      return false;
    }
    if (this.country === "USA" && !this.state) {
      return false;
    }
    return true;
  }

  format(): string {
    const statePart = this.state ? `${this.state} ` : "";
    const zipPart = this.zipCode ?? "";
    const lines = [this.street, `${this.city}, ${statePart}${zipPart}`, this.country];
    return lines.filter(Boolean).join("\n");
  }

  getShippingZone(): ShippingZone {
    return getShippingZone(this.country, this.state);
  }
}

function calculateShippingCost(address: Address, weight: number): number {
  const zone = address.getShippingZone();
  return weight * zone.ratePerPound;
}

interface Order {
  id: string;
  shippingAddress: Address;
  billingAddress: Address;
}

function processOrder(order: Order): void {
  if (!order.shippingAddress.isValid()) {
    throw new Error("Invalid shipping address");
  }

  const cost = calculateShippingCost(order.shippingAddress, 10);
  const formattedAddress = order.shippingAddress.format();
}

// Creating an order
const order: Order = {
  id: "123",
  shippingAddress: Address.create({
    street: "123 Main St",
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
    country: "USA",
  }),
  billingAddress: Address.create({
    street: "456 Oak Ave",
    city: "Chicago",
    state: "IL",
    zipCode: "60601",
    country: "USA",
  }),
};
```

---

## Object-Orientation Abusers

These smells indicate incomplete or incorrect application of object-oriented principles.

---

### Switch Statements

**Description**: Complex switch/case statements that often need modification when new types are added.

**Detection**:

- Switch on type codes or type strings
- Same switch in multiple places
- Adding a new type requires modifying multiple switches

**Bad Example**:

```python
class PaymentProcessor:
    def process_payment(self, payment: dict) -> dict:
        payment_type = payment["type"]

        if payment_type == "credit_card":
            # Credit card processing
            if not self._validate_card(payment["card_number"]):
                raise ValueError("Invalid card")
            response = self._charge_card(
                payment["card_number"],
                payment["amount"],
                payment["cvv"],
            )
            return {"status": "success", "transaction_id": response["id"]}

        elif payment_type == "paypal":
            # PayPal processing
            if not self._validate_paypal_email(payment["email"]):
                raise ValueError("Invalid PayPal email")
            response = self._paypal_charge(payment["email"], payment["amount"])
            return {"status": "success", "transaction_id": response["id"]}

        elif payment_type == "bank_transfer":
            # Bank transfer processing
            if not self._validate_iban(payment["iban"]):
                raise ValueError("Invalid IBAN")
            response = self._initiate_transfer(payment["iban"], payment["amount"])
            return {"status": "pending", "reference": response["ref"]}

        elif payment_type == "crypto":
            # Crypto processing
            if not self._validate_wallet(payment["wallet"]):
                raise ValueError("Invalid wallet")
            response = self._crypto_transfer(payment["wallet"], payment["amount"])
            return {"status": "pending", "tx_hash": response["hash"]}

        else:
            raise ValueError(f"Unknown payment type: {payment_type}")

    def get_payment_fee(self, payment: dict) -> float:
        payment_type = payment["type"]
        amount = payment["amount"]

        if payment_type == "credit_card":
            return amount * 0.029 + 0.30
        elif payment_type == "paypal":
            return amount * 0.034 + 0.30
        elif payment_type == "bank_transfer":
            return 5.00
        elif payment_type == "crypto":
            return amount * 0.01
        else:
            raise ValueError(f"Unknown payment type: {payment_type}")
```

**Refactored**:

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class PaymentResult:
    status: str
    transaction_id: str | None = None
    reference: str | None = None


class PaymentMethod(ABC):
    @abstractmethod
    def validate(self, payment_data: dict) -> None:
        pass

    @abstractmethod
    def process(self, amount: float) -> PaymentResult:
        pass

    @abstractmethod
    def calculate_fee(self, amount: float) -> float:
        pass


class CreditCardPayment(PaymentMethod):
    def __init__(self, card_number: str, cvv: str):
        self.card_number = card_number
        self.cvv = cvv

    def validate(self, payment_data: dict) -> None:
        if not self._is_valid_card(self.card_number):
            raise ValueError("Invalid card number")

    def process(self, amount: float) -> PaymentResult:
        response = charge_card(self.card_number, amount, self.cvv)
        return PaymentResult(status="success", transaction_id=response["id"])

    def calculate_fee(self, amount: float) -> float:
        return amount * 0.029 + 0.30

    def _is_valid_card(self, card_number: str) -> bool:
        # Luhn algorithm validation
        return True


class PayPalPayment(PaymentMethod):
    def __init__(self, email: str):
        self.email = email

    def validate(self, payment_data: dict) -> None:
        if not self._is_valid_email(self.email):
            raise ValueError("Invalid PayPal email")

    def process(self, amount: float) -> PaymentResult:
        response = paypal_charge(self.email, amount)
        return PaymentResult(status="success", transaction_id=response["id"])

    def calculate_fee(self, amount: float) -> float:
        return amount * 0.034 + 0.30

    def _is_valid_email(self, email: str) -> bool:
        return "@" in email


class BankTransferPayment(PaymentMethod):
    def __init__(self, iban: str):
        self.iban = iban

    def validate(self, payment_data: dict) -> None:
        if not self._is_valid_iban(self.iban):
            raise ValueError("Invalid IBAN")

    def process(self, amount: float) -> PaymentResult:
        response = initiate_transfer(self.iban, amount)
        return PaymentResult(status="pending", reference=response["ref"])

    def calculate_fee(self, amount: float) -> float:
        return 5.00

    def _is_valid_iban(self, iban: str) -> bool:
        return len(iban) >= 15


class CryptoPayment(PaymentMethod):
    def __init__(self, wallet: str):
        self.wallet = wallet

    def validate(self, payment_data: dict) -> None:
        if not self._is_valid_wallet(self.wallet):
            raise ValueError("Invalid wallet address")

    def process(self, amount: float) -> PaymentResult:
        response = crypto_transfer(self.wallet, amount)
        return PaymentResult(status="pending", transaction_id=response["hash"])

    def calculate_fee(self, amount: float) -> float:
        return amount * 0.01

    def _is_valid_wallet(self, wallet: str) -> bool:
        return len(wallet) >= 26


class PaymentMethodFactory:
    @staticmethod
    def create(payment_data: dict) -> PaymentMethod:
        payment_type = payment_data.get("type")

        factories = {
            "credit_card": lambda d: CreditCardPayment(d["card_number"], d["cvv"]),
            "paypal": lambda d: PayPalPayment(d["email"]),
            "bank_transfer": lambda d: BankTransferPayment(d["iban"]),
            "crypto": lambda d: CryptoPayment(d["wallet"]),
        }

        factory = factories.get(payment_type)
        if not factory:
            raise ValueError(f"Unknown payment type: {payment_type}")

        return factory(payment_data)


class PaymentProcessor:
    def process_payment(self, payment_data: dict) -> PaymentResult:
        method = PaymentMethodFactory.create(payment_data)
        method.validate(payment_data)
        return method.process(payment_data["amount"])

    def get_payment_fee(self, payment_data: dict) -> float:
        method = PaymentMethodFactory.create(payment_data)
        return method.calculate_fee(payment_data["amount"])
```

---

### Refused Bequest

**Description**: A subclass uses only some of the methods and properties inherited from its parents.

**Detection**:

- Subclass overrides methods to throw "not implemented" exceptions
- Subclass ignores inherited methods
- Inheritance is used for code reuse rather than representing "is-a" relationship

**Bad Example**:

```typescript
class Bird {
  name: string;
  wingspan: number;

  constructor(name: string, wingspan: number) {
    this.name = name;
    this.wingspan = wingspan;
  }

  fly(): void {
    console.log(`${this.name} is flying with ${this.wingspan}cm wingspan`);
  }

  eat(): void {
    console.log(`${this.name} is eating`);
  }

  layEgg(): void {
    console.log(`${this.name} laid an egg`);
  }
}

class Penguin extends Bird {
  constructor(name: string) {
    super(name, 0); // Penguins don't really have flying wingspan
  }

  // Refuses the bequest - penguins can't fly!
  fly(): void {
    throw new Error("Penguins cannot fly!");
  }

  swim(): void {
    console.log(`${this.name} is swimming`);
  }
}

class Ostrich extends Bird {
  constructor(name: string) {
    super(name, 0);
  }

  // Also refuses the bequest
  fly(): void {
    throw new Error("Ostriches cannot fly!");
  }

  run(): void {
    console.log(`${this.name} is running fast`);
  }
}

// This will throw at runtime - bad design!
function makeBirdsFly(birds: Bird[]): void {
  for (const bird of birds) {
    bird.fly(); // Throws for penguins and ostriches
  }
}
```

**Refactored**:

```typescript
// Use composition and interfaces instead of inheritance
interface Animal {
  name: string;
  eat(): void;
}

interface Flyer {
  fly(): void;
}

interface Swimmer {
  swim(): void;
}

interface Runner {
  run(): void;
}

interface EggLayer {
  layEgg(): void;
}

class FlyingBird implements Animal, Flyer, EggLayer {
  constructor(
    public readonly name: string,
    public readonly wingspan: number
  ) {}

  fly(): void {
    console.log(`${this.name} is flying with ${this.wingspan}cm wingspan`);
  }

  eat(): void {
    console.log(`${this.name} is eating`);
  }

  layEgg(): void {
    console.log(`${this.name} laid an egg`);
  }
}

class Penguin implements Animal, Swimmer, EggLayer {
  constructor(public readonly name: string) {}

  swim(): void {
    console.log(`${this.name} is swimming`);
  }

  eat(): void {
    console.log(`${this.name} is eating fish`);
  }

  layEgg(): void {
    console.log(`${this.name} laid an egg`);
  }
}

class Ostrich implements Animal, Runner, EggLayer {
  constructor(public readonly name: string) {}

  run(): void {
    console.log(`${this.name} is running at 70 km/h`);
  }

  eat(): void {
    console.log(`${this.name} is eating plants`);
  }

  layEgg(): void {
    console.log(`${this.name} laid a large egg`);
  }
}

// Type-safe function that only accepts flyers
function makeFlyersfly(flyers: Flyer[]): void {
  for (const flyer of flyers) {
    flyer.fly();
  }
}

// Usage
const eagle = new FlyingBird("Eagle", 200);
const sparrow = new FlyingBird("Sparrow", 20);
const penguin = new Penguin("Emperor");
const ostrich = new Ostrich("Oscar");

makeFlyersfly([eagle, sparrow]); // Works
// makeFlyersfly([penguin]); // Compile error - Penguin is not a Flyer
```

---

### Parallel Inheritance Hierarchies

**Description**: Every time you create a subclass for one class, you must create a subclass for another.

**Detection**:

- Class prefixes/suffixes match across hierarchies (OrderProcessor, OrderValidator, OrderLogger)
- Creating new subclass requires creating matching subclasses in other hierarchies

**Bad Example**:

```python
# Every new shape requires a new renderer and serializer
class Shape:
    pass


class Circle(Shape):
    def __init__(self, radius: float):
        self.radius = radius


class Rectangle(Shape):
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height


class Triangle(Shape):
    def __init__(self, base: float, height: float):
        self.base = base
        self.height = height


# Parallel hierarchy 1: Renderers
class ShapeRenderer:
    def render(self, shape: Shape) -> str:
        raise NotImplementedError


class CircleRenderer(ShapeRenderer):
    def render(self, shape: Circle) -> str:
        return f"<circle r='{shape.radius}'/>"


class RectangleRenderer(ShapeRenderer):
    def render(self, shape: Rectangle) -> str:
        return f"<rect width='{shape.width}' height='{shape.height}'/>"


class TriangleRenderer(ShapeRenderer):
    def render(self, shape: Triangle) -> str:
        return f"<polygon points='0,{shape.height} {shape.base},0...'/>"


# Parallel hierarchy 2: Serializers
class ShapeSerializer:
    def serialize(self, shape: Shape) -> dict:
        raise NotImplementedError


class CircleSerializer(ShapeSerializer):
    def serialize(self, shape: Circle) -> dict:
        return {"type": "circle", "radius": shape.radius}


class RectangleSerializer(ShapeSerializer):
    def serialize(self, shape: Rectangle) -> dict:
        return {"type": "rectangle", "width": shape.width, "height": shape.height}


class TriangleSerializer(ShapeSerializer):
    def serialize(self, shape: Triangle) -> dict:
        return {"type": "triangle", "base": shape.base, "height": shape.height}


# Adding a new shape (Pentagon) requires:
# 1. Pentagon class
# 2. PentagonRenderer class
# 3. PentagonSerializer class
```

**Refactored**:

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Protocol


# Single hierarchy with all behaviors in one place
class Shape(ABC):
    @abstractmethod
    def render_svg(self) -> str:
        pass

    @abstractmethod
    def to_dict(self) -> dict:
        pass

    @abstractmethod
    def area(self) -> float:
        pass


@dataclass
class Circle(Shape):
    radius: float

    def render_svg(self) -> str:
        return f"<circle r='{self.radius}'/>"

    def to_dict(self) -> dict:
        return {"type": "circle", "radius": self.radius}

    def area(self) -> float:
        return 3.14159 * self.radius ** 2


@dataclass
class Rectangle(Shape):
    width: float
    height: float

    def render_svg(self) -> str:
        return f"<rect width='{self.width}' height='{self.height}'/>"

    def to_dict(self) -> dict:
        return {"type": "rectangle", "width": self.width, "height": self.height}

    def area(self) -> float:
        return self.width * self.height


@dataclass
class Triangle(Shape):
    base: float
    height: float

    def render_svg(self) -> str:
        return f"<polygon points='0,{self.height} {self.base / 2},0 {self.base},{self.height}'/>"

    def to_dict(self) -> dict:
        return {"type": "triangle", "base": self.base, "height": self.height}

    def area(self) -> float:
        return 0.5 * self.base * self.height


# Adding a new shape only requires one class
@dataclass
class Pentagon(Shape):
    side: float

    def render_svg(self) -> str:
        # Calculate pentagon points
        return f"<polygon points='...'/>"

    def to_dict(self) -> dict:
        return {"type": "pentagon", "side": self.side}

    def area(self) -> float:
        return 1.72 * self.side ** 2


# Alternative: Use visitor pattern for extensible operations
class ShapeVisitor(Protocol):
    def visit_circle(self, circle: "CircleV") -> str: ...
    def visit_rectangle(self, rectangle: "RectangleV") -> str: ...


class ShapeV(ABC):
    @abstractmethod
    def accept(self, visitor: ShapeVisitor) -> str:
        pass


@dataclass
class CircleV(ShapeV):
    radius: float

    def accept(self, visitor: ShapeVisitor) -> str:
        return visitor.visit_circle(self)


@dataclass
class RectangleV(ShapeV):
    width: float
    height: float

    def accept(self, visitor: ShapeVisitor) -> str:
        return visitor.visit_rectangle(self)


class SVGRenderer(ShapeVisitor):
    def visit_circle(self, circle: CircleV) -> str:
        return f"<circle r='{circle.radius}'/>"

    def visit_rectangle(self, rectangle: RectangleV) -> str:
        return f"<rect width='{rectangle.width}' height='{rectangle.height}'/>"


class JSONSerializer(ShapeVisitor):
    def visit_circle(self, circle: CircleV) -> str:
        return '{"type": "circle", "radius": ' + str(circle.radius) + "}"

    def visit_rectangle(self, rectangle: RectangleV) -> str:
        return f'{{"type": "rectangle", "width": {rectangle.width}}}'
```

---

## Change Preventers

These smells make changing code more difficult than necessary.

---

### Divergent Change

**Description**: A class is changed in different ways for different reasons—it has multiple responsibilities.

**Detection**:

- Different types of changes require modifying the same class
- Class methods group into clusters that change together
- Feature changes and bug fixes touch the same file

**Bad Example**:

```python
class Report:
    def __init__(self, data: list[dict]):
        self.data = data

    # Database operations
    def save_to_database(self, connection):
        for row in self.data:
            connection.execute(
                "INSERT INTO reports (date, value) VALUES (?, ?)",
                (row["date"], row["value"]),
            )

    def load_from_database(self, connection, report_id: int):
        cursor = connection.execute(
            "SELECT date, value FROM reports WHERE id = ?",
            (report_id,),
        )
        self.data = [{"date": row[0], "value": row[1]} for row in cursor]

    # Formatting operations
    def to_html(self) -> str:
        html = "<table><tr><th>Date</th><th>Value</th></tr>"
        for row in self.data:
            html += f"<tr><td>{row['date']}</td><td>{row['value']}</td></tr>"
        html += "</table>"
        return html

    def to_csv(self) -> str:
        lines = ["date,value"]
        for row in self.data:
            lines.append(f"{row['date']},{row['value']}")
        return "\n".join(lines)

    def to_json(self) -> str:
        return json.dumps(self.data)

    # Analysis operations
    def calculate_total(self) -> float:
        return sum(row["value"] for row in self.data)

    def calculate_average(self) -> float:
        if not self.data:
            return 0
        return self.calculate_total() / len(self.data)

    def find_max(self) -> dict | None:
        if not self.data:
            return None
        return max(self.data, key=lambda x: x["value"])

    # Email operations
    def email_report(self, to: str, smtp_server: str):
        import smtplib
        from email.mime.text import MIMEText

        msg = MIMEText(self.to_html(), "html")
        msg["Subject"] = "Report"
        msg["To"] = to

        with smtplib.SMTP(smtp_server) as server:
            server.send_message(msg)

# Changes to database schema affect save/load
# Changes to output format affect to_html/to_csv/to_json
# Changes to calculations affect calculate_*/find_*
# Changes to email affect email_report
# All changes touch this one file!
```

**Refactored**:

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ReportData:
    rows: list[dict]


# Separate class for persistence
class ReportRepository:
    def __init__(self, connection):
        self.connection = connection

    def save(self, data: ReportData) -> None:
        for row in data.rows:
            self.connection.execute(
                "INSERT INTO reports (date, value) VALUES (?, ?)",
                (row["date"], row["value"]),
            )

    def load(self, report_id: int) -> ReportData:
        cursor = self.connection.execute(
            "SELECT date, value FROM reports WHERE id = ?",
            (report_id,),
        )
        rows = [{"date": row[0], "value": row[1]} for row in cursor]
        return ReportData(rows=rows)


# Separate class for formatting
class ReportFormatter(ABC):
    @abstractmethod
    def format(self, data: ReportData) -> str:
        pass


class HTMLFormatter(ReportFormatter):
    def format(self, data: ReportData) -> str:
        html = "<table><tr><th>Date</th><th>Value</th></tr>"
        for row in data.rows:
            html += f"<tr><td>{row['date']}</td><td>{row['value']}</td></tr>"
        html += "</table>"
        return html


class CSVFormatter(ReportFormatter):
    def format(self, data: ReportData) -> str:
        lines = ["date,value"]
        for row in data.rows:
            lines.append(f"{row['date']},{row['value']}")
        return "\n".join(lines)


class JSONFormatter(ReportFormatter):
    def format(self, data: ReportData) -> str:
        return json.dumps(data.rows)


# Separate class for analysis
class ReportAnalyzer:
    def __init__(self, data: ReportData):
        self.data = data

    def total(self) -> float:
        return sum(row["value"] for row in self.data.rows)

    def average(self) -> float:
        if not self.data.rows:
            return 0
        return self.total() / len(self.data.rows)

    def max_value(self) -> dict | None:
        if not self.data.rows:
            return None
        return max(self.data.rows, key=lambda x: x["value"])


# Separate class for distribution
class ReportDistributor:
    def __init__(self, smtp_server: str):
        self.smtp_server = smtp_server

    def send_email(self, to: str, content: str, content_type: str = "html") -> None:
        import smtplib
        from email.mime.text import MIMEText

        msg = MIMEText(content, content_type)
        msg["Subject"] = "Report"
        msg["To"] = to

        with smtplib.SMTP(self.smtp_server) as server:
            server.send_message(msg)


# Usage: Each class changes independently
data = ReportData(rows=[{"date": "2024-01-01", "value": 100}])

repository = ReportRepository(connection)
repository.save(data)

formatter = HTMLFormatter()
html_output = formatter.format(data)

analyzer = ReportAnalyzer(data)
total = analyzer.total()

distributor = ReportDistributor("smtp.example.com")
distributor.send_email("user@example.com", html_output)
```

---

### Shotgun Surgery

**Description**: Making one change requires making many small changes in many different classes.

**Detection**:

- Simple feature addition requires modifying 5+ files
- Same change repeated in multiple places
- "Don't forget to update X when you change Y" warnings

**Bad Example**:

```typescript
// Adding a new user field (e.g., "phoneNumber") requires changes everywhere

// 1. Change the database schema
// migrations/001_add_phone.sql

// 2. Change the model
class User {
  id: string;
  name: string;
  email: string;
  // Add phoneNumber here
}

// 3. Change the repository
class UserRepository {
  create(data: CreateUserData): User {
    // Add phoneNumber to INSERT
  }

  update(id: string, data: UpdateUserData): User {
    // Add phoneNumber to UPDATE
  }
}

// 4. Change the API controller
class UserController {
  createUser(req: Request): Response {
    // Extract phoneNumber from request
  }

  updateUser(req: Request): Response {
    // Extract phoneNumber from request
  }
}

// 5. Change the validation
class UserValidator {
  validateCreate(data: unknown): CreateUserData {
    // Validate phoneNumber
  }
}

// 6. Change the DTO
interface CreateUserDTO {
  name: string;
  email: string;
  // Add phoneNumber
}

// 7. Change the mapper
class UserMapper {
  toEntity(dto: CreateUserDTO): User {
    // Map phoneNumber
  }

  toDTO(entity: User): UserDTO {
    // Map phoneNumber
  }
}

// 8. Change the frontend form
// 9. Change the API client
// 10. Change the tests
```

**Refactored**:

```typescript
// Centralize field definitions to minimize shotgun surgery

// Single source of truth for user fields
const USER_FIELDS = {
  id: { type: "string", required: true, generated: true },
  name: { type: "string", required: true, maxLength: 100 },
  email: { type: "string", required: true, format: "email" },
  phoneNumber: { type: "string", required: false, format: "phone" },
} as const;

type UserFieldName = keyof typeof USER_FIELDS;
type User = { [K in UserFieldName]: string | null };

// Generic validation based on field definitions
class FieldValidator {
  static validate(fieldName: UserFieldName, value: unknown): ValidationResult {
    const field = USER_FIELDS[fieldName];

    if (field.required && !value) {
      return { valid: false, error: `${fieldName} is required` };
    }

    if (typeof value !== field.type) {
      return { valid: false, error: `${fieldName} must be ${field.type}` };
    }

    return { valid: true };
  }

  static validateAll(data: Partial<User>): ValidationResult[] {
    return Object.entries(data).map(([key, value]) =>
      this.validate(key as UserFieldName, value)
    );
  }
}

// Generic repository using field definitions
class GenericRepository<T extends Record<string, unknown>> {
  constructor(
    private tableName: string,
    private fields: Record<string, FieldDefinition>
  ) {}

  private getInsertableFields(): string[] {
    return Object.entries(this.fields)
      .filter(([_, def]) => !def.generated)
      .map(([name]) => name);
  }

  create(data: Partial<T>): T {
    const fields = this.getInsertableFields();
    const columns = fields.join(", ");
    const values = fields.map((f) => data[f]);
    // Dynamic INSERT based on field definitions
    return this.db.insert(this.tableName, columns, values);
  }
}

// Usage
const userRepository = new GenericRepository<User>("users", USER_FIELDS);

// Adding a new field only requires:
// 1. Add to USER_FIELDS
// 2. Run migration generator
// Everything else adapts automatically!

// Migration generator
function generateMigration(fields: typeof USER_FIELDS): string {
  return Object.entries(fields)
    .map(([name, def]) => {
      const sqlType = def.type === "string" ? "VARCHAR(255)" : "INTEGER";
      const nullable = def.required ? "NOT NULL" : "NULL";
      return `${name} ${sqlType} ${nullable}`;
    })
    .join(",\n");
}
```

---

## Dispensables

These are things that are pointless and should be removed.

---

### Dead Code

**Description**: Code that is never executed, including unused variables, parameters, methods, and classes.

**Detection**:

- Methods never called from anywhere
- Conditional branches that can never be reached
- Variables assigned but never read
- Commented-out code left in codebase

**Bad Example**:

```python
class OrderService:
    def __init__(self):
        self.legacy_flag = True  # Never used
        self.debug_mode = False  # Never used

    def process_order(self, order: dict) -> dict:
        # Old implementation - keeping for reference
        # if order.get("type") == "legacy":
        #     return self._process_legacy_order(order)

        status = "pending"  # Assigned but overwritten
        status = self._validate_order(order)

        result = self._create_order_record(order)

        # This code is unreachable
        if False:
            self._send_notification(result)

        return result

    def _process_legacy_order(self, order: dict) -> dict:
        # Never called after refactoring
        return {"status": "legacy_processed"}

    def _validate_order(self, order: dict) -> str:
        return "valid"

    def _create_order_record(self, order: dict) -> dict:
        return {"id": "123", "status": "created"}

    def _send_notification(self, result: dict) -> None:
        # Never called
        print(f"Order {result['id']} created")

    def _old_validation_method(self, order: dict) -> bool:
        # Deprecated, use _validate_order instead
        return True

    def get_order_summary(
        self,
        order_id: str,
        include_items: bool,  # Parameter never used
        include_history: bool,  # Parameter never used
    ) -> dict:
        return self._fetch_order(order_id)

    def _fetch_order(self, order_id: str) -> dict:
        return {"id": order_id}
```

**Refactored**:

```python
class OrderService:
    def process_order(self, order: dict) -> dict:
        self._validate_order(order)
        return self._create_order_record(order)

    def _validate_order(self, order: dict) -> None:
        # Raises exception if invalid
        if not order.get("items"):
            raise ValueError("Order must have items")

    def _create_order_record(self, order: dict) -> dict:
        return {"id": generate_id(), "status": "created"}

    def get_order_summary(self, order_id: str) -> dict:
        return self._fetch_order(order_id)

    def _fetch_order(self, order_id: str) -> dict:
        return {"id": order_id}
```

---

### Duplicate Code

**Description**: Identical or very similar code exists in more than one location.

**Detection**:

- Copy-pasted code blocks
- Similar methods with slight variations
- Same logic expressed differently

**Bad Example**:

```typescript
class UserController {
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      // Validation
      if (!req.body.email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }
      if (!req.body.name) {
        res.status(400).json({ error: "Name is required" });
        return;
      }
      if (!req.body.password || req.body.password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters" });
        return;
      }

      const user = await this.userService.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      // Same validation repeated
      if (!req.body.email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }
      if (!req.body.name) {
        res.status(400).json({ error: "Name is required" });
        return;
      }

      const user = await this.userService.update(req.params.id, req.body);
      res.status(200).json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

class ProductController {
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      // Similar validation pattern
      if (!req.body.name) {
        res.status(400).json({ error: "Name is required" });
        return;
      }
      if (!req.body.price || req.body.price <= 0) {
        res.status(400).json({ error: "Price must be positive" });
        return;
      }

      const product = await this.productService.create(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
```

**Refactored**:

```typescript
// Extract validation into reusable schema
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().positive("Price must be positive"),
});

// Generic validation middleware
function validate<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: result.error.errors[0].message,
      });
      return;
    }
    req.validatedBody = result.data;
    next();
  };
}

// Generic error handler
function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res).catch((error) => {
      console.error(`Error in ${fn.name}:`, error);
      res.status(500).json({ error: "Internal server error" });
    });
  };
}

// Clean controllers with no duplication
class UserController {
  createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.create(req.validatedBody);
    res.status(201).json(user);
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.update(req.params.id, req.validatedBody);
    res.status(200).json(user);
  });
}

class ProductController {
  createProduct = asyncHandler(async (req: Request, res: Response) => {
    const product = await this.productService.create(req.validatedBody);
    res.status(201).json(product);
  });
}

// Routes with validation middleware
router.post("/users", validate(userSchema), userController.createUser);
router.put("/users/:id", validate(userSchema.partial()), userController.updateUser);
router.post("/products", validate(productSchema), productController.createProduct);
```

---

### Lazy Class

**Description**: A class that doesn't do enough to justify its existence.

**Detection**:

- Class has only 1-2 methods
- Class delegates all work to another class
- Class could be replaced with a function
- Class was created "for future use"

**Bad Example**:

```python
class StringUtils:
    @staticmethod
    def is_empty(s: str | None) -> bool:
        return s is None or len(s) == 0


class DateFormatter:
    def format(self, date: datetime) -> str:
        return date.strftime("%Y-%m-%d")


class NumberRounder:
    def round_to_two_decimals(self, value: float) -> float:
        return round(value, 2)


class EmailSender:
    def __init__(self, smtp_client):
        self.smtp = smtp_client

    def send(self, to: str, subject: str, body: str) -> None:
        self.smtp.send(to, subject, body)


# Usage becomes verbose
utils = StringUtils()
if not utils.is_empty(email):
    formatter = DateFormatter()
    date_str = formatter.format(datetime.now())

    rounder = NumberRounder()
    amount = rounder.round_to_two_decimals(price)

    sender = EmailSender(smtp_client)
    sender.send(email, "Order", f"Date: {date_str}, Amount: {amount}")
```

**Refactored**:

```python
# Replace trivial classes with functions
def is_empty(s: str | None) -> bool:
    return not s


def format_date(date: datetime, fmt: str = "%Y-%m-%d") -> str:
    return date.strftime(fmt)


# Just use built-in round() - no wrapper needed
# round(value, 2)


# Inline simple delegation - EmailSender was just a wrapper
def send_email(smtp_client, to: str, subject: str, body: str) -> None:
    smtp_client.send(to, subject, body)


# Or keep as method on a more substantial class
class NotificationService:
    def __init__(self, smtp_client, sms_client):
        self.smtp = smtp_client
        self.sms = sms_client

    def send_email(self, to: str, subject: str, body: str) -> None:
        self.smtp.send(to, subject, body)

    def send_sms(self, phone: str, message: str) -> None:
        self.sms.send(phone, message)

    def notify_order_placed(self, order: Order) -> None:
        self.send_email(
            order.customer.email,
            "Order Confirmed",
            f"Order {order.id} placed on {format_date(order.created_at)}",
        )
        if order.customer.phone:
            self.send_sms(
                order.customer.phone,
                f"Order {order.id} confirmed. Total: ${round(order.total, 2)}",
            )


# Clean usage
if not is_empty(email):
    date_str = format_date(datetime.now())
    amount = round(price, 2)
    notification_service.notify_order_placed(order)
```

---

### Speculative Generality

**Description**: Code created for future needs that never materialized.

**Detection**:

- Abstract classes with only one subclass
- Parameters or methods only used in tests
- "Future-proofing" comments
- Unused type parameters

**Bad Example**:

```typescript
// Abstract factory for "flexibility" - but only one implementation exists
interface DataSourceFactory<T, C> {
  createConnection(config: C): Promise<Connection>;
  createReader(connection: Connection): DataReader<T>;
  createWriter(connection: Connection): DataWriter<T>;
  createTransactionManager(connection: Connection): TransactionManager;
}

abstract class AbstractDataSource<T> implements DataSourceFactory<T, DatabaseConfig> {
  abstract createConnection(config: DatabaseConfig): Promise<Connection>;
  abstract createReader(connection: Connection): DataReader<T>;
  abstract createWriter(connection: Connection): DataWriter<T>;
  abstract createTransactionManager(connection: Connection): TransactionManager;

  // "For future caching support"
  protected cache?: Cache<T>;

  // "In case we need to support multiple databases"
  protected databaseType: "postgres" | "mysql" | "mongodb" = "postgres";
}

// The only implementation that exists
class PostgresDataSource<T> extends AbstractDataSource<T> {
  createConnection(config: DatabaseConfig): Promise<Connection> {
    return pg.connect(config);
  }

  createReader(connection: Connection): DataReader<T> {
    return new PostgresReader(connection);
  }

  createWriter(connection: Connection): DataWriter<T> {
    return new PostgresWriter(connection);
  }

  createTransactionManager(connection: Connection): TransactionManager {
    return new PostgresTransactionManager(connection);
  }
}

// The MongoDB, MySQL implementations were "planned" but never created
// The generic type T is only ever User
// The cache is never used
```

**Refactored**:

```typescript
// Simple, concrete implementation for actual needs
class DatabaseConnection {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool(config);
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    await this.pool.query(sql, params);
  }

  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

// Simple repository with no unnecessary abstraction
class UserRepository {
  constructor(private db: DatabaseConnection) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.query<User>(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );
    return rows[0] ?? null;
  }

  async save(user: User): Promise<void> {
    await this.db.execute(
      "INSERT INTO users (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $2, email = $3",
      [user.id, user.name, user.email]
    );
  }
}

// If/when we need MongoDB support, we add it then - YAGNI!
```

---

## Couplers

These smells contribute to excessive coupling between classes.

---

### Feature Envy

**Description**: A method that uses more features of another class than its own.

**Detection**:

- Method makes many calls to another object's getters
- Method accesses another object's internal data
- Method would make more sense in the other class

**Bad Example**:

```python
class Order:
    def __init__(self):
        self.items: list[OrderItem] = []
        self.customer: Customer = None
        self.shipping_address: Address = None


class OrderItem:
    def __init__(self, product: Product, quantity: int, discount: float):
        self.product = product
        self.quantity = quantity
        self.discount = discount


class OrderPrinter:
    def print_invoice(self, order: Order) -> str:
        # This method is envious of Order's data
        lines = []
        lines.append(f"Customer: {order.customer.name}")
        lines.append(f"Address: {order.shipping_address.street}")
        lines.append(f"City: {order.shipping_address.city}, {order.shipping_address.state}")
        lines.append("")

        total = 0
        for item in order.items:
            # Envious of OrderItem's data
            item_price = item.product.price * item.quantity
            item_discount = item_price * (item.discount / 100)
            item_total = item_price - item_discount
            total += item_total

            lines.append(
                f"{item.product.name} x {item.quantity} "
                f"@ ${item.product.price:.2f} "
                f"(-{item.discount}%) = ${item_total:.2f}"
            )

        lines.append("")
        lines.append(f"Subtotal: ${total:.2f}")

        # Also envious of Customer's data
        if order.customer.loyalty_tier == "gold":
            discount = total * 0.1
            total -= discount
            lines.append(f"Gold member discount: -${discount:.2f}")
        elif order.customer.loyalty_tier == "platinum":
            discount = total * 0.15
            total -= discount
            lines.append(f"Platinum member discount: -${discount:.2f}")

        lines.append(f"Total: ${total:.2f}")
        return "\n".join(lines)
```

**Refactored**:

```python
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class Product:
    name: str
    price: Decimal


@dataclass
class OrderItem:
    product: Product
    quantity: int
    discount_percent: Decimal = Decimal("0")

    @property
    def subtotal(self) -> Decimal:
        return self.product.price * self.quantity

    @property
    def discount_amount(self) -> Decimal:
        return self.subtotal * (self.discount_percent / 100)

    @property
    def total(self) -> Decimal:
        return self.subtotal - self.discount_amount

    def format_line(self) -> str:
        return (
            f"{self.product.name} x {self.quantity} "
            f"@ ${self.product.price:.2f} "
            f"(-{self.discount_percent}%) = ${self.total:.2f}"
        )


@dataclass
class Customer:
    name: str
    loyalty_tier: str

    def get_loyalty_discount_rate(self) -> Decimal:
        rates = {"gold": Decimal("0.10"), "platinum": Decimal("0.15")}
        return rates.get(self.loyalty_tier, Decimal("0"))

    def get_loyalty_label(self) -> str:
        labels = {"gold": "Gold member discount", "platinum": "Platinum member discount"}
        return labels.get(self.loyalty_tier, "")


@dataclass
class Address:
    street: str
    city: str
    state: str

    def format(self) -> str:
        return f"{self.street}\n{self.city}, {self.state}"


class Order:
    def __init__(
        self,
        customer: Customer,
        shipping_address: Address,
        items: list[OrderItem] = None,
    ):
        self.customer = customer
        self.shipping_address = shipping_address
        self.items = items or []

    @property
    def items_total(self) -> Decimal:
        return sum(item.total for item in self.items)

    @property
    def loyalty_discount(self) -> Decimal:
        return self.items_total * self.customer.get_loyalty_discount_rate()

    @property
    def final_total(self) -> Decimal:
        return self.items_total - self.loyalty_discount

    def format_invoice(self) -> str:
        lines = [
            f"Customer: {self.customer.name}",
            self.shipping_address.format(),
            "",
        ]

        for item in self.items:
            lines.append(item.format_line())

        lines.extend(["", f"Subtotal: ${self.items_total:.2f}"])

        if loyalty_label := self.customer.get_loyalty_label():
            lines.append(f"{loyalty_label}: -${self.loyalty_discount:.2f}")

        lines.append(f"Total: ${self.final_total:.2f}")
        return "\n".join(lines)


# Usage - invoice printing is now the Order's responsibility
order = Order(
    customer=Customer("John Doe", "gold"),
    shipping_address=Address("123 Main St", "Springfield", "IL"),
    items=[
        OrderItem(Product("Widget", Decimal("29.99")), quantity=2, discount_percent=Decimal("10")),
        OrderItem(Product("Gadget", Decimal("49.99")), quantity=1),
    ],
)

invoice = order.format_invoice()
```

---

### Inappropriate Intimacy

**Description**: Classes that know too much about each other's internal details.

**Detection**:

- Classes access each other's private fields
- Changes to one class frequently require changes to another
- Bidirectional associations between classes

**Bad Example**:

```typescript
class ShoppingCart {
  items: CartItem[] = [];
  _customer: Customer | null = null;
  _lastPriceCalculation: number = 0;

  addItem(product: Product, quantity: number): void {
    const item = new CartItem(product, quantity, this);
    this.items.push(item);
  }

  getCustomerDiscount(): number {
    // Accessing Customer's internal state
    if (this._customer) {
      return this._customer._discountRate;
    }
    return 0;
  }

  calculateTotal(): number {
    let total = 0;
    for (const item of this.items) {
      // Accessing CartItem's internals
      total += item._product._basePrice * item._quantity;
    }

    // Apply customer discount
    if (this._customer && this._customer._loyaltyPoints > 1000) {
      total *= 0.9;
    }

    this._lastPriceCalculation = total;
    return total;
  }
}

class CartItem {
  _product: Product;
  _quantity: number;
  _cart: ShoppingCart; // Bidirectional reference

  constructor(product: Product, quantity: number, cart: ShoppingCart) {
    this._product = product;
    this._quantity = quantity;
    this._cart = cart;
  }

  getDiscountedPrice(): number {
    // Accessing Cart's internal calculation
    const discount = this._cart.getCustomerDiscount();
    return this._product._basePrice * (1 - discount);
  }

  updateQuantity(newQuantity: number): void {
    this._quantity = newQuantity;
    // Directly manipulating cart's state
    this._cart._lastPriceCalculation = 0;
  }
}

class Customer {
  _discountRate: number = 0;
  _loyaltyPoints: number = 0;
  _cart: ShoppingCart | null = null;

  setCart(cart: ShoppingCart): void {
    this._cart = cart;
    cart._customer = this;
  }
}
```

**Refactored**:

```typescript
// Clean interfaces - classes only know what they need
interface Discountable {
  getDiscountRate(): number;
}

interface Purchasable {
  getPrice(): number;
  getName(): string;
}

class Product implements Purchasable {
  constructor(
    private readonly name: string,
    private readonly basePrice: number
  ) {}

  getPrice(): number {
    return this.basePrice;
  }

  getName(): string {
    return this.name;
  }
}

class CartItem {
  constructor(
    private readonly product: Purchasable,
    private quantity: number
  ) {}

  getSubtotal(): number {
    return this.product.getPrice() * this.quantity;
  }

  getQuantity(): number {
    return this.quantity;
  }

  setQuantity(quantity: number): void {
    if (quantity < 0) {
      throw new Error("Quantity cannot be negative");
    }
    this.quantity = quantity;
  }

  getProduct(): Purchasable {
    return this.product;
  }
}

class Customer implements Discountable {
  constructor(
    private discountRate: number = 0,
    private loyaltyPoints: number = 0
  ) {}

  getDiscountRate(): number {
    // Loyalty bonus kicks in at 1000 points
    if (this.loyaltyPoints > 1000) {
      return Math.max(this.discountRate, 0.1);
    }
    return this.discountRate;
  }

  addLoyaltyPoints(points: number): void {
    this.loyaltyPoints += points;
  }
}

class ShoppingCart {
  private items: CartItem[] = [];

  addItem(product: Purchasable, quantity: number): void {
    const existingItem = this.items.find(
      (item) => item.getProduct() === product
    );

    if (existingItem) {
      existingItem.setQuantity(existingItem.getQuantity() + quantity);
    } else {
      this.items.push(new CartItem(product, quantity));
    }
  }

  removeItem(product: Purchasable): void {
    this.items = this.items.filter((item) => item.getProduct() !== product);
  }

  getSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.getSubtotal(), 0);
  }

  calculateTotal(customer?: Discountable): number {
    const subtotal = this.getSubtotal();
    const discountRate = customer?.getDiscountRate() ?? 0;
    return subtotal * (1 - discountRate);
  }

  getItems(): readonly CartItem[] {
    return [...this.items];
  }
}

// Usage - no inappropriate intimacy
const product = new Product("Widget", 29.99);
const customer = new Customer(0.05, 1500);
const cart = new ShoppingCart();

cart.addItem(product, 2);
const total = cart.calculateTotal(customer);
```

---

### Message Chains

**Description**: A chain of method calls that exposes the structure of the object graph.

**Detection**:

- Multiple dots in a single statement: `a.b.c.d.method()`
- Changing an intermediate class breaks many callers
- Tests need complex mocking chains

**Bad Example**:

```python
class Company:
    def __init__(self, departments: list["Department"]):
        self.departments = departments


class Department:
    def __init__(self, manager: "Employee"):
        self.manager = manager


class Employee:
    def __init__(self, address: "Address"):
        self.address = address


class Address:
    def __init__(self, city: "City"):
        self.city = city


class City:
    def __init__(self, country: "Country"):
        self.country = country


class Country:
    def __init__(self, name: str, tax_rate: float):
        self.name = name
        self.tax_rate = tax_rate


# Client code with message chains
def calculate_manager_tax(company: Company, dept_index: int) -> float:
    # Long chain - breaks if any intermediate structure changes
    tax_rate = (
        company
        .departments[dept_index]
        .manager
        .address
        .city
        .country
        .tax_rate
    )
    return tax_rate


def get_manager_country(company: Company, dept_name: str) -> str:
    for dept in company.departments:
        if dept.name == dept_name:
            return dept.manager.address.city.country.name
    return "Unknown"


def send_mail_to_manager(company: Company, dept_index: int, message: str) -> None:
    manager_address = company.departments[dept_index].manager.address
    city_name = manager_address.city.name
    country_name = manager_address.city.country.name
    # Use the address...
```

**Refactored**:

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class TaxInfo:
    country_name: str
    tax_rate: float


@dataclass(frozen=True)
class Location:
    city: str
    country: str
    tax_rate: float

    def get_tax_info(self) -> TaxInfo:
        return TaxInfo(country_name=self.country, tax_rate=self.tax_rate)


@dataclass
class Employee:
    name: str
    location: Location

    def get_tax_rate(self) -> float:
        return self.location.tax_rate

    def get_country(self) -> str:
        return self.location.country

    def get_tax_info(self) -> TaxInfo:
        return self.location.get_tax_info()


@dataclass
class Department:
    name: str
    manager: Employee

    def get_manager_tax_rate(self) -> float:
        return self.manager.get_tax_rate()

    def get_manager_country(self) -> str:
        return self.manager.get_country()

    def get_manager_tax_info(self) -> TaxInfo:
        return self.manager.get_tax_info()


class Company:
    def __init__(self, departments: list[Department]):
        self._departments = {dept.name: dept for dept in departments}

    def get_department(self, name: str) -> Department | None:
        return self._departments.get(name)

    def get_manager_tax_rate(self, dept_name: str) -> float | None:
        dept = self.get_department(dept_name)
        return dept.get_manager_tax_rate() if dept else None

    def get_manager_country(self, dept_name: str) -> str | None:
        dept = self.get_department(dept_name)
        return dept.get_manager_country() if dept else None


# Client code - no chains, asks directly for what it needs
def calculate_manager_tax(company: Company, dept_name: str) -> float:
    tax_rate = company.get_manager_tax_rate(dept_name)
    if tax_rate is None:
        raise ValueError(f"Department {dept_name} not found")
    return tax_rate


def get_manager_country(company: Company, dept_name: str) -> str:
    country = company.get_manager_country(dept_name)
    return country or "Unknown"
```

---

### Middle Man

**Description**: A class that does little but delegate to another class.

**Detection**:

- Class has many methods that just call same-named methods on another object
- Class adds no value beyond wrapping
- Removing the class would simplify the code

**Bad Example**:

```typescript
class Person {
  private department: Department;

  constructor(department: Department) {
    this.department = department;
  }

  // All these methods just delegate
  getManagerName(): string {
    return this.department.getManager().getName();
  }

  getManagerEmail(): string {
    return this.department.getManager().getEmail();
  }

  getDepartmentName(): string {
    return this.department.getName();
  }

  getDepartmentBudget(): number {
    return this.department.getBudget();
  }

  getDepartmentHeadcount(): number {
    return this.department.getHeadcount();
  }

  getCompanyName(): string {
    return this.department.getCompany().getName();
  }

  getCompanyAddress(): string {
    return this.department.getCompany().getAddress();
  }
}

// Usage has to go through Person for everything
const person = new Person(salesDepartment);
const managerName = person.getManagerName();
const budget = person.getDepartmentBudget();
```

**Refactored**:

```typescript
// Option 1: Remove middle man - expose the delegate
class Person {
  constructor(private readonly department: Department) {}

  getDepartment(): Department {
    return this.department;
  }

  // Only keep methods that add value beyond delegation
  isInSameDepartmentAs(other: Person): boolean {
    return this.department === other.department;
  }

  getManager(): Manager {
    return this.department.getManager();
  }
}

// Usage - access what you need directly
const person = new Person(salesDepartment);
const managerName = person.getDepartment().getManager().getName();
const budget = person.getDepartment().getBudget();

// Option 2: If hiding is important, hide properly with value-added methods
class Employee {
  constructor(
    private readonly name: string,
    private readonly department: Department
  ) {}

  getName(): string {
    return this.name;
  }

  // Value-added method - not just delegation
  getContactInfo(): ContactInfo {
    return {
      employeeName: this.name,
      managerName: this.department.getManager().getName(),
      managerEmail: this.department.getManager().getEmail(),
      departmentName: this.department.getName(),
    };
  }

  // Value-added method - business logic
  canApproveExpense(amount: number): boolean {
    const managerApprovalLimit = this.department.getManager().getApprovalLimit();
    return amount <= managerApprovalLimit;
  }

  // Value-added method - computation
  getDepartmentContext(): DepartmentContext {
    const dept = this.department;
    return {
      name: dept.getName(),
      budget: dept.getBudget(),
      headcount: dept.getHeadcount(),
      budgetPerHead: dept.getBudget() / dept.getHeadcount(),
    };
  }
}

interface ContactInfo {
  employeeName: string;
  managerName: string;
  managerEmail: string;
  departmentName: string;
}

interface DepartmentContext {
  name: string;
  budget: number;
  headcount: number;
  budgetPerHead: number;
}
```

---

## Detection Tools

### Static Analysis Tools

```bash
# Python - detect code smells with pylint
pylint --disable=all --enable=R,C src/

# Python - cyclomatic complexity with radon
radon cc src/ -a -s

# Python - maintainability index
radon mi src/ -s

# TypeScript/JavaScript - ESLint with complexity rules
npx eslint --rule 'complexity: ["error", 10]' src/

# Multi-language - SonarQube (requires server)
sonar-scanner -Dsonar.projectKey=my-project

# Ruby - reek for code smells
reek app/
```

### IDE Integration

```json
// VS Code settings.json
{
  "editor.rulers": [80, 100],
  "python.linting.pylintArgs": [
    "--max-line-length=100",
    "--max-args=5",
    "--max-locals=15",
    "--max-statements=50"
  ],
  "eslint.rules.customizations": [
    { "rule": "complexity", "severity": "warn" },
    { "rule": "max-lines-per-function", "severity": "warn" }
  ]
}
```

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: complexity-check
        name: Check complexity
        entry: radon cc --min C --total-average
        language: system
        types: [python]

      - id: method-length
        name: Check method length
        entry: pylint --disable=all --enable=R0915
        language: system
        types: [python]
```

---

## Refactoring Strategies

### Safe Refactoring Workflow

```bash
# 1. Ensure tests pass before refactoring
pytest tests/ -v

# 2. Make small, incremental changes
git checkout -b refactor/extract-order-validation

# 3. Run tests after each change
pytest tests/ -v

# 4. Commit frequently
git add -p
git commit -m "refactor: extract validation to separate method"

# 5. Verify no behavior change
pytest tests/ --cov=src --cov-report=term-missing
```

### Refactoring Priorities

1. **High Impact, Low Risk**: Dead code removal, rename for clarity
2. **High Impact, Medium Risk**: Extract method/class, replace conditionals
3. **Medium Impact, High Risk**: Change inheritance hierarchies
4. **Avoid Unless Necessary**: Complete rewrites

---

## References

- [Refactoring Guru - Code Smells](https://refactoring.guru/refactoring/smells)
- [SourceMaking - Anti-Patterns](https://sourcemaking.com/antipatterns)
- [Clean Code by Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Refactoring by Martin Fowler](https://martinfowler.com/books/refactoring.html)
- [Working Effectively with Legacy Code by Michael Feathers](https://www.amazon.com/Working-Effectively-Legacy-Michael-Feathers/dp/0131177052)

---

**See Also**:

- [Anti-Patterns Index](index.md) - Technology-specific anti-patterns
- [Refactoring Examples](../09_refactoring/index.md) - Step-by-step refactoring guides
- [Testing Strategies](../05_ci_cd/testing_strategies.md) - Ensure refactoring doesn't break code
