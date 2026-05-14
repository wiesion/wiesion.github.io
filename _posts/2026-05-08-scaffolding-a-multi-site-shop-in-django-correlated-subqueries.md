---
layout: blog
title: "Scaffolding a Multi-Site Shop in Django: Correlated Subqueries"
date: 2026-05-08 11:30:00 +0100
tags: [django, postgresql, architecture]
excerpt: "How correlated subqueries replace N+1 queries and overfetching when you need exactly one related object per row, with full Django ORM implementation."
image: "/assets/pic/2026-05/django_multi_site_catalogue.png"
---

The **[overview article]({% post_url 2026-05-08-scaffolding-a-multi-site-shop-in-django-three-pragmatic-patterns %})** covers how three patterns fit together for a read-heavy multi-site catalogue; this one goes deep on fetching one related object per row without N+1 queries or overfetching.

## The Problem

A catalogue listing page needs, for each product, a primary image and a primary category. Two approaches come up immediately, and both have problems at scale.

**Eager-loading the full related set** — Django's `prefetch_related`, SQLAlchemy's `selectinload`, ActiveRecord's `includes` — runs a second query fetching all related objects and stitches them together in application code. For a page of 50 products averaging 8 images each, that is 400 image rows loaded to use 50 of them. With image metadata in a JSONB column or a description text field, that is a meaningful memory hit per request, held for the duration of the response. At catalogue scale — thousands of products in a search result — `prefetch_related` on a full related set is one of the easier ways to OOM a Django worker.

**Fetching lazily per row** — a property or method that calls `.first()` on the related queryset — triggers one query per product on render. The classic N+1 problem, just shaped like a product listing instead of a loop.

A third option comes up sometimes: a LEFT JOIN with `DISTINCT ON`. It works in Postgres but produces a different query shape than you want, and most ORMs do not express it cleanly. It also produces the same row explosion problem as `JOIN + DISTINCT`, described in the materialized paths article.

## The Pattern

A correlated subquery references a column from the outer query, executes once per outer row at the database level, and returns a single scalar value. The planner resolves each one as an index lookup; the work happens inside the database; the result arrives as an annotated column on the outer query. One round-trip, no N+1, no overfetching.

The raw SQL:

```sql
SELECT p.*,
  (SELECT image FROM product_image
   WHERE product_id = p.id
   ORDER BY ordering
   LIMIT 1) AS primary_image
FROM product p
WHERE p.is_visible = true;
```

For each row in `product`, the database runs the inner query, returns one value, and attaches it as a result column. The Django ORM expresses the same thing through `Subquery` and `OuterRef`:

```python
from django.db.models import OuterRef, Subquery

primary_image = (
    ProductImage.objects
    .filter(product=OuterRef("pk"))
    .order_by("ordering")
    .values("image")[:1]
)

Product.objects.filter(is_visible=True).annotate(
    primary_image=Subquery(primary_image),
)
```

`OuterRef("pk")` is the correlation — Django substitutes each product's primary key into the subquery at execution time.

## Three Rules That Must Hold

The pattern breaks in three specific ways, all at runtime rather than at query construction time.

**The inner query must project exactly one column.** A scalar subquery returns one value per outer row — that is the SQL constraint. `.values("field_name")` is how you tell Django which column to return. Omit it and Django falls back to the model's full column list, which does not satisfy "exactly one column" and produces malformed SQL.

**The inner query must be bounded to one row.** `[:1]` translates to `LIMIT 1` in the generated SQL. Without it, the moment any outer row matches more than one inner row, Postgres raises `ERROR: more than one row returned by a subquery used as an expression`. The error is clear; the timing is not — it appears in production the first time a product gets a second image, not in development when most products have one.

**The inner query must have an explicit `order_by`.** Without one, "the first image" means "whatever row the database returns first," which depends on the query plan and can change after a vacuum, an index rebuild, or a Postgres version upgrade. The query keeps working; the answer drifts. This applies equally to raw SQL, SQLAlchemy, and any other ORM — an unordered subquery with `LIMIT 1` is a latent bug in any stack.

Filter, order, project one column, limit to one row. Every time.

## The Full Listing Query

The primary image and primary category subqueries compose cleanly into a single manager method, combined with the EXISTS subtree filter from the materialized paths article:

