// src/OrderSearchComponent.js
import React, { useState } from 'react';

export default function OrderSearchComponent() {
  const [term,     setTerm]     = useState('');
  const [orders,   setOrders]   = useState([]);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const pageSize               = 10;

  const fetchOrders = async (pg=1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:5000/api/search-orders`
        + `?keyword=${encodeURIComponent(term)}`
        + `&page=${pg}&page_size=${pageSize}`
      );
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();
      setOrders(json.data);
      setPage(json.page);
      setTotal(json.total_pages);
    } catch (e) {
      console.error(e);
      setError('Error loading orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const onSearch = () => {
    if (term.trim() === '') {
      setOrders([]);
      setPage(1);
      setTotal(1);
    } else {
      fetchOrders(1);
    }
  };

  const onPrev = () => page>1 && fetchOrders(page-1);
  const onNext = () => page<total && fetchOrders(page+1);

  return (
    <div style={{ marginTop:40 }}>
      <h2>Search Orders</h2>
      <input
        value={term}
        onChange={e => setTerm(e.target.value)}
        placeholder="Type to search by Order or Customer ID"
        style={{ width:'100%', padding:'0.5rem', marginBottom:'0.5rem' }}
      />
      <button onClick={onSearch}>Search</button>

      {term.trim()==='' ? (
        <p style={{ textAlign:'center' }}>Enter a term to search orders.</p>
      ) : loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p style={{ color:'red', textAlign:'center' }}>{error}</p>
      ) : orders.length===0 ? (
        <p style={{ textAlign:'center' }}>No orders found.</p>
      ) : (
        <>
          <h3>Results (page {page} of {total})</h3>
          <ul style={{ listStyle:'none', padding:0 }}>
            {orders.map(o=>(
              <li key={o.order_id}
                  style={{ margin:'8px 0', padding:10, background:'#f9f9f9', border:'1px solid #ddd', borderRadius:5 }}>
                <strong>{o.order_id}</strong> – {o.customer_id} ({o.order_status})
              </li>
            ))}
          </ul>
          <div style={{ textAlign:'center', marginTop:12 }}>
            <button onClick={onPrev} disabled={page<=1}>Prev</button>
            <button onClick={onNext} disabled={page>=total} style={{ marginLeft:8 }}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
