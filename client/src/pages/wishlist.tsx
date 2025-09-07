
import { Heart, ArrowLeft, Trash2, ShoppingCart, Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Wishlist() {
  const { isAuthenticated } = useAuth();
  const { wishlistItems, isLoading, toggleWishlist } = useWishlist();
  const { addToCart, isAddingToCart } = useCart();
  const { toast } = useToast();

  const addToCartFromWishlist = (item: any) => {
    addToCart({
      productId: item.id,
      quantity: 1,
    });

    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart.`,
    });
  };

  const clearWishlist = () => {
    // Remove all items from wishlist
    wishlistItems.forEach(item => {
      toggleWishlist(item.id);
    });
    
    toast({
      title: "Wishlist Cleared",
      description: "All items have been removed from your wishlist.",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-warm-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-4">
              Please Login
            </h1>
            <p className="text-gray-600 mb-8">
              You need to be logged in to view your wishlist.
            </p>
            <Link href="/">
              <Button size="lg" className="bg-terracotta hover:bg-terracotta/90">
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-terracotta" />
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            {wishlistItems.length > 0 && (
              <Badge className="bg-terracotta text-white">
                {wishlistItems.length} items
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Link href="/products">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
            {wishlistItems.length > 0 && (
              <Button 
                variant="outline" 
                onClick={clearWishlist}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start browsing our collection and add items to your wishlist to save them for later.
            </p>
            <Link href="/products">
              <Button className="bg-terracotta hover:bg-terracotta/90 text-white">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative">
                  <img
                    src={item.images?.[0] || '/placeholder-image.jpg'}
                    alt={item.name}
                    className="w-full h-32 sm:h-48 object-cover"
                  />
                  <button
                    onClick={() => toggleWishlist(item.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/80 hover:bg-white text-red-500 rounded-full flex items-center justify-center transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm sm:text-base">{item.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="text-lg sm:text-2xl font-bold text-terracotta">
                      ₹{parseFloat(item.price).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Link href={`/products/${item.id}`} className="flex-1">
                      <Button variant="outline" className="w-full border-terracotta text-terracotta hover:bg-terracotta hover:text-white text-xs sm:text-sm">
                        View Details
                      </Button>
                    </Link>
                    <Button
                      onClick={() => addToCartFromWishlist(item)}
                      disabled={isAddingToCart}
                      className="flex-1 bg-terracotta hover:bg-terracotta/90 text-white text-xs sm:text-sm"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
