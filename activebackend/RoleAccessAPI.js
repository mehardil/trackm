// Role Access API Integration for React Component
// This file shows how to integrate the role matrix API with your React component

const API_BASE_URL = 'http://127.0.0.1:8000';

class RoleAccessAPI {
  constructor(token, organizationId) {
    this.token = token;
    this.organizationId = organizationId;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get role matrix data (for initial load)
  async getRoleMatrix() {
    try {
      const response = await fetch(`${API_BASE_URL}/access/role-matrix/${this.organizationId}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching role matrix:', error);
      throw error;
    }
  }

  // Update single permission (for checkbox toggle)
  async updateSinglePermission(module, role, hasAccess) {
    try {
      const response = await fetch(`${API_BASE_URL}/access/role-matrix/${this.organizationId}/permission`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({
          module: module,
          role: role,
          has_access: hasAccess
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating single permission:', error);
      throw error;
    }
  }

  // Update entire matrix (for bulk save)
  async updateRoleMatrix(matrix) {
    try {
      const response = await fetch(`${API_BASE_URL}/access/role-matrix/${this.organizationId}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify({
          matrix: matrix
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating role matrix:', error);
      throw error;
    }
  }

  // Get available roles
  async getAvailableRoles() {
    try {
      const response = await fetch(`${API_BASE_URL}/access/role-matrix/${this.organizationId}/roles`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching available roles:', error);
      throw error;
    }
  }

  // Get available modules
  async getAvailableModules() {
    try {
      const response = await fetch(`${API_BASE_URL}/access/role-matrix/modules`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching available modules:', error);
      throw error;
    }
  }
}

// Updated React Component with API Integration
import React, { useState, useEffect } from "react";
import Sidebar from "../../components/common/Sidebar";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

const RoleAccess = () => {
  const [permissions, setPermissions] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [api, setApi] = useState(null);

  // Initialize API with token and organization ID
  useEffect(() => {
    const token = localStorage.getItem('authToken'); // Get from your auth system
    const organizationId = localStorage.getItem('organizationId'); // Get from your auth system
    
    if (token && organizationId) {
      setApi(new RoleAccessAPI(token, organizationId));
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (api) {
      loadRoleMatrix();
    }
  }, [api]);

  const loadRoleMatrix = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getRoleMatrix();
      
      if (response.success) {
        setPermissions(response.data);
      } else {
        setError('Failed to load role matrix');
      }
    } catch (err) {
      setError('Error loading role matrix: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (sectionIndex, role) => {
    if (!api) return;

    const currentRow = permissions[sectionIndex];
    const current = currentRow.permissions[role];

    if (current === "always") return; // can't change "Always Access"
    
    const newVal = current === "access" ? "none" : "access";
    const hasAccess = newVal === "access";

    try {
      // Update local state immediately for better UX
      setPermissions((prev) =>
        prev.map((row, i) => {
          if (i !== sectionIndex) return row;

          return {
            ...row,
            permissions: {
              ...row.permissions,
              [role]: newVal,
            },
          };
        })
      );

      // Update on server
      await api.updateSinglePermission(currentRow.section, role, hasAccess);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      // Revert on error
      setPermissions((prev) =>
        prev.map((row, i) => {
          if (i !== sectionIndex) return row;

          return {
            ...row,
            permissions: {
              ...row.permissions,
              [role]: current, // revert to original value
            },
          };
        })
      );
      
      setError('Failed to update permission: ' + err.message);
    }
  };

  const saveAllChanges = async () => {
    if (!api) return;

    try {
      const response = await api.updateRoleMatrix(permissions);
      
      if (response.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError('Failed to save changes');
      }
    } catch (err) {
      setError('Error saving changes: ' + err.message);
    }
  };

  const getColorClass = (type) => {
    switch (type) {
      case "always":
        return "bg-gray-500";
      case "access":
        return "bg-teal-400";
      case "none":
        return "bg-white border border-gray-300";
      case "disabled":
        return "bg-gray-200 cursor-not-allowed";
      default:
        return "";
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
              <p className="text-gray-600">Loading role access matrix...</p>
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
                onClick={loadRoleMatrix}
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
            ✅ Success! Role Access saved.
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
            <h1 className="text-3xl font-semibold text-gray-800">🛡️ Role Access</h1>
            <button
              onClick={saveAllChanges}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save All Changes
            </button>
          </div>

          <div className="overflow-auto rounded-lg border bg-white shadow">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-4 font-semibold">Module</th>
                  <th className="p-4 font-semibold text-center">Admin</th>
                  <th className="p-4 font-semibold text-center">Editor</th>
                  <th className="p-4 font-semibold text-center">Viewer</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((row, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{row.section}</td>
                    {["admin", "editor", "viewer"].map((role) => {
                      const type = row.permissions[role];
                      return (
                        <td key={role} className="p-4 text-center">
                          <button
                            onClick={() => togglePermission(idx, role)}
                            disabled={type === "always"}
                            className={`h-5 w-5 rounded-sm border transition-all ${
                              getColorClass(type)
                            } ${type !== "always" ? "hover:ring-2 hover:ring-blue-300" : ""}`}
                          >
                            {type === "access" || type === "always" ? "✔️" : ""}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Access Legend */}
          <div className="flex flex-wrap gap-4 mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm bg-gray-500"></div> Always Access
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm bg-teal-400"></div> Access
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm border border-gray-400 bg-white"></div> No Access
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default RoleAccess;
