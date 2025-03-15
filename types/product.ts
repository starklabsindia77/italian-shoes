export interface Size {
  id: number;
  sizeSystem: string;
  size: string;
  width: string;
}

export interface Style {
  id: number;
  name: string;
  imageUrl: string;
}

export interface Sole {
  id: number;
  type: string;
  height: string;
  imageUrl: string;
}

export interface Material {
  id: number;
  name: string;
  description: string;
}

export interface Color {
  id: number;
  name: string;
  hexCode: string;
  imageUrl: string;
}

export interface Panel {
  id: number;
  name: string;
  description: string;
}

export interface ProductImage {
  url: string;
  altText: string | null;
}

export interface ProductVariant {
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
export interface ShopifyImage {
  id: string;
  src: string;
  alt: string | null;
  position: number;
  width: number | null;
  height: number | null;
}

export interface ShopifyVariant {
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
export interface Product {
  id: number;
  productId: string;
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