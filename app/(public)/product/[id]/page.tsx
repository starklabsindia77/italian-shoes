/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ZoomIn,
  Save,
  Share2,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import dynamic from "next/dynamic";

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

/* ----------------------
   Types & Product Config
   ---------------------- */
type Panel = {
  id: string;
  name: string;
  meshName?: string;
  thumbnail?: string;
};
type Material = {
  id: string;
  name: string;
  thumbnail?: string;
  description?: string;
  textures?: string[];
};
type Style = { id: string; name: string; thumbnail?: string; glb?: string };
type Sole = { id: string; name: string; thumbnail?: string; height?: string };
type Color = { id: string; name: string; textureUrl: string };

const product = {
  id: "mens-luxury-dress-shoes",
  title: "Men's Luxury Dress Shoes",
  vendor: "GIROTTI",
  price: 329,
  compareAtPrice: 519,
  currency: "USD",
  images: [
    "/placeholder/shoe-main.jpg",
    "/placeholder/shoe-side.jpg",
    "/placeholder/shoe-top.jpg",
    "/placeholder/shoe-heel.jpg",
  ],
  colorVariants: [
    { id: "brown", name: "Brown", image: "/placeholder/shoe-brown.jpg" },
    { id: "black", name: "Black", image: "/placeholder/shoe-black.jpg" },
    { id: "red", name: "Red", image: "/placeholder/shoe-red.jpg" },
    { id: "blue", name: "Blue", image: "/placeholder/shoe-blue.jpg" },
  ],
  panels: [
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
  ] as Panel[],
  materialCategories: [
    {
      id: "metallic",
      name: "Metallic finish premium leather",
      colors: [
        { id: "metallic-brown-1", name: "Metallic Brown 1", hex: "#8B4513" },
        { id: "metallic-brown-2", name: "Metallic Brown 2", hex: "#A0522D" },
        { id: "metallic-orange", name: "Metallic Orange", hex: "#FF8C00" },
        { id: "metallic-red-1", name: "Metallic Red 1", hex: "#DC143C" },
        { id: "metallic-red-2", name: "Metallic Red 2", hex: "#B22222" },
        { id: "metallic-blue-1", name: "Metallic Blue 1", hex: "#4169E1" },
        { id: "metallic-blue-2", name: "Metallic Blue 2", hex: "#0000CD" },
        { id: "metallic-green-1", name: "Metallic Green 1", hex: "#228B22" },
        { id: "metallic-green-2", name: "Metallic Green 2", hex: "#006400" },
        { id: "metallic-purple", name: "Metallic Purple", hex: "#8A2BE2" },
        { id: "metallic-gold", name: "Metallic Gold", hex: "#FFD700" },
        { id: "metallic-silver", name: "Metallic Silver", hex: "#C0C0C0" },
        { id: "metallic-copper", name: "Metallic Copper", hex: "#B87333" },
        { id: "metallic-bronze", name: "Metallic Bronze", hex: "#CD7F32" },
        { id: "metallic-rose", name: "Metallic Rose", hex: "#E91E63" },
      ],
    },
    {
      id: "premium",
      name: "Premium leather",
      colors: [
        { id: "premium-brown-1", name: "Premium Brown 1", hex: "#8B4513" },
        { id: "premium-brown-2", name: "Premium Brown 2", hex: "#A0522D" },
        { id: "premium-brown-3", name: "Premium Brown 3", hex: "#D2691E" },
        { id: "premium-red-1", name: "Premium Red 1", hex: "#DC143C" },
        { id: "premium-red-2", name: "Premium Red 2", hex: "#B22222" },
        { id: "premium-blue-1", name: "Premium Blue 1", hex: "#4169E1" },
        { id: "premium-blue-2", name: "Premium Blue 2", hex: "#0000CD" },
        { id: "premium-green-1", name: "Premium Green 1", hex: "#228B22" },
        { id: "premium-green-2", name: "Premium Green 2", hex: "#006400" },
        { id: "premium-black", name: "Premium Black", hex: "#000000" },
        { id: "premium-tan", name: "Premium Tan", hex: "#D2B48C" },
        { id: "premium-burgundy", name: "Premium Burgundy", hex: "#800020" },
        { id: "premium-navy", name: "Premium Navy", hex: "#000080" },
        { id: "premium-forest", name: "Premium Forest", hex: "#228B22" },
        { id: "premium-cognac", name: "Premium Cognac", hex: "#9F4E3B" },
      ],
    },
    {
      id: "high-shine",
      name: "High shine premium leather",
      colors: [
        { id: "shine-black", name: "High Shine Black", hex: "#000000" },
        { id: "shine-navy", name: "High Shine Navy", hex: "#000080" },
        { id: "shine-forest", name: "High Shine Forest", hex: "#228B22" },
        { id: "shine-burgundy", name: "High Shine Burgundy", hex: "#800020" },
        { id: "shine-brown", name: "High Shine Brown", hex: "#8B4513" },
      ],
    },
  ],
  styles: [
    {
      id: "derby",
      name: "Derby",
      thumbnail: "/placeholder/style-derby.jpg",
      glb: "/glb/derby.glb",
    },
    {
      id: "oxford",
      name: "Oxford",
      thumbnail: "/placeholder/style-oxford.jpg",
      glb: "/glb/oxford.glb",
    },
  ] as Style[],
  soles: [
    {
      id: "leather",
      name: "Leather Sole",
      thumbnail: "/placeholder/sole-leather.jpg",
      height: "2.0 cm",
    },
    {
      id: "rubber",
      name: "Rubber Sole",
      thumbnail: "/placeholder/sole-rubber.jpg",
      height: "2.5 cm",
    },
  ] as Sole[],
  sizes: [
    { id: "40", label: "EU 40 / UK 6 / US 7" },
    { id: "41", label: "EU 41 / UK 7 / US 8" },
    { id: "42", label: "EU 42 / UK 8 / US 9" },
    { id: "43", label: "EU 43 / UK 9 / US 10" },
    { id: "44", label: "EU 44 / UK 9.5 / US 10.5" },
    { id: "45", label: "EU 45 / UK 10 / US 11" },
  ],
  description:
    "Luxury Edition of hand-dyed dress shoes. These shoes embody authority, elegance, and comfort, blending classic and modern looks. Start designing your handcrafted shoes now.",
  shippingInfo:
    "Manufacturing and delivery to India in 5-10 days only: $ 48.10",
  orderStatus: "4 customers are processing an order",
};

