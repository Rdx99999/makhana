import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Clock, CheckCircle, Truck, X, Eye, User, Mail, Calendar, ShoppingBag, Star, Award, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { getOrders } from "@/lib/api";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const { wishlistItems, isLoading: isWishlistLoading, toggleWishlist } = useWishlist();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: getOrders,
    enabled: isAuthenticated,
  });

  // Filter orders for current user
  const userOrders = orders.filter(order => order.userId === user?.id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <Package className="h-4 w-4" />;
      case "cancelled":
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-purple-100 text-purple-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-warm-cream flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h1>
            <p className="text-gray-600 mb-6">
              You need to be logged in to view your profile.
            </p>
            <Link href="/login">
              <Button className="bg-terracotta hover:bg-terracotta/90">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-cream">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-terracotta font-display mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account and view your orders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-1">
            <Card className="border-terracotta/20 shadow-lg bg-white mb-6">
              <CardHeader className="bg-gradient-to-r from-terracotta/10 to-saffron/10 rounded-t-lg border-b border-terracotta/20">
                <CardTitle className="flex items-center text-terracotta font-display">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 mb-1 block">Full Name</Label>
                    <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 mb-1 block">Email</Label>
                    <p className="text-gray-700 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-terracotta" />
                      {user?.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 mb-1 block">Member Since</Label>
                    <p className="text-gray-700 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-terracotta" />
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wishlist Preview */}
            <Card className="border-terracotta/20 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-saffron/10 to-warm-gold/10 rounded-t-lg border-b border-saffron/20">
                <CardTitle className="flex items-center justify-between text-saffron font-display">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>My Wishlist ({wishlistItems.length})</span>
                  </div>
                  {wishlistItems.length > 0 && (
                    <Link href="/wishlist">
                      <Button variant="outline" size="sm" className="border-saffron text-saffron hover:bg-saffron hover:text-white">
                        View All
                      </Button>
                    </Link>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isWishlistLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading wishlist...</p>
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-gradient-to-br from-saffron/10 to-warm-gold/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-saffron/20">
                      <Star className="w-8 h-8 text-saffron" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 font-display">No favorites yet</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Start adding products you love to your wishlist
                    </p>
                    <Link href="/products">
                      <Button className="bg-gradient-to-r from-saffron to-warm-gold hover:from-saffron/90 hover:to-warm-gold/90 text-white px-6 py-2 rounded-lg font-medium shadow-md transition-all duration-200 hover:shadow-lg">
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                      {wishlistItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gradient-to-r from-saffron/5 to-warm-gold/5 rounded-lg border border-saffron/10 hover:border-saffron/20 transition-all duration-200">
                          <img
                            src={item.images?.[0] || '/placeholder-image.jpg'}
                            alt={item.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg border border-saffron/20 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{item.name}</h4>
                            <p className="text-terracotta font-semibold text-xs sm:text-sm">₹{parseFloat(item.price).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                            <Link href={`/products/${item.id}`}>
                              <Button variant="outline" size="sm" className="text-xs border-gray-300 hover:bg-gray-50 px-2 py-1">
                                View
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleWishlist(item.id)}
                              className="text-red-500 hover:bg-red-50 p-1"
                            >
                              <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {wishlistItems.length > 3 && (
                      <div className="text-center pt-3 border-t border-saffron/10">
                        <Link href="/wishlist">
                          <Button variant="outline" className="border-saffron text-saffron hover:bg-saffron hover:text-white">
                            View {wishlistItems.length - 3} More Items
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Orders List */}
          <div className="lg:col-span-2">
            <Card className="border-terracotta/20 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-terracotta/10 to-saffron/10 rounded-t-lg border-b border-terracotta/20">
                <CardTitle className="flex items-center justify-between text-terracotta font-display">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>My Orders ({userOrders.length})</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your orders...</p>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-terracotta/10 to-saffron/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border border-terracotta/20">
                      <Package className="w-12 h-12 text-terracotta" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 font-display">No orders yet</h3>
                    <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                      Start your journey with premium makhana. Explore our beautiful collection of natural snacks.
                    </p>
                    <Link href="/products">
                      <Button className="bg-gradient-to-r from-terracotta to-saffron hover:from-terracotta/90 hover:to-saffron/90 text-white px-8 py-3 rounded-lg font-medium shadow-lg transition-all duration-200 hover:shadow-xl">
                        Start Shopping
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userOrders.map((order) => (
                      <div key={order.id} className="relative overflow-hidden rounded-lg sm:rounded-xl border border-terracotta/20 bg-white hover:shadow-xl transition-all duration-300 group hover:border-terracotta/40">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-terracotta to-saffron"></div>
                        <div className="p-3 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
                                  order.status === "delivered" ? "bg-green-100 text-green-600" :
                                  order.status === "shipped" ? "bg-blue-100 text-blue-600" :
                                  order.status === "confirmed" ? "bg-purple-100 text-purple-600" :
                                  order.status === "cancelled" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
                                }`}>
                                  {getStatusIcon(order.status)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-gray-900 font-display text-sm sm:text-base">Order #{order.id}</h3>
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge className={`${getStatusColor(order.status)} px-2 sm:px-3 py-1 text-xs font-medium rounded-full flex-shrink-0`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-terracotta text-terracotta hover:bg-terracotta hover:text-white transition-all duration-200 hover:shadow-md"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  <span className="text-xs sm:text-sm">View Details</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto bg-gradient-to-br from-warm-cream to-soft-beige">
                                <DialogHeader className="border-b border-terracotta/20 pb-4">
                                  <DialogTitle className="text-2xl font-bold text-terracotta font-display flex items-center">
                                    <Package className="h-6 w-6 mr-2" />
                                    Order Details
                                  </DialogTitle>
                                  <DialogDescription className="text-gray-600">
                                    Complete information about your order
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 pt-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium text-gray-700">Order ID</Label>
                                      <p className="text-lg font-semibold text-terracotta">#{order.id}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-gray-700">Status</Label>
                                      <Badge className={`${getStatusColor(order.status)} px-3 py-1 text-sm font-medium rounded-full mt-1`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <Separator className="bg-terracotta/20" />
                                  
                                  <div>
                                    <Label className="text-lg font-semibold text-gray-900 mb-3 block">Order Summary</Label>
                                    <div className="bg-white rounded-lg p-4 border border-terracotta/20">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-lg font-semibold">Total Amount</span>
                                        <span className="text-3xl font-bold text-terracotta">₹{parseFloat(order.total).toLocaleString()}</span>
                                      </div>
                                      <p className="text-sm text-gray-600">
                                        Ordered on {new Date(order.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                            <div className="bg-soft-beige rounded-lg p-2 sm:p-4 border border-terracotta/10">
                              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Tracking Number</p>
                              <p className="font-mono text-xs sm:text-sm bg-white px-2 py-1 rounded border border-terracotta/20 text-terracotta truncate">{order.trackingNumber}</p>
                            </div>
                            <div className="bg-soft-beige rounded-lg p-2 sm:p-4 border border-terracotta/10">
                              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Amount</p>
                              <p className="text-lg sm:text-xl font-bold text-terracotta">₹{parseFloat(order.total).toLocaleString()}</p>
                            </div>
                            <div className="bg-soft-beige rounded-lg p-2 sm:p-4 border border-terracotta/10">
                              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Order Date</p>
                              <p className="font-medium text-gray-900 text-sm sm:text-base">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}