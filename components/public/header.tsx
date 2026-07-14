/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { User, Menu, X, Search, Home, ChevronDown, ShoppingBag, Phone, Plane } from 'lucide-react';
import { Cormorant_Garamond } from 'next/font/google';
import AnnouncementBar from './announcementBar';
import { CartIcon } from '@/components/cart/CartIcon';
import { useCartStore } from '@/lib/stores';
import { useRouter, usePathname } from 'next/navigation';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const navItems = [
  { label: 'Home', href: '/' },
  {
    label: "Women's Shoes",
    href: '/collections',
    dropdown: [
      { label: 'Heels & Pumps', href: '/collections?category=heels-pumps' },
      { label: 'Flats & Ballerinas', href: '/collections?category=flats-ballerinas' },
      { label: 'Sandals', href: '/collections?category=sandals' },
      { label: 'Boots', href: '/collections?category=boots-women' },
      { label: 'Sneakers', href: '/collections?category=sneakers-women' },
      { label: 'Loafers & Oxfords', href: '/collections?category=loafers-oxfords-women' },
      { label: 'Wedding Shoes', href: '/collections?category=wedding-women' },
      { label: 'All Products', href: '/collections' },
    ],
  },
  {
    label: "Men's Shoes",
    href: '/collections',
    dropdown: [
      { label: 'Dress Shoes', href: '/collections?category=dress-shoes' },
      { label: 'Loafers & Slip-Ons', href: '/collections?category=loafers-men' },
      { label: 'Sneakers', href: '/collections?category=sneakers-men' },
      { label: 'Boots', href: '/collections?category=boots-men' },
      { label: 'Casual Shoes', href: '/collections?category=casual-men' },
      { label: 'Wedding Shoes', href: '/collections?category=wedding-men' },
      { label: 'All Products', href: '/collections' },
    ],
  },
  {
    label: 'Bags',
    href: '/collections',
    dropdown: [
      { label: 'Leather Bags', href: '/collections?category=leather-bags' },
      { label: 'Backpacks', href: '/collections?category=backpacks' },
      { label: 'Briefcases', href: '/collections?category=briefcases' },
      { label: 'Travel Bags', href: '/collections?category=travel-bags' },
      { label: 'Wallets & Cardholders', href: '/collections?category=wallets' },
      { label: 'All Products', href: '/collections' },
    ],
  },
  {
    label: 'Create Design',
    href: '/collections',
  },
  {
    label: 'Premium Shoes',
    href: '/collections',
    dropdown: [
      { label: 'Cordovan Collection', href: '/collections?category=cordovan' },
      { label: 'Exotic Leather Edition', href: '/collections?category=exotic' },
      { label: 'Hand-Painted Patina', href: '/collections?category=patina' },
      { label: 'Bespoke Services', href: '/collections?category=bespoke' },
    ],
  },
];

interface DropdownItem { label: string; href: string; }

