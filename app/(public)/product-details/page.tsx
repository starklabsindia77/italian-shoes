"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
const ShoeAvatar = dynamic(() => import("@/components/shoe-avatar/ShoeAvatar"), {
  ssr: false,
  loading: () => <p>Loading 3D model...</p>,
});

const avatarData = "/ShoewthTex.glb"; // Replace with your actual GLB path

const predefinedColors = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#999999" },
  { name: "Red", value: "#ff4a4a" },
  { name: "Blue", value: "#889cff" },
  { name: "Green", value: "#b6ff88" },
  { name: "Yellow", value: "#f8ff88" },
];



const ProductPage = () => {
  const [objectList, setObjectList] = useState<any[]>([]);
  const [selectedColorHexMap, setSelectedColorHexMap] = useState<Record<string, string>>({});

  const handleColorChange = (panelId: string, colorHex: string) => {
    setSelectedColorHexMap((prev) => ({ ...prev, [panelId]: colorHex }));
  };



  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-4xl">
        <ShoeAvatar
          avatarData={avatarData}
          objectList={objectList}
          setObjectList={setObjectList} // not needed anymore
          selectedColorHexMap={selectedColorHexMap}
        />
      </div>

      <div className="flex flex-col gap-4 mt-6 w-full max-w-md">
        <h2 className="text-lg font-semibold">Customize Shoe Panels</h2>

        {objectList?.map((panel) => (
          <div key={panel.name} className="flex justify-between items-center gap-4">
            <label className="w-1/2 text-sm font-medium">{panel.name}</label>
            <select
              value={selectedColorHexMap[panel.name] || "#ffffff"}
              onChange={(e) => handleColorChange(panel.name, e.target.value)}
              className="border px-2 py-1 rounded-md text-sm w-1/2"
            >
              {predefinedColors.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductPage;
