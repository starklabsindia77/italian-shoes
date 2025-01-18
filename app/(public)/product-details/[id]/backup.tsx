/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from 'react';
import { Heart, Share2, ShoppingCart, Info } from 'lucide-react';

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
  const [selectedTab, setSelectedTab] = useState('Materials');
  const [selectedSoleHeight, setSelectedSoleHeight] = useState('1.97');
  const [selectedPanel, setSelectedPanel] = useState('Toe cap');
  
  const product = {
    id: 1,
    title: "Classic Leather Boot",
    currentPrice: 249.00,
    originalPrice: 339.00,
    mainImage: "https://placehold.co/600",
    additionalImages: Array(3).fill("https://placehold.co/150"),
    description: "This classic silhouette of the sneaker is perfect for the casual gentleman. Everyday shoe with versatile look by your design is a great way to acquire impeccable style! Perfect for warm days in suede and classically sleek in soft leather these shoes could be everything you need them to be! Choose your match now!",
    manufacturer: {
      location: "India",
      deliveryTime: "5-10 days",
      shippingCost: 62.90
    },
    soleHeights: [
      { height: "1.06", measurement: "7/7-12" },
      { height: "1.10", measurement: "6-12" },
      { height: "1.26", measurement: "6-12" },
      { height: "1.77", measurement: "7/7-12" },
      { height: "1.97", measurement: "7/7-12" }
    ],
    shoelaceColors: [
      { name: "Red", imageUrl: "https://placehold.co/50" },
      { name: "White", imageUrl: "https://placehold.co/50" }
    ]
  };

  const NavTabs = () => (
    <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
      {['Materials', 'Style', 'Soles', 'Extras'].map((tab) => (
        <button
          key={tab}
          onClick={() => setSelectedTab(tab)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedTab === tab 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
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
          src={product.mainImage}
          alt={product.title}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[product.mainImage, ...product.additionalImages].map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImageIndex(index)}
            className={`aspect-square rounded-lg overflow-hidden border-2 ${
              selectedImageIndex === index ? 'border-red-500' : 'border-transparent'
            }`}
          >
            <img
              src={image}
              alt={`View ${index + 1}`}
              className="object-cover w-full h-full"
            />
          </button>
        ))}
      </div>
    </div>
  );

  const MaterialSelector = () => (
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
        {Array(20).fill(null).map((_, i) => (
          <button
            key={i}
            className="w-8 h-8 rounded-md bg-gray-200 hover:ring-2 ring-offset-2 ring-blue-500"
          />
        ))}
      </div>
    </div>
  );

  const SoleSelector = () => (
    <div className="grid grid-cols-5 gap-4">
      {product.soleHeights.map((sole) => (
        <button
          key={sole.height}
          onClick={() => setSelectedSoleHeight(sole.height)}
          className={`relative p-2 border rounded-lg ${
            selectedSoleHeight === sole.height ? 'border-red-500' : 'border-gray-200'
          }`}
        >
          <img
            src="https://placehold.co/100"
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
      <h3 className="text-sm font-medium mb-2">Choose a decoration for your shoes</h3>
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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ImageGallery />
        
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{product.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl text-red-500">${product.currentPrice}</span>
                <span className="text-gray-500 line-through">${product.originalPrice}</span>
              </div>
            </div>
            <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              ADD TO CART
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Manufacturing and delivery to {product.manufacturer.location} in {product.manufacturer.deliveryTime} only: ${product.manufacturer.shippingCost}
          </div>

          <NavTabs />

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {selectedTab === 'Materials' && <MaterialSelector />}
            {selectedTab === 'Soles' && <SoleSelector />}
            {selectedTab === 'Extras' && <ShoelaceSelector />}
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
  );
};

export default ProductPage;