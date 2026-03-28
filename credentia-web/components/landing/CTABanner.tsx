import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CTABanner() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-[#1C1C26] to-[#2A2A3A] border border-[#F5C542]/20 p-12 text-center">
          <h2 className="font-syne font-extrabold text-4xl sm:text-5xl text-white mb-4">
            Start Your Verification Journey
          </h2>
          <p className="text-lg text-[#9999AA] mb-8 max-w-2xl mx-auto">
            Join 50,000+ students. Get your verified profile link in minutes. It&apos;s completely free.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#F5C542] text-black font-semibold text-lg rounded-xl hover:bg-[#D4A017] hover:scale-105 transition-all shadow-lg shadow-[#F5C542]/20"
          >
            Create Free Account <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  )
}
