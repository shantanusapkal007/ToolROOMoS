# API Blueprint
*ToolRoomOS – Manufacturing Operating System*
*Version 1.0*

## Purpose
The ToolRoomOS API is the communication layer between the Manufacturing Operating System and every client application. 

Unlike traditional ERP APIs that expose database tables, ToolRoomOS exposes manufacturing workflows. Every API represents a real business activity occurring inside the factory. 

The API is designed around the principle: **Projects own workflows. Workflows own documents. Documents create business events. Business events update the factory.**

---

## 1. API Design Principles
1. **Project First:** Every manufacturing activity belongs to a Project. All operational endpoints are scoped under a Project (`/api/v1/projects/{projectId}/...`). No isolated operational APIs.
2. **Workflow First:** The API follows the physical manufacturing process. The API never allows skipping workflow stages unless explicitly authorized.
3. **Business Actions, Not CRUD:** The API represents business actions. Instead of `POST /inventory`, use `POST /projects/{projectId}/goods-receipts`. Every request performs a business operation.
4. **One Source of Truth:** Every request references existing information. The client never sends duplicated business data.
5. **Event Driven:** Every successful API call creates a business event.
6. **Idempotent Transactions:** Critical operations must never execute twice.
7. **Standardized Responses:** Every endpoint returns the same structure.

---

## 2. API Versioning & Naming Rules
- **Versioning:** All APIs are versioned in the URL (`/api/v1/`). Future versions (`/api/v2/`) will maintain backward compatibility.
- **Naming Rules:** 
  - Resources use plural nouns (`/projects`, `/customers`, `/materials`).
  - Use kebab-case for multi-word endpoints (`/machine-shop-reports`, `/material-requirements`). Never use camelCase, PascalCase, or snake_case for routes.

---

## 3. HTTP Status & Error Standards
### HTTP Status Codes
- `200 OK`
- `201 Created`
- `202 Accepted` (For long-running operations)
- `204 No Content`
- `400 Validation Error`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`
- `422 Business Rule Violation`
- `500 Internal Server Error`

### Validation Errors
Instead of returning a generic "Validation Failed", the API returns specific fields and rules to improve UX:
```json
{
  "status": "error",
  "errors": [
    {
      "field": "receivedQuantity",
      "rule": "Cannot exceed pending quantity",
      "expected": 500,
      "actual": 700
    }
  ]
}
```

---

## 4. Query Standards
### Pagination
Every list endpoint requires pagination parameters (`?page=1&limit=20&sort=createdAt&order=desc&search=Query`).
Returns:
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
      "page": 1,
      "limit": 20,
      "total": 134,
      "totalPages": 7
  }
}
```

### Filtering
Every collection endpoint supports specific filters natively.
`GET /projects?status=production&customer=ABC&priority=High`

---

## 5. Technical Requirements
### File Upload Standard (Document Driven)
`POST /projects/{id}/documents`
Supports: PDF, Excel, Word, Image, DXF, DWG, STEP.
Every upload returns: `Document ID`, `Version`, `Revision`, `Checksum`, `Uploaded By`, `Uploaded At`.

### Business Events Returned
Responses not only confirm creation but tell the frontend what backend events fired.
```json
{
   "status": "success",
   "data": { ... },
   "events": [
      "Inventory Updated",
      "Material Cost Updated",
      "Project Timeline Updated"
   ]
}
```

### Workflow State Validation
The backend rejects invalid stage transitions explicitly.
*Example:* If Current Stage = `Engineering`, the API will accept `POST /projects/{id}/drawings` but will throw `422 Business Rule Violation` for `POST /projects/{id}/purchase-orders`.

### Long Running Operations
Asynchronous processing for heavy tasks (e.g., parsing massive STEP files or bulk Excel uploads). Returns `202 Accepted` -> `Processing` -> `Completed` -> `Failed`. The frontend can poll a status endpoint.

### Idempotency
Critical operations require an `Idempotency-Key` header:
```http
POST /projects/{id}/goods-receipts
Idempotency-Key: 8d2d9f1b-5e6f-4a3b-9c8d-7e6f5a4b3c2d
```
If retried, the server returns the original result instead of creating duplicate records.

---

## 6. The API Lifecycle (Manufacturing Workflow)
Instead of documenting APIs by database tables, we document them by the Manufacturing Journey.

```text
Customer PO
        │
        ▼
POST /projects
        │
        ▼
POST /projects/{id}/documents
        │
        ▼
POST /projects/{id}/drawings
        │
        ▼
POST /projects/{id}/bom
        │
        ▼
PUT /projects/{id}/bom/approve
        │
        ▼
POST /projects/{id}/purchase-orders
        │
        ▼
POST /projects/{id}/goods-receipts
        │
        ▼
POST /projects/{id}/material-issues
        │
        ▼
POST /projects/{id}/machine-shop-reports
        │
        ▼
POST /projects/{id}/inspections
        │
        ▼
POST /projects/{id}/dispatches
        │
        ▼
POST /projects/{id}/invoices
        │
        ▼
GET /projects/{id}/profitability
```
