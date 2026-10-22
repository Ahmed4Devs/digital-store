import { create } from 'zustand';

export const useCartStore = create((set, get) => {
  const savedCart = (() => {
    try {
      return JSON.parse(localStorage.getItem('app_cart') || '[]');
    } catch {
      return [];
    }
  })();

  const save = (items) => {
    localStorage.setItem('app_cart', JSON.stringify(items));
    set({ items });
  };

  return {
    items: savedCart,
    isCartOpen: false,

    openCart: () => set({ isCartOpen: true }),
    closeCart: () => set({ isCartOpen: false }),
    toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

    addItem: (product) => {
      const items = get().items;
      const exists = items.some((item) => item.id === product.id);
      if (!exists) {
        const nextItems = [...items, product];
        save(nextItems);
      }
      set({ isCartOpen: true });
    },

    removeItem: (productId) => {
      const nextItems = get().items.filter((item) => item.id !== productId);
      save(nextItems);
    },

    clearCart: () => {
      save([]);
    },

    isInCart: (productId) => {
      return get().items.some((item) => item.id === productId);
    },

    getTotalCents: () => {
      return get().items.reduce((sum, item) => {
        const cents = item.price_cents !== undefined ? Number(item.price_cents) : Math.round(parseFloat(item.price || 0) * 100);
        return sum + cents;
      }, 0);
    },

    getTotal: () => {
      return (get().getTotalCents() / 100).toFixed(2);
    },

    getCount: () => {
      return get().items.length;
    },
  };
});
