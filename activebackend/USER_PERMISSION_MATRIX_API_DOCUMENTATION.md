# User Permission Matrix API Documentation

This document describes the User Permission Matrix API endpoints that show permissions as rows and users as columns. This is perfect for managing individual user permissions across all available permissions.

## Base URL
```
http://127.0.0.1:8000
```

## Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## API Endpoints

### 1. Get User Permission Matrix

**GET** `/access/user-permission-matrix/{organization_id}`

Get the complete user permission matrix for an organization. Returns permissions as rows and users as columns with access status.

**Parameters:**
- `organization_id` (path): Organization ID

**Response:**
```json
{
  "success": true,
  "data": {
    "matrix": [
      {
        "id": 1,
        "code": "dashboard.view",
        "module": "Dashboard",
        "users": {
          "121": {
            "user_id": 121,
            "user_name": "John Doe",
            "user_email": "john@example.com",
            "user_role": "admin",
            "has_access": true,
            "permission_source": "role_based"
          },
          "122": {
            "user_id": 122,
            "user_name": "Jane Smith",
            "user_email": "jane@example.com",
            "user_role": "editor",
            "has_access": false,
            "permission_source": "role_based"
          }
        }
      }
    ],
    "users": [
      {
        "id": 121,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "admin",
        "status": "active",
        "department": "Administration"
      }
    ],
    "permissions": [
      {
        "id": 1,
        "code": "dashboard.view",
        "module": "Dashboard"
      }
    ],
    "organization_id": 50
  },
  "organization_id": 50
}
```

**Permission Source Values:**
- `"user_specific"`: Permission set specifically for this user
- `"role_based"`: Permission inherited from user's role

### 2. Get Organization Users

**GET** `/access/user-permission-matrix/{organization_id}/users`

Get all users in the organization.

**Parameters:**
- `organization_id` (path): Organization ID

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 121,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "status": "active",
      "department": "Administration"
    },
    {
      "id": 122,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "editor",
      "status": "active",
      "department": "Development"
    }
  ],
  "organization_id": 50
}
```

### 3. Update User Permission

**PATCH** `/access/user-permission-matrix/{organization_id}/permission`

Update a single user permission. Only admins and configurators can perform this operation.

**Parameters:**
- `organization_id` (path): Organization ID

**Request Body:**
```json
{
  "user_id": 121,
  "permission_id": 1,
  "has_access": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission updated for user 121",
  "user_id": 121,
  "permission_id": 1,
  "has_access": true
}
```

## Database Schema

The API uses the following database tables:

### `permissions` table
- `id`: Primary key
- `code`: Permission code (e.g., "dashboard.view")
- `module`: Module name (e.g., "Dashboard")

### `users` table
- `id`: Primary key
- `organization_id`: Foreign key to organizations table
- `name`: User's full name
- `email`: User's email
- `role`: User's role (admin, editor, viewer, etc.)
- `status`: User status (active/inactive)
- `department`: User's department

### `role_permissions` table
- `id`: Primary key
- `role`: Role name
- `permission_id`: Foreign key to permissions table
- `has_access`: Boolean indicating if role has access

### `user_permissions` table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `permission_id`: Foreign key to permissions table
- `has_access`: Boolean indicating if user has access
- `organization_id`: Organization ID for scoping

## Permission Logic

1. **User-specific permissions take precedence**: If a user has a specific permission set in `user_permissions`, that value is used.
2. **Role-based permissions as fallback**: If no user-specific permission exists, the role-based permission from `role_permissions` is used.
3. **Organization scoping**: All permissions are scoped to specific organizations.

## React Component Integration

### Initial Load
```javascript
// Load user permission matrix on component mount
const loadData = async () => {
  try {
    const response = await api.getUserPermissionMatrix();
    if (response.success) {
      setMatrix(response.data.matrix);
      setUsers(response.data.users);
      setPermissions(response.data.permissions);
    }
  } catch (error) {
    console.error('Error loading permission matrix:', error);
  }
};
```

### Individual Permission Toggle
```javascript
// Toggle individual permission (checkbox click)
const togglePermission = async (permissionId, userId, currentAccess) => {
  const newAccess = !currentAccess;

  try {
    // Update local state immediately for better UX
    setMatrix(prev => /* update local state */);
    
    // Update on server
    await api.updateUserPermission(userId, permissionId, newAccess);
  } catch (error) {
    // Revert on error
    setMatrix(prev => /* revert to original state */);
  }
};
```

## cURL Examples

### Get User Permission Matrix
```bash
curl -X GET \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  "http://127.0.0.1:8000/access/user-permission-matrix/50"
```

### Get Organization Users
```bash
curl -X GET \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  "http://127.0.0.1:8000/access/user-permission-matrix/50/users"
```

### Update User Permission
```bash
curl -X PATCH \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 121,
    "permission_id": 1,
    "has_access": true
  }' \
  "http://127.0.0.1:8000/access/user-permission-matrix/50/permission"
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (missing required fields)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions or wrong organization)
- `500`: Internal Server Error

Error responses include a descriptive message:
```json
{
  "detail": "Insufficient permissions"
}
```

## Security Features

- **JWT Authentication**: All endpoints require valid JWT token
- **Organization Scoping**: Users can only access their organization's data
- **Role-based Authorization**: Only admins and configurators can update permissions
- **Input Validation**: All request data is validated
- **SQL Injection Protection**: All queries use parameterized statements

## Testing

Use the provided cURL script to test all endpoints:

```bash
chmod +x curl_user_permission_matrix.sh
./curl_user_permission_matrix.sh
```

Make sure to replace `<YOUR_TOKEN>` with your actual JWT token and update the organization ID as needed.

## Matrix Structure

The matrix response structure is designed for easy rendering in a table:

```javascript
// Matrix structure
const matrix = [
  {
    id: 1,                    // Permission ID
    code: "dashboard.view",   // Permission code
    module: "Dashboard",      // Module name
    users: {                  // User access data
      "121": {               // User ID as string key
        user_id: 121,
        user_name: "John Doe",
        user_email: "john@example.com",
        user_role: "admin",
        has_access: true,
        permission_source: "role_based"
      }
    }
  }
];
```

## Use Cases

1. **User Permission Management**: View and modify individual user permissions
2. **Permission Auditing**: See which users have access to specific permissions
3. **Role vs User Permissions**: Distinguish between role-based and user-specific permissions
4. **Bulk Permission Updates**: Update multiple user permissions efficiently
5. **Permission Reporting**: Generate reports on user access patterns

## Performance Considerations

- The matrix can be large for organizations with many users and permissions
- Consider pagination for very large datasets
- User-specific permissions are cached in the response for better performance
- Database queries are optimized with proper indexing

## React Component Features

The provided React component includes:

- **Responsive Table**: Horizontal scrolling for many users
- **Real-time Updates**: Immediate UI feedback with server sync
- **Permission Source Indicators**: Visual indicators for user-specific vs role-based permissions
- **Error Handling**: Graceful error handling with retry options
- **Loading States**: Loading indicators during data fetch
- **Success Feedback**: Success messages for user actions
- **Summary Statistics**: Overview of permissions, users, and matrix size

