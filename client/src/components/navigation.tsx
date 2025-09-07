import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, Menu, X, Settings, User, LogOut, Package, Heart } from "lucide-react";
import logoImage from "@assets/SNEHA LOGO 1.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCartSidebar } from "./shopping-cart";
import { AuthDialog } from "./auth/auth-dialog";

const categories = [
  { name: "Premium", slug: "premium" },
  { name: "Roasted", slug: "roasted" },
  { name: "Natural", slug: "natural" },
  { name: "Flavored", slug: "flavored" },
];

export function Navigation() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { itemCount } = useCart();
  const { user, isAuthenticated, login, logout } = useAuth();
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <>
      <nav className="bg-warm-cream border-b-2 border-terracotta/20 traditional-shadow sticky top-0 z-50 ethnic-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-heritage-gradient rounded-lg flex items-center justify-center traditional-shadow overflow-hidden">
                  <img 
                    src={logoImage} 
                    alt="Hastkala Logo" 
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-lg sm:text-xl md:text-2xl font-bold text-henna group-hover:text-terracotta transition-colors">
                    Makhana
                  </span>
                  <span className="text-xs sm:text-sm text-copper font-serif italic hidden sm:inline">
                    Premium Makhana
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className={`font-serif text-henna hover:text-terracotta transition-colors ${location === "/" ? "text-terracotta font-semibold" : ""}`}>
                Home
              </Link>
              <Link href="/about" className={`font-serif text-henna hover:text-terracotta transition-colors ${location === "/about" ? "text-terracotta font-semibold" : ""}`}>
                About Us
              </Link>

              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="font-serif text-henna hover:text-terracotta transition-colors">
                      Categories
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-48 p-2 bg-warm-cream border border-terracotta/20">
                        {categories.map((category) => (
                          <Link
                            key={category.slug}
                            href={`/products?category=${category.slug}`}
                            className="block px-4 py-2 text-henna hover:bg-saffron/10 hover:text-terracotta rounded-md font-serif transition-colors"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              <Link href="/products" className={`font-serif text-henna hover:text-terracotta transition-colors ${location === "/products" ? "text-terracotta font-semibold" : ""}`}>
                Products
              </Link>

              <Link href="/track" className={`font-serif text-henna hover:text-terracotta transition-colors ${location === "/track" ? "text-terracotta font-semibold" : ""}`}>
                Track Order
              </Link>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search - Desktop only */}
              <form onSubmit={handleSearch} className="relative hidden lg:block">
                <Input
                  type="text"
                  placeholder="Search makhana..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 xl:w-64 pr-10"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              {/* Mobile Search Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="lg:hidden hover:bg-warm-cream/50 p-1.5 sm:p-2"
                onClick={() => window.location.href = '/products'}
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              <Link href="/wishlist" className="relative hidden sm:block">
                <Button variant="ghost" size="sm" className="relative hover:bg-warm-cream/50 p-1.5 sm:p-2">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>

              <Link href="/cart" className="relative">
                <Button variant="ghost" size="sm" className="relative hover:bg-warm-cream/50 p-1.5 sm:p-2">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  {itemCount > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 sm:h-5 sm:w-5 flex items-center justify-center p-0 bg-saffron text-white text-xs">
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Authentication */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="text-xs sm:text-sm text-gray-700 hidden sm:block">Hello, {user?.name}</span>
                  <Link href="/profile">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-terracotta hover:bg-terracotta/10 p-1 sm:p-2"
                    >
                      <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Profile</span>
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-terracotta text-white border-terracotta hover:bg-terracotta/90 p-1 sm:p-2"
                    onClick={logout}
                  >
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-terracotta text-white border-terracotta hover:bg-terracotta/90 p-1 sm:p-2 text-xs sm:text-sm"
                  onClick={() => setShowAuthDialog(true)}
                >
                  <User className="h-3 w-3 sm:h-4 w-4 sm:mr-2" />
                  <span className="hidden xs:inline">Login</span>
                </Button>
              )}

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden p-1.5">
                    <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col space-y-4 mt-8">
                    <Link href="/" className="text-lg font-medium">Home</Link>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Categories</h3>
                      <div className="pl-4 space-y-2">
                        {categories.map((category) => (
                          <Link
                            key={category.slug}
                            href={`/products?category=${category.slug}`}
                            className="block text-gray-700 hover:text-terracotta"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <Link href="/products" className="text-lg font-medium">Products</Link>
                    <Link href="/track" className="text-lg font-medium">Track Order</Link>

                    {/* Mobile Search */}
                    <form onSubmit={handleSearch} className="relative sm:hidden">
                      <Input
                        type="text"
                        placeholder="Search makhana..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="absolute right-0 top-0 h-full px-3"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </form>

                     <Link href="/wishlist" className="relative">
                      <Button variant="ghost" size="sm" className="relative hover:bg-warm-cream/50">
                        <Heart className="h-5 w-5" />
                      </Button>
                    </Link>

                    {/* Mobile Authentication */}
                    {isAuthenticated ? (
                      <div className="pt-4 border-t space-y-2">
                        <p className="text-sm text-gray-600 mb-2">Hello, {user?.name}</p>
                        <Link href="/profile">
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-terracotta hover:bg-terracotta/10"
                          >
                            <User className="h-4 w-4 mr-2" />
                            My Profile
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          className="w-full bg-terracotta text-white border-terracotta hover:bg-terracotta/90"
                          onClick={logout}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="pt-4 border-t">
                        <Button 
                          variant="outline" 
                          className="w-full bg-terracotta text-white border-terracotta hover:bg-terracotta/90"
                          onClick={() => setShowAuthDialog(true)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Login
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <ShoppingCartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={(userData, sessionId) => {
          login(userData, sessionId);
          toast({
            title: "Success!",
            description: "You have been logged in successfully.",
          });
        }}
      />
    </>
  );
}