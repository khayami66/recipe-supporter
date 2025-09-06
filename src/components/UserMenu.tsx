import React, { useState } from 'react';
import { User, LogOut, Settings } from 'lucide-react';

interface UserMenuProps {
  user: { email: string } | null;
  onSignOut: () => void;
  onOpenAuth: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onSignOut, onOpenAuth }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return (
      <button
        onClick={onOpenAuth}
        className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
      >
        <User size={18} />
        <span>ログイン</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
      >
        <User size={18} />
        <span className="hidden sm:inline">{user.email}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200">
            <p className="text-sm text-gray-600">ログイン中</p>
            <p className="font-medium text-gray-800 truncate">{user.email}</p>
          </div>
          <div className="p-2">
            <button
              onClick={() => {
                onSignOut();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-2 text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <LogOut size={16} />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;