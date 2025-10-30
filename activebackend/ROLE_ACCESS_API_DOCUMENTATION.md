# Role Access API Documentation

This document describes the Role Access API endpoints that allow you to manage role-based permissions and user access control in your organization.

## Base URL
```
http://127.0.0.1:8000
```

## Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Database Schema

The role access system uses the following database tables:

### `permissions` table
- `id`: Primary key
- `code`: Permission code (e.g., "dashboard.view", "teams.view")
- `module`: Module name (e.g., "Dashboard", "Teams")

### `role_permissions` table
- `id`: Primary key
- `role`: Role name (e.g., "admin", "viewer", "editor", "agent")
- `permission_id`: Foreign key to permissions table
- `has_access`: Boolean indicating if role has access

### `user_permissions` table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `permission_id`: Foreign key to permissions table
- `has_access`: Boolean indicating if user has access
- `organization_id`: Organization ID for scoping

### `users` table
- `id`: Primary key
- `organization_id`: Foreign key to organizations table
- `role`: User's role
- `name`: User's full name
- `email`: User's email
- `status`: User status (active/inactive)

## API Endpoints

### 1. Get Organization Role Access

**GET** `/access/role-access/organization/{organization_id}`

Get role access configuration for all users in an organization. Shows the final access permissions for each user based on role and user-specific permissions.

**Parameters:**
- `organization_id` (path): Organization ID

**Response:**
```json
[
  {
    "user_id": 121,
    "organization_id": 50,
    "role": "admin",
    "module": "Dashboard",
    "code": "dashboard.view",
    "final_access": true
  },
  {
    "user_id": 121,
    "organization_id": 50,
    "role": "admin",
    "module": "Teams",
    "code": "teams.view",
    "final_access": true
  }
]
```

### 2. Get Role Permissions

**GET** `/access/role-access/role/{role}`

Get all permissions for a specific role.

**Parameters:**
- `role` (path): Role name (e.g., "admin", "viewer")

**Response:**
```json
[
  {
    "id": 1,
    "role": "admin",
    "permission_id": 1,
    "has_access": true,
    "module": "Dashboard",
    "code": "dashboard.view"
  }
]
```

### 3. Get User Permissions

**GET** `/access/role-access/user/{user_id}`

Get all permissions for a specific user (including role-based and user-specific).

**Parameters:**
- `user_id` (path): User ID

**Response:**
```json
[
  {
    "user_id": 121,
    "organization_id": 50,
    "role": "admin",
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "module": "Dashboard",
    "code": "dashboard.view",
    "final_access": true,
    "permission_source": "role_based"
  }
]
```

### 4. Update Role Permissions

**PUT** `/access/role-access/role/{role}`

Update permissions for a specific role. Only admins can update role permissions.

**Parameters:**
- `role` (path): Role name

**Request Body:**
```json
{
  "role": "viewer",
  "permissions": [
    {
      "permission_id": 1,
      "has_access": true
    },
    {
      "permission_id": 2,
      "has_access": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully updated permissions for role viewer"
}
```

### 5. Update User Permissions

**PUT** `/access/role-access/user/{user_id}`

Update user-specific permissions. Only admins and configurators can update user permissions.

**Parameters:**
- `user_id` (path): User ID

**Request Body:**
```json
{
  "user_id": 121,
  "permissions": [
    {
      "permission_id": 1,
      "has_access": true
    },
    {
      "permission_id": 2,
      "has_access": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully updated permissions for user 121"
}
```

### 6. Get All Permissions

**GET** `/access/role-access/permissions`

Get all available permissions in the system.

**Response:**
```json
[
  {
    "id": 1,
    "code": "dashboard.view",
    "module": "Dashboard"
  },
  {
    "id": 2,
    "code": "teams.view",
    "module": "Teams"
  }
]
```

### 7. Get Organization Roles

**GET** `/access/role-access/roles/{organization_id}`

Get all unique roles in an organization.

**Parameters:**
- `organization_id` (path): Organization ID

**Response:**
```json
["admin", "viewer", "editor", "agent"]
```

### 8. Get Role Access Summary

**GET** `/access/role-access/summary/{organization_id}`

Get a summary of role access configuration for an organization. Groups users by role and shows their permissions.

**Parameters:**
- `organization_id` (path): Organization ID

**Response:**
```json
{
  "success": true,
  "organization_id": 50,
  "role_summary": [
    {
      "role": "admin",
      "users": [
        {
          "user_id": 121,
          "user_name": "John Doe",
          "user_email": "john@example.com"
        }
      ],
      "permissions": {
        "Dashboard_dashboard.view": {
          "module": "Dashboard",
          "code": "dashboard.view",
          "has_access": true
        }
      }
    }
  ]
}
```

## Permission Logic

The system uses the following logic to determine final access:

1. **User-specific permissions take precedence**: If a user has a specific permission set in `user_permissions`, that value is used.
2. **Role-based permissions as fallback**: If no user-specific permission exists, the role-based permission from `role_permissions` is used.
3. **COALESCE function**: The SQL query uses `COALESCE(up.has_access, rp.has_access)` to implement this logic.

## Role Hierarchy

The system supports the following roles with different permission levels:

- **Admin**: Full access to all modules and can manage role permissions
- **Configurator**: Can manage user permissions and has access to most modules
- **Editor**: Limited access to specific modules
- **Agent**: Very limited access to basic modules
- **Viewer**: Read-only access to specific modules

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Internal server error

Error responses include a descriptive message:
```json
{
  "detail": "Missing or invalid token"
}
```

## Usage Examples

### Example 1: Get all users and their permissions in an organization

```bash
curl -H "Authorization: Bearer <token>" \
     "http://127.0.0.1:8000/access/role-access/organization/50"
```

### Example 2: Update viewer role permissions

```bash
curl -X PUT \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "role": "viewer",
       "permissions": [
         {"permission_id": 1, "has_access": true},
         {"permission_id": 2, "has_access": false}
       ]
     }' \
     "http://127.0.0.1:8000/access/role-access/role/viewer"
```

### Example 3: Get role access summary

```bash
curl -H "Authorization: Bearer <token>" \
     "http://127.0.0.1:8000/access/role-access/summary/50"
```

## Testing

Run the test script to verify the API functionality:

```bash
python test_role_access.py
```

Make sure the FastAPI server is running:

```bash
python -m uvicorn app.main:app --reload
```

## Security Notes

1. All endpoints require authentication
2. Organization-scoped access control prevents cross-organization data access
3. Role-based authorization ensures only appropriate users can modify permissions
4. User-specific permissions allow fine-grained access control
5. All database queries use parameterized statements to prevent SQL injection


