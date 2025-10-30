import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from service import login_service, role_matrix_service


router = APIRouter()
@router.get("/role-matrix/org")
async def get_role_matrix(request: Request):
    """
    OPTIMIZED: Get role access matrix for React component
    Returns only essential data: modules and permissions (no debug info)
    """
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    try:
        token_payload = login_service.decode_token(token.split(" ")[1])
        if not token_payload.get("org_id"):
            raise HTTPException(status_code=403, detail="Access denied to this organization")
        organization_id = token_payload.get("org_id")
        matrix = await role_matrix_service.get_role_matrix_optimized(organization_id)
        return {
            "success": True,
            "data": matrix
        }
    except HTTPException as e:
        # Return structured error for frontend handling
        return JSONResponse(
            status_code=e.status_code,
            content={
                "success": False,
                "message": e.detail,
                "status_code": e.status_code
            },
        )
    except Exception as e:
        logging.error(f"Error getting role matrix: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(e),
                "status_code": 500
            },
        )






@router.patch("/role-matrix/permission")
async def update_single_permission(request_data: dict, request: Request):
    """
    OPTIMIZED: Update a single permission in the role matrix
    Only admins can update permissions
    """
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    try:
        token_payload = login_service.decode_token(token.split(" ")[1])
        if token_payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can update permissions")
        if not token_payload.get("org_id"):
            raise HTTPException(status_code=403, detail="Access denied to this organization")
        organization_id = token_payload.get("org_id")
        required_fields = ["module", "role", "has_access"]
        for field in required_fields:
            if field not in request_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        module = request_data["module"]
        role = request_data["role"]
        has_access = request_data["has_access"]
        success = await role_matrix_service.update_permission_by_module_role_optimized(module, role, has_access, organization_id)
        if success:
            return {
                "success": True,
                "updated": True
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update permission")
    except HTTPException as e:
        # Return structured error for frontend handling
        return JSONResponse(
            status_code=e.status_code,
            content={
                "success": False,
                "message": e.detail,
                "status_code": e.status_code
            },
        )
    except Exception as e:
        logging.error(f"Error updating single permission: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": str(e),
                "status_code": 500
            },
        )









