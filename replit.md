# Makhana E-commerce Platform

## Overview

Makhana is a full-stack e-commerce platform specializing in premium makhana (fox nuts) products. The application features a modern React frontend with a traditional Indian aesthetic, Express.js backend, and supports both file-based JSON storage and PostgreSQL database configurations. The platform includes comprehensive product management, shopping cart functionality, user authentication, order tracking, reviews, and an admin panel for content management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with pages for home, products, cart, wishlist, profile, admin, and order tracking
- **State Management**: TanStack React Query for server state management and custom hooks for local state
- **UI Components**: Shadcn/ui component library with Radix UI primitives and Tailwind CSS for styling
- **Design System**: Custom Indian-themed color palette with CSS variables for terracotta, saffron, turmeric, and other traditional colors
- **Authentication**: Session-based authentication with localStorage for session persistence
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with structured route handlers in `/server/routes.ts`
- **Database Layer**: Abstracted storage interface supporting both JSON file storage and PostgreSQL via Drizzle ORM
- **File Storage**: Multer for handling image uploads with organized directory structure by date
- **Session Management**: Custom session handling with bcrypt for password hashing
- **Development**: Hot module replacement via Vite integration for seamless development experience

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for schema management and migrations
- **Alternative Storage**: JSON file-based storage system in `/server/json-storage.ts` for development/testing
- **Schema Definition**: Shared TypeScript schemas in `/shared/schema.ts` with Zod validation
- **File Management**: Organized image storage with automatic directory creation by date
- **Database Configuration**: Drizzle configuration supporting environment-based database URLs

### Authentication and Authorization
- **User Authentication**: Custom session-based system with email/password registration and login
- **Admin Authentication**: Separate admin authentication system with role-based access control
- **Session Storage**: Browser localStorage for session persistence across page reloads
- **Password Security**: Bcrypt hashing for secure password storage
- **Authorization Headers**: Bearer token system for API authentication

### Core Features Architecture
- **Product Management**: Full CRUD operations with category association, image galleries, stock management, and featured product system
- **Shopping Cart**: Session-based cart persistence with automatic session ID generation
- **Order Processing**: Complete order lifecycle with tracking numbers, status updates, and customer information
- **Review System**: User reviews with ratings, moderation capabilities, and aggregated statistics
- **Search and Filtering**: Product search by name, category filtering, and price-based sorting
- **Wishlist**: User-specific wishlist functionality for authenticated users

## External Dependencies

### Core Runtime Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client for database connectivity
- **drizzle-orm**: Modern TypeSQL ORM with PostgreSQL dialect support
- **bcrypt**: Password hashing and verification for authentication security
- **multer**: Multipart form data handling for file uploads
- **express**: Web application framework for the backend API
- **vite**: Fast build tool and development server with HMR support

### Frontend UI and State Management
- **@tanstack/react-query**: Powerful data synchronization for React applications
- **@radix-ui/**: Comprehensive collection of unstyled, accessible UI primitives
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for React Hook Form
- **wouter**: Minimalist routing library for React applications
- **tailwindcss**: Utility-first CSS framework for styling

### Development and Build Tools
- **typescript**: Static type checking for JavaScript
- **tsx**: TypeScript execution environment for Node.js
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit-specific development tooling

### Validation and Utilities
- **zod**: TypeScript-first schema validation library
- **drizzle-zod**: Integration between Drizzle ORM and Zod validation
- **class-variance-authority**: Utility for creating variant-based component APIs
- **clsx**: Utility for constructing className strings conditionally
- **date-fns**: Modern JavaScript date utility library

### Image and Media Handling
- **Internal file management**: Organized directory structure for product and category images
- **Upload validation**: File type and size restrictions for image uploads
- **Image optimization**: Structured storage with WebP support for modern browsers