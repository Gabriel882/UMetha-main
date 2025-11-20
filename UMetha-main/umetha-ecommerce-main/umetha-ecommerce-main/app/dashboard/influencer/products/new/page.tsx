"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ImagePlus, 
  Plus, 
  ArrowLeft, 
  Trash2, 
  Upload,
  X,
  Save,
  Eye,
  Loader2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface ProductFormData {
  name: string;
  description: string;
  price: number | string;
  category_id: string;   // FIXED
  stock: number | string;
  sku: string;
  images: string[];
  featured: boolean;
  status: "draft" | "active" | "inactive";
  tags: string[];
  weight: number | string | null;
  dimensions: {
    length: number | string | null;
    width: number | string | null;
    height: number | string | null;
  };

  // SEO
  seoTitle: string;
  seoDescription: string;

  // Shipping
  carrier: "ups" | "fedex" | "dhl" | "";
  apiKey: string;
  apiSecret: string;
  accountNumber: string;
  packageType: "box" | "envelope" | "pallet" | "";
  declaredValue: number | string | null;
}

const categories = [
  "Fashion",
  "Beauty",
  "Fitness",
  "Lifestyle",
  "Electronics",
  "Home & Decor",
  "Travel",
  "Food & Beverage",
  "Books",
  "Other"
];

