# Forms API

Base path: `/api/forms`

## Public Forms

### List Active Forms

```http
GET /api/forms/public
```

No authentication required. Returns only active forms.

### Response

```json
{
  "success": true,
  "forms": [
    {
      "id": "uuid",
      "name": "Hardware Request",
      "category": "Hardware",
      "description": "Request new hardware equipment",
      "isActive": true,
      "fields": [
        {
          "id": "uuid",
          "label": "Equipment Type",
          "key": "equipmentType",
          "type": "select",
          "required": true,
          "options": ["Laptop", "Monitor", "Keyboard", "Mouse"]
        },
        {
          "id": "uuid",
          "label": "Justification",
          "key": "justification",
          "type": "textarea",
          "required": true
        }
      ]
    }
  ]
}
```

## Staff/Admin Forms

### List Forms

```http
GET /api/forms
```

### Create Form

```http
POST /api/forms
```

```json
{
  "name": "Hardware Request",
  "category": "Hardware",
  "description": "Request new hardware equipment",
  "isActive": true,
  "fields": [
    {
      "label": "Equipment Type",
      "key": "equipmentType",
      "type": "select",
      "required": true,
      "options": ["Laptop", "Monitor", "Keyboard", "Mouse"],
      "sortOrder": 0
    },
    {
      "label": "Justification",
      "key": "justification",
      "type": "textarea",
      "required": true,
      "sortOrder": 1
    }
  ]
}
```

### Update Form

```http
PUT /api/forms/:id
```

### Delete Form

```http
DELETE /api/forms/:id
```

## Form Field Types

| Type | HTML Input | Validation |
|------|-----------|------------|
| `text` | `<input type="text">` | Required/optional |
| `textarea` | `<textarea>` | Required/optional |
| `email` | `<input type="email">` | Email format |
| `select` | `<select>` | Must match one of `options` |
| `multiselect` | Multiple checkboxes | Must match `options` |
| `date` | `<input type="date">` | Date format |
| `number` | `<input type="number">` | Numeric |
| `file` | `<input type="file">` | File type/size limits |

## Conditional Fields

Fields can have `conditions` to control visibility:

```json
{
  "conditions": {
    "field": "equipmentType",
    "operator": "equals",
    "value": "Laptop",
    "showFields": ["ram", "storage"]
  }
}
```
