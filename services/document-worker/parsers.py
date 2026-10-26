"""Defensive parse utilities for staged document imports.
This module does not write to the Landshop properties table.
Human review and approval are required before publication.
"""
from __future__ import annotations

import csv
import io
from dataclasses import dataclass
from typing import Any

MAX_CSV_BYTES = 15_000_000
MAX_ROWS = 25_000
ALLOWED_COLS = {'title','estate','state','city','property_type','price','plot_number','size_sqm'}

@dataclass
class ParsedBatch:
    fields: list[str]
    rows: list[dict[str, Any]]
    rejected_columns: list[str]


def parse_csv(contents: bytes) -> ParsedBatch:
    if len(contents) > MAX_CSV_BYTES:
        raise ValueError('CSV exceeds import limit')
    decoded = contents.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(decoded))
    if not reader.fieldnames:
        raise ValueError('CSV header is missing')
    columns = [str(x).strip().lower() for x in reader.fieldnames]
    rejected = [name for name in columns if name not in ALLOWED_COLS]
    rows = []
    for i, row in enumerate(reader):
        if i >= MAX_ROWS:
            raise ValueError('CSV row limit exceeded')
        mapped = {name: str(value or '').strip()[:2000]
                  for name, value in zip(columns, row.values())
                  if name in ALLOWED_COLS}
        rows.append(mapped)
    return ParsedBatch(fields=[f for f in columns if f in ALLOWED_COLS],
                       rows=rows, rejected_columns=rejected)
