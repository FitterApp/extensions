# Extensions API Documentation

This document describes the API endpoints for querying and storing extension data in the Movement platform.

---

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Storing Extension Data](#storing-extension-data)
- [Querying Extension Data](#querying-extension-data)
- [Updating Extension Data](#updating-extension-data)
- [Deleting Extension Data](#deleting-extension-data)
- [Parameters Reference](#parameters-reference)
- [Example Requests](#example-requests)
- [Data Model](#data-model)

---

## Overview

The Extensions API allows custom extensions to store and retrieve data associated with users (subscribers) and apps. Data is stored as key-value pairs and can be queried with flexible filters, aggregation, and grouping options.

The API is implemented using the `ExtensionData` model and `ExtensionDataController` which provides CRUD operations for extension data.

---

## Authentication

All endpoints require the user to be authenticated. Authentication is typically handled via session cookies or tokens, depending on your integration.

---

## Storing Extension Data

### Endpoint

```
POST /extension_data/:extension_slug
```

- **:extension_slug**: The unique identifier for your extension (e.g., `votes`, `macro-tracker`).

### Request Body

```
{
  "data": {
    "key": "<string>",
    "value": <any>,
    "created_at": "<optional datetime>"
  }
}
```

- You may also send an array of data objects under `data` to store multiple records at once.

#### Example

```
POST /extension_data/votes
{
  "data": {
    "key": "upvote",
    "value": 1
  }
}
```

#### Response

```
{
  "success": true
}
```

---

## Querying Extension Data

### Endpoint

```
GET /extension_data/:extension_slug?key=<key>&[query params]
```

- **:extension_slug**: The unique identifier for your extension.
- **key**: The key to query (required).

### Query Parameters

- `key` (string, required): The key to filter records by.
- `filter` (object, optional): Filtering options (see below).
- `aggregate` (string/object, optional): Aggregation type or object (see below).
- `aggregate_filter` (object, optional): Filter on aggregation result.
- `group_by` (string, optional): Field to group results by.
- `order` (string/object, optional): Sorting options.
- `limit` (integer, optional): Max number of results (default: 50, max: 100).
- `member_only` (boolean, optional): If true, only returns data for the current user.

#### Example

```
GET /extension_data/votes?key=upvote&group_by=subscriber_id&aggregate=count
```

#### Response

```
{
  "success": true,
  "results": [
    {
      "key": "123", // group key (e.g., subscriber_id)
      "value": 5,    // aggregated value
      "member": { ... } // present if grouped by subscriber_id
    },
    ...
  ]
}
```

---

## Updating Extension Data

### Endpoint

```
PUT /extension_data/:extension_slug
```

- **:extension_slug**: The unique identifier for your extension.

### Request Body

```
{
  "id": "<tracked_id>",
  "value": <new_value>
}
```

#### Example

```
PUT /extension_data/macro-tracker
{
  "id": "tracked_123",
  "value": { "protein": 35, "carbs": 45, "fat": 12 }
}
```

#### Response

```
{
  "success": true
}
```

---

## Deleting Extension Data

### Endpoint

```
DELETE /extension_data/:extension_slug
```

- **:extension_slug**: The unique identifier for your extension.

### Query Parameters

- `key` (string, required): The key to delete records for.
- `tracked_id` (string, optional): Specific tracked ID to delete.
- `filter` (object, optional): Filter to apply before deletion.

#### Example

```
DELETE /extension_data/macro-tracker?key=nutrition&tracked_id=tracked_123
```

#### Response

```
{
  "success": true
}
```

---

## Parameters Reference

### Filter
- `on`: Field to filter on (default: value)
- `eq`: Equal to
- `gt`: Greater than
- `lt`: Less than
- `contains`: Substring match
- `after`: Only records tracked after this datetime
- `before`: Only records tracked before this datetime

### Aggregate
- String: `sum`, `avg`, `max`, `min`, `count`
- Object: `{ type: "sum"|"avg"|"max"|"min"|"count", on: "value"|"value->>'field'" }`

### Aggregate Filter
- `eq`, `gt`, `lt` (applied to aggregation result)

### Group By
- `day`, `subscriber_id`, `key`, `value`, or a JSON path (e.g., `value->>'field'`)

### Order
- String: `ASC` or `DESC` (by value)
- Object: `{ by: "created_at"|"value", dir: "ASC"|"DESC" }`

---

## Data Model

The API is built on the `ExtensionData` model with the following structure:

### Database Schema
- `extension_slug`: The extension identifier
- `account_app_id`: Associated app
- `subscriber_id`: Associated subscriber
- `key`: Data key
- `value`: Data value (JSON)
- `tracked_at`: Timestamp when data was tracked
- `tracked_id`: Unique identifier for the record

### Valid Aggregates
- `sum`: Sum of numeric values
- `avg`: Average of numeric values
- `max`: Maximum numeric value
- `min`: Minimum numeric value
- `count`: Count of records

### Groupable Fields
- `day`: Group by date
- `subscriber_id`: Group by subscriber
- `key`: Group by key
- `value`: Group by value
- JSON paths: `value->>'field'`

### JSON Path Pattern
Valid JSON paths follow the pattern: `value->>'field_name'`

---

## Example Requests

### Store a Single Data Point

```
POST /extension_data/macro-tracker
{
  "data": {
    "key": "nutrition",
    "value": { "protein": 30, "carbs": 50, "fat": 10 },
    "created_at": "2024-06-01T12:00:00Z"
  }
}
```

### Store Multiple Data Points

```
POST /extension_data/macro-tracker
{
  "data": [
    { "key": "nutrition", "value": { "protein": 30, "carbs": 50 } },
    { "key": "nutrition", "value": { "protein": 25, "carbs": 40 } }
  ]
}
```

### Query Data for a Key

```
GET /extension_data/macro-tracker?key=nutrition
```

### Query with Aggregation and Grouping

```
GET /extension_data/votes?key=upvote&aggregate=count&group_by=subscriber_id
```

### Query with Filters

```
GET /extension_data/macro-tracker?key=nutrition&filter[gt]=20&filter[after]=2024-06-01
```

### Update a Specific Record

```
PUT /extension_data/macro-tracker
{
  "id": "tracked_123",
  "value": { "protein": 35, "carbs": 45, "fat": 12 }
}
```

### Delete Records

```
DELETE /extension_data/macro-tracker?key=nutrition&tracked_id=tracked_123
```

### Advanced: Filter by a Value Attribute (JSON Path)

```
GET /extension_data/macro-tracker?key=nutrition&filter[on]=value->>'protein'&filter[gt]=20
```
*Returns all records where the `protein` attribute in the value is greater than 20.*

### Advanced: Aggregate by a Value Attribute (JSON Path)

```
GET /extension_data/macro-tracker?key=nutrition&aggregate[type]=sum&aggregate[on]=value->>'protein'
```
*Returns the sum of the `protein` attribute across all records.*

### Advanced: Group By a Value Attribute (JSON Path)

```
GET /extension_data/macro-tracker?key=nutrition&group_by=value->>'protein'&aggregate=count
```
*Groups records by the `protein` value and counts the number in each group.*

### Advanced: Order By a Value Attribute (JSON Path)

```
GET /extension_data/macro-tracker?key=nutrition&order[by]=value->>'protein'&order[dir]=DESC
```
*Orders the results by the `protein` attribute in descending order.*

### Advanced: Combined Example (Filter, Group, Aggregate, and Order by Value Attribute)

```
GET /extension_data/macro-tracker?key=nutrition&filter[on]=value->>'carbs'&filter[gt]=30&group_by=value->>'protein'&aggregate[type]=avg&aggregate[on]=value->>'fat'&order[by]=value->>'protein'&order[dir]=ASC
```
*Filters records where `carbs` > 30, groups by `protein`, calculates the average `fat` in each group, and orders groups by `protein` ascending.*

---

## Notes
- All endpoints return `{ "success": true, ... }` on success.
- Errors will return `{ "success": false, "message": "..." }`.
- For more advanced queries, use the `filter`, `aggregate`, and `group_by` parameters as described above.
- The API supports JSON path queries for nested object values.
- Member information is included when grouping by `subscriber_id` or when no aggregation is used. 