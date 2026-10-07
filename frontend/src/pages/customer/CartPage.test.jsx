// =========================
// IMPORTS
// =========================
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CartPage from './CartPage';
import { useCartStore } from '../../stores/cartStore';

// =========================
// MOCKS
// =========================
jest.mock('../../stores/cartStore');

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.mock('lucide-react', () => ({
  ArrowLeft: () => null,
  Trash2: () => null,
}));

jest.mock('../../components/profile/profileTheme', () => ({
  C: {
    bg: '#fff',
    border: '#ccc',
    dangerText: 'red',
    dangerBg: '#fee',
    dangerBorder: '#fcc',
    textSoft: '#888',
    accent: '#000',
    accentShadow: 'none',
  },
  FONT: { body: 'sans-serif' },
}));

jest.mock('../../components/cart/EmptyCart', () => ({
  __esModule: true,
  default: () => <div>Empty Cart</div>,
}));

jest.mock('../../components/cart/CartItem', () => ({
  __esModule: true,
  default: ({ item, onRemove }) => (
    <div data-testid="cart-item">
      <span>{item.name}</span>
      <button onClick={onRemove}>Remove</button>
    </div>
  ),
}));

jest.mock('../../components/cart/OrderSummary', () => ({
  __esModule: true,
  default: () => <div>Order Summary</div>,
}));

jest.mock('../../components/Card', () => ({
  __esModule: true,
  default: ({ title, value }) => (
    <div data-testid="card">
      <span>{title}</span>
      <span>{String(value)}</span>
    </div>
  ),
}));

// =========================
// TEST DATA & STORE MOCK
// =========================
const mockNavigate = jest.fn();

const mockItems = [
  { id: 'item1', name: 'Panadol', qty: 2, price: 150 },
  { id: 'item2', name: 'Gaviscon', qty: 1, price: 340 },
];

const mockStore = {
  items: mockItems,
  removeItem: jest.fn(),
  clearCart: jest.fn(),
  getTotal: jest.fn(),
  fetchItems: jest.fn(),
};

const renderCart = () => render(<CartPage />);

// =========================
// TEST SUITE - CART PAGE
// =========================
describe('CartPage', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.getTotal.mockReturnValue(640);
    useCartStore.mockReturnValue(mockStore);
  });

  // =========================
  // RENDERING TESTS
  // =========================
  it('renders summary cards with correct values', () => {
    renderCart();
    expect(screen.getByText('Total Products')).toBeInTheDocument();
    expect(screen.getByText('Total Quantity')).toBeInTheDocument();
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
  });

  it('renders all cart items', () => {
    renderCart();
    expect(screen.getAllByTestId('cart-item')).toHaveLength(2);
  });

  it('renders order summary', () => {
    renderCart();
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
  });

  it('renders EmptyCart when items array is empty', () => {
    useCartStore.mockReturnValue({ ...mockStore, items: [] });
    renderCart();
    expect(screen.getByText('Empty Cart')).toBeInTheDocument();
  });

  // =========================
  // DATA LOADING TESTS
  // =========================
  it('calls fetchItems on mount', () => {
    renderCart();
    expect(mockStore.fetchItems).toHaveBeenCalledTimes(1);
  });

  // =========================
  // CART ACTION TESTS
  // =========================
  it('calls clearCart when Clear Cart is clicked', async () => {
    renderCart();
    fireEvent.click(screen.getByText('Clear Cart'));
    await waitFor(() =>
      expect(mockStore.clearCart).toHaveBeenCalledTimes(1)
    );
  });

  it('calls removeItem when Remove is clicked', async () => {
    renderCart();
    fireEvent.click(screen.getAllByText('Remove')[0]);
    await waitFor(() =>
      expect(mockStore.removeItem).toHaveBeenCalledWith('item1')
    );
  });

  // =========================
  // NAVIGATION TESTS
  // =========================
  it('navigates to checkout page', () => {
    renderCart();
    fireEvent.click(screen.getByText('Proceed to Checkout'));
    expect(mockNavigate).toHaveBeenCalledWith('/customer/checkout');
  });

  it('renders Continue Shopping link correctly', () => {
    renderCart();
    const link = screen.getByText('Continue Shopping').closest('a');
    expect(link).toHaveAttribute('href', '/customer/products');
  });

});