# Role Matrix API Documentation

This document describes the Role Matrix API endpoints designed specifically for the React Role Access component. The API provides a matrix-based interface where modules are rows and roles are columns.

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

### 1. Get Role Matrix

**GET** `/access/role-matrix/{organization_id}`

Get the complete role access matrix for an organization. Returns modules as rows and roles as columns with permission status.

**Parameters:**
- `organization_id` (path): Organization ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "section": "Dashboard",
      "permissions": {
        "admin": "access",
        "editor": "access",
        "viewer": "access"
      }
    },
    {
      "section": "Teams",
      "permissions": {
        "admin": "access",
        "editor": "access",
        "viewer": "none"
      }
    },
    {
      "section": "Settings",
      "permissions": {
        "admin": "always",
        "editor": "none",
        "viewer": "none"
      }
    }
  ],
  "organization_id": 50
}
```

**Permission Status Values:**
- `"access"`: User has access to this module
- `"none"`: User does not have access to this module
- `"always"`: User always has access (cannot be changed)

### 2. Update Role Matrix (Bulk)

**PUT** `/access/role-matrix/{organization_id}`

Update the entire role access matrix for an organization. Only admins can perform this operation.

**Parameters:**
- `organization_id` (path): Organization ID

**Request Body:**
```json
{
  "matrix": [
    {
      "section": "Dashboard",
      "permissions": {
        "admin": "access",
        "editor": "access",
        "viewer": "access"
      }
    },
    {
      "section": "Teams",
      "permissions": {
        "admin": "access",
        "editor": "access",
        "viewer": "none"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role access matrix updated successfully",
  "organization_id": 50
}
```

### 3. Update Single Permission

**PATCH** `/access/role-matrix/{organization_id}/permission`

Update a single permission in the role matrix. This is ideal for individual checkbox toggles. Only admins can perform this operation.

**Parameters:**
- `organization_id` (path): Organization ID

**Request Body:**
```json
{
  "module": "Teams",
  "role": "editor",
  "has_access": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permission updated for editor on Teams",
  "module": "Teams",
  "role": "editor",
  "has_access": true
}
```

### 4. Get Available Roles

**GET** `/access/role-matrix/{organization_id}/roles`

Get all available roles in the organization.

**Parameters:**
- `organization_id` (path): Organization ID

**Response:**
```json
{
  "success": true,
  "roles": ["admin", "editor", "viewer"],
  "organization_id": 50
}
```

### 5. Get Available Modules

**GET** `/access/role-matrix/modules`

Get all available modules in the system.

**Response:**
```json
{
  "success": true,
  "modules": ["Dashboard", "Teams", "Insights", "Settings"]
}
```

## React Component Integration

### Initial Load
```javascript
// Load role matrix on component mount
const loadRoleMatrix = async () => {
  try {
    const response = await api.getRoleMatrix();
    if (response.success) {
      setPermissions(response.data);
    }
  } catch (error) {
    console.error('Error loading role matrix:', error);
  }
};
```

### Individual Permission Toggle
```javascript
// Toggle individual permission (checkbox click)
const togglePermission = async (sectionIndex, role) => {
  const currentRow = permissions[sectionIndex];
  const current = currentRow.permissions[role];
  
  if (current === "always") return; // can't change "Always Access"
  
  const newVal = current === "access" ? "none" : "access";
  const hasAccess = newVal === "access";

  try {
    // Update local state immediately for better UX
    setPermissions(prev => /* update local state */);
    
    // Update on server
    await api.updateSinglePermission(currentRow.section, role, hasAccess);
  } catch (error) {
    // Revert on error
    setPermissions(prev => /* revert to original state */);
  }
};
```

### Bulk Save
```javascript
// Save all changes at once
const saveAllChanges = async () => {
  try {
    const response = await api.updateRoleMatrix(permissions);
    if (response.success) {
      setShowSuccess(true);
    }
  } catch (error) {
    console.error('Error saving changes:', error);
  }
};
```

## cURL Examples

### Get Role Matrix
```bash
curl -X GET \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  "http://127.0.0.1:8000/access/role-matrix/50"
```

### Update Single Permission
```bash
curl -X PATCH \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "module": "Teams",
    "role": "editor",
    "has_access": true
  }' \
  "http://127.0.0.1:8000/access/role-matrix/50/permission"
```

### Update Entire Matrix
```bash
curl -X PUT \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "matrix": [
      {
        "section": "Dashboard",
        "permissions": {
          "admin": "access",
          "editor": "access",
          "viewer": "access"
        }
      }
    ]
  }' \
  "http://127.0.0.1:8000/access/role-matrix/50"
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
  "detail": "Only admins can update role permissions"
}
```

## Database Schema

The API uses the following database tables:

### `permissions` table
- `id`: Primary key
- `code`: Permission code (e.g., "dashboard.view")
- `module`: Module name (e.g., "Dashboard")

### `role_permissions` table
- `id`: Primary key
- `role`: Role name (e.g., "admin", "editor", "viewer")
- `permission_id`: Foreign key to permissions table
- `has_access`: Boolean indicating if role has access

### `users` table
- `id`: Primary key
- `organization_id`: Foreign key to organizations table
- `role`: User's role
- `status`: User status (active/inactive)

## Permission Logic

1. **Module-based permissions**: Each module can have multiple permission codes
2. **Role-based access**: Users inherit permissions from their role
3. **Always Access**: Some permissions (like Settings for admin) cannot be changed
4. **Organization scoping**: All permissions are scoped to specific organizations

## Security Features

- **JWT Authentication**: All endpoints require valid JWT token
- **Organization Scoping**: Users can only access their organization's data
- **Role-based Authorization**: Only admins can update permissions
- **Input Validation**: All request data is validated
- **SQL Injection Protection**: All queries use parameterized statements

## Testing

Use the provided cURL script to test all endpoints:

```bash
chmod +x curl_role_matrix_api.sh
./curl_role_matrix_api.sh
```

Make sure to replace `<YOUR_TOKEN>` with your actual JWT token and update the organization ID as needed.

## React Component Structure

The API response structure matches your React component's `accessMatrix` structure:

```javascript
const accessMatrix = [
  {
    section: "Dashboard",           // Module name
    permissions: {                  // Role permissions
      admin: "access",             // Permission status
      editor: "access",
      viewer: "access"
    }
  }
];
```

This makes integration seamless with your existing React component.

