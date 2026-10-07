import { useNavigate } from 'react-router-dom';
import HeroCarousel from '../../components/HeroCarousel';
import NewArrivals from '../../components/NewArrivals';
import BestSelling from '../../components/BestSelling';
import { C } from '../../components/profile/profileTheme';

const categories = [
  ['Smartphones', 'smartphones', '📱'],
  ['Laptops', 'laptops', '💻'],
  ['Tablets', 'tablets', '📲'],
  ['Monitors', 'monitors', '🖥️'],
  ['Audio', 'audio', '🎧'],
  ['Keyboards & Mice', 'keyboards-mice', '⌨️'],
  ['Networking', 'networking', '🌐'],
  ['Accessories', 'accessories', '🔌'],
];

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="w-full" style={{ background: C.bg }}>
      <HeroCarousel />
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Shop by category</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Tech for every day</h2>
          </div>
          <button onClick={() => navigate('/customer/products')} className="hidden rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 md:inline-flex">Browse all</button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map(([label, slug, icon]) => (
            <button key={slug} onClick={() => navigate(`/customer/products?category=${slug}`)} className="border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md">
              <span className="mb-3 block text-3xl" aria-hidden="true">{icon}</span>
              <span className="font-semibold text-slate-800">{label}</span>
            </button>
          ))}
        </div>
      </section>
      <NewArrivals />
      <BestSelling />
    </div>
  );
}
