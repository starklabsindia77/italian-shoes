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
    name: "Variants",
    layout: "/dashboard",
    icon: <MdBarChart className="h-6 w-6" />,
    path: "variants",
  },
  // {
  //   name: "Profile",
  //   layout: "/dashboard",
  //   path: "profile",
  //   icon: <MdPerson className="h-6 w-6" />,
  // },
  // {
  //   name: "RTL Admin",
  //   layout: "/rtl",
  //   path: "rtl",
  //   icon: <MdHome className="h-6 w-6" />,
  // },
];

export default routes;
