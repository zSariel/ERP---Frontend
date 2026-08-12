import { useEffect, useState } from "react";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../services/categoryService";
import "./Categorias.css";

function Categorias() {
  const emptyForm = {
    name: "",
    type: "despesa",
    color: "#2563eb",
    icon: "tag",
    description: "",
    active: true,
  };

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadCategories() {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch {
      alert("Erro ao carregar categorias.");
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function openNewCategoryModal() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditCategoryModal(category) {
    setEditingId(category.id);

    setForm({
      name: category.name || "",
      type: category.type || "despesa",
      color: category.color || "#2563eb",
      icon: category.icon || "tag",
      description: category.description || "",
      active: category.active === true,
    });

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Nome é obrigatório.");
      return;
    }

    try {
      if (editingId) {
        await updateCategory(editingId, form);
        alert("Categoria atualizada!");
      } else {
        await createCategory(form);
        alert("Categoria cadastrada!");
      }

      closeModal();
      loadCategories();
    } catch {
      alert("Erro ao salvar categoria.");
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm("Deseja excluir esta categoria?");
    if (!confirmDelete) return;

    try {
      await deleteCategory(id);
      loadCategories();
    } catch {
      alert("Erro ao excluir categoria.");
    }
  }

  const filteredCategories = categories.filter((category) => {
    const text = `${category.name} ${category.type} ${category.description}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const incomeCategories = categories.filter((c) => c.type === "receita").length;
  const expenseCategories = categories.filter((c) => c.type === "despesa").length;
  const inactiveCategories = categories.filter((c) => !c.active).length;

  return (
    <div className="categorias-page">
      <div className="categorias-top">
        <div>
          <h1>Categorias</h1>
          <p>Configure categorias para receitas e despesas.</p>
        </div>

        <button className="new-category-button" onClick={openNewCategoryModal}>
          + Nova Categoria
        </button>
      </div>

      <div className="category-stats-grid">
        <div className="category-stat-card">
          <span>Total</span>
          <strong>{categories.length}</strong>
        </div>

        <div className="category-stat-card">
          <span>Receitas</span>
          <strong>{incomeCategories}</strong>
        </div>

        <div className="category-stat-card">
          <span>Despesas</span>
          <strong>{expenseCategories}</strong>
        </div>

        <div className="category-stat-card">
          <span>Inativas</span>
          <strong>{inactiveCategories}</strong>
        </div>
      </div>

      <div className="category-table-card">
        <div className="category-table-header">
          <h2>Lista de categorias</h2>

          <input
            className="category-search-input"
            placeholder="Pesquisar categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Tipo</th>
              <th>Cor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {filteredCategories.map((category) => (
              <tr key={category.id}>
                <td>
                  <strong>{category.icon} {category.name}</strong>
                  <small>{category.description || "Sem descrição"}</small>
                </td>

                <td>
                  <span className={`type-badge ${category.type}`}>
                    {category.type === "receita" ? "Receita" : "Despesa"}
                  </span>
                </td>

                <td>
                  <span
                    className="color-preview"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.color}
                </td>

                <td>
                  <span className={category.active ? "active-badge" : "inactive-badge"}>
                    {category.active ? "Ativa" : "Inativa"}
                  </span>
                </td>

                <td className="category-actions">
                  <button onClick={() => openEditCategoryModal(category)}>✏️</button>
                  <button onClick={() => handleDelete(category.id)}>🗑️</button>
                </td>
              </tr>
            ))}

            {filteredCategories.length === 0 && (
              <tr>
                <td colSpan="5" className="category-empty-row">
                  Nenhuma categoria encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="category-modal-overlay">
          <div className="category-modal">
            <div className="category-modal-header">
              <h2>{editingId ? "Editar categoria" : "Nova categoria"}</h2>
              <button onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="category-modal-grid">
                <input
                  name="name"
                  placeholder="Nome *"
                  value={form.name}
                  onChange={handleChange}
                />

                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="despesa">Despesa</option>
                  <option value="receita">Receita</option>
                </select>

                <input
                  name="color"
                  type="color"
                  value={form.color}
                  onChange={handleChange}
                />

              </div>

              <textarea
                name="description"
                placeholder="Descrição"
                value={form.description}
                onChange={handleChange}
              />

              <label className="active-checkbox">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                Categoria ativa
              </label>

              <div className="category-modal-actions">
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

export default Categorias;