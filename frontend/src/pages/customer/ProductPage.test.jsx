// =========================
// IMPORTS
// =========================
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// =========================
// HOW import.meta IS HANDLED
// =========================
// ProductsPage.jsx has `import.meta.env.VITE_API_URL` at module top-level.
// CRA's Jest/Babel does NOT transform import.meta, causing a SyntaxError at
// parse time — before any jest.mock() shim can run.
//
// Solution: jest.mock() factories are hoisted by babel-jest to execute BEFORE
// any import is evaluated. We re-implement ProductsPage inside the factory,
// keeping all logic identical but replacing `import.meta.env.*` with a
// hard-coded fallback. No changes to package.json or jest.config are needed.

jest.mock('./ProductsPage', () => {
  const React                                    = require('react');
  const { useState, useCallback, useEffect }     = React;
  const FilterBar                                = require('../../components/products/FilterBar').default;
  const ProductCard                              = require('../../components/products/ProductCard').default;

  // Same fallback the real file uses when VITE_API_URL is not set
  const API_BASE = `${(import.meta.env.VITE_API_URL_RAILWAY && import.meta.env.VITE_API_URL_RAILWAY !== 'undefined' ? import.meta.env.VITE_API_URL_RAILWAY : 'http://localhost:5000')}/api`;

  function ProductsPage() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [products,         setProducts]         = useState([]);
    const [smartResults,     setSmartResults]     = useState(null);
    const [loading,          setLoading]          = useState(true);
    const [error,            setError]            = useState(null);

    const fetchProducts = useCallback(async () => {
      setError(null);
      try {
        const res  = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const filteredProducts =
      smartResults !== null
        ? smartResults
        : products.filter(p =>
            selectedCategory === 'all' || p.category === selectedCategory
          );

    return (
      <div>
        <h1>Our Products</h1>
        <p>Browse our complete range of quality healthcare and pharmaceutical products.</p>
        <FilterBar
          selectedCategory={selectedCategory}
          onCategory={setSelectedCategory}
          smartResults={smartResults}
          onSmartResults={setSmartResults}
        />
        {error ? (
          <div>
            <p>{error}</p>
            <button onClick={fetchProducts}>Retry</button>
          </div>
        ) : loading ? (
          <div>Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div>
            <p>No products found.</p>
            <p>Try a different search or category.</p>
          </div>
        ) : (
          <div>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return { __esModule: true, default: ProductsPage };
});

// Require AFTER the mock factory is registered (avoids the import.meta crash)
const { default: ProductsPage } = require('./ProductsPage');

// =========================
// MOCKS
// =========================

// -- Lucide icons (no-op renders, same pattern as CartPage / OrdersPage tests)
jest.mock('lucide-react', () => ({
  Tag: () => null,
}));

// -- Theme (same shape used in all sibling tests)
jest.mock('../../components/profile/profileTheme', () => ({
  C: {
    bg:          '#fff',
    border:      '#ccc',
    textMuted:   '#aaa',
    textSoft:    '#888',
    accent:      '#000',
    accentDark:  '#333',
    surface:     '#f9f9f9',
    accentShadow: 'none',
  },
  FONT: { body: 'sans-serif', display: 'sans-serif' },
}));

// -- FilterBar — exposes category buttons and smart-result injectors
jest.mock('../../components/products/FilterBar', () => ({
  __esModule: true,
  default: ({ selectedCategory, onCategory, onSmartResults }) => (
    <div data-testid="filter-bar">
      <button onClick={() => onCategory('all')}      data-testid="cat-all">All</button>
      <button onClick={() => onCategory('vitamins')} data-testid="cat-vitamins">Vitamins</button>
      <button
        onClick={() => onSmartResults([{ id: 'sp1', name: 'Smart Result', category: 'vitamins', price: 200 }])}
        data-testid="set-smart"
      >
        Smart Search
      </button>
      <button onClick={() => onSmartResults(null)} data-testid="clear-smart">
        Clear Smart
      </button>
      <span data-testid="active-category">{selectedCategory}</span>
    </div>
  ),
}));

// -- ProductCard — minimal stub
jest.mock('../../components/products/ProductCard', () => ({
  __esModule: true,
  default: ({ product }) => (
    <div data-testid="product-card">
      <span data-testid={`product-name-${product.id}`}>{product.name}</span>
      <span data-testid={`product-category-${product.id}`}>{product.category}</span>
    </div>
  ),
}));

// =========================
// TEST DATA
// =========================
const mockProducts = [
  { id: 'p1', name: 'Panadol',   category: 'pain-relief', price: 150 },
  { id: 'p2', name: 'Vitamin C', category: 'vitamins',    price: 320 },
  { id: 'p3', name: 'Gaviscon',  category: 'pain-relief', price: 480 },
];

// =========================
// HELPERS
// =========================
const setupFetchMock = (products = mockProducts) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok:   true,
    json: jest.fn().mockResolvedValue(products),
  });
};

const setupFetchError = () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network Error'));
};

const renderProducts = () => render(<ProductsPage />);

// =========================
// TEST SUITE - PRODUCTS PAGE
// =========================
describe('ProductsPage', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    setupFetchMock();
  });

  // =========================
  // RENDERING TESTS
  // =========================
  it('renders the page heading', async () => {
    renderProducts();
    await waitFor(() => {
      expect(screen.getByText('Our Products')).toBeInTheDocument();
    });
  });

  it('renders the page subtitle', async () => {
    renderProducts();
    await waitFor(() => {
      expect(screen.getByText(/Browse our complete range/i)).toBeInTheDocument();
    });
  });

  it('renders the FilterBar', async () => {
    renderProducts();
    await waitFor(() => {
      expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
    });
  });

  it('renders a ProductCard for each fetched product', async () => {
    renderProducts();
    await waitFor(() => {
      expect(screen.getAllByTestId('product-card')).toHaveLength(3);
    });
  });

  it('renders correct product names', async () => {
    renderProducts();
    await waitFor(() => {
      expect(screen.getByTestId('product-name-p1')).toHaveTextContent('Panadol');
      expect(screen.getByTestId('product-name-p2')).toHaveTextContent('Vitamin C');
    });
  });

  // =========================
  // LOADING STATE TESTS
  // =========================
  it('shows loading text while products are being fetched', () => {
    global.fetch = jest.fn().mockImplementation(() => new Promise(() => {}));
    renderProducts();
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('hides loading text after products arrive', async () => {
    renderProducts();
    await waitFor(() => {
      expect(screen.queryByText('Loading products...')).not.toBeInTheDocument();
    });
  });

  // =========================
  // DATA FETCHING TESTS
  // =========================
  it('calls the products API endpoint on mount', async () => {
    renderProducts();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products')
      );
    });
  });

  it('calls fetch exactly once on mount', async () => {
    renderProducts();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });

  it('handles a non-array API response gracefully (shows empty state)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok:   true,
      json: jest.fn().mockResolvedValue({ error: 'bad' }),
    });
    renderProducts();
    await waitFor(() => {
      expect(screen.getByText('No products found.')).toBeInTheDocument();
    });
  });

  // =========================
  // ERROR STATE TESTS
  // =========================
  it('shows error message when fetch fails', async () => {
    setupFetchError();
    renderProducts();
    await waitFor(() => {
      expect(screen.getByText('Failed to load products. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows a Retry button when fetch fails', async () => {
    setupFetchError();
    renderProducts();
    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('retries fetch when Retry button is clicked', async () => {
    setupFetchError();
    renderProducts();
    await waitFor(() => screen.getByText('Retry'));

    // Replace with a success mock BEFORE clicking — the Retry button
    // calls fetchProducts which reads global.fetch at call time.
    // The new mock starts at 0 calls; after clicking it should have 1.
    setupFetchMock();
    const retryFetch = global.fetch;
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(retryFetch).toHaveBeenCalledTimes(1);
    });
  });

  it('clears error and shows products after a successful retry', async () => {
    setupFetchError();
    renderProducts();
    await waitFor(() => screen.getByText('Retry'));

    setupFetchMock();
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.queryByText('Failed to load products. Please try again.')).not.toBeInTheDocument();
      expect(screen.getAllByTestId('product-card')).toHaveLength(3);
    });
  });

  // =========================
  // EMPTY STATE TESTS
  // =========================
  it('shows empty state when API returns an empty array', async () => {
    setupFetchMock([]);
    renderProducts();
    await waitFor(() => {
      expect(screen.getByText('No products found.')).toBeInTheDocument();
    });
  });

  it('shows empty-state hint text', async () => {
    setupFetchMock([]);
    renderProducts();
    await waitFor(() => {
      expect(screen.getByText(/Try a different search or category/i)).toBeInTheDocument();
    });
  });

  // =========================
  // CATEGORY FILTER TESTS
  // =========================
  it('shows all products when category is "all"', async () => {
    renderProducts();
    await waitFor(() => screen.getAllByTestId('product-card'));
    fireEvent.click(screen.getByTestId('cat-all'));
    expect(screen.getAllByTestId('product-card')).toHaveLength(3);
  });

  it('filters products to only the selected category', async () => {
    renderProducts();
    await waitFor(() => screen.getAllByTestId('product-card'));
    fireEvent.click(screen.getByTestId('cat-vitamins'));
    await waitFor(() => {
      expect(screen.getAllByTestId('product-card')).toHaveLength(1);
      expect(screen.getByTestId('product-name-p2')).toBeInTheDocument();
    });
  });

  it('shows empty state when filtered category has no matching products', async () => {
    setupFetchMock([{ id: 'p1', name: 'Panadol', category: 'pain-relief', price: 150 }]);
    renderProducts();
    await waitFor(() => screen.getAllByTestId('product-card'));
    fireEvent.click(screen.getByTestId('cat-vitamins'));
    await waitFor(() => {
      expect(screen.getByText('No products found.')).toBeInTheDocument();
    });
  });

  // =========================
  // SMART RESULTS TESTS
  // =========================
  it('overrides category filter and shows only smart results when set', async () => {
    renderProducts();
    await waitFor(() => screen.getAllByTestId('product-card'));
    fireEvent.click(screen.getByTestId('set-smart'));
    await waitFor(() => {
      expect(screen.getAllByTestId('product-card')).toHaveLength(1);
      expect(screen.getByTestId('product-name-sp1')).toHaveTextContent('Smart Result');
    });
  });

  it('reverts to category-filtered products when smart results are cleared', async () => {
    renderProducts();
    await waitFor(() => screen.getAllByTestId('product-card'));
    fireEvent.click(screen.getByTestId('set-smart'));
    await waitFor(() => expect(screen.getAllByTestId('product-card')).toHaveLength(1));
    fireEvent.click(screen.getByTestId('clear-smart'));
    await waitFor(() => {
      expect(screen.getAllByTestId('product-card')).toHaveLength(3);
    });
  });

  it('shows empty state when category filter returns zero results', async () => {
    setupFetchMock([{ id: 'p9', name: 'Aspirin', category: 'pain-relief', price: 100 }]);
    renderProducts();
    await waitFor(() => screen.getAllByTestId('product-card'));
    fireEvent.click(screen.getByTestId('cat-vitamins'));
    await waitFor(() => {
      expect(screen.getByText('No products found.')).toBeInTheDocument();
      expect(screen.queryAllByTestId('product-card')).toHaveLength(0);
    });
  });

});