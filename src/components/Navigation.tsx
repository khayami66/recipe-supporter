import React from 'react';
import { Home, Calendar, ShoppingCart, Package, Settings, Heart, CalendarDays } from 'lucide-react';
import UserMenu from './UserMenu';
import MoreMenu from './MoreMenu';
import { User } from '../types';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  user: User | null;
  onSignOut: () => void;
  onOpenAuth: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentPage, 
  onPageChange, 
  user, 
  onSignOut, 
  onOpenAuth 
}) => {
  const mainNavItems = [
    { id: 'home', label: 'ホーム', icon: Home },
    { id: 'menu', label: 'メニュー', icon: Calendar },
    { id: 'shopping', label: '買い物', icon: ShoppingCart },
  ];

  const allNavItems = [
    ...mainNavItems,
    { id: 'settings', label: '基本設定', icon: Settings },
    { id: 'favorites', label: 'お気に入り', icon: Heart },
    { id: 'inventory', label: '在庫', icon: Package },
    { id: 'calendar', label: 'カレンダー', icon: CalendarDays },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`flex-1 flex flex-col items-center py-2 px-3 transition-colors duration-200 ${
                  isActive
                    ? 'text-orange-500 bg-orange-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            );
          })}
          <MoreMenu
            currentPage={currentPage}
            onPageChange={onPageChange}
            user={user}
            onOpenAuth={onOpenAuth}
          />
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex-col z-40 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">料理管理システム</h1>
          <div className="mt-4">
            <UserMenu user={user} onSignOut={onSignOut} onOpenAuth={onOpenAuth} />
          </div>
        </div>
        <div className="flex-1 py-6 overflow-y-auto">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                  isActive
                    ? 'text-orange-500 bg-orange-50 border-r-2 border-orange-500'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} className="mr-3" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile User Menu */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <UserMenu user={user} onSignOut={onSignOut} onOpenAuth={onOpenAuth} />
      </div>
    </>
  );
};

export default Navigation;