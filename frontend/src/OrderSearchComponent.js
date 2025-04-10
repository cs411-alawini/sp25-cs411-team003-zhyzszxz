import React, { useState } from 'react';

function OrderSearchComponent() {
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);

  const handleSearchOrders = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/search-orders?keyword=${encodeURIComponent(orderSearchTerm)}`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  return (
    <div>
      <h2>Search Orders</h2>
      <input
        type="text"
        placeholder="Search by Order ID or Customer ID"
        value={orderSearchTerm}
        onChange={(e) => setOrderSearchTerm(e.target.value)}
      />
      <button onClick={handleSearchOrders}>Search Orders</button>

      <h3>Order Results</h3>
      <ul>
        {orders.map(order => (
          <li key={order.order_id}>
            <strong>{order.order_id}</strong> - {order.customer_id} ({order.order_status})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OrderSearchComponent;
