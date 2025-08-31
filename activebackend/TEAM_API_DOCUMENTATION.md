# Team Management API Documentation

This document describes the new team management API endpoints that allow you to assign users to teams, view team members, and remove users from teams.

## Base URL
```
http://127.0.0.1:9900
```

## Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### 1. Assign Users to Team

**POST** `/team/assign_teams`

Assigns multiple users to a team by their email addresses.

**Request Body:**
```json
{
  "team_id": 13,
  "user_emails": ["huzaifa@SWISSBORING.com", "mehardil@SWISSBORING.com"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully assigned 2 users to team",
  "assigned_users": [
    {
      "id": 1,
      "email": "huzaifa@SWISSBORING.com"
    },
    {
      "id": 2,
      "email": "mehardil@SWISSBORING.com"
    }
  ],
  "team_id": 13
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Team not found"
}
```

### 2. Get Team Members

**GET** `/team/team_members/{team_id}`

Retrieves all users assigned to a specific team.

**Response:**
```json
{
  "success": true,
  "message": "Found 2 team members",
  "team_id": 13,
  "members": [
    {
      "id": 1,
      "email": "huzaifa@SWISSBORING.com",
      "first_name": "Huzaifa",
      "last_name": "Khan",
      "role": "user"
    },
    {
      "id": 2,
      "email": "mehardil@SWISSBORING.com",
      "first_name": "Mehar",
      "last_name": "Dil",
      "role": "admin"
    }
  ]
}
```

### 3. Remove Users from Team

**DELETE** `/team/remove_users_from_team`

Removes specific users from a team by their email addresses.

**Request Body:**
```json
{
  "team_id": 13,
  "user_emails": ["mehardil@SWISSBORING.com"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully removed 1 users from team",
  "removed_count": 1,
  "team_id": 13
}
```

## Database Schema

The API uses the following database tables:

### `user_groups` table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `group_id`: Foreign key to groups table (teams)
- `organization_id`: Foreign key to organizations table

### `groups` table
- `id`: Primary key
- `name`: Team name
- `description`: Team description
- `organization_id`: Foreign key to organizations table

### `users` table
- `id`: Primary key
- `email`: User email
- `first_name`: User first name
- `last_name`: User last name
- `role`: User role
- `organization_id`: Foreign key to organizations table

## Usage Examples

### Frontend JavaScript Example
```javascript
const payload = {
  team_id: 13,
  user_emails: ["huzaifa@SWISSBORING.com", "mehardil@SWISSBORING.com"]
};

const response = await fetch("http://127.0.0.1:9900/team/assign_teams", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});

const result = await response.json();
console.log(result);
```

### Python Example
```python
import requests

url = "http://127.0.0.1:9900/team/assign_teams"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}
payload = {
    "team_id": 13,
    "user_emails": ["huzaifa@SWISSBORING.com", "mehardil@SWISSBORING.com"]
}

response = requests.post(url, headers=headers, json=payload)
result = response.json()
print(result)
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- **400 Bad Request**: Invalid input data or business logic errors
- **401 Unauthorized**: Missing or invalid authentication token
- **500 Internal Server Error**: Server-side errors

## Security Features

1. **Authentication Required**: All endpoints require a valid Bearer token
2. **Organization Isolation**: Users can only be assigned to teams within their organization
3. **Input Validation**: All input parameters are validated before processing
4. **SQL Injection Protection**: Uses parameterized queries to prevent SQL injection

## Notes

- Users must exist in the system before they can be assigned to teams
- Users can only be assigned to teams within their organization
- Duplicate assignments are automatically filtered out
- The API handles both single and bulk user assignments
- All operations are transactional and will rollback on errors



