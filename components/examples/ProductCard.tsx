"use client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: {
    id: string;
    productId: string;
    title: string;
    price: number;
    originalPrice?: number;
    image?: string;
    description?: string;
  };
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
}

export const ProductCard = ({ 
  product, 
  size, 
  material, 
  style, 
  sole 
}: ProductCardProps) => {
  const router = useRouter();

  const handleViewProduct = () => {
    router.push(`/product/${product.productId}`);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        {product.image && (
          <div className="aspect-square overflow-hidden">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4">
        <CardTitle className="text-lg font-semibold line-clamp-2 mb-2">
          {product.title}
        </CardTitle>
        
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
          <span className="text-lg font-bold">
            ${product.price.toFixed(2)}
          </span>
        </div>

        {/* Display customization options if provided */}
        {(size || material || style || sole) && (
          <div className="text-xs text-muted-foreground space-y-1 mb-3">
            {size && <p>Size: {size.name} ({size.region})</p>}
            {material && (
              <p>
                Material: {material.name}
                {material.color && ` - ${material.color.name}`}
              </p>
            )}
            {style && <p>Style: {style.name}</p>}
            {sole && <p>Sole: {sole.name}</p>}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 space-y-2">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewProduct}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
        </div>
        
        <div className="flex gap-2 w-full">
          <WishlistButton
            productId={product.productId}
            title={product.title}
            price={product.price}
            originalPrice={product.originalPrice}
            image={product.image}
            variant="Default"
            size={size}
            material={material}
            style={style}
            sole={sole}
            buttonVariant="outline"
            buttonSize="sm"
            className="flex-1"
          />
          
          <AddToCartButton
            productId={product.productId}
            title={product.title}
            price={product.price}
            originalPrice={product.originalPrice}
            image={product.image}
            size={size}
            variant="Default"
            buttonVariant="default"
            buttonSize="sm"
          />
        </div>
      </CardFooter>
    </Card>
  );
};
