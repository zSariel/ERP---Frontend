import { useEffect, useState } from "react";

import {
  getCostCenters,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter,
} from "../services/costCenterService";

import { getClients } from "../services/clientService";
import { getReceivables } from "../services/receivableService";

import PageHeader from "../components/PageHeader/PageHeader";
import Button from "../components/Button/Button";
import StatCard from "../components/StatCard/StatCard";
import SearchBar from "../components/SearchBar/SearchBar";
import DataTable from "../components/DataTable/DataTable";
import Modal from "../components/Modal/Modal";
import FormGrid from "../components/FormGrid/FormGrid";
import StatusBadge from "../components/StatusBadge/StatusBadge";
import ActionButtons from "../components/ActionButtons/ActionButtons";

import "./CentrosCusto.css";

const emptyForm = {
  name: "",
  reference: "",
  client_id: "",
  cost_center: "",
  status: "planejado",
  start_date: "",
  end_date: "",
  budget: "",
  note: "",
};

function CentrosCusto() {
  const [costCenters, setCostCenters] = useState([]);
  const [clients, setClients] = useState([]);
  const [receivables, setReceivables] = useState([]);

  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      setLoading(true);

      const [
        costCentersResponse,
        clientsResponse,
        receivablesResponse,
      ] = await Promise.all([
        getCostCenters(),
        getClients(),
        getReceivables(),
      ]);

      setCostCenters(costCentersResponse.data || []);
      setClients(clientsResponse.data || []);
      setReceivables(receivablesResponse.data || []);
    } catch (error) {
      console.error("Erro ao carregar centros de custo:", error);

      alert(
        error.response?.data?.error ||
          "Erro ao carregar os centros de custo."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function getCostCenterFinancials(costCenterId) {
    const relatedReceivables = receivables.filter(
      (receivable) =>
        Number(receivable.project_id) === Number(costCenterId) &&
        receivable.status !== "cancelado"
    );

    const totalLaunched = relatedReceivables.reduce(
      (total, receivable) =>
        total + Number(receivable.total_amount || 0),
      0
    );

    const totalReceived = relatedReceivables.reduce(
      (total, receivable) =>
        total + Number(receivable.received_amount || 0),
      0
    );

    const totalRemaining = relatedReceivables.reduce(
      (total, receivable) =>
        total + Number(receivable.remaining_amount || 0),
      0
    );

    return {
      totalLaunched,
      totalReceived,
      totalRemaining,
    };
  }

  const costCentersWithFinancials = costCenters.map(
    (costCenter) => {
      const financials = getCostCenterFinancials(
        costCenter.id
      );

      return {
        ...costCenter,
        total_launched: financials.totalLaunched,
        total_received: financials.totalReceived,
        total_remaining: financials.totalRemaining,
      };
    }
  );

  function openNewModal() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditingId(item.id);

    setForm({
      name: item.name || "",
      reference: item.reference || "",
      client_id: item.client_id || "",
      cost_center: item.cost_center || "",
      status: item.status || "planejado",
      start_date: item.start_date || "",
      end_date: item.end_date || "",
      budget: item.budget || "",
      note: item.note || "",
    });

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Nome é obrigatório.");
      return;
    }

    if (
      form.budget !== "" &&
      Number(form.budget) < 0
    ) {
      alert("O valor contratado não pode ser negativo.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      reference: form.reference.trim() || null,
      client_id: form.client_id
        ? Number(form.client_id)
        : null,
      cost_center: form.cost_center.trim() || null,
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,

      /*
       * Mantemos o nome "budget" porque é o campo
       * utilizado atualmente pelo seu backend.
       */
      budget: Number(form.budget || 0),

      note: form.note.trim() || null,
    };

    try {
      setLoading(true);

      if (editingId) {
        await updateCostCenter(editingId, payload);
        alert("Centro de custo atualizado!");
      } else {
        await createCostCenter(payload);
        alert("Centro de custo criado!");
      }

      closeModal();
      await loadData();
    } catch (error) {
      console.error("Erro ao salvar centro de custo:", error);

      alert(
        error.response?.data?.error ||
          "Erro ao salvar o centro de custo."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm(
      "Deseja excluir este centro de custo?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setLoading(true);

      await deleteCostCenter(id);
      await loadData();

      alert("Centro de custo excluído.");
    } catch (error) {
      console.error("Erro ao excluir centro de custo:", error);

      alert(
        error.response?.data?.error ||
          "Não foi possível excluir o centro de custo."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredCostCenters =
    costCentersWithFinancials.filter((item) => {
      const text = [
        item.code,
        item.name,
        item.reference,
        item.client?.name,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(search.toLowerCase());
    });

  const totalContracted =
    costCentersWithFinancials.reduce(
      (total, item) =>
        total + Number(item.budget || 0),
      0
    );

  const totalLaunched =
    costCentersWithFinancials.reduce(
      (total, item) =>
        total + Number(item.total_launched || 0),
      0
    );

  const totalReceived =
    costCentersWithFinancials.reduce(
      (total, item) =>
        total + Number(item.total_received || 0),
      0
    );

  const totalRemaining =
    costCentersWithFinancials.reduce(
      (total, item) =>
        total + Number(item.total_remaining || 0),
      0
    );

  const statusMap = {
    planejado: {
      label: "Planejado",
      type: "info",
    },
    andamento: {
      label: "Em andamento",
      type: "success",
    },
    pausado: {
      label: "Pausado",
      type: "warning",
    },
    concluido: {
      label: "Concluído",
      type: "default",
    },
    cancelado: {
      label: "Cancelado",
      type: "danger",
    },
  };

  const columns = [
    {
      key: "code",
      label: "Código",
      render: (item) => (
        <strong>{item.code || "-"}</strong>
      ),
    },
    {
      key: "name",
      label: "Centro de Custo",
      render: (item) => (
        <div>
          <strong>{item.name}</strong>

          <br />

          <small>
            {item.reference || "Sem referência"}
          </small>
        </div>
      ),
    },
    {
      key: "client",
      label: "Cliente",
      render: (item) => item.client?.name || "-",
    },
    {
      key: "status",
      label: "Status",
      render: (item) => (
        <StatusBadge
          type={
            statusMap[item.status]?.type ||
            "default"
          }
        >
          {statusMap[item.status]?.label ||
            item.status}
        </StatusBadge>
      ),
    },
    {
      key: "budget",
      label: "Valor Contratado",
      render: (item) => (
        <strong>
          {formatCurrency(item.budget)}
        </strong>
      ),
    },
    {
      key: "total_launched",
      label: "Valor Lançado",
      render: (item) =>
        formatCurrency(item.total_launched),
    },
    {
      key: "total_received",
      label: "Recebido",
      render: (item) => (
        <strong>
          {formatCurrency(item.total_received)}
        </strong>
      ),
    },
    {
      key: "total_remaining",
      label: "A Receber",
      render: (item) =>
        formatCurrency(item.total_remaining),
    },
    {
      key: "actions",
      label: "Ações",
      render: (item) => (
        <ActionButtons
          onEdit={() => openEditModal(item)}
          onDelete={() => handleDelete(item.id)}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Centros de Custo"
        subtitle="Gerencie obras, contratos, setores e centros financeiros da empresa."
      >
        <Button onClick={openNewModal}>
          + Novo Centro
        </Button>
      </PageHeader>

      <div className="stats-grid">
        <StatCard
          label="Valor contratado"
          value={formatCurrency(totalContracted)}
        />

        <StatCard
          label="Valor lançado"
          value={formatCurrency(totalLaunched)}
        />

        <StatCard
          label="Valor recebido"
          value={formatCurrency(totalReceived)}
        />

        <StatCard
          label="Valor a receber"
          value={formatCurrency(totalRemaining)}
        />
      </div>

      <div className="table-toolbar">
        <div>
          <h2>Lista de centros de custo</h2>

          <p>
            Valores calculados pelas contas a receber
            vinculadas a cada centro.
          </p>
        </div>

        <SearchBar
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Pesquisar por código, nome, referência ou cliente..."
        />
      </div>

      {loading && costCenters.length === 0 ? (
        <div className="receivable-loading">
          Carregando centros de custo...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCostCenters}
          emptyMessage="Nenhum centro de custo encontrado."
        />
      )}

      <Modal
        title={
          editingId
            ? "Editar Centro de Custo"
            : "Novo Centro de Custo"
        }
        isOpen={modalOpen}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit}>
          <FormGrid>
            <input
              name="name"
              placeholder="Nome *"
              value={form.name}
              onChange={handleChange}
            />

            <input
              name="reference"
              placeholder="Referência / Contrato"
              value={form.reference}
              onChange={handleChange}
            />

            <select
              name="client_id"
              value={form.client_id}
              onChange={handleChange}
            >
              <option value="">
                Cliente vinculado
              </option>

              {clients.map((client) => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {client.name}
                </option>
              ))}
            </select>

            <input
              name="cost_center"
              placeholder="Centro de custo interno"
              value={form.cost_center}
              onChange={handleChange}
            />

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="planejado">
                Planejado
              </option>

              <option value="andamento">
                Em andamento
              </option>

              <option value="pausado">
                Pausado
              </option>

              <option value="concluido">
                Concluído
              </option>

              <option value="cancelado">
                Cancelado
              </option>
            </select>

            <div className="date-field">
              <label>Valor contratado</label>

              <input
                type="number"
                name="budget"
                placeholder="0,00"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={handleChange}
              />
            </div>

            <div className="date-field">
              <label>Data de início</label>

              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
              />
            </div>

            <div className="date-field">
              <label>Data de término</label>

              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
              />
            </div>
          </FormGrid>

          <textarea
            className="form-textarea"
            name="note"
            placeholder="Observação"
            value={form.note}
            onChange={handleChange}
          />

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Salvando..."
                : editingId
                  ? "Atualizar"
                  : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CentrosCusto;