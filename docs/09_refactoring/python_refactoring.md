---
title: "Python Refactoring Examples"
description: "Real-world Python code refactoring examples with before/after comparisons"
author: "Tyler Dukes"
tags: [python, refactoring, best-practices, examples]
category: "Refactoring"
status: "active"
---

Real-world examples of refactoring Python code to improve readability, maintainability, and adherence to best practices.

## Extract Function

### Problem: Long, complex function doing multiple things

**Before** (150 lines, cyclomatic complexity: 18):

```python
def process_user_data(user_id):
    # Fetch user from database
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user_data = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user_data:
        return None

    # Validate email
    email = user_data[2]
    if not email or '@' not in email or '.' not in email.split('@')[1]:
        raise ValueError("Invalid email")

    # Calculate age from birthdate
    birthdate_str = user_data[5]
    birth_year = int(birthdate_str.split('-')[0])
    birth_month = int(birthdate_str.split('-')[1])
    birth_day = int(birthdate_str.split('-')[2])
    today = datetime.date.today()
    age = today.year - birth_year
    if (today.month, today.day) < (birth_month, birth_day):
        age -= 1

    # Check subscription status
    subscription_end = user_data[8]
    if subscription_end:
        end_date = datetime.datetime.strptime(subscription_end, '%Y-%m-%d')
        is_active = end_date > datetime.datetime.now()
    else:
        is_active = False

    # Format response
    response = {
        'id': user_data[0],
        'name': user_data[1],
        'email': email,
        'age': age,
        'subscription_active': is_active,
        'joined_date': user_data[6]
    }

    return response
```

**After** (well-structured, cyclomatic complexity: 3):

```python
from typing import Optional
from datetime import date, datetime
import re

def process_user_data(user_id: int) -> Optional[dict]:
    """Process and format user data from database.

    Args:
        user_id: The unique user identifier

    Returns:
        Formatted user data dict, or None if user not found

    Raises:
        ValueError: If user email is invalid
    """
    user_data = fetch_user(user_id)
    if not user_data:
        return None

    validate_email(user_data['email'])

    return {
        'id': user_data['id'],
        'name': user_data['name'],
        'email': user_data['email'],
        'age': calculate_age(user_data['birthdate']),
        'subscription_active': is_subscription_active(user_data['subscription_end']),
        'joined_date': user_data['joined_date']
    }

def fetch_user(user_id: int) -> Optional[dict]:
    """Fetch user from database by ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()

    if not row:
        return None

    return {
        'id': row[0],
        'name': row[1],
        'email': row[2],
        'birthdate': row[5],
        'joined_date': row[6],
        'subscription_end': row[8]
    }

def validate_email(email: str) -> None:
    """Validate email format.

    Raises:
        ValueError: If email format is invalid
    """
    email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    if not email or not email_pattern.match(email):
        raise ValueError(f"Invalid email format: {email}")

def calculate_age(birthdate: date) -> int:
    """Calculate age from birthdate."""
    today = date.today()
    age = today.year - birthdate.year
    if (today.month, today.day) < (birthdate.month, birthdate.day):
        age -= 1
    return age

def is_subscription_active(subscription_end: Optional[datetime]) -> bool:
    """Check if subscription is currently active."""
    if not subscription_end:
        return False
    return subscription_end > datetime.now()
```

**Improvements**:

- ✅ Single Responsibility Principle: Each function does one thing
- ✅ Type hints for better IDE support and type checking
- ✅ Proper docstrings
- ✅ Context manager for database connection
- ✅ Regular expression for email validation
- ✅ Reduced cyclomatic complexity (18 → 3)
- ✅ Improved testability (can test each function independently)

---

## Replace Magic Numbers

### Problem: Hard-coded values throughout code

**Before**:

```python
def calculate_shipping(weight, distance):
    if weight <= 5:
        base_cost = 10.0
    elif weight <= 20:
        base_cost = 25.0
    else:
        base_cost = 50.0

    if distance <= 100:
        distance_cost = distance * 0.5
    elif distance <= 500:
        distance_cost = distance * 0.75
    else:
        distance_cost = distance * 1.0

    total = base_cost + distance_cost

    if total > 100:
        total = total * 0.9  # 10% discount

    return round(total, 2)
```

**After**:

