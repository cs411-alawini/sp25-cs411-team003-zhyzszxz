import React, { useState } from 'react';

function InsertOrderComponent() {
  const [formData, setFormData] = useState({
    order_id: '',
    customer_id: '',
    order_status: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleInsert = async () => {
    const res = await fetch('http://localhost:5000/api/insert-order', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(formData)
    });

    const result = await res.json();
    setMessage(result.message || result.error || 'Unknown error');
    setFormData({ order_id: '', customer_id: '', order_status: '' });
  };

  return (
    <div>
      <h2>Insert New Order</h2>
      <input name="order_id" placeholder="Order ID" value={formData.order_id} onChange={handleChange} />
      <input name="customer_id" placeholder="Customer ID" value={formData.customer_id} onChange={handleChange} />
      <input name="order_status" placeholder="Order Status" value={formData.order_status} onChange={handleChange} />
      <button onClick={handleInsert}>Insert Order</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default InsertOrderComponent;
