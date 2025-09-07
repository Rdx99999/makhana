import type { Express } from "express";
import { createServer, type Server } from "http";
import { join } from "path";
import fs from "fs";
import express from "express";
import multer from "multer";
import crypto from "crypto";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema, insertCartItemSchema, insertCategorySchema, insertSettingSchema, insertReviewSchema } from "@shared/schema";
import { registerSchema, loginSchema } from "@shared/auth-schema";
import { z } from "zod";
import bcrypt from 'bcrypt';

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for image uploads with organized directory structure
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Determine upload type based on request path or referrer
        let uploadType = 'products'; // default
        if (req.headers.referer && req.headers.referer.includes('/admin') && req.headers.referer.includes('categories')) {
          uploadType = 'categories';
        }

        const uploadPath = join(process.cwd(), 'data', 'images', uploadType, `${year}`, `${month}`, `${day}`);

        try {
          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        } catch (error) {
          cb(error as any, '');
        }
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.originalname.split('.').pop();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${sanitizedName.split('.')[0]}_${uniqueSuffix}.${extension}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed') as any, false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  });

  // Serve static images
  app.use('/images', express.static(join(process.cwd(), 'data', 'images')));

  // Serve logo specifically
  app.get("/images/logo.png", (req, res) => {
    res.sendFile(join(process.cwd(), "data", "images", "logo.png"));
  });

  // Authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (!sessionId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getSessionUser(sessionId);
    if (!user) {
      return res.status(401).json({ message: "Invalid session" });
    }

    req.user = user;
    req.sessionId = sessionId;
    next();
  };

  // Rate limiting for admin login attempts
  const adminLoginAttempts = new Map<string, { count: number; lastAttempt: number }>();
  const MAX_ADMIN_LOGIN_ATTEMPTS = 5;
  const ADMIN_LOGIN_TIMEOUT = 15 * 60 * 1000; // 15 minutes

  // Admin session storage
  const adminSessions = new Map<string, { username: string; expiresAt: number }>();

  // Admin authentication middleware
  const requireAdminAuth = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;

    // Check for session token first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const sessionToken = authHeader.slice('Bearer '.length);
      const session = adminSessions.get(sessionToken);

      if (session && session.expiresAt > Date.now()) {
        req.adminUser = session.username;
        return next();
      } else {
        // Remove expired session
        adminSessions.delete(sessionToken);
      }
    }

    // Fallback to basic auth for initial login
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const attempts = adminLoginAttempts.get(clientIP);

    if (attempts && attempts.count >= MAX_ADMIN_LOGIN_ATTEMPTS) {
      if (Date.now() - attempts.lastAttempt < ADMIN_LOGIN_TIMEOUT) {
        return res.status(429).json({ 
          message: "Too many login attempts. Please try again later.",
          retryAfter: Math.ceil((ADMIN_LOGIN_TIMEOUT - (Date.now() - attempts.lastAttempt)) / 1000)
        });
      } else {
        // Reset after timeout
        adminLoginAttempts.delete(clientIP);
      }
    }

    const base64Credentials = authHeader.slice('Basic '.length);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminPasswordHash) {
      return res.status(500).json({ message: "Admin authentication not configured properly" });
    }

    try {
      // Check if the password hash is already bcrypt hashed or plain text
      let isValidPassword = false;

      if (adminPasswordHash.startsWith('$2b$')) {
        // It's already a bcrypt hash, compare directly
        isValidPassword = await bcrypt.compare(password, adminPasswordHash);
      } else {
        // It's plain text, compare directly
        isValidPassword = password === adminPasswordHash;
      }

      if (username !== adminUsername || !isValidPassword) {
        // Record failed attempt
        const currentAttempts = adminLoginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
        adminLoginAttempts.set(clientIP, {
          count: currentAttempts.count + 1,
          lastAttempt: Date.now()
        });

        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      // Reset login attempts on successful login
      adminLoginAttempts.delete(clientIP);
      req.adminUser = username;
      next();
    } catch (error) {
      return res.status(500).json({ message: "Authentication error" });
    }
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(validatedData.password, saltRounds);

      const user = await storage.createUser({
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        wishlist: [],
      });

      // Create session
      const sessionId = await storage.createSession(user.id);

      res.status(201).json({
        user: { id: user.id, name: user.name, email: user.email },
        sessionId,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      const user = await storage.verifyPassword(validatedData.email, validatedData.password);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const sessionId = await storage.createSession(user.id);

      res.json({
        user: { id: user.id, name: user.name, email: user.email },
        sessionId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(401).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (sessionId) {
        await storage.deleteSession(sessionId);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (!sessionId) {
        return res.status(401).json({ message: "No session" });
      }

      const user = await storage.getSessionUser(sessionId);
      if (!user) {
        return res.status(401).json({ message: "Invalid session" });
      }

      res.json({ id: user.id, name: user.name, email: user.email });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  // Admin authentication route with session creation
  app.post("/api/admin/auth", requireAdminAuth, (req: any, res) => {
    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTimeout = parseInt(process.env.ADMIN_SESSION_TIMEOUT_HOURS || '8') * 60 * 60 * 1000;

    adminSessions.set(sessionToken, {
      username: req.adminUser,
      expiresAt: Date.now() + sessionTimeout
    });

    res.json({ 
      message: "Admin authenticated successfully",
      sessionToken,
      expiresAt: Date.now() + sessionTimeout
    });
  });

  // Admin logout route
  app.post("/api/admin/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const sessionToken = authHeader.slice('Bearer '.length);
      adminSessions.delete(sessionToken);
    }
    res.json({ message: "Admin logged out successfully" });
  });

  // Admin session validation route
  app.get("/api/admin/me", requireAdminAuth, (req: any, res) => {
    res.json({ 
      username: req.adminUser,
      authenticated: true 
    });
  });

  // Wishlist routes
  app.get("/api/wishlist", async (req, res) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (!sessionId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getSessionUser(sessionId);
      if (!user) {
        return res.status(401).json({ message: "Invalid session" });
      }

      const wishlistProducts = await storage.getWishlist(user.id);
      res.json(wishlistProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/wishlist/:productId", async (req, res) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (!sessionId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getSessionUser(sessionId);
      if (!user) {
        return res.status(401).json({ message: "Invalid session" });
      }

      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const updatedUser = await storage.addToWishlist(user.id, productId);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Product added to wishlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/wishlist/:productId", async (req, res) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '');
      if (!sessionId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getSessionUser(sessionId);
      if (!user) {
        return res.status(401).json({ message: "Invalid session" });
      }

      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const updatedUser = await storage.removeFromWishlist(user.id, productId);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Product removed from wishlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  // Category image upload endpoint
  app.post("/api/upload-category-image", multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const uploadPath = join(process.cwd(), 'data', 'images', 'categories', `${year}`, `${month}`, `${day}`);

        try {
          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        } catch (error) {
          cb(error as any, '');
        }
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.originalname.split('.').pop();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${sanitizedName.split('.')[0]}_${uniqueSuffix}.${extension}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  }).single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
      }

      // Get relative path from data/images
      const relativePath = req.file.path.split('data/images/')[1];
      const imageUrl = `/images/${relativePath}`;

      res.json({ 
        imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error('Category image upload error:', error);
      res.status(500).json({ message: "Failed to upload category image" });
    }
  });

  // Homepage hero banner image upload endpoint
  app.post("/api/upload-homepage-image", multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const uploadPath = join(process.cwd(), 'data', 'images', 'homepage', 'hero', `${year}`, `${month}`, `${day}`);

        try {
          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        } catch (error) {
          cb(error as any, '');
        }
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.originalname.split('.').pop();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `hero_banner_${sanitizedName.split('.')[0]}_${uniqueSuffix}.${extension}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  }).single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No hero banner image file uploaded" });
      }

      // Get relative path from data/images
      const relativePath = req.file.path.split('data/images/')[1];
      const imageUrl = `/images/${relativePath}`;

      res.json({ 
        imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error('Homepage hero banner image upload error:', error);
      res.status(500).json({ message: "Failed to upload hero banner image" });
    }
  });

  // Product image upload endpoint
  app.post("/api/upload-image", upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
      }

      // Get relative path from data/images
      const relativePath = req.file.path.split('data/images/')[1];
      const imageUrl = `/images/${relativePath}`;

      res.json({ 
        imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Delete image endpoint
  app.delete("/api/delete-image", (req, res) => {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }

      // Convert URL to file path
      const imagePath = imageUrl.replace('/images/', '');
      const fullPath = join(process.cwd(), 'data', 'images', imagePath);

      // Delete the file
      import('fs').then(fs => {
        fs.unlink(fullPath, (err) => {
          if (err) {
            // If file doesn't exist, that's okay - it's already "deleted"
            if (err.code === 'ENOENT') {
              console.log('Image file already deleted or does not exist:', fullPath);
              return res.json({ message: "Image deleted successfully (file was already removed)" });
            }
            // For other errors, still return error
            console.error('Error deleting image:', err);
            return res.status(500).json({ message: "Failed to delete image file" });
          }
          res.json({ message: "Image deleted successfully" });
        });
      }).catch(error => {
        console.error('Error importing fs:', error);
        res.status(500).json({ message: "Failed to delete image" });
      });
    } catch (error) {
      console.error('Image deletion error:', error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error: any) {
      if (error.message && error.message.includes("Cannot delete category")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { category, search, featured } = req.query;
      let products;

      if (search) {
        products = await storage.searchProducts(search as string);
      } else if (featured === "true") {
        products = await storage.getFeaturedProducts();
      } else if (category) {
        const categoryRecord = await storage.getCategoryBySlug(category as string);
        if (categoryRecord) {
          products = await storage.getProducts(categoryRecord.id);
        } else {
          products = await storage.getProducts();
        }
      } else {
        products = await storage.getProducts();
      }

      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products-with-category", async (req, res) => {
    try {
      const products = await storage.getProductsWithCategory();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products with categories" });
    }
  });

  // Get single product with category
  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductWithCategory(id);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Get recommended products for a specific product
  app.get("/api/products/:id/recommendations", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const allProducts = await storage.getProducts();
      const otherProducts = allProducts.filter(p => p.id !== id);

      // Score products based on similarity
      const scoredProducts = otherProducts.map(p => {
        let score = 0;

        // Same category gets highest score
        if (p.categoryId === product.categoryId) {
          score += 50;
        }

        // Calculate feature similarity
        const productFeatures = product.features || [];
        const otherFeatures = p.features || [];

        if (productFeatures.length > 0 && otherFeatures.length > 0) {
          const commonFeatures = productFeatures.filter(feature => 
            otherFeatures.some(otherFeature => 
              otherFeature.toLowerCase().includes(feature.toLowerCase()) ||
              feature.toLowerCase().includes(otherFeature.toLowerCase())
            )
          );
          score += (commonFeatures.length / Math.max(productFeatures.length, otherFeatures.length)) * 30;
        }

        // Similar price range (within 20% gets points)
        const productPrice = parseFloat(product.price);
        const otherPrice = parseFloat(p.price);
        const priceDiff = Math.abs(productPrice - otherPrice) / productPrice;
        if (priceDiff <= 0.2) {
          score += 10;
        } else if (priceDiff <= 0.5) {
          score += 5;
        }

        // Featured products get slight boost
        if (p.featured) {
          score += 5;
        }

        // In stock products get slight boost
        if (p.stock > 0) {
          score += 3;
        }

        return { ...p, similarityScore: score };
      });

      // Sort by similarity score and return top 8
      const recommendations = scoredProducts
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 8)
        .map(({ similarityScore, ...product }) => product); // Remove score from final result

      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  app.post("/api/products", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, validatedData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Cart
  app.get("/api/cart/:sessionId", async (req, res) => {
    try {
      const cartItems = await storage.getCartItems(req.params.sessionId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.put("/api/cart/:sessionId/:productId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const productId = parseInt(req.params.productId);
      const { quantity } = req.body;

      if (typeof quantity !== "number" || quantity < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const cartItem = await storage.updateCartItem(sessionId, productId, quantity);
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:sessionId/:productId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const productId = parseInt(req.params.productId);
      const removed = await storage.removeFromCart(sessionId, productId);
      if (!removed) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/cart/:sessionId", async (req, res) => {
    try {
      await storage.clearCart(req.params.sessionId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", requireAuth, async (req: any, res) => {
    try {
      // Add userId to the request body before validation
      const orderData = {
        ...req.body,
        userId: req.user.id,
      };

      console.log("Order data received:", orderData);

      const validatedData = insertOrderSchema.parse(orderData);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Order validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      console.error("Order creation error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id/status", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Track order by tracking number
  app.get("/api/track/:trackingNumber", async (req, res) => {
    try {
      const trackingNumber = req.params.trackingNumber.toUpperCase();
      const order = await storage.getOrderByTrackingNumber(trackingNumber);

      if (!order) {
        return res.status(404).json({ message: "Order not found with this tracking number" });
      }

      // Return order tracking info (without sensitive customer details for public tracking)
      const trackingInfo = {
        id: order.id,
        trackingNumber: order.trackingNumber,
        status: order.status,
        createdAt: order.createdAt,
        customerName: order.customerName.split(' ')[0], // Only first name for privacy
        total: order.total
      };

      res.json(trackingInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to track order" });
    }
  });

  // Settings endpoints
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  app.post("/api/settings", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertSettingSchema.parse(req.body);
      const setting = await storage.createSetting(validatedData);
      res.status(201).json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid setting data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create setting" });
    }
  });

  app.put("/api/settings/:key", requireAdminAuth, async (req, res) => {
    try {
      const { value } = req.body;
      if (typeof value !== "string") {
        return res.status(400).json({ message: "Value must be a string" });
      }

      const setting = await storage.updateSetting(req.params.key, value);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  app.delete("/api/settings/:key", requireAdminAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteSetting(req.params.key);
      if (!deleted) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json({ message: "Setting deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // Review routes
  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/products/:productId/review-stats", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const stats = await storage.getProductReviewStats(productId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch review stats" });
    }
  });

  app.post("/api/reviews", requireAuth, async (req: any, res) => {
    try {
      const reviewData = {
        ...req.body,
        userId: req.user.id,
      };

      const validatedData = insertReviewSchema.parse(reviewData);
      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(400).json({ message: error.message || "Failed to create review" });
    }
  });

  app.get("/api/users/reviews", requireAuth, async (req: any, res) => {
    try {
      const reviews = await storage.getUserReviews(req.user.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  app.put("/api/reviews/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }

      // Verify the review belongs to the user
      const existingReview = await storage.getProductReviews(0); // We'll need to get by ID
      const userReview = existingReview.find(r => r.id === id && r.userId === req.user.id);
      if (!userReview) {
        return res.status(404).json({ message: "Review not found or not authorized" });
      }

      const validatedData = insertReviewSchema.partial().parse(req.body);
      const review = await storage.updateReview(id, validatedData);
      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  app.delete("/api/reviews/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }

      const deleted = await storage.deleteReview(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Review not found or not authorized" });
      }

      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}