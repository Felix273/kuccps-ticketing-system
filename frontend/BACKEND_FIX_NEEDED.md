# Backend Issues That Need Fixing

## Problem 1: departmentId Not Being Saved

**Current Backend Behavior:**
- When creating user with `departmentId: "5ac780c5-2495-4fa9-8f5d-a697c502dbc9"`
- The user is created but `departmentId` remains `null`

**What Backend Needs:**
```javascript
// In your user creation endpoint (POST /api/users)
// Make sure you're accepting departmentId from request body

app.post('/api/users', async (req, res) => {
  const { name, email, username, password, role, departmentId } = req.body;
  
  const user = await prisma.user.create({
    data: {
      name,
      email,
      username,
      password: await bcrypt.hash(password, 10),
      role,
      departmentId: departmentId || null  // ← ADD THIS
    }
  });
  
  res.json({ success: true, user });
});
```

## Problem 2: Department Field is String, Not Relationship

**Current Response:**
```json
{
  "departmentId": null,
  "department": "ICT"  // ← This is just a string!
}
```

**What It Should Be:**
```json
{
  "departmentId": "5ac780c5-2495-4fa9-8f5d-a697c502dbc9",
  "department": {
    "id": "5ac780c5-2495-4fa9-8f5d-a697c502dbc9",
    "name": "ICT",
    "code": "ICT"
  }
}
```

**Backend Fix Needed:**
```javascript
// In your GET /api/users endpoint
// Include the department relationship using Prisma include

app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      department: true,  // ← ADD THIS to include department data
      _count: {
        select: {
          assignedTickets: true
        }
      }
    }
  });
  
  res.json({ success: true, users });
});
```

## Problem 3: Update User Endpoint

Make sure your PUT /api/users/:id also accepts departmentId:
```javascript
app.put('/api/users/:id', async (req, res) => {
  const { name, email, role, departmentId, password } = req.body;
  
  const updateData = {
    name,
    email,
    role,
    departmentId: departmentId || null  // ← ADD THIS
  };
  
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }
  
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      department: true  // ← Include department in response
    }
  });
  
  res.json({ success: true, user });
});
```

## Testing After Backend Fix

Once you fix the backend, test with:
```bash
# Create user with department
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@kuccps.ac.ke",
    "username": "testuser",
    "password": "password123",
    "role": "staff",
    "departmentId": "5ac780c5-2495-4fa9-8f5d-a697c502dbc9"
  }'

# Check if user has department
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/users | \
  jq '.users[] | select(.username=="testuser") | {name, departmentId, department}'
```

Expected result:
```json
{
  "name": "Test User",
  "departmentId": "5ac780c5-2495-4fa9-8f5d-a697c502dbc9",
  "department": {
    "id": "5ac780c5-2495-4fa9-8f5d-a697c502dbc9",
    "name": "ICT",
    "code": "ICT"
  }
}
```
