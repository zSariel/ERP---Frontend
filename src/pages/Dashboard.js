import { useCallback, useEffect, useState } from "react";

import { getFinancialAccounts } from "../services/financialAccountService";
import {
  getReceivables,
  getReceivablesSummary,
} from "../services/receivableService";
import {
  getPayables,
  getPayablesSummary,
} from "../services/payableService";
import { getClients } from "../services/clientService";

import "./Dashboard.css";

const initialSummary = {
  currentBalance: 0,
  receivedAmount: 0,
  paidAmount: 0,
  receivableAmount: 0,
  payableAmount: 0,
  projectedBalance: 0,
  overdueReceivables: 0,
  overduePayables: 0,
  clients: 0,
};

function getCollection(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  return [];
}

function getClientCount(responseData) {
  if (Array.isArray(responseData)) {
    return responseData.length;
  }

  if (Number.isFinite(Number(responseData?.pagination?.total))) {
    return Number(responseData.pagination.total);
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data.length;
  }

  return 0;
}

function buildRecentEntries(receivables, payables) {
  const revenueEntries = receivables.map((item) => ({
    id: `receivable-${item.id}`,
    numericId: Number(item.id || 0),
    type: "receita",
    code: item.code || "-",
    description: item.description || "Receita",
    date: item.issue_date || item.first_due_date || "",
    amount: Number(item.total_amount || 0),
    status: item.status || "pendente",
  }));

  const expenseEntries = payables.map((item) => ({
    id: `payable-${item.id}`,
    numericId: Number(item.id || 0),
    type: "despesa",
    code: item.code || "-",
    description: item.description || "Despesa",
    date:
      item.issue_date ||
      item.competence_date ||
      item.first_due_date ||
      "",
    amount: Number(item.total_amount || 0),
    status: item.status || "pendente",
  }));

  return [...revenueEntries, ...expenseEntries]
    .sort((a, b) => {
      const dateComparison = String(b.date || "").localeCompare(
        String(a.date || "")
      );

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return b.numericId - a.numericId;
    })
    .slice(0, 6);
}

