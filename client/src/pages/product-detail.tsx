import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getProduct, getRecommendedProducts, addToCart, getProductReviewStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { ChevronLeft, ChevronRight, Star, Plus, Minus, Heart, Share2, X, ArrowRight, ArrowLeft, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProductCard } from "@/components/product-card";
import { Reviews } from "@/components/reviews";

export default function ProductDetail() {
  const params = useParams();
  const productId = parseInt(params.id as string);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { addToCart, isAddingToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["/api/products", productId],
    queryFn: () => getProduct(productId),
    enabled: !isNaN(productId),
  });

  // Get recommended products
  const { data: recommendedProducts = [] } = useQuery({
    queryKey: ["/api/products", productId, "recommendations"],
    queryFn: () => getRecommendedProducts(productId),
    enabled: !isNaN(productId) && !!product,
  });

  // Get review stats
  const { data: reviewStats } = useQuery({
    queryKey: ["/api/products", productId, "review-stats"],
    queryFn: () => getProductReviewStats(productId),
    enabled: !isNaN(productId) && !!product,
  });

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      productId: product.id,
      quantity,
    });

    toast({
      title: "Added to cart",
      description: `${quantity} × ${product.name} added to your cart.`,
    });
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleImageDoubleClick = () => {
    setFullscreenImageIndex(selectedImageIndex);
    setIsFullscreenOpen(true);
  };

  const handleFullscreenPrevious = () => {
    if (!product) return;
    setFullscreenImageIndex(prev => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleFullscreenNext = () => {
    if (!product) return;
    setFullscreenImageIndex(prev => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!product) return;
    if (e.key === 'ArrowLeft') {
      handleFullscreenPrevious();
    } else if (e.key === 'ArrowRight') {
      handleFullscreenNext();
    } else if (e.key === 'Escape') {
      setIsFullscreenOpen(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !imageRef.current || !zoomMode) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    if (zoomMode) {
      setIsZooming(true);
    }
  };

  const handleMouseLeave = () => {
    if (zoomMode) {
      setIsZooming(false);
    }
  };

  const toggleZoomMode = () => {
    setZoomMode(!zoomMode);
    if (zoomMode) {
      setIsZooming(false);
    }
  };

  const handleWishlist = async () => {
    if (!product) return;
  
    try {
      await toggleWishlist(product.id);
      // No need to manually update local storage or state here
      // useWishlist hook handles it
  
      toast({
        title: isInWishlist(product.id) ? "Removed from Wishlist" : "Added to Wishlist",
        description: `${product.name} has been ${isInWishlist(product.id) ? 'removed from' : 'added to'} your wishlist.`,
      });
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    setIsBuyingNow(true);

    try {
      // First add to cart
      await addToCart({
        productId: product.id,
        quantity,
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to cart page for immediate checkout
      window.location.href = '/cart?checkout=true';

      toast({
        title: "Redirecting to Checkout",
        description: `${quantity} × ${product.name} added to cart. Redirecting to checkout...`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process buy now. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBuyingNow(false);
    }
  };

  // Check if product is in wishlist on component mount
  useEffect(() => {
    if (product) {
      const existingWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const isInWishlist = existingWishlist.some((item: any) => item.id === product.id);
      setIsWishlisted(isInWishlist);
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <Skeleton className="h-96 w-full" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-warm-cream flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/products">
              <Button className="bg-terracotta hover:bg-terracotta/90">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-cream ethnic-pattern">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Traditional Breadcrumb */}
        <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-henna mb-2 sm:mb-8 animate-fade-in overflow-x-auto bg-sandalwood/10 rounded-lg px-3 py-2 craft-border">
          <Link href="/" className="hover:text-terracotta transition-colors duration-200 flex items-center flex-shrink-0 font-serif">
            <span className="text-saffron mr-1">🏠</span>
            <span className="hidden sm:inline">Home</span>
            <span className="sm:hidden">Home</span>
          </Link>
          <span className="text-copper flex-shrink-0">▸</span>
          <Link href="/products" className="hover:text-terracotta transition-colors duration-200 flex-shrink-0 hidden sm:inline font-serif">Products</Link>
          <span className="text-copper flex-shrink-0 hidden sm:inline">▸</span>
          <Link href={`/products?category=${product.category.slug}`} className="hover:text-terracotta transition-colors duration-200 flex-shrink-0 truncate max-w-[100px] sm:max-w-none font-serif">
            {product.category.name}
          </Link>
          <span className="text-copper flex-shrink-0">▸</span>
          <span className="text-henna font-medium truncate font-serif">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-8 lg:gap-12 animate-fade-in-up">
          {/* Product Images */}
          <div className="space-y-2 sm:space-y-6">
            {/* Main Image Container - Enhanced Indian Style */}
            <div className="relative bg-gradient-to-br from-warm-cream to-sandalwood/20 rounded-xl sm:rounded-2xl overflow-hidden traditional-shadow craft-border paisley-pattern">
              {/* Image Counter */}
              {product.images.length > 1 && (
                <div className="absolute top-4 right-4 bg-henna/80 text-white text-sm px-3 py-1 rounded-full z-10 font-serif backdrop-blur-sm">
                  {selectedImageIndex + 1} / {product.images.length}
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col space-y-2 z-10">
                {product.featured && (
                  <Badge className="bg-saffron text-white">
                    Featured
                  </Badge>
                )}
                {product.stock === 0 && (
                  <Badge variant="destructive">
                    Out of Stock
                  </Badge>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600 bg-white">
                    Limited Stock
                  </Badge>
                )}
              </div>

              {/* Main Image */}
              <div 
                ref={containerRef}
                className={`relative aspect-[4/5] bg-gradient-to-br from-white via-gray-50 to-gray-100 group overflow-hidden ${
                  zoomMode ? 'cursor-crosshair' : 'cursor-pointer'
                }`}
                onDoubleClick={handleImageDoubleClick}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  ref={imageRef}
                  src={product.images[selectedImageIndex] || "/placeholder-image.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-300 select-none"
                  style={{
                    transform: isZooming ? `scale(2)` : 'scale(1)',
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }}
                  draggable={false}
                />

                {/* Zoom lens overlay */}
                {isZooming && (
                  <div 
                    className="absolute pointer-events-none border-2 border-white shadow-lg bg-black/10 rounded-full"
                    style={{
                      width: '120px',
                      height: '120px',
                      left: `${zoomPosition.x}%`,
                      top: `${zoomPosition.y}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10,
                    }}
                  />
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Zoom indicator */}
                {zoomMode && (
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center z-20">
                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    Hover to zoom
                  </div>
                )}

                {/* Zoom mode indicator */}
                {zoomMode && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-terracotta/90 text-white text-xs px-3 py-1 rounded-full z-20 flex items-center">
                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    Zoom Mode Active
                  </div>
                )}

                {/* Navigation Arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex(prev => 
                        prev === 0 ? product.images.length - 1 : prev - 1
                      )}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-10 sm:h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors duration-200 z-30 touch-target"
                    >
                      <ArrowLeft className="h-6 w-6 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex(prev => 
                        prev === product.images.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-10 sm:h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors duration-200 z-30 touch-target"
                    >
                      <ChevronRight className="h-6 w-6 sm:h-5 sm:w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Navigation - Enhanced Indian Style */}
              {product.images.length > 1 && (
                <div className="bg-gradient-to-r from-warm-cream via-sandalwood/10 to-warm-cream border-t-2 border-terracotta/20 p-2 sm:p-6 paisley-pattern">
                  <div className="flex space-x-1.5 sm:space-x-3 overflow-x-auto scrollbar-hide mobile-scroll">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-12 h-12 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden border-2 sm:border-3 transition-all duration-300 transform hover:scale-105 traditional-shadow touch-target ${
                          selectedImageIndex === index
                            ? "border-saffron shadow-lg scale-105 ring-1 sm:ring-2 ring-saffron/30 bg-heritage-gradient p-0.5"
                            : "border-terracotta/30 hover:border-terracotta craft-border"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-200 rounded-md"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-2 sm:p-4 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleZoomMode}
                    className={`transition-all duration-200 hover:scale-105 mobile-button-spacing touch-target flex-shrink-0 ${
                      zoomMode 
                        ? 'bg-terracotta text-white border-terracotta hover:bg-terracotta/90' 
                        : 'hover:bg-terracotta hover:text-white'
                    }`}
                  >
                    <svg className="h-4 w-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    <span className="hidden sm:inline">{zoomMode ? 'Exit Zoom' : 'Zoom View'}</span>
                    <span className="sm:hidden">{zoomMode ? 'Exit' : 'Zoom'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleWishlist}
                    className={`transition-all duration-200 hover:scale-105 mobile-button-spacing touch-target flex-shrink-0 ${
                      isInWishlist(product.id)
                        ? 'bg-saffron text-white border-saffron hover:bg-saffron/90'
                        : 'hover:bg-saffron hover:text-white'
                    }`}
                  >
                    <Heart className={`h-4 w-4 mr-1 sm:mr-2 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">{isInWishlist(product.id) ? 'Wishlisted' : 'Wishlist'}</span>
                    <span className="sm:hidden">{isInWishlist(product.id) ? '♥' : '♡'}</span>
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-sage hover:text-white transition-all duration-200 hover:scale-105 mobile-button-spacing touch-target flex-shrink-0">
                    <Share2 className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </div>
                <div className="hidden lg:flex items-center text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
                  <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {zoomMode ? 'Hover to zoom • Double-click for fullscreen' : 'Double-click for fullscreen'}
                </div>
              </div>
            </div>

            
          </div>

          {/* Product Info - Enhanced Indian Style */}
          <div className="space-y-3 sm:space-y-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-gradient-to-br from-warm-cream to-sandalwood/20 rounded-xl sm:rounded-2xl p-3 sm:p-6 lg:p-8 craft-border traditional-shadow paisley-pattern">
              {/* Traditional Header with Category and SKU */}
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                <Badge variant="outline" className="bg-saffron/20 text-henna border-terracotta/30 px-3 py-1 text-xs font-serif">
                  🎨 {product.category.name}
                </Badge>
                <span className="text-xs text-copper bg-sandalwood/30 px-3 py-1 rounded-full font-serif">
                  {product.sku}
                </span>
              </div>

              {/* Traditional Title */}
              <h1 className="font-display text-lg sm:text-3xl lg:text-4xl font-bold text-henna mb-3 sm:mb-6 leading-tight">
                {product.name}
              </h1>

              {/* Stock Status */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 sm:p-4 border border-green-200 mb-2 sm:mb-4">
                {product.stock > 0 ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <Badge variant="outline" className="text-green-700 border-green-500 bg-green-50 font-medium text-xs">
                          ✓ In Stock
                        </Badge>
                      </div>
                      {product.stock <= 5 && (
                        <div className="flex items-center space-x-1 sm:space-x-2 text-orange-600 bg-orange-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                          <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="text-xs sm:text-sm font-medium">Only {product.stock} left!</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                      Fast shipping available
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <Badge variant="destructive" className="font-medium">Out of Stock</Badge>
                  </div>
                )}
              </div>

              {/* Traditional Price Section */}
              <div className="flex items-baseline justify-between mb-4 sm:mb-6 bg-saffron/10 rounded-lg p-3 craft-border">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-3xl lg:text-4xl font-bold text-terracotta font-serif">
                    ₹{parseFloat(product.price).toLocaleString()}
                  </span>
                  <span className="text-sm text-copper line-through font-serif">
                    ₹{(parseFloat(product.price) * 1.2).toLocaleString()}
                  </span>
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                  Save 20%
                </Badge>
              </div>

              {/* Traditional Actions Section */}
              {product.stock > 0 && (
                <div className="bg-gradient-to-r from-saffron/10 to-turmeric/10 rounded-lg p-3 sm:p-4 craft-border traditional-shadow mb-4 sm:mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-serif font-medium text-henna flex-shrink-0">Quantity:</span>
                    <div className="flex items-center bg-warm-cream rounded craft-border">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="h-8 w-8 p-0 hover:bg-terracotta hover:text-white rounded-l text-xs font-serif"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-serif font-medium w-10 text-center text-sm bg-sandalwood/20 py-1.5 border-x border-terracotta/20">
                        {quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="h-8 w-8 p-0 hover:bg-terracotta hover:text-white rounded-r text-xs font-serif"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <Button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className="heritage-gradient hover:opacity-90 text-white text-xs py-2 h-8 sm:h-10 font-serif traditional-shadow"
                    >
                      <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {isAddingToCart ? "..." : "Add to Cart"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleWishlist}
                      className={`border-terracotta text-terracotta hover:bg-terracotta hover:text-white text-xs py-2 h-8 sm:h-10 font-serif traditional-shadow ${
                        isInWishlist(product.id) ? 'bg-terracotta text-white' : ''
                      }`}
                    >
                      <Heart className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                      {isInWishlist(product.id) ? "💝" : "💖"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleBuyNow}
                      disabled={isBuyingNow}
                      className="border-saffron text-saffron hover:bg-saffron hover:text-white text-xs py-2 h-8 sm:h-10 font-serif traditional-shadow"
                    >
                      {isBuyingNow ? "..." : "Buy Now"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Compact Reviews */}
              {reviewStats && reviewStats.totalReviews > 0 && (
                <div className="flex items-center space-x-2 bg-saffron/10 px-2 py-1 rounded-full self-start">
                  <div className="flex items-center space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-3 w-3 sm:h-4 sm:w-4 ${
                          i < Math.round(reviewStats.averageRating)
                            ? "fill-saffron text-saffron"
                            : "text-gray-300"
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {reviewStats.averageRating}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({reviewStats.totalReviews})
                  </span>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-white to-soft-beige/20 rounded-xl p-3 sm:p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2 sm:mb-4 flex items-center text-sm sm:text-lg">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Product Description
              </h3>
              <div className="space-y-3">
                <p className={`text-gray-700 leading-relaxed text-sm sm:text-base lg:text-lg transition-all duration-300 ${
                  isDescriptionExpanded 
                    ? '' 
                    : 'line-clamp-3 sm:line-clamp-none'
                }`}>
                  {product.description}
                </p>
                
                {/* Show More/Less button - only visible on mobile when description is long */}
                {product.description && product.description.length > 150 && (
                  <div className="block sm:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="text-terracotta hover:text-terracotta/80 hover:bg-terracotta/10 p-0 h-auto font-medium"
                    >
                      {isDescriptionExpanded ? (
                        <>
                          <span className="mr-1">Show less</span>
                          <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <span className="mr-1">Show more details</span>
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Product Features */}
            {product.features && product.features.length > 0 && (
              <div className="bg-gradient-to-br from-sage/10 to-soft-beige/30 rounded-xl p-3 sm:p-6 border border-sage/20 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-4 flex items-center text-sm sm:text-lg">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Key Features
                </h4>

                <div className="space-y-2">
                  <div className={`space-y-1.5 transition-all duration-300 ${
                    isFeaturesExpanded 
                      ? '' 
                      : 'max-h-24 sm:max-h-none overflow-hidden'
                  }`}>
                    {product.features.map((feature, index) => (
                      <div key={index} className="flex items-start text-sm">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-terracotta rounded-full mr-2 sm:mr-3 flex-shrink-0 mt-1"></div>
                        <span className="leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Show More/Less button - only visible on mobile when features are many */}
                  {product.features.length > 2 && (
                    <div className="block sm:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFeaturesExpanded(!isFeaturesExpanded)}
                        className="text-sage hover:text-sage/80 hover:bg-sage/10 p-0 h-auto font-medium"
                      >
                        {isFeaturesExpanded ? (
                          <>
                            <span className="mr-1">Show less</span>
                            <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            <span className="mr-1">Show more features</span>
                            <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Product Details */}
            <div className="bg-gradient-to-br from-white to-warm-cream/30 rounded-xl sm:rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-terracotta to-saffron p-3 sm:p-4 lg:p-6">
                <h3 className="font-semibold text-white text-lg sm:text-xl flex items-center">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">Product Details</span>
                  <span className="sm:hidden">Details</span>
                </h3>
              </div>
              <div className="p-3 sm:p-4">
                <div className="space-y-2">
                  <div className={`space-y-1.5 transition-all duration-300 ${
                    isDetailsExpanded 
                      ? '' 
                      : 'max-h-24 sm:max-h-none overflow-hidden'
                  }`}>
                    {[
                      { label: "Category", value: product.category.name, icon: "📂" },
                      { label: "SKU", value: product.sku, icon: "🏷️" },
                      { label: "Availability", value: product.stock > 0 ? `${product.stock} in stock` : "Out of stock", icon: "📦" },
                      { label: "Handmade", value: "Yes", icon: "🎨" },
                      { label: "Origin", value: "India", icon: "🇮🇳" }
                    ].map((detail, index) => (
                      <div key={index} className="flex items-center justify-between py-1.5 px-2 sm:px-3 bg-gray-50/50 rounded-md hover:bg-gray-100/50 transition-colors duration-200">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <span className="text-sm flex-shrink-0">{detail.icon}</span>
                          <span className="text-gray-700 font-medium text-xs sm:text-sm truncate">{detail.label}:</span>
                        </div>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm ml-2 text-right flex-shrink-0">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Show More/Less button - only visible on mobile */}
                  <div className="block sm:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                      className="text-terracotta hover:text-terracotta/80 hover:bg-terracotta/10 p-0 h-auto font-medium"
                    >
                      {isDetailsExpanded ? (
                        <>
                          <span className="mr-1">Show less</span>
                          <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <span className="mr-1">Show more details</span>
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <div className="flex items-center space-x-1 text-xs text-gray-600 bg-green-50 px-2 py-1 rounded-md">
                      <svg className="h-3 w-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="truncate">Authentic</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded-md">
                      <svg className="h-3 w-3 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="truncate">Fast Delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 sm:mt-16 border-t pt-6 sm:pt-12">
          <Reviews productId={productId} />
        </div>

        {/* Recommended Products Section */}
        {recommendedProducts.length > 0 && (
          <div className="mt-8 sm:mt-16 border-t pt-6 sm:pt-12">
            <div className="mb-4 sm:mb-8">
              <h2 className="font-display text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                You might also like
              </h2>
              <p className="text-sm sm:text-base text-gray-600 hidden sm:block">
                Products with similar features and from related categories
              </p>
            </div>

            {/* Same Category Products */}
            {recommendedProducts.filter(p => p.categoryId === product.categoryId).length > 0 && (
              <div className="mb-6 sm:mb-12">
                <h3 className="font-semibold text-sm sm:text-lg text-gray-900 mb-2 sm:mb-4 flex items-center flex-wrap">
                  <Badge variant="outline" className="mr-1 sm:mr-2 text-xs">{product.category.name}</Badge>
                  <span className="text-xs sm:text-base">More from this category</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-3 lg:gap-6">
                  {recommendedProducts
                    .filter(p => p.categoryId === product.categoryId)
                    .slice(0, 4)
                    .map((recommendedProduct) => (
                      <ProductCard 
                        key={recommendedProduct.id} 
                        product={recommendedProduct} 
                        showCategory={false}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Similar Features Products */}
            {recommendedProducts.filter(p => p.categoryId !== product.categoryId).length > 0 && (
              <div className="mb-4 sm:mb-8">
                <h3 className="font-semibold text-sm sm:text-lg text-gray-900 mb-2 sm:mb-4 flex items-center flex-wrap">
                  <Badge variant="outline" className="mr-1 sm:mr-2 bg-saffron/10 text-saffron border-saffron text-xs">Similar Features</Badge>
                  <span className="text-xs sm:text-base">Products with similar characteristics</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-3 lg:gap-6">
                  {recommendedProducts
                    .filter(p => p.categoryId !== product.categoryId)
                    .slice(0, 4)
                    .map((recommendedProduct) => (
                      <ProductCard 
                        key={recommendedProduct.id} 
                        product={recommendedProduct} 
                        showCategory={true}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* View More Links */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
              <Link href={`/products?category=${product?.category?.slug}`}>
                <Button variant="outline" className="border-terracotta text-terracotta hover:bg-terracotta hover:text-white text-sm py-2 w-full sm:w-auto">
                  View all {product?.category?.name}
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm py-2 w-full sm:w-auto">
                  Browse all products
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Fullscreen Image Modal */}
        <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
          <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 bg-black/95 border-none" onKeyDown={handleKeyDown}>
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 bg-black/20 hover:bg-black/40 text-white rounded-full w-12 h-12"
                onClick={() => setIsFullscreenOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Image Counter */}
              {product && product.images.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full z-50">
                  {fullscreenImageIndex + 1} / {product.images.length}
                </div>
              )}

              {/* Navigation Arrows */}
              {product && product.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/20 hover:bg-black/40 text-white rounded-full w-16 h-16"
                    onClick={handleFullscreenPrevious}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/20 hover:bg-black/40 text-white rounded-full w-16 h-16"
                    onClick={handleFullscreenNext}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}

              {/* Main Fullscreen Image */}
              <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
                <img
                  src={product?.images[fullscreenImageIndex] || "/placeholder-image.jpg"}
                  alt={product?.name}
                  className="max-w-[95vw] max-h-[80vh] sm:max-w-[90vw] sm:max-h-[85vh] w-auto h-auto object-contain"
                />
              </div>

              {/* Thumbnail Navigation */}
              {product && product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/60 p-2 sm:p-3 rounded-full max-w-[95vw] overflow-x-auto scrollbar-hide">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setFullscreenImageIndex(index)}
                      className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        fullscreenImageIndex === index
                          ? "border-white"
                          : "border-gray-500 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Instructions */}
              <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 text-white/70 text-xs sm:text-sm text-center px-4">
                <p>Use arrow keys to navigate • Press ESC to close</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}