/* ----------------------
   Small Presentational Components
   ---------------------- */

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
    {children}
  </span>
);

const Toolbar: React.FC<{ onClear: () => void }> = ({ onClear }) => (
  <div className="absolute top-3 left-3 flex gap-2 z-20">
    <button className="bg-white p-2 rounded-md shadow-sm text-sm">Undo</button>
    <button className="bg-white p-2 rounded-md shadow-sm text-sm">Redo</button>
    <button
      onClick={onClear}
      className="bg-white p-2 rounded-md shadow-sm text-sm text-red-600"
    >
      Clear
    </button>
  </div>
);

const ViewerPlaceholder: React.FC<{
  src: string;
  panels: Panel[];
  activePanel?: string | null;
  appliedTextures: Record<string, string | null>;
}> = ({ src, panels, activePanel, appliedTextures }) => (
  <div className="relative bg-white border rounded-lg overflow-hidden h-[540px] flex items-center justify-center">
    <div className="absolute top-3 right-3 z-10 text-xs text-gray-500 bg-white p-2 rounded-md">
      Double tap to zoom
    </div>
    <img
      src={src}
      alt="shoe"
      className="object-contain max-h-full max-w-full"
    />
  </div>
);

/* ----------------------
   Main Builder Component
   ---------------------- */