const NavDropdown: React.FC<{ items: DropdownItem[]; router: ReturnType<typeof useRouter> }> = ({ items, router }) => (
  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-52 bg-white border border-gray-100 shadow-lg rounded-sm py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
    {items.map((sub) => (
      <button
        key={sub.label}
        onClick={() => router.push(sub.href)}
        className="block w-full text-left px-4 py-2 text-[11px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
      >
        {sub.label}
      </button>
    ))}
  </div>
);

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const { getTotalItems, openCart } = useCartStore();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItemCount = getTotalItems();

  const handleCartClick = () => {
    openCart();
    router.push('/cart');
  };

  return (
    <>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          DESKTOP HEADER — 4 stacked full-width sections
          Wrapped in a zero-margin/padding div so the
          parent layout bg never bleeds between sections.
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        className="hidden lg:flex flex-col"
        style={{ margin: 0, padding: 0, width: '100%', boxSizing: 'border-box' }}
      >

        {/* LAYER 1 — Top Utility Bar */}
        <div
          id="utility-bar"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            margin: 0,
          }}
        >
          <div
            className="max-w-[1140px] mx-auto flex items-center justify-between"
            style={{
              padding: '7px 20px',
              backgroundColor: '#f0f0f0',
            }}
          >
            {/* Left — Free Delivery & Returns */}
            <div className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 400, color: '#222222' }}>
              <Plane
                className="w-3 h-3 fill-current transform rotate-45 flex-shrink-0"
                style={{ color: '#ff3f6c' }}
                aria-hidden="true"
              />
              <span>Free Delivery &amp; Returns</span>
            </div>

            {/* Right — Hotline */}
            <a
              href="tel:+12108019868"
              className="flex items-center gap-1.5 transition-colors hover:opacity-80"
              style={{ fontSize: 12, color: '#555555', textDecoration: 'none' }}
              aria-label="Call Hotline"
            >
              <div
                className="inline-flex items-center justify-center rounded-full w-[15px] h-[15px] flex-shrink-0"
                style={{ backgroundColor: '#ff3f6c' }}
              >
                <Phone className="w-2 h-2 fill-current text-white" aria-hidden="true" />
              </div>
              <span style={{ color: '#888888', fontWeight: 400 }}>Hotline:&nbsp;</span>
              <span style={{ color: '#ff3f6c', fontWeight: 600, letterSpacing: '0.2px' }}>
                +1 (210) 801-9868
              </span>
            </a>
          </div>
        </div>

        {/* LAYER 2 — Main Header */}
        <div
          id="header-main"
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="flex items-start justify-between relative"
            style={{
              maxWidth: 1140,
              margin: '0 auto',
              padding: '28px 30px 28px',
              minHeight: 130,
            }}
          >
            {/* Left — Search (flush top-left) */}
            <div style={{ width: 220, flexShrink: 0, paddingTop: 0 }}>
              {/* Input box with full border */}
              <div
                className="relative flex items-center"
                style={{
                  border: '1px solid #d1d5db',
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                  overflow: 'hidden',
                }}
              >
                <input
                  type="text"
                  aria-label="Search products"
                  placeholder="Search..."
                  className="w-full focus:outline-none"
                  style={{
                    fontSize: 11,
                    padding: '5px 28px 5px 8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#333333',
                  }}
                />
                <Search
                  className="absolute right-2 pointer-events-none"
                  style={{ width: 12, height: 12, color: '#aaaaaa' }}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Center — Logo (absolutely centered in the row) */}
            <div
              className="absolute left-0 right-0 flex flex-col items-center justify-center text-center pointer-events-none"
              style={{ top: 0, bottom: 0 }}
            >
              <h1
                className={`${cormorant.className} select-none`}
                style={{
                  fontSize: 44,
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  color: '#1a1a1a',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}
              >
                Italian Shoes
              </h1>
              <span
                className="select-none"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 10,
                  letterSpacing: '0.45em',
                  color: '#999999',
                  marginTop: 7,
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}
              >
                H a n d c r a f t e d &nbsp; i n &nbsp; I t a l y
              </span>
              {pathname === '/collections' && (
                <span
                  className="select-none font-sans"
                  style={{
                    fontSize: 20,
                    fontWeight: 500,
                    letterSpacing: '0.18em',
                    color: '#1a1a1a',
                    marginTop: 8,
                    textTransform: 'uppercase',
                  }}
                >
                  Create Men's Shoes
                </span>
              )}
            </div>

            {/* Right — Log In + Cart (flush top-right) */}
            <div
              className="flex items-center"
              style={{ width: 220, justifyContent: 'flex-end', gap: 20, flexShrink: 0, paddingTop: 0 }}
            >
              <a
                href="/login"
                className="flex items-center gap-1.5 transition-colors hover:opacity-70"
                style={{
                  color: '#444444',
                  fontWeight: 400,
                  fontSize: 13,
                  textDecoration: 'none',
                  fontFamily: 'sans-serif',
                }}
                aria-label="Log in to your account"
              >
                <User className="w-4 h-4 stroke-[1.5]" style={{ color: '#666666' }} aria-hidden="true" />
                <span>Log In</span>
              </a>

              <button
                onClick={handleCartClick}
                className="flex items-center gap-1.5 transition-colors hover:opacity-70 cursor-pointer"
                style={{
                  color: '#444444',
                  fontWeight: 400,
                  fontSize: 13,
                  background: 'none',
                  border: 'none',
                  fontFamily: 'sans-serif',
                  padding: 0,
                }}
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4 stroke-[1.5]" style={{ color: '#666666' }} aria-hidden="true" />
                <span>Cart({mounted ? cartItemCount : 0})</span>
              </button>
            </div>
          </div>
        </div>


    </div >

      {/* MOBILE HEADER */ }
      < div className = "lg:hidden w-full bg-white border-b border-gray-200 shadow-sm" >
        <div className="max-w-[1140px] mx-auto px-4 flex justify-between items-center h-16">
          <div className="flex flex-col items-start">
            <span className={`${cormorant.className} text-[24px] tracking-[0.05em] text-[#1a1a1a] leading-normal select-none font-[500]`}>
              ITALIAN SHOES
            </span>
            <span className="font-sans text-[8px] tracking-[0.15em] text-gray-400 mt-0.5 uppercase select-none font-[400]">
              Handcrafted Made In Italy
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-700 hover:text-gray-900" aria-label="User Account">
              <User className="w-5 h-5" aria-hidden="true" />
            </button>
            <CartIcon showWishlist={false} />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 hover:text-gray-900" aria-label="Toggle Menu">
              {isMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
  {
    isMenuOpen && (
      <div className="px-4 py-4 border-t border-gray-100 bg-white">
        <div className="flex flex-col space-y-4">
          {navItems.map((item) => (
            <div key={item.label} className="flex flex-col">
              <button onClick={() => router.push(item.href)} className="text-gray-700 hover:text-gray-900 font-semibold text-sm text-left py-1">
                {item.label}
              </button>
              {item.dropdown && (
                <div className="flex flex-wrap gap-2 pl-3 mt-1.5 border-l border-gray-200">
                  {item.dropdown.map((subItem) => (
                    <button key={subItem.label} onClick={() => router.push(subItem.href)} className="text-xs text-gray-500 hover:text-gray-800 py-0.5 px-2 bg-gray-50 rounded border border-gray-100">
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
      </div >
    </>
  );
};

export default Header;
