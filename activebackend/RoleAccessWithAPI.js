import React, { useState, useEffect } from "react";
import Sidebar from "../../components/common/Sidebar";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

const API_BASE_URL = 'http://127.0.0.1:8000'; // Your backend URL

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

const RoleAccess = () => {
  const [permissions, setPermissions] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load permissions from API
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get token from localStorage or your auth system
        const token = localStorage.getItem('authToken');
        const organizationId = localStorage.getItem('organizationId') || '50'; // Default org ID
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch role matrix from your backend
        const res = await fetch(`${API_BASE_URL}/access/role-matrix/${organizationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.success) {
          setPermissions(data.data); // Backend returns data in accessMatrix format
        } else {
          throw new Error(data.message || 'Failed to fetch permissions');
        }
      } catch (err) {
        console.error("Failed to fetch permissions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPermissions();
  }, []);

  const togglePermission = async (sectionIndex, role) => {
    try {
      const currentRow = permissions[sectionIndex];
      const current = currentRow.permissions[role];

      if (current === "always") return; // can't change "Always Access"
      
      const newVal = current === "access" ? "none" : "access";
      const hasAccess = newVal === "access";

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
      const token = localStorage.getItem('authToken');
      const organizationId = localStorage.getItem('organizationId') || '50';
      
      const response = await fetch(`${API_BASE_URL}/access/role-matrix/${organizationId}/permission`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          module: currentRow.section,
          role: role,
          has_access: hasAccess
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        throw new Error(result.message || 'Failed to update permission');
      }
    } catch (err) {
      console.error("Failed to update permission:", err);
      setError(err.message);
      
      // Revert local state on error
      setPermissions((prev) =>
        prev.map((row, i) => {
          if (i !== sectionIndex) return row;
          const current = row.permissions[role];
          const originalVal = current === "access" ? "none" : "access";
          return {
            ...row,
            permissions: {
              ...row.permissions,
              [role]: originalVal,
            },
          };
        })
      );
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
              <p className="text-gray-600">Loading role access permissions...</p>
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
                onClick={() => window.location.reload()}
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
          <h1 className="text-3xl font-semibold text-gray-800 mb-6">🛡️ Role Access</h1>

          <div className="overflow-auto rounded-lg border bg-white shadow">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-4 font-semibold">Module</th>
                  <th className="p-4 font-semibold text-center">Admin</th>
                  <th className="p-4 font-semibold text-center">Configurator</th>
                  <th className="p-4 font-semibold text-center">Power User</th>
                  <th className="p-4 font-semibold text-center">Viewer</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((row, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{row.section}</td>
                    {["admin", "configurator", "powerUser", "viewer"].map((role) => {
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
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm bg-gray-200"></div> Access Not Available
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default RoleAccess;
