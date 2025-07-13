function generateReceipt(items = [], taxRate = 0.2) {
  const subtotal = items.reduce((sum, item) => {
    const qty = item.quantity || 1;
    const price = item.price || 0;
    return sum + price * qty;
  }, 0);
  const tax = Number((subtotal * taxRate).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  return {
    id: `rcpt_${Date.now()}`,
    date: new Date().toISOString(),
    items,
    subtotal,
    taxRate,
    tax,
    total,
  };
}

module.exports = { generateReceipt };
