import { promises as fs } from 'fs';
import { join } from 'path';
import type { 
  Category, 
  Product, 
  CartItem, 
  Order,
  InsertCategory, 
  InsertProduct, 
  InsertCartItem, 
  InsertOrder,
  ProductWithCategory,
  CartItemWithProduct,
  Setting,
  InsertSetting,
  Review,
  InsertReview
} from "@shared/schema";
import type { User, InsertUser } from "@shared/auth-schema";
import bcrypt from 'bcrypt';
import { IStorage } from './storage';

interface DatabaseData {
  categories: Category[];
  products: Product[];
  cartItems: CartItem[];
  orders: Order[];
  settings: Setting[];
  users: User[];
  sessions: { sessionId: string; userId: number; expiresAt: string }[];
  reviews: Review[];
  counters: {
    categoryId: number;
    productId: number;
    cartItemId: number;
    orderId: number;
    userId: number;
    reviewId: number;
  };
}

export class JsonStorage implements IStorage {
  private readonly dataDir = './data';
  private readonly dbFile = join(this.dataDir, 'database.json');
  private data: DatabaseData;

  constructor() {
    this.data = {
      categories: [],
      products: [],
      cartItems: [],
      orders: [],
      settings: [],
      users: [],
      sessions: [],
      reviews: [],
      counters: {
        categoryId: 1,
        productId: 1,
        cartItemId: 1,
        orderId: 1,
        userId: 1,
        reviewId: 1
      }
    };
    this.ensureDataDirectory();
    this.loadData();
  }

