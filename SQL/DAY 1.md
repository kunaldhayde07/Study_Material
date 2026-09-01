# 🟢 Day 1 — SELECT & Basic SQL Queries

Today you’ll learn the foundation of SQL: **how to retrieve data from a database**.

Our examples will use a realistic **RAG application database** containing users, documents, and conversations.

## 1. Today's Goal

By the end of Day 1, you should be able to:

- Understand tables, rows, and columns
- Write `SELECT` queries
- Select specific columns
- Use `*`
- Rename columns with `AS`
- Use expressions in `SELECT`
- Understand `NULL`
- Retrieve unique records conceptually
- Debug basic SQL errors
- Read SQL written by another engineer

**Important:** I will not give you exercise answers until you attempt them.

---

# 2. SQL Mental Model

Imagine our RAG application stores documents like this:

### `documents`

| id | user_id | title | file_type | page_count |
|---|---|---|---|---|
| 1 | 101 | RAG Architecture | pdf | 15 |
| 2 | 101 | PostgreSQL Guide | pdf | 42 |
| 3 | 102 | Python Basics | pdf | 28 |
| 4 | 103 | FastAPI Notes | md | 12 |

Think of:

- **Database** → entire application data
- **Table** → one type of data
- **Row** → one record
- **Column** → one attribute

For example:

```text
documents
    ↓
row 3
    ↓
102 | Python Basics | pdf | 28 
```
# 3. Your First SQL Query

The basic structure is:

```sql
SELECT column_name
FROM table_name;
```

### Example

```sql
SELECT title
FROM documents;
```

### Result

```text
RAG Architecture
PostgreSQL Guide
Python Basics
FastAPI Notes
```

SQL is essentially asking the database:

> "Which data do I want?"

---

# 4. Selecting Multiple Columns

You can request several columns:

```sql
SELECT id, title, file_type
FROM documents;
```

### Result

| id | title            | file_type |
| -- | ---------------- | --------- |
| 1  | RAG Architecture | pdf       |
| 2  | PostgreSQL Guide | pdf       |
| 3  | Python Basics    | pdf       |
| 4  | FastAPI Notes    | md        |

The order matters.

```sql
SELECT title, id
FROM documents;
```

produces:

| title            | id |
| ---------------- | -- |
| RAG Architecture | 1  |
| PostgreSQL Guide | 2  |
| Python Basics    | 3  |
| FastAPI Notes    | 4  |


# 5. Selecting Everything — `*`

You can select every column:

```sql id="h7r2kf"
SELECT *
FROM documents;
```

`*` means:

> all columns

This is useful when exploring a database.

But in production code, avoid blindly using:

```sql id="2c4w9m"
SELECT *
```

Why?

Imagine your table eventually has:

```text id="q1j8pa"
id
user_id
title
file_type
page_count
embedding
metadata
created_at
updated_at
processing_status
...
```

You may only need:

```sql id="r6c5yu"
SELECT id, title, processing_status
FROM documents;
```

This makes your query's intention clearer and can avoid unnecessarily retrieving large columns such as embeddings or metadata.

---

# 6. `AS` — Renaming Columns

Suppose the application wants the output column to be called `document_title`.

```sql id="x8k2nd"
SELECT title AS document_title
FROM documents;
```

### Result

| document_title   |
| ---------------- |
| RAG Architecture |
| PostgreSQL Guide |
| Python Basics    |
| FastAPI Notes    |

You can rename multiple columns:

```sql id="m4q7vs"
SELECT
    id AS document_id,
    title AS document_title,
    file_type AS document_format
FROM documents;
```

### Important distinction

`AS` does **not** rename the database column.

It only changes the name in the query result.

The actual table still has:

```text id="e3v6bc"
title
```

not:

```text id="w9p4kx"
document_title
```

# 7. Expressions in SELECT

SQL can perform calculations.

Suppose:

```text
page_count
```

contains the number of pages.

You can calculate an estimated processing cost:

```sql
SELECT
    title,
    page_count,
    page_count * 2 AS estimated_chunks
FROM documents;
```

If:

```text
page_count = 15
```

then:

```text
estimated_chunks = 30
```

The calculated value doesn't automatically become a database column.

