// User Permission Matrix React Component
// This component shows permissions as rows and users as columns

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/common/Sidebar";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

const API_BASE_URL = 'http://127.0.0.1:8000';

class UserPermissionMatrixAPI {
  constructor(token, organizationId) {
    this.token = token;
    this.organizationId = organizationId;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get user permission matrix
  async getUserPermissionMatrix() {
    try {
      const response = await fetch(`${API_BASE_URL}/access/user-permission-matrix/${this.organizationId}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user permission matrix:', error);
      throw error;
    }
  }

  // Get users in organization
  async getUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/access/user-permission-matrix/${this.organizationId}/users`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Update user permission
  async updateUserPermission(userId, permissionId, hasAccess) {
    try {
      const response = await fetch(`${API_BASE_URL}/access/user-permission-matrix/${this.organizationId}/permission`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({
          user_id: userId,
          permission_id: permissionId,
          has_access: hasAccess
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating user permission:', error);
      throw error;
    }
  }
}

const UserPermissionMatrix = () => {
  const [matrix, setMatrix] = useState([]);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [api, setApi] = useState(null);

  // Initialize API
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const organizationId = localStorage.getItem('organizationId');
    
    if (token && organizationId) {
      setApi(new UserPermissionMatrixAPI(token, organizationId));
    }
  }, []);

  // Load data
  useEffect(() => {
    if (api) {
      loadData();
    }
  }, [api]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getUserPermissionMatrix();
      
      if (response.success) {
        setMatrix(response.data.matrix);
        setUsers(response.data.users);
        setPermissions(response.data.permissions);
      } else {
        setError('Failed to load permission matrix');
      }
    } catch (err) {
      setError('Error loading permission matrix: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (permissionId, userId, currentAccess) => {
    if (!api) return;

    const newAccess = !currentAccess;

    try {
      // Update local state immediately for better UX
      setMatrix(prev => 
        prev.map(perm => {
          if (perm.id === permissionId) {
            return {
              ...perm,
              users: {
                ...perm.users,
                [userId]: {
                  ...perm.users[userId],
                  has_access: newAccess
                }
              }
            };
          }
          return perm;
        })
      );

      // Update on server
      await api.updateUserPermission(userId, permissionId, newAccess);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      // Revert on error
      setMatrix(prev => 
        prev.map(perm => {
          if (perm.id === permissionId) {
            return {
              ...perm,
              users: {
                ...perm.users,
                [userId]: {
                  ...perm.users[userId],
                  has_access: currentAccess
                }
              }
            };
          }
          return perm;
        })
      );
      
      setError('Failed to update permission: ' + err.message);
    }
  };

  const getPermissionSourceColor = (source) => {
    switch (source) {
      case 'user_specific':
        return 'text-blue-600';
      case 'role_based':
        return 'text-gray-600';
      default:
        return 'text-gray-400';
    }
  };

  const getPermissionSourceIcon = (source) => {
    switch (source) {
      case 'user_specific':
        return '👤';
      case 'role_based':
        return '👥';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="w-60 bg-white border-r shadow-sm">
          <Sidebar />
        </div>
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading permission matrix...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="w-60 bg-white border-r shadow-sm">
          <Sidebar />
        </div>
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-4">❌ Error</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={loadData}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-60 bg-white border-r shadow-sm">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1">
        <Header />

        {/* Success Banner */}
        {showSuccess && (
          <div className="bg-green-500 text-white px-4 py-3 text-sm font-medium shadow-sm">
            ✅ Success! Permission updated.
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500 text-white px-4 py-3 text-sm font-medium shadow-sm">
            ❌ {error}
          </div>
        )}

        <main className="flex-1 p-6 overflow-x-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-semibold text-gray-800">🔐 User Permission Matrix</h1>
            <div className="text-sm text-gray-600">
              {matrix.length} permissions × {users.length} users
            </div>
          </div>

          <div className="overflow-auto rounded-lg border bg-white shadow">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-4 font-semibold text-left">Permission</th>
                  <th className="p-4 font-semibold text-left">Module</th>
                  {users.map((user) => (
                    <th key={user.id} className="p-4 font-semibold text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-gray-500">{user.role}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((permission) => (
                  <tr key={permission.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">
                      <div className="flex flex-col">
                        <span className="font-medium">{permission.code}</span>
                        <span className="text-xs text-gray-500">ID: {permission.id}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{permission.module}</td>
                    {users.map((user) => {
                      const userPermission = permission.users[user.id.toString()];
                      const hasAccess = userPermission?.has_access || false;
                      const source = userPermission?.permission_source || 'role_based';
                      
                      return (
                        <td key={user.id} className="p-4 text-center">
                          <div className="flex flex-col items-center space-y-1">
                            <button
                              onClick={() => togglePermission(permission.id, user.id, hasAccess)}
                              className={`h-6 w-6 rounded-sm border transition-all ${
                                hasAccess 
                                  ? "bg-teal-400 border-teal-400" 
                                  : "bg-white border-gray-300"
                              } hover:ring-2 hover:ring-blue-300`}
                            >
                              {hasAccess ? "✔️" : ""}
                            </button>
                            <div className={`text-xs ${getPermissionSourceColor(source)}`}>
                              {getPermissionSourceIcon(source)}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm bg-teal-400"></div> Has Access
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm border border-gray-300 bg-white"></div> No Access
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">👤</span> User-specific permission
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">👥</span> Role-based permission
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800">Permissions</h3>
              <p className="text-2xl font-bold text-blue-600">{permissions.length}</p>
              <p className="text-sm text-blue-600">Total permissions</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800">Users</h3>
              <p className="text-2xl font-bold text-green-600">{users.length}</p>
              <p className="text-sm text-green-600">Active users</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800">Matrix</h3>
              <p className="text-2xl font-bold text-purple-600">{matrix.length * users.length}</p>
              <p className="text-sm text-purple-600">Total combinations</p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default UserPermissionMatrix;