function Dashboard() {
  const [summary, setSummary] = useState(initialSummary);
  const [accounts, setAccounts] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    const [year, month, day] = String(value).split("-");

    if (!year || !month || !day) {
      return value;
    }

    return `${day}/${month}/${year}`;
  }

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        financialAccountsResponse,
        receivablesSummaryResponse,
        payablesSummaryResponse,
        clientsResponse,
        receivablesResponse,
        payablesResponse,
      ] = await Promise.all([
        getFinancialAccounts(),
        getReceivablesSummary(),
        getPayablesSummary(),
        getClients(),
        getReceivables({ page: 1, limit: 5 }),
        getPayables({ page: 1, limit: 5 }),
      ]);

      const loadedAccounts = Array.isArray(
        financialAccountsResponse.data
      )
        ? financialAccountsResponse.data
        : [];

      const receivablesSummary =
        receivablesSummaryResponse.data || {};
      const payablesSummary = payablesSummaryResponse.data || {};

      const currentBalance = loadedAccounts.reduce(
        (total, account) =>
          total + Number(account.current_balance || 0),
        0
      );

      const receivedAmount = Number(
        receivablesSummary.received_amount || 0
      );
      const paidAmount = Number(payablesSummary.paid_amount || 0);
      const receivableAmount = Number(
        receivablesSummary.remaining_amount || 0
      );
      const payableAmount = Number(
        payablesSummary.remaining_amount || 0
      );

      const projectedBalance =
        currentBalance + receivableAmount - payableAmount;

      const receivables = getCollection(receivablesResponse.data);
      const payables = getCollection(payablesResponse.data);

      setAccounts(loadedAccounts);
      setRecentEntries(buildRecentEntries(receivables, payables));

      setSummary({
        currentBalance,
        receivedAmount,
        paidAmount,
        receivableAmount,
        payableAmount,
        projectedBalance,
        overdueReceivables: Number(
          receivablesSummary.overdue_installments || 0
        ),
        overduePayables: Number(
          payablesSummary.overdue_installments || 0
        ),
        clients: getClientCount(clientsResponse.data),
      });
    } catch (dashboardError) {
      console.error("Erro ao carregar dashboard:", dashboardError);

      setError(
        dashboardError.response?.data?.error ||
          "Não foi possível carregar os dados do dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);


  const realizedResult =
    summary.receivedAmount - summary.paidAmount;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumo geral do seu controle financeiro.</p>
        </div>

        <button
          type="button"
          className="dashboard-refresh-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          <span>{error}</span>

          <button type="button" onClick={loadDashboard}>
            Tentar novamente
          </button>
        </div>
      )}

      <div className="cards dashboard-cards">
        <div className="card">
          <span>Saldo atual</span>
          <strong>{formatCurrency(summary.currentBalance)}</strong>
          <small>Dinheiro disponível nas contas</small>
        </div>

        <div className="card">
          <span>A receber</span>
          <strong>{formatCurrency(summary.receivableAmount)}</strong>
          <small>
            {summary.overdueReceivables} parcela(s) vencida(s)
          </small>
        </div>

        <div className="card">
          <span>A pagar</span>
          <strong>{formatCurrency(summary.payableAmount)}</strong>
          <small>
            {summary.overduePayables} parcela(s) vencida(s)
          </small>
        </div>

        <div className="card dashboard-projected-card">
          <span>Saldo projetado</span>
          <strong>{formatCurrency(summary.projectedBalance)}</strong>
          <small>Saldo atual + a receber - a pagar</small>
        </div>

        <div className="card">
          <span>Total recebido</span>
          <strong>{formatCurrency(summary.receivedAmount)}</strong>
          <small>Recebimentos confirmados</small>
        </div>

        <div className="card">
          <span>Total pago</span>
          <strong>{formatCurrency(summary.paidAmount)}</strong>
          <small>Pagamentos confirmados</small>
        </div>

        <div className="card">
          <span>Clientes</span>
          <strong>{summary.clients}</strong>
          <small>Clientes cadastrados</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Recebimentos x Pagamentos</h2>
              <p>Movimentações financeiras confirmadas.</p>
            </div>
          </div>

          <div className="dashboard-financial-summary">
            <div className="dashboard-summary-row">
              <span>Total recebido</span>
              <strong className="dashboard-positive">
                {formatCurrency(summary.receivedAmount)}
              </strong>
            </div>

            <div className="dashboard-summary-row">
              <span>Total pago</span>
              <strong className="dashboard-negative">
                {formatCurrency(summary.paidAmount)}
              </strong>
            </div>

            <div className="dashboard-summary-row dashboard-summary-total">
              <span>Resultado das movimentações</span>
              <strong
                className={
                  realizedResult >= 0
                    ? "dashboard-positive"
                    : "dashboard-negative"
                }
              >
                {formatCurrency(realizedResult)}
              </strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Contas financeiras</h2>
              <p>Saldo atual por conta cadastrada.</p>
            </div>
          </div>

          {accounts.length === 0 ? (
            <p className="dashboard-empty">
              Nenhuma conta financeira cadastrada.
            </p>
          ) : (
            <div className="dashboard-account-list">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="dashboard-account-row"
                >
                  <div>
                    <strong>{account.name}</strong>
                    <small>
                      {account.code || "Sem código"}
                      {account.bank ? ` · ${account.bank}` : ""}
                    </small>
                  </div>

                  <strong>
                    {formatCurrency(account.current_balance)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="panel dashboard-recent-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2>Últimos lançamentos</h2>
            <p>Contas a receber e a pagar mais recentes.</p>
          </div>
        </div>

        {recentEntries.length === 0 ? (
          <p className="dashboard-empty">
            Nenhum lançamento cadastrado ainda.
          </p>
        ) : (
          <div className="dashboard-recent-list">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="dashboard-recent-row">
                <div className="dashboard-recent-main">
                  <span
                    className={`dashboard-entry-type ${entry.type}`}
                  >
                    {entry.type === "receita"
                      ? "Receita"
                      : "Despesa"}
                  </span>

                  <div>
                    <strong>{entry.description}</strong>
                    <small>
                      {entry.code} · {formatDate(entry.date)} ·{" "}
                      {entry.status}
                    </small>
                  </div>
                </div>

                <strong
                  className={
                    entry.type === "receita"
                      ? "dashboard-positive"
                      : "dashboard-negative"
                  }
                >
                  {entry.type === "receita" ? "+ " : "- "}
                  {formatCurrency(entry.amount)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
