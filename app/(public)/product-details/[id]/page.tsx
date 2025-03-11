/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Heart, Share2, X, Edit2, ChevronLeft } from "lucide-react";

// Interfaces for Product Data
interface Size {
  id: number;
  sizeSystem: string;
  size: string;
  width: string;
}

interface Style {
  id: number;
  name: string;
  imageUrl: string;
}

interface Sole {
  id: number;
  type: string;
  height: string;
  imageUrl: string;
}

interface Material {
  id: number;
  name: string;
  description: string;
}

interface Color {
  id: number;
  name: string;
  hexCode: string;
  imageUrl: string;
}

interface Panel {
  id: number;
  name: string;
  description: string;
}

interface ProductImage {
  url: string;
  altText: string | null;
}

interface ProductVariant {
  id: number;
  title: string;
  price: number;
  inventoryQuantity: number;
  images: ProductImage[];
  options: {
    size: Size;
    style: Style;
    sole: Sole;
    material: Material;
    color: Color;
    panel: Panel;
  };
}
interface ShopifyImage {
  id: string;
  src: string;
  alt: string | null;
  position: number;
  width: number | null;
  height: number | null;
}

interface ShopifyVariant {
  id: string;
  title: string;
  price: number;
  sku: string;
  inventoryQuantity: number;
  inventoryPolicy: string;
  barcode: string | null;
  weight: number;
  weightUnit: string;
  position: number;
}
interface Product {
  id: number;
  title: string;
  description: string;
  price: number[];
  variants: ProductVariant[];
  vendor: string;
  productType: string;
  handle: string;
  status: string;
  tags: string[];
  imageUrl: string;
  shopifyVariants: ShopifyVariant[];
  shopifyImages: ShopifyImage[];
  variantsOptions: {
    sizes: Size[];
    styles: Style[];
    soles: Sole[];
    materials: Material[];
    colors: Color[];
    panels: Panel[];
  };
}

// interface Product {
//   id: number;
//   title: string;
//   description: string;
//   price: number[];
//   variants: ProductVariant[];
//   vendor: string;
//   variantsOptions: {
//     sizes: Size[];
//     styles: Style[];
//     soles: Sole[];
//     materials: Material[];
//     colors: Color[];
//     panels: Panel[];
//   };
// }

const relatedProducts = [
  {
    id: 1,
    title: "Premium Oxford Shoes",
    price: 299.0,
    image:
      "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Elegant Derby Shoes",
    price: 279.0,
    image:
      "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    title: "Classic Loafers",
    price: 229.0,
    image:
      "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=400&h=400&fit=crop",
  },
  {
    id: 4,
    title: "Luxury Monk Straps",
    price: 319.0,
    image:
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&h=400&fit=crop",
  },
];