export default function NewProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    category_id: "",
    stock: 0,
    sku: "",
    images: [],
    featured: false,
    status: "draft",
    tags: [],
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    seoTitle: "",
    seoDescription: "",

    carrier: "",
    apiKey: "",
    apiSecret: "",
    accountNumber: "",
    packageType: "",
    declaredValue: null,
  });

  const [newTag, setNewTag] = useState("");

  // Shipping result
  const [shippingInfo, setShippingInfo] = useState<any>(null);

  // Mock functions
  const fetchShippingRates = async () => {
    setShippingInfo({
      status: "success",
      message: "Mock: Shipping rates retrieved",
      rates: [
        { service: "Ground", price: 12.50 },
        { service: "Express", price: 24.75 }
      ]
    });
  };

  const schedulePickup = async () => {
    setShippingInfo({
      status: "success",
      message: "Mock: Pickup scheduled successfully",
    });
  };

  const trackShipment = async () => {
    setShippingInfo({
      status: "success",
      message: "Mock: Tracking info",
      tracking: {
        status: "In Transit",
        eta: "2025-01-18"
      }
    });
  };

  /** Handles all form updates, supports nested fields */
  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  /** Image Upload */
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const uploadPromises = Array.from(files).map(async (file) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    });

    try {
      const uploadedUrls = await Promise.all(uploadPromises);

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
      toast.success("Images uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload images");
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  /** Tag functions */
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  /** Submit handler */
  const handleSubmit = async (status: "draft" | "active") => {
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    // VALIDATION FIXES
    if (!formData.name.trim()) return toast.error("Name required");
    if (!formData.description.trim()) return toast.error("Description required");
    if (!formData.price || Number(formData.price) <= 0) return toast.error("Valid price required");
    if (!formData.category_id) return toast.error("Category required");

    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category_id: formData.category_id,
        stock: Number(formData.stock),
        sku: formData.sku || `PROD-${Date.now()}`,
        images: formData.images,
        featured: formData.featured,
        status,
        tags: formData.tags,
        weight: Number(formData.weight) || null,
        dimensions: {
          length: Number(formData.dimensions.length),
          width: Number(formData.dimensions.width),
          height: Number(formData.dimensions.height),
        },
        seo_title: formData.seoTitle,
        seo_description: formData.seoDescription,

        influencer_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        // shipping fields
        carrier: formData.carrier,
        api_key: formData.apiKey,
        api_secret: formData.apiSecret,
        account_number: formData.accountNumber,
        package_type: formData.packageType,
        declared_value: Number(formData.declaredValue) || null,
      };

      const { data, error } = await supabase
        .from("influencer_products")
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      toast.success(`Product ${status === "draft" ? "saved" : "published"} successfully!`);
      router.push("/dashboard/influencer/products");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  //          JSX RETURN
  // ================================

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/influencer/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Product</h1>
            <p className="text-gray-500">Add a new product to your store</p>
          </div>
        </div>

        {/* Save buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => handleSubmit("draft")}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Draft
          </Button>

          <Button 
            onClick={() => handleSubmit("active")}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-500 to-purple-500"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            Publish
          </Button>
        </div>
      </div>

      {/* =================== TABS ===================== */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* BASIC INFO TAB */}
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle>Product Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">

                  {/* Name */}
                  <div>
                    <Label>Product Name *</Label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label>Description *</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Price */}
                    <div>
                      <Label>Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <Label>Category *</Label>
                      <Select 
                        value={formData.category_id}
                        onValueChange={(v) => handleInputChange("category_id", v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c} value={c.toLowerCase()}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* TAGS */}
              <Card>
                <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
                <CardContent className="space-y-4">

                  <div className="flex gap-2">
                    <Input 
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyDown={(e) => e.key === "Enter" && addTag()}
                    />
                    <Button onClick={addTag} variant="outline"><Plus /></Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} className="flex gap-1 items-center">
                        {tag}
                        <X 
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* STATUS */}
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Status</CardTitle></CardHeader>
                <CardContent className="space-y-4">

                  <div className="flex items-center justify-between">
                    <Label>Featured Product</Label>
                    <Switch 
                      checked={formData.featured}
                      onCheckedChange={(v) => handleInputChange("featured", v)}
                    />
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select 
                      value={formData.status}
                      onValueChange={(v) => handleInputChange("status", v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============ MEDIA TAB ============ */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Images</CardTitle></CardHeader>
            <CardContent className="space-y-4">

              <div className="border-2 border-dashed p-6 rounded-lg text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Upload product images</p>

                <input 
                  type="file"
                  multiple
                  accept="image/*"
                  id="image-upload"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <Button asChild>
                  <label htmlFor="image-upload"><ImagePlus className="mr-2 h-4 w-4" /> Choose</label>
                </Button>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative group">
                      <Image 
                        src={img}
                        alt="Product"
                        width={200}
                        height={200}
                        className="rounded-lg object-cover h-32 w-full"
                      />
                      <Button 
                        size="sm"
                        onClick={() => removeImage(i)}
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                      >
                        <X />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>

{/* ============ INVENTORY TAB ============ */}
<TabsContent value="inventory" className="space-y-6">

  {/* Inventory + Physical Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

    {/* Inventory */}
    <Card>
      <CardHeader>
        <CardTitle>Inventory</CardTitle>
       <p className="text-sm text-muted-foreground">
  Connect shipping carriers to manage shipments.
</p>

      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label>Label / SKU</Label>
          <Input
            placeholder="SKU12345"
            value={formData.sku}
            onChange={(e) => handleInputChange("sku", e.target.value)}
          />
        </div>

        <div>
          <Label>Stock</Label>
          <Input
            type="number"
            placeholder="0"
            value={formData.stock ?? ""}
            onChange={(e) => handleInputChange("stock", Number(e.target.value))}
          />
        </div>
      </CardContent>
    </Card>

    {/* Physical Properties */}
    <Card>
      <CardHeader>
        <CardTitle>Physical Properties</CardTitle>
        <p>Dimensions and weight for shipping.</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label>Weight (lbs)</Label>
          <Input
            type="number"
            placeholder="0.0"
            value={formData.weight ?? ""}
            onChange={(e) => handleInputChange("weight", Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Length (in)</Label>
            <Input
              type="number"
              value={formData.dimensions.length ?? ""}
              onChange={(e) =>
                handleInputChange("dimensions.length", Number(e.target.value))
              }
            />
          </div>

          <div>
            <Label>Width (in)</Label>
            <Input
              type="number"
              value={formData.dimensions.width ?? ""}
              onChange={(e) =>
                handleInputChange("dimensions.width", Number(e.target.value))
              }
            />
          </div>

          <div>
            <Label>Height (in)</Label>
            <Input
              type="number"
              value={formData.dimensions.height ?? ""}
              onChange={(e) =>
                handleInputChange("dimensions.height", Number(e.target.value))
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>

  </div>
{/* ============ SHIPPING INTEGRATION ============ */}
<Card>
  <CardHeader>
    <CardTitle>Shipping & Carrier Integrations</CardTitle>
    <p className="text-sm text-muted-foreground">
      Connect a carrier and create shipments for orders.
    </p>
  </CardHeader>

  <CardContent className="space-y-6">

    {/* Carrier Select */}
    <div>
      <Label>Carrier</Label>

      <Select
        value={formData.carrier}
        onValueChange={(value) => handleInputChange("carrier", value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select carrier" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="ups">UPS</SelectItem>
          <SelectItem value="fedex">FedEx</SelectItem>
          <SelectItem value="dhl">DHL</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Redirect Button */}
    {formData.carrier && (
      <Button
        className="w-full"
        onClick={() =>
          router.push("/dashboard/influencer/shipping/create-shipment")
        }
      >
        Setup Shipping
      </Button>
    )}

    {/* Package Options */}
    <div className="grid md:grid-cols-2 gap-4">

      <div>
        <Label>Package Type</Label>

        <Select
          value={formData.packageType}
          onValueChange={(value) =>
            handleInputChange("packageType", value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select package" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="box">Box</SelectItem>
            <SelectItem value="envelope">Envelope</SelectItem>
            <SelectItem value="pallet">Pallet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Declared Value ($)</Label>
        <Input
          type="number"
          placeholder="0.00"
          value={formData.declaredValue ?? ""}
          onChange={(e) =>
            handleInputChange("declaredValue", Number(e.target.value))
          }
        />
      </div>
    </div>

    {/* Preview */}
    {shippingInfo && (
      <div className="p-4 border bg-muted rounded-md">
        <pre className="text-sm">
          {JSON.stringify(shippingInfo, null, 2)}
        </pre>
      </div>
    )}
  </CardContent>
</Card>

</TabsContent>



        {/* ============ SEO TAB ============ */}
        <TabsContent value="seo">
          <Card>
            <CardHeader><CardTitle>SEO Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">

              <div>
                <Label>SEO Title</Label>
                <Input 
                  value={formData.seoTitle}
                  onChange={(e) => handleInputChange("seoTitle", e.target.value)}
                />
              </div>

              <div>
                <Label>SEO Description</Label>
                <Textarea 
                  rows={3}
                  value={formData.seoDescription}
                  onChange={(e) => handleInputChange("seoDescription", e.target.value)}
                />
              </div>

            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
