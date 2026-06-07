import React from "react";

type FooterLink = {
  label: string;
  href: string;
};

const companyLinks: FooterLink[] = [
  { label: "About", href: "#" },
  { label: "Careers", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Press", href: "#" },
];

const legalLinks: FooterLink[] = [
  { label: "Terms", href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Cookies", href: "#" },
];

const socialLinks = [
  {
    label: "Twitter",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M22 5.92c-.7.3-1.45.5-2.24.6a3.9 3.9 0 0 0 1.7-2.1 7.7 7.7 0 0 1-2.46.94 3.85 3.85 0 0 0-6.6 3.5A10.9 10.9 0 0 1 3.3 4.6a3.85 3.85 0 0 0 1.2 5.13 3.8 3.8 0 0 1-1.75-.5v.05c0 1.9 1.35 3.5 3.15 3.86a3.9 3.9 0 0 1-1.74.07 3.86 3.86 0 0 0 3.6 2.7A7.75 7.75 0 0 1 2 17.5a10.9 10.9 0 0 0 5.9 1.73c7.1 0 11-5.9 11-11v-.5c.75-.5 1.4-1.2 1.9-1.8z" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-3.16 19.5c.5.1.68-.2.68-.48v-1.7c-2.77.6-3.35-1.2-3.35-1.2a2.6 2.6 0 0 0-1.1-1.4c-.9-.6.07-.6.07-.6a2 2 0 0 1 1.5 1 2 2 0 0 0 2.7.8 2 2 0 0 1 .6-1.3c-2.2-.25-4.5-1.1-4.5-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.25 2.75 1a9.5 9.5 0 0 1 5 0c2-1.25 2.75-1 2.75-1a3.6 3.6 0 0 1 .1 2.7 3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.75-4.5 5a2.2 2.2 0 0 1 .65 1.7v2.5c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
      </svg>
    ),
  },
  {
    label: "Discord",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M20 4.5A16 16 0 0 0 16 3l-.3.6a14 14 0 0 1 3.2 1.1 13.8 13.8 0 0 0-4.2-1.3 14 14 0 0 0-4.2 0A13.8 13.8 0 0 0 6.3 4.7 14 14 0 0 1 9.5 3.6L9 3a16 16 0 0 0-4 1.5C2.4 9 2 13.3 2.5 17.5A16 16 0 0 0 7.5 20l1-1.5a10 10 0 0 1-1.6-.8c.3-.2.6-.4.9-.6 3.1 1.5 6.5 1.5 9.6 0 .3.2.6.4.9.6-.5.3-1 .6-1.6.8l1 1.5a16 16 0 0 0 5-2.5C21.5 13.3 21.1 9 20 4.5zM8.5 14.5c-.8 0-1.5-.8-1.5-1.7 0-.9.7-1.7 1.5-1.7s1.5.8 1.5 1.7c0 .9-.7 1.7-1.5 1.7zm7 0c-.8 0-1.5-.8-1.5-1.7 0-.9.7-1.7 1.5-1.7s1.5.8 1.5 1.7c0 .9-.7 1.7-1.5 1.7z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 text-gray-300">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand */}
        <div>
          <h2 className="text-white text-lg font-semibold">PolyMarket</h2>
          <p className="text-sm text-gray-400 mt-3">
            Predict markets, trade ideas, and stay ahead of trends.
          </p>

          <div className="flex gap-4 mt-5">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-white font-medium mb-4">Company</h3>
          <ul className="space-y-2 text-sm">
            {companyLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-white transition">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-white font-medium mb-4">Legal</h3>
          <ul className="space-y-2 text-sm">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-white transition">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-white font-medium mb-4">Stay updated</h3>
          <p className="text-sm text-gray-400 mb-3">
            Get weekly market insights.
          </p>

          <div className="flex flex-col gap-2">
            <input
              type="email"
              placeholder="Enter email"
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-white/30"
            />
            <button className="bg-white text-black py-2 rounded-lg font-medium hover:bg-gray-200 transition">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 text-center text-xs text-gray-500 py-4">
        © {new Date().getFullYear()} PolyMarket. All rights reserved.
      </div>
    </footer>
  );
}