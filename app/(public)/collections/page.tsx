/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect, useRef } from "react";
import { ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product_type";
import { getAssetUrl } from "@/lib/utils";

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pageSize, setPageSize] = useState(12);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filters, setFilters] = useState({
    vendor: "",
    productType: "",
    minPrice: "",
    maxPrice: "",
  });
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductRef = useRef<HTMLDivElement | null>(null);

  // Function to fetch products from the API
  const fetchProducts = async (pageNum: number, reset: boolean = false) => {
    setLoading(true);

    try {
      // Build query parameters for Prisma API
      const prismaParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      // Add filters if they exist
      if (filters.vendor) prismaParams.append('vendor', filters.vendor);
      if (filters.productType) prismaParams.append('productType', filters.productType);
      if (filters.minPrice) prismaParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) prismaParams.append('maxPrice', filters.maxPrice);

      const response = await fetch(`/api/products?${prismaParams}`);
      const data = await response.json();

      if (data.items) {
        // Map Prisma product objects to the frontend's expected Product type
        const mappedItems = data.items.map((p: any) => ({
          ...p,
          price: p.price ? [p.price] : [], // Wrap single price in array to match expectations
          // Try to find a usable image from assets or selected variants/styles/soles
          imageUrl: p.thumbnailUrl ||
            p.assets?.thumbnail ||
            p.assets?.glb?.thumbnail ||
            p.selectedStyles?.[0]?.imageUrl ||
            p.selectedSoles?.[0]?.imageUrl ||
            p.imageUrl ||
            null,
        }));

        if (reset) {
          setProducts(mappedItems);
        } else {
          setProducts(prev => [...prev, ...mappedItems]);
        }

        const total = data.total || 0;
        setTotalItems(total);
        const totalPagesCount = Math.ceil(total / pageSize);
        setTotalPages(totalPagesCount);
        setCurrentPage(pageNum);

        // Check if there are more pages to load
        setHasMore(pageNum < totalPagesCount);
      } else {
        console.error("Error fetching products:", data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts(1, true);
  }, [sortBy, sortOrder, pageSize, filters]);

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

  // Function to handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    // Reset page to 1 when sorting changes
    setPage(1);

    if (value === "price_asc") {
      setSortBy("price");
      setSortOrder("asc");
    } else if (value === "price_desc") {
      setSortBy("price");
      setSortOrder("desc");
    } else if (value === "newest") {
      setSortBy("createdAt");
      setSortOrder("desc");
    } else if (value === "title_asc") {
      setSortBy("title");
      setSortOrder("asc");
    } else {
      // Default to featured (createdAt desc)
      setSortBy("createdAt");
      setSortOrder("desc");
    }

    // Reset products when sort changes to avoid mixing differently sorted items
    setProducts([]);
  };

  // Function to handle filter changes
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));

    // Reset page to 1 when filters change
    setPage(1);

    // Reset products when filters change to avoid mixing filtered items
    setProducts([]);
  };

  // Function to format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(price);
  };

  // Product Card Component
  const ProductCard = ({ product, isLast }: { product: Product, isLast: boolean }) => {
    const [hovered, setHovered] = useState(false);
    const router = useRouter();

    const handleNavigate = () => {
      router.push(`/product/${product.id}`);
    };

    return (
      <div
        ref={isLast ? lastProductRef : null}
        className="relative bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            onClick={handleNavigate}
            src={getAssetUrl(product.assets?.thumbnail) || "/api/placeholder/400/400"}
            alt={product.title}
            className="object-cover w-full h-full transition-transform duration-500 ease-in-out"
            style={{
              transform: hovered ? 'scale(1.05)' : 'scale(1)'
            }}
          />

          {/* Quick action buttons (show on hover) */}

        </div>

        {/* Product Details */}
        <div className="p-4" onClick={handleNavigate}>
          <p className="text-xs text-gray-500 mb-1">{product.vendor}</p>
          <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{product.title}</h3>

          {/* Price */}
          <div className="flex justify-between items-center mt-2">
            <div>
              {product.price && product.price.length > 0 ? (
                <>
                  <span className="font-bold text-red-500">
                    {formatPrice(Math.min(...product.price))}
                  </span>
                  {product.price.length > 1 && product.price[0] !== Math.max(...product.price) && (
                    <span className="text-xs text-gray-500 ml-1">
                      - {formatPrice(Math.max(...product.price))}
                    </span>
                  )}
                </>
              ) : (
                <span className="font-bold text-red-500">Price not available</span>
              )}
            </div>

            {/* Stock indicator */}
            {/* <div className="text-xs">
              {product.variants && product.variants.length > 0 ? (
                product.variants[0].inventoryQuantity > 10 ? (
                  <span className="text-green-600">In Stock</span>
                ) : product.variants[0].inventoryQuantity > 0 ? (
                  <span className="text-orange-500">Low Stock</span>
                ) : (
                  <span className="text-red-500">Out of Stock</span>
                )
              ) : (
                <span className="text-gray-500">Stock unknown</span>
              )}
            </div> */}
          </div>
        </div>
      </div>
    );
  };

  // Simple Filter Component
  const FilterSection = () => {
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <input
              type="text"
              value={filters.vendor}
              onChange={(e) => handleFilterChange('vendor', e.target.value)}
              placeholder="Filter by vendor"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
            <input
              type="text"
              value={filters.productType}
              onChange={(e) => handleFilterChange('productType', e.target.value)}
              placeholder="Filter by type"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="Min"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="Max"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
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

      {/* Filter & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-600" />
            <span className="font-medium">Filters:</span>
          </div>
          <button 
            className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
            onClick={() => {
              // Toggle filter section visibility (you would need to add state for this)
              // For now, we'll just reset filters
              setFilters({
                vendor: "",
                productType: "",
                minPrice: "",
                maxPrice: "",
              });
            }}
          >
            Reset Filters
          </button> */}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <ArrowUpDown size={18} className="text-gray-600" />
            <span className="font-medium">Sort:</span>
          </div>
          <select
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700"
            onChange={handleSortChange}
            value={
              sortBy === "price" && sortOrder === "asc"
                ? "price_asc"
                : sortBy === "price" && sortOrder === "desc"
                  ? "price_desc"
                  : sortBy === "createdAt" && sortOrder === "desc"
                    ? "newest"
                    : sortBy === "title" && sortOrder === "asc"
                      ? "title_asc"
                      : "default"
            }
          >
            <option value="default">Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest First</option>
            <option value="title_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Filter section */}
      {/* <FilterSection /> */}

      {/* Product count */}
      <div className="mb-4 text-gray-600">
        Showing {products.length} of {totalItems} products
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

      {/* No results message */}
      {!loading && products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No products found matching your criteria
        </div>
      )}
    </div>
  );
};

export default ProductsPage;