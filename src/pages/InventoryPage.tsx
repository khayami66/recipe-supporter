import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { InventoryItem, IngredientCategory } from '../types';

interface InventoryPageProps {
  inventory: InventoryItem[];
  onUpdateInventory: (updatedInventory: InventoryItem[]) => void;
}

const InventoryPage: React.FC<InventoryPageProps> = ({ inventory, onUpdateInventory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<IngredientCategory | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const categories: IngredientCategory[] = ['野菜', '肉・魚', '調味料', 'その他'];

  const getExpirationStatus = (expirationDate: Date) => {
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) return 'expired';
    if (daysUntilExpiration <= 3) return 'expiring';
    return 'fresh';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'expiring': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || item.category === filter;
    return matchesSearch && matchesFilter;
  });

  const sortedInventory = filteredInventory.sort((a, b) => {
    const statusA = getExpirationStatus(a.expirationDate);
    const statusB = getExpirationStatus(b.expirationDate);
    
    if (statusA === 'expired' && statusB !== 'expired') return -1;
    if (statusB === 'expired' && statusA !== 'expired') return 1;
    if (statusA === 'expiring' && statusB === 'fresh') return -1;
    if (statusB === 'expiring' && statusA === 'fresh') return 1;
    
    return a.expirationDate.getTime() - b.expirationDate.getTime();
  });

  const deleteItem = (id: string) => {
    const updatedInventory = inventory.filter(item => item.id !== id);
    onUpdateInventory(updatedInventory);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">在庫管理</h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="食材を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as IngredientCategory | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
            >
              <option value="all">すべてのカテゴリ</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="font-semibold text-red-600">
                {inventory.filter(item => getExpirationStatus(item.expirationDate) === 'expired').length}
              </p>
              <p className="text-red-500">期限切れ</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="font-semibold text-yellow-600">
                {inventory.filter(item => getExpirationStatus(item.expirationDate) === 'expiring').length}
              </p>
              <p className="text-yellow-500">期限間近</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="font-semibold text-green-600">
                {inventory.filter(item => getExpirationStatus(item.expirationDate) === 'fresh').length}
              </p>
              <p className="text-green-500">新鮮</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="space-y-3">
          {sortedInventory.map(item => {
            const status = getExpirationStatus(item.expirationDate);
            const statusColor = getStatusColor(status);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-lg p-4 shadow-sm border transition-all duration-200 hover:shadow-md ${statusColor.includes('red') ? 'border-red-200' : statusColor.includes('yellow') ? 'border-yellow-200' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                        {status === 'expired' ? '期限切れ' : status === 'expiring' ? '期限間近' : '新鮮'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><span className="font-medium">数量:</span> {item.amount}{item.unit}</p>
                        <p><span className="font-medium">カテゴリ:</span> {item.category}</p>
                      </div>
                      <div>
                        <p className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          <span className="font-medium">期限:</span> {item.expirationDate.toLocaleDateString('ja-JP')}
                        </p>
                        <p><span className="font-medium">追加日:</span> {item.addedDate.toLocaleDateString('ja-JP')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {status === 'expired' && (
                      <AlertTriangle size={20} className="text-red-500" />
                    )}
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sortedInventory.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="mx-auto">
                <path d="M12 2C13.1 2 14 2.9 14 4V6H16C17.1 6 18 6.9 18 8V19C18 20.1 17.1 21 16 21H8C6.9 21 6 20.1 6 19V8C6 6.9 6.9 6 8 6H10V4C10 2.9 10.9 2 12 2ZM12 4V6H12V4ZM8 8V19H16V8H8Z"/>
              </svg>
            </div>
            <p className="text-gray-500">在庫アイテムがありません</p>
            <p className="text-gray-400 text-sm mt-1">右下のボタンから新しいアイテムを追加できます</p>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 md:bottom-8 right-4 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center z-40"
      >
        <Plus size={24} />
      </button>

      {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <AddEditModal
          item={editingItem}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          onSave={(item) => {
            if (editingItem) {
              const updatedInventory = inventory.map(inv => 
                inv.id === item.id ? item : inv
              );
              onUpdateInventory(updatedInventory);
            } else {
              onUpdateInventory([...inventory, item]);
            }
            setShowAddModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

// Add/Edit Modal Component
interface AddEditModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
}

const AddEditModal: React.FC<AddEditModalProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    amount: item?.amount || 1,
    unit: item?.unit || '個',
    category: item?.category || '野菜' as IngredientCategory,
    expirationDate: item?.expirationDate.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
  });

  const categories: IngredientCategory[] = ['野菜', '肉・魚', '調味料', 'その他'];
  const units = ['個', 'g', 'kg', 'ml', 'L', '本', '袋', 'パック'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newItem: InventoryItem = {
      id: item?.id || crypto.randomUUID(),
      name: formData.name,
      amount: formData.amount,
      unit: formData.unit,
      category: formData.category,
      expirationDate: new Date(formData.expirationDate),
      addedDate: item?.addedDate || new Date(),
    };

    onSave(newItem);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {item ? '在庫を編集' : '在庫を追加'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                食材名
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                placeholder="例: にんじん"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  数量
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  単位
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as IngredientCategory })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                賞味期限
              </label>
              <input
                type="date"
                required
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
              />
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200"
              >
                {item ? '更新' : '追加'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;