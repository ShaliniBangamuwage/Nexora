import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, PackagePlus, Pencil, Plus, RefreshCw, Tag, Trash2, X } from 'lucide-react';
import { getAuthHeaders } from '../../services/firebase';
import API_BASE_URL from '../../config/api';

const emptyProduct = {
  name: '', brand: '', category: '', description: '', price: '', stock: '',
  images: [], specifications: '{}', warranty: '', status: 'active',
};

export default function CatalogManagement() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editing, setEditing] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [taxonomyName, setTaxonomyName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const api = useCallback(async (path, options = {}) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'Request failed');
    return result;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productRows, categoryRows, brandRows] = await Promise.all([
        api('/admin/catalog/products'), api('/admin/catalog/categories'), api('/admin/catalog/brands'),
      ]);
      setProducts(Array.isArray(productRows) ? productRows : []);
      setCategories(Array.isArray(categoryRows) ? categoryRows : []);
      setBrands(Array.isArray(brandRows) ? brandRows : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { refresh(); }, [refresh]);

  const beginCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setImageFile(null);
    setError('');
    setShowProductForm(true);
  };

  const beginEdit = (product) => {
    setEditing(product);
    setForm({
      ...emptyProduct,
      ...product,
      name: product.name || product.productName || '',
      brand: product.brand || product.manufacturer || '',
      price: String(product.price ?? product.retailPrice ?? ''),
      stock: String(product.stock ?? 0),
      images: Array.isArray(product.images) ? product.images : product.imageUrl ? [product.imageUrl] : [],
      specifications: JSON.stringify(product.specifications || {}, null, 2),
      warranty: product.warranty || '',
      status: product.status || 'active',
    });
    setImageFile(null);
    setError('');
    setShowProductForm(true);
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      let images = form.images;
      if (imageFile) {
        const headers = await getAuthHeaders();
        const uploadHeaders = { ...headers };
        delete uploadHeaders['Content-Type'];
        delete uploadHeaders['content-type'];
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        const uploadResponse = await fetch(`${API_BASE_URL}/admin/catalog/images`, { method: 'POST', headers: uploadHeaders, body: uploadData });
        const uploaded = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) throw new Error(uploaded.message || 'Image upload failed');
        images = [...images, uploaded.url];
      }
      let specifications;
      try { specifications = JSON.parse(form.specifications || '{}'); }
      catch { throw new Error('Specifications must be valid JSON'); }
      const payload = {
        name: form.name,
        brand: form.brand,
        category: form.category,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        images,
        specifications,
        warranty: form.warranty,
        status: form.status,
      };
      await api(editing ? `/admin/catalog/products/${editing.id}` : '/admin/catalog/products', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setEditing(null);
      setShowProductForm(false);
      setNotice(editing ? 'Product updated.' : 'Product created.');
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const updateStock = async (product, stockValue) => {
    const stock = Number(stockValue);
    if (!Number.isInteger(stock) || stock < 0) return;
    try {
      await api(`/admin/catalog/products/${product.id}/stock`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock }),
      });
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, stock, status: stock === 0 ? 'out_of_stock' : item.status === 'out_of_stock' ? 'active' : item.status } : item));
      setNotice('Inventory updated.');
    } catch (err) { setError(err.message); }
  };

  const archiveProduct = async (product) => {
    if (!window.confirm(`Deactivate ${product.name || product.productName}?`)) return;
    try {
      await api(`/admin/catalog/products/${product.id}`, { method: 'DELETE' });
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, status: 'archived' } : item));
      setNotice('Product deactivated.');
    } catch (err) { setError(err.message); }
  };

  const saveTaxonomy = async (event) => {
    event.preventDefault();
    if (!taxonomyName.trim()) return;
    const collection = tab;
    try {
      await api(`/admin/catalog/${collection}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: taxonomyName }),
      });
      setTaxonomyName('');
      setNotice(`${collection === 'brands' ? 'Brand' : 'Category'} added.`);
      await refresh();
    } catch (err) { setError(err.message); }
  };

  const archiveTaxonomy = async (collection, item) => {
    try {
      await api(`/admin/catalog/${collection}/${item.id}`, { method: 'DELETE' });
      if (collection === 'brands') setBrands((current) => current.map((row) => row.id === item.id ? { ...row, status: 'archived' } : row));
      else setCategories((current) => current.map((row) => row.id === item.id ? { ...row, status: 'archived' } : row));
    } catch (err) { setError(err.message); }
  };

  const renameTaxonomy = async (collection, item) => {
    const name = window.prompt(`Rename ${collection.slice(0, -1)}`, item.name);
    if (!name?.trim() || name.trim() === item.name) return;
    try {
      await api(`/admin/catalog/${collection}/${item.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
      });
      await refresh();
    } catch (err) { setError(err.message); }
  };

  const activeProducts = products.filter((product) => product.status !== 'archived');

  return (
    <section className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Store administration</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Catalog & Inventory</h1>
        </div>
        <button onClick={refresh} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw size={15} /> Refresh</button>
      </header>

      {error && <div role="alert" className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}<button aria-label="Dismiss error" onClick={() => setError('')}><X size={16} /></button></div>}
      {notice && <div role="status" className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}<button aria-label="Dismiss notice" onClick={() => setNotice('')}><X size={16} /></button></div>}

      <nav className="flex gap-1 border-b border-slate-200" aria-label="Catalog sections">
        {[['products', 'Products'], ['categories', 'Categories'], ['brands', 'Brands']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setError(''); }} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === key ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{label}</button>
        ))}
      </nav>

      {tab === 'products' && <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">{activeProducts.length} active catalog items</p>
          <button onClick={beginCreate} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"><PackagePlus size={16} /> Add product</button>
        </div>
        {loading ? <p className="py-10 text-center text-slate-500">Loading catalog…</p> : (
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category / Brand</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => <tr key={product.id} className={product.status === 'archived' ? 'bg-slate-50 text-slate-400' : ''}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3">{(product.images?.[0] || product.imageUrl) ? <img src={product.images?.[0] || product.imageUrl} alt="" className="h-11 w-11 rounded border border-slate-200 object-cover" /> : <span className="grid h-11 w-11 place-items-center rounded border border-slate-200 bg-slate-50"><ImagePlus size={16} /></span>}<div><p className="font-semibold text-slate-900">{product.name || product.productName}</p><p className="text-xs text-slate-500">{product.warranty || 'Warranty not set'}</p></div></div></td>
                  <td className="px-4 py-3"><div>{product.category || '—'}</div><div className="text-xs text-slate-500">{product.brand || product.manufacturer || '—'}</div></td>
                  <td className="px-4 py-3">Rs. {Number(product.price ?? product.retailPrice ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><input aria-label={`Stock for ${product.name || product.productName}`} key={`${product.id}-${product.stock}`} type="number" min="0" defaultValue={product.stock ?? 0} onBlur={(event) => { if (Number(event.target.value) !== Number(product.stock)) updateStock(product, event.target.value); }} className="w-20 rounded border border-slate-300 px-2 py-1" />{product.stock <= 0 ? <span className="text-xs font-semibold text-red-700">Out</span> : product.stock <= 5 ? <span className="text-xs font-semibold text-amber-700">Low</span> : null}</div></td>
                  <td className="px-4 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{product.status || 'active'}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button title="Edit product" onClick={() => beginEdit(product)} className="rounded border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"><Pencil size={15} /></button>{product.status !== 'archived' && <button title="Deactivate product" onClick={() => archiveProduct(product)} className="rounded border border-red-200 p-2 text-red-700 hover:bg-red-50"><Trash2 size={15} /></button>}</div></td>
                </tr>)}
                {!products.length && <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-500">No products yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </>}

      {(tab === 'categories' || tab === 'brands') && <>
        <form onSubmit={saveTaxonomy} className="flex max-w-xl gap-2">
          <input value={taxonomyName} onChange={(event) => setTaxonomyName(event.target.value)} aria-label={`New ${tab.slice(0, -1)} name`} placeholder={`Add ${tab.slice(0, -1)}`} className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
          <button className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} /> Add</button>
        </form>
        <div className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
          {(tab === 'categories' ? categories : brands).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3"><div className="flex items-center gap-3"><Tag size={16} className="text-slate-400" /><span className="font-medium text-slate-800">{item.name}</span>{item.status === 'archived' && <span className="text-xs text-slate-400">Archived</span>}</div>{item.status !== 'archived' && <div className="flex gap-2"><button onClick={() => renameTaxonomy(tab, item)} title={`Rename ${item.name}`} className="rounded border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><Pencil size={15} /></button><button onClick={() => archiveTaxonomy(tab, item)} title={`Archive ${item.name}`} className="rounded border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><Trash2 size={15} /></button></div>}</div>)}
          {(tab === 'categories' ? categories : brands).length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-500">No {tab} available.</p>}
        </div>
      </>}

      {(tab === 'products' && showProductForm) && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) { setEditing(null); setForm(emptyProduct); setShowProductForm(false); } }}>
          <form onSubmit={saveProduct} className="my-6 w-full max-w-2xl space-y-4 rounded-lg bg-white p-5 shadow-xl sm:p-7">
            <header className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit product' : 'New product'}</h2><button type="button" aria-label="Close" onClick={() => { setEditing(null); setForm(emptyProduct); setShowProductForm(false); }}><X size={19} /></button></header>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['name', 'Name', 'text'], ['brand', 'Brand', 'text'], ['category', 'Category', 'text'], ['price', 'Price (LKR)', 'number'], ['stock', 'Stock', 'number'], ['warranty', 'Warranty', 'text'],
              ].map(([field, label, type]) => <label key={field} className="space-y-1 text-sm font-medium text-slate-700">{label}<input required={['name', 'brand', 'category', 'price', 'stock'].includes(field)} type={type} min={type === 'number' ? '0' : undefined} step={field === 'price' ? '0.01' : field === 'stock' ? '1' : undefined} value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2" /></label>)}
              <label className="space-y-1 text-sm font-medium text-slate-700">Status<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2"><option value="active">Active</option><option value="draft">Draft</option><option value="out_of_stock">Out of stock</option><option value="archived">Archived</option></select></label>
              <label className="space-y-1 text-sm font-medium text-slate-700 sm:col-span-2">Description<textarea rows="3" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              <label className="space-y-1 text-sm font-medium text-slate-700 sm:col-span-2">Specifications (JSON)<textarea rows="4" value={form.specifications} onChange={(event) => setForm((current) => ({ ...current, specifications: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs" /></label>
              <label className="space-y-1 text-sm font-medium text-slate-700 sm:col-span-2">Product image<input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} className="block w-full rounded-md border border-slate-300 px-3 py-2" /><span className="text-xs font-normal text-slate-500">Images are uploaded to Cloudinary when credentials are configured.</span></label>
              {form.images?.length > 0 && <div className="flex flex-wrap gap-2 sm:col-span-2">{form.images.map((url, index) => <div key={`${url}-${index}`} className="relative"><img src={url} alt="Product" className="h-16 w-16 rounded border object-cover" /><button type="button" onClick={() => setForm((current) => ({ ...current, images: current.images.filter((_, currentIndex) => currentIndex !== index) }))} aria-label="Remove image" className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow"><X size={13} /></button></div>)}</div>}
            </div>
            <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => { setEditing(null); setForm(emptyProduct); setShowProductForm(false); }} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button><button disabled={busy} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save product'}</button></footer>
          </form>
        </div>
      )}
    </section>
  );
}
