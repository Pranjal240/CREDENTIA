import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="dark:bg-[#13131A] bg-[#F8F8FC] border-t dark:border-[#2A2A3A] border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="font-syne font-extrabold text-2xl text-[#F5C542] mb-4 block">
              CREDENTIA
            </Link>
            <p className="dark:text-[#9999AA] text-gray-500 text-sm leading-relaxed mb-4 max-w-xs">
              Verify Once. Trusted Forever. India&apos;s AI-powered credential verification
              platform for students, companies, and universities.
            </p>
            <p className="text-sm dark:text-[#9999AA] text-gray-400">Made in India 🇮🇳</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-syne font-bold text-sm dark:text-white text-gray-900 uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              {['Features', 'How It Works', 'For Companies', 'For Universities'].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm dark:text-[#9999AA] text-gray-500 hover:dark:text-white hover:text-gray-900 transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-syne font-bold text-sm dark:text-white text-gray-900 uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {['About', 'Our Team', 'Contact', 'Privacy Policy'].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm dark:text-[#9999AA] text-gray-500 hover:dark:text-white hover:text-gray-900 transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t dark:border-[#2A2A3A] border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm dark:text-[#9999AA] text-gray-400">
            © 2025 Credentia. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {[
              { label: 'GitHub', href: 'https://github.com/Pranjal240/CREDENTIA', icon: '🐙' },
              { label: 'LinkedIn', href: '#', icon: '💼' },
              { label: 'Twitter/X', href: '#', icon: '🐦' },
            ].map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                title={s.label}
                className="text-lg dark:text-[#9999AA] text-gray-400 hover:text-[#F5C542] transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
