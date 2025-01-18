/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from "react";
import {
  Heart,
  Share2,
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Size {
  sizeSystem: string;
  size: string;
  width: string;
}

interface Style {
  name: string;
}

interface Sole {
  type: string;
  height: string;
}

interface Material {
  name: string;
  description: string;
}

interface Color {
  name: string;
  hexCode: string;
}

interface Panel {
  name: string;
  description: string;
}

interface ProductImage {
  url: string;
  altText: string;
}

interface SEOMetadata {
  title: string;
  description: string;
}

interface ProductVariant {
  id: number;
  price: number;
  inventoryQuantity: number;
  variant: {
    size: Size;
    style: Style;
    sole: Sole;
    material: Material;
    color: Color;
    panel: Panel;
  };
  images: ProductImage[];
  seoMetadata: SEOMetadata;
}

interface Product {
  id: number;
  productId: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  status: string;
  tags: string;
  imageUrl: string;
  ProductVariant: ProductVariant[];
}

const ProductPage = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedTab, setSelectedTab] = useState("Materials");
  const [selectedSoleHeight, setSelectedSoleHeight] = useState("1.97");
  const [selectedPanel, setSelectedPanel] = useState("Toe cap");
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const product = {
    id: 1,
    title: "Classic Leather Boot",
    currentPrice: 249.0,
    originalPrice: 339.0,
    mainImage:
      "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&h=600&fit=crop",
    additionalImages: [
      "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&h=600&fit=crop",
    ],
    description:
      "This classic silhouette of the sneaker is perfect for the casual gentleman. Everyday shoe with versatile look by your design is a great way to acquire impeccable style! Perfect for warm days in suede and classically sleek in soft leather these shoes could be everything you need them to be! Choose your match now!",
    manufacturer: {
      location: "India",
      deliveryTime: "5-10 days",
      shippingCost: 62.9,
    },
    soleHeights: [
      { height: "1.06", measurement: "7/7-12" },
      { height: "1.10", measurement: "6-12" },
      { height: "1.26", measurement: "6-12" },
      { height: "1.77", measurement: "7/7-12" },
      { height: "1.97", measurement: "7/7-12" },
    ],
    shoelaceColors: [
      {
        name: "Red",
        imageUrl:
          "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=50&h=50&fit=crop",
      },
      {
        name: "White",
        imageUrl:
          "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=50&h=50&fit=crop",
      },
    ],
  };

  const testimonials = [
    {
      id: 1,
      name: "James Wilson",
      role: "Fashion Blogger",
      content:
        "These boots are absolutely incredible. The attention to detail and craftsmanship is outstanding.",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    },
    {
      id: 2,
      name: "Sarah Chen",
      role: "Professional Stylist",
      content:
        "The customization options are amazing. I can create exactly what my clients want.",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    },
    {
      id: 3,
      name: "Michael Brown",
      role: "Business Executive",
      content: "Perfect blend of comfort and style. Worth every penny.",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    },
  ];

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

  const ImageGallery = () => (
    <div className="space-y-4">
      <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
        <img
          src={
            selectedImageIndex === 0
              ? product.mainImage
              : product.additionalImages[selectedImageIndex - 1]
          }
          alt={product.title}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[product.mainImage, ...product.additionalImages].map(
          (image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`aspect-square rounded-lg overflow-hidden border-2 ${
                selectedImageIndex === index
                  ? "border-red-500"
                  : "border-transparent"
              }`}
            >
              <img
                src={image}
                alt={`View ${index + 1}`}
                className="object-cover w-full h-full"
              />
            </button>
          )
        )}
      </div>
    </div>
  );

  const MaterialSelector = () =>  {
    const colorPalette = [
        'bg-blue-200', 'bg-red-200', 'bg-green-200', 'bg-yellow-200', 
        'bg-purple-200', 'bg-pink-200', 'bg-indigo-200', 'bg-teal-200',
        'bg-orange-200', 'bg-cyan-200', 'bg-rose-200', 'bg-violet-200',
        'bg-emerald-200', 'bg-sky-200', 'bg-amber-200', 'bg-lime-200',
        'bg-fuchsia-200', 'bg-slate-200', 'bg-gray-200', 'bg-neutral-200'
      ];
    
      // Function to get a random color from the palette
      const getRandomColor = () => {
        const randomIndex = Math.floor(Math.random() * colorPalette.length);
        return colorPalette[randomIndex];
      };
    return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Select a panel:</span>
        <select
          value={selectedPanel}
          onChange={(e) => setSelectedPanel(e.target.value)}
          className="border rounded-md px-2 py-1"
        >
          <option>Toe cap</option>
          <option>Side panel</option>
          <option>Heel</option>
        </select>
      </div>
      <div className="grid grid-cols-10 gap-2">
      {Array(20).fill(null).map((_, i) => {
          const randomColor = getRandomColor();
          return (
            <button
              key={i}
              className={`w-12 h-12 rounded-md ${randomColor} hover:ring-2 ring-offset-2 ring-blue-500 transition-all duration-200`}
            />
          );
        })}
      </div>
    </div>
  );
    }

  const SoleSelector = () => (
    <div className="grid grid-cols-5 gap-4">
      {product.soleHeights.map((sole) => (
        <button
          key={sole.height}
          onClick={() => setSelectedSoleHeight(sole.height)}
          className={`relative p-2 border rounded-lg ${
            selectedSoleHeight === sole.height
              ? "border-red-500"
              : "border-gray-200"
          }`}
        >
          <img
            src="https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=100&h=100&fit=crop"
            alt={`${sole.height}in sole`}
            className="w-full"
          />
          <div className="text-xs text-center mt-1">
            {sole.height}in / {sole.measurement}
          </div>
        </button>
      ))}
    </div>
  );

  const ShoelaceSelector = () => (
    <div>
      <h3 className="text-sm font-medium mb-2">
        Choose a decoration for your shoes
      </h3>
      <div className="flex gap-2">
        {product.shoelaceColors.map((lace, index) => (
          <button
            key={index}
            className="border rounded-lg p-1 hover:border-red-500"
          >
            <img
              src={lace.imageUrl}
              alt={`${lace.name} shoelaces`}
              className="w-16 h-16 object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );

  const TestimonialSection = () => (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          What Our Customers Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold">{testimonial.name}</h3>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex mb-4">
                {Array(testimonial.rating)
                  .fill(null)
                  .map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
              </div>
              <Quote className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-gray-600">{testimonial.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const slideNext = () => {
    if (sliderRef.current) {
      const slideWidth =
        sliderRef.current.children[0].getBoundingClientRect().width;
      const maxSlide = Math.max(0, relatedProducts.length - 4); // 4 items visible at a time
      const newSlide = Math.min(currentSlide + 1, maxSlide);

      setCurrentSlide(newSlide);
      sliderRef.current.style.transform = `translateX(-${
        newSlide * slideWidth
      }px)`;
    }
  };

  const slidePrev = () => {
    if (sliderRef.current) {
      const slideWidth =
        sliderRef.current.children[0].getBoundingClientRect().width;
      const newSlide = Math.max(currentSlide - 1, 0);

      setCurrentSlide(newSlide);
      sliderRef.current.style.transform = `translateX(-${
        newSlide * slideWidth
      }px)`;
    }
  };

  const RelatedProductsSlider = () => (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">You May Also Like</h2>
        <div className="relative">
          <div className="overflow-hidden">
            <div
              ref={sliderRef}
              className="flex transition-transform duration-300 ease-in-out"
            >
              {relatedProducts.map((product) => (
                <div key={product.id} className="min-w-[25%] px-2">
                  {" "}
                  {/* 25% for 4 items */}
                  <div className="bg-white rounded-lg overflow-hidden">
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium mb-2">{product.title}</h3>
                      <p className="text-lg font-semibold text-red-500">
                        ${product.price}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={slidePrev}
            disabled={currentSlide === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg disabled:opacity-50"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={slideNext}
            disabled={currentSlide === relatedProducts.length - 4}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg disabled:opacity-50"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );

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
                    ${product.currentPrice}
                  </span>
                  <span className="text-gray-500 line-through">
                    ${product.originalPrice}
                  </span>
                </div>
              </div>
              <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                ADD TO CART
              </button>
            </div>

            <div className="text-sm text-gray-600">
              Manufacturing and delivery to {product.manufacturer.location} in{" "}
              {product.manufacturer.deliveryTime} only: $
              {product.manufacturer.shippingCost}
            </div>

            <NavTabs />

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {selectedTab === "Materials" && <MaterialSelector />}
              {selectedTab === "Soles" && <SoleSelector />}
              {selectedTab === "Extras" && <ShoelaceSelector />}
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
              <p className="text-gray-600">{product.description}</p>
            </div>
          </div>
        </div>
      </div>

      <TestimonialSection />
      <RelatedProductsSlider />
    </div>
  );
};

export default ProductPage;
