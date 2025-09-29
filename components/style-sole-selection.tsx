"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Image as ImageIcon } from "lucide-react";

export interface Style {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  isActive: boolean;
  imageUrl?: string | null;
}

export interface Sole {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  isActive: boolean;
  imageUrl?: string | null;
}

export interface SelectedItem {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  imageUrl?: string | null;
}

interface StyleSoleSelectionProps {
  items: (Style | Sole)[];
  selectedItems: SelectedItem[];
  onSelectionChange: (items: SelectedItem[]) => void;
  loading?: boolean;
  title: string;
  description: string;
  emptyMessage: string;
}

export function StyleSoleSelection({ 
  items, 
  selectedItems, 
  onSelectionChange, 
  loading = false,
  title,
  description,
  emptyMessage
}: StyleSoleSelectionProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleItemSelection = (item: Style | Sole) => {
    const isSelected = selectedItems.some(si => si.id === item.id);
    
    if (isSelected) {
      // Remove item
      onSelectionChange(selectedItems.filter(si => si.id !== item.id));
    } else {
      // Add item
      const newSelection: SelectedItem = {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        imageUrl: item.imageUrl
      };
      onSelectionChange([...selectedItems, newSelection]);
    }
  };

  const isItemSelected = (itemId: string) => {
    return selectedItems.some(si => si.id === itemId);
  };

  const getSelectedItem = (itemId: string) => {
    return selectedItems.find(si => si.id === itemId);
  };

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>{title}</CardTitle>
          <CardDescription>Loading...</CardDescription>
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
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const isSelected = isItemSelected(item.id);
              const selectedItem = getSelectedItem(item.id);
              const isExpanded = expandedItems.has(item.id);

              return (
                <div key={item.id} className={`border rounded-lg p-4 space-y-3 transition-colors ${
                  isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                }`}>
                  {/* Item Header */}
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleItemSelection(item)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {item.imageUrl && (
                          <div className="w-8 h-8 rounded border overflow-hidden flex-shrink-0">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{item.name}</div>
                          {item.category && (
                            <div className="text-sm text-muted-foreground">{item.category}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Item Description */}
                  {item.description && (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </div>
                  )}

                  {/* Selection Status */}
                  {isSelected && (
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        Selected
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleItemExpansion(item.id)}
                      >
                        {isExpanded ? "Hide" : "Show"} Details
                      </Button>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {isSelected && isExpanded && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Description:</span>
                          <p className="text-muted-foreground mt-1">
                            {item.description || "No description available"}
                          </p>
                        </div>
                        {item.category && (
                          <div className="text-sm">
                            <span className="font-medium">Category:</span>
                            <span className="text-muted-foreground ml-1">{item.category}</span>
                          </div>
                        )}
                        {item.imageUrl && (
                          <div className="text-sm">
                            <span className="font-medium">Image:</span>
                            <div className="mt-1">
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="w-20 h-20 rounded border object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {selectedItems.length > 0 && (
          <>
            <Separator />
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Selected {title} Summary</h4>
              <div className="space-y-1">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    {item.category && (
                      <span className="text-muted-foreground">{item.category}</span>
                    )}
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