  private async ensureDataDirectory() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(join(this.dataDir, 'images'), { recursive: true });
    } catch (error) {
      console.error('Error creating data directory:', error);
    }
  }

  private async loadData() {
    try {
      const fileExists = await fs.access(this.dbFile).then(() => true).catch(() => false);

      if (fileExists) {
        const fileContent = await fs.readFile(this.dbFile, 'utf-8');
        const loadedData = JSON.parse(fileContent);

        // Ensure all required arrays exist
        this.data = {
          categories: loadedData.categories || [],
          products: loadedData.products || [],
          cartItems: loadedData.cartItems || [],
          orders: loadedData.orders || [],
          settings: loadedData.settings || [],
          users: loadedData.users || [],
          sessions: loadedData.sessions || [],
          reviews: loadedData.reviews || [],
          counters: {
            categoryId: loadedData.counters?.categoryId || 1,
            productId: loadedData.counters?.productId || 1,
            cartItemId: loadedData.counters?.cartItemId || 1,
            orderId: loadedData.counters?.orderId || 1,
            userId: loadedData.counters?.userId || 1,
            reviewId: loadedData.counters?.reviewId || 1
          }
        };
      } else {
        // Initialize with sample data
        await this.initializeData();
        await this.saveData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      await this.initializeData();
    }
  }

  private async saveData() {
    try {
      await fs.writeFile(this.dbFile, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  private async initializeData() {
    const sampleCategories = [
      { name: "Premium Makhana", slug: "premium-makhana", description: "Premium quality makhana varieties with superior taste and texture", thumbnail: null },
      { name: "Organic Makhana", slug: "organic-makhana", description: "Organically grown makhana free from chemicals and pesticides", thumbnail: null },
      { name: "Flavored Makhana", slug: "flavored-makhana", description: "Delicious makhana with traditional Indian spices and seasonings", thumbnail: null },
      { name: "Roasted Makhana", slug: "roasted-makhana", description: "Perfectly roasted makhana with crispy texture and rich flavor", thumbnail: null },
      { name: "Seasoned Makhana", slug: "seasoned-makhana", description: "Expertly seasoned makhana with traditional spices and herbs", thumbnail: null },
    ];

    const sampleProducts = [
      {
        name: "Premium Roasted Makhana",
        description: "Premium quality roasted makhana with authentic Indian processing. Perfect for healthy snacking.",
        price: "2999",
        categoryId: 1,
        sku: "POT001",
        featured: true,
        stock: 15,
        images: ["/images/ceramic-vase-1.svg"],
        features: ["Premium Quality", "Traditional Processing", "Healthy Snacking"],
        createdAt: new Date()
      },
      {
        name: "Organic Makhana Pack",
        description: "Beautiful organic makhana with natural processing methods. Made by skilled farmers.",
        price: "1899",
        categoryId: 2,
        sku: "TEX001",
        featured: true,
        stock: 25,
        images: ["/images/silk-scarf-1.svg"],
        features: ["Organic", "Natural processing", "Premium texture"],
        createdAt: new Date()
      },
      {
        name: "Flavored Makhana Mix",
        description: "Exquisite flavored makhana mix showcasing traditional seasoning.",
        price: "3499",
        categoryId: 3,
        sku: "JEW001",
        featured: false,
        stock: 12,
        images: ["/images/silver-earrings-1.svg"],
        features: ["Multiple flavors", "Traditional seasoning", "Nutritious"],
        createdAt: new Date()
      },
      {
        name: "Seasoned Makhana Variety",
        description: "Intricately seasoned makhana variety with traditional spice blends.",
        price: "1599",
        categoryId: 4,
        sku: "WOD001",
        featured: false,
        stock: 8,
        images: ["/images/wooden-box-1.jpg", "/images/wooden-box-2.jpg"],
        features: ["Hand-seasoned", "Traditional spices", "Healthy snacking"],
        createdAt: new Date()
      },
      {
        name: "Spiced Makhana Selection",
        description: "Hand-seasoned makhana selection with vibrant flavors and traditional spices.",
        price: "899",
        categoryId: 2,
        sku: "TEX002",
        featured: true,
        stock: 30,
        images: ["/images/cushion-cover-1.jpg"],
        features: ["Hand-seasoned", "Vibrant flavors", "Traditional spices"],
        createdAt: new Date()
      },
      {
        name: "Premium Makhana Assortment",
        description: "Ornate makhana assortment with premium varieties, perfect for healthy indulgence.",
        price: "2199",
        categoryId: 5,
        sku: "MET001",
        featured: false,
        stock: 10,
        images: ["/images/brass-plate-1.jpg", "/images/brass-plate-2.jpg"],
        features: ["Premium varieties", "Multiple textures", "Healthy indulgence"],
        createdAt: new Date()
      }
    ];

    // Add categories
    for (const cat of sampleCategories) {
      const category: Category = { 
        ...cat, 
        id: this.data.counters.categoryId++,
        thumbnail: cat.thumbnail || null
      };
      this.data.categories.push(category);
    }

    // Add products
    for (const prod of sampleProducts) {
      const product: Product = { 
        ...prod, 
        id: this.data.counters.productId++
      };
      this.data.products.push(product);
    }
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return [...this.data.categories];
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return this.data.categories.find(cat => cat.slug === slug);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory: Category = { 
      ...category, 
      id: this.data.counters.categoryId++,
      description: category.description || null,
      thumbnail: category.thumbnail || null
    };
    this.data.categories.push(newCategory);
    await this.saveData();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const index = this.data.categories.findIndex(cat => cat.id === id);
    if (index === -1) return undefined;

    const updated: Category = { 
      ...this.data.categories[index], 
      ...category,
      description: category.description !== undefined ? category.description : this.data.categories[index].description
    };
    this.data.categories[index] = updated;
    await this.saveData();
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const index = this.data.categories.findIndex(cat => cat.id === id);
    if (index === -1) return false;

    // Check if any products are using this category
    const productsUsingCategory = this.data.products.filter(product => product.categoryId === id);
    if (productsUsingCategory.length > 0) {
      throw new Error(`Cannot delete category. ${productsUsingCategory.length} product(s) are still using this category.`);
    }

    this.data.categories.splice(index, 1);
    await this.saveData();
    return true;
  }

  // Products
  async getProducts(categoryId?: number): Promise<Product[]> {
    if (categoryId) {
      return this.data.products.filter(product => product.categoryId === categoryId);
    }
    return [...this.data.products];
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return this.data.products.filter(product => product.featured);
  }

  async getProductsWithCategory(): Promise<ProductWithCategory[]> {
    return this.data.products
      .map(product => {
        const category = this.data.categories.find(cat => cat.id === product.categoryId);
        if (!category) {
          // Return null for products with missing categories so we can filter them out
          return null;
        }
        return {
          ...product,
          category
        };
      })
      .filter((product): product is ProductWithCategory => product !== null);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.data.products.find(product => product.id === id);
  }

  async getProductWithCategory(id: number): Promise<ProductWithCategory | undefined> {
    const product = this.data.products.find(p => p.id === id);
    if (!product) return undefined;

    const category = this.data.categories.find(cat => cat.id === product.categoryId);
    if (!category) return undefined; // Don't return product if category is missing

    return {
      ...product,
      category
    };
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return this.data.products.filter(product => 
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = { 
      ...product, 
      id: this.data.counters.productId++,
      stock: product.stock || 0,
      images: product.images || [],
      featured: product.featured || false,
      createdAt: new Date(),
      features: product.features || []
    };
    this.data.products.push(newProduct);
    await this.saveData();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return undefined;

    const updated: Product = { 
      ...this.data.products[index], 
      ...product,
      features: product.features !== undefined ? product.features : this.data.products[index].features
    };
    this.data.products[index] = updated;
    await this.saveData();
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.data.products.splice(index, 1);
    await this.saveData();
    return true;
  }

  // Cart
  async getCartItems(sessionId: string): Promise<CartItemWithProduct[]> {
    const cartItems = this.data.cartItems.filter(item => item.sessionId === sessionId);
    return cartItems.map(item => {
      const product = this.data.products.find(p => p.id === item.productId);
      return {
        ...item,
        product: product!
      };
    });
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    const existingIndex = this.data.cartItems.findIndex(
      item => item.sessionId === cartItem.sessionId && item.productId === cartItem.productId
    );

    if (existingIndex !== -1) {
      // Update existing item
      const existing = this.data.cartItems[existingIndex];
      existing.quantity += cartItem.quantity || 1;
      await this.saveData();
      return existing;
    } else {
      // Create new item
      const newItem: CartItem = {
        id: this.data.counters.cartItemId++,
        ...cartItem,
        quantity: cartItem.quantity || 1,
        createdAt: new Date()
      };
      this.data.cartItems.push(newItem);
      await this.saveData();
      return newItem;
    }
  }

  async updateCartItem(sessionId: string, productId: number, quantity: number): Promise<CartItem | undefined> {
    const index = this.data.cartItems.findIndex(
      item => item.sessionId === sessionId && item.productId === productId
    );
    if (index === -1) return undefined;

    this.data.cartItems[index].quantity = quantity;
    await this.saveData();
    return this.data.cartItems[index];
  }

  async removeFromCart(sessionId: string, productId: number): Promise<boolean> {
    const index = this.data.cartItems.findIndex(
      item => item.sessionId === sessionId && item.productId === productId
    );
    if (index === -1) return false;

    this.data.cartItems.splice(index, 1);
    await this.saveData();
    return true;
  }

  async clearCart(sessionId: string): Promise<boolean> {
    const initialLength = this.data.cartItems.length;
    this.data.cartItems = this.data.cartItems.filter(item => item.sessionId !== sessionId);

    if (this.data.cartItems.length !== initialLength) {
      await this.saveData();
      return true;
    }
    return false;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return [...this.data.orders];
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.data.orders.find(order => order.id === id);
  }

  private generateTrackingNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `TRK${timestamp}${random}`;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    // Validate required fields
    if (!order.userId) {
      throw new Error("User ID is required");
    }
    if (!order.customerName) {
      throw new Error("Customer name is required");
    }
    if (!order.customerEmail) {
      throw new Error("Customer email is required");
    }
    if (!order.shippingAddress) {
      throw new Error("Shipping address is required");
    }
    if (!order.total) {
      throw new Error("Order total is required");
    }
    if (!order.items) {
      throw new Error("Order items are required");
    }

    // Generate unique tracking number
    let trackingNumber;
    do {
      trackingNumber = this.generateTrackingNumber();
    } while (this.data.orders.some(o => o.trackingNumber === trackingNumber));

    const newOrder: Order = {
      id: this.data.counters.orderId++,
      userId: order.userId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone || null,
      shippingAddress: order.shippingAddress,
      total: order.total,
      status: order.status || "pending",
      trackingNumber: trackingNumber,
      items: order.items,
      createdAt: new Date()
    };
    
    this.data.orders.push(newOrder);
    await this.saveData();
    return newOrder;
  }

  async getOrderByTrackingNumber(trackingNumber: string): Promise<Order | undefined> {
    return this.data.orders.find(order => order.trackingNumber === trackingNumber);
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const index = this.data.orders.findIndex(order => order.id === id);
    if (index === -1) return undefined;

    const updated: Order = { ...this.data.orders[index], status };
    this.data.orders[index] = updated;
    await this.saveData();
    return updated;
  }

  // Settings
  async getSettings(): Promise<Setting[]> {
    if (!this.data.settings) {
      this.data.settings = [];
    }
    return this.data.settings;
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const settings = await this.getSettings();
    return settings.find(s => s.key === key) || null;
  }

  async createSetting(setting: InsertSetting): Promise<Setting> {
    if (!this.data.settings) {
      this.data.settings = [];
    }

    const existingSetting = this.data.settings.find(s => s.key === setting.key);
    if (existingSetting) {
      throw new Error(`Setting with key '${setting.key}' already exists`);
    }

    const newSetting: Setting = {
      id: this.data.counters.orderId++,
      ...setting,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.settings.push(newSetting);
    await this.saveData();
    return newSetting;
  }

  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    if (!this.data.settings) {
      this.data.settings = [];
    }

    const index = this.data.settings.findIndex(setting => setting.key === key);
    if (index === -1) return undefined;

    const updated: Setting = { ...this.data.settings[index], value: value, updatedAt: new Date().toISOString() };
    this.data.settings[index] = updated;
    await this.saveData();
    return updated;
  }

  async deleteSetting(key: string): Promise<boolean> {
    if (!this.data.settings) {
      return false;
    }

    const initialLength = this.data.settings.length;
    this.data.settings = this.data.settings.filter(setting => setting.key !== key);

    if (this.data.settings.length < initialLength) {
      await this.saveData();
      return true;
    }
    return false;
  }

  // User management
  async createUser(userData: InsertUser): Promise<User> {
    if (!this.data.users) {
      this.data.users = [];
    }

    // Check if user already exists
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const id = this.getNextId('users');
    const user: User = {
      id,
      name: userData.name,
      email: userData.email,
      passwordHash: userData.passwordHash,
      wishlist: [],
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(user);
    await this.saveData();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!this.data.users) {
      this.data.users = [];
    }
    return this.data.users.find(user => user.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    if (!this.data.users) {
      this.data.users = [];
    }
    return this.data.users.find(user => user.id === id);
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  async createSession(userId: number): Promise<string> {
    if (!this.data.sessions) {
      this.data.sessions = [];
    }

    const sessionId = Math.random().toString(36).substring(7) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    this.data.sessions.push({ sessionId, userId, expiresAt });
    await this.saveData();
    return sessionId;
  }

  async getSessionUser(sessionId: string): Promise<User | null> {
    if (!this.data.sessions) {
      this.data.sessions = [];
    }

    const session = this.data.sessions.find(s => s.sessionId === sessionId);
    if (!session || new Date(session.expiresAt) < new Date()) {
      return null;
    }

    return this.getUserById(session.userId) || null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!this.data.sessions) {
      this.data.sessions = [];
    }

    this.data.sessions = this.data.sessions.filter(s => s.sessionId !== sessionId);
    await this.saveData();
  }

  async addToWishlist(userId: number, productId: number): Promise<User | undefined> {
    const user = await this.getUserById(userId);
    if (!user) return undefined;

    // Initialize wishlist if it doesn't exist
    if (!user.wishlist) {
      user.wishlist = [];
    }

    // Don't add if already in wishlist
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await this.saveData();
    }

    return user;
  }

  async removeFromWishlist(userId: number, productId: number): Promise<User | undefined> {
    const user = await this.getUserById(userId);
    if (!user) return undefined;

    if (!user.wishlist) {
      user.wishlist = [];
    }

    user.wishlist = user.wishlist.filter(id => id !== productId);
    await this.saveData();

    return user;
  }

  async getWishlist(userId: number): Promise<Product[]> {
    const user = await this.getUserById(userId);
    if (!user || !user.wishlist) return [];

    const wishlistProducts: Product[] = [];
    for (const productId of user.wishlist) {
      const product = await this.getProduct(productId);
      if (product) {
        wishlistProducts.push(product);
      }
    }

    return wishlistProducts;
  }

  // Reviews
  async createReview(review: InsertReview): Promise<Review> {
    // Check if user has already reviewed this product
    const existingReview = this.data.reviews.find(
      r => r.productId === review.productId && r.userId === review.userId
    );
    
    if (existingReview) {
      throw new Error("You have already reviewed this product");
    }

    // Get user name
    const user = await this.getUserById(review.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify product exists
    const product = await this.getProduct(review.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const newReview: Review = {
      id: this.data.counters.reviewId++,
      productId: review.productId,
      userId: review.userId,
      rating: review.rating,
      comment: review.comment,
      title: review.title,
      userName: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.reviews.push(newReview);
    await this.saveData();
    return newReview;
  }

  async getProductReviews(productId: number): Promise<Review[]> {
    return this.data.reviews
      .filter(review => review.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return this.data.reviews
      .filter(review => review.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateReview(id: number, review: Partial<InsertReview>): Promise<Review | undefined> {
    const index = this.data.reviews.findIndex(r => r.id === id);
    if (index === -1) return undefined;

    const updated: Review = {
      ...this.data.reviews[index],
      ...review,
      updatedAt: new Date().toISOString(),
    };
    
    this.data.reviews[index] = updated;
    await this.saveData();
    return updated;
  }

  async deleteReview(id: number, userId: number): Promise<boolean> {
    const index = this.data.reviews.findIndex(r => r.id === id && r.userId === userId);
    if (index === -1) return false;

    this.data.reviews.splice(index, 1);
    await this.saveData();
    return true;
  }

  async getProductReviewStats(productId: number): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const reviews = await this.getProductReviews(productId);
    
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalReviews: reviews.length,
      ratingDistribution
    };
  }

  private getNextId(table: 'products' | 'categories' | 'cartItems' | 'orders' | 'settings' | 'users' | 'reviews'): number {
    if (table === 'products') {
      return this.data.counters.productId++;
    } else if (table === 'categories') {
      return this.data.counters.categoryId++;
    } else if (table === 'cartItems') {
      return this.data.counters.cartItemId++;
    } else if (table === 'orders') {
      return this.data.counters.orderId++;
    } else if (table === 'settings') {
        return this.data.counters.orderId++; //Using orderId as settings id.
    } else if (table === 'users') {
        return this.data.counters.userId++;
    } else if (table === 'reviews') {
        return this.data.counters.reviewId++;
    }
    throw new Error(`Invalid table name: ${table}`);
  }
}