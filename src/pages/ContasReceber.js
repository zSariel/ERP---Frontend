import { useCallback, useEffect, useState } from "react";

import {
  bulkDeleteReceivables,
  bulkReceiveReceivables,
  bulkUpdateReceivableStatus,
  createReceivable,
  deleteReceivable,
  getReceivables,
  getReceivablesSummary,
  receiveInstallment,
  reverseReceivablePayment,
  updateReceivable,
  updateReceivableStatus,
} from "../services/receivableService";

import { getCostCenters } from "../services/costCenterService";
import { getClients } from "../services/clientService";
import { getCategories } from "../services/categoryService";
import { getFinancialAccounts } from "../services/financialAccountService";

import PageHeader from "../components/PageHeader/PageHeader";
import Button from "../components/Button/Button";
import StatCard from "../components/StatCard/StatCard";
import SearchBar from "../components/SearchBar/SearchBar";
import DataTable from "../components/DataTable/DataTable";
import Modal from "../components/Modal/Modal";
import FormGrid from "../components/FormGrid/FormGrid";
import StatusBadge from "../components/StatusBadge/StatusBadge";

import "./ContasReceber.css";

const emptyForm = {
  description: "",
  cost_center_id: "",
  client_id: "",
  category_id: "",
  total_amount: "",
  installments_count: 1,
  issue_date: "",
  first_due_date: "",
  note: "",
};

const emptyFilters = {
  status: "",
  cost_center_id: "",
  client_id: "",
  category_id: "",
  due_from: "",
  due_to: "",
  overdue_only: false,
};

