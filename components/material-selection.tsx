"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, X, PaintBucket } from "lucide-react";

export interface MaterialColor {
  id: string;
  name: string;
  hexCode?: any;
  imageUrl?: any;
  family?: any;
  isActive: boolean;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  isActive: boolean;
  colors: MaterialColor[];
}

export interface SelectedMaterial {
  materialId: string;
  materialName: string;
  selectedColorIds: string[];
  selectedColor: MaterialColor[];
  selectAllColors: boolean;
}

interface MaterialSelectionProps {
  materials: Material[];
  selectedMaterials: SelectedMaterial[];
  onSelectionChange: (materials: SelectedMaterial[]) => void;
  loading?: boolean;
}

export function MaterialSelection({ 
  materials, 
  selectedMaterials, 
  onSelectionChange, 
  loading = false 
}: MaterialSelectionProps) {
  const [expandedMaterials, setExpandedMaterials] = React.useState<Set<string>>(new Set());

  const toggleMaterialExpansion = (e: React.MouseEvent<HTMLButtonElement>, materialId: string) => {
    e.preventDefault();
    setExpandedMaterials(prev => {
      const newSet = new Set(prev);
      if (newSet.has(materialId)) {
        newSet.delete(materialId);
      } else {
        newSet.add(materialId);
      }
      return newSet;
    });
  };

  const toggleMaterialSelection = (material: Material) => {
    const isSelected = selectedMaterials.some(sm => sm.materialId === material.id);
    
    if (isSelected) {
      // Remove material
      onSelectionChange(selectedMaterials.filter(sm => sm.materialId !== material.id));
    } else {
      // Add material with no colors selected by default
      const newSelection: SelectedMaterial = {
        materialId: material.id,
        materialName: material.name,
        selectedColorIds: [],
        selectedColor: [],
        selectAllColors: false
      };
      onSelectionChange([...selectedMaterials, newSelection]);
    }
  };

  const toggleColorSelection = (materialId: string, colorId: string) => {
    const material = selectedMaterials.find(sm => sm.materialId === materialId);
    const materialData = materials.find(m => m.id === materialId);
    if (!material || !materialData) return;

    const color = materialData.colors.find(c => c.id === colorId);
    if (!color) return;

    const isColorSelected = material.selectedColorIds.includes(colorId);
    let newSelectedColorIds: string[];
    let newSelectedColor: MaterialColor[];
    
    if (isColorSelected) {
      newSelectedColorIds = material.selectedColorIds.filter(id => id !== colorId);
      newSelectedColor = material.selectedColor?.filter(c => c.id !== colorId);
    } else {
      newSelectedColorIds = [...material.selectedColorIds, colorId];
      newSelectedColor = [...material.selectedColor, color];
    }

    const updatedMaterial: SelectedMaterial = {
      ...material,
      selectedColorIds: newSelectedColorIds,
      selectedColor: newSelectedColor,
      selectAllColors: newSelectedColorIds.length === materialData.colors.filter(c => c.isActive).length
    };
    

    onSelectionChange(
      selectedMaterials.map(sm => sm.materialId === materialId ? updatedMaterial : sm)
    );
  };

  const toggleSelectAllColors = (materialId: string) => {
    const material = selectedMaterials.find(sm => sm.materialId === materialId);
    const materialData = materials.find(m => m.id === materialId);
    if (!material || !materialData) return;

    const activeColors = materialData.colors.filter(c => c.isActive);
    const newSelectAllColors = !material.selectAllColors;
    
    const updatedMaterial: SelectedMaterial = {
      ...material,
      selectedColorIds: newSelectAllColors ? activeColors.map(c => c.id) : [],
      selectedColor: newSelectAllColors ? activeColors : [],
      selectAllColors: newSelectAllColors
    };

 

    onSelectionChange(
      selectedMaterials.map(sm => sm.materialId === materialId ? updatedMaterial : sm)
    );
  };

  const isMaterialSelected = (materialId: string) => {
    return selectedMaterials.some(sm => sm.materialId === materialId);
  };

  const getSelectedMaterial = (materialId: string) => {
    return selectedMaterials.find(sm => sm.materialId === materialId);
  };

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>Material Selection</CardTitle>
          <CardDescription>Loading materials...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle>Material Selection</CardTitle>
        <CardDescription>
          Select materials and their available colors for this product. 
          You can choose all colors or specific ones for each material.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {materials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No materials available. Create materials first in the Materials section.
          </div>
        ) : (
          materials.map((material) => {
            const isSelected = isMaterialSelected(material.id);
            const selectedMaterial = getSelectedMaterial(material.id);
            const activeColors = material.colors.filter(c => c.isActive);
            const isExpanded = expandedMaterials.has(material.id);

            return (
              <div key={material.id} className="border rounded-lg p-4 space-y-3">
                {/* Material Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleMaterialSelection(material)}
                    />
                    <div>
                      <div className="font-medium">{material.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {material.category} • {activeColors.length} colors available
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isSelected && (
                      <Badge variant="secondary">
                        {selectedMaterial?.selectedColorIds.length || 0} colors selected
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => toggleMaterialExpansion(e, material.id)}
                      disabled={!isSelected}
                    >
                      {isExpanded ? "Hide" : "Show"} Colors
                    </Button>
                  </div>
                </div>

                {/* Color Selection */}
                {isSelected && isExpanded && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      {/* Select All Colors Toggle */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <PaintBucket className="size-4 text-muted-foreground" />
                          <span className="font-medium">Select All Colors</span>
                        </div>
                        <Checkbox
                          checked={selectedMaterial?.selectAllColors || false}
                          onCheckedChange={() => toggleSelectAllColors(material.id)}
                        />
                      </div>

                      {/* Individual Color Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {activeColors.map((color) => {
                          const isColorSelected = selectedMaterial?.selectedColorIds.includes(color.id) || false;
                          
                          return (
                            <div
                              key={color.id}
                              className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                isColorSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                              }`}
                            >
                              <Checkbox
                                checked={isColorSelected}
                                onCheckedChange={() => toggleColorSelection(material.id, color.id)}
                              />
                              <div className="flex-1 flex items-center space-x-2">
                                {color.hexCode && (
                                  <div
                                    className="w-4 h-4 rounded border"
                                    style={{ backgroundColor: color.hexCode }}
                                  />
                                )}
                                <span className="text-sm">{color.name}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}

        {/* Summary */}
        {selectedMaterials.length > 0 && (
          <>
            <Separator />
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Selected Materials Summary</h4>
              <div className="space-y-1">
                {selectedMaterials.map((sm) => (
                  <div key={sm.materialId} className="flex items-center justify-between text-sm">
                    <span>{sm.materialName}</span>
                    <span className="text-muted-foreground">
                      {sm.selectAllColors ? 'All colors' : `${sm.selectedColorIds.length} colors`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
