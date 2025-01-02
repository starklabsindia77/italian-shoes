// Icon Imports
import {
  MdHome,
  MdOutlineShoppingCart,
  MdBarChart,
  MdPerson,
} from "react-icons/md";

const routes = [
  {
    name: "Main Dashboard",
    layout: "/dashboard",
    path: "dashboard",
    icon: <MdHome className="h-6 w-6" />,
  },
  // {
  //   name: "NFT Marketplace",
  //   layout: "/dashboard",
  //   path: "nft-marketplace",
  //   icon: <MdOutlineShoppingCart className="h-6 w-6" />,
  //   secondary: true,
  // },
  {
    name: "Shopify Products",
    layout: "/dashboard",
    icon: <MdBarChart className="h-6 w-6" />,
    path: "product",
  },
  {
    name: "Custom Products",
    layout: "/dashboard",
    icon: <MdBarChart className="h-6 w-6" />,
    path: "product-variants",
  },
  {
    name: "Variants",
    layout: "/dashboard",
    icon: <MdBarChart className="h-6 w-6" />,
    path: "variants",
  },
  {
    name: "Color",
    layout: "/dashboard",
    path: "color",
    icon: <MdPerson className="h-6 w-6" />,
  },

  {
    name: "Panel",
    layout: "/dashboard",
    path: "panel",
    icon: <MdPerson className="h-6 w-6" />,
  },

  {
    name: "Materials",
    layout: "/dashboard",
    path: "material",
    icon: <MdPerson className="h-6 w-6" />,
  },

  {
    name: "Size Options",
    layout: "/dashboard",
    path: "size",
    icon: <MdPerson className="h-6 w-6" />,
  },

  {
    name: "Sole Options",
    layout: "/dashboard",
    path: "sole-options",
    icon: <MdPerson className="h-6 w-6" />,
  },

  {
    name: "Style Options",
    layout: "/dashboard",
    path: "style-options",
    icon: <MdPerson className="h-6 w-6" />,
  },
  // {
  //   name: "RTL Admin",
  //   layout: "/rtl",
  //   path: "rtl",
  //   icon: <MdHome className="h-6 w-6" />,
  // },
];

export default routes;
