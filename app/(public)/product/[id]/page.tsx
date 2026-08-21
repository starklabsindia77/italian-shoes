/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  ZoomIn,
  Share2,
  Undo,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import dynamic from "next/dynamic";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { getAssetUrl } from "@/lib/utils";
import { ShoeAvatarRef } from "@/components/shoe-avatar/ShoeAvatar";
import { Price } from "@/components/providers/CurrencyProvider";

const ShoeAvatar = dynamic(
  () => import("@/components/shoe-avatar/ShoeAvatar"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    ),
  }
);



const getLocalTextureUrl = (colorName: string, s3Url: string | null | undefined): string => {
  if (!s3Url) return "";
  
  const name = colorName.trim().toLowerCase();
  
  // Try extraction from colorName first
  // 1. Numeric check (e.g. "color 1", "swatch 15")
  const numMatch = name.match(/\b\d+\b/);
  if (numMatch) {
    const num = numMatch[0];
    const numInt = parseInt(num, 10);
    if (numInt >= 1 && numInt <= 20) {
      if ([10, 11, 12, 14, 15, 16, 17, 18].includes(numInt)) {
        return `/leather/${num}.png`;
      }
      return `/leather/${num}.jpg`;
    }
  }
  
  // 2. Keyword matching
  if (name.includes("dark red") || name.includes("dark-red")) return "/leather/dark-red.png";
  if (name.includes("mahroon") || name.includes("maroon") || name.includes("burgundy")) return "/leather/mahroon.png";
  if (name.includes("light brown") || name.includes("light-brown") || name.includes("tan")) return "/leather/light-brown.jpg";
  if (name.includes("black")) return "/leather/black.jpg";
  if (name.includes("brown") || name.includes("coffee")) return "/leather/brown.jpg";
  if (name.includes("red")) return "/leather/red.jpg";
  if (name.includes("yellow")) return "/leather/yellow.jpg";
  if (name.includes("orange")) return "/leather/orange.png";
  if (name.includes("grey") || name.includes("gray")) return "/leather/grey.png";
  
  // Try extraction from s3Url
  const urlLower = s3Url.toLowerCase();
  if (urlLower.includes("dark-red")) return "/leather/dark-red.png";
  if (urlLower.includes("mahroon") || urlLower.includes("maroon") || urlLower.includes("burgundy")) return "/leather/mahroon.png";
  if (urlLower.includes("light-brown") || urlLower.includes("light_brown")) return "/leather/light-brown.jpg";
  if (urlLower.includes("black")) return "/leather/black.jpg";
  if (urlLower.includes("brown")) return "/leather/brown.jpg";
  if (urlLower.includes("red")) return "/leather/red.jpg";
  if (urlLower.includes("yellow")) return "/leather/yellow.jpg";
  if (urlLower.includes("orange")) return "/leather/orange.png";
  if (urlLower.includes("grey") || urlLower.includes("gray")) return "/leather/grey.png";

  // No local swatch matched (colors added after the local 1-20 set):
  // serve the real asset from the CDN. Returning the raw relative path
  // here made the browser request /colors/... from the app server -> 404.
  return getAssetUrl(s3Url);
};

/* ----------------------
   Main Builder Component
   ---------------------- */

