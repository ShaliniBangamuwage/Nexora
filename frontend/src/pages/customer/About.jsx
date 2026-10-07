import { Cpu, Headphones, Laptop, ShieldCheck, Smartphone, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
  { icon: Smartphone, title: 'Mobile', detail: 'Phones, tablets, and everyday accessories.' },
  { icon: Laptop, title: 'Computing', detail: 'Laptops and gear for work, study, and play.' },
  { icon: Headphones, title: 'Audio', detail: 'Headphones, speakers, and personal sound.' },
  { icon: Cpu, title: 'Connected tech', detail: 'Wearables, gaming, and smart-home devices.' },
];

export default function About() {
  return <main className="min-h-screen bg-white text-slate-900">
    <section className="bg-slate-950 px-5 py-16 text-white sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">NEXORA electronics</p><h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">Technology for what’s next.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">A practical place to discover electronics and everyday tech. Browse the live catalog for current products, availability, and pricing.</p></div>
        <Link to="/customer/products" className="inline-flex w-fit items-center rounded-md bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 no-underline">Browse the catalog</Link>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <header className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.17em] text-blue-800">Explore the catalog</p><h2 className="mt-2 text-2xl font-bold">Built around the tech you use</h2></header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categories.map(({ icon: Icon, title, detail }) => <article key={title} className="border border-slate-200 p-5"><Icon size={22} className="text-blue-800" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p></article>)}</div>
    </section>
    <section className="border-y border-slate-200 bg-slate-50 px-5 py-12 sm:px-8"><div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2"><div><div className="flex items-center gap-3"><ShieldCheck size={20} className="text-emerald-800" /><h2 className="text-lg font-bold">Clear product details</h2></div><p className="mt-3 text-sm leading-6 text-slate-600">Product descriptions, specifications, listed warranty, and stock information are shown on each item page.</p></div><div><div className="flex items-center gap-3"><Truck size={20} className="text-blue-800" /><h2 className="text-lg font-bold">Order updates</h2></div><p className="mt-3 text-sm leading-6 text-slate-600">Sign in to place an order and follow payment and fulfillment updates from your account.</p></div></div></section>
  </main>;
}