function ContasReceber() {
  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const [receivables, setReceivables] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [financialAccounts, setFinancialAccounts] =
    useState([]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [selectedIds, setSelectedIds] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingReceivable, setEditingReceivable] =
    useState(null);

  const [receiptModalOpen, setReceiptModalOpen] =
    useState(false);

  const [selectedReceivable, setSelectedReceivable] =
    useState(null);

  const [receiptForm, setReceiptForm] = useState({
    installment_id: "",
    financial_account_id: "",
    amount: "",
    received_date: today,
    note: "",
  });

  const [bulkReceiptModalOpen, setBulkReceiptModalOpen] =
    useState(false);

  const [bulkReceiptDate, setBulkReceiptDate] =
    useState(today);

  const [
    bulkReceiptFinancialAccountId,
    setBulkReceiptFinancialAccountId,
  ] = useState("");

  const [bulkReceiptNote, setBulkReceiptNote] =
    useState("");

  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState({
    total_amount: 0,
    received_amount: 0,
    remaining_amount: 0,
    overdue_installments: 0,
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (filters.status) {
        params.status = filters.status;
      }

      if (filters.cost_center_id) {
        params.cost_center_id =
          filters.cost_center_id;
      }

      if (filters.client_id) {
        params.client_id = filters.client_id;
      }

      if (filters.category_id) {
        params.category_id =
          filters.category_id;
      }

      if (filters.due_from) {
        params.due_from = filters.due_from;
      }

      if (filters.due_to) {
        params.due_to = filters.due_to;
      }

      if (filters.overdue_only) {
        params.overdue_only = true;
      }

      const [
        receivablesResponse,
        summaryResponse,
      ] = await Promise.all([
        getReceivables(params),
        getReceivablesSummary(),
      ]);

      const loadedReceivables =
        receivablesResponse.data?.data || [];

      const loadedPagination =
        receivablesResponse.data?.pagination || {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        };

      setReceivables(loadedReceivables);
      setPagination(loadedPagination);

      setSummary(
        summaryResponse.data || {
          total_amount: 0,
          received_amount: 0,
          remaining_amount: 0,
          overdue_installments: 0,
        }
      );

      setSelectedIds((currentIds) =>
        currentIds.filter((id) =>
          loadedReceivables.some(
            (item) =>
              Number(item.id) === Number(id)
          )
        )
      );

      if (
        loadedPagination.totalPages > 0 &&
        page > loadedPagination.totalPages
      ) {
        setPage(loadedPagination.totalPages);
      }
    } catch (error) {
      console.error(
        "Erro ao carregar contas a receber:",
        error
      );

      alert(
        error.response?.data?.error ||
          "Erro ao carregar contas a receber."
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    debouncedSearch,
    filters,
  ]);

  useEffect(() => {
    async function loadReferenceData() {
      try {
        const [
          costCentersResponse,
          clientsResponse,
          categoriesResponse,
          financialAccountsResponse,
        ] = await Promise.all([
          getCostCenters(),
          getClients(),
          getCategories(),
          getFinancialAccounts(),
        ]);

        setCostCenters(
          costCentersResponse.data || []
        );

        setClients(
          (clientsResponse.data || []).filter(
            (client) =>
              client.active !== false &&
              client.active !== 0
          )
        );

        const incomeCategories = (
          categoriesResponse.data || []
        ).filter(
          (category) =>
            category.type === "receita" &&
            category.active !== false &&
            category.active !== 0
        );

        setCategories(incomeCategories);

        setFinancialAccounts(
          (
            financialAccountsResponse.data || []
          ).filter(
            (account) =>
              account.active !== false &&
              account.active !== 0
          )
        );
      } catch (error) {
        console.error(
          "Erro ao carregar dados auxiliares:",
          error
        );
      }
    }

    loadReferenceData();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  function formatDate(value) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
}

function isOverdue(date) {
  if (!date) return false;

  const today = new Date();
  const due = new Date(`${date}T00:00:00`);

  return due < today;
}

function getDaysOverdue(date) {
  if (!date) return 0;

  const today = new Date();
  const due = new Date(`${date}T00:00:00`);

  const diff = today - due;

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

  function getErrorMessage(
    error,
    fallbackMessage
  ) {
    const blocked =
      error.response?.data?.blocked || [];

    const blockedCodes = blocked
      .map((item) => item.code || item.id)
      .filter(Boolean)
      .join(", ");

    const baseMessage =
      error.response?.data?.error ||
      error.response?.data?.details ||
      error.message ||
      fallbackMessage;

    return blockedCodes
      ? `${baseMessage}\n\nRegistros bloqueados: ${blockedCodes}`
      : baseMessage;
  }

  function hasReceipts(receivable) {
    return Number(
      receivable.received_amount || 0
    ) > 0;
  }

  function getPendingInstallments(receivable) {
    return (receivable.installments || [])
      .filter(
        (installment) =>
          !["recebido", "cancelado"].includes(
            installment.status
          ) &&
          getInstallmentRemaining(installment) > 0
      )
      .sort(
        (a, b) =>
          Number(a.installment_number) -
          Number(b.installment_number)
      );
  }

  function getInstallmentRemaining(installment) {
    return Math.max(
      Number(installment?.amount || 0) -
        Number(
          installment?.received_amount || 0
        ),
      0
    );
  }

  const filteredReceivables = receivables;

  const selectedReceivables =
    receivables.filter((item) =>
      selectedIds.includes(Number(item.id))
    );

  const selectedRemainingAmount =
    selectedReceivables
      .filter(
        (item) =>
          item.status !== "cancelado"
      )
      .reduce(
        (total, item) =>
          total +
          Number(item.remaining_amount || 0),
        0
      );

  const totalAmount = Number(
    summary.total_amount || 0
  );

  const receivedAmount = Number(
    summary.received_amount || 0
  );

  const remainingAmount = Number(
    summary.remaining_amount || 0
  );

  const overdueInstallments = Number(
    summary.overdue_installments || 0
  );

  const paginationStart =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) *
          pagination.limit +
        1;

  const paginationEnd = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Object.entries(filters).some(
      ([key, value]) =>
        key === "overdue_only"
          ? value === true
          : Boolean(value)
    );

  function handleFilterChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setPage(1);

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function clearFilters() {
    setSearch("");
    setFilters(emptyFilters);
    setPage(1);
  }

  function handleLimitChange(event) {
    const nextLimit = Number(
      event.target.value
    );

    setLimit(nextLimit);
    setPage(1);
    setSelectedIds([]);
  }

  function goToPreviousPage() {
    if (
      !pagination.hasPreviousPage ||
      loading
    ) {
      return;
    }

    setSelectedIds([]);

    setPage((currentPage) =>
      Math.max(currentPage - 1, 1)
    );
  }

  function goToNextPage() {
    if (
      !pagination.hasNextPage ||
      loading
    ) {
      return;
    }

    setSelectedIds([]);
    setPage((currentPage) => currentPage + 1);
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function openNewModal() {
    setEditingId(null);
    setEditingReceivable(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(receivable) {
    setEditingId(receivable.id);
    setEditingReceivable(receivable);

    setForm({
      description:
        receivable.description || "",
      cost_center_id:
        receivable.project_id ||
        receivable.cost_center?.id ||
        "",
      client_id:
        receivable.client_id ||
        receivable.client?.id ||
        "",
      category_id:
        receivable.category_id ||
        receivable.category?.id ||
        "",
      total_amount:
        receivable.total_amount || "",
      installments_count:
        receivable.installments_count || 1,
      issue_date:
        receivable.issue_date || "",
      first_due_date:
        receivable.first_due_date || "",
      note: receivable.note || "",
    });

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setEditingReceivable(null);
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

    if (!form.description.trim()) {
      alert("A descrição é obrigatória.");
      return;
    }

    if (!form.cost_center_id) {
      alert(
        "Selecione um centro de custo."
      );
      return;
    }

    if (
      !form.total_amount ||
      Number(form.total_amount) <= 0
    ) {
      alert("Informe um valor válido.");
      return;
    }

    if (
      !Number.isInteger(
        Number(form.installments_count)
      ) ||
      Number(form.installments_count) < 1
    ) {
      alert(
        "Informe uma quantidade válida de parcelas."
      );
      return;
    }

    if (!form.first_due_date) {
      alert(
        "Informe o primeiro vencimento."
      );
      return;
    }

    const payload = {
      description: form.description.trim(),
      cost_center_id: Number(
        form.cost_center_id
      ),
      client_id: form.client_id
        ? Number(form.client_id)
        : null,
      category_id: form.category_id
        ? Number(form.category_id)
        : null,
      total_amount: Number(
        form.total_amount
      ),
      installments_count: Number(
        form.installments_count
      ),
      issue_date:
        form.issue_date || null,
      first_due_date:
        form.first_due_date,
      note: form.note.trim() || null,
    };

    try {
      setLoading(true);

      if (editingId) {
        await updateReceivable(
          editingId,
          payload
        );

        alert(
          "Conta a receber atualizada com sucesso!"
        );
      } else {
        await createReceivable(payload);

        alert(
          "Conta a receber criada com sucesso!"
        );
      }

      closeModal();
      await loadData();
    } catch (error) {
      console.error(
        "Erro ao salvar conta a receber:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Erro ao salvar conta a receber."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(receivable) {
    const isCancelled =
      receivable.status === "cancelado";

    const newStatus = isCancelled
      ? "pendente"
      : "cancelado";

    const actionText = isCancelled
      ? "reativar"
      : "cancelar";

    const confirmed = window.confirm(
      `Deseja ${actionText} a conta ${receivable.code}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await updateReceivableStatus(
        receivable.id,
        newStatus
      );

      await loadData();

      alert(
        isCancelled
          ? "Conta reativada com sucesso."
          : "Conta cancelada com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao alterar status:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Erro ao alterar o status."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(receivable) {
    const confirmed = window.confirm(
      `Deseja excluir a conta ${receivable.code} e todas as suas parcelas?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await deleteReceivable(
        receivable.id
      );

      await loadData();

      alert(
        "Conta a receber excluída com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao excluir conta:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Erro ao excluir conta a receber."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function openReceiptModal(receivable) {
    const pendingInstallments =
      getPendingInstallments(receivable);

    if (pendingInstallments.length === 0) {
      alert(
        "Esta conta não possui parcelas pendentes."
      );
      return;
    }

    const firstInstallment =
      pendingInstallments[0];

    setSelectedReceivable(receivable);

    setReceiptForm({
      installment_id: String(
        firstInstallment.id
      ),
      financial_account_id:
        financialAccounts.length > 0
          ? String(financialAccounts[0].id)
          : "",
      amount: getInstallmentRemaining(
        firstInstallment
      ).toFixed(2),
      received_date: today,
      note: "",
    });

    setReceiptModalOpen(true);
  }

  function closeReceiptModal() {
    setReceiptModalOpen(false);
    setSelectedReceivable(null);

    setReceiptForm({
      installment_id: "",
      financial_account_id: "",
      amount: "",
      received_date: today,
      note: "",
    });
  }

  function handleReceiptChange(event) {
    const { name, value } = event.target;

    if (name === "installment_id") {
      const selectedInstallment = (
        selectedReceivable?.installments || []
      ).find(
        (installment) =>
          String(installment.id) ===
          String(value)
      );

      setReceiptForm(
        (currentForm) => ({
          ...currentForm,
          installment_id: value,
          amount:
            getInstallmentRemaining(
              selectedInstallment
            ).toFixed(2),
        })
      );

      return;
    }

    setReceiptForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleReceiptSubmit(event) {
    event.preventDefault();

    if (!receiptForm.installment_id) {
      alert("Selecione uma parcela.");
      return;
    }

    if (!receiptForm.financial_account_id) {
      alert(
        "Selecione a conta financeira de destino."
      );
      return;
    }

    if (
      !receiptForm.amount ||
      Number(receiptForm.amount) <= 0
    ) {
      alert(
        "Informe um valor recebido válido."
      );
      return;
    }

    if (!receiptForm.received_date) {
      alert(
        "Informe a data do recebimento."
      );
      return;
    }

    try {
      setLoading(true);

      await receiveInstallment(
        receiptForm.installment_id,
        {
          amount: Number(
            receiptForm.amount
          ),
          received_date:
            receiptForm.received_date,
          financial_account_id: Number(
            receiptForm.financial_account_id
          ),
          note:
            receiptForm.note.trim() || null,
        }
      );

      closeReceiptModal();
      await loadData();

      alert(
        "Recebimento registrado com sucesso!"
      );
    } catch (error) {
      console.error(
        "Erro ao registrar recebimento:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Erro ao registrar recebimento."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReverseReceipt(receivable) {
  const confirmedPayments = (
    receivable.installments || []
  )
    .flatMap((installment) =>
      (installment.payments || [])
        .filter(
          (payment) =>
            payment.status === "confirmado"
        )
        .map((payment) => ({
          ...payment,

          installment_number:
            installment.installment_number,
        }))
    )
    .sort(
      (a, b) =>
        Number(a.installment_number) -
          Number(b.installment_number) ||
        Number(a.id) - Number(b.id)
    );

  if (confirmedPayments.length === 0) {
    if (
      Number(receivable.received_amount || 0) > 0
    ) {
      alert(
        "Este é um recebimento antigo e não possui uma movimentação financeira vinculada. Ele ainda precisa ser estornado pelo processo antigo."
      );
    } else {
      alert(
        "Esta conta não possui recebimentos confirmados."
      );
    }

    return;
  }

  let selectedPayment;

  if (confirmedPayments.length === 1) {
    selectedPayment = confirmedPayments[0];
  } else {
    const options = confirmedPayments
      .map((payment, index) => {
        const accountName =
          payment.financial_account?.name ||
          "Conta não informada";

        const receivedDate =
          payment.received_date
            ? new Date(
                `${payment.received_date}T00:00:00`
              ).toLocaleDateString("pt-BR")
            : "-";

        return [
          `${index + 1} - Parcela`,
          payment.installment_number,
          formatCurrency(payment.amount),
          accountName,
          receivedDate,
        ].join(" | ");
      })
      .join("\n");

    const selectedOption = window.prompt(
      `Digite o número do recebimento que deseja estornar:\n\n${options}`
    );

    if (!selectedOption) {
      return;
    }

    const selectedIndex =
      Number(selectedOption) - 1;

    if (
      !Number.isInteger(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= confirmedPayments.length
    ) {
      alert("Opção de recebimento inválida.");
      return;
    }

    selectedPayment =
      confirmedPayments[selectedIndex];
  }

  const accountName =
    selectedPayment.financial_account?.name ||
    "Conta não informada";

  const confirmed = window.confirm(
    [
      "Deseja estornar este recebimento?",
      "",
      `Parcela: ${selectedPayment.installment_number}`,
      `Valor: ${formatCurrency(
        selectedPayment.amount
      )}`,
      `Conta: ${accountName}`,
    ].join("\n")
  );

  if (!confirmed) {
    return;
  }

  try {
    setLoading(true);

    await reverseReceivablePayment(
      selectedPayment.id
    );

    await loadData();

    alert("Recebimento estornado com sucesso.");
  } catch (error) {
    console.error(
      "Erro ao estornar recebimento:",
      error
    );

    alert(
      error.response?.data?.error ||
        error.response?.data?.details ||
        "Erro ao estornar recebimento."
    );
  } finally {
    setLoading(false);
  }
}

  async function handleBulkStatus(status) {
    if (selectedIds.length === 0) {
      alert(
        "Selecione pelo menos uma conta."
      );
      return;
    }

    let idsToUpdate = selectedIds;

    if (status === "pendente") {
      idsToUpdate = selectedReceivables
        .filter(
          (item) =>
            item.status === "cancelado"
        )
        .map((item) => Number(item.id));

      if (idsToUpdate.length === 0) {
        alert(
          "Nenhuma conta cancelada foi selecionada."
        );
        return;
      }
    }

    if (status === "cancelado") {
      const blocked = selectedReceivables
        .filter(hasReceipts)
        .map((item) => item.code);

      if (blocked.length > 0) {
        alert(
          `Estorne os recebimentos antes de cancelar:\n${blocked.join(
            ", "
          )}`
        );
        return;
      }
    }

    const actionText =
      status === "cancelado"
        ? "cancelar"
        : "reativar";

    const confirmed = window.confirm(
      `Deseja ${actionText} ${idsToUpdate.length} conta(s) selecionada(s)?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await bulkUpdateReceivableStatus(
        idsToUpdate,
        status
      );

      clearSelection();
      await loadData();

      alert(
        status === "cancelado"
          ? "Contas canceladas com sucesso."
          : "Contas reativadas com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro na alteração em lote:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Erro ao alterar as contas selecionadas."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function openBulkReceiptModal() {
    if (selectedIds.length === 0) {
      alert(
        "Selecione pelo menos uma conta."
      );
      return;
    }

    const cancelled = selectedReceivables
      .filter(
        (item) =>
          item.status === "cancelado"
      )
      .map((item) => item.code);

    if (cancelled.length > 0) {
      alert(
        `Reative as contas canceladas antes de receber:\n${cancelled.join(
          ", "
        )}`
      );
      return;
    }

    if (selectedRemainingAmount <= 0) {
      alert(
        "As contas selecionadas não possuem saldo a receber."
      );
      return;
    }

    setBulkReceiptDate(today);
    setBulkReceiptFinancialAccountId(
      financialAccounts.length > 0
        ? String(financialAccounts[0].id)
        : ""
    );
    setBulkReceiptNote("");
    setBulkReceiptModalOpen(true);
  }

  function closeBulkReceiptModal() {
    setBulkReceiptModalOpen(false);
    setBulkReceiptDate(today);
    setBulkReceiptFinancialAccountId("");
    setBulkReceiptNote("");
  }

  async function handleBulkReceiptSubmit(
    event
  ) {
    event.preventDefault();

    if (!bulkReceiptDate) {
      alert(
        "Informe a data do recebimento."
      );
      return;
    }

    if (!bulkReceiptFinancialAccountId) {
      alert(
        "Selecione a conta financeira de destino."
      );
      return;
    }

    const eligibleIds =
      selectedReceivables
        .filter(
          (item) =>
            item.status !== "cancelado" &&
            Number(
              item.remaining_amount || 0
            ) > 0
        )
        .map((item) => Number(item.id));

    if (eligibleIds.length === 0) {
      alert(
        "Nenhuma conta selecionada possui saldo a receber."
      );
      return;
    }

    const confirmed = window.confirm(
      `Registrar ${formatCurrency(
        selectedRemainingAmount
      )} como recebido em ${eligibleIds.length} conta(s)?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await bulkReceiveReceivables(
        eligibleIds,
        {
          received_date: bulkReceiptDate,
          financial_account_id: Number(
            bulkReceiptFinancialAccountId
          ),
          note:
            bulkReceiptNote.trim() || null,
        }
      );

      closeBulkReceiptModal();
      clearSelection();
      await loadData();

      alert(
        "Recebimentos em lote registrados com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao receber em lote:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Erro ao registrar recebimentos em lote."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) {
      alert(
        "Selecione pelo menos uma conta."
      );
      return;
    }

    const blocked = selectedReceivables
      .filter(hasReceipts)
      .map((item) => item.code);

    if (blocked.length > 0) {
      alert(
        `Estorne os recebimentos antes de excluir:\n${blocked.join(
          ", "
        )}`
      );
      return;
    }

    const confirmed = window.confirm(
      `Deseja excluir ${selectedIds.length} conta(s) e todas as parcelas vinculadas?\n\nEsta ação não poderá ser desfeita.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await bulkDeleteReceivables(
        selectedIds
      );

      clearSelection();
      await loadData();

      alert(
        "Contas selecionadas excluídas com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao excluir em lote:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Erro ao excluir as contas selecionadas."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      key: "description",
      label: "Descrição",
      render: (item) => (
          <div>
            <strong>{item.description}</strong>

            <small className="receivable-subtitle">
               {item.installments_count} parcela(s)
            </small>
            </div>
          ),
        },
        {
          key: "issue_date",
          label: "Data",
          render: (item) =>
            formatDate(item.issue_date),
        },
        {
          key: "due_date",
          label: "Vencimento",
            render: (item) => {
            const overdue = isOverdue(item.first_due_date);
            const days = getDaysOverdue(item.first_due_date);

        return (
          <div>
            <strong
              style={{
              color: overdue ? "#dc2626" : "inherit",
              }}>
            {formatDate(item.first_due_date)}
            </strong>

              {overdue && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#dc2626",
                  }}
                >
                  {days} dia(s) atrasado
                </div>
              )}
            </div>
          );
        },
      },
        {
          key: "cost_center",
          label: "Centro de Custo",
          render: (item) =>
            item.cost_center
              ? `${item.cost_center.code || ""} ${
                  item.cost_center.name
                }`
              : "-",
    },
    {
      key: "code",
      label: "Código",
      render: (item) => (
        <strong>{item.code || "-"}</strong>
      ),
    },
    {
      key: "description",
      label: "Descrição",
      render: (item) => (
        <div>
          <strong>
            {item.description}
          </strong>

          <small className="receivable-subtitle">
            {item.installments_count} parcela(s)
          </small>
        </div>
      ),
    },
    {
      key: "cost_center",
      label: "Centro de Custo",
      render: (item) =>
        item.cost_center
          ? `${
              item.cost_center.code || ""
            } ${item.cost_center.name}`
          : "-",
    },
    {
      key: "client",
      label: "Cliente",
      render: (item) =>
        item.client?.name || "-",
    },
    {
      key: "total_amount",
      label: "Valor Total",
      render: (item) =>
        formatCurrency(item.total_amount),
    },
    {
      key: "received_amount",
      label: "Recebido",
      render: (item) =>
        formatCurrency(
          item.received_amount
        ),
    },
    {
      key: "remaining_amount",
      label: "A Receber",
      render: (item) => (
        <strong>
          {item.status === "cancelado"
            ? formatCurrency(0)
            : formatCurrency(
                item.remaining_amount
              )}
        </strong>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item) => (
        <StatusBadge
          status={
            isOverdue(item.first_due_date) &&
            item.status === "pendente"
              ? "atrasado"
              : item.status
          }
        />
      ),
    },
    {
      key: "actions",
      label: "Ações",
      render: (item) => {
        const itemHasReceipts =
          hasReceipts(item);

        return (
          <div className="receivable-actions">
            {![
              "recebido",
              "cancelado",
            ].includes(item.status) && (
              <button
                type="button"
                className="receivable-action-button receive"
                onClick={() =>
                  openReceiptModal(item)
                }
              >
                Receber
              </button>
            )}

            {itemHasReceipts && (
              <button
                type="button"
                className="receivable-action-button reverse"
                onClick={() =>
                  handleReverseReceipt(item)
                }
              >
                Estornar
              </button>
            )}

            <button
              type="button"
              className="receivable-action-button edit"
              onClick={() =>
                openEditModal(item)
              }
            >
              Editar
            </button>

            {item.status === "cancelado" ? (
              <button
                type="button"
                className="receivable-action-button reactivate"
                onClick={() =>
                  handleStatus(item)
                }
              >
                Reativar
              </button>
            ) : (
              !itemHasReceipts && (
                <button
                  type="button"
                  className="receivable-action-button cancel"
                  onClick={() =>
                    handleStatus(item)
                  }
                >
                  Cancelar
                </button>
              )
            )}

            {!itemHasReceipts && (
              <button
                type="button"
                className="receivable-action-button delete"
                onClick={() =>
                  handleDelete(item)
                }
              >
                Excluir
              </button>
            )}
          </div>
        );
      },
    },
  ];
  

  const installmentCount = Math.max(
    Number(
      form.installments_count || 1
    ),
    1
  );

  const installmentPreview =
    Number(form.total_amount || 0) /
    installmentCount;

  const editingHasReceipts =
    Number(
      editingReceivable?.received_amount ||
        0
    ) > 0;

  return (
    <div>
      <PageHeader
        title="Contas a Receber"
        subtitle="Controle contratos, medições, parcelas e recebimentos."
      >
        <Button onClick={openNewModal}>
          + Nova Conta a Receber
        </Button>
      </PageHeader>

      <div className="receivable-stats-grid">
        <StatCard
          label="Valor lançado"
          value={formatCurrency(totalAmount)}
        />

        <StatCard
          label="Valor recebido"
          value={formatCurrency(
            receivedAmount
          )}
        />

        <StatCard
          label="Valor a receber"
          value={formatCurrency(
            remainingAmount
          )}
        />

        <StatCard
          label="Parcelas vencidas"
          value={overdueInstallments}
        />
      </div>

      <section className="receivable-filter-panel">
        <div className="receivable-filter-header">
          <div>
            <h2>Filtros</h2>
            <p>
              Refine os lançamentos por situação,
              vínculo e vencimento.
            </p>
          </div>

          <button
            type="button"
            className="receivable-clear-filters"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            Limpar filtros
          </button>
        </div>

        <div className="receivable-filter-grid">
          <div className="receivable-search-field">
            <label>Pesquisa</label>

            <SearchBar
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Código, descrição, cliente ou centro..."
            />
          </div>

          <label>
            Status

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">
                Todos
              </option>
              <option value="pendente">
                Pendente
              </option>
              <option value="parcial">
                Parcial
              </option>
              <option value="recebido">
                Recebido
              </option>
              <option value="cancelado">
                Cancelado
              </option>
            </select>
          </label>

          <label>
            Centro de custo

            <select
              name="cost_center_id"
              value={
                filters.cost_center_id
              }
              onChange={handleFilterChange}
            >
              <option value="">
                Todos
              </option>

              {costCenters.map(
                (costCenter) => (
                  <option
                    key={costCenter.id}
                    value={costCenter.id}
                  >
                    {costCenter.code} -{" "}
                    {costCenter.name}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Cliente

            <select
              name="client_id"
              value={filters.client_id}
              onChange={handleFilterChange}
            >
              <option value="">
                Todos
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
          </label>

          <label>
            Categoria

            <select
              name="category_id"
              value={
                filters.category_id
              }
              onChange={handleFilterChange}
            >
              <option value="">
                Todas
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Vencimento inicial

            <input
              type="date"
              name="due_from"
              value={filters.due_from}
              onChange={handleFilterChange}
            />
          </label>

          <label>
            Vencimento final

            <input
              type="date"
              name="due_to"
              value={filters.due_to}
              onChange={handleFilterChange}
            />
          </label>

          <label className="receivable-overdue-filter">
            <input
              type="checkbox"
              name="overdue_only"
              checked={
                filters.overdue_only
              }
              onChange={handleFilterChange}
            />

            Somente vencidas
          </label>
        </div>

        <div className="receivable-filter-result">
          {filteredReceivables.length} de{" "}
          {pagination.total} conta(s)
          exibida(s)
        </div>
      </section>

      {selectedIds.length > 0 && (
        <section className="receivable-bulk-bar">
          <div className="receivable-bulk-summary">
            <strong>
              {selectedIds.length} conta(s)
              selecionada(s)
            </strong>

            <span>
              Saldo selecionado:{" "}
              {formatCurrency(
                selectedRemainingAmount
              )}
            </span>
          </div>

          <div className="receivable-bulk-actions">
            <button
              type="button"
              className="bulk-action-button receive"
              onClick={openBulkReceiptModal}
              disabled={loading}
            >
              Receber saldo
            </button>

            <button
              type="button"
              className="bulk-action-button cancel"
              onClick={() =>
                handleBulkStatus(
                  "cancelado"
                )
              }
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="bulk-action-button reactivate"
              onClick={() =>
                handleBulkStatus(
                  "pendente"
                )
              }
              disabled={loading}
            >
              Reativar
            </button>

            <button
              type="button"
              className="bulk-action-button delete"
              onClick={handleBulkDelete}
              disabled={loading}
            >
              Excluir
            </button>

            <button
              type="button"
              className="bulk-action-button clear"
              onClick={clearSelection}
              disabled={loading}
            >
              Limpar seleção
            </button>
          </div>
        </section>
      )}

      <div className="receivable-toolbar">
        <div>
          <h2>Lançamentos</h2>

          <p>
            Acompanhe valores recebidos e
            pendentes por centro de custo.
          </p>
        </div>
      </div>

      {loading &&
      receivables.length === 0 ? (
        <div className="receivable-loading">
          Carregando contas a receber...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredReceivables}
          emptyMessage="Nenhuma conta a receber encontrada."
        />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          marginTop: "16px",
          padding: "14px 16px",
          background: "#fff",
          borderRadius: "12px",
        }}
      >
        <div style={{ fontSize: "14px" }}>
          {pagination.total > 0
            ? `Mostrando ${paginationStart}-${paginationEnd} de ${pagination.total} registros`
            : "Nenhum registro encontrado"}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
            }}
          >
            Por página

            <select
              value={limit}
              onChange={handleLimitChange}
              disabled={loading}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>

          <Button
            type="button"
            variant="secondary"
            onClick={goToPreviousPage}
            disabled={
              loading ||
              !pagination.hasPreviousPage
            }
          >
            Anterior
          </Button>

          <span style={{ fontSize: "14px" }}>
            Página {pagination.page} de{" "}
            {Math.max(
              pagination.totalPages,
              1
            )}
          </span>

          <Button
            type="button"
            variant="secondary"
            onClick={goToNextPage}
            disabled={
              loading ||
              !pagination.hasNextPage
            }
          >
            Próxima
          </Button>
        </div>
      </div>

      <Modal
        title={
          editingId
            ? "Editar Conta a Receber"
            : "Nova Conta a Receber"
        }
        isOpen={modalOpen}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit}>
          <FormGrid>
            <input
              name="description"
              placeholder="Descrição *"
              value={form.description}
              onChange={handleChange}
            />

            <select
              name="cost_center_id"
              value={
                form.cost_center_id
              }
              onChange={handleChange}
            >
              <option value="">
                Selecione o centro de custo *
              </option>

              {costCenters.map(
                (costCenter) => (
                  <option
                    key={costCenter.id}
                    value={costCenter.id}
                  >
                    {costCenter.code} -{" "}
                    {costCenter.name}
                  </option>
                )
              )}
            </select>

            <select
              name="client_id"
              value={form.client_id}
              onChange={handleChange}
            >
              <option value="">
                Selecione o cliente
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

            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
            >
              <option value="">
                Selecione a categoria
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}
            </select>

            <input
              type="number"
              name="total_amount"
              placeholder="Valor total *"
              min="0.01"
              step="0.01"
              value={form.total_amount}
              onChange={handleChange}
              disabled={
                editingHasReceipts
              }
            />

            <input
              type="number"
              name="installments_count"
              placeholder="Quantidade de parcelas"
              min="1"
              step="1"
              value={
                form.installments_count
              }
              onChange={handleChange}
              disabled={
                editingHasReceipts
              }
            />

            <div className="date-field">
              <label>
                Data de emissão
              </label>

              <input
                type="date"
                name="issue_date"
                value={form.issue_date}
                onChange={handleChange}
              />
            </div>

            <div className="date-field">
              <label>
                Primeiro vencimento *
              </label>

              <input
                type="date"
                name="first_due_date"
                value={
                  form.first_due_date
                }
                onChange={handleChange}
                disabled={
                  editingHasReceipts
                }
              />
            </div>
          </FormGrid>

          {editingHasReceipts && (
            <div className="receivable-warning">
              Esta conta já possui
              recebimentos. O valor, as
              parcelas e o primeiro vencimento
              não podem mais ser alterados.
            </div>
          )}

          {!editingHasReceipts &&
            Number(
              form.total_amount
            ) > 0 && (
              <div className="installment-preview">
                <span>
                  Prévia das parcelas
                </span>

                <strong>
                  {installmentCount}x de
                  aproximadamente{" "}
                  {formatCurrency(
                    installmentPreview
                  )}
                </strong>

                <small>
                  Os centavos serão ajustados
                  automaticamente na última
                  parcela.
                </small>
              </div>
            )}

          <textarea
            className="receivable-note"
            name="note"
            placeholder="Observações"
            value={form.note}
            onChange={handleChange}
          />

          <div className="receivable-modal-actions">
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

      <Modal
        title="Registrar Recebimento"
        isOpen={receiptModalOpen}
        onClose={closeReceiptModal}
      >
        <form
          onSubmit={handleReceiptSubmit}
        >
          <div className="receipt-account-info">
            <span>Conta</span>

            <strong>
              {selectedReceivable?.code} —{" "}
              {
                selectedReceivable?.description
              }
            </strong>
          </div>

          <div className="receipt-form">
            <label>
              Parcela

              <select
                name="installment_id"
                value={
                  receiptForm.installment_id
                }
                onChange={
                  handleReceiptChange
                }
              >
                {getPendingInstallments(
                  selectedReceivable || {}
                ).map((installment) => (
                  <option
                    key={installment.id}
                    value={installment.id}
                  >
                    Parcela{" "}
                    {
                      installment.installment_number
                    }{" "}
                    — saldo{" "}
                    {formatCurrency(
                      getInstallmentRemaining(
                        installment
                      )
                    )}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Conta de destino

              <select
                name="financial_account_id"
                value={
                  receiptForm.financial_account_id
                }
                onChange={
                  handleReceiptChange
                }
                required
              >
                <option value="">
                  Selecione a conta financeira
                </option>

                {financialAccounts.map(
                  (account) => (
                    <option
                      key={account.id}
                      value={account.id}
                    >
                      {account.code} -{" "}
                      {account.name}
                      {account.bank
                        ? ` (${account.bank})`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Valor recebido

              <input
                type="number"
                name="amount"
                min="0.01"
                step="0.01"
                value={receiptForm.amount}
                onChange={
                  handleReceiptChange
                }
              />
            </label>

            <label>
              Data do recebimento

              <input
                type="date"
                name="received_date"
                value={
                  receiptForm.received_date
                }
                onChange={
                  handleReceiptChange
                }
              />
            </label>

            <label>
              Observação

              <input
                type="text"
                name="note"
                value={receiptForm.note}
                onChange={
                  handleReceiptChange
                }
                placeholder="Observação do recebimento"
              />
            </label>
          </div>

          <div className="receivable-modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={
                closeReceiptModal
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Registrando..."
                : "Confirmar Recebimento"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Receber Contas Selecionadas"
        isOpen={bulkReceiptModalOpen}
        onClose={closeBulkReceiptModal}
      >
        <form
          onSubmit={
            handleBulkReceiptSubmit
          }
        >
          <div className="bulk-receipt-summary">
            <span>
              Contas selecionadas
            </span>

            <strong>
              {selectedIds.length}
            </strong>

            <span>
              Saldo total a receber
            </span>

            <strong>
              {formatCurrency(
                selectedRemainingAmount
              )}
            </strong>
          </div>

          <label className="bulk-receipt-date">
            Conta de destino

            <select
              value={
                bulkReceiptFinancialAccountId
              }
              onChange={(event) =>
                setBulkReceiptFinancialAccountId(
                  event.target.value
                )
              }
              required
            >
              <option value="">
                Selecione a conta financeira
              </option>

              {financialAccounts.map(
                (account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    {account.code} -{" "}
                    {account.name}
                    {account.bank
                      ? ` (${account.bank})`
                      : ""}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="bulk-receipt-date">
            Data do recebimento

            <input
              type="date"
              value={bulkReceiptDate}
              onChange={(event) =>
                setBulkReceiptDate(
                  event.target.value
                )
              }
            />
          </label>

          <label className="bulk-receipt-date">
            Observação

            <input
              type="text"
              value={bulkReceiptNote}
              onChange={(event) =>
                setBulkReceiptNote(
                  event.target.value
                )
              }
              placeholder="Observação dos recebimentos"
            />
          </label>

          <div className="receivable-warning">
            Esta ação quitará o saldo restante
            de todas as parcelas das contas
            selecionadas. Contas já recebidas
            não serão alteradas.
          </div>

          <div className="receivable-modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={
                closeBulkReceiptModal
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Registrando..."
                : "Confirmar Recebimentos"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ContasReceber;
