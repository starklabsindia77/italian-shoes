# Cart and Wishlist Implementation with Zustand

This implementation provides a complete cart and wishlist system using Zustand for state management with persistence.

## Features

### Cart Store (`useCartStore`)
- Add/remove items
- Update quantities
- Clear cart
- Persist cart data
- Calculate totals
- Check if items are in cart

### Wishlist Store (`useWishlistStore`)
- Add/remove items
- Clear wishlist
- Persist wishlist data
- Check if items are in wishlist

### Combined Hook (`useCartAndWishlist`)
- Access both stores
- Move items between cart and wishlist
- Helper functions for common operations

## Usage Examples

### Basic Cart Operations

```tsx
import { useCartStore } from '@/lib/stores';

function MyComponent() {
  const { 
    items, 
    addItem, 
    removeItem, 
    updateQuantity, 
    getTotalItems, 
    getTotalPrice 
  } = useCartStore();

  const handleAddToCart = () => {
    addItem({
      productId: 'product-123',
      title: 'Italian Leather Shoes',
      variant: 'Black / Size 9',
      price: 299.99,
      quantity: 1,
      image: '/images/shoes.jpg',
      size: { id: 'size-1', name: '9', region: 'US' },
      material: { 
        id: 'leather-1', 
        name: 'Italian Leather',
        color: { id: 'black', name: 'Black', hexCode: '#000000' }
      }
    });
  };

  return (
    <div>
      <p>Items in cart: {getTotalItems()}</p>
      <p>Total: ${getTotalPrice().toFixed(2)}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

### Basic Wishlist Operations

```tsx
import { useWishlistStore } from '@/lib/stores';

function MyComponent() {
  const { 
    items, 
    addItem, 
    removeItem, 
    isItemInWishlist 
  } = useWishlistStore();

  const handleToggleWishlist = (productId: string) => {
    if (isItemInWishlist(productId)) {
      const item = items.find(item => item.productId === productId);
      if (item) removeItem(item.id);
    } else {
      addItem({
        productId,
        title: 'Italian Leather Shoes',
        price: 299.99,
        image: '/images/shoes.jpg'
      });
    }
  };

  return (
    <div>
      <p>Wishlist items: {items.length}</p>
      <button onClick={() => handleToggleWishlist('product-123')}>
        Toggle Wishlist
      </button>
    </div>
  );
}
```

### Using Pre-built Components

```tsx
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { CartIcon } from '@/components/cart/CartIcon';

function ProductPage() {
  return (
    <div>
      {/* Header with cart and wishlist icons */}
      <header>
        <CartIcon showWishlist={true} />
      </header>

      {/* Product actions */}
      <div>
        <AddToCartButton
          productId="product-123"
          title="Italian Leather Shoes"
          price={299.99}
          variant="Black / Size 9"
          size={{ id: 'size-1', name: '9', region: 'US' }}
        />
        
        <WishlistButton
          productId="product-123"
          title="Italian Leather Shoes"
          price={299.99}
        />
      </div>
    </div>
  );
}
```

### Moving Items Between Cart and Wishlist

```tsx
import { useCartAndWishlist } from '@/lib/stores';

function MyComponent() {
  const { moveToCart, moveToWishlist } = useCartAndWishlist();

  const handleMoveToCart = (wishlistItemId: string) => {
    moveToCart(wishlistItemId);
  };

  const handleMoveToWishlist = (cartItemId: string) => {
    moveToWishlist(cartItemId);
  };

  return (
    <div>
      {/* Your component content */}
    </div>
  );
}
```

## Data Structure

### CartItem
```typescript
interface CartItem {
  id: string;
  productId: string;
  title: string;
  variant: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image?: string;
  size?: {
    id: string;
    name: string;
    region: string;
  };
  material?: {
    id: string;
    name: string;
    color?: {
      id: string;
      name: string;
      hexCode?: string;
    };
  };
  style?: {
    id: string;
    name: string;
  };
  sole?: {
    id: string;
    name: string;
  };
  addedAt: Date;
}
```

### WishlistItem
```typescript
interface WishlistItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  image?: string;
  variant?: string;
  // Same customization options as CartItem
  addedAt: Date;
}
```

## Persistence

Both stores use Zustand's persist middleware to save data to localStorage:
- Cart data is persisted as 'cart-storage'
- Wishlist data is persisted as 'wishlist-storage'
- Only the items are persisted, not UI state (like cart open/closed)

## Available Pages

- `/cart` - Cart page with all cart items and checkout
- `/wishlist` - Wishlist page with all saved items

## Available Components

### Cart Components
- `CartItem` - Individual cart item with quantity controls
- `CartIcon` - Header cart icon with item count
- `AddToCartButton` - Button to add items to cart
- `OrderSummary` - Order summary for checkout

### Wishlist Components
- `WishlistItem` - Individual wishlist item
- `WishlistButton` - Button to add/remove from wishlist

### Example Components
- `ProductCard` - Complete product card with cart/wishlist actions
