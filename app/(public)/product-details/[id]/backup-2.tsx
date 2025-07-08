/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Heart, Share2, X } from "lucide-react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

import {
  Product,
  Size,
  Style,
  Sole,
  Material,
  Color,
  ProductVariant,
} from "../../../../types/product";

const ShoeAvatar = dynamic(() => import("@/components/shoe-avatar/ShoeAvatar1"), {
  ssr: false,
  loading: () => <p>Loading 3D model...</p>,
});

// 🖌️ Predefined texture options
const predefinedTextures = [
  { name: "Dark Red Leather", image: "/new-leather/Leather036D_1K-PNG_Color.png", roughnessImage: '/new-leather/Leather036D_1K-PNG_Roughness.png', normalImage:'/new-leather/Leather036D_1K-PNG_NormalGL.png' },
  { name: "Brown Leather", image: "/new-leather/Leather030_1K-PNG_Color.png", roughnessImage: '/new-leather/Leather030_1K-PNG_Roughness.png', normalImage:'/new-leather/Leather030_1K-PNG_NormalGL.png'  },
  { name: "Black Leather", image: "/new-leather/Leather027_1K-PNG_Color.png", roughnessImage: "/new-leather/Leather027_1K-PNG_Roughness.png", normalImage:"/new-leather/Leather027_1K-PNG_NormalGL.png"  },
  { name: "Suede Brown", image: "/leather/2 (2).png", roughnessImage: '', normalImage:''  },
];

const ProductPage = () => {
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedTab, setSelectedTab] = useState("Materials");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [selectedPanelName, setSelectedPanelName] = useState<string | undefined>();
  const [selectedTextureMap, setSelectedTextureMap] = useState<Record<string, any>>({});
  const [objectList, setObjectList] = useState<any[]>([]);

  // 🛠️ Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/product/${productId}`);
        const data = await response.json();
        setProduct(data);
        setSelectedImage(data.imageUrl);
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };
    fetchProduct();
  }, [productId]);

  // 🔧 Update selected texture for a panel
  const handleTextureChange = (panelId: string, textureUrl: string, normal:string, roughness: string) => {
    setSelectedTextureMap((prev) => ({ ...prev, [panelId]: {colorUrl:textureUrl, normalUrl: normal, roughnessUrl: roughness} }));
  };

  const handlePanelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPanelName(e.target.value);
  };

  if (!product) return <div className="text-center py-10">Loading product...</div>;

  // 🖼️ Image gallery with 3D ShoeAvatar
  const ImageGallery = () => (
    <div className="space-y-4">
      <div className="aspect-square bg-gray-300 rounded-lg overflow-hidden">
        <ShoeAvatar
          avatarData="/Shoe-glb.glb"
          objectList={objectList}
          setObjectList={setObjectList}
          selectedTextureMap={selectedTextureMap}
        />
      </div>
    </div>
  );

  // 🎨 Material & texture selector
  const MaterialSelector = () => (
    <div className="space-y-6">
      <div>
        <label className="font-medium">Select Panel:</label>
        <select
          value={selectedPanelName || ""}
          onChange={handlePanelChange}
          className="border px-3 py-2 rounded-md text-sm w-full mt-1"
        >
          <option value="">-- Choose Panel --</option>
          {objectList?.map((obj: any) => (
            <option key={obj.name} value={obj.name}>
              {obj.name.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {selectedPanelName && (
        <div className="mt-4">
          <label className="font-medium">Textures for {selectedPanelName}:</label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {predefinedTextures.map((texture) => (
              <button
                key={texture.name}
                onClick={() => handleTextureChange(selectedPanelName, texture.image, texture.normalImage, texture.roughnessImage)}
                className={`border-2 rounded overflow-hidden transform transition hover:scale-105 ${
                  selectedTextureMap[selectedPanelName] === texture.image
                    ? "border-red-500 scale-105"
                    : "border-gray-300"
                }`}
                title={texture.name}
              >
                <img
                  src={texture.image}
                  alt={texture.name}
                  className="w-full h-16 object-cover"
                />
                <div className="text-xs text-center">{texture.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // 🔖 Nav tabs
  const NavTabs = () => (
    <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
      {["Materials", "Style", "Soles"].map((tab) => (
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

  // 📝 Design editor with tabs
  const DesignEditor = () => (
    <div className="max-w-7xl mx-auto">
      <NavTabs />
      <div className="bg-white rounded-lg border mt-4 p-6">
        {selectedTab === "Materials" && <MaterialSelector />}
        {/* Implement StyleSelector & SoleSelector similarly */}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-2 gap-8">
        <ImageGallery />

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <p className="text-sm text-gray-500">By {product.vendor || "Brand"}</p>
          </div>

          {<DesignEditor />}

          <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors w-full">
            ADD TO CART
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
