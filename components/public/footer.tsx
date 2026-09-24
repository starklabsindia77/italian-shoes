import React from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#ebebeb] text-[#555555] border-t border-gray-300 font-sans select-none min-h-[50vh] flex flex-col justify-end pb-8">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center">

        {/* FIND US Section */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <h4 className="text-[16px] uppercase tracking-[0.25em] text-[#333333] font-semibold">
            FIND US
          </h4>
          <div className="flex items-center gap-6 justify-center">
            {/* Instagram */}
            <a 
              href="https://www.instagram.com/italianshoesco/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#555555] hover:text-black transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 stroke-[1.5]" />
            </a>
            {/* Facebook */}
            <a 
              href="https://www.facebook.com/italianshoes.co" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#555555] hover:text-black transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5 stroke-[1.5]" />
            </a>
            {/* Website */}
            <a 
              href="https://starklabsindia.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#555555] hover:text-black transition-colors"
              aria-label="Website"
            >
              <Twitter className="w-5 h-5 stroke-[1.5]" />
            </a>
          </div>
        </div>

        {/* Copyright Text — centered */}
        <div className="flex justify-center text-[11px] text-[#777777] text-center w-full border-t border-gray-200/60 pt-6">
          <span>
            © 2026 All rights reserved by Italian Shoes Company
          </span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
