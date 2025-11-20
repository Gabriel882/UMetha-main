"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { influencers, influencerProducts } from "@/data/influencer-data";
import { AnimatePresence, motion } from "framer-motion";


import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Heart,
  Share2,
  Instagram,
  Twitter,
  Youtube,
  Users,
  TrendingUp,
  Package,
  CheckCircle2,
  SlidersHorizontal,
  LayoutGrid as GridIcon,
  List as LayoutListIcon,
  UserPlus,
  UserMinus,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import MainLayout from "@/components/main-layout";
import PriceCartButton from "@/components/ui/price-cart-button";
import { cn } from "@/lib/utils";
import { useFollowedInfluencers } from "@/context/followed-influencers-context";
import { useProductModal } from "@/context/product-modal-context";
import { useToast } from "@/hooks/use-toast";

// ------------------------------------------------------------
//  PAGE COMPONENT
// ------------------------------------------------------------
export default function InfluencerProfile() {
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [liked, setLiked] = useState(false);
const [shareOpen, setShareOpen] = useState(false);

  const { isFollowing, follow, unfollow } = useFollowedInfluencers();

  const { toast } = useToast();

  // Convert ID param → number
  const influencerId = parseInt(params.id as string);

  // Type-safe influencer lookup
  const influencer = influencers.find(
    (inf: any) => inf.id === influencerId
  );

  // Filter products belonging to this influencer
  const products = influencerProducts.filter(
    (product) => product.influencerId === influencerId
  );

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!influencer) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h1 className="text-2xl font-bold mb-4">Influencer not found</h1>
          <p className="text-gray-500 mb-6">
            The influencer you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/category/influencerhub">Back to Marketplace</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }




  