```python
from dataclasses import dataclass
from typing import ClassVar

@dataclass(frozen=True)
class ShippingRates:
    """Shipping rate constants."""

    # Weight thresholds (kg)
    LIGHT_WEIGHT_MAX: ClassVar[float] = 5.0
    MEDIUM_WEIGHT_MAX: ClassVar[float] = 20.0

    # Base costs by weight category
    LIGHT_WEIGHT_BASE: ClassVar[float] = 10.0
    MEDIUM_WEIGHT_BASE: ClassVar[float] = 25.0
    HEAVY_WEIGHT_BASE: ClassVar[float] = 50.0

    # Distance thresholds (km)
    SHORT_DISTANCE_MAX: ClassVar[int] = 100
    MEDIUM_DISTANCE_MAX: ClassVar[int] = 500

    # Distance rates per km
    SHORT_DISTANCE_RATE: ClassVar[float] = 0.5
    MEDIUM_DISTANCE_RATE: ClassVar[float] = 0.75
    LONG_DISTANCE_RATE: ClassVar[float] = 1.0

    # Discounts
    BULK_DISCOUNT_THRESHOLD: ClassVar[float] = 100.0
    BULK_DISCOUNT_RATE: ClassVar[float] = 0.10

def calculate_shipping(weight: float, distance: int) -> float:
    """Calculate shipping cost based on weight and distance.

    Args:
        weight: Package weight in kilograms
        distance: Shipping distance in kilometers

    Returns:
        Total shipping cost with applicable discounts
    """
    base_cost = _get_base_cost_by_weight(weight)
    distance_cost = _get_distance_cost(distance)
    total = base_cost + distance_cost

    return _apply_bulk_discount(total)

def _get_base_cost_by_weight(weight: float) -> float:
    """Get base shipping cost based on package weight."""
    if weight <= ShippingRates.LIGHT_WEIGHT_MAX:
        return ShippingRates.LIGHT_WEIGHT_BASE
    elif weight <= ShippingRates.MEDIUM_WEIGHT_MAX:
        return ShippingRates.MEDIUM_WEIGHT_BASE
    else:
        return ShippingRates.HEAVY_WEIGHT_BASE

def _get_distance_cost(distance: int) -> float:
    """Calculate cost based on shipping distance."""
    if distance <= ShippingRates.SHORT_DISTANCE_MAX:
        rate = ShippingRates.SHORT_DISTANCE_RATE
    elif distance <= ShippingRates.MEDIUM_DISTANCE_MAX:
        rate = ShippingRates.MEDIUM_DISTANCE_RATE
    else:
        rate = ShippingRates.LONG_DISTANCE_RATE

    return distance * rate

def _apply_bulk_discount(total: float) -> float:
    """Apply bulk discount if threshold is met."""
    if total > ShippingRates.BULK_DISCOUNT_THRESHOLD:
        discount = total * ShippingRates.BULK_DISCOUNT_RATE
        total -= discount

    return round(total, 2)
```

**Improvements**:

- ✅ Named constants instead of magic numbers
- ✅ Self-documenting code
- ✅ Easy to update rates in one place
- ✅ Frozen dataclass prevents accidental modification
- ✅ Private helper functions for clarity

---

## Simplify Complex Conditionals

### Problem: Nested if/else statements

**Before**:

```python
def get_user_discount(user):
    if user.is_premium:
        if user.years_member > 5:
            if user.total_purchases > 10000:
                discount = 0.30
            else:
                discount = 0.20
        else:
            if user.total_purchases > 5000:
                discount = 0.15
            else:
                discount = 0.10
    else:
        if user.years_member > 2:
            if user.total_purchases > 1000:
                discount = 0.05
            else:
                discount = 0.02
        else:
            discount = 0.0

    return discount
```

**After**:

```python
from dataclasses import dataclass
from typing import Protocol

class UserProtocol(Protocol):
    """User interface for discount calculation."""
    is_premium: bool
    years_member: int
    total_purchases: float

@dataclass(frozen=True)
class DiscountTier:
    """Discount tier with eligibility criteria."""
    min_years: int
    min_purchases: float
    discount_rate: float

    def is_eligible(self, user: UserProtocol) -> bool:
        """Check if user meets tier requirements."""
        return (user.years_member >= self.min_years and
                user.total_purchases >= self.min_purchases)

## Define discount tiers (highest to lowest priority)
PREMIUM_TIERS = [
    DiscountTier(min_years=5, min_purchases=10000, discount_rate=0.30),
    DiscountTier(min_years=5, min_purchases=0, discount_rate=0.20),
    DiscountTier(min_years=0, min_purchases=5000, discount_rate=0.15),
    DiscountTier(min_years=0, min_purchases=0, discount_rate=0.10),
]

STANDARD_TIERS = [
    DiscountTier(min_years=2, min_purchases=1000, discount_rate=0.05),
    DiscountTier(min_years=2, min_purchases=0, discount_rate=0.02),
    DiscountTier(min_years=0, min_purchases=0, discount_rate=0.0),
]

def get_user_discount(user: UserProtocol) -> float:
    """Calculate user discount based on membership and purchase history.

    Args:
        user: User object with membership details

    Returns:
        Discount rate as decimal (e.g., 0.15 for 15%)
    """
    tiers = PREMIUM_TIERS if user.is_premium else STANDARD_TIERS

    for tier in tiers:
        if tier.is_eligible(user):
            return tier.discount_rate

    return 0.0
```

**Improvements**:

- ✅ Eliminated nested conditionals
- ✅ Data-driven approach (easy to add new tiers)
- ✅ Single loop instead of nested ifs
- ✅ Self-documenting tier structure
- ✅ Easy to test each tier independently

---

## Use List Comprehensions Effectively

### Problem: Verbose loop-based transformations

**Before**:

