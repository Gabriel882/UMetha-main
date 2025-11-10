"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  Package2,
  AlertCircle,
  MoreVertical,
  Edit,
  Copy,
  Archive,
  Trash,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";



interface Product {
  id: string;
  name: string;
  images: string[];
  price: number;
  status: string;
  stock: number;
  category_id: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  onRowSelection?: (selectedIds: string[]) => void;
}



export default function ProductsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    outOfStock: 0,
  });



const [cjProducts, setCjProducts] = useState<Product[]>([]);
const [cjLoading, setCjLoading] = useState(false);

const fetchCJProducts = async (query = "") => {
  setCjLoading(true);
  try {
    const response = await fetch(`/api/cj-products?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (response.ok) {
      setCjProducts(data.products || []);
    } else {
      throw new Error(data.error || "Failed to fetch CJ products");
    }
  } catch (error) {
    console.error("Error fetching CJ products:", error);
    toast.error("Failed to load CJ Dropshipping products");
  } finally {
    setCjLoading(false);
  }
};

  

  // Fetch products
  const fetchProducts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/influencer-products?influencerId=${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products || []);
        
        // Calculate stats
        const total = data.products?.length || 0;
        const active = data.products?.filter((p: Product) => p.status === 'active').length || 0;
        const outOfStock = data.products?.filter((p: Product) => p.stock === 0).length || 0;
        
        setStats({ total, active, outOfStock });
      } else {
        throw new Error(data.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/influencer-products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Product deleted successfully');
        fetchProducts(); // Refresh the list
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateStatus = async (productId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/influencer-products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
        fetchProducts(); // Refresh the list
      } else {
        throw new Error('Failed to update product status');
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status');
    }
  };

  const statsData = [
    {
      title: "Total Products",
      value: stats.total.toString(),
      trend: "+12%",
      icon: Package2,
    },
    {
      title: "Active Products",
      value: stats.active.toString(),
      trend: "+5%",
      icon: TrendingUp,
    },
    {
      title: "Out of Stock",
      value: stats.outOfStock.toString(),
      trend: "-2%",
      icon: AlertCircle,
      trendColor: "text-red-500",
    },
  ];

  const columns: ColumnDef<Product>[] = [
  {
    id: "select",
    header: ({ table }: { table: Table<Product> }) => (
      <Checkbox
        checked={
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          table.getFilteredRowModel().rows.length ===
            table.getFilteredSelectedRowModel().rows.length
        }
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }: { row: Row<Product> }) => (
      <Checkbox
        checked={row.getIsSelected?.() || false}
        onCheckedChange={(value) => row.toggleSelected?.(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }: { row: Row<Product> }) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 rounded-md">
          {row.original.images?.length ? (
            <Image
              src={row.original.images[0]}
              alt={row.original.name}
              width={40}
              height={40}
              className="object-cover rounded-md"
            />
          ) : (
            <Package className="h-5 w-5 text-gray-400" />
          )}
        </Avatar>
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {row.original.category_id}
          </p>
          {row.original.featured && (
            <Badge variant="secondary" className="text-xs">
              Featured
            </Badge>
          )}
        </div>
      </div>
    ),
  },
    {
      accessorKey: "price",
      header: () => <div className="text-right">Price</div>,
    cell: ({ row }: { row: Row<Product> }) => (

        <div className="text-right font-medium">${row.original.price.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
     cell: ({ row }: { row: Row<Product> }) => (

        <Badge
          variant={
            row.original.status === "active"
              ? "default"
              : row.original.status === "draft"
              ? "secondary"
              : "destructive"
          }
        >
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }: { row: Row<Product> }) => (

        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${row.original.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {row.original.stock}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
    cell: ({ row }: { row: Row<Product> }) => (

        <div className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: { row: Row<Product> }) => (

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/influencer/products/${row.original.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/influencer/products/${row.original.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleUpdateStatus(
                row.original.id, 
                row.original.status === 'active' ? 'inactive' : 'active'
              )}
            >
              <Archive className="h-4 w-4 mr-2" />
              {row.original.status === 'active' ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => handleDeleteProduct(row.original.id)}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your product catalog
          </p>
        </div>
        <div className="flex gap-3">
          {selectedProducts.length > 0 && (
            <Button variant="outline" className="gap-2">
              <Archive className="h-4 w-4" />
              Archive Selected
            </Button>
          )}
       <Dialog>
  <DialogTrigger asChild>
    <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600">
      <Plus className="h-4 w-4 mr-2" />
      Add Product from CJ
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Select Products from CJ Dropshipping</DialogTitle>
    </DialogHeader>
    <div className="flex items-center gap-3 my-3">
      <Input
        placeholder="Search CJ products..."
        onChange={(e) => fetchCJProducts(e.target.value)}
        className="flex-1"
      />
      {cjLoading && <Loader2 className="animate-spin text-gray-400" />}
    </div>
    <ScrollArea className="h-[500px]">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cjProducts.map((p) => (
          <Card key={p.id} className="p-3 flex flex-col items-center text-center">
            <Image
              src={p.images?.[0]}
              alt={p.name}
              width={100}
              height={100}
              className="object-cover rounded-md mb-2"
            />
            <p className="font-medium text-sm">{p.name}</p>
            <p className="text-xs text-gray-500 mb-2">${p.price}</p>
            <Button
              size="sm"
              onClick={async () => {
                if (!user) {
  toast.error("You must be logged in to add products.");
  return;
}

const response = await fetch("/api/influencer-products", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ...p, influencerId: user.id }),
  
                });
                if (response.ok) {
                  toast.success("Product added successfully!");
                  fetchProducts();
                } else {
                  toast.error("Failed to add product");
                }
              }}
            >
              Add to My Store
            </Button>
          </Card>
        ))}
      </div>
    </ScrollArea>
  </DialogContent>
</Dialog>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsData.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className={`mt-4 flex items-center text-sm ${
                stat.trendColor || "text-green-600"
              }`}>
                <TrendingUp className="h-4 w-4 mr-1" />
                {stat.trend} from last month
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <div className="p-4 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>All Products</DropdownMenuItem>
                <DropdownMenuItem>Active</DropdownMenuItem>
                <DropdownMenuItem>Out of Stock</DropdownMenuItem>
                <DropdownMenuItem>Draft</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Newest First</DropdownMenuItem>
                <DropdownMenuItem>Oldest First</DropdownMenuItem>
                <DropdownMenuItem>Price: High to Low</DropdownMenuItem>
                <DropdownMenuItem>Price: Low to High</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first product</p>
              <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-500">
                <Link href="/dashboard/influencer/products/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Product
                </Link>
              </Button>
            </div>
          ) 
          
          
          : (
            <DataTable
              columns={columns}
              data={products}
              onRowSelection={setSelectedProducts}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
