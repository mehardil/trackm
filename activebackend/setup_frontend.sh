#!/bin/bash

# Setup script for Role Access Frontend
# This script sets up the frontend to run on http://127.0.0.1:9900

echo "🚀 Setting up Role Access Frontend"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file for environment variables
echo "🔧 Creating environment configuration..."
cat > .env << EOF
REACT_APP_API_BASE_URL=http://127.0.0.1:8000
REACT_APP_ORGANIZATION_ID=50
PORT=9900
EOF

echo "✅ Environment configuration created"

# Create a simple test to verify API connection
echo "🧪 Creating API test..."
cat > test_api_connection.js << 'EOF'
// Test API connection
const API_BASE_URL = 'http://127.0.0.1:8000';

async function testAPIConnection() {
  try {
    console.log('Testing API connection...');
    
    // Test if backend is running
    const response = await fetch(`${API_BASE_URL}/access/role-matrix/50`, {
      headers: {
        'Authorization': 'Bearer test-token', // Replace with actual token
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ API is accessible');
      const data = await response.json();
      console.log('Response:', data);
    } else {
      console.log('❌ API returned error:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ API connection failed:', error.message);
    console.log('Make sure your backend is running on http://127.0.0.1:8000');
  }
}

testAPIConnection();
EOF

echo "✅ API test created"

# Create a simple HTML file to test the component
echo "🌐 Creating test HTML file..."
cat > public/test.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Role Access Test</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>
    
    <script type="text/babel">
        const { useState, useEffect } = React;
        
        const RoleAccess = () => {
            const [permissions, setPermissions] = useState([]);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState(null);
            
            useEffect(() => {
                const fetchPermissions = async () => {
                    try {
                        setLoading(true);
                        setError(null);
                        
                        // Test with a mock token - replace with actual token
                        const token = 'your-actual-token-here';
                        const organizationId = '50';
                        
                        const res = await fetch(`http://127.0.0.1:8000/access/role-matrix/${organizationId}`, {
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
                            setPermissions(data.data);
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
            
            if (loading) {
                return (
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading permissions...</p>
                        </div>
                    </div>
                );
            }
            
            if (error) {
                return (
                    <div className="flex items-center justify-center min-h-screen">
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
                    </div>
                );
            }
            
            return (
                <div className="p-6">
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
                                                    <div className={`h-5 w-5 rounded-sm border mx-auto ${
                                                        type === "always" ? "bg-gray-500" :
                                                        type === "access" ? "bg-teal-400" :
                                                        "bg-white border-gray-300"
                                                    }`}>
                                                        {(type === "access" || type === "always") && "✔️"}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        };
        
        ReactDOM.render(<RoleAccess />, document.getElementById('root'));
    </script>
</body>
</html>
EOF

echo "✅ Test HTML file created"

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure your backend is running on http://127.0.0.1:8000"
echo "2. Update the token in test.html with your actual JWT token"
echo "3. Start the frontend: npm start"
echo "4. Open http://127.0.0.1:9900 in your browser"
echo ""
echo "🔧 Configuration:"
echo "- Frontend will run on: http://127.0.0.1:9900"
echo "- Backend should run on: http://127.0.0.1:8000"
echo "- API proxy is configured in package.json"
echo ""
echo "🧪 Test the API connection:"
echo "node test_api_connection.js"