export default function DerbyBuilderClean() {
  // State for API data
  const { id } = useParams<{ id: string }>();
  const [productData, setProductData] = useState<any>(null);
  const [sizesData, setSizesData] = useState<any>(null);
  const [panelsData, setPanelsData] = useState<any>(null);
  const [materialsData, setMaterialsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI-only state
  const [imageIndex, setImageIndex] = useState(0);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "Materials" | "Style" | "Soles" | "Colors" | "Inscription"
  >("Materials");
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(
    "premium-black"
  );
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedSole, setSelectedSole] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [appliedTextures, setAppliedTextures] = useState<
    Record<string, string | null>
  >({});
  const [inscription, setInscription] = useState({ toe: "", tongue: "" });
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Filter state for materials and colors
  const [selectedMaterialFilter, setSelectedMaterialFilter] =
    useState<string>("all");
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>("all");
  const [selectedPanelName, setSelectedPanelName] = useState<string>("");

  const handlePanelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPanelName(e.target.value);
  };

  const handleTextureChange = (panelId: string, textureUrl: string) => {
    setSelectedTextureMap((prev) => ({
      ...prev,
      [panelId]: { colorUrl: textureUrl },
    }));
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

        // Initialize UI state with first available options
        if (panelsData.items && panelsData.items.length > 0) {
          setActivePanel(panelsData.items[0].panelId);
          setAppliedTextures(
            Object.fromEntries(
              panelsData.items.map((p: any) => [p.panelId, null])
            )
          );
        }
        if (productData.styles && productData.styles.length > 0) {
          setSelectedStyle(productData.styles[0].id);
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

  // Transform API data to match UI expectations
  const transformApiData = (
    productApiData: any,
    sizesApiData: any,
    panelsApiData: any
  ) => {
    if (!productApiData) return product;

    return {
      ...productApiData,
      // Add default images if not present
      images: productApiData.images || [
        "/placeholder/shoe-1.jpg",
        "/placeholder/shoe-2.jpg",
        "/placeholder/shoe-3.jpg",
      ],

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
            label: `${size.name}${
              size.euEquivalent ? ` / ${size.euEquivalent}` : ""
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

  // Use transformed API data or fallback to mock data
  const cfg = transformApiData(productData, sizesData, panelsData);

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

  const getFilteredMaterialCategories = () => {
    if (!materialsData?.materials) return cfg.materialCategories || [];

    // Transform API materials data to match the expected format
    return materialsData.materials.map((material: any) => ({
      id: material.id,
      name: material.name,
      colors: material.colors.map((color: any) => ({
        id: color.id,
        name: color.name,
        hex: color.hexCode || "#000000",
      })),
    }));
  };

  const actionsCount = useMemo(
    () =>
      [
        selectedMaterial,
        selectedStyle,
        selectedSole,
        selectedColor,
        ...Object.values(appliedTextures),
      ].filter(Boolean).length,
    [
      selectedMaterial,
      selectedStyle,
      selectedSole,
      selectedColor,
      appliedTextures,
    ]
  );

  const applyTexture = (textureUrl: string) => {
    if (!activePanel) return;
    setAppliedTextures((prev) => ({ ...prev, [activePanel]: textureUrl }));
    setSelectedColor(textureUrl);
  };

  const clearAll = () => {
    if (cfg.panels && cfg.panels.length > 0) {
      setActivePanel(cfg.panels[0].id);
      setAppliedTextures(
        Object.fromEntries(cfg.panels.map((p: any) => [p.id, null]))
      );
    }
    setSelectedMaterial(null);
    setSelectedSole(null);
    setSelectedColor(null);
    setInscription({ toe: "", tongue: "" });
    if (cfg.sizes && cfg.sizes.length > 0) {
      setSelectedSize(cfg.sizes[0].id);
    }
  };

  const [objectList, setObjectList] = useState<any>();
  const [selectedTextureMap, setSelectedTextureMap] = useState<
    Record<string, any>
  >({});

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
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header with back button and title */}
      <header className="bg-white mt-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* <div className="flex items-center gap-4 mb-2">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to list</span>
            </button>
          </div> */}
          <div className="flex flex-col justify-center items-center text-sm text-gray-500 w-full">
            <h1 className="text-xl font-semibold text-gray-900">
              {cfg.title || "Men's Luxury Dress Shoes"}
            </h1>
            Home &gt; Create Design &gt; Create Men's Shoes &gt; Men`s Derby
            Shoes
          </div>
          {/* Divider */}
          <div className="w-full border-t border-gray-300 mt-4"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-12">
          {/* Left: Enhanced Product Viewer */}
          <div className="space-y-6">
            {/* Main Product Image with Controls */}
            <div className="relative bg-gray-50 rounded-lg overflow-hidden">
              {/* <div className="absolute top-4 left-4 z-10 flex gap-2">
                <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors">
                  <Save className="w-4 h-4" />
                </button>
                <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              
              <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors z-10">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors z-10">
                <ChevronRight className="w-5 h-5" />
              </button>

              
              <div className="aspect-square flex items-center justify-center p-8">
                <img
                  src={cfg.images?.[imageIndex] || '/placeholder/shoe-main.jpg'}
                  alt="Product"
                  className="max-w-full max-h-full object-contain"
                />
              </div> */}

              <ShoeAvatar
                avatarData="/ShoeSoleFixed.glb"
                objectList={objectList}
                setObjectList={setObjectList}
                // selectedPanelName={selectedPanelName}
                selectedTextureMap={selectedTextureMap}
              />
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
            <div className="mb-6">
              <div className="flex justify-between items-center gap-4">
                {/* Price Section */}
                <div className="flex flex-col gap-0.5">
                  <div className="text-lg font-normal text-red-600 leading-none">
                    ${cfg.price || 329}
                  </div>
                  <div className="text-sm font-bold text-gray-700 line-through leading-none">
                    ${cfg.compareAtPrice || 519}
                  </div>
                </div>

                {/* Size Selection + Add to Cart */}
                <div className="flex gap-4 items-center">
                  {/* Size Dropdown */}
                  <select
                    value={selectedSize || ""}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-48 h-10 border border-gray-300 rounded-full px-4 pr-12 py-2 text-sm focus:border-red-500"
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

                  {/* Add to Cart Button */}
                  <button className="bg-red-600 flex items-center justify-center h-10 text-white px-6 rounded-full font-normal hover:bg-red-700 transition-colors text-sm">
                    ADD TO CART
                  </button>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="text-xs text-gray-600 mt-2 text-right">
                {cfg.shippingInfo ||
                  "Manufacturing and delivery to India in 5-10 days only"}
              </div>
            </div>

            {/* Customization Tabs */}
            <div>
              <div className="mb-3">
                <div className="relative inline-flex bg-gray-200 rounded-full h-8 shadow-sm w-full justify-center items-center">
                  {(["Materials", "Style", "Soles"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`relative px-6 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center ${
                        activeTab === t
                          ? "bg-red-500 text-white shadow-sm h-10 -my-1"
                          : "text-gray-700 hover:text-gray-900 h-8"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Materials */}
              {activeTab === "Materials" && (
                <>
                  {/* Customization Instruction */}
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Choose a material and color for every part of your shoes
                  </p>

                  {/* Panel Selection */}
                  <div className="mb-3">
                    <div className="flex items-center gap-4">
                      {/* Label */}
                      <label className="text-sm font-light text-gray-400 whitespace-nowrap">
                        Select a panel:
                      </label>

                      {/* Dropdown */}
                      <div className="relative flex-1">
                        <select
                          value={selectedPanelName || ""}
                          onChange={handlePanelChange}
                          className="w-full h-8 border border-gray-500 rounded-full px-3 pr-10 focus:ring-red-600 focus:border-red-500 appearance-none bg-white py-1 text-sm"
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
                          <div className="bg-red-500 h-full w-8 flex items-center justify-center rounded-r-full">
                            <svg
                              className="w-4 h-4 text-white"
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
                  <div className="flex justify-end gap-4 mb-3">
                    {/* All Materials */}
                    <div className="w-40 relative">
                      <select
                        value={selectedMaterialFilter}
                        onChange={(e) => {
                          setSelectedMaterialFilter(e.target.value);
                          setSelectedColorFilter("all");
                          setSelectedColor(null);
                        }}
                        className="w-full h-8 border border-gray-300 rounded-full px-3 pr-10 focus:ring-red-500 focus:border-red-500 appearance-none bg-white text-sm py-1"
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
                      <div className="absolute inset-y-0 right-0 flex items-center pr-0.5 pt-0.2 pb-0.2 pointer-events-none">
                        <div className="bg-gray-200 h-6 w-8 flex items-center justify-center rounded-r-full">
                          <svg
                            className="w-4 h-4 text-gray-600"
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
                    <div className="w-40 relative">
                      <select
                        value={selectedColorFilter}
                        onChange={(e) => {
                          setSelectedColorFilter(e.target.value);
                          setSelectedMaterialFilter("all");
                          setSelectedColor(null);
                        }}
                        className="w-full h-8 border border-gray-300 rounded-full px-3 pr-10 focus:ring-red-500 focus:border-red-500 appearance-none bg-white text-sm py-1"
                      >
                        <option value="all">All Colors</option>
                        {getAvailableColors().map((color: any) => (
                          <option key={color.id} value={color.id}>
                            {color.family}
                          </option>
                        ))}
                      </select>

                      {/* Icon with gray background */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-0.5 pt-0.2 pb-0.2 pointer-events-none">
                        <div className="bg-gray-200 h-6 w-8 flex items-center justify-center rounded-r-full">
                          <svg
                            className="w-4 h-4 text-gray-600"
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
                  <div className="space-y-6 mt-4 h-80 overflow-y-auto">
                    {getAvailableMaterials().map((material: any) => (
                      <div key={material.materialId}>
                        {/* Material Name and Info */}
                        <div className="flex items-center gap-2 mb-3 justify-end">
                          <h4 className="text-sm font-normal text-gray-500 italic">
                            {material.materialName}
                          </h4>
                          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              ?
                            </span>
                          </div>
                        </div>

                        {/* Color Swatches */}
                        <div className="flex flex-wrap gap-2 w-full justify-end">
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

                            return (
                              <div
                                key={color.id}
                                onClick={() => {
                                  setSelectedColor(color.id);
                                  handleTextureChange(
                                    selectedPanelName,
                                    color.imageUrl
                                  );
                                }}
                                className={`rounded-md transition flex-shrink-0 ${
                                  selectedColor === color.id
                                    ? "border-red-500 ring-1 ring-red-100"
                                    : "border-gray-200"
                                }`}
                              >
                                <img
                                  src={color.imageUrl}
                                  alt={color.name}
                                  className="object-contain w-12 h-12"
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

              {/* Style */}
              {activeTab === "Style" && (
                <div>
                  <h3 className="font-medium mb-2">Style</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(cfg.selectedStyles || []).map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStyle(s.id)}
                        className={`p-2 rounded-md border transition ${
                          selectedStyle === s.id
                            ? "border-red-500 ring-1 ring-red-100"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="w-full h-20 rounded-md overflow-hidden bg-gray-50 mb-1 flex items-center justify-center">
                          <img
                            src={s.imageUrl}
                            alt={s.name}
                            className="object-contain w-full h-full"
                          />
                        </div>
                        <div className="text-sm text-center">{s.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Soles */}
              {activeTab === "Soles" && (
                <div>
                  <h3 className="font-medium mb-2">Soles</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(cfg.selectedSoles || []).map((so: any) => (
                      <button
                        key={so.id || so.name}
                        onClick={() => setSelectedSole(so.id || so.name)}
                        className={`p-2 rounded-md border transition ${
                          selectedSole === (so.id || so.name)
                            ? "border-red-500 ring-1 ring-red-100"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="w-full h-20 rounded-md overflow-hidden bg-gray-50 mb-2 flex items-center justify-center">
                          <img
                            src={so.imageUrl}
                            alt={so.name}
                            className="object-contain w-full h-full"
                          />
                        </div>
                        <div className="text-sm font-medium">{so.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {activeTab === "Colors" && (
                <div>
                  <h3 className="font-medium mb-2">Colors & Textures</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {(cfg.colors || []).map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => applyTexture(c.textureUrl)}
                        title={c.name}
                        className={`rounded-md overflow-hidden w-full h-20 border transition ${
                          selectedColor === c.textureUrl
                            ? "ring-2 ring-red-400 border-transparent"
                            : "border-gray-200"
                        }`}
                      >
                        <img
                          src={c.textureUrl}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
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
                <button className="flex-1 flex items-center justify-center gap-2 bg-white py-1 px-4 font-medium hover:bg-gray-50 transition-colors">
                  <Heart className="w-5 h-5 text-red-600 fill-red-600" />
                  <span className="underline decoration-gray-300">
                    Save to wishlist
                  </span>
                </button>

                {/* Send inquiry */}
                <button className="flex-1 flex items-center justify-center gap-2 bg-white py-1 px-4 font-medium hover:bg-gray-50 transition-colors">
                  <MessageCircle className="w-5 h-5 text-red-600 fill-red-600" />
                  <span className="underline decoration-gray-300">
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
