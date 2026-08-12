import { useEffect, useState } from "react";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "../services/supplierService";
import "./Fornecedores.css";

function Fornecedores() {
  const emptyForm = {
    name: "",
    document: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    note: "",
  };

  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadSuppliers() {
    try {
      const response = await getSuppliers();
      setSuppliers(response.data);
    } catch {
      alert("Erro ao carregar fornecedores.");
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  function openNewSupplierModal() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditSupplierModal(supplier) {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name || "",
      document: supplier.document || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      city: supplier.city || "",
      address: supplier.address || "",
      note: supplier.note || "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Nome é obrigatório.");
      return;
    }

    try {
      if (editingId) {
        await updateSupplier(editingId, form);
        alert("Fornecedor atualizado!");
      } else {
        await createSupplier(form);
        alert("Fornecedor cadastrado!");
      }

      closeModal();
      loadSuppliers();
    } catch {
      alert("Erro ao salvar fornecedor.");
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm("Deseja excluir este fornecedor?");
    if (!confirmDelete) return;

    try {
      await deleteSupplier(id);
      loadSuppliers();
    } catch {
      alert("Erro ao excluir fornecedor.");
    }
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    const text = `${supplier.name} ${supplier.email} ${supplier.phone} ${supplier.city}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const suppliersWithEmail = suppliers.filter((supplier) => supplier.email).length;
  const suppliersWithoutPhone = suppliers.filter((supplier) => !supplier.phone).length;

  return (
    <div className="clientes-page">
      <div className="clientes-top">
        <div>
          <h1>Fornecedores</h1>
          <p>Gerencie seus fornecedores cadastrados.</p>
        </div>

        <button className="new-client-button" onClick={openNewSupplierModal}>
          + Novo Fornecedor
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total de fornecedores</span>
          <strong>{suppliers.length}</strong>
        </div>

        <div className="stat-card">
          <span>Com email</span>
          <strong>{suppliersWithEmail}</strong>
        </div>

        <div className="stat-card">
          <span>Sem telefone</span>
          <strong>{suppliersWithoutPhone}</strong>
        </div>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <h2>Lista de fornecedores</h2>

          <input
            className="search-input"
            placeholder="Pesquisar fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Fornecedor</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>Cidade</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>
                  <strong>{supplier.name}</strong>
                  <small>{supplier.document || "Sem documento"}</small>
                </td>
                <td>{supplier.phone || "-"}</td>
                <td>{supplier.email || "-"}</td>
                <td>{supplier.city || "-"}</td>
                <td className="actions">
                  <button onClick={() => openEditSupplierModal(supplier)}>✏️</button>
                  <button onClick={() => handleDelete(supplier.id)}>🗑️</button>
                </td>
              </tr>
            ))}

            {filteredSuppliers.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-row">
                  Nenhum fornecedor encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingId ? "Editar fornecedor" : "Novo fornecedor"}</h2>
              <button onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-grid">
                <input name="name" placeholder="Nome *" value={form.name} onChange={handleChange} />
                <input name="document" placeholder="CPF/CNPJ" value={form.document} onChange={handleChange} />
                <input name="phone" placeholder="Telefone" value={form.phone} onChange={handleChange} />
                <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
                <input name="city" placeholder="Cidade" value={form.city} onChange={handleChange} />
                <input name="address" placeholder="Endereço" value={form.address} onChange={handleChange} />
              </div>

              <textarea name="note" placeholder="Observação" value={form.note} onChange={handleChange} />

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closeModal}>
                  Cancelar
                </button>

                <button type="submit" className="save-button">
                  {editingId ? "Atualizar" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Fornecedores;