// Transform API data to match UI expectations
const transformApiData = (
  productApiData: {
    id?: string;
    productId?: string;
    images?: string[];
    assets?: { thumbnail?: string; glb?: { url: string } };
    title?: string;
    price?: number;
    compareAtPrice?: number;
    orderStatus?: string;
    vendor?: string;
    selectedMaterials?: any[];
    selectedStyles?: any[];
    selectedSoles?: any[];
    description?: string;
  } | null,
  sizesApiData: { items?: any[] } | null,
  panelsApiData: { items?: any[] } | null
) => {
  return {
    // `id` is the cuid the cart and pricing APIs key off; `productId` is the
    // human-readable slug and must not be used as a cart identifier.
    id: productApiData?.id || "",
    productId: productApiData?.productId || "",
    title: productApiData?.title || "",
    price: productApiData?.price || 0,
    compareAtPrice: productApiData?.compareAtPrice || 0,
    description: productApiData?.description || "",
    orderStatus: productApiData?.orderStatus || "",
    vendor: productApiData?.vendor || "",
    selectedStyles: productApiData?.selectedStyles || [],
    selectedSoles: productApiData?.selectedSoles || [],
    assets: productApiData?.assets || {},
    // Add default images if not present
    images: productApiData?.images || (
      productApiData?.assets?.thumbnail
        ? [productApiData.assets.thumbnail]
        : [
          "/placeholder/shoe-1.jpg",
          "/placeholder/shoe-2.jpg",
          "/placeholder/shoe-3.jpg",
          "/placeholder/shoe-4.jpg",
        ]
    ),

    // Transform panels from panels API data or use defaults
    panels: panelsApiData?.items
      ? panelsApiData.items.map((panel: any) => ({
        id: panel.panelId,
        name: panel.name,
        meshName: `${panel.name.replace(/\s+/g, "_")}_Mesh`,
        thumbnail: `/placeholder/panel-${panel.panelId}.jpg`,
        group: panel.group,
      }))
      : [
        {
          id: "upper",
          name: "Upper",
          meshName: "Upper_Mesh",
          thumbnail: "/placeholder/panel-upper.jpg",
        },
        {
          id: "toe",
          name: "Toe",
          meshName: "Toe_Mesh",
          thumbnail: "/placeholder/panel-toe.jpg",
        },
        {
          id: "quarter",
          name: "Quarter",
          meshName: "Quarter_Mesh",
          thumbnail: "/placeholder/panel-quarter.jpg",
        },
        {
          id: "heel",
          name: "Heel",
          meshName: "Heel_Mesh",
          thumbnail: "/placeholder/panel-heel.jpg",
        },
      ],

    // Transform sizes from sizes API data or use defaults
    sizes: sizesApiData?.items
      ? sizesApiData.items.map((size: any) => ({
        id: size.id,
        label: `${size.name}${size.euEquivalent ? ` / ${size.euEquivalent}` : ""
          }${size.ukEquivalent ? ` / ${size.ukEquivalent}` : ""}`,
        value: size.value,
        region: size.region,
      }))
      : [
        { id: "42", label: "EU 42 / UK 8 / US 9" },
        { id: "43", label: "EU 43 / UK 9 / US 10" },
        { id: "44", label: "EU 44 / UK 9.5 / US 10.5" },
      ],
  };
};