It's calculated when the query runs.

---

# 8. String Expressions

You can also combine values.

Suppose we have:

### `users`

| id  | first_name | last_name  |
| --- | ---------- | ---------- |
| 101 | Om         | Kshirsagar |
| 102 | Rahul      | Patil      |
| 103 | Priya      | Sharma     |

PostgreSQL supports string concatenation using `||`.

```sql
SELECT
    first_name || ' ' || last_name AS full_name
FROM users;
```

### Result

| full_name     |
| ------------- |
| Om Kshirsagar |
| Rahul Patil   |
| Priya Sharma  |

This is useful when constructing display values.

---

# 9. `NULL`

This is extremely important in real databases.

`NULL` does **not** mean:

```text
0
```

It does not necessarily mean:

```text
empty string
```

It means:

> the value is unknown / missing / not present.

### Example

### `documents`

| id | title            | processed_at |
| -- | ---------------- | ------------ |
| 1  | RAG Architecture | 2026-08-29   |
| 2  | PostgreSQL Guide | 2026-08-29   |
| 3  | Python Basics    | NULL         |

Document 3 may not have been processed yet.

Don't think:

```text
NULL = 0
```

Think:

```text
NULL = unknown/missing value
```

We'll work much more deeply with `NULL` later.

# 10. SQL Formatting

These two queries are equivalent:

```sql
SELECT id, title FROM documents;
```

and:

```sql
SELECT
    id,
    title
FROM documents;
```

For production SQL, prefer readable formatting:

```sql
SELECT
    id,
    title,
    file_type,
    page_count
FROM documents;
```

Good SQL formatting becomes extremely important once queries contain joins, CTEs, and window functions.

---

# 11. SQL Is Declarative

This is a major concept.

Python usually tells the computer **how** to perform operations.

SQL generally tells the database **what** result you want.

For example:

```sql
SELECT title
FROM documents;
```

You're not telling PostgreSQL:

```text
open table
go to row 1
read title
go to row 2
read title
...
```

You're declaring:

> Give me the titles from documents.

PostgreSQL's query planner decides how to execute that request.

We'll study the planner and `EXPLAIN` on Day 20.

---

# 12. Real RAG Example

Imagine your RAG system has:

### `users`

```text
id
name
email
created_at
```

### `documents`

```text
id
user_id
title
file_type
page_count
created_at
```

### `conversations`

```text
id
user_id
title
created_at
```

### `messages`

```text
id
conversation_id
role
content
created_at
```

### `document_chunks`

```text
id
document_id
chunk_text
chunk_index
embedding
```

A basic engineering question might be:

> "Show me the IDs and titles of all documents."

SQL:

```sql
SELECT
    id,
    title
FROM documents;
```

Another:

> "Show document title and page count."

```sql
SELECT
    title,
    page_count
FROM documents;
```

This simple ability is the foundation for everything we'll build later.

13. SQL Comments

Single-line comment:

-- Get document titles
SELECT title
FROM documents;

Multi-line:

/*
   Get document information
   for debugging
*/
SELECT
    id,
    title
FROM documents;

Comments are useful when debugging or explaining complicated SQL.

14. Common Day-1 Mistakes

Mistake 1

SELECT documents
FROM title;

Wrong.

Think:

SELECT → columns
FROM    → table

Correct:

SELECT title
FROM documents;

Mistake 2

Forgetting the semicolon:

SELECT title
FROM documents

Many SQL clients will still execute it, but develop the habit of writing:

SELECT title
FROM documents;

Mistake 3

Using Python-style syntax

❌

SELECT(title)
FROM documents;

Unless you're calling a SQL function, this isn't how basic column selection works.

Use:

SELECT title
FROM documents;

Mistake 4

Wrong table name

SELECT title
FROM document;

when the actual table is:

documents

PostgreSQL will complain that the relation/table doesn't exist.

# 15. Your First SQL Debugging Task

Suppose PostgreSQL gives an error for:

```sql
SELECT document_name
FROM documents;
```

The table exists.

Look at the schema:

```text
documents

id
user_id
title
file_type
page_count
created_at
```

### Your task

1. What is wrong?
2. What should the corrected query be?
3. Why does PostgreSQL reject the original query?

