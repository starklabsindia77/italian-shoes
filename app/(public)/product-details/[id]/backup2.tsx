/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

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

interface Product {
  id: number;
  title: string;
  description: string;
  price: number[];
  variants: ProductVariant[];
  variantsOptions: {
    sizes: Size[];
    styles: Style[];
    soles: Sole[];
    materials: Material[];
    colors: Color[];
    panels: Panel[];
  };
}

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
  {
    id: 5,
    title: "Classic Loafers",
    price: 229.0,
    image:
      "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=400&h=400&fit=crop",
  },
  {
    id: 6,
    title: "Classic Loafers",
    price: 229.0,
    image:
      "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=400&h=400&fit=crop",
  },
];


const ProductPage = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedTab, setSelectedTab] = useState("Materials");

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
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch("/api/product/8982116565284"); // Dynamic Product ID
        const data = await response.json();
        setProduct(data);
        setCurrentVariant(data.variants[0]);
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };

    fetchProduct();
  }, []);

  const updateCombination = (optionType: string, optionValue: any) => {
    const updatedCombination = { ...selectedCombination, [optionType]: optionValue };

    if (!product) return;

    const matchingVariant = product.variants.find((variant) => {
      return (
        variant.options.size?.id === updatedCombination.size?.id &&
        variant.options.style?.id === updatedCombination.style?.id &&
        variant.options.sole?.id === updatedCombination.sole?.id &&
        variant.options.material?.id === updatedCombination.material?.id &&
        variant.options.color?.id === updatedCombination.color?.id &&
        variant.options.panel?.id === updatedCombination.panel?.id
      );
    });

    setSelectedCombination(updatedCombination);
    setCurrentVariant(matchingVariant || null);

    if (!matchingVariant) {
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
            <Swiper spaceBetween={10} slidesPerView={4} className="related-products-slider">
              {relatedProducts.map((related) => (
                <SwiperSlide key={related.id}>
                  <div className="bg-white rounded-lg overflow-hidden">
                    <img src={related.image} alt={related.title} className="object-cover w-full h-32" />
                    <div className="p-4">
                      <h3 className="font-medium mb-2">{related.title}</h3>
                      <p className="text-lg font-semibold text-red-500">${related.price}</p>
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

  const CombinationNotAvailableModal = () => (
    modalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Combination Not Available</h2>
            <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            The selected combination is currently unavailable. Please try a different combination.
          </p>
          <button
            onClick={() => setModalOpen(false)}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>
    )
  );

  const ImageGallery = () => (
    <div className="space-y-4">
      <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
        {currentVariant ? (
          <img
            src={currentVariant.images[0]?.url || "/api/placeholder/600/600"}
            alt={currentVariant.images[0]?.altText || product.title}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500">Current combination not available</span>
          </div>
        )}
      </div>

      {currentVariant && (
        <Swiper spaceBetween={10} slidesPerView={4} className="image-slider">
          {currentVariant.images.map((image, index) => (
            <SwiperSlide key={index}>
              <button className="aspect-square rounded-lg overflow-hidden border-2 border-transparent">
                <img
                  src={image.url}
                  alt={image.altText || `View ${index + 1}`}
                  className="object-cover w-full h-full"
                />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );

  const MaterialSelector = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-2">Select Materials and Colors</h3>
      <div className="space-y-4">
        {product.variantsOptions.materials.map((material) => (
          <div key={material.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{material.name}</span>
              {material.description && (
                <span className="text-xs text-gray-500">{material.description}</span>
              )}
            </div>

            {/* Color Swatches */}
            <div className="grid grid-cols-8 gap-2">
              {product.variantsOptions.colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => {
                    updateCombination("material", material);
                    updateCombination("color", color);
                  }}
                  className={`relative w-10 h-10 rounded-full border overflow-hidden ${
                    selectedCombination.material?.id === material.id &&
                    selectedCombination.color?.id === color.id
                      ? "border-red-500"
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
      <div className="grid grid-cols-4 gap-4">
        {product.variantsOptions.soles.map((sole) => (
          <button
            key={sole.id}
            onClick={() => updateCombination("sole", sole)}
            className={`relative p-2 border rounded-lg overflow-hidden ${
              selectedCombination.sole?.id === sole.id ? "border-red-500" : "hover:border-red-500"
            }`}
            title={sole.type}
          >
            <img
              src="https://placehold.co/100" // Temporary placeholder image
              alt={`${sole.type}`}
              className="w-full h-20 object-cover"
            />
            <div className="text-center mt-1 text-xs text-gray-700">{sole.height}</div>
          </button>
        ))}
      </div>
    </div>
  );


  const StyleSelector = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-2">Select Style</h3>
      <div className="grid grid-cols-4 gap-4">
        {product.variantsOptions.styles.map((style) => (
          <button
            key={style.id}
            onClick={() => updateCombination("style", style)}
            className={`p-2 border rounded-lg ${
              selectedCombination.style?.id === style.id ? "border-red-500" : "hover:border-red-500"
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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ImageGallery />

          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{product.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl text-red-500">
                    ${product.variants[0].price}
                  </span>
                </div>
              </div>
              {currentVariant ? (
              <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                ADD TO CART
              </button>
            ) : (
              <div className="text-red-500">Combination not available</div>
            )}
            </div>

            <NavTabs />

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {selectedTab === "Materials" && <MaterialSelector />}
              {selectedTab === "Style" && <StyleSelector />}
              {selectedTab === "Soles" && <SoleSelector />}
            </div>

            <div className="flex gap-4">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <Heart className="w-5 h-5" />
                Save to wishlist
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <Share2 className="w-5 h-5" />
                Send inquiry
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 py-4 border-t border-b">
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

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Product Description</h3>
              <p className="text-gray-600">{stripHtml(product.description)}</p>
            </div>
          </div>
        </div>
      </div>

      
        {/* Related Products */}
        <RelatedProductsSlider />

         {/* Modal for unavailable combinations */}
      <CombinationNotAvailableModal />
    </div>
  );
};

export default ProductPage;