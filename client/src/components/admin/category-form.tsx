import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createCategory, updateCategory, uploadCategoryImage, deleteImage } from "@/lib/api";
import type { Category, InsertCategory } from "@shared/schema";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category?: Category;
  onSuccess?: () => void;
}

export function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(category?.thumbnail || null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      slug: category?.slug || "",
      description: category?.description || "",
      thumbnail: category?.thumbnail || null,
    },
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InsertCategory>) => updateCategory(category!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success", 
        description: "Category updated successfully",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CategoryFormData) => {
    try {
      let finalData = { ...data };
      
      // Upload thumbnail if a new file is selected
      if (thumbnailFile) {
        setIsUploadingThumbnail(true);
        try {
          const result = await uploadCategoryImage(thumbnailFile);
          finalData.thumbnail = result.imageUrl;
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload thumbnail image",
            variant: "destructive",
          });
          return;
        } finally {
          setIsUploadingThumbnail(false);
        }
      }
      
      if (category) {
        updateMutation.mutate(finalData);
      } else {
        createMutation.mutate(finalData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving the category",
        variant: "destructive",
      });
    }
  };

  // Handle thumbnail upload
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = async () => {
    if (form.watch("thumbnail")) {
      try {
        await deleteImage(form.watch("thumbnail"));
        toast({
          title: "Success",
          description: "Image deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Warning",
          description: "Failed to delete image file, but continuing",
          variant: "destructive",
        });
      }
    }
    setThumbnailFile(null);
    setThumbnailPreview(null);
    form.setValue("thumbnail", null);
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    if (!category) { // Only auto-generate slug for new categories
      form.setValue("slug", generateSlug(name));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isUploadingThumbnail;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {category ? "Edit Category" : "Add New Category"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              onChange={handleNameChange}
              placeholder="Enter category name"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="slug">URL Slug</Label>
            <Input
              id="slug"
              {...form.register("slug")}
              placeholder="category-url-slug"
            />
            <p className="text-gray-500 text-sm mt-1">
              Used in URLs. Only lowercase letters, numbers, and hyphens allowed.
            </p>
            {form.formState.errors.slug && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Enter category description (optional)"
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div>
            <Label>Category Thumbnail</Label>
            <div className="mt-2">
              {thumbnailPreview ? (
                <div className="relative">
                  <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    <img
                      src={thumbnailPreview}
                      alt="Category thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeThumbnail}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Image className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">No image</span>
                </div>
              )}
              
              <div className="mt-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <Label
                  htmlFor="thumbnail-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {thumbnailPreview ? "Change Image" : "Upload Image"}
                </Label>
                <p className="text-gray-500 text-sm mt-1">
                  Upload a thumbnail image for this category (max 5MB)
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onSuccess}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-terracotta hover:bg-terracotta/90"
            >
              {isLoading ? "Saving..." : category ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}