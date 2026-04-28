import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Home, Users, Cpu, Bell, LogOut } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">MediDispense</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/" className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <Link to="/patients" className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600">
                  <Users className="w-4 h-4 mr-2" />
                  Patients
                </Link>
                <Link to="/devices" className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600">
                  <Cpu className="w-4 h-4 mr-2" />
                  Devices
                </Link>
                <Link to="/alerts" className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600">
                  <Bell className="w-4 h-4 mr-2" />
                  Alerts
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">{user?.fullName}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