const ProductPage = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedTab, setSelectedTab] = useState("Materials");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [appliedSelections, setAppliedSelections] = useState<boolean>(false);
  const [isDesignEditorOpen, setIsDesignEditorOpen] = useState(false);

  // **User Selections**
  const [selectedCombination, setSelectedCombination] = useState<{
    size: Size | null;
    style: Style | null;
    sole: Sole | null;
    material: Material | null;
    color: Color | null;
    panel: Panel | null;
  }>({
    size: null,
    style: null,
    sole: null,
    material: null,
    color: null,
    panel: null,
  });

  // **Variant After Applying Selection**
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(
    null
  );

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch("/api/product/9935528395044");
        const data = await response.json();
        console.log("Product Data:", data);
        setProduct(data);
        // setCurrentVariant(data.variants[0]); // Default variant
        setSelectedImage(data.imageUrl);
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };
    fetchProduct();
  }, []);

  const CloseEditor = () => {
    setIsDesignEditorOpen(false);
    setCurrentVariant(null);
    setSelectedImage(product?.imageUrl);
  }

  const clearSelections = () => {
    if (!product) return;
    setAppliedSelections(false);
    // setCurrentVariant(product.variants[0]);
  };

  // **Apply Selections and Check for Variant**
  const applySelection = () => {
    if (!product) return;

    const matchingVariant = product.variants.find((variant) => {
      return (
        variant.options.size?.id === selectedCombination.size?.id &&
        variant.options.style?.id === selectedCombination.style?.id &&
        variant.options.sole?.id === selectedCombination.sole?.id &&
        variant.options.material?.id === selectedCombination.material?.id &&
        variant.options.color?.id === selectedCombination.color?.id &&
        variant.options.panel?.id === selectedCombination.panel?.id
      );
    });
    setAppliedSelections(true);

    if (matchingVariant) {
      console.log("Matching Variant:", matchingVariant);
      setCurrentVariant(matchingVariant);
      setSelectedImage(matchingVariant.images[0]);
    } else {
      setCurrentVariant(null);
      setModalOpen(true);
    }
  };

  if (!product) {
    return <div className="text-center py-10">Loading product...</div>;
  }

  const NavTabs = () => (
    <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
      {["Materials", "Style", "Soles", "Extras"].map((tab) => (
        <button
          key={tab}
          onClick={() => setSelectedTab(tab)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedTab === tab
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );

  const RelatedProductsSlider = () => (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">You May Also Like</h2>
        <div className="relative">
          <div className="overflow-hidden">
            <Swiper
              spaceBetween={10}
              slidesPerView={4}
              className="related-products-slider"
              breakpoints={{
                640: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 },
              }}
            >
              {relatedProducts.map((related) => (
                <SwiperSlide key={related.id}>
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <img
                      src={related.image}
                      alt={related.title}
                      className="object-cover w-full h-48"
                    />
                    <div className="p-4">
                      <h3 className="font-medium mb-2">{related.title}</h3>
                      <p className="text-lg font-semibold text-red-500">
                        ${related.price}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </div>
  );

  const CombinationNotAvailableModal = () =>
    modalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Combination Not Available</h2>
            <button
              onClick={() => setModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            The selected combination is currently unavailable. Please try a
            different combination.
          </p>
          <button
            onClick={() => setModalOpen(false)}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );

  const ImageGallery = () => (
    <div className="space-y-4">
      <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
        {currentVariant ? (
          <img
            src={selectedImage?.url || "/api/placeholder/600/600"}
            alt={selectedImage?.altText || product.title}
            className="object-cover w-full h-full"
          />
        ) : (

          <img
            src={selectedImage || "/api/placeholder/600/600"}
            alt={product.title}
            className="object-cover w-full h-full"
          />
          // <div className="flex items-center justify-center h-full">
          //   <span className="text-gray-500">
          //     Current combination not available
          //   </span>
          // </div>
        )}
      </div>

      {currentVariant ? (
        <Swiper 
          spaceBetween={10} 
          slidesPerView={4} 
          className="image-slider"
          breakpoints={{
            320: { slidesPerView: 3 },
            640: { slidesPerView: 4 },
          }}
        >
          {currentVariant.images.map((image, index) => (
            <SwiperSlide key={index}>
              <button 
                className={`aspect-square rounded-lg overflow-hidden border-2 ${
                  selectedImage?.url === image.url 
                    ? "border-red-500" 
                    : "border-transparent hover:border-red-300"
                }`} 
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.url}
                  alt={image.altText || `View ${index + 1}`}
                  className="object-cover w-full h-full"
                />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : product.shopifyImages.length > 0 ? <Swiper 
      spaceBetween={10} 
      slidesPerView={4} 
      className="image-slider"
      breakpoints={{
        320: { slidesPerView: 3 },
        640: { slidesPerView: 4 },
      }}
    >
      {product.shopifyImages.map((image, index) => (
        <SwiperSlide key={index}>
          <button 
            className={`aspect-square rounded-lg overflow-hidden border-2 ${
              selectedImage === image?.src 
                ? "border-red-500" 
                : "border-transparent hover:border-red-300"
            }`} 
            onClick={() => setSelectedImage(image.src)}
          >
            <img
              src={image.src}
              alt={`View ${index + 1}`}
              className="object-cover w-full h-full"
            />
          </button>
        </SwiperSlide>
      ))}
    </Swiper> : null}
    </div>
  );

  const MaterialSelector = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium mb-2">
          Select Materials and Colors
        </h3>
        {/* Panel Selection Dropdown */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Select Panel:</label>
          <select
            value={selectedCombination.panel?.id || ""}
            onChange={(e) => {
              const panelInfo = product.variantsOptions.panels.find(
                (p) => p.id === Number(e.target.value)
              );
              setSelectedCombination({
                ...selectedCombination,
                panel: panelInfo || null,
              });
            }}
            className="border rounded-lg px-2 py-1 w-48"
          >
            <option value="">Choose a Panel</option>
            {product.variantsOptions.panels.map((panel) => (
              <option key={panel.id} value={panel.id}>
                {panel.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {product.variantsOptions.materials.map((material) => (
          <div key={material.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{material.name}</span>
              {material.description && (
                <span className="text-xs text-gray-500">
                  {material.description}
                </span>
              )}
            </div>

            {/* Color Swatches */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {product.variantsOptions.colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => {
                    setSelectedCombination({
                      ...selectedCombination,
                      material,
                      color,
                    });
                  }}
                  className={`relative w-10 h-10 rounded-full border-2 overflow-hidden transform transition-all hover:scale-110 ${
                    selectedCombination.material?.id === material.id &&
                    selectedCombination.color?.id === color.id
                      ? "border-red-500 scale-110"
                      : "border-gray-300"
                  }`}
                  title={color.name}
                >
                  <img
                    src={color.imageUrl}
                    alt={color.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SoleSelector = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-2">Select Sole</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {product.variantsOptions.soles.map((sole) => (
          <button
            key={sole.id}
            onClick={() =>
              setSelectedCombination({ ...selectedCombination, sole })
            }
            className={`relative p-2 border-2 rounded-lg overflow-hidden transform transition-all hover:shadow-md ${
              selectedCombination.sole?.id === sole.id
                ? "border-red-500"
                : "border-gray-200 hover:border-red-300"
            }`}
            title={sole.type}
          >
            <img
              src={sole?.imageUrl || "/api/placeholder/100/100"} 
              alt={`${sole.type}`}
              className="w-full h-20 object-cover"
            />
            <div className="text-center mt-1 text-xs text-gray-700">
              {sole.height}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const StyleSelector = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-2">Select Style</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {product.variantsOptions.styles.map((style) => (
          <button
            key={style.id}
            onClick={() =>
              setSelectedCombination({ ...selectedCombination, style })
            }
            className={`p-2 border-2 rounded-lg transition-all hover:shadow-md ${
              selectedCombination.style?.id === style.id
                ? "border-red-500"
                : "border-gray-200 hover:border-red-300"
            }`}
          >
            <img
              src={style.imageUrl}
              alt={style.name}
              className="w-full h-32 object-contain"
            />
            <div className="text-sm text-center mt-2">{style.name}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const stripHtml = (html: any) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Design Editor component that will be shown/hidden
  const DesignEditor = () => (
    // <div className={``}>
      <div className="max-w-7xl mx-auto">       
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-6">
            {/* <div className="flex justify-between items-center">             
              
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Select Size:</label>
                <select
                  value={selectedCombination.size?.id || ""}
                  onChange={(e) => {
                    const size = product.variantsOptions.sizes.find(
                      (s) => s.id === Number(e.target.value)
                    );
                    setSelectedCombination({
                      ...selectedCombination,
                      size: size || null,
                    });
                  }}
                  className="border rounded-lg px-3 py-2 w-48 focus:border-red-300 focus:ring focus:ring-red-200"
                >
                  <option value="">Choose a Size</option>
                  {product.variantsOptions.sizes.map((size) => (
                    <option key={size.id} value={size.id}>
                      {`${size.size} (${size.sizeSystem}${
                        size.width ? ` - ${size.width}` : ""
                      })`}
                    </option>
                  ))}
                </select>
              </div>
              
              <button 
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                onClick={appliedSelections ? clearSelections : applySelection}
              >
                {appliedSelections ? "Reset Design" : "Apply Selection"}
              </button>
            </div> */}

            <NavTabs />

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {selectedTab === "Materials" && <MaterialSelector />}
              {selectedTab === "Style" && <StyleSelector />}
              {selectedTab === "Soles" && <SoleSelector />}
              {selectedTab === "Extras" && (
                <div className="text-center py-4 text-gray-500">
                  Additional customization options coming soon
                </div>
              )}
            </div>
            
            {/* {currentVariant ? (
              <div className="flex justify-between items-center border-t border-b py-4">
                <div>
                  <h3 className="font-medium">Selected Design</h3>
                  <p className="text-sm text-gray-600">{currentVariant.title}</p>
                </div>
                <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  ADD TO CART - ${currentVariant.price}
                </button>
              </div>
            ) : (
              <div className="text-center py-4 text-red-500">
                Please select and apply a valid combination
              </div>
            )} */}
          </div>
        </div>
      </div>
    // </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Main Product Information */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ImageGallery />

          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="max-w-sm">
                <h1 className="text-2xl font-bold line-clamp-2 hover:line-clamp-none transition-all duration-300" title={product.title}>{product.title}</h1>
                <p className="text-sm text-gray-500">By {product?.vendor || "Italian Shoes Company"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl text-red-500 font-bold">
                    ${currentVariant?.price || product.price[0]}
                  </span>
                  {currentVariant && (<span className="text-sm text-gray-500">
                    {currentVariant?.inventoryQuantity || product.variants[0].inventoryQuantity} in stock
                  </span> )}
                </div>
              </div>
              {!isDesignEditorOpen ? <button 
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                onClick={() => {
                  // Pre-select the first size for convenience if none selected
                  if (!selectedCombination.size && product.variantsOptions.sizes.length > 0) {
                    setSelectedCombination({
                      ...selectedCombination,
                      size: product.variantsOptions.sizes[0]
                    });
                  }
                  setIsDesignEditorOpen(true);
                }}
              >
                <Edit2 className="w-4 h-4 inline-block mr-2" />
                Edit Design
              </button> : <button 
                  className="text-gray-600 hover:text-gray-800 cursor-pointer shrink-0"
                  onClick={CloseEditor}
                >
                  <X className="w-5 h-5 inline-block mr-1" />
                  Close Editor
                </button> }
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 border-b pb-4">
                <label className="text-sm font-medium">Select Size:</label>
                <select
                  value={selectedCombination.size?.id || ""}
                  onChange={(e) => {
                    const size = product.variantsOptions.sizes.find(
                      (s) => s.id === Number(e.target.value)
                    );
                    setSelectedCombination({
                      ...selectedCombination,
                      size: size || null,
                    });
                  }}
                  className="border rounded-lg px-3 py-2 w-48"
                >
                  <option value="">Choose a Size</option>
                  {product.variantsOptions.sizes.map((size) => (
                    <option key={size.id} value={size.id}>
                      {`${size.size} (${size.sizeSystem}${
                        size.width ? ` - ${size.width}` : ""
                      })`}
                    </option>
                  ))}
                </select>
              </div>
              {isDesignEditorOpen && ( <button 
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                onClick={appliedSelections ? clearSelections : applySelection}
              >
                {appliedSelections ? "Reset Design" : "Apply Selection"}
              </button>)}
            </div>
            {/* Size Selection Dropdown (simplified version) */}
            
            {isDesignEditorOpen && <DesignEditor />}

            {/* Product Features */}
            <div className="grid grid-cols-4 gap-4 py-4 border-b">
              <div className="text-center">
                <div className="font-medium">FREE</div>
                <div className="text-sm text-gray-600">Delivery & Returns</div>
              </div>
              <div className="text-center">
                <div className="font-medium">100%</div>
                <div className="text-sm text-gray-600">Quality guaranteed</div>
              </div>
              <div className="text-center">
                <div className="font-medium">100%</div>
                <div className="text-sm text-gray-600">Italian Style</div>
              </div>
              <div className="text-center">
                <div className="font-medium">100%</div>
                <div className="text-sm text-gray-600">Hand Made Shoes</div>
              </div>
            </div>

            {/* Product Description */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Product Description</h3>
              <p className="text-gray-600">{stripHtml(product.description)}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex-grow">
                ADD TO CART
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                <Heart className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Design Editor (Customization Interface) */}
      {/* <DesignEditor /> */}

      {/* Related Products */}
      {/* <RelatedProductsSlider /> */}

      {/* Modal for unavailable combinations */}
      <CombinationNotAvailableModal />
    </div>
  );
};

export default ProductPage;