```python
from django.db.models import Exists, OuterRef, Subquery


class ProductManager(models.Manager):
    def for_listing(self, site_id: int, category_path: str | None = None):
        primary_image = (
            ProductImage.objects
            .filter(product=OuterRef("pk"))
            .order_by("ordering")
            .values("image")[:1]
        )

        primary_category_name = (
            ProductCategory.objects
            .filter(
                product=OuterRef("pk"),
                category__site_id=site_id,
                is_primary=True,
            )
            .values("category__name")[:1]
        )

        qs = self.filter(is_visible=True).annotate(
            primary_image=Subquery(primary_image),
            primary_category_name=Subquery(primary_category_name),
        )

        link_filter = {
            "product": OuterRef("pk"),
            "category__site_id": site_id,
            "category__is_visible": True,
        }
        if category_path:
            link_filter["category__path__startswith"] = category_path

        return qs.filter(
            Exists(ProductCategory.objects.filter(**link_filter))
        )
```

The SQL this produces looks roughly like:

```sql
SELECT
    p.*,
    (SELECT pi.image FROM product_image pi
     WHERE pi.product_id = p.id
     ORDER BY pi.ordering LIMIT 1) AS primary_image,
    (SELECT c.name FROM product_category pc
     JOIN category c ON c.id = pc.category_id
     WHERE pc.product_id = p.id
       AND c.site_id = 1
       AND pc.is_primary = true
     LIMIT 1) AS primary_category_name
FROM product p
WHERE p.is_visible = true
AND EXISTS (
    SELECT 1 FROM product_category pc2
    JOIN category c2 ON c2.id = pc2.category_id
    WHERE pc2.product_id = p.id
      AND c2.site_id = 1
      AND c2.path LIKE '0001/%'
      AND c2.is_visible = true
);
```

One query, two correlated lookups, no N+1, no overfetching. With appropriate indexes on `ProductImage(product_id, ordering)` and `ProductCategory(product_id, category_id, is_primary)`, both subqueries resolve as index seeks.

## Idempotency

The pattern provides at-least-once semantics in the sense that nothing here prevents a retry from re-fetching the same data — but the more relevant concern for listings is that `sendNotification`-style side effects are not involved. What matters for a read query is correctness under concurrent writes: if a product's primary image changes between two requests, each request sees a consistent snapshot. Postgres's MVCC handles that without any additional work on your part.

If you are using this pattern for something that does have side effects — a job that claims and processes records, for instance — idempotency needs to be designed into the processing logic, not the query itself. That is a different problem covered in the database-backed job processing article.

## Where the Pattern Stops Being Cheap

The pattern is fast because the planner resolves each subquery as an index lookup — roughly O(log n) per outer row, scaling linearly with the outer result set. For page-sized result sets a catalogue listing actually returns, this is well within budget. Two cases break the assumption.

**Plan regressions on stale or skewed statistics.** If the planner underestimates outer cardinality — stale `ANALYZE`, correlated predicates it cannot model — it may pick a nested loop over a sequential scan instead of an index lookup, turning the per-row cost from O(log n) to O(n). The query still returns correct results, just much slower. Symptoms: a query that has been fast for months suddenly degrades after a data load or a Postgres major version upgrade. Fix: re-run `ANALYZE`, check whether the new planner made different cardinality estimates, consider extended statistics (`CREATE STATISTICS`) on correlated columns.

**Very large result sets.** Two correlated subqueries across 100,000 outer rows means 200,000 index lookups. Still cheap individually; not cheap in aggregate. For result sets this large, the right answer is almost never "optimize the subqueries" — it is "do not return 100,000 rows." Pagination, server-side facet counts, or denormalized read models all address the problem more directly.

For paginated catalogue listings with fresh statistics and indexed predicates, neither of these applies in practice. Both are worth knowing for the day they do.

## Eager Loading vs. Correlated Subqueries

The decision rule is straightforward regardless of language or ORM: if you need all related objects for a row, use eager loading. If you need one specific related object per row, use a correlated subquery.

Eager loading — `prefetch_related`, `selectinload`, `includes` — is the right tool for a product detail page rendering every image, or a category page iterating every product. It runs a second query, fetches the full related set, and the application stitches results together in memory. The cost is proportional to the total number of related rows fetched.

Correlated subqueries are the right tool when the selection logic itself belongs in the database — the primary image by ordering, the lowest price across variants, the most recent review. The cost is proportional to the number of outer rows, not the total number of related rows.

A practical signal: if you would write `LIMIT 1` in the SQL, you want a correlated subquery. If you would iterate the full related set in application code, you want eager loading.

---

*If you are working on a catalogue or any system where query patterns and data model have drifted apart, [let's talk](/). I help engineering teams modernize backend architectures — pragmatically, without the rewrite.*