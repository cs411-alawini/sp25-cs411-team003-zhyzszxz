// src/CustomerOrdersComponent.js
import React, { useState } from 'react';

function CustomerOrdersComponent() {
  const [customerId, setCustomerId] = useState('');
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');

  const handleFetchOrders = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/customer-orders/${customerId}`);
      const data = await res.json();
      setOrders(data);
      if (data.length === 0) {
        setMessage("No orders found.");
      } else {
        setMessage("");
      }
    } catch (error) {
      console.error("Failed to fetch customer orders:", error);
      setMessage("Error fetching customer orders.");
    }
  };

  return (
    <div>
      <h2>Fetch Customer Orders</h2>
      <input
        type="text"
        placeholder="Enter Customer ID"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
      />
      <button onClick={handleFetchOrders}>Fetch Orders</button>
      {message && <p>{message}</p>}
      <ul>
        {orders.map(order => (
          <li key={order.order_id}>
            Order ID: {order.order_id}, Status: {order.order_status}, Product: {order.product_category_name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CustomerOrdersComponent;
