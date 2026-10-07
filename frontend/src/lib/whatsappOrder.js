export function buildWhatsAppOrderMessage(customer, order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );

  return [
    'NEXORA Order',
    '',
    'Customer:',
    `Name: ${customer.firstName} ${customer.lastName}`.trim(),
    `Phone: ${customer.phone}`,
    `Address: ${[
      customer.houseNumber,
      customer.laneStreet,
      customer.city,
      customer.district,
      customer.country,
    ].filter(Boolean).join(', ')}`,
    '',
    'Order:',
    ...items.flatMap((item, index) => {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      return [
        `${index + 1}. ${item.name}`,
        `   Qty: ${quantity}`,
        `   Unit Price: LKR ${price.toFixed(2)}`,
        `   Line Total: LKR ${(price * quantity).toFixed(2)}`,
        '',
      ];
    }),
    `Subtotal: LKR ${subtotal.toFixed(2)}`,
    `Shipping: LKR ${Number(order.shippingFee || 0).toFixed(2)}`,
    `Total: LKR ${Number(order.totalAmount || 0).toFixed(2)}`,
    `Order reference: ${order.orderId}`,
  ].join('\n');
}

export function buildWhatsAppOrderUrl(number, message) {
  const normalizedNumber = String(number || '').replace(/\D/g, '');
  if (!normalizedNumber) return null;
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}
