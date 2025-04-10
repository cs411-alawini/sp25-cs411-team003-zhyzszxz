import React, { useState } from 'react';

function DeleteOrderComponent() {
  const [orderIdToDelete, setOrderIdToDelete] = useState('');
  const [message, setMessage] = useState('');

  const handleDelete = async () => {
    if (!orderIdToDelete) {
      setMessage("Please enter an Order ID to delete.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/delete-order/${orderIdToDelete}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Order ${orderIdToDelete} deleted successfully.`);
      } else {
        setMessage(`❌ Failed to delete order: ${data.message}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      setMessage("❌ Error deleting order.");
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>Delete Order</h2>
      <input
        type="text"
        placeholder="Enter Order ID to delete"
        value={orderIdToDelete}
        onChange={(e) => setOrderIdToDelete(e.target.value)}
        style={{ marginRight: '1rem', padding: '0.5rem' }}
      />
      <button onClick={handleDelete}>Delete</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default DeleteOrderComponent;
