import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

/**
 * Footer link columns.
 *
 * Most of these pages do not exist in the app yet, so they point at "#".
 * Replace each `href` as the page is built — this array is the only place to
 * change, and the markup needs no edits.
 */
const SHOP_LINKS: { label: string; href: string }[] = [
  { label: 'Shoe-Care-Guide', href: 'https://italianshoescompany.com/pages/shoe-care-guide' },
  { label: 'Buyback', href: 'https://italianshoescompany.com/pages/buy-back' },
  { label: 'Size-Guide', href: 'https://italianshoescompany.com/pages/size-guide' },
  { label: 'About Us', href: 'https://italianshoescompany.com/pages/about-us' },
  { label: 'Our-Artisans', href: 'https://italianshoescompany.com/pages/our-artisans' },
  { label: 'Our-Factory', href: 'https://italianshoescompany.com/pages/our-factory' },
  { label: 'Store Locator', href: 'https://italianshoescompany.com/pages/isc-stores' },
  { label: 'Blogs', href: 'https://italianshoescompany.com/blogs/news' },
];

const CUSTOMER_CARE_LINKS: { label: string; href: string }[] = [
  { label: 'Franchise', href: 'https://italianshoescompany.com/pages/frenchise' },
  { label: 'Loyalty Program', href: 'https://italianshoescompany.com/pages/crm-page' },
  { label: 'Shipping', href: 'https://italianshoescompany.com/pages/shipping' },
  { label: 'Exchange, Return & Cancellation Policy', href: 'https://italianshoescompany.com/pages/returns' },
  { label: 'Secure Payment', href: 'https://italianshoescompany.com/pages/secure-payment' },
  { label: 'Track Your Order', href: 'https://italianshoescompany.com/apps/shipway_track' },
  { label: 'Privacy Policy', href: 'https://italianshoescompany.com/pages/privacy-policy' },
  { label: 'Terms & Condition', href: 'https://italianshoescompany.com/pages/terms-condition' },
];

/** Instagram and Facebook are the live accounts; the other two need real URLs. */
const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com/italianshoes.co', Icon: Facebook },
  { label: 'Instagram', href: 'https://www.instagram.com/italianshoesco/', Icon: Instagram },
  { label: 'YouTube', href: 'https://www.youtube.com/channel/UCJ72fLBii49mhB3mwzEueLg/featured', Icon: Youtube },
  { label: 'X', href: 'https://twitter.com/i/flow/login?redirect_after_login=%2Fitalianshoesco', Icon: Twitter },
];

const SUPPORT_EMAIL = 'Support@italianshoescompany.com';
const SUPPORT_PHONE = '+91 6283281964';

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-[17px] font-semibold tracking-wide text-white">{title}</h3>
      <ul className="mt-5 space-y-2.5 font-serif text-[14px]">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[#d6d6d6] transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0d0d0d] font-sans text-white">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[180px_1fr_1fr_1.25fr] lg:gap-12">
          {/* Brand mark. The source PNG is black line-art on transparent, so it
              is inverted to read on the dark background rather than shipping a
              second asset — the small logoWhite.png is only 41px wide. */}
          <div className="flex justify-center sm:justify-start">
            <Link href="https://italianshoescompany.com/" aria-label="Italian Shoes — go to home" className="inline-block">
              <Image
                src="/img/layout/italian_shoes_logo_transparent.png"
                alt="Italian Shoes Co"
                width={140}
                height={140}
                className="h-auto w-[140px] select-none object-contain invert"
              />
            </Link>
          </div>

          <FooterColumn title="#Italianshoesco" links={SHOP_LINKS} />
          <FooterColumn title="Customer Care" links={CUSTOMER_CARE_LINKS} />

          <div>
            <h3 className="text-[17px] font-semibold tracking-wide text-white">Contact Us</h3>
            <address className="mt-5 space-y-2 font-serif text-[15px] not-italic leading-relaxed text-[#d6d6d6]">
              <p>Business Name: Italian Shoes Company</p>
              <p>
                Address: PLOT-D-107 1st floor
                <br />
                Phase 7 Ind area, 160055, Mohali, Punjab.
              </p>
              <div className="pt-1">
                <p>Call us</p>
                <ul className="mt-2 list-disc space-y-2 pl-5 marker:text-[#8a8a8a]">
                  <li>(Monday To Saturday 10am - 6pm)</li>
                  <li>
                    Customer Service :{' '}
                    <a
                      href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
                      className="font-semibold transition-colors hover:text-white"
                    >
                      {SUPPORT_PHONE}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="break-all transition-colors hover:text-white"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </li>
                </ul>
              </div>
            </address>
          </div>
        </div>

        {/* Social row */}
        <div className="mt-14 flex items-center justify-center gap-7">
          {SOCIAL_LINKS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target={href === '#' ? undefined : '_blank'}
              rel={href === '#' ? undefined : 'noopener noreferrer'}
              aria-label={label}
              className="text-white transition-opacity hover:opacity-70"
            >
              <Icon className="size-5" aria-hidden="true" />
            </a>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-[12px] text-[#9a9a9a]">
          © 2026 All rights reserved by Italian Shoes Company
        </div>
      </div>
    </footer>
  );
};

export default Footer;
