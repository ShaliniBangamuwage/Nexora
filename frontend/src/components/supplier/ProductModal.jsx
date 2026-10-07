import { Package } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { CATEGORY_ICONS } from './CategoryBadge';

const inputCls =
  'w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-[14px] text-slate-800 ' +
  'transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 ' +
  'focus:ring-blue-500/10 focus:bg-white placeholder:text-slate-400';

const formFields = [
  { label: 'Product Name',                key: 'productName',    type: 'text',   placeholder: 'e.g., Paracetamol 500mg',   required: true,  full: false },
  { label: 'Wholesale Price (Rs.)',        key: 'wholesalePrice', type: 'number', placeholder: '0.00',                      required: true,  full: false, extra: { step: '0.01' } },
  { label: 'Stock Supplied to MediCareX', key: 'stock',          type: 'number', placeholder: '0',                         required: false, full: false },
  { label: 'Remaining Stock (with You)',  key: 'minStock',       type: 'number', placeholder: '0',                         required: false, full: false },
  { label: 'Manufacturer',                key: 'manufacturer',   type: 'text',   placeholder: 'e.g., ABC Pharmaceuticals', required: false, full: true  },
];

const ProductModal = ({
  showModal,
  editingProduct,
  formData,
  setFormData,
  onSubmitAdd,
  onSubmitUpdate,
  onClose,
}) => {
  if (!showModal) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[780px] max-h-[90vh] overflow-y-auto shadow-2xl shadow-slate-900/20 border border-slate-200"
        style={{ animation: 'slideUp 0.25s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="text-[20px] font-bold text-slate-900">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-[12.5px] text-slate-400 mt-0.5">
              {editingProduct ? 'Update product details across both inventories' : 'Submit for admin review and approval'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-5 sm:px-8 py-5 sm:py-6">
          {!editingProduct && (
            <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-[12.5px] text-amber-800 leading-relaxed">
                This product will be submitted for <strong>admin approval</strong> before it appears in the inventory.
                A unique product code will be assigned upon approval.
              </p>
            </div>
          )}

          {editingProduct && (
            <div className="mb-6 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <span className="text-[12px] text-slate-400 font-medium">Product Code</span>
              <span className="font-mono text-[13px] font-bold text-blue-600 tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-lg">
                {editingProduct.productCode}
              </span>
              <span className="ml-auto text-[11px] text-slate-400 italic">auto-generated · read-only</span>
            </div>
          )}

          <form onSubmit={editingProduct ? onSubmitUpdate : onSubmitAdd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">

              {/* Category */}
              <div className="flex flex-col">
                <label className="block mb-2 text-[13px] font-semibold text-slate-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {formData.category && (() => {
                  const match = CATEGORIES.find((c) => c.id === formData.category);
                  const IconComponent = match ? (CATEGORY_ICONS[match.id] || Package) : null;
                  return match && IconComponent ? (
                    <div className="mt-2 flex items-center gap-1.5 text-[12px] text-blue-500 font-medium">
                      <IconComponent size={13} />
                      <span>{match.name} selected</span>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Dynamic fields */}
              {formFields.map((field) => (
                <div key={field.key} className={`flex flex-col ${field.full ? 'col-span-2' : ''}`}>
                  <label className="block mb-2 text-[13px] font-semibold text-slate-700">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={field.type}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={formData[field.key]}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className={inputCls}
                    {...(field.extra || {})}
                  />
                </div>
              ))}

              {/* Expiry Date */}
              <div className="flex flex-col">
                <label className="block mb-2 text-[13px] font-semibold text-slate-700">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.expireDate}
                  onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })}
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col col-span-2">
                <label className="block mb-2 text-[13px] font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Product description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`${inputCls} resize-y min-h-[90px] leading-relaxed`}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
              <button
                type="submit"
                className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14px] rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200"
              >
                {editingProduct ? 'Update Product' : 'Submit for Approval'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-6 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300 font-semibold text-[14px] rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;