```python
def process_orders(orders):
    # Filter active orders
    active_orders = []
    for order in orders:
        if order.status == 'active':
            active_orders.append(order)

    # Extract order IDs
    order_ids = []
    for order in active_orders:
        order_ids.append(order.id)

    # Calculate total values
    total_values = []
    for order in active_orders:
        total = 0
        for item in order.items:
            total += item.price * item.quantity
        total_values.append(total)

    # Find high-value orders
    high_value_orders = []
    for i, total in enumerate(total_values):
        if total > 1000:
            high_value_orders.append(active_orders[i])

    return high_value_orders
```

**After**:

```python
from typing import List, Protocol
from dataclasses import dataclass

class OrderItem(Protocol):
    """Order item interface."""
    price: float
    quantity: int

class Order(Protocol):
    """Order interface."""
    id: str
    status: str
    items: List[OrderItem]

def calculate_order_total(order: Order) -> float:
    """Calculate total value of an order."""
    return sum(item.price * item.quantity for item in order.items)

def process_orders(orders: List[Order]) -> List[Order]:
    """Filter and return high-value active orders.

    Args:
        orders: List of orders to process

    Returns:
        List of active orders with total value > $1000
    """
    return [
        order for order in orders
        if order.status == 'active' and calculate_order_total(order) > 1000
    ]

## Alternative: If you need the totals separately
def process_orders_with_totals(orders: List[Order]) -> List[tuple[Order, float]]:
    """Return high-value active orders with their totals.

    Returns:
        List of (order, total) tuples for orders > $1000
    """
    HIGH_VALUE_THRESHOLD = 1000.0

    return [
        (order, total)
        for order in orders
        if order.status == 'active'
        for total in [calculate_order_total(order)]
        if total > HIGH_VALUE_THRESHOLD
    ]
```

**Improvements**:

- ✅ Single comprehension instead of multiple loops
- ✅ Eliminated intermediate variables
- ✅ More readable and Pythonic
- ✅ Named constant for threshold
- ✅ Extracted total calculation to reusable function

---

## Apply Type Hints

### Problem: Unclear function signatures and return types

**Before**:

```python
def fetch_user_data(user_id, include_orders=False):
    user = db.get_user(user_id)
    if not user:
        return None

    data = {
        'id': user.id,
        'name': user.name,
        'email': user.email
    }

    if include_orders:
        data['orders'] = [
            {'id': o.id, 'total': o.total}
            for o in user.orders
        ]

    return data

def calculate_discount(user, product):
    if user.premium:
        return product.price * 0.15
    return product.price * 0.05
```

**After**:

```python
from typing import TypedDict, Optional, List
from decimal import Decimal

class OrderDict(TypedDict):
    """Order data dictionary structure."""
    id: str
    total: Decimal

class UserDataDict(TypedDict, total=False):
    """User data dictionary structure.

    Note: 'orders' is optional (total=False allows missing keys)
    """
    id: str
    name: str
    email: str
    orders: List[OrderDict]  # Optional field

class User(Protocol):
    """User domain model protocol."""
    id: str
    name: str
    email: str
    premium: bool
    orders: List['Order']

class Order(Protocol):
    """Order domain model protocol."""
    id: str
    total: Decimal

class Product(Protocol):
    """Product domain model protocol."""
    price: Decimal

def fetch_user_data(
    user_id: str,
    include_orders: bool = False
) -> Optional[UserDataDict]:
    """Fetch user data from database.

    Args:
        user_id: Unique user identifier
        include_orders: Whether to include order history

    Returns:
        User data dictionary, or None if user not found
    """
    user: Optional[User] = db.get_user(user_id)
    if not user:
        return None

    data: UserDataDict = {
        'id': user.id,
        'name': user.name,
        'email': user.email
    }

    if include_orders:
        data['orders'] = [
            OrderDict(id=order.id, total=order.total)
            for order in user.orders
        ]

    return data

def calculate_discount(user: User, product: Product) -> Decimal:
    """Calculate discount amount for user on product.

    Args:
        user: User requesting discount
        product: Product to discount

    Returns:
        Discount amount in dollars
    """
    PREMIUM_DISCOUNT_RATE = Decimal('0.15')
    STANDARD_DISCOUNT_RATE = Decimal('0.05')

    discount_rate = PREMIUM_DISCOUNT_RATE if user.premium else STANDARD_DISCOUNT_RATE
    return product.price * discount_rate
```

**Improvements**:

- ✅ Complete type hints for all parameters and returns
- ✅ TypedDict for structured dictionaries
- ✅ Protocol for duck typing
- ✅ Decimal for money calculations
- ✅ Better IDE autocomplete and type checking
- ✅ Self-documenting function signatures

---

## Resources

### Tools

- **black**: Code formatter
- **isort**: Import sorter
- **pylint**: Linter for code quality
- **mypy**: Static type checker
- **radon**: Complexity analyzer

### Related Documentation

- [Python Style Guide](../02_language_guides/python.md)
- [Testing Strategies](../05_ci_cd/testing_strategies.md)
- [Python Package Example](../05_examples/python_package_example.md)

---

**Version**: 1.0.0
