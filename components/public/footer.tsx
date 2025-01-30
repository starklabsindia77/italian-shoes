import React from 'react';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer: React.FC = () => (
  <footer className="bg-[#1c1c1c] text-gray-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo Column */}
        <div>
          <img src={`https://italianshoescompany.com/cdn/shop/files/logo-italian2.png?v=1696415899&width=150`} alt="Logo"  />
          <div className="flex space-x-4 mt-4">
            <a href="#" className="hover:text-white">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white">
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* #ITALIANSHOESCO Column */}
        <div>
          <h3 className="text-white font-medium mb-4">#ITALIANSHOESCO</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">Shoe-Care-Guide</a></li>
            <li><a href="#" className="hover:text-white">Buyback</a></li>
            <li><a href="#" className="hover:text-white">Our-Packaging</a></li>
            <li><a href="#" className="hover:text-white">As-Seen-In</a></li>
            <li><a href="#" className="hover:text-white">Size-Guide</a></li>
            <li><a href="#" className="hover:text-white">About Us</a></li>
            <li><a href="#" className="hover:text-white">Our-Artisans</a></li>
            <li><a href="#" className="hover:text-white">Our-Factory</a></li>
            <li><a href="#" className="hover:text-white">Blogs</a></li>
          </ul>
        </div>

        {/* Customer Services Column */}
        <div>
          <h3 className="text-white font-medium mb-4">CUSTOMER SERVICES</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">Franchise</a></li>
            <li><a href="#" className="hover:text-white">Shipping</a></li>
            <li><a href="#" className="hover:text-white">Exchange Policy</a></li>
            <li><a href="#" className="hover:text-white">Refund Policy</a></li>
            <li><a href="#" className="hover:text-white">Secure Payment</a></li>
            <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white">Terms & Condition</a></li>
            <li><a href="#" className="hover:text-white">Cancellation Policy</a></li>
            <li><a href="#" className="hover:text-white">Track Your Order</a></li>
          </ul>
        </div>

        {/* Contact Us Column */}
        <div>
          <h3 className="text-white font-medium mb-4">CONTACT US</h3>
          <ul className="space-y-2">
            <li>Call us</li>
            <li className="text-sm">(Monday To Saturday 10am - 6pm )</li>
            <li>
              <a href="tel:+918699877491" className="hover:text-white">+91 8699877491</a>
            </li>
            <li>
              <a href="tel:7087546860" className="hover:text-white">7087546860</a>
            </li>
            <li>
              <a href="mailto:Support@italianshoescompany.com" className="hover:text-white">
                Support@italianshoescompany.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-12 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <span>₹ INR</span>
            <span>English</span>
          </div>
          <div className="text-sm">
            © 2025 - ITALIAN SHOES COMPANY POWERED BY SHOPIFY
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