> **Don't look for an answer from me—write it yourself.**

---

# 16. 🧠 Exercise Set A — Basic SELECT

Use this fictional dataset:

### `users`

| id | name  | email                                         | country |
| -- | ----- | --------------------------------------------- | ------- |
| 1  | Aarav | [aarav@example.com](mailto:aarav@example.com) | India   |
| 2  | Emma  | [emma@example.com](mailto:emma@example.com)   | USA     |
| 3  | Liam  | [liam@example.com](mailto:liam@example.com)   | UK      |
| 4  | Sofia | [sofia@example.com](mailto:sofia@example.com) | India   |

### `documents`

| id  | user_id | title            | file_type | page_count |
| --- | ------- | ---------------- | --------- | ---------- |
| 101 | 1       | RAG Fundamentals | pdf       | 20         |
| 102 | 1       | PostgreSQL Guide | pdf       | 45         |
| 103 | 2       | Python Basics    | pdf       | 30         |
| 104 | 3       | FastAPI Tutorial | md        | 15         |
| 105 | 4       | Vector Databases | pdf       | 50         |

### Write SQL for:

**Q1.** Return every column from `users`.

**Q2.** Return only `name` from `users`.

**Q3.** Return `id`, `name`, and `country` from `users`.

**Q4.** Return `title` and `page_count` from `documents`.

**Q5.** Return `id`, `title`, and `file_type` from `documents`.

**Q6.** Return all columns from `documents`.

# 17. 🧠 Exercise Set B — Aliases

Write SQL for:

**Q7.** Return `id` as `user_id` and `name` as `user_name`.

**Q8.** Return:

```text
document_id
document_title
pages
```

using:

```text
id
title
page_count
```

from `documents`.

---

# 18. 🧠 Exercise Set C — Expressions

**Q9.**

Return:

```text
title
page_count
estimated_chunks
```

Assume:

```text
estimated_chunks = page_count * 2
```

---

**Q10.**

Return:

```text
name
email
```

but rename them:

```text
user_name
contact_email
```

---

# 19. 🔥 Practical Engineering Problem

You're building an admin dashboard for a RAG application.

The frontend needs to display:

```text
Document ID
Document Title
File Type
Pages
Estimated Chunks
```

The database has:

```text
id
title
file_type
page_count
```

### Task

Write **one SQL query** that produces exactly those five output columns.

Do not use `SELECT *`.

---

# 20. 🐛 Debugging Challenge

A developer wrote:

```sql
SELECT
    id document_id,
    title document_title,
    page_count * 2 estimated chunks
FROM documents;
```

There is a problem.

### Your tasks:

1. Identify the problem.
2. Rewrite the query correctly.
3. Explain why the original query is problematic.

# 21. 🎤 Interview Question

Imagine you're interviewing for a junior Data Engineer / GenAI Engineer role.

### Question:

**What is the difference between** **`SELECT *`** **and explicitly selecting columns?**

Give me a technical answer.

Don't give me a textbook definition—answer as if you're speaking to an interviewer.

---

# 22. 🗣️ Explanation Challenge

Without looking back:

Explain to me:

> **What happens conceptually when PostgreSQL receives** **`SELECT title FROM documents;`****?**

Try to explain it in your own words.

You don't need to know the internal query planner yet.

---

# 23. 📝 Day 1 Short Test

Don't search for answers. Attempt everything.

### Q1

What does this return?

```sql
SELECT title
FROM documents;
```

---

### Q2

What does `*` mean?

```sql
SELECT *
FROM documents;
```

---

### Q3

What does `AS` do?

```sql
SELECT title AS document_name
FROM documents;
```

---

### Q4

Is this changing the actual database column name?

```sql
SELECT title AS document_name
FROM documents;
```

Answer **Yes/No + explain.**

---

### Q5

Write a query that returns:

```text
id
title
page_count
```

from `documents`.

---

### Q6

Write a query that returns:

```text
title
estimated_pages
```

where:

```text
estimated_pages = page_count + 5
```

---

### Q7

What is wrong here?

```sql
SELECT name
FROM document;
```

Assume the actual table is:

```text
documents
```

---

### Q8

What does `NULL` represent?


What does NULL represent?
