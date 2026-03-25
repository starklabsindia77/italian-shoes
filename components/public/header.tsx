/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { User, Menu, X, Globe } from 'lucide-react';
import AnnouncementBar from './announcementBar';
import { CartIcon } from '@/components/cart/CartIcon';
import { useCurrency } from "@/components/providers/CurrencyProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const { currency, setCurrency, supportedCountries } = useCurrency();

  return (
    <>
      <AnnouncementBar />
      <header className="border-b bg-white max-w-7xl mx-auto container">
        <div>
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <img src={`https://italianshoescompany.com/cdn/shop/files/Logo-Black-e1664897309895.png?v=1678359693&width=280`} alt="Logo" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-6">
              <a href="#" className="text-gray-700 hover:text-gray-900">Men</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Bags / Luggage</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Celebrity Looks</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">New Arrivals</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Best Sellers</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Limited Edition</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Exotic Leather</a>
            </nav>

            {/* Desktop Icons */}
            <div className="hidden lg:flex items-center space-x-4 ml-2">
              <div className="flex items-center gap-1 border-r pr-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 w-[60px] px-0 shadow-none text-xs font-semibold">
                    <SelectValue placeholder="INR" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedCountries.map((c) => (
                      <SelectItem key={c.code} value={c.currency} className="text-xs">
                        {c.currency}
                      </SelectItem>
                    ))}
                    {supportedCountries.length === 0 && <SelectItem value="INR">INR</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <button className="text-gray-700 hover:text-gray-900">
                <User className="w-5 h-5" />
              </button>
              <CartIcon showWishlist={false} />
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center space-x-4">
              <button className="text-gray-700 hover:text-gray-900">
                <User className="w-5 h-5" />
              </button>
              <CartIcon showWishlist={false} />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-gray-900"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4">
              <div className="flex flex-col space-y-4">
                <a href="#" className="text-gray-700 hover:text-gray-900">Men</a>
                <a href="#" className="text-gray-700 hover:text-gray-900">Bags / Luggage</a>
                <a href="#" className="text-gray-700 hover:text-gray-900">Celebrity Looks</a>
                <a href="#" className="text-gray-700 hover:text-gray-900">New Arrivals</a>
                <a href="#" className="text-gray-700 hover:text-gray-900">Best Sellers</a>
                <a href="#" className="text-gray-700 hover:text-gray-900">Limited Edition</a>
                <a href="#" className="text-gray-700 hover:text-gray-900">Exotic Leather</a>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
