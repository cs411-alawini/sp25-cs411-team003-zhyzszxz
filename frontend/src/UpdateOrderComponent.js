import React, { useState } from 'react';

function UpdateOrderComponent() {
  const [orderId, setOrderId] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [message, setMessage] = useState('');

  const handleUpdate = async () => {
    const res = await fetch(`http://localhost:5000/api/update-order/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_status: orderStatus })
    });

    const result = await res.json();
    setMessage(result.message || result.error || 'Unknown error');
    setOrderId('');
    setOrderStatus('');
  };

  return (
    <div>
      <h2>Update Order Status</h2>
      <input
        placeholder="Order ID"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
      />
      <input
        placeholder="New Order Status"
        value={orderStatus}
        onChange={(e) => setOrderStatus(e.target.value)}
      />
      <button onClick={handleUpdate}>Update Order</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default UpdateOrderComponent;