export default function DerbyBuilderClean() {
  // State for API data
  const { id } = useParams<{ id: string }>();
  const [productData, setProductData] = useState<any>(null);
  const [sizesData, setSizesData] = useState<{ items?: any[] } | null>(null);
  const [panelsData, setPanelsData] = useState<{ items?: any[] } | null>(null);
  const [materialsData, setMaterialsData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, any>[]>([]);

  // UI-only state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activePanel, setActivePanel] = useState<string | null>(null);
  // Style and Sole selection were removed from the configurator; the model now
  // comes from the product's own GLB.
  const [activeTab] = useState<"Materials" | "Colors" | "Inscription">("Materials");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [inscription, setInscription] = useState({ toe: "", tongue: "" });
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Filter state for materials and colors
  const [selectedMaterialFilter, setSelectedMaterialFilter] =
    useState<string>("all");
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>("all");
  const [selectedPanelName, setSelectedPanelName] = useState<string>("");
  const shoeAvatarRef = useRef<ShoeAvatarRef>(null);

  const handlePanelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPanelName(e.target.value);
  };

  const handleTextureChange = (panelId: string, textureUrl: string, materialName?: string, colorName?: string) => {
    console.log("STEP 2: State updating. handleTextureChange triggered:", { panelId, textureUrl, materialName, colorName });
    setSelectedTextureMap((prev) => {
      setHistory((h) => [...h, prev]);
      const updated = {
        ...prev,
        [panelId]: { 
          colorUrl: textureUrl,
          materialName: materialName || "N/A",
          colorName: colorName || "N/A"
        },
      };
      console.log("STEP 2: State updated. New selectedTextureMap:", updated);
      return updated;
    });
  };

  // Fetch all data from APIs
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Fetch data from all four APIs in parallel
        const [productResponse, sizesResponse, panelsResponse] =
          await Promise.all([
            fetch(`/api/products/${id}`),
            fetch("/api/sizes"),
            fetch("/api/panels"),
          ]);

        // Check if all requests were successful
        if (!productResponse.ok) {
          throw new Error("Failed to fetch product");
        }
        if (!sizesResponse.ok) {
          throw new Error("Failed to fetch sizes");
        }
        if (!panelsResponse.ok) {
          throw new Error("Failed to fetch panels");
        }

        // Parse all responses
        const [productData, sizesData, panelsData] = await Promise.all([
          productResponse.json(),
          sizesResponse.json(),
          panelsResponse.json(),
        ]);

        // Set all data
        setProductData(productData);
        setSizesData(sizesData);
        setPanelsData(panelsData);
        setMaterialsData(productData.selectedMaterials);

        if (panelsData.items && panelsData.items.length > 0) {
          setActivePanel(panelsData.items[0].panelId);
        }
        if (sizesData.items && sizesData.items.length > 0) {
          setSelectedSize(sizesData.items[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);


  // Use transformed API data or fallback to mock data
  const cfg = useMemo(
    () => transformApiData(productData, sizesData, panelsData),
    [productData, sizesData, panelsData]
  );

  const selectedSizeObject = useMemo(() => {
    return cfg.sizes?.find((s: any) => s.id === selectedSize);
  }, [cfg.sizes, selectedSize]);

  const avatarData = useMemo(() => {
    // The product's own GLB is authoritative. Older products stored their model
    // only against a style or sole, so those are used as a fallback to keep the
    // viewport populated now that neither is selectable.
    const fallbackGlb =
      (productData?.selectedSoles || []).find((so: any) => so?.glbUrl)?.glbUrl ||
      (productData?.selectedStyles || []).find((st: any) => st?.glbUrl)?.glbUrl;

    return getAssetUrl(cfg.assets?.glb?.url || fallbackGlb);
  }, [productData?.selectedSoles, productData?.selectedStyles, cfg.assets?.glb?.url]);

  // Helper functions to get filtered materials and colors
  const getAvailableMaterials = () => {
    if (!materialsData) return [];

    // Case 1: Material filter is selected - show only that material
    if (selectedMaterialFilter !== "all") {
      const filteredMaterial = materialsData.filter(
        (material: any) => material.materialId === selectedMaterialFilter
      );
      return filteredMaterial;
    }

    // Case 2: Color filter is selected but no material - show all materials with that color family
    if (selectedColorFilter !== "all") {
      const materialsWithSelectedColor = materialsData.filter(
        (material: any) => {
          // Check if this material has the selected color family
          return material.selectedColor?.some(
            (color: any) => color.id === selectedColorFilter
          );
        }
      );
      return materialsWithSelectedColor;
    }

    // Case 3: No filters - show all materials
    return materialsData;
  };

  const getAvailableColors = () => {
    if (!materialsData) return [];

    if (selectedMaterialFilter === "all") {
      // Return all colors from all materials, deduplicated by family
      const allColors = materialsData.flatMap((material: any) =>
        material?.selectedColor?.map((color: any) => ({
          ...color,
          materialName: material.name,
          materialId: material.id,
        }))
      );

      // Deduplicate by color family, keeping the first occurrence
      // Only include colors that have a family (exclude null/undefined families)
      const uniqueColors = allColors?.reduce((acc: any[], color: any) => {
        if (color?.family) {
          // Check if this family already exists
          const existingFamily = acc.find((c) => c.family === color.family);
          if (!existingFamily) {
            acc.push(color);
          }
        }
        // Skip colors with null/undefined family
        return acc;
      }, []);
      return uniqueColors;
    } else {
      // Return unique colors from selected material only
      const selectedMaterial = materialsData.find(
        (m: any) => m.materialId === selectedMaterialFilter
      );

      if (!selectedMaterial) return [];

      const materialColors = selectedMaterial?.selectedColor?.map(
        (color: any) => ({
          ...color,
          materialName: selectedMaterial.name,
          materialId: selectedMaterial.id,
        })
      );

      // Deduplicate by color family, keeping the first occurrence
      // Only include colors that have a family (exclude null/undefined families)
      const uniqueColors = materialColors.reduce((acc: any[], color: any) => {
        if (color.family) {
          // Check if this family already exists
          const existingFamily = acc.find((c) => c.family === color.family);
          if (!existingFamily) {
            acc.push(color);
          }
        }
        // Skip colors with null/undefined family
        return acc;
      }, []);

      return uniqueColors;
    }
  };



  const clearAll = () => {
    if (cfg.panels && cfg.panels.length > 0) {
      setActivePanel(cfg.panels[0].id);
    }
    setSelectedColor(null);
    setInscription({ toe: "", tongue: "" });
    if (cfg.sizes && cfg.sizes.length > 0) {
      setSelectedSize(cfg.sizes[0].id);
    }
    setHistory((h) => [...h, selectedTextureMap]);
    setSelectedTextureMap({});
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      setSelectedTextureMap(prev);
    }
  };

  const [objectList, setObjectList] = useState<any>();
  const [selectedTextureMap, setSelectedTextureMap] = useState<
    Record<string, any>
  >({});

  useEffect(() => {
    if (!selectedPanelName && objectList?.length > 0) {
      setSelectedPanelName(objectList[0].name);
    }
  }, [objectList, selectedPanelName]);

  const handleBeforeAdd = async () => {
    if (shoeAvatarRef.current) {
      const screenshot = shoeAvatarRef.current.captureScreenshot();
      if (screenshot) {
        return { image: screenshot };
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-semibold mb-2">Error Loading Product</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 relative">
      {/* Header with breadcrumb navigation and title */}
      <header className="bg-white">
        {/* Breadcrumb & Title Container with separation line */}
        <div className="border-b border-gray-200 pt-1 pb-3.5 mb-2">
          <div className="max-w-5xl mx-auto px-4 flex flex-col justify-center items-center text-center">
            <h1 className="text-base md:text-lg font-bold text-gray-950 uppercase tracking-wider mb-1.5 select-none font-sans">
              {cfg.title?.replace("`", "'") || "Men's Luxury Chelsea Boots"}
            </h1>
            <nav className="text-[13px] text-gray-500 font-sans select-none flex items-center justify-center gap-1.5 flex-wrap">
              <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
              <span className="text-gray-300">›</span>
              <Link href="/collections" className="hover:text-gray-900 transition-colors">Create Design</Link>
              <span className="text-gray-300">›</span>
              <Link href="/collections" className="hover:text-gray-900 transition-colors">Create Men&apos;s Shoes</Link>
              <span className="text-gray-300">›</span>
              <span className="text-gray-900 font-semibold">{cfg.title?.replace("`", "'") || "Men's Luxury Chelsea Boots"}</span>
            </nav>
          </div>
        </div>

        {/* Back to list Link */}
        <div className="max-w-5xl mx-auto px-4 pt-1 pb-2">
          <Link 
            href="/collections" 
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 font-sans hover:underline transition-all"
          >
            <ChevronLeft size={16} />
            Back to list
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-2 pb-6 w-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 xl:gap-12">
          {/* Left: Enhanced Product Viewer */}
          <div className="space-y-6">
            {/* Main Product Image with Controls */}
            <div className="relative bg-gray-50 rounded-lg overflow-hidden">
              {/* Zoom, Save, Share Icons on Left Side */}
              <div className="absolute left-4 top-4 flex flex-row gap-3.5 z-10">
                <button 
                  className="bg-white p-2 rounded-full shadow-sm border border-gray-100 text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center cursor-pointer"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-4 h-4 stroke-[1.5]" />
                </button>
                <button 
                  className="bg-white p-2 rounded-full shadow-sm border border-gray-100 text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center cursor-pointer"
                  aria-label="Add to Wishlist"
                >
                  <Heart className="w-4 h-4 stroke-[1.5]" />
                </button>
                <button 
                  className="bg-white p-2 rounded-full shadow-sm border border-gray-100 text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center cursor-pointer"
                  aria-label="Share"
                >
                  <Share2 className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>

              {/* Undo & Clear Buttons in Middle Bottom */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3.5 z-10">
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="flex items-center gap-1.5 bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Undo className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1.5 bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:border-gray-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>

              {avatarData ? (
                <ShoeAvatar
                  ref={shoeAvatarRef}
                  avatarData={avatarData}
                  objectList={objectList}
                  setObjectList={setObjectList}
                  selectedTextureMap={selectedTextureMap}
                />
              ) : (
                <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}

            {/* Order Status */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                {cfg.orderStatus || "4 customers are processing an order"}
              </span>
              <span className="text-gray-400">•</span>
              <span className="font-medium">{cfg.vendor || "GIROTTI"}</span>
            </div>
          </div>

          {/* Right: Enhanced Customization Panel */}
          <div className="space-y-8">
            {/* Pricing Section */}
            <div className="mb-6 border-b border-gray-100 pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                {/* Price Section */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Price</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold text-red-600">
                      <Price amount={cfg.price || 329} />
                    </span>
                    {cfg.compareAtPrice && cfg.compareAtPrice > 0 ? (
                      <span className="text-xs text-gray-400 line-through">
                        <Price amount={cfg.compareAtPrice} />
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Size Selection & Add to Cart Container */}
                <div className="flex items-end gap-2 w-full sm:w-auto">
                  {/* Size Selection */}
                  <div className="flex flex-col gap-0.5 flex-1 sm:flex-none">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Size</span>
                    <select
                      value={selectedSize || ""}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full sm:w-28 h-8 border border-gray-300 rounded-full px-3 py-1 text-xs focus:border-red-500 bg-white"
                    >
                      <option value="" disabled>
                        Size
                      </option>
                      {(cfg.sizes || []).map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="flex-shrink-0 flex-1 sm:flex-none">
                    <AddToCartButton
                      productId={cfg.id || id}
                      title={cfg.title || ""}
                      price={cfg.price || 0}
                      originalPrice={cfg.compareAtPrice && cfg.compareAtPrice > 0 ? cfg.compareAtPrice : undefined}
                      image={getAssetUrl(cfg.assets?.thumbnail || "/ShoeSoleFixed.glb")}
                      size={selectedSizeObject || selectedSize}
                      variant="Default"
                      buttonVariant="default"
                      buttonSize="default"
                      className="w-full sm:w-auto h-8 px-5 rounded-full text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-all shadow-sm flex items-center justify-center whitespace-nowrap"
                      config={selectedTextureMap}
                      onBeforeAdd={handleBeforeAdd}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Customization */}
            <div>
              {/* Materials */}
              {activeTab === "Materials" && (
                <>
                  {/* Customization Instruction */}
                  <p className="text-xs text-gray-500 mb-3 text-center">
                    Choose a material and color for every part of your shoes
                  </p>

                  {/* Panel Selection */}
                  <div className="mb-3">
                    <div className="flex items-center gap-3">
                      {/* Label */}
                      <label className="text-xs font-medium text-gray-400 whitespace-nowrap">
                        Select a panel:
                      </label>

                      {/* Dropdown */}
                      <div className="relative flex-1">
                        <select
                          value={selectedPanelName || ""}
                          onChange={handlePanelChange}
                          className="w-full h-8 border border-gray-300 rounded-full px-3 pr-10 focus:ring-red-500 focus:border-red-500 appearance-none bg-white py-1 text-xs"
                        >
                          {/* Placeholder */}
                          <option value="" disabled hidden>
                            -- Choose Panel --
                          </option>

                          {/* Items */}
                          {objectList?.map((obj: any) => (
                            <option key={obj.name} value={obj.name}>
                              {obj.name.replace("_", " ")}
                            </option>
                          ))}
                        </select>

                        {/* Custom Dropdown Icon */}
                        <div className="absolute inset-y-0 right-0 flex items-center pr-0.5 pt-0.5 pb-0.5 pointer-events-none">
                          <div className="bg-red-500 h-7 w-7 flex items-center justify-center rounded-r-full">
                            <svg
                              className="w-3.5 h-3.5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Material and Color Filters */}
                  <div className="flex gap-2 mb-3 w-full">
                    {/* All Materials */}
                    <div className="flex-1 relative">
                      <select
                        value={selectedMaterialFilter}
                        onChange={(e) => {
                          setSelectedMaterialFilter(e.target.value);
                          setSelectedColorFilter("all");
                          setSelectedColor(null);
                        }}
                        className="w-full h-8 border border-gray-300 rounded-full px-3 pr-8 focus:ring-red-500 focus:border-red-500 appearance-none bg-white text-xs py-1"
                      >
                        <option value="all">All Materials</option>
                        {getAvailableMaterials().map((material: any) => (
                          <option
                            key={material.materialId}
                            value={material.materialId}
                          >
                            {material.materialName}
                          </option>
                        ))}
                      </select>

                      {/* Icon with gray background */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-0.5 pt-0.5 pb-0.5 pointer-events-none">
                        <div className="bg-gray-150 h-7 w-7 flex items-center justify-center rounded-r-full">
                          <svg
                            className="w-3 h-3 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* All Colors */}
                    <div className="flex-1 relative">
                      <select
                        value={selectedColorFilter}
                        onChange={(e) => {
                          setSelectedColorFilter(e.target.value);
                          setSelectedMaterialFilter("all");
                          setSelectedColor(null);
                        }}
                        className="w-full h-8 border border-gray-300 rounded-full px-3 pr-8 focus:ring-red-500 focus:border-red-500 appearance-none bg-white text-xs py-1"
                      >
                        <option value="all">All Colors</option>
                        {getAvailableColors().map((color: any) => (
                          <option key={color.id} value={color.id}>
                            {color.family}
                          </option>
                        ))}
                      </select>

                      {/* Icon with gray background */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-0.5 pt-0.5 pb-0.5 pointer-events-none">
                        <div className="bg-gray-150 h-7 w-7 flex items-center justify-center rounded-r-full">
                          <svg
                            className="w-3 h-3 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Material Categories with Color Swatches */}
                  <div className="space-y-4 mt-3 h-72 overflow-y-auto pr-1">
                    {getAvailableMaterials().map((material: any) => (
                      <div key={material.materialId} className="border-b border-gray-50 pb-3 last:border-b-0 last:pb-0">
                        {/* Material Name and Info */}
                        <div className="flex items-center gap-1.5 mb-2 justify-start">
                          <h4 className="text-xs font-medium text-gray-500 italic">
                            {material.materialName}
                          </h4>
                          <div className="w-3.5 h-3.5 bg-red-400 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-500 transition-colors">
                            <span className="text-white text-[9px] font-bold">
                              ?
                            </span>
                          </div>
                        </div>

                        {/* Color Swatches */}
                        <div className="flex flex-wrap gap-1.5 w-full justify-start">
                          {material.selectedColor?.map((color: any) => {
                            // If a color filter is selected, only show colors from that family
                            if (selectedColorFilter !== "all") {
                              const selectedColorData =
                                getAvailableColors().find(
                                  (c: any) => c.id === selectedColorFilter
                                );
                              if (
                                selectedColorData &&
                                color.family !== selectedColorData.family
                              ) {
                                return null;
                              }
                            }

                            const colorKey = `${material.materialId}-${color.id}`;
                            return (
                              <div
                                key={colorKey}
                                onClick={() => {
                                  const localUrl = getLocalTextureUrl(color.name, color.imageUrl);
                                  console.log("STEP 1: Swatch clicked. Details:", {
                                    colorKey,
                                    selectedPanelName,
                                    imageUrl: color.imageUrl,
                                    localUrl,
                                    materialName: material.materialName,
                                    colorName: color.name
                                  });
                                  setSelectedColor(colorKey);
                                  handleTextureChange(
                                    selectedPanelName,
                                    localUrl,
                                    material.materialName,
                                    color.name
                                  );
                                }}
                                className={`rounded-md overflow-hidden cursor-pointer transition-all duration-150 flex-shrink-0 ${
                                  selectedColor === colorKey
                                    ? "ring-2 ring-red-500 ring-offset-1 scale-95"
                                    : "border border-gray-200 hover:scale-105"
                                }`}
                              >
                                <img
                                  src={getLocalTextureUrl(color.name, color.imageUrl)}
                                  alt={color.name}
                                  className="object-cover w-8 h-8 block"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Inscription */}
              {activeTab === "Inscription" && (
                <div>
                  <h3 className="font-medium mb-2">Inscription / Monogram</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">
                        Toe (2 chars)
                      </label>
                      <input
                        maxLength={2}
                        value={inscription.toe}
                        onChange={(e) =>
                          setInscription((p) => ({
                            ...p,
                            toe: e.target.value.toUpperCase(),
                          }))
                        }
                        className="w-full border rounded-md px-2 py-2 mt-1"
                        placeholder="AB"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">
                        Tongue (optional)
                      </label>
                      <input
                        maxLength={12}
                        value={inscription.tongue}
                        onChange={(e) =>
                          setInscription((p) => ({
                            ...p,
                            tongue: e.target.value,
                          }))
                        }
                        className="w-full border rounded-md px-2 py-2 mt-1"
                        placeholder="Name"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Preview will render on the 3D model (in the real viewer).
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div>
              {/* Top Divider */}
              <div className="border-t border-gray-300"></div>

              {/* Buttons */}
              <div className="flex gap-4 justify-center py-1">
                {/* Save to wishlist */}
                <WishlistButton
                  productId={id}
                  title={productData?.title || ""}
                  price={productData?.price || 0}
                  originalPrice={productData?.compareAtPrice || undefined}
                  image={getAssetUrl(productData?.assets?.thumbnail) || undefined}
                  className="flex-1 flex items-center justify-center gap-2 bg-white py-1 px-4 font-medium hover:bg-gray-50 transition-colors border-0 shadow-none rounded-none text-sm"
                  buttonVariant="ghost"
                />

                {/* Send inquiry */}
                <button className="flex-1 flex items-center justify-center gap-2 bg-white py-1 px-4 font-medium hover:bg-gray-50 transition-colors border-0 shadow-none rounded-none text-sm text-black cursor-pointer">
                  <MessageCircle className="w-5 h-5 stroke-2 text-black" />
                  <span>
                    Send inquiry
                  </span>
                </button>
              </div>

              {/* Bottom Divider */}
              <div className="border-t border-gray-300"></div>
            </div>
          </div>
        </div>

        {/* Product Information Tabs */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button className="py-2 px-1 border-b-2 border-red-600 text-sm font-medium text-red-600">
                Product Description
              </button>
              <button className="py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                More information
              </button>
            </nav>
          </div>

          <div className="py-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {cfg.description ||
                  "Luxury Edition of hand-dyed dress shoes. These shoes embody authority, elegance, and comfort, blending classic and modern looks. Start designing your handcrafted shoes now."}
              </p>
            </div>
          </div>
        </div>

        {/* Key Features Section */}
        <div className="mt-12 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-sm font-medium text-red-800 mb-1">
                FREE Delivery & Returns
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-red-800 mb-1">
                100% Quality guaranteed
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-red-800 mb-1">
                100% Italian Style
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-red-800 mb-1">
                100% Hand Made Shoes
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
