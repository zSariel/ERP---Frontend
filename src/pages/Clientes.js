import { useEffect, useState } from "react";
import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
} from "../services/clientService";
import "./Clientes.css";

function Clientes() {
  const emptyForm = {
    name: "",
    document: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    note: "",
  };

  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadClients() {
    try {
      const response = await getClients();
      setClients(response.data);
    } catch {
      alert("Erro ao carregar clientes.");
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  function openNewClientModal() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditClientModal(client) {
    setEditingId(client.id);
    setForm({
      name: client.name || "",
      document: client.document || "",
      phone: client.phone || "",
      email: client.email || "",
      city: client.city || "",
      address: client.address || "",
      note: client.note || "",
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
        await updateClient(editingId, form);
        alert("Cliente atualizado!");
      } else {
        await createClient(form);
        alert("Cliente cadastrado!");
      }

      closeModal();
      loadClients();
    } catch {
      alert("Erro ao salvar cliente.");
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm("Deseja excluir este cliente?");
    if (!confirmDelete) return;

    try {
      await deleteClient(id);
      loadClients();
    } catch {
      alert("Erro ao excluir cliente.");
    }
  }

  const filteredClients = clients.filter((client) => {
    const text = `${client.name} ${client.email} ${client.phone} ${client.city}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const clientsWithEmail = clients.filter((client) => client.email).length;
  const clientsWithoutPhone = clients.filter((client) => !client.phone).length;

  return (
    <div className="clientes-page">
      <div className="clientes-top">
        <div>
          <h1>Clientes</h1>
          <p>Gerencie seus clientes cadastrados.</p>
        </div>

        <button className="new-client-button" onClick={openNewClientModal}>
          + Novo Cliente
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total de clientes</span>
          <strong>{clients.length}</strong>
        </div>

        <div className="stat-card">
          <span>Com email</span>
          <strong>{clientsWithEmail}</strong>
        </div>

        <div className="stat-card">
          <span>Sem telefone</span>
          <strong>{clientsWithoutPhone}</strong>
        </div>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <h2>Lista de clientes</h2>

          <input
            className="search-input"
            placeholder="Pesquisar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>Cidade</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td>
                  <strong>{client.name}</strong>
                  <small>{client.document || "Sem documento"}</small>
                </td>
                <td>{client.phone || "-"}</td>
                <td>{client.email || "-"}</td>
                <td>{client.city || "-"}</td>
                <td className="actions">
                  <button onClick={() => openEditClientModal(client)}>✏️</button>
                  <button onClick={() => handleDelete(client.id)}>🗑️</button>
                </td>
              </tr>
            ))}

            {filteredClients.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-row">
                  Nenhum cliente encontrado.
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
              <h2>{editingId ? "Editar cliente" : "Novo cliente"}</h2>
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

export default Clientes;