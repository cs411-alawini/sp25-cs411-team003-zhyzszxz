import React, { useState } from 'react';

const InsertAdvancedOrderComponent = () => {
  const [advancedOrder, setAdvancedOrder] = useState({
    order_id: '',
    customer_id: '',
    order_status: '',
    product_id: '',
    seller_id: '',
    price: '',
    freight_value: ''
  });

  const handleAdvancedOrderChange = e => {
    setAdvancedOrder({ ...advancedOrder, [e.target.name]: e.target.value });
  };

  const handleAdvancedOrderSubmit = async e => {
    e.preventDefault();
    const orderData = {
      order_id: advancedOrder.order_id,
      customer_id: advancedOrder.customer_id,
      order_status: advancedOrder.order_status,
      items: [
        {
          product_id: advancedOrder.product_id,
          seller_id: advancedOrder.seller_id,
          price: parseFloat(advancedOrder.price),
          freight_value: parseFloat(advancedOrder.freight_value)
        }
      ]
    };

    try {
      const res = await fetch('http://localhost:5000/api/insert-order-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const result = await res.json();
      alert(result.message || 'Order processed successfully');
      setAdvancedOrder({
        order_id: '',
        customer_id: '',
        order_status: '',
        product_id: '',
        seller_id: '',
        price: '',
        freight_value: ''
      });
    } catch (err) {
      console.error('Transaction failed:', err);
      alert('Transaction failed');
    }
  };

  return (
    <div>
      <h2>Insert Advanced Order</h2>
      <form onSubmit={handleAdvancedOrderSubmit} style={{ marginBottom: '1rem' }}>
        <input
          name="order_id"
          value={advancedOrder.order_id}
          onChange={handleAdvancedOrderChange}
          placeholder="Order ID"
          required
        />
        <input
          name="customer_id"
          value={advancedOrder.customer_id}
          onChange={handleAdvancedOrderChange}
          placeholder="Customer ID"
          required
        />
        <input
          name="order_status"
          value={advancedOrder.order_status}
          onChange={handleAdvancedOrderChange}
          placeholder="Order Status"
          required
        />
        <input
          name="product_id"
          value={advancedOrder.product_id}
          onChange={handleAdvancedOrderChange}
          placeholder="Product ID"
          required
        />
        <input
          name="seller_id"
          value={advancedOrder.seller_id}
          onChange={handleAdvancedOrderChange}
          placeholder="Seller ID"
          required
        />
        <input
          name="price"
          type="number"
          step="0.01"
          value={advancedOrder.price}
          onChange={handleAdvancedOrderChange}
          placeholder="Price"
          required
        />
        <input
          name="freight_value"
          type="number"
          step="0.01"
          value={advancedOrder.freight_value}
          onChange={handleAdvancedOrderChange}
          placeholder="Freight Value"
          required
        />
        <button type="submit">Submit Advanced Order</button>
      </form>
    </div>
  );
};

export default InsertAdvancedOrderComponent;
