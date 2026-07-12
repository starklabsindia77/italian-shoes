/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product_type";
import { getAssetUrl } from "@/lib/utils";
import { Price } from "@/components/providers/CurrencyProvider";

const ProductsPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pageSize, setPageSize] = useState(12);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filters, setFilters] = useState({
    vendor: "",
    productType: "",
    minPrice: "",
    maxPrice: "",
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [totalItems, setTotalItems] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentPage, setCurrentPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [totalPages, setTotalPages] = useState(1);

  // Custom design states matching the Girotti style
  const [activeCategory, setActiveCategory] = useState("Create Men's Shoes");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductRef = useRef<HTMLDivElement | null>(null);


  // Function to fetch products from the API
  const fetchProducts = React.useCallback(async (pageNum: number, reset: boolean = false) => {
    setLoading(true);

    try {
      // Build query parameters for Prisma API
      const prismaParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      // Map categories to API query search param 'q' to load correct products dynamically
      let categoryQuery = "";
      if (activeCategory === "Create Men's Shoes") {
        categoryQuery = "Men";
      } else if (activeCategory === "Create Women's Shoes") {
        categoryQuery = "Women";
      } else if (activeCategory === "Create Men's Bags") {
        categoryQuery = "Men's Bags";
      } else if (activeCategory === "Create Women's Bags") {
        categoryQuery = "Women's Bags";
      }

      if (categoryQuery) {
        prismaParams.append("q", categoryQuery);
      }

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
  }, [pageSize, sortBy, sortOrder, filters, activeCategory]);

  // Initial load
  useEffect(() => {
    fetchProducts(1, true);
  }, [fetchProducts]);

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
  }, [page, fetchProducts]);


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
        className="flex flex-col items-center justify-between bg-white text-center cursor-pointer group py-4 transition-all duration-300"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleNavigate}
      >
        {/* Product Image */}
        <div className="relative aspect-[4/3] w-full max-w-[280px] overflow-hidden bg-white mb-3">
          <img
            src={getAssetUrl(product.imageUrl || product.assets?.thumbnail) || "/api/placeholder/400/300"}
            alt={product.title}
            className="object-contain w-full h-full transition-transform duration-500 ease-in-out"
            style={{
              transform: hovered ? 'scale(1.03)' : 'scale(1)'
            }}
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col items-center px-2">
          {/* Title */}
          <h3 className="text-gray-800 text-xs uppercase tracking-widest font-normal mb-1.5 transition-colors group-hover:text-black text-center line-clamp-2">
            {product.title}
          </h3>

          {/* Price */}
          <div className="flex items-center justify-center gap-2 mb-3 text-xs tracking-wider">
            {product.price && product.price.length > 0 ? (
              (() => {
                const discountedPrice = Math.min(...product.price);
                const originalPrice = product.compareAtPrice && product.compareAtPrice > 0
                  ? product.compareAtPrice
                  : Math.round(discountedPrice * 1.5);
                return (
                  <>
                    {originalPrice > discountedPrice && (
                      <span className="text-gray-400 line-through font-normal">
                        <Price amount={originalPrice} />
                      </span>
                    )}
                    <span className="font-semibold text-red-500">
                      <Price amount={discountedPrice} />
                    </span>
                  </>
                );
              })()
            ) : (
              <span className="font-semibold text-red-500">Price not available</span>
            )}
          </div>

          {/* Link */}
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-normal transition-colors group-hover:text-black mt-1">
            Create custom design
          </span>
        </div>
      </div>
    );
  };

  // Simple Filter Component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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



  // Breadcrumb + page title config per active category
  const categoryMeta: Record<string, { title: string; breadcrumb: { label: string; href: string }[] }> = {
    "Create Men's Shoes": {
      title: "CREATE MEN'S SHOES",
      breadcrumb: [
        { label: "Home", href: "/" },
        { label: "Create Design", href: "/collections" },
        { label: "Create Men's Shoes", href: "/collections" },
      ],
    },
    "Create Women's Shoes": {
      title: "CREATE WOMEN'S SHOES",
      breadcrumb: [
        { label: "Home", href: "/" },
        { label: "Create Design", href: "/collections" },
        { label: "Create Women's Shoes", href: "/collections" },
      ],
    },
    "Create Men's Bags": {
      title: "CREATE MEN'S BAGS",
      breadcrumb: [
        { label: "Home", href: "/" },
        { label: "Create Design", href: "/collections" },
        { label: "Create Men's Bags", href: "/collections" },
      ],
    },
    "Create Women's Bags": {
      title: "CREATE WOMEN'S BAGS",
      breadcrumb: [
        { label: "Home", href: "/" },
        { label: "Create Design", href: "/collections" },
        { label: "Create Women's Bags", href: "/collections" },
      ],
    },
  };

  const meta = categoryMeta[activeCategory] ?? categoryMeta["Create Men's Shoes"];

  return (
    <div className="w-full">

      {/* ── Page Title + Breadcrumb (Girotti style) ────────────────── */}
      <div className="text-center pt-2 pb-4 select-none">
        <h2 className="text-xl font-serif font-medium tracking-[0.18em] text-gray-900 uppercase">
          {meta.title}
        </h2>
        <nav className="flex items-center justify-center gap-1.5 mt-1.5" aria-label="Breadcrumb">
          {meta.breadcrumb.map((crumb, i) => (
            <React.Fragment key={crumb.label}>
              {i > 0 && (
                <span className="text-[11px] text-gray-400">›</span>
              )}
              {i === meta.breadcrumb.length - 1 ? (
                <span className="text-[11px] text-gray-500 font-normal">{crumb.label}</span>
              ) : (
                <button
                  onClick={() => router.push(crumb.href)}
                  className="text-[11px] text-[#4a7fd4] font-normal transition-colors"
                >
                  {crumb.label}
                </button>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* ── Hero Banner Section ─────────────────────────────────────── */}
      <section className="mb-6 w-full select-none" style={{ margin: '0 -16px', width: 'calc(100% + 32px)' }}>
        <div style={{ overflow: 'hidden' }}>
          <img
            src="/img/layout/GIROTTI-web-model-category-banner-EN-men.jpg"
            alt="Create Custom Design Shoes"
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        </div>
      </section>



      {/* Main Layout: Products full-width */}
      <div className="w-full">
        {/* Right Main Content */}
        <div className="w-full">
          {/* Header Row */}
          <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-6">
            {/* Center Highlited Text: (i) CHOOSE STYLE AND START DESIGN ↓ */}
            <div className="flex items-center text-[10px] tracking-[0.18em] text-gray-400 font-normal justify-center grow uppercase">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-[9px] font-medium text-gray-400 mr-2.5">i</span>
              <span>Choose Style and Start Design</span>
              <span className="ml-1.5 text-xs font-semibold text-gray-400">&darr;</span>
            </div>

          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
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
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-red-500"></div>
            </div>
          )}

          {/* End of results message */}
          {!hasMore && !loading && products.length > 0 && (
            <div className="text-center py-12 text-xs text-gray-400 tracking-wider uppercase">
              {`End of collection`}
            </div>
          )}

          {/* No results message */}
          {!loading && products.length === 0 && (
            <div className="text-center py-16 text-sm text-gray-400">
              No products found matching this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;