import React, { useState } from 'react';
import { MoreHorizontal, Heart, Package, CalendarDays, Settings, X } from 'lucide-react';
import { User } from '../types';

interface MoreMenuProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  user: User | null;
  onOpenAuth: () => void;
}

const MoreMenu: React.FC<MoreMenuProps> = ({ 
  currentPage, 
  onPageChange, 
  user,
  onOpenAuth 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'favorites', label: 'お気に入り', icon: Heart, requiresAuth: true },
    { id: 'inventory', label: '在庫管理', icon: Package, requiresAuth: true },
    { id: 'calendar', label: 'カレンダー', icon: CalendarDays, requiresAuth: false },
    { id: 'settings', label: '基本設定', icon: Settings, requiresAuth: false },
  ];

  const handleItemClick = (itemId: string, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      onOpenAuth();
      setIsOpen(false);
      return;
    }
    onPageChange(itemId);
    setIsOpen(false);
  };

  const isActive = menuItems.some(item => item.id === currentPage);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Panel */}
      <div className={`fixed bottom-16 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50 transition-all duration-200 ${
        isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}>
        <div className="py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const itemIsActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id, item.requiresAuth)}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ${
                  itemIsActive ? 'text-orange-500 bg-orange-50' : 'text-gray-700'
                }`}
              >
                <Icon size={20} className="mr-3" />
                <span className="font-medium min-w-[100px]">{item.label}</span>
                {item.requiresAuth && !user && (
                  <span className="text-xs text-gray-400 ml-2">要ログイン</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* More Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex-1 flex flex-col items-center py-2 px-3 transition-colors duration-200 ${
          isActive || isOpen
            ? 'text-orange-500 bg-orange-50'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {isOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
        <span className="text-xs mt-1 font-medium">その他</span>
      </button>
    </>
  );
};

export default MoreMenu;