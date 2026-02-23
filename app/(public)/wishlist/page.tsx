"use client";
import { Button } from "@/components/ui/button";
import { WishlistItem } from "@/components/wishlist/WishlistItem";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import { useWishlistStore } from "@/lib/stores";
import { useRouter } from "next/navigation";

const Wishlist = () => {
  const router = useRouter();
  const { items: wishlistItems, clearWishlist } = useWishlistStore();

  const handleContinueShopping = () => {
    router.push('/');
  };

  const handleClearWishlist = () => {
    clearWishlist();
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-xl mx-auto text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your wishlist is empty</h1>
          <p className="text-muted-foreground mb-6">
            Save items you love to your wishlist and they'll appear here.
          </p>
          <Button size="lg" className="w-full" onClick={handleContinueShopping}>
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="p-2" onClick={handleContinueShopping}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Wishlist</h1>
            <p className="text-muted-foreground text-sm">
              {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved
            </p>
          </div>
        </div>
        
        {wishlistItems.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearWishlist}
            className="text-destructive hover:text-destructive"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Wishlist Items */}
        <div className="space-y-4">
          {wishlistItems.map(item => (
            <WishlistItem
              key={item.id}
              {...item}
            />
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={handleContinueShopping}>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
