import React, { useState, useEffect } from 'react';
import OrderSearchComponent from './OrderSearchComponent';
import DeleteOrderComponent from './DeleteOrderComponent';
import InsertOrderComponent from './InsertOrderComponent';
import UpdateOrderComponent from './UpdateOrderComponent';
import InsertAdvancedOrderComponent from './InsertAdvancedOrderComponent';
import CustomerOrdersComponent from './CustomerOrdersComponent';
import './App.css';

const VALID_CATEGORIES = [
  "agro_industria_e_comercio", "alimentos", "alimentos_bebidas", "artes", "artes_e_artesanato",
  "artigos_de_festas", "artigos_de_natal", "audio", "automotivo", "bebes", "bebidas",
  "beleza_saude", "brinquedos", "cama_mesa_banho", "casa_conforto", "casa_conforto_2",
  "casa_construcao", "cds_dvds_musicais", "cine_foto", "climatizacao", "consoles_games",
  "construcao_ferramentas_construcao", "construcao_ferramentas_ferramentas",
  "construcao_ferramentas_iluminacao", "construcao_ferramentas_jardim",
  "construcao_ferramentas_seguranca", "cool_stuff", "dvds_blu_ray", "eletrodomesticos",
  "eletrodomesticos_2", "eletronicos", "eletroportateis", "esporte_lazer",
  "fashion_bolsas_e_acessorios", "fashion_calcados", "fashion_esporte",
  "fashion_roupa_feminina", "fashion_roupa_infanto_juvenil", "fashion_roupa_masculina",
  "fashion_underwear_e_moda_praia", "ferramentas_jardim", "flores", "fraldas_higiene",
  "industria_comercio_e_negocios", "informatica_acessorios", "instrumentos_musicais",
  "la_cuisine", "livros_importados", "livros_interesse_geral", "livros_tecnicos",
  "malas_acessorios", "market_place", "moveis_colchao_e_estofado",
  "moveis_cozinha_area_de_servico_jantar_e_jardim", "moveis_decoracao",
  "moveis_escritorio", "moveis_quarto", "moveis_sala", "musica", "papelaria", "pcs",
  "perfumaria", "pet_shop", "portateis_casa_forno_e_cafe", "relogios_presentes",
  "seguros_e_servicos", "sinalizacao_e_seguranca", "tablets_impressao_imagem",
  "telefonia", "telefonia_fixa", "utilidades_domesticas"
];

export default function App() {
  const [currentView, setCurrentView] = useState('orders');
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    name: VALID_CATEGORIES[0],
    quantity: '',
    price: '',
    order_id: '',
    seller_id: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchId, setCustomerSearchId] = useState('');
  const [customerSummary, setCustomerSummary] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products');
      const data = await res.json();
      setProducts(data.map(item => ({
        ...item,
        title: localStorage.getItem(item.order_id) || ''
      })));
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchCustomerSummary = async (customerId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/customer-summary/${customerId}`);
      const data = await res.json();
      if (res.ok) {
        setCustomerSummary(data);
      } else {
        setCustomerSummary(null);
        alert(data.error || 'No summary found');
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      alert('Error fetching customer summary');
    }
  };

  const updateCustomerSummary = async (customerId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/update-customer-summary/${customerId}`, {
        method: 'POST'
      });
      const result = await res.json();
      alert(result.message);
    } catch (err) {
      console.error('Failed to update customer summary:', err);
      alert('Error updating summary');
    }
  };

  const handleChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          quantity: formData.quantity,
          price: formData.price,
          order_id: formData.order_id,
          seller_id: formData.seller_id
        })
      });
      const result = await res.json();
      if (result.message === 'Product and order item added successfully') {
        localStorage.setItem(formData.order_id, formData.title);
      }
      setFormData({
        title: '',
        name: VALID_CATEGORIES[0],
        quantity: '',
        price: '',
        order_id: '',
        seller_id: ''
      });
      fetchProducts();
    } catch (err) {
      console.error('Insert failed:', err);
    }
  };

  const filtered = searchTerm.trim()
    ? products.filter(p => {
        const hay = `${p.title || p.name} ${p.order_id} ${p.seller_id}`.toLowerCase();
        return hay.includes(searchTerm.toLowerCase());
      })
    : [];
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="app-container">
      <header className="header">
        <h1>Online Shop Management System</h1>
        <div className="nav-buttons">
          <button onClick={() => setCurrentView('orders')}>Manage Orders</button>
          <button onClick={() => setCurrentView('products')}>Manage Products</button>
          <button onClick={() => setCurrentView('customers')}>Manage Customers</button>
        </div>
      </header>

      {/* Orders Section */}
      {currentView === 'orders' && (
        <div className="card">
          <OrderSearchComponent />
          <InsertOrderComponent />
          <DeleteOrderComponent />
          <UpdateOrderComponent />
          <InsertAdvancedOrderComponent />
        </div>
      )}

      {/* Products Section */}
      {currentView === 'products' && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <input name="title" value={formData.title} onChange={handleChange} placeholder="Product Name (visual only)" required />
            <select name="name" value={formData.name} onChange={handleChange} required>
              {VALID_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="Quantity" required />
            <input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} placeholder="Price" required />
            <input name="order_id" value={formData.order_id} onChange={handleChange} placeholder="Order ID (UUID)" required />
            <input name="seller_id" value={formData.seller_id} onChange={handleChange} placeholder="Seller ID" required />
            <button type="submit">Add Product</button>
          </form>

          <h2>Search Products</h2>
          <input type="text" placeholder="Type to search by title, category, order ID or seller ID" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} />

          {searchTerm.trim() === '' ? (
            <p className="center-text">Enter a term to search products.</p>
          ) : filtered.length === 0 ? (
            <p className="center-text">No products found.</p>
          ) : (
            <>
              <ul>
                {paged.map((p, i) => (
                  <li key={`${p.id || p.order_id}-${i}`}>
                    <strong>{p.title || p.name}</strong> ({p.name})<br />
                    {p.quantity} units @ ${p.price ?? 'N/A'}<br />
                    <em>Order ID:</em> {p.order_id}<br />
                    <em>Seller ID:</em> {p.seller_id}
                  </li>
                ))}
              </ul>
              <div className="pagination">
                <button onClick={() => setPage(x => Math.max(x - 1, 1))} disabled={page <= 1}>Prev</button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(x => Math.min(x + 1, totalPages))} disabled={page >= totalPages}>Next</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Customers Section */}
      {currentView === 'customers' && (
        <div className="card">
          <h2>Customer Management</h2>
          <p>View customer orders and summary details below.</p>

          <h3>View Customer Orders</h3>
          <CustomerOrdersComponent />

          <h3>View Customer Summary</h3>
          <input
            type="text"
            placeholder="Enter Customer ID"
            value={customerSearchId}
            onChange={(e) => setCustomerSearchId(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={() => fetchCustomerSummary(customerSearchId)}>Show Summary</button>
            <button onClick={() => updateCustomerSummary(customerSearchId)}>Update Summary</button>
          </div>

          {customerSummary && (
            <div className="summary-card">
              <h4>Customer Summary</h4>
              <p><strong>Customer ID:</strong> {customerSummary.customer_id}</p>
              <p><strong>Total Orders:</strong> {customerSummary.total_orders}</p>
              <p><strong>Total Spent:</strong> ${customerSummary.total_spent}</p>
              <p><strong>Last Updated:</strong> {new Date(customerSummary.last_updated).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
