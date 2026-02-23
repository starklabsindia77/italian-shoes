"use client";
import { ProductCard } from "@/components/examples/ProductCard";
import { CartIcon } from "@/components/cart/CartIcon";
import { Button } from "@/components/ui/button";
import { useCartStore, useWishlistStore } from "@/lib/stores";
import { ShoppingCart, Heart, Trash2 } from "lucide-react";

// Sample product data
const sampleProducts = [
  {
    id: "1",
    productId: "oxford-001",
    title: "Classic Oxford Leather Shoes",
    price: 299.99,
    originalPrice: 399.99,
    image: "/leather/01.01.01.0501_hpfk2z.jpg",
    description: "Handcrafted Italian leather oxford shoes with premium construction."
  },
  {
    id: "2", 
    productId: "loafer-002",
    title: "Premium Leather Loafers",
    price: 249.99,
    image: "/leather/01.01.01.0502_ounsuh.jpg",
    description: "Elegant leather loafers perfect for business and casual wear."
  },
  {
    id: "3",
    productId: "boot-003", 
    title: "Italian Leather Boots",
    price: 349.99,
    originalPrice: 449.99,
    image: "/leather/01.01.01.0503_wsafe5.jpg",
    description: "Sturdy leather boots made with traditional Italian craftsmanship."
  }
];

const DemoPage = () => {
  const { clearCart, getTotalItems, getTotalPrice } = useCartStore();
  const { clearWishlist, getTotalItems: getWishlistTotal } = useWishlistStore();

  const cartItemCount = getTotalItems();
  const cartTotal = getTotalPrice();
  const wishlistItemCount = getWishlistTotal();

  const handleClearCart = () => {
    clearCart();
  };

  const handleClearWishlist = () => {
    clearWishlist();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">Cart & Wishlist Demo</h1>
            <CartIcon showWishlist={true} />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="font-semibold">Cart Items</span>
            </div>
            <p className="text-2xl font-bold mt-2">{cartItemCount}</p>
            <p className="text-sm text-muted-foreground">Total: ${cartTotal.toFixed(2)}</p>
            {cartItemCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearCart}
                className="mt-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Cart
              </Button>
            )}
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="font-semibold">Wishlist Items</span>
            </div>
            <p className="text-2xl font-bold mt-2">{wishlistItemCount}</p>
            <p className="text-sm text-muted-foreground">Saved for later</p>
            {wishlistItemCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearWishlist}
                className="mt-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Wishlist
              </Button>
            )}
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Quick Actions</span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/cart">View Cart</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/wishlist">View Wishlist</a>
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">How to Test</h2>
          <ul className="text-blue-800 space-y-1">
            <li>• Click "Add to Cart" to add items to your cart</li>
            <li>• Click the heart icon to add items to your wishlist</li>
            <li>• Use the cart and wishlist icons in the header to view your items</li>
            <li>• Try moving items between cart and wishlist</li>
            <li>• Refresh the page to see that your data persists</li>
          </ul>
        </div>

        {/* Products Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Sample Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                size={{
                  id: "size-9",
                  name: "9",
                  region: "US"
                }}
                material={{
                  id: "leather-italian",
                  name: "Italian Leather",
                  color: {
                    id: "black",
                    name: "Black",
                    hexCode: "#000000"
                  }
                }}
                style={{
                  id: "classic",
                  name: "Classic"
                }}
                sole={{
                  id: "leather-sole",
                  name: "Leather Sole"
                }}
              />
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Features Implemented</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Cart Features</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Add/remove items</li>
                <li>• Update quantities</li>
                <li>• Persist data in localStorage</li>
                <li>• Calculate totals</li>
                <li>• Move items to wishlist</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Wishlist Features</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Add/remove items</li>
                <li>• Persist data in localStorage</li>
                <li>• Move items to cart</li>
                <li>• View product details</li>
                <li>• Clear all items</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
