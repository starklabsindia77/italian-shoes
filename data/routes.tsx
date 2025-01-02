// Icon Imports
import {
  MdHome,
  MdOutlineShoppingCart,
  MdBarChart,
  MdColorLens,
  MdBuild,
  MdStraighten,
  MdOutlineStyle,
  MdCategory,
} from "react-icons/md";

const routes = [
  {
    name: "Main Dashboard",
    layout: "/dashboard",
    path: "dashboard",
    icon: <MdHome className="h-6 w-6" />,
  },
  {
    name: "Shopify Products",
    layout: "/dashboard",
    path: "product",
    icon: <MdOutlineShoppingCart className="h-6 w-6" />,
  },
  {
    name: "Custom Products",
    layout: "/dashboard",
    path: "product-variants",
    icon: <MdCategory className="h-6 w-6" />,
  },
  {
    name: "Variants",
    layout: "/dashboard",
    path: "variants",
    icon: <MdBarChart className="h-6 w-6" />,
  },
  {
    name: "Color",
    layout: "/dashboard",
    path: "color",
    icon: <MdColorLens className="h-6 w-6" />,
  },
  {
    name: "Panel",
    layout: "/dashboard",
    path: "panel",
    icon: <MdBuild className="h-6 w-6" />,
  },
  {
    name: "Materials",
    layout: "/dashboard",
    path: "material",
    icon: <MdCategory className="h-6 w-6" />,
  },
  {
    name: "Size Options",
    layout: "/dashboard",
    path: "size",
    icon: <MdStraighten className="h-6 w-6" />,
  },
  {
    name: "Sole Options",
    layout: "/dashboard",
    path: "sole-options",
    icon: <MdBuild className="h-6 w-6" />,
  },
  {
    name: "Style Options",
    layout: "/dashboard",
    path: "style-options",
    icon: <MdOutlineStyle className="h-6 w-6" />,
  },
];

export default routes;
