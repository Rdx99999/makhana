import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getCategories, createProduct, updateProduct, deleteImage } from "@/lib/api";
import type { Product, InsertProduct } from "@shared/schema";

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.string().min(1, "Price is required"),
  categoryId: z.number().min(1, "Category is required"),
  stock: z.number().min(0, "Stock must be non-negative"),
  sku: z.string().min(1, "SKU is required"),
  featured: z.boolean().default(false),
  images: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: getCategories,
  });

  const { data: existingProducts = [] } = useQuery({
    queryKey: ["/api/products-with-category"],
    queryFn: async () => {
      const response = await fetch('/api/products-with-category');
      return response.json();
    },
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || "",
      categoryId: product?.categoryId || 0,
      stock: product?.stock || 0,
      sku: product?.sku || "",
      featured: product?.featured || false,
      images: product?.images || [],
      features: product?.features || [],
    },
  });

  // Generate SKU based on category
  const generateSKU = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return "";

    // Create category prefix from first 3-4 letters of category name
    const prefix = category.name
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 4)
      .toUpperCase();

    // Find highest existing SKU number for this category
    const categoryProducts = existingProducts.filter(p => p.categoryId === categoryId);
    const existingNumbers = categoryProducts
      .map(p => p.sku)
      .filter(sku => sku.startsWith(prefix))
      .map(sku => {
        const match = sku.match(/(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => !isNaN(num));

    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  };

  // Auto-generate SKU when category changes (only for new products)
  useEffect(() => {
    const categoryId = form.watch("categoryId");
    const currentSku = form.watch("sku");
    
    // Only auto-generate for new products or if SKU is empty
    if (!product && categoryId && categoryId > 0 && !currentSku) {
      const newSku = generateSKU(categoryId);
      if (newSku) {
        form.setValue("sku", newSku);
      }
    }
  }, [form.watch("categoryId"), categories, existingProducts]);

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products-with-category"] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InsertProduct>) => updateProduct(product!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products-with-category"] });
      toast({
        title: "Success", 
        description: "Product updated successfully",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (product) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }

    const data = await response.json();
    const currentImages = form.getValues("images");
    form.setValue("images", [...currentImages, data.imageUrl]);
    
    return data;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      await Promise.all(uploadPromises);
      
      toast({
        title: "Success",
        description: `${files.length} image(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Some images failed to upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const removeImage = async (index: number) => {
    const currentImages = form.getValues("images");
    const imageToDelete = currentImages[index];
    
    try {
      // Delete the image file from server
      await deleteImage(imageToDelete);
      
      // Remove from form
      form.setValue("images", currentImages.filter((_, i) => i !== index));
      
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {product ? "Edit Product" : "Add New Product"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter product name"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sku">SKU</Label>
              <div className="flex space-x-2">
                <Input
                  id="sku"
                  {...form.register("sku")}
                  placeholder="Enter SKU or select category to auto-generate"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const categoryId = form.watch("categoryId");
                    if (categoryId && categoryId > 0) {
                      const newSku = generateSKU(categoryId);
                      if (newSku) {
                        form.setValue("sku", newSku);
                        toast({
                          title: "SKU Generated",
                          description: `New SKU: ${newSku}`,
                        });
                      }
                    } else {
                      toast({
                        title: "Select Category",
                        description: "Please select a category first",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={!form.watch("categoryId") || form.watch("categoryId") === 0}
                >
                  Generate
                </Button>
              </div>
              {form.formState.errors.sku && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.sku.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Enter product description"
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...form.register("price")}
                placeholder="0.00"
              />
              {form.formState.errors.price && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.price.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                {...form.register("stock", { valueAsNumber: true })}
                placeholder="0"
              />
              {form.formState.errors.stock && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.stock.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.watch("categoryId")?.toString() || ""}
                onValueChange={(value) => form.setValue("categoryId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryId && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.categoryId.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={form.watch("featured")}
              onCheckedChange={(checked) => form.setValue("featured", checked)}
            />
            <Label htmlFor="featured">Featured Product</Label>
          </div>

          {/* Product Features */}
          <div>
            <Label>Product Features</Label>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  id="new-feature"
                  placeholder="Enter a product feature"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      const value = input.value.trim();
                      if (value) {
                        const currentFeatures = form.getValues("features");
                        form.setValue("features", [...currentFeatures, value]);
                        input.value = '';
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById('new-feature') as HTMLInputElement;
                    const value = input.value.trim();
                    if (value) {
                      const currentFeatures = form.getValues("features");
                      form.setValue("features", [...currentFeatures, value]);
                      input.value = '';
                    }
                  }}
                >
                  Add Feature
                </Button>
              </div>
              
              {form.watch("features").length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Features ({form.watch("features").length})
                  </h4>
                  <div className="space-y-2">
                    {form.watch("features").map((feature, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">• {feature}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                          onClick={() => {
                            const currentFeatures = form.getValues("features");
                            form.setValue("features", currentFeatures.filter((_, i) => i !== index));
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Press Enter or click "Add Feature" to add a new feature
              </p>
            </div>
          </div>

          {/* Images */}
          <div>
            <Label>Product Images</Label>
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <span className="text-terracotta font-medium hover:text-terracotta/80">Click to upload</span>
                        <span> or drag and drop</span>
                      </label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                        multiple
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WebP or GIF up to 10MB each
                    </p>
                  </div>
                </div>
              </div>

              {uploading && (
                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-terracotta"></div>
                  <span className="ml-2 text-sm text-gray-600">Uploading images...</span>
                </div>
              )}

              {form.watch("images").length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Product Images ({form.watch("images").length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {form.watch("images").map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
                          <img
                            src={url}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg" />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                          disabled={uploading}
                        >
                          ×
                        </Button>
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                          {index === 0 ? 'Main' : index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    The first image will be used as the main product image
                  </p>
                </div>
              )}
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
              {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
