'use client';

import React, { useState, useEffect } from 'react';
import { User, Search, ShoppingBag, Phone, Plane } from 'lucide-react';
import Link from 'next/link';
import { Cormorant_Garamond } from 'next/font/google';
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

const Header: React.FC = () => {
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
          
            {/* Left — Free Delivery & Returns */}
            
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
              maxWidth: '100%',
              margin: '0 auto',
              padding: '34px 60px',
              minHeight: 170,
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
            {/* <div
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
                  Create Men&apos;s Shoes
                </span>
              )}
            </div> */}

            <div
  className="absolute left-0 right-0 flex flex-col items-center justify-center text-center pointer-events-none"
  style={{ top: 0, bottom: 0 }}
>
  
  {/* The wrapper is pointer-events-none so this centred overlay does not block
      the search field and nav behind it; the link opts itself back in. */}
  <Link href="https://italianshoescompany.com/" aria-label="Italian Shoes — go to home" className="pointer-events-auto">
    <img
      src="/img/layout/italian_shoes_logo_transparent.png"
      alt="Italian Shoes"
      className="select-none object-contain"
      style={{
        width: 120,
        height: 'auto',
      }}
    />
  </Link>

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
      Create Men&apos;s Shoes
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
            <Link href="https://italianshoescompany.com/" aria-label="Italian Shoes — go to home">
              <img
                src="/img/layout/italian_shoes_logo_transparent.png"
                alt="Italian Shoes"
                className="select-none object-contain"
                style={{
                  width: 80,
                  height: 'auto',
                }}
              />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-700 hover:text-gray-900" aria-label="User Account">
              <User className="w-5 h-5" aria-hidden="true" />
            </button>
            <CartIcon showWishlist={false} />
          </div>
        </div>
      </div >
    </>
  );
};

export default Header;
