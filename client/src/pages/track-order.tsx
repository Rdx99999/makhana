
import React, { useState } from "react";
import { Search, Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { trackOrder } from "@/lib/api";

const statusIcons = {
  pending: <Clock className="h-5 w-5 text-yellow-600" />,
  confirmed: <Package className="h-5 w-5 text-blue-600" />,
  shipped: <Truck className="h-5 w-5 text-purple-600" />,
  delivered: <CheckCircle className="h-5 w-5 text-green-600" />,
  cancelled: <XCircle className="h-5 w-5 text-red-600" />,
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function TrackOrder() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number");
      return;
    }

    setIsTracking(true);
    setError("");
    setOrderInfo(null);

    try {
      const result = await trackOrder(trackingNumber.trim());
      setOrderInfo(result);
    } catch (err: any) {
      setError(err.message || "Order not found");
    } finally {
      setIsTracking(false);
    }
  };

  const getStatusSteps = (currentStatus: string) => {
    const steps = [
      { key: "pending", label: "Order Placed", description: "Your order has been received" },
      { key: "confirmed", label: "Confirmed", description: "Order confirmed and being prepared" },
      { key: "shipped", label: "Shipped", description: "Order is on its way" },
      { key: "delivered", label: "Delivered", description: "Order has been delivered" },
    ];

    const statusOrder = ["pending", "confirmed", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-lg text-gray-600">
            Enter your tracking number to see the current status of your order
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enter Tracking Number</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tracking">Tracking Number</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                  placeholder="Enter your tracking number (e.g., TRKXXXXXXXX)"
                  className="font-mono"
                  onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                />
                <Button onClick={handleTrack} disabled={isTracking}>
                  <Search className="h-4 w-4 mr-2" />
                  {isTracking ? "Tracking..." : "Track"}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-red-600 mt-2">{error}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {orderInfo && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Order Details</span>
                  <Badge className={statusColors[orderInfo.status as keyof typeof statusColors]}>
                    {statusIcons[orderInfo.status as keyof typeof statusIcons]}
                    <span className="ml-2 capitalize">{orderInfo.status}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Order ID</Label>
                    <p className="text-lg font-medium">#{orderInfo.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Tracking Number</Label>
                    <p className="text-lg font-mono">{orderInfo.trackingNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Customer</Label>
                    <p className="text-lg">{orderInfo.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Order Total</Label>
                    <p className="text-lg font-medium">₹{parseFloat(orderInfo.total).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Order Date</Label>
                    <p className="text-lg">{new Date(orderInfo.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {orderInfo.status !== "cancelled" && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {getStatusSteps(orderInfo.status).map((step, index) => (
                      <div key={step.key} className="flex items-start">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed 
                            ? 'bg-terracotta text-white' 
                            : step.active 
                              ? 'bg-terracotta/20 text-terracotta border-2 border-terracotta'
                              : 'bg-gray-200 text-gray-400'
                        }`}>
                          {step.completed ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className={`text-lg font-medium ${
                            step.completed || step.active ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {step.label}
                          </h3>
                          <p className={`text-sm ${
                            step.completed || step.active ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
