# Knowledge Base API

Base path: `/api/knowledge-base`

## Public Articles

### List Public Articles

```http
GET /api/knowledge-base/public/articles
```

### Response

```json
{
  "success": true,
  "articles": [
    {
      "id": "uuid",
      "title": "How to reset your password",
      "slug": "how-to-reset-password",
      "excerpt": "Step-by-step guide...",
      "category": "Account",
      "status": "published",
      "views": 142,
      "helpful": 120,
      "notHelpful": 8,
      "createdAt": "2026-08-14T09:00:00.000Z"
    }
  ]
}
```

### Get Public Article

```http
GET /api/knowledge-base/public/articles/:idOrSlug
```

## Staff/Admin Articles

### List Articles

```http
GET /api/knowledge-base/articles
```

### Get Article

```http
GET /api/knowledge-base/articles/:idOrSlug
```

### Create Article

```http
POST /api/knowledge-base/articles
```

```json
{
  "title": "How to reset your password",
  "slug": "how-to-reset-password",
  "excerpt": "Step-by-step guide...",
  "content": "<p>Full article content...</p>",
  "category": "Account",
  "tags": "password,reset,account",
  "status": "published"
}
```

### Update Article

```http
PUT /api/knowledge-base/articles/:id
```

### Delete Article

```http
DELETE /api/knowledge-base/articles/:id
```

### Rate Article

```http
POST /api/knowledge-base/articles/:id/rate
```

```json
{
  "helpful": true
}
```

### Upload Material

```http
POST /api/knowledge-base/materials/upload
Content-Type: multipart/form-data
```

### Insights

```http
GET /api/knowledge-base/insights
```

```json
{
  "success": true,
  "insights": {
    "totalArticles": 25,
    "publishedArticles": 20,
    "totalViews": 1520,
    "topArticles": [
      { "id": "uuid", "title": "...", "views": 142 }
    ]
  }
}
```

### Suggestions

```http
GET /api/knowledge-base/suggestions/tickets/:ticketId
```

Returns KB articles suggested for a specific ticket based on category and content.
