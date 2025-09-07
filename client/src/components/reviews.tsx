import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Edit, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getProductReviews, getProductReviewStats, createReview, deleteReview } from "@/lib/api";

interface ReviewsProps {
  productId: number;
}

interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
}

interface Review {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}

export function Reviews({ productId }: ReviewsProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    rating: 5,
    title: "",
    comment: "",
  });

  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/products", productId, "reviews"],
    queryFn: () => getProductReviews(productId),
  });

  const { data: reviewStats } = useQuery<ReviewStats>({
    queryKey: ["/api/products", productId, "review-stats"],
    queryFn: () => getProductReviewStats(productId),
  });

  const createReviewMutation = useMutation({
    mutationFn: (data: ReviewFormData) => createReview(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "review-stats"] });
      setIsReviewDialogOpen(false);
      setReviewForm({ rating: 5, title: "", comment: "" });
      toast({
        title: "Review Submitted",
        description: "Thank you for your review!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: number) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "review-stats"] });
      toast({
        title: "Review Deleted",
        description: "Your review has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <button
            key={i}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onRatingChange?.(i + 1) : undefined}
            className={interactive ? "cursor-pointer focus:outline-none" : undefined}
          >
            <Star className={`h-4 w-4 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`} />
          </button>
        ))}
      </div>
    );
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    createReviewMutation.mutate(reviewForm);
  };

  const userHasReviewed = user && reviews.some((review: Review) => review.userId === user.id);

  return (
    <div className="space-y-8">
      {/* Review Stats */}
      {reviewStats && reviewStats.totalReviews > 0 && (
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <h3 className="font-semibold text-base sm:text-lg">Customer Reviews</h3>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                  {reviewStats.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-1 sm:mb-2">
                  <div className="flex space-x-0.5">
                    {renderStars(Math.round(reviewStats.averageRating))}
                  </div>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Based on {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-1 sm:space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2 sm:space-x-3">
                    <div className="flex items-center space-x-1 w-10 sm:w-16">
                      <span className="text-xs sm:text-sm">{rating}</span>
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <Progress
                      value={(reviewStats.ratingDistribution[rating] / reviewStats.totalReviews) * 100}
                      className="flex-1 h-1.5 sm:h-2"
                    />
                    <span className="text-xs sm:text-sm text-gray-600 w-4 sm:w-8">
                      {reviewStats.ratingDistribution[rating]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Write Review Button */}
      {isAuthenticated && !userHasReviewed && (
        <div className="text-center">
          <Button
            onClick={() => setIsReviewDialogOpen(true)}
            className="bg-terracotta hover:bg-terracotta/90 text-sm sm:text-base px-3 sm:px-4 py-2"
            size="sm"
          >
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Write a Review</span>
            <span className="sm:hidden">Review</span>
          </Button>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="font-semibold text-base sm:text-lg">
          Reviews ({reviews.length})
        </h3>

        {reviewsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 sm:space-y-4">
            {reviews.map((review: Review) => (
              <Card key={review.id}>
                <CardContent className="pt-3 sm:pt-6 pb-3 sm:pb-6">
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 bg-terracotta text-white">
                        <span className="text-xs sm:text-sm font-semibold">
                          {review.userName.charAt(0).toUpperCase()}
                        </span>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm sm:text-base">{review.userName}</p>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <div className="flex space-x-0.5">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {user && user.id === review.userId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteReviewMutation.mutate(review.id)}
                        className="text-red-600 hover:text-red-700 h-6 w-6 sm:h-8 sm:w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                  </div>
                  <h4 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">{review.title}</h4>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              {renderStars(reviewForm.rating, true, (rating) =>
                setReviewForm({ ...reviewForm, rating })
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                placeholder="Sum up your review in a few words"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Review</label>
              <Textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Share your thoughts about this product"
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {reviewForm.comment.length}/1000 characters
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReviewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createReviewMutation.isPending}
                className="bg-terracotta hover:bg-terracotta/90"
              >
                {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
