import React from 'react';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  ClipboardList, 
  PieChart, 
  GraduationCap,
  Menu,
  X,
  LogOut,
  Settings,
  UserCheck,
  Database
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { user, signOut } = useAuth();

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'assessments', label: 'Assessments', icon: ClipboardList },
    { id: 'ga-mapping', label: 'Mapping', icon: GraduationCap },
    { id: 'faculty', label: 'My Faculty', icon: UserCheck },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'data-management', label: 'Data Management', icon: Database },
    { id: 'guide', label: 'System Guide', icon: BookOpen },
  ];

  const facultyMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'students', label: 'My Students', icon: Users },
    { id: 'ga-mapping', label: 'Enter Marks', icon: GraduationCap },
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : facultyMenuItems;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">GA Mapper</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 capitalize">
              {user?.role} Panel
            </span>
            <button
              onClick={handleSignOut}
              className="text-gray-500 hover:text-gray-700 p-1 rounded"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center px-6 py-3 text-left transition-colors duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs">{user?.email}</p>
            <p className="font-medium">NBA Graduate Attributes</p>
            <p>Mapping System v1.0</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-6 bg-white shadow-sm border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Welcome, {user?.name}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}