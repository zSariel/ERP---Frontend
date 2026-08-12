import { useEffect, useState } from "react";

import {
  createFinancialAccount,
  deleteFinancialAccount,
  getFinancialAccounts,
  updateFinancialAccount,
  updateFinancialAccountStatus,
} from "../services/financialAccountService";

import PageHeader from "../components/PageHeader/PageHeader";
import Button from "../components/Button/Button";
import StatCard from "../components/StatCard/StatCard";
import SearchBar from "../components/SearchBar/SearchBar";
import DataTable from "../components/DataTable/DataTable";
import Modal from "../components/Modal/Modal";
import FormGrid from "../components/FormGrid/FormGrid";
import StatusBadge from "../components/StatusBadge/StatusBadge";
import "./ContasFinanceiras.css";

const emptyForm = {
  name: "",
  bank: "",
  agency: "",
  account_number: "",
  account_type: "conta_corrente",
  initial_balance: "",
  active: true,
  note: "",
};

function ContasFinanceiras() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadAccounts() {
    try {
      setLoading(true);

      const response = await getFinancialAccounts();

      setAccounts(response.data || []);
    } catch (error) {
      console.error(
        "Erro ao carregar contas financeiras:",
        error
      );

      alert(
        error.response?.data?.error ||
          "Erro ao carregar contas financeiras."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
  function getReceivedAmount(account) {
  return Number(account.received_amount || 0);
}

function getPaidAmount(account) {
  return Number(account.paid_amount || 0);
}

function getCurrentBalance(account) {
  const backendBalance = Number(account.current_balance);

  if (Number.isFinite(backendBalance)) {
    return backendBalance;
  }

  const initialBalance = Number(
    account.initial_balance || 0
  );

  return (
    initialBalance +
    getReceivedAmount(account) -
    getPaidAmount(account)
  );
}

  function openNewModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(account) {
    setEditingId(account.id);

    setForm({
      name: account.name || "",
      bank: account.bank || "",
      agency: account.agency || "",
      account_number: account.account_number || "",
      account_type:
        account.account_type || "conta_corrente",
      initial_balance: account.initial_balance || "",
      active: account.active !== false,
      note: account.note || "",
    });

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("O nome da conta é obrigatório.");
      return;
    }

    if (
      form.initial_balance !== "" &&
      !Number.isFinite(Number(form.initial_balance))
    ) {
      alert("Informe um saldo inicial válido.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      bank: form.bank.trim() || null,
      agency: form.agency.trim() || null,
      account_number:
        form.account_number.trim() || null,
      account_type: form.account_type,
      initial_balance: Number(
        form.initial_balance || 0
      ),
      active: Boolean(form.active),
      note: form.note.trim() || null,
    };

    try {
      setLoading(true);

      if (editingId) {
        await updateFinancialAccount(
          editingId,
          payload
        );

        alert("Conta financeira atualizada!");
      } else {
        await createFinancialAccount(payload);

        alert("Conta financeira criada!");
      }

      closeModal();
      await loadAccounts();
    } catch (error) {
      console.error(
        "Erro ao salvar conta financeira:",
        error
      );

      alert(
        error.response?.data?.error ||
          "Erro ao salvar conta financeira."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(account) {
    const newStatus = !account.active;

    const confirmed = window.confirm(
      newStatus
        ? `Deseja ativar a conta ${account.name}?`
        : `Deseja desativar a conta ${account.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await updateFinancialAccountStatus(
        account.id,
        newStatus
      );

      await loadAccounts();
    } catch (error) {
      console.error(
        "Erro ao alterar status da conta:",
        error
      );

      alert(
        error.response?.data?.error ||
          "Erro ao alterar o status da conta."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(account) {
    const confirmed = window.confirm(
      `Deseja excluir a conta ${account.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await deleteFinancialAccount(account.id);
      await loadAccounts();

      alert("Conta financeira excluída.");
    } catch (error) {
      console.error(
        "Erro ao excluir conta financeira:",
        error
      );

      alert(
        error.response?.data?.error ||
          "Não foi possível excluir a conta financeira."
      );
    } finally {
      setLoading(false);
    }
  }

  const accountTypeLabels = {
    conta_corrente: "Conta corrente",
    conta_poupanca: "Conta poupança",
    caixa: "Caixa",
  };

  const filteredAccounts = accounts.filter(
    (account) => {
      const searchableText = [
        account.code,
        account.name,
        account.bank,
        account.agency,
        account.account_number,
        accountTypeLabels[account.account_type],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        search.toLowerCase()
      );
    }
  );

  const activeAccounts = accounts.filter(
    (account) => account.active
  ).length;

  const inactiveAccounts = accounts.filter(
    (account) => !account.active
  ).length;

  const totalReceived = accounts.reduce(
    (total, account) =>
      total + getReceivedAmount(account),
    0
  );

  const totalPaid = accounts.reduce(
    (total, account) =>
      total + getPaidAmount(account),
    0
  );

  const totalCurrentBalance = accounts.reduce(
    (total, account) =>
      total + getCurrentBalance(account),
    0
  );

  const columns = [
    {
      key: "code",
      label: "Código",
      render: (account) => (
        <strong>{account.code || "-"}</strong>
      ),
    },
    {
      key: "name",
      label: "Conta",
      render: (account) => (
        <div>
          <strong>{account.name}</strong>

          <small className="financial-account-subtitle">
            {account.bank || "Sem banco informado"}
          </small>
        </div>
      ),
    },
    {
      key: "account_type",
      label: "Tipo",
      render: (account) =>
        accountTypeLabels[account.account_type] ||
        account.account_type,
    },
    {
      key: "agency",
      label: "Agência",
      render: (account) => account.agency || "-",
    },
    {
      key: "account_number",
      label: "Conta bancária",
      render: (account) =>
        account.account_number || "-",
    },
    {
      key: "initial_balance",
      label: "Saldo inicial",
      render: (account) =>
        formatCurrency(account.initial_balance),
    },
    {
      key: "received_amount",
      label: "Recebido",
      render: (account) => (
        <strong>
          {formatCurrency(getReceivedAmount(account))}
        </strong>
      ),
    },
    {
      key: "paid_amount",
      label: "Pago",
      render: (account) => (
        <strong>
          {formatCurrency(getPaidAmount(account))}
        </strong>
      ),
    },
    {
      key: "current_balance",
      label: "Saldo atual",
      render: (account) => (
        <strong>
          {formatCurrency(getCurrentBalance(account))}
        </strong>
      ),
    },
    {
      key: "active",
      label: "Status",
      render: (account) => (
        <StatusBadge
          type={account.active ? "success" : "danger"}
        >
          {account.active ? "Ativa" : "Inativa"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      label: "Ações",
      render: (account) => (
        <div className="financial-account-actions">
          <button
            type="button"
            className="financial-account-button edit"
            onClick={() => openEditModal(account)}
          >
            Editar
          </button>

          <button
            type="button"
            className={
              account.active
                ? "financial-account-button deactivate"
                : "financial-account-button activate"
            }
            onClick={() => handleStatus(account)}
          >
            {account.active ? "Desativar" : "Ativar"}
          </button>

          <button
            type="button"
            className="financial-account-button delete"
            onClick={() => handleDelete(account)}
          >
            Excluir
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Contas Financeiras"
        subtitle="Cadastre contas bancárias e caixas utilizados nas movimentações."
      >
        <Button onClick={openNewModal}>
          + Nova Conta
        </Button>
      </PageHeader>

      <div className="financial-account-stats">
        <StatCard
          label="Total de contas"
          value={accounts.length}
        />

        <StatCard
          label="Contas ativas"
          value={activeAccounts}
        />

        <StatCard
          label="Contas inativas"
          value={inactiveAccounts}
        />

        <StatCard
          label="Total recebido"
          value={formatCurrency(totalReceived)}
        />

        <StatCard
          label="Total pago"
          value={formatCurrency(totalPaid)}
        />

        <StatCard
          label="Saldo atual"
          value={formatCurrency(totalCurrentBalance)}
        />
      </div>

      <div className="financial-account-toolbar">
        <div>
          <h2>Contas cadastradas</h2>

          <p>
            Contas disponíveis para recebimentos e
            pagamentos.
          </p>
        </div>

        <SearchBar
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Pesquisar por nome, banco, agência ou conta..."
        />
      </div>

      {loading && accounts.length === 0 ? (
        <div className="financial-account-loading">
          Carregando contas financeiras...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredAccounts}
          emptyMessage="Nenhuma conta financeira encontrada."
        />
      )}

      <Modal
        title={
          editingId
            ? "Editar Conta Financeira"
            : "Nova Conta Financeira"
        }
        isOpen={modalOpen}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit}>
          <FormGrid>
            <input
              name="name"
              placeholder="Nome da conta *"
              value={form.name}
              onChange={handleChange}
            />

            <input
              name="bank"
              placeholder="Banco"
              value={form.bank}
              onChange={handleChange}
            />

            <input
              name="agency"
              placeholder="Agência"
              value={form.agency}
              onChange={handleChange}
            />

            <input
              name="account_number"
              placeholder="Número da conta"
              value={form.account_number}
              onChange={handleChange}
            />

            <select
              name="account_type"
              value={form.account_type}
              onChange={handleChange}
            >
              <option value="conta_corrente">
                Conta corrente
              </option>

              <option value="conta_poupanca">
                Conta poupança
              </option>

              <option value="caixa">
                Caixa
              </option>
            </select>

            <input
              type="number"
              name="initial_balance"
              placeholder="Saldo inicial"
              step="0.01"
              value={form.initial_balance}
              onChange={handleChange}
            />
          </FormGrid>

          <label className="financial-account-checkbox">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
            />

            Conta ativa
          </label>

          <textarea
            className="financial-account-note"
            name="note"
            placeholder="Observações"
            value={form.note}
            onChange={handleChange}
          />

          <div className="financial-account-modal-actions">
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

export default ContasFinanceiras;