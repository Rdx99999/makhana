import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product-card";
import { getProducts, getCategories } from "@/lib/api";

export default function Products() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("name");
  
  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category") || "";
    const search = params.get("search") || "";
    
    setSelectedCategory(category);
    setSearchQuery(search);
  }, [location]);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: getCategories,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products", { category: selectedCategory, search: searchQuery }],
    queryFn: () => getProducts({ 
      category: selectedCategory || undefined, 
      search: searchQuery || undefined 
    }),
  });

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL();
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    
    const newURL = `/products${params.toString() ? `?${params}` : ""}`;
    window.history.pushState({}, "", newURL);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchQuery("");
    window.history.pushState({}, "", "/products");
  };

  const hasFilters = selectedCategory || searchQuery;

  return (
    <div className="min-h-screen bg-warm-cream">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="font-display text-xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">
            Premium Makhana Collection
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Discover authentic makhana varieties processed by skilled farmers across India
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-4 sm:mb-8">
          {/* Mobile Layout */}
          <div className="block sm:hidden space-y-3">
            {/* Search - Full width on mobile */}
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search makhana..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            {/* Filters Row - Category and Sort side by side */}
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={selectedCategory || "all"}
                onValueChange={(value) => {
                  setSelectedCategory(value === "all" ? "" : value);
                  setTimeout(updateURL, 0);
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
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

              {/* Category Filter */}
              <Select
                value={selectedCategory || "all"}
                onValueChange={(value) => {
                  setSelectedCategory(value === "all" ? "" : value);
                  setTimeout(updateURL, 0);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-3 sm:mt-4">
              <span className="text-xs sm:text-sm text-gray-600">Filters:</span>
              {selectedCategory && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  {categories.find(c => c.slug === selectedCategory)?.name}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      setSelectedCategory("");
                      setTimeout(updateURL, 0);
                    }}
                  />
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  "{searchQuery}"
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      setSearchQuery("");
                      setTimeout(updateURL, 0);
                    }}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-terracotta hover:text-terracotta/80 text-xs px-2 py-1 h-auto"
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="mb-3 sm:mb-6">
          <p className="text-xs sm:text-base text-gray-600">
            {isLoading ? "Loading..." : `${sortedProducts.length} products found`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-32 sm:h-40 lg:h-48 w-full" />
                <Skeleton className="h-3 sm:h-4 w-3/4" />
                <Skeleton className="h-3 sm:h-4 w-1/2" />
                <Skeleton className="h-6 sm:h-8 w-full" />
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
              Try adjusting your search criteria or browse all products.
            </p>
            <Button onClick={clearFilters} className="bg-terracotta hover:bg-terracotta/90 text-sm sm:text-base">
              View All Products
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} showCategory />
              ))}
            </div>

            {/* Recommended Products Section - Compact for Mobile */}
            {!selectedCategory && !searchQuery && (
              <div className="mt-6 sm:mt-12 border-t pt-4 sm:pt-8">
                <div className="mb-3 sm:mb-6">
                  <h2 className="font-display text-base sm:text-xl font-bold text-gray-900 mb-1">
                    You might also like
                  </h2>
                  <p className="text-xs sm:text-base text-gray-600 hidden sm:block">
                    Discover more premium makhana varieties from our farmers
                  </p>
                </div>
                
                {/* Mobile: Horizontal scroll, Desktop: Grid */}
                <div className="sm:hidden">
                  <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {products
                      .filter(product => product.featured)
                      .slice(0, 6)
                      .map((product) => (
                        <div key={`featured-mobile-${product.id}`} className="flex-shrink-0 w-36">
                          <ProductCard product={product} showCategory />
                        </div>
                      ))}
                  </div>
                </div>
                
                {/* Desktop: Normal Grid */}
                <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                  {products
                    .filter(product => product.featured)
                    .slice(0, 4)
                    .map((product) => (
                      <ProductCard key={`featured-desktop-${product.id}`} product={product} showCategory />
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
