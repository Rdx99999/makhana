import { 
  categories, 
  products, 
  cartItems, 
  orders,
  type Category, 
  type Product, 
  type CartItem, 
  type Order,
  type InsertCategory, 
  type InsertProduct, 
  type InsertCartItem, 
  type InsertOrder,
  type ProductWithCategory,
  type CartItemWithProduct,
  Setting,
  InsertSetting,
  Review,
  InsertReview
} from "@shared/schema";
import type { User, InsertUser } from "@shared/auth-schema";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Products
  getProducts(categoryId?: number): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductsWithCategory(): Promise<ProductWithCategory[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductWithCategory(id: number): Promise<ProductWithCategory | undefined>;
  searchProducts(query: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Cart
  getCartItems(sessionId: string): Promise<CartItemWithProduct[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(sessionId: string, productId: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(sessionId: string, productId: number): Promise<boolean>;
  clearCart(sessionId: string): Promise<boolean>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByTrackingNumber(trackingNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;

  // Settings
  getSettings(): Promise<any[]>;
  getSetting(key: string): Promise<any>;
  createSetting(setting: any): Promise<any>;
  updateSetting(key: string, value: string): Promise<any>;
  deleteSetting(key: string): Promise<boolean>;

  // User management
  createUser(userData: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  verifyPassword(email: string, password: string): Promise<User | null>;
  createSession(userId: number): Promise<string>;
  getSessionUser(sessionId: string): Promise<User | null>;
  deleteSession(sessionId: string): Promise<void>;

  // Wishlist
  addToWishlist(userId: number, productId: number): Promise<User | undefined>;
  removeFromWishlist(userId: number, productId: number): Promise<User | undefined>;
  getWishlist(userId: number): Promise<Product[]>;
}

export class MemStorage implements IStorage {
  private categories: Map<number, Category> = new Map();
  private products: Map<number, Product> = new Map();
  private cartItems: Map<string, CartItem[]> = new Map(); // sessionId -> CartItem[]
  private orders: Map<number, Order> = new Map();

  private categoryIdCounter = 1;
  private productIdCounter = 1;
  private cartItemIdCounter = 1;
  private orderIdCounter = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize categories
    const defaultCategories: InsertCategory[] = [
      { name: "Pottery", slug: "pottery", description: "Traditional Indian terracotta and ceramic crafts" },
      { name: "Textiles", slug: "textiles", description: "Handwoven fabrics and traditional Indian textiles" },
      { name: "Jewelry", slug: "jewelry", description: "Traditional Indian jewelry and ornaments" },
      { name: "Woodwork", slug: "woodwork", description: "Carved wooden sculptures and decorative items" },
    ];

    defaultCategories.forEach(cat => {
      const category: Category = { ...cat, id: this.categoryIdCounter++ };
      this.categories.set(category.id, category);
    });

    // Initialize products
    const defaultProducts: InsertProduct[] = [
      {
        name: "Traditional Ceramic Vase",
        description: "Handcrafted terracotta vase with traditional motifs, perfect for home decoration",
        price: "2499.00",
        categoryId: 1,
        stock: 15,
        images: ["https://images.unsplash.com/photo-1610701596007-11502861dcfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"],
        sku: "CV001",
        featured: true,
      },
      {
        name: "Handwoven Silk Scarf",
        description: "Pure silk scarf with traditional block prints, representing centuries of textile tradition",
        price: "1899.00",
        categoryId: 2,
        stock: 25,
        images: ["https://pixabay.com/get/ge38fe36925472b2370d0d560ec16daa99f0dd916a903049dd8c1db288d1277d1f3b4fcba0984df6668c7c9f94ba74287a068aa3195fc5e59a33742257a6a1c34_1280.jpg"],
        sku: "SS002",
        featured: true,
      },
      {
        name: "Traditional Silver Necklace",
        description: "Handcrafted silver necklace with intricate traditional designs",
        price: "4999.00",
        categoryId: 3,
        stock: 8,
        images: ["https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"],
        sku: "SN003",
        featured: true,
      },
      {
        name: "Carved Wooden Elephant",
        description: "Intricately carved sandalwood elephant sculpture, a symbol of prosperity",
        price: "3299.00",
        categoryId: 4,
        stock: 12,
        images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"],
        sku: "WE004",
        featured: true,
      },
      {
        name: "Embroidered Cushion Cover",
        description: "Beautiful cushion cover with traditional Indian embroidery work",
        price: "899.00",
        categoryId: 2,
        stock: 30,
        images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"],
        sku: "CC005",
        featured: false,
      },
      {
        name: "Brass Oil Lamp",
        description: "Traditional brass diya perfect for festivals and daily prayers",
        price: "799.00",
        categoryId: 1,
        stock: 20,
        images: ["https://images.unsplash.com/photo-1604486070132-ac0c4b0e6b42?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"],
        sku: "BL006",
        featured: false,
      },
    ];

    defaultProducts.forEach(prod => {
      const product: Product = { 
        ...prod, 
        id: this.productIdCounter++,
        createdAt: new Date(),
      };
      this.products.set(product.id, product);
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.slug === slug);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory: Category = { ...category, id: this.categoryIdCounter++ };
    this.categories.set(newCategory.id, newCategory);
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;

    const updated: Category = { ...existing, ...category };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Products
  async getProducts(categoryId?: number): Promise<Product[]> {
    const products = Array.from(this.products.values());
    if (categoryId) {
      return products.filter(p => p.categoryId === categoryId);
    }
    return products;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.featured);
  }

  async getProductsWithCategory(): Promise<ProductWithCategory[]> {
    const products = Array.from(this.products.values());
    return products.map(product => {
      const category = this.categories.get(product.categoryId);
      return { ...product, category: category! };
    });
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductWithCategory(id: number): Promise<ProductWithCategory | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const category = this.categories.get(product.categoryId);
    if (!category) return undefined;

    return { ...product, category };
  }

  async searchProducts(query: string): Promise<Product[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.products.values()).filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm)
    );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = { 
      ...product, 
      id: this.productIdCounter++,
      createdAt: new Date(),
    };
    this.products.set(newProduct.id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;

    const updated: Product = { ...existing, ...product };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Cart
  async getCartItems(sessionId: string): Promise<CartItemWithProduct[]> {
    const items = this.cartItems.get(sessionId) || [];
    return items.map(item => {
      const product = this.products.get(item.productId);
      return { ...item, product: product! };
    }).filter(item => item.product);
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    const sessionItems = this.cartItems.get(cartItem.sessionId) || [];
    const existingIndex = sessionItems.findIndex(item => item.productId === cartItem.productId);

    if (existingIndex >= 0) {
      sessionItems[existingIndex].quantity += cartItem.quantity;
      this.cartItems.set(cartItem.sessionId, sessionItems);
      return sessionItems[existingIndex];
    } else {
      const newItem: CartItem = {
        ...cartItem,
        id: this.cartItemIdCounter++,
        createdAt: new Date(),
      };
      sessionItems.push(newItem);
      this.cartItems.set(cartItem.sessionId, sessionItems);
      return newItem;
    }
  }

  async updateCartItem(sessionId: string, productId: number, quantity: number): Promise<CartItem | undefined> {
    const sessionItems = this.cartItems.get(sessionId) || [];
    const itemIndex = sessionItems.findIndex(item => item.productId === productId);

    if (itemIndex >= 0) {
      if (quantity <= 0) {
        sessionItems.splice(itemIndex, 1);
      } else {
        sessionItems[itemIndex].quantity = quantity;
      }
      this.cartItems.set(sessionId, sessionItems);
      return sessionItems[itemIndex];
    }
    return undefined;
  }

  async removeFromCart(sessionId: string, productId: number): Promise<boolean> {
    const sessionItems = this.cartItems.get(sessionId) || [];
    const initialLength = sessionItems.length;
    const filteredItems = sessionItems.filter(item => item.productId !== productId);

    this.cartItems.set(sessionId, filteredItems);
    return filteredItems.length < initialLength;
  }

  async clearCart(sessionId: string): Promise<boolean> {
    this.cartItems.set(sessionId, []);
    return true;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: this.orderIdCounter++,
      createdAt: new Date(),
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;

    const updated: Order = { ...existing, status };
    this.orders.set(id, updated);
    return updated;
  }

  // User management
  async createUser(userData: InsertUser): Promise<User> {
    throw new Error("Method not implemented.");
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    throw new Error("Method not implemented.");
  }
  async getUserById(id: number): Promise<User | undefined> {
    throw new Error("Method not implemented.");
  }
  async verifyPassword(email: string, password: string): Promise<User | null> {
    throw new Error("Method not implemented.");
  }
  async createSession(userId: number): Promise<string> {
    throw new Error("Method not implemented.");
  }
  async getSessionUser(sessionId: string): Promise<User | null> {
    throw new Error("Method not implemented.");
  }
  async deleteSession(sessionId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async addToWishlist(userId: number, productId: number): Promise<User | undefined> {
    throw new Error("Method not implemented.");
  }

  async removeFromWishlist(userId: number, productId: number): Promise<User | undefined> {
    throw new Error("Method not implemented.");
  }

  async getWishlist(userId: number): Promise<Product[]> {
    throw new Error("Method not implemented.");
  }
}

import { JsonStorage } from './json-storage';

export const storage = new JsonStorage();