@router.put("/role-matrix/{organization_id}")
async def update_role_matrix(organization_id: int, request_data: dict, request: Request):
    """
    Update role access matrix
    Only admins can update role permissions
    
    IMPORTANT: This is the PUT endpoint for full matrix updates.
    For single permission updates, use PATCH /access/role-matrix/{organization_id}/permission
    """
    logging.info(f"PUT /role-matrix/{organization_id} called with data: {request_data}")
    
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    try:
        token_payload = login_service.decode_token(token.split(" ")[1])
        if token_payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can update role permissions")
        
        if token_payload.get("org_id") != organization_id:
            raise HTTPException(status_code=403, detail="Access denied to this organization")
        
        logging.info(f"Updating role matrix for organization {organization_id} by user {token_payload.get('user_id')}")
        
        # Validate request data
        if "matrix" not in request_data:
            # Check if this looks like a single permission update request
            if "module" in request_data and "role" in request_data and "has_access" in request_data:
                raise HTTPException(
                    status_code=400, 
                    detail="For single permission updates, use PATCH /access/role-matrix/{organization_id}/permission instead of PUT. PUT endpoint expects 'matrix' data."
                )
            else:
                raise HTTPException(status_code=400, detail="Matrix data is required")
        
        matrix_data = request_data["matrix"]
        
        success = await role_matrix_service.update_role_matrix(organization_id, matrix_data)
        
        if success:
            return {
                "success": True,
                "message": "Role access matrix updated successfully",
                "organization_id": organization_id
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update role matrix")
        
    except Exception as e:
        logging.error(f"Error updating role matrix: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# @router.get("/role-matrix/{organization_id}/roles")
# async def get_available_roles(organization_id: int, request: Request):
#     """
#     Get all available roles in the organization
#     """
#     token = request.headers.get("Authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
#     try:
#         token_payload = login_service.decode_token(token.split(" ")[1])
#         if token_payload.get("org_id") != organization_id:
#             raise HTTPException(status_code=403, detail="Access denied to this organization")
        
#         logging.info(f"Getting available roles for organization {organization_id}")
        
#         roles = await role_matrix_service.get_available_roles(organization_id)
        
#         return {
#             "success": True,
#             "roles": roles,
#             "organization_id": organization_id
#         }
        
#     except Exception as e:
#         logging.error(f"Error getting available roles: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/role-matrix/modules")
# async def get_available_modules(request: Request):
#     """
#     Get all available modules in the system
#     """
#     token = request.headers.get("Authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
#     try:
#         token_payload = login_service.decode_token(token.split(" ")[1])
#         if token_payload.get("role") not in ["admin", "configurator"]:
#             raise HTTPException(status_code=403, detail="Insufficient permissions")
        
#         logging.info(f"Getting available modules by user {token_payload.get('user_id')}")
        
#         modules = await role_matrix_service.get_available_modules()
        
#         return {
#             "success": True,
#             "modules": modules
#         }
        
#     except Exception as e:
#         logging.error(f"Error getting available modules: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# # User Permission Matrix API Endpoints (Permissions as rows, Users as columns)

# @router.get("/user-permission-matrix/{organization_id}")
# async def get_user_permission_matrix(organization_id: int, request: Request):
#     """
#     Get user permission matrix for React component
#     Returns permissions as rows and users as columns with access status
#     """
#     token = request.headers.get("Authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
#     try:
#         token_payload = login_service.decode_token(token.split(" ")[1])
#         if token_payload.get("org_id") != organization_id:
#             raise HTTPException(status_code=403, detail="Access denied to this organization")
        
#         logging.info(f"Getting user permission matrix for organization {organization_id} by user {token_payload.get('user_id')}")
        
#         matrix_data = await user_permission_matrix_service.get_permission_users_matrix(organization_id)
        
#         return {
#             "success": True,
#             "data": matrix_data,
#             "organization_id": organization_id
#         }
        
#     except Exception as e:
#         logging.error(f"Error getting user permission matrix: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/user-permission-matrix/{organization_id}/users")
# async def get_organization_users(organization_id: int, request: Request):
#     """
#     Get all users in the organization
#     """
#     token = request.headers.get("Authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
#     try:
#         token_payload = login_service.decode_token(token.split(" ")[1])
#         if token_payload.get("org_id") != organization_id:
#             raise HTTPException(status_code=403, detail="Access denied to this organization")
        
#         logging.info(f"Getting users for organization {organization_id}")
        
#         users = await user_permission_matrix_service.get_users_in_organization(organization_id)
        
#         return {
#             "success": True,
#             "users": users,
#             "organization_id": organization_id
#         }
        
#     except Exception as e:
#         logging.error(f"Error getting organization users: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# @router.patch("/user-permission-matrix/{organization_id}/permission")
# async def update_user_permission(organization_id: int, request_data: dict, request: Request):
#     """
#     Update a single user permission
#     Only admins and configurators can update user permissions
#     """
#     token = request.headers.get("Authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
#     try:
#         token_payload = login_service.decode_token(token.split(" ")[1])
#         if token_payload.get("role") not in ["admin", "configurator"]:
#             raise HTTPException(status_code=403, detail="Insufficient permissions")
        
#         if token_payload.get("org_id") != organization_id:
#             raise HTTPException(status_code=403, detail="Access denied to this organization")
        
#         # Validate request data
#         required_fields = ["user_id", "permission_id", "has_access"]
#         for field in required_fields:
#             if field not in request_data:
#                 raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
#         user_id = request_data["user_id"]
#         permission_id = request_data["permission_id"]
#         has_access = request_data["has_access"]
        
#         logging.info(f"Updating user permission: user_id={user_id}, permission_id={permission_id}, has_access={has_access}")
        
#         success = await user_permission_matrix_service.update_user_permission(
#             user_id, permission_id, has_access, organization_id
#         )
        
#         if success:
#             return {
#                 "success": True,
#                 "message": f"Permission updated for user {user_id}",
#                 "user_id": user_id,
#                 "permission_id": permission_id,
#                 "has_access": has_access
#             }
#         else:
#             raise HTTPException(status_code=500, detail="Failed to update user permission")
        
#     except Exception as e:
#         logging.error(f"Error updating user permission: {e}")
#         raise HTTPException(status_code=500, detail=str(e))










# @router.get("/role-access/organization/{organization_id}", response_model=List[RoleAccessResponse])
# async def get_organization_role_access(organization_id: int, request: Request):
#     """
#     Get role access configuration for all users in an organization
#     Shows the final access permissions for each user based on role and user-specific permissions
#     """
#     token = request.headers.get("Authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
#     try:
#         token_payload = login_service.decode_token(token.split(" ")[1])
#         # Verify the requesting user has access to this organization
#         if token_payload.get("org_id") != organization_id:
#             raise HTTPException(status_code=403, detail="Access denied to this organization")
        
#         logging.info(f"Getting role access for organization {organization_id} by user {token_payload.get('user_id')}")
        
#         results = await role_access_service.get_role_access_for_organization(organization_id)
#         return results
        
#     except Exception as e:
#         logging.error(f"Error getting organization role access: {e}")
#         raise HTTPException(status_code=500, detail=str(e))













# @router.get("/role-access/role/{role}", response_model=List[Dict[str, Any]])
# async def get_role_permissions(role: str, request: Request):
#     """
#     Get all permissions for a specific role
#     """
#     token = request.headers.get("Authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
#     try:
#         token_payload = login_service.decode_token(token.split(" ")[1])
#         if token_payload.get("role") not in ["admin", "configurator"]:
#             raise HTTPException(status_code=403, detail="Insufficient permissions")
        
#         logging.info(f"Getting permissions for role {role} by user {token_payload.get('user_id')}")
        
#         results = await role_access_service.get_role_permissions(role)
#         return results
        
#     except Exception as e:
#         logging.error(f"Error getting role permissions: {e}")
#         raise HTTPException(status_code=500, detail=str(e))









# @router.get("/role-access/user/{user_id}", response_model=List[Dict[str, Any]])
# async def get_user_permissions(user_id: int, request: Request):
#     """
#     Get all permissions for a specific user (including role-based and user-specific)
#     """
#     token = request.headers.get("Authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
#     try:
#         token_payload = login_service.decode_token(token.split(" ")[1])
#         org_id = token_payload.get("org_id")
        
#         # Verify the requesting user has access to this user's organization
#         if token_payload.get("role") not in ["admin", "configurator"]:
#             raise HTTPException(status_code=403, detail="Insufficient permissions")
        
#         logging.info(f"Getting permissions for user {user_id} by user {token_payload.get('user_id')}")
        
#         results = await role_access_service.get_user_permissions(user_id, org_id)
#         return results
        
#     except Exception as e:
#         logging.error(f"Error getting user permissions: {e}")
#         raise HTTPException(status_code=500, detail=str(e))








# @router.put("/role-access/role/{role}")
# async def update_role_permissions(role: str, request_data: RoleAccessUpdateRequest, request: Request):
#     """
#     Update permissions for a specific role
#     Only admins can update role permissions
#     """
#     token = request.headers.get("Authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
#     try:
#         token_payload = login_service.decode_token(token.split(" ")[1])
#         if token_payload.get("role") != "admin":
#             raise HTTPException(status_code=403, detail="Only admins can update role permissions")
        
#         logging.info(f"Updating permissions for role {role} by user {token_payload.get('user_id')}")
        
#         # Convert permissions to the format expected by the service
#         permissions = [{"permission_id": p.permission_id, "has_access": p.has_access} for p in request_data.permissions]
        
#         success = await role_access_service.update_role_permissions(role, permissions)
        
#         if success:
#             return {"success": True, "message": f"Successfully updated permissions for role {role}"}
#         else:
#             raise HTTPException(status_code=500, detail="Failed to update role permissions")
        
#     except Exception as e:
#         logging.error(f"Error updating role permissions: {e}")
#         raise HTTPException(status_code=500, detail=str(e))







# @router.put("/role-access/user/{user_id}")
# async def update_user_permissions(user_id: int, request_data: UserAccessUpdateRequest, request: Request):
#     """
#     Update user-specific permissions
#     Only admins and configurators can update user permissions
#     """
#     token = request.headers.get("Authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
#     try:
#         token_payload = login_service.decode_token(token.split(" ")[1])
#         if token_payload.get("role") not in ["admin", "configurator"]:
#             raise HTTPException(status_code=403, detail="Insufficient permissions")
        
#         org_id = token_payload.get("org_id")
        
#         logging.info(f"Updating permissions for user {user_id} by user {token_payload.get('user_id')}")
        
#         # Convert permissions to the format expected by the service
#         permissions = [{"permission_id": p.permission_id, "has_access": p.has_access} for p in request_data.permissions]
        
#         success = await role_access_service.update_user_permissions(user_id, org_id, permissions)
        
#         if success:
#             return {"success": True, "message": f"Successfully updated permissions for user {user_id}"}
#         else:
#             raise HTTPException(status_code=500, detail="Failed to update user permissions")
        
#     except Exception as e:
#         logging.error(f"Error updating user permissions: {e}")
#         raise HTTPException(status_code=500, detail=str(e))





# @router.get("/role-access/permissions", response_model=List[Dict[str, Any]])
# async def get_all_permissions(request: Request):
#     """
#     Get all available permissions in the system
#     """
#     token = request.headers.get("Authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
#     try:
#         token_payload = login_service.decode_token(token.split(" ")[1])
#         if token_payload.get("role") not in ["admin", "configurator"]:
#             raise HTTPException(status_code=403, detail="Insufficient permissions")
        
#         logging.info(f"Getting all permissions by user {token_payload.get('user_id')}")
        
#         results = await role_access_service.get_all_permissions()
#         return results
        
#     except Exception as e:
#         logging.error(f"Error getting all permissions: {e}")
#         raise HTTPException(status_code=500, detail=str(e))







# @router.get("/role-access/roles/{organization_id}", response_model=List[str])
# async def get_organization_roles(organization_id: int, request: Request):
#     """
#     Get all unique roles in an organization
#     """
#     token = request.headers.get("Authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
#     try:
#         token_payload = login_service.decode_token(token.split(" ")[1])
#         if token_payload.get("org_id") != organization_id:
#             raise HTTPException(status_code=403, detail="Access denied to this organization")
        
#         logging.info(f"Getting roles for organization {organization_id} by user {token_payload.get('user_id')}")
        
#         results = await role_access_service.get_roles_in_organization(organization_id)
#         return results
        
#     except Exception as e:
#         logging.error(f"Error getting organization roles: {e}")
#         raise HTTPException(status_code=500, detail=str(e))





        

# @router.get("/role-access/summary/{organization_id}")
# async def get_role_access_summary(organization_id: int, request: Request):
#     """
#     Get a summary of role access configuration for an organization
#     Groups users by role and shows their permissions
#     """
#     token = request.headers.get("Authorization")
#     if not token or not token.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing or invalid token")
    
#     try:
#         token_payload = login_service.decode_token(token.split(" ")[1])
#         if token_payload.get("org_id") != organization_id:
#             raise HTTPException(status_code=403, detail="Access denied to this organization")
        
#         logging.info(f"Getting role access summary for organization {organization_id} by user {token_payload.get('user_id')}")
        
#         # Get all role access data
#         role_access_data = await role_access_service.get_role_access_for_organization(organization_id)
        
#         # Group by role
#         role_summary = {}
#         for item in role_access_data:
#             role = item['role']
#             if role not in role_summary:
#                 role_summary[role] = {
#                     'role': role,
#                     'users': [],
#                     'permissions': {}
#                 }
            
#             # Add user if not already added
#             user_key = f"{item['user_id']}_{item['user_name']}"
#             if not any(u['user_id'] == item['user_id'] for u in role_summary[role]['users']):
#                 role_summary[role]['users'].append({
#                     'user_id': item['user_id'],
#                     'user_name': item['user_name'],
#                     'user_email': item['user_email']
#                 })
            
#             # Add permission
#             permission_key = f"{item['module']}_{item['code']}"
#             role_summary[role]['permissions'][permission_key] = {
#                 'module': item['module'],
#                 'code': item['code'],
#                 'has_access': item['final_access']
#             }
        
#         return {
#             "success": True,
#             "organization_id": organization_id,
#             "role_summary": list(role_summary.values())
#         }
        
#     except Exception as e:
#         logging.error(f"Error getting role access summary: {e}")
#         raise HTTPException(status_code=500, detail=str(e))