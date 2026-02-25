import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    Fish, Camera, Cpu, MapPin, Zap, TrendingUp, Shield,
    Wifi, ArrowRight, Star, BarChart3, Globe,
    CheckCircle2, Anchor, Smartphone, ChevronDown
} from 'lucide-react';

/**
 * FishOnBid — Professional Landing Page
 */
export default function Landing() {
    const { user } = useContext(AuthContext);
    return (
        <div className="min-h-screen bg-white font-sans">

            {/* ─────────────────────────────────────────
          HERO SECTION
      ───────────────────────────────────────── */}
            <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950
                           text-white overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full
                         blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full
                         blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-28 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20
                           backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold mb-8">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        AI-Powered Fish Auction Platform · India
                    </div>

                    <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-6 leading-none">
                        Sell Fresh Catch.
                        <br />
                        <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            Earn Maximum Price.
                        </span>
                    </h1>

                    <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                        FishOnBid connects fishermen directly with buyers through a real-time AI-powered
                        auction platform — from harbors across India directly to your phone.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {user ? (
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r
                             from-cyan-500 to-blue-600 rounded-2xl font-bold text-lg
                             hover:from-cyan-400 hover:to-blue-500 transition-all
                             hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                            >
                                Go to Dashboard <ArrowRight className="w-5 h-5" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/signup"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r
                                 from-cyan-500 to-blue-600 rounded-2xl font-bold text-lg
                                 hover:from-cyan-400 hover:to-blue-500 transition-all
                                 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                                >
                                    Start Selling Free <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-white/10
                                 border border-white/20 rounded-2xl font-bold text-lg
                                 hover:bg-white/20 transition-all backdrop-blur-sm"
                                >
                                    <Fish className="w-5 h-5" /> Sign In
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Scroll hint */}
                    <div className="mt-16 flex flex-col items-center gap-2 text-slate-400 text-sm">
                        <span>Discover more</span>
                        <ChevronDown className="w-5 h-5 animate-bounce" />
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────
          STATS BAR
      ───────────────────────────────────────── */}
            <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-10">
                <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { value: '500+', label: 'Auctions Completed' },
                        { value: '50+', label: 'Harbors Connected' },
                        { value: '₹12L+', label: 'Total Trade Volume' },
                        { value: '98%', label: 'Seller Satisfaction' },
                    ].map(s => (
                        <div key={s.label}>
                            <p className="text-4xl font-black text-cyan-300">{s.value}</p>
                            <p className="text-blue-200 text-sm mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─────────────────────────────────────────
          ABOUT THE PROJECT
      ───────────────────────────────────────── */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3 block">
                            About FishOnBid
                        </span>
                        <h2 className="text-4xl font-black text-gray-900 mb-6 leading-tight">
                            Bridging the Gap Between Fishermen and Fair Prices
                        </h2>
                        <p className="text-gray-600 text-lg leading-relaxed mb-6">
                            India's fishing community contributes over ₹1.5 lakh crore to the economy, yet
                            individual fishermen often receive far below market value due to middlemen and
                            lack of price transparency.
                        </p>
                        <p className="text-gray-600 text-lg leading-relaxed mb-8">
                            FishOnBid is a technology-first marketplace that puts pricing power directly in
                            the hands of the fishermen — using AI vision, real-time bidding, and RAG-based
                            price intelligence to ensure every catch gets its true market value.
                        </p>
                        <div className="flex flex-col gap-3">
                            {[
                                'No middlemen — direct seller to buyer',
                                'AI suggests fair prices using historical data',
                                'Works on any mobile device, even low-end',
                                'Designed for rural fishermen — camera-first UX',
                            ].map(point => (
                                <div key={point} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700 font-medium">{point}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Illustration card */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8
                           shadow-2xl shadow-blue-500/20 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full
                             -translate-y-12 translate-x-12" />
                        <div className="text-8xl mb-6 text-center">🐟</div>
                        <h3 className="text-2xl font-black mb-4 text-center">Scan. Bid. Sell.</h3>
                        <div className="space-y-3">
                            {[
                                { step: '1', text: 'Fisherman captures photo of catch' },
                                { step: '2', text: 'AI detects fish type, freshness, suggests price' },
                                { step: '3', text: 'Buyers place real-time bids from anywhere' },
                                { step: '4', text: 'Highest bid wins — seller gets paid directly' },
                            ].map(({ step, text }) => (
                                <div key={step} className="flex items-center gap-4 bg-white/10
                                             rounded-xl px-4 py-3 backdrop-blur-sm">
                                    <span className="w-7 h-7 rounded-full bg-cyan-400 text-slate-900
                                    font-black text-sm flex items-center justify-center flex-shrink-0">
                                        {step}
                                    </span>
                                    <span className="text-sm font-medium">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────
          HOW IT WORKS
      ───────────────────────────────────────── */}
            <section className="py-24 px-6 bg-gray-50">
                <div className="max-w-6xl mx-auto text-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3 block">
                        How It Works
                    </span>
                    <h2 className="text-4xl font-black text-gray-900 mb-4">
                        From Catch to Cash in Minutes
                    </h2>
                    <p className="text-gray-500 text-lg max-w-xl mx-auto mb-16">
                        A streamlined three-step process designed for fishermen who value speed and simplicity.
                    </p>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Camera,
                                color: 'from-cyan-500 to-blue-600',
                                title: 'Capture & Scan',
                                desc: 'Open the camera on your phone, point it at your catch. AI instantly identifies the fish species, estimates quantity, and analyzes freshness — no typing needed.',
                            },
                            {
                                icon: Cpu,
                                color: 'from-blue-600 to-indigo-700',
                                title: 'AI Pricing Intelligence',
                                desc: 'Our RAG-based engine retrieves historical auction data from similar catches at nearby harbors and suggests a fair starting price using a formula tuned for the market.',
                            },
                            {
                                icon: Zap,
                                color: 'from-indigo-600 to-violet-700',
                                title: 'Live Auction & Payout',
                                desc: 'Buyers bid in real-time via WebSocket. The auction runs on a timer — when it ends, the highest bidder wins and payment goes directly to the seller.',
                            },
                        ].map(({ icon: Icon, color, title, desc }) => (
                            <div key={title}
                                className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100
                            hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color}
                                  flex items-center justify-center mb-6 shadow-lg`}>
                                    <Icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-black text-gray-800 mb-3">{title}</h3>
                                <p className="text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────
          TECHNOLOGY
      ───────────────────────────────────────── */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3 block">
                            Technology Stack
                        </span>
                        <h2 className="text-4xl font-black text-gray-900 mb-4">
                            Enterprise-Grade Tech for Everyday Fishermen
                        </h2>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                            Built on production-proven technologies with AI at the core.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Cpu, color: 'text-indigo-600 bg-indigo-50',
                                title: 'RAG — Retrieval-Augmented Generation',
                                desc: 'In-memory vector store with cosine similarity search retrieves relevant historical auction data to ground AI price recommendations in real market data.',
                            },
                            {
                                icon: Camera, color: 'text-cyan-600 bg-cyan-50',
                                title: 'GPT-4o Vision (AI Fish Detector)',
                                desc: 'OpenAI GPT-4o analyzes fish photos to identify species, assess freshness, and estimate catch value — all in under 3 seconds.',
                            },
                            {
                                icon: Wifi, color: 'text-green-600 bg-green-50',
                                title: 'WebSocket Real-Time Bidding',
                                desc: 'Spring WebSocket broadcasts every new bid instantly across all connected browsers. Polling fallback ensures reliability on poor networks.',
                            },
                            {
                                icon: Shield, color: 'text-blue-600 bg-blue-50',
                                title: 'JWT Authentication & Spring Security',
                                desc: 'Stateless JWT tokens with BCrypt password hashing. Every protected endpoint validated with a custom Spring Security filter chain.',
                            },
                            {
                                icon: TrendingUp, color: 'text-orange-600 bg-orange-50',
                                title: 'AI Bid Pricing Formula',
                                desc: 'Price = BasePrice × FreshnessMultiplier × QuantityAdjustment. Confidence rated Low/Medium/High based on number of historical data points.',
                            },
                            {
                                icon: Globe, color: 'text-rose-600 bg-rose-50',
                                title: 'Government Market Integration',
                                desc: 'Integrated with India\'s official fish market price APIs (data.gov.in) and linked to the FMPIS portal for live market intelligence.',
                            },
                        ].map(({ icon: Icon, color, title, desc }) => (
                            <div key={title}
                                className="p-6 rounded-2xl border border-gray-100 hover:border-blue-200
                            hover:shadow-md transition-all duration-200">
                                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-black text-gray-800 mb-2">{title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────
          TARGET USERS
      ───────────────────────────────────────── */}
            <section className="py-24 px-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="max-w-6xl mx-auto text-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3 block">
                        Who We Serve
                    </span>
                    <h2 className="text-4xl font-black text-gray-900 mb-16">
                        Built for Every Stakeholder in the Fish Supply Chain
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                emoji: '🎣',
                                title: 'Fishermen & Sellers',
                                color: 'border-blue-200 bg-white',
                                points: [
                                    'Camera-first UI — no typing required',
                                    'AI suggests optimal starting price',
                                    'GPS auto-detects nearest harbor',
                                    'Track all your auctions in one dashboard',
                                ],
                            },
                            {
                                emoji: '🛒',
                                title: 'Buyers & Traders',
                                color: 'border-indigo-200 bg-white',
                                points: [
                                    'Browse live & historical auctions',
                                    'Real-time bid notifications via WebSocket',
                                    'Search by fish type, location, or price',
                                    'Transparent bidding with full bid history',
                                ],
                            },
                            {
                                emoji: '🏛️',
                                title: 'Market Administrators',
                                color: 'border-violet-200 bg-white',
                                points: [
                                    'Admin panel for auction management',
                                    'RAG analytics on 500+ historical records',
                                    'Government API integration for benchmarks',
                                    'Market trend reports and dashboards',
                                ],
                            },
                        ].map(({ emoji, title, color, points }) => (
                            <div key={title}
                                className={`rounded-3xl p-8 border-2 ${color} shadow-sm
                             hover:shadow-lg transition-all duration-300`}>
                                <div className="text-6xl mb-4">{emoji}</div>
                                <h3 className="text-xl font-black text-gray-800 mb-6">{title}</h3>
                                <ul className="space-y-3 text-left">
                                    {points.map(p => (
                                        <li key={p} className="flex items-start gap-3">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-gray-600">{p}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────
          KEY FEATURES
      ───────────────────────────────────────── */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3 block">
                            Platform Features
                        </span>
                        <h2 className="text-4xl font-black text-gray-900">
                            Everything You Need to Run a Successful Auction
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: Camera, label: 'Camera Capture', desc: 'Scan fish with back camera' },
                            { icon: Cpu, label: 'AI Vision Analysis', desc: 'GPT-4o species detection' },
                            { icon: TrendingUp, label: 'Smart Pricing', desc: 'RAG + formula pricing' },
                            { icon: Wifi, label: 'Live Bidding', desc: 'WebSocket real-time bids' },
                            { icon: MapPin, label: 'GPS Harbor Detection', desc: 'Auto-locate nearest harbor' },
                            { icon: BarChart3, label: 'Market Intelligence', desc: 'Gov. API price benchmarks' },
                            { icon: Smartphone, label: 'Mobile-First', desc: 'Works on any device' },
                            { icon: Shield, label: 'Secure Platform', desc: 'JWT + Spring Security' },
                        ].map(({ icon: Icon, label, desc }) => (
                            <div key={label}
                                className="p-5 rounded-2xl bg-gray-50 border border-gray-100
                            hover:bg-blue-50 hover:border-blue-200 transition-all group">
                                <Icon className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                                <p className="font-bold text-gray-800 text-sm">{label}</p>
                                <p className="text-xs text-gray-500 mt-1">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────
          TESTIMONIAL / QUOTE
      ───────────────────────────────────────── */}
            <section className="py-20 px-6 bg-slate-900 text-white text-center">
                <div className="max-w-3xl mx-auto">
                    <Star className="w-10 h-10 text-yellow-400 mx-auto mb-6" />
                    <blockquote className="text-2xl font-bold leading-relaxed mb-8 text-slate-200 italic">
                        "FishOnBid is built with one mission — ensure every fisherman gets a fair price
                        for their hard work, backed by real market data and modern technology."
                    </blockquote>
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500
                             flex items-center justify-center text-lg font-black">🐟</div>
                        <div className="text-left">
                            <p className="font-bold">FishOnBid Team</p>
                            <p className="text-slate-400 text-sm">Smart India Hackathon Project</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─────────────────────────────────────────
          CTA SECTION
      ───────────────────────────────────────── */}
            <section className="py-28 px-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                </div>
                <div className="relative max-w-3xl mx-auto">
                    <Anchor className="w-12 h-12 mx-auto mb-6 text-cyan-300" />
                    <h2 className="text-5xl font-black mb-6">
                        Ready to Get the Best Price for Your Catch?
                    </h2>
                    <p className="text-blue-100 text-xl mb-10 max-w-xl mx-auto">
                        Join thousands of fishermen already using FishOnBid to turn fresh catches
                        into maximum earnings — in minutes, not hours.
                    </p>
                    {user ? (
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center justify-center gap-2 px-10 py-4
                         bg-white text-blue-700 rounded-2xl font-black text-lg
                         hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-0.5"
                        >
                            Go to My Dashboard <ArrowRight className="w-5 h-5" />
                        </Link>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/signup"
                                className="inline-flex items-center justify-center gap-2 px-10 py-4
                             bg-white text-blue-700 rounded-2xl font-black text-lg
                             hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-0.5"
                            >
                                Create Free Account <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center gap-2 px-10 py-4
                             bg-white/15 border border-white/30 rounded-2xl font-bold text-lg
                             hover:bg-white/25 transition-all backdrop-blur-sm"
                            >
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* ─────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────── */}
            <footer className="bg-slate-900 py-8 text-center">
                <p className="text-slate-500 text-sm">© 2026 FishOnBid. All rights reserved.</p>
            </footer>

        </div>
    );
}
