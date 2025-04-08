import React, { useState, useEffect } from 'react';

function App() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: '', quantity: '', price: '' });

  const fetchProducts = async () => {
    const res = await fetch('http://localhost:5000/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setFormData({ name: '', quantity: '', price: '' });
    fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>Inventory Dashboard</h1>

      <form onSubmit={handleSubmit}>
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" required />
        <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="Quantity" required />
        <input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} placeholder="Price" required />
        <button type="submit">Add Product</button>
      </form>

      <h2>Product List</h2>
      <ul>
        {products.map(p => (
          <li key={p.id}>
            {p.name} - {p.quantity} units @ ${p.price}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