const handleFollowToggle = () => {
  const currentlyFollowing = isFollowing(influencerId);

  if (currentlyFollowing) {
    unfollow(influencerId);
    toast({
      title: "Unsubscribed",
      description: `You've unsubscribed from ${influencer.name}.`,
    });
  } else {
    // follow() requires influencer info (not just ID)
    follow({
      id: influencer.id,
      name: influencer.name,
      avatar: influencer.avatar,
      category: influencer.category,
    });

    toast({
      title: "Subscribed!",
      description: `You're now following ${influencer.name}.`,
    });
  }
};



  const followStatus = isFollowing(influencerId);

  return (
    <MainLayout>
      {/* HERO SECTION */}
      <section className="relative h-[400px] -mt-6 -mx-6">
        <div className="absolute inset-0">
          <Image
            src={influencer.background}
            alt={influencer.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="relative h-full container mx-auto px-6">
          <div className="flex items-end h-full pb-8">
            <div className="flex items-end gap-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-70" />
                <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-800">
                  <AvatarImage src={influencer.avatar} alt={influencer.name} />
                  <AvatarFallback>{influencer.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </motion.div>

              {/* Name + Bio */}
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold">
                      {influencer.name}'s Store
                    </h1>
                    {influencer.verified && (
                      <Badge variant="secondary" className="h-6">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-blue-500" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <p className="text-muted-foreground text-lg mb-4 max-w-2xl">
                    {influencer.bio}
                  </p>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {influencer.followers}
                      </span>
                      <span className="text-muted-foreground">followers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {influencer.engagement}
                      </span>
                      <span className="text-muted-foreground">engagement</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Follow Button */}
               <Button
  variant={followStatus ? "outline" : "default"}
  className={cn(
    "gap-2",
    followStatus
      ? "border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
      : "bg-gradient-to-r from-purple-500 to-pink-500"
  )}
  onClick={handleFollowToggle}
>
  {followStatus ? (
    <>
      <UserMinus className="h-4 w-4" />
      Unsubscribe
    </>
  ) : (
    <>
      <UserPlus className="h-4 w-4" />
      Subscribe
    </>
  )}
</Button>


                {/* Like Button */}
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full"
                  onClick={() => {
                    setLiked(!liked);
                    toast({
                      title: liked
                        ? "Removed from favorites"
                        : "Added to favorites",
                      description: `${influencer.name} ${
                        liked ? "removed from" : "added to"
                      } your liked influencers.`,
                    });
                  }}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      liked ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                </Button>

               {/* Social Links */}
{Object.entries(influencer.social).map(([platform, handle]) => {
  // Safe mapping for allowed platforms
  const iconMap: Record<string, React.ElementType> = {
    instagram: Instagram,
    twitter: Twitter,
    youtube: Youtube,
  };

  const Icon = iconMap[platform];

  // Skip unknown social platforms
  if (!Icon) return null;

  return (
    <Button
      key={platform}
      variant="secondary"
      size="icon"
      className="rounded-full"
      asChild
    >
      <a
        href={`https://${platform}.com/${handle}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon className="h-4 w-4" />
      </a>
    </Button>
  );
})}


               {/* Share */}
<>
  <Button
    variant="secondary"
    size="icon"
    className="rounded-full"
    onClick={() => setShareOpen(true)}
  >
    <Share2 className="h-4 w-4" />
  </Button>

  {/* SHARE MODAL */}
  <AnimatePresence>
    {shareOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md"
        >
          <Card className="rounded-2xl p-4 bg-background">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Share</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShareOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* SHARE ICON ROW */}
            <CardContent className="grid grid-cols-5 gap-4 text-center">
              <Button className="rounded-full p-3">Embed</Button>
              <Button className="rounded-full p-3">WhatsApp</Button>
              <Button className="rounded-full p-3">Facebook</Button>
              <Button className="rounded-full p-3">X</Button>
              <Button className="rounded-full p-3">Email</Button>
            </CardContent>

            {/* LINK COPY FIELD */}
            <div className="mt-4 flex items-center gap-2">
              <input
                className="w-full border rounded-xl px-3 py-2 text-sm"
                value={typeof window !== 'undefined' ? window.location.href : ''}
                readOnly
              />
              <Button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Link copied!",
                      description: "Profile link copied to clipboard."
                    });
                  } catch {
                    toast({
                      title: "Error",
                      description: "Could not copy link.",
                      variant: "destructive"
                    });
                  }
                }}
              >
                Copy
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
</>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS SECTION */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="all" className="space-y-8">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Products</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
              <TabsTrigger value="bestsellers">Bestsellers</TabsTrigger>
              <TabsTrigger value="new">New Arrivals</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4">
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>

              <div className="border-l h-6" />

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <GridIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <LayoutListIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="all">
            <motion.div
              className={cn(
                "grid gap-6",
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                  : "grid-cols-1"
              )}
            >
              {products.length > 0 ? (
                products.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {viewMode === "grid" ? (
                      <ProductCard product={product} />
                    ) : (
                      <ProductListItem product={product} />
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No products found
                  </h3>
                  <p className="text-muted-foreground">
                    This influencer has no listed products yet.
                  </p>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

// ------------------------------------------------------------
//  PRODUCT GRID CARD
// ------------------------------------------------------------
function ProductCard({ product }: any) {
  const { openModal } = useProductModal();

  return (
    <Card className="group relative overflow-hidden border-border/50 hover:shadow-xl transition-all duration-300">
      <div
        className="relative aspect-square cursor-pointer"
        onClick={() =>
          openModal({
            id: product.id,
            name: product.name,
            price: product.price,
            description: product.description,
            images: [product.image],
            stock: product.stock,
            category: {
              name: product.category,
              slug: product.category
                ?.toLowerCase()
                .replace(/\s+/g, "-"),
            },
          })
        }
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {product.discount > 0 && (
          <Badge className="absolute top-4 left-4 bg-red-500 text-white">
            -{product.discount}% OFF
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-medium line-clamp-2">{product.name}</h3>

        <div className="flex items-center gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(product.rating)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
          <span className="text-sm text-muted-foreground ml-2">
            ({product.reviews})
          </span>
        </div>

        <div className="mt-4">
          <PriceCartButton
            id={product.id}
            name={product.name}
            price={product.price}
            image={product.image}
            originalPrice={
              product.discount
                ? product.price * (1 + product.discount / 100)
                : undefined
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------
//  PRODUCT LIST VIEW ITEM
// ------------------------------------------------------------
function ProductListItem({ product }: any) {
  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="flex gap-6">
        <div className="relative w-48 aspect-square">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1 p-6">
          <h3 className="text-lg font-medium">{product.name}</h3>

          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {product.description}
          </p>

          <div className="flex items-center gap-1 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <PriceCartButton
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
              originalPrice={
                product.discount
                  ? product.price * (1 + product.discount / 100)
                  : undefined
              }
            />

            <Button variant="ghost" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
