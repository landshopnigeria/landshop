"""Landshop mortgage calculations; financial product terms must be approved upstream.
No claim of eligibility, guaranteed rate, or binding loan offer.
All values are Decimal; monetary amounts are NGN.
"""
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation

CENT = Decimal("0.01")
MAX_MONTHS = 600

def as_money(value):
    try:
        result = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError("Amount must be numeric") from exc
    if not result.is_finite():
        raise ValueError("Amount must be finite")
    return result.quantize(CENT, rounding=ROUND_HALF_UP)

def calculate_mortgage(property_price, deposit, annual_percent, months: int):
    price, equity = as_money(property_price), as_money(deposit)
    try:
        rate_percent = Decimal(str(annual_percent))
    except (InvalidOperation, TypeError) as exc:
        raise ValueError("Rate must be numeric") from exc
    if not rate_percent.is_finite() or rate_percent < 0 or rate_percent > Decimal("100"):
        raise ValueError("Annual rate is outside allowed range")
    if price <= 0 or equity < 0 or equity >= price:
        raise ValueError("Invalid property price or deposit")
    if not isinstance(months, int) or not 1 <= months <= MAX_MONTHS:
        raise ValueError("Months must be an integer from 1 to 600")

    principal = price - equity
    monthly_rate = rate_percent / Decimal("1200")
    if monthly_rate == 0:
        payment = (principal / months).quantize(CENT, rounding=ROUND_HALF_UP)
    else:
        ratio = (Decimal(1) + monthly_rate) ** months
        payment = (principal * monthly_rate * ratio / (ratio-1)).quantize(
            CENT, rounding=ROUND_HALF_UP
        )
    remaining = principal
    schedule = []
    for month in range(1, months + 1):
        interest = (remaining * monthly_rate).quantize(CENT, rounding=ROUND_HALF_UP)
        pay = payment if month < months else remaining + interest
        principal_paid = pay - interest
        if principal_paid < 0:
            raise ValueError("Payment below monthly interest")
        remaining -= principal_paid
        schedule.append({
            "month": month, "payment": str(pay), "interest": str(interest),
            "principal": str(principal_paid), "balance": str(remaining),
        })
    total_paid = sum(Decimal(row["payment"]) for row in schedule)
    return {
        "currency": "NGN",
        "principal": str(principal),
        "deposit": str(equity),
        "annual_percent": str(rate_percent),
        "months": months,
        "estimated_regular_payment": str(payment),
        "total_repayments": str(total_paid),
        "total_interest": str(total_paid-principal),
        "schedule": schedule,
        "disclaimer": "Illustrative only; not an approved Landshop financing offer.",
    }
