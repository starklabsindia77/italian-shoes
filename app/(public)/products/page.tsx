/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect, useRef } from "react";
import { ShoppingBag, Heart, Eye } from "lucide-react";
import Link from "next/link";
import { Product, Size, Style, Sole, Material, Color, Panel, ProductVariant, ShopifyImage, ShopifyVariant } from "../../../types/product";

// Types based on the Prisma schema

// Dummy data for products


const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductRef = useRef<HTMLDivElement>(null);

  // Function to simulate API fetch
  const fetchProducts = (pageNum: number) => {
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      // In a real app, this would be an API call
      
    //   setProducts(prev => [...prev, ...newProducts]);
      setLoading(false);
      
      // Simulate end of products after 5 pages
      if (pageNum >= 5) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    }, 800);
  };

  // Initial load
  useEffect(() => {
    fetchProducts(1);
  }, []);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (loading) return;

    // Disconnect previous observer
    if (observer.current) {
      observer.current.disconnect();
    }

    // Create new observer
    observer.current = new IntersectionObserver(entries => {
      // If the last product is visible and we have more products to load
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    }, { threshold: 0.5 });

    // Observe the last product element
    if (lastProductRef.current) {
      observer.current.observe(lastProductRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loading, hasMore, products]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchProducts(page);
    }
  }, [page]);

  // Function to format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  // Product Card Component
  const ProductCard = ({ product, isLast }: { product: Product, isLast: boolean }) => {
    const [hovered, setHovered] = useState(false);
    
    return (
      <div 
        ref={isLast ? lastProductRef : null}
        className="relative bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img 
            src={product.imageUrl ||  "/api/placeholder/400/400"} 
            alt={product.title}
            className="object-cover w-full h-full transition-transform duration-500 ease-in-out"
            style={{
              transform: hovered ? 'scale(1.05)' : 'scale(1)'
            }}
          />
          
          {/* Quick action buttons (show on hover) */}
          <div 
            className={`absolute bottom-0 left-0 right-0 flex justify-center space-x-2 py-3 bg-white bg-opacity-90 transition-all duration-300 ${
              hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
            }`}
          >
            <button className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
              <ShoppingBag size={18} />
            </button>
            <button className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
              <Heart size={18} />
            </button>
            <Link href={`/product-details/${product.id}`}>
              <button className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
                <Eye size={18} />
              </button>
            </Link>
          </div>
        </div>
        
        {/* Product Details */}
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1">{product.vendor}</p>
          <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{product.title}</h3>
          
          {/* Price */}
          <div className="flex justify-between items-center mt-2">
            <div>
              <span className="font-bold text-red-500">
                {formatPrice(product.variants[0].price)}
              </span>
              {product.variants.length > 1 && (
                <span className="text-xs text-gray-500 ml-1">+</span>
              )}
            </div>
            
            {/* Stock indicator */}
            <div className="text-xs">
              {product.variants[0].inventoryQuantity > 10 ? (
                <span className="text-green-600">In Stock</span>
              ) : product.variants[0].inventoryQuantity > 0 ? (
                <span className="text-orange-500">Low Stock</span>
              ) : (
                <span className="text-red-500">Out of Stock</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shop Our Collection</h1>
        <p className="text-gray-600 mt-2">Discover our premium handcrafted Italian shoes</p>
      </div>

      {/* Filter & Sort (Simplified) */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors">
            All Categories
          </button>
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            Filters
          </button>
        </div>
        
        <select className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700">
          <option>Sort by Featured</option>
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
          <option>Newest First</option>
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            isLast={index === products.length - 1}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-red-500"></div>
        </div>
      )}

      {/* End of results message */}
      {!hasMore && !loading && products.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          {`You've reached the end of our collection`}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;