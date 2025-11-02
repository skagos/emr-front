import { Users, FileText, Plus, History, Calendar, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext'; // import hook

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'new-visit', label: 'New Visit', icon: Plus },
    { id: 'history', label: 'Visit History', icon: History },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">Doctor's Portal</h1>
          </div>

          {/* Center: Nav Items */}
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="ml-4 p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-700" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-400" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
