import React, { useState } from 'react';

function UpdateOrderStatusComponent() {
  const [formData, setFormData] = useState({
    order_id: '',
    order_status: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    const res = await fetch('http://localhost:5000/api/update-order-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await res.json();
    setMessage(result.message || result.error || 'Unknown error');
    setFormData({ order_id: '', order_status: '' });
  };

  return (
    <div>
      <h2>Update Order Status</h2>
      <input
        name="order_id"
        placeholder="Order ID"
        value={formData.order_id}
        onChange={handleChange}
      />
      <input
        name="order_status"
        placeholder="New Status"
        value={formData.order_status}
        onChange={handleChange}
      />
      <button onClick={handleUpdate}>Update Status</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default UpdateOrderStatusComponent;
