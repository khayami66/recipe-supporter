import { InventoryItem, MenuPlan, ShoppingListItem, UserSettings } from '../types';

const STORAGE_KEYS = {
  USER_SETTINGS: 'recipe-app-user-settings',
  INVENTORY: 'recipe-app-inventory',
  MENU_PLAN: 'recipe-app-menu-plan',
  SHOPPING_LIST: 'recipe-app-shopping-list',
};

export const storage = {
  getUserSettings: (): UserSettings => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      if (!data) {
        return {
          familyCount: 0,
          preferences: '',
          lastUpdated: new Date(),
        };
      }
      
      const settings = JSON.parse(data);
      return {
        ...settings,
        lastUpdated: new Date(settings.lastUpdated),
      };
    } catch (error) {
      console.error('Error loading user settings:', error);
      return {
        familyCount: 0,
        preferences: '',
        lastUpdated: new Date(),
      };
    }
  },

  setUserSettings: (settings: UserSettings): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  },

  getInventory: (): InventoryItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (!data) return [];
      
      const items = JSON.parse(data);
      return items.map((item: any) => ({
        ...item,
        expirationDate: new Date(item.expirationDate),
        addedDate: new Date(item.addedDate),
      }));
    } catch (error) {
      console.error('Error loading inventory:', error);
      return [];
    }
  },

  setInventory: (inventory: InventoryItem[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    } catch (error) {
      console.error('Error saving inventory:', error);
    }
  },

  getMenuPlan: (): MenuPlan | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MENU_PLAN);
      if (!data) return null;
      
      const menuPlan = JSON.parse(data);
      return {
        ...menuPlan,
        generatedDate: new Date(menuPlan.generatedDate),
      };
    } catch (error) {
      console.error('Error loading menu plan:', error);
      return null;
    }
  },

  setMenuPlan: (menuPlan: MenuPlan): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.MENU_PLAN, JSON.stringify(menuPlan));
    } catch (error) {
      console.error('Error saving menu plan:', error);
    }
  },

  getShoppingList: (): ShoppingListItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading shopping list:', error);
      return [];
    }
  },

  setShoppingList: (shoppingList: ShoppingListItem[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(shoppingList));
    } catch (error) {
      console.error('Error saving shopping list:', error);
    }
  },
};