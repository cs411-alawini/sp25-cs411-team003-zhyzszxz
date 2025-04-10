import React, { useState, useEffect } from 'react';

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

function App() {
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

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products');
      const data = await res.json();
      const enhanced = data.map((item) => ({
        ...item,
        title: localStorage.getItem(item.order_id) || ''
      }));
      setProducts(enhanced);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    console.log("Submitted:", result);

    if (result.message === "Product and order item added successfully") {
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
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const getMatchScore = (product, query) => {
    if (!query) return 0;
    const name = product.title?.toLowerCase() || product.name?.toLowerCase() || '';
    const q = query.toLowerCase();
    if (name === q) return 3;
    if (name.startsWith(q)) return 2;
    if (name.includes(q)) return 1;
    return 0;
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>Inventory Dashboard</h1>

      <form onSubmit={handleSubmit}>
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Product Name (visual only)"
          required
        />
        <label>Category:</label>
        <select
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          {VALID_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          placeholder="Quantity"
          required
        />
        <input
          name="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
          placeholder="Price"
          required
        />
        <input
          name="order_id"
          value={formData.order_id}
          onChange={handleChange}
          placeholder="Order ID (UUID)"
          required
        />
        <input
          name="seller_id"
          value={formData.seller_id}
          onChange={handleChange}
          placeholder="Seller ID"
          required
        />
        <button type="submit">Add Product</button>
      </form>

      <h2>Search Products</h2>
      <input
        type="text"
        placeholder="Search by product name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem' }}
      />

      <h2>Product List</h2>
      <ul>
        {products
          .map((p) => ({
            ...p,
            matchScore: getMatchScore(p, searchTerm.trim())
          }))
          .filter((p) => p.matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 10)
          .map((p, idx) => (
            <li key={p.id + '-' + idx} style={{ marginBottom: '1rem' }}>
              <strong>{p.title || p.name}</strong> ({p.name})<br />
              {p.quantity} units @ ${p.price ?? "N/A"} <br />
              <em>Order ID:</em> {p.order_id ?? "N/A"} <br />
              <em>Seller ID:</em> {p.seller_id ?? "N/A"}
            </li>
          ))}
      </ul>
    </div>
  );
}

export default App;
