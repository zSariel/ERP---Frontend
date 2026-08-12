import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createPayable,
  deletePayable,
  getPayables,
  getPayablesSummary,
  payInstallment,
  reversePayablePayment,
  updatePayable,
  updatePayableStatus,
} from "../services/payableService";

import api from "../services/api";
import { getCostCenters } from "../services/costCenterService";
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
  supplier_id: "",
  category_id: "",
  document_number: "",
  history_code: "",
  total_amount: "",
  installments_count: 1,
  issue_date: "",
  competence_date: "",
  first_due_date: "",
  note: "",
};

const emptyFilters = {
  status: "",
  cost_center_id: "",
  supplier_id: "",
  category_id: "",
  due_from: "",
  due_to: "",
  overdue_only: false,
};

function ContasPagar() {
  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const [payables, setPayables] = useState([]);

  const [summary, setSummary] = useState({
    total_amount: 0,
    paid_amount: 0,
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

  const [costCenters, setCostCenters] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [financialAccounts, setFinancialAccounts] =
    useState([]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(emptyFilters);

  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingPayable, setEditingPayable] =
    useState(null);

  const [paymentModalOpen, setPaymentModalOpen] =
    useState(false);

  const [selectedPayable, setSelectedPayable] =
    useState(null);

  const [paymentForm, setPaymentForm] = useState({
    installment_id: "",
    financial_account_id: "",
    amount: "",
    paid_date: today,
    payment_method: "pix",
    note: "",
  });

  const [loading, setLoading] = useState(false);

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

      if (filters.supplier_id) {
        params.supplier_id = filters.supplier_id;
      }

      if (filters.category_id) {
        params.category_id = filters.category_id;
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
        payablesResponse,
        summaryResponse,
      ] = await Promise.all([
        getPayables(params),
        getPayablesSummary(),
      ]);

      const responsePagination =
        payablesResponse.data?.pagination || {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        };

      setPayables(
        payablesResponse.data?.data || []
      );

      setPagination(responsePagination);

      setSummary(
        summaryResponse.data || {
          total_amount: 0,
          paid_amount: 0,
          remaining_amount: 0,
          overdue_installments: 0,
        }
      );

      if (
        responsePagination.totalPages > 0 &&
        page > responsePagination.totalPages
      ) {
        setPage(responsePagination.totalPages);
      }
    } catch (error) {
      console.error(
        "Erro ao carregar contas a pagar:",
        error
      );

      alert(
        error.response?.data?.error ||
          "Erro ao carregar contas a pagar."
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
          suppliersResponse,
          categoriesResponse,
          financialAccountsResponse,
        ] = await Promise.all([
          getCostCenters(),
          api.get("/suppliers"),
          getCategories(),
          getFinancialAccounts(),
        ]);

        setCostCenters(
          costCentersResponse.data || []
        );

        setSuppliers(
          (suppliersResponse.data || []).filter(
            (supplier) =>
              supplier.active !== false &&
              supplier.active !== 0
          )
        );

        const expenseCategories = (
          categoriesResponse.data || []
        ).filter(
          (category) =>
            category.type === "despesa" &&
            category.active !== false &&
            category.active !== 0
        );

        setCategories(expenseCategories);

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

    return () => {
      clearTimeout(timer);
    };
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

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString("pt-BR");
  }

  function getErrorMessage(
    error,
    fallbackMessage
  ) {
    return (
      error.response?.data?.error ||
      error.response?.data?.details ||
      error.message ||
      fallbackMessage
    );
  }

  function getInstallmentRemaining(installment) {
    return Math.max(
      Number(installment?.amount || 0) -
        Number(installment?.paid_amount || 0),
      0
    );
  }

  function getPendingInstallments(payable) {
    return (payable.installments || [])
      .filter(
        (installment) =>
          !["pago", "cancelado"].includes(
            installment.status
          ) &&
          getInstallmentRemaining(installment) > 0
      )
      .sort(
        (a, b) =>
          String(a.due_date || "").localeCompare(
            String(b.due_date || "")
          ) ||
          Number(a.installment_number) -
            Number(b.installment_number)
      );
  }

  function getCurrentInstallment(payable) {
    return getPendingInstallments(payable)[0] || null;
  }

  function isInstallmentOverdue(installment) {
    if (!installment?.due_date) {
      return false;
    }

    if (
      ["pago", "cancelado"].includes(
        installment.status
      )
    ) {
      return false;
    }

    return (
      installment.due_date < today &&
      getInstallmentRemaining(installment) > 0
    );
  }

  function getInstallmentDaysOverdue(installment) {
    if (!isInstallmentOverdue(installment)) {
      return 0;
    }

    const dueDate = new Date(
      `${installment.due_date}T00:00:00`
    );
    const currentDate = new Date(
      `${today}T00:00:00`
    );

    return Math.max(
      Math.floor(
        (currentDate - dueDate) /
          (1000 * 60 * 60 * 24)
      ),
      0
    );
  }

  function getConfirmedPayments(payable) {
    return (payable.installments || [])
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
  }

  function hasConfirmedPayments(payable) {
    return getConfirmedPayments(payable).length > 0;
  }

  function hasPaymentHistory(payable) {
    return (payable.installments || []).some(
      (installment) =>
        (installment.payments || []).length > 0
    );
  }

  function hasOverdueInstallment(payable) {
    if (
      ["pago", "cancelado"].includes(
        payable.status
      )
    ) {
      return false;
    }

    return (payable.installments || []).some(
      isInstallmentOverdue
    );
  }

  function matchesDueDateFilter(payable) {
    if (!filters.due_from && !filters.due_to) {
      return true;
    }

    return (payable.installments || []).some(
      (installment) => {
        if (installment.status === "cancelado") {
          return false;
        }

        const dueDate = installment.due_date;

        if (
          filters.due_from &&
          dueDate < filters.due_from
        ) {
          return false;
        }

        if (
          filters.due_to &&
          dueDate > filters.due_to
        ) {
          return false;
        }

        return true;
      }
    );
  }

  const normalizedSearch = debouncedSearch
    .trim()
    .toLowerCase();

  const filteredPayables = payables.filter(
    (item) => {
      const searchableText = [
        item.code,
        item.description,
        item.document_number,
        item.history_code,
        item.cost_center?.code,
        item.cost_center?.name,
        item.supplier?.name,
        item.category?.name,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (
        normalizedSearch &&
        !searchableText.includes(
          normalizedSearch
        )
      ) {
        return false;
      }

      if (
        filters.status &&
        item.status !== filters.status
      ) {
        return false;
      }

      if (
        filters.cost_center_id &&
        Number(
          item.project_id ||
            item.cost_center?.id
        ) !== Number(filters.cost_center_id)
      ) {
        return false;
      }

      if (
        filters.supplier_id &&
        Number(
          item.supplier_id ||
            item.supplier?.id
        ) !== Number(filters.supplier_id)
      ) {
        return false;
      }

      if (
        filters.category_id &&
        Number(
          item.category_id ||
            item.category?.id
        ) !== Number(filters.category_id)
      ) {
        return false;
      }

      if (!matchesDueDateFilter(item)) {
        return false;
      }

      if (
        filters.overdue_only &&
        !hasOverdueInstallment(item)
      ) {
        return false;
      }

      return true;
    }
  );

  const totalAmount = Number(
    summary.total_amount || 0
  );

  const paidAmount = Number(
    summary.paid_amount || 0
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
    const nextLimit = Number(event.target.value);

    setLimit(nextLimit);
    setPage(1);
  }

  function goToPreviousPage() {
    if (!pagination.hasPreviousPage || loading) {
      return;
    }

    setPage((currentPage) =>
      Math.max(currentPage - 1, 1)
    );
  }

  function goToNextPage() {
    if (!pagination.hasNextPage || loading) {
      return;
    }

    setPage((currentPage) => currentPage + 1);
  }

  function openNewModal() {
    setEditingId(null);
    setEditingPayable(null);
    setForm({
      ...emptyForm,
      issue_date: today,
      competence_date: today,
      first_due_date: today,
    });
    setModalOpen(true);
  }

  function openEditModal(payable) {
    setEditingId(payable.id);
    setEditingPayable(payable);

    setForm({
      description: payable.description || "",
      cost_center_id:
        payable.project_id ||
        payable.cost_center?.id ||
        "",
      supplier_id:
        payable.supplier_id ||
        payable.supplier?.id ||
        "",
      category_id:
        payable.category_id ||
        payable.category?.id ||
        "",
      document_number:
        payable.document_number || "",
      history_code:
        payable.history_code || "",
      total_amount:
        payable.total_amount || "",
      installments_count:
        payable.installments_count || 1,
      issue_date:
        payable.issue_date || "",
      competence_date:
        payable.competence_date || "",
      first_due_date:
        payable.first_due_date || "",
      note: payable.note || "",
    });

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setEditingPayable(null);
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

    if (!form.category_id) {
      alert("Selecione uma categoria.");
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
      supplier_id: form.supplier_id
        ? Number(form.supplier_id)
        : null,
      category_id: Number(
        form.category_id
      ),
      document_number:
        form.document_number.trim() || null,
      history_code:
        form.history_code.trim() || null,
      total_amount: Number(
        form.total_amount
      ),
      installments_count: Number(
        form.installments_count
      ),
      issue_date:
        form.issue_date || null,
      competence_date:
        form.competence_date || null,
      first_due_date:
        form.first_due_date,
      note: form.note.trim() || null,
    };

    try {
      setLoading(true);

      if (editingId) {
        await updatePayable(
          editingId,
          payload
        );

        alert(
          "Conta a pagar atualizada com sucesso!"
        );
      } else {
        await createPayable(payload);

        alert(
          "Conta a pagar criada com sucesso!"
        );
      }

      closeModal();
      await loadData();
    } catch (error) {
      console.error(
        "Erro ao salvar conta a pagar:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Erro ao salvar conta a pagar."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(payable) {
    const isCancelled =
      payable.status === "cancelado";

    if (
      !isCancelled &&
      hasConfirmedPayments(payable)
    ) {
      alert(
        "Estorne os pagamentos antes de cancelar esta conta."
      );
      return;
    }

    const newStatus = isCancelled
      ? "pendente"
      : "cancelado";

    const actionText = isCancelled
      ? "reativar"
      : "cancelar";

    const confirmed = window.confirm(
      `Deseja ${actionText} a conta ${payable.code}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await updatePayableStatus(
        payable.id,
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

  async function handleDelete(payable) {
    if (hasConfirmedPayments(payable)) {
      alert(
        "Estorne os pagamentos confirmados antes de excluir esta conta."
      );
      return;
    }

    const confirmed = window.confirm(
      `Deseja excluir a conta ${payable.code} e todas as suas parcelas?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await deletePayable(payable.id);
      await loadData();

      alert(
        "Conta a pagar excluída com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao excluir conta:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Erro ao excluir conta a pagar."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function openPaymentModal(payable) {
    const pendingInstallments =
      getPendingInstallments(payable);

    if (pendingInstallments.length === 0) {
      alert(
        "Esta conta não possui parcelas pendentes."
      );
      return;
    }

    if (financialAccounts.length === 0) {
      alert(
        "Cadastre ou ative uma conta financeira antes de registrar o pagamento."
      );
      return;
    }

    const firstInstallment =
      pendingInstallments[0];

    setSelectedPayable(payable);

    setPaymentForm({
      installment_id: String(
        firstInstallment.id
      ),
      financial_account_id: String(
        financialAccounts[0].id
      ),
      amount: getInstallmentRemaining(
        firstInstallment
      ).toFixed(2),
      paid_date: today,
      payment_method: "pix",
      note: "",
    });

    setPaymentModalOpen(true);
  }

  function closePaymentModal() {
    setPaymentModalOpen(false);
    setSelectedPayable(null);

    setPaymentForm({
      installment_id: "",
      financial_account_id: "",
      amount: "",
      paid_date: today,
      payment_method: "pix",
      note: "",
    });
  }

  function handlePaymentChange(event) {
    const { name, value } = event.target;

    if (name === "installment_id") {
      const selectedInstallment = (
        selectedPayable?.installments || []
      ).find(
        (installment) =>
          String(installment.id) ===
          String(value)
      );

      setPaymentForm(
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

    setPaymentForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handlePaymentSubmit(event) {
    event.preventDefault();

    if (!paymentForm.installment_id) {
      alert("Selecione uma parcela.");
      return;
    }

    if (!paymentForm.financial_account_id) {
      alert(
        "Selecione a conta financeira de saída."
      );
      return;
    }

    if (
      !paymentForm.amount ||
      Number(paymentForm.amount) <= 0
    ) {
      alert(
        "Informe um valor pago válido."
      );
      return;
    }

    const selectedInstallment = (
      selectedPayable?.installments || []
    ).find(
      (installment) =>
        String(installment.id) ===
        String(paymentForm.installment_id)
    );

    const remaining =
      getInstallmentRemaining(
        selectedInstallment
      );

    if (
      Number(paymentForm.amount) >
      remaining
    ) {
      alert(
        `O valor não pode ser maior que o saldo da parcela: ${formatCurrency(
          remaining
        )}.`
      );
      return;
    }

    if (!paymentForm.paid_date) {
      alert(
        "Informe a data do pagamento."
      );
      return;
    }

    try {
      setLoading(true);

      await payInstallment(
        paymentForm.installment_id,
        {
          amount: Number(
            paymentForm.amount
          ),
          paid_date:
            paymentForm.paid_date,
          financial_account_id: Number(
            paymentForm.financial_account_id
          ),
          payment_method:
            paymentForm.payment_method,
          note:
            paymentForm.note.trim() || null,
        }
      );

      closePaymentModal();
      await loadData();

      alert(
        "Pagamento registrado com sucesso!"
      );
    } catch (error) {
      console.error(
        "Erro ao registrar pagamento:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Erro ao registrar pagamento."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReversePayment(payable) {
    const confirmedPayments =
      getConfirmedPayments(payable);

    if (confirmedPayments.length === 0) {
      alert(
        "Esta conta não possui pagamentos confirmados."
      );
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

          return [
            `${index + 1} - Parcela`,
            payment.installment_number,
            formatCurrency(payment.amount),
            accountName,
            formatDate(payment.paid_date),
          ].join(" | ");
        })
        .join("\n");

      const selectedOption = window.prompt(
        `Digite o número do pagamento que deseja estornar:\n\n${options}`
      );

      if (!selectedOption) {
        return;
      }

      const selectedIndex =
        Number(selectedOption) - 1;

      if (
        !Number.isInteger(selectedIndex) ||
        selectedIndex < 0 ||
        selectedIndex >=
          confirmedPayments.length
      ) {
        alert(
          "Opção de pagamento inválida."
        );
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
        "Deseja estornar este pagamento?",
        "",
        `Parcela: ${selectedPayment.installment_number}`,
        `Valor: ${formatCurrency(
          selectedPayment.amount
        )}`,
        `Conta: ${accountName}`,
        `Data: ${formatDate(
          selectedPayment.paid_date
        )}`,
      ].join("\n")
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await reversePayablePayment(
        selectedPayment.id
      );

      await loadData();

      alert(
        "Pagamento estornado com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao estornar pagamento:",
        error
      );

      alert(
        getErrorMessage(
          error,
          "Erro ao estornar pagamento."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  const statusMap = {
    pendente: {
      label: "Pendente",
      type: "warning",
    },
    parcial: {
      label: "Parcial",
      type: "info",
    },
    pago: {
      label: "Pago",
      type: "success",
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
      key: "description",
      label: "Descrição",
      render: (item) => (
        <div>
          <strong>{item.description}</strong>

          <small className="receivable-subtitle">
            {item.installments_count} parcela(s)
            {item.document_number
              ? ` • Doc. ${item.document_number}`
              : ""}
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
        if (item.status === "cancelado") {
          return "Cancelado";
        }

        const currentInstallment =
          getCurrentInstallment(item);

        if (!currentInstallment) {
          return item.status === "pago"
            ? "Quitado"
            : "-";
        }

        const overdue = isInstallmentOverdue(
          currentInstallment
        );
        const daysOverdue =
          getInstallmentDaysOverdue(
            currentInstallment
          );

        return (
          <div>
            <strong
              style={{
                color: overdue
                  ? "#dc2626"
                  : "inherit",
              }}
            >
              {formatDate(
                currentInstallment.due_date
              )}
            </strong>

            <small className="receivable-subtitle">
              Parcela {
                currentInstallment.installment_number
              }/{item.installments_count}
            </small>

            {overdue && (
              <small
                style={{
                  display: "block",
                  color: "#dc2626",
                  marginTop: "2px",
                }}
              >
                {daysOverdue} dia(s) em atraso
              </small>
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
          ? `${
              item.cost_center.code || ""
            } ${item.cost_center.name}`
          : "-",
    },
    {
      key: "supplier",
      label: "Fornecedor",
      render: (item) =>
        item.supplier?.name || "-",
    },
    {
      key: "total_amount",
      label: "Valor Total",
      render: (item) =>
        formatCurrency(item.total_amount),
    },
    {
      key: "paid_amount",
      label: "Pago",
      render: (item) =>
        formatCurrency(item.paid_amount),
    },
    {
      key: "remaining_amount",
      label: "A Pagar",
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
      render: (item) => {
        if (
          item.status !== "pago" &&
          item.status !== "cancelado" &&
          hasOverdueInstallment(item)
        ) {
          return (
            <StatusBadge type="danger">
              Atrasado
            </StatusBadge>
          );
        }

        const status =
          statusMap[item.status] ||
          statusMap.pendente;

        return (
          <StatusBadge type={status.type}>
            {status.label}
          </StatusBadge>
        );
      },
    },
    {
      key: "actions",
      label: "Ações",
      render: (item) => {
        const itemHasConfirmedPayments =
          hasConfirmedPayments(item);

        return (
          <div className="receivable-actions">
            {![
              "pago",
              "cancelado",
            ].includes(item.status) && (
              <button
                type="button"
                className="receivable-action-button receive"
                onClick={() =>
                  openPaymentModal(item)
                }
              >
                Pagar
              </button>
            )}

            {itemHasConfirmedPayments && (
              <button
                type="button"
                className="receivable-action-button reverse"
                onClick={() =>
                  handleReversePayment(item)
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
              !itemHasConfirmedPayments && (
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

            {!itemHasConfirmedPayments && (
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

  const editingHasPaymentHistory =
    hasPaymentHistory(
      editingPayable || {}
    );

  return (
    <div>
      <PageHeader
        title="Contas a Pagar"
        subtitle="Controle fornecedores, parcelas, vencimentos e pagamentos."
      >
        <Button onClick={openNewModal}>
          + Nova Conta a Pagar
        </Button>
      </PageHeader>

      <div className="receivable-stats-grid">
        <StatCard
          label="Valor lançado"
          value={formatCurrency(totalAmount)}
        />

        <StatCard
          label="Valor pago"
          value={formatCurrency(paidAmount)}
        />

        <StatCard
          label="Valor a pagar"
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
              Refine as despesas por situação,
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
              placeholder="Código, descrição, documento ou histórico..."
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
              <option value="pago">
                Pago
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
            Fornecedor

            <select
              name="supplier_id"
              value={filters.supplier_id}
              onChange={handleFilterChange}
            >
              <option value="">
                Todos
              </option>

              {suppliers.map((supplier) => (
                <option
                  key={supplier.id}
                  value={supplier.id}
                >
                  {supplier.name}
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
          {filteredPayables.length} de{" "}
          {pagination.total} conta(s)
          exibida(s)
        </div>
      </section>

      <div className="receivable-toolbar">
        <div>
          <h2>Lançamentos</h2>

          <p>
            Acompanhe valores pagos e
            pendentes por centro de custo.
          </p>
        </div>
      </div>

      {loading &&
      payables.length === 0 ? (
        <div className="receivable-loading">
          Carregando contas a pagar...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredPayables}
          emptyMessage="Nenhuma conta a pagar encontrada."
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
            {Math.max(pagination.totalPages, 1)}
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
            ? "Editar Conta a Pagar"
            : "Nova Conta a Pagar"
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
              name="supplier_id"
              value={form.supplier_id}
              onChange={handleChange}
            >
              <option value="">
                Selecione o fornecedor
              </option>

              {suppliers.map((supplier) => (
                <option
                  key={supplier.id}
                  value={supplier.id}
                >
                  {supplier.name}
                </option>
              ))}
            </select>

            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
            >
              <option value="">
                Selecione a categoria *
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
              name="document_number"
              placeholder="Número do documento"
              value={form.document_number}
              onChange={handleChange}
            />

            <input
              name="history_code"
              placeholder="Código do histórico"
              value={form.history_code}
              onChange={handleChange}
            />

            <input
              type="number"
              name="total_amount"
              placeholder="Valor total *"
              min="0.01"
              step="0.01"
              value={form.total_amount}
              onChange={handleChange}
              disabled={
                editingHasPaymentHistory
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
                editingHasPaymentHistory
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
                Competência
              </label>

              <input
                type="date"
                name="competence_date"
                value={
                  form.competence_date
                }
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
                  editingHasPaymentHistory
                }
              />
            </div>
          </FormGrid>

          {editingHasPaymentHistory && (
            <div className="receivable-warning">
              Esta conta possui histórico de
              pagamentos. O valor, as parcelas e o
              primeiro vencimento não podem mais ser
              alterados.
            </div>
          )}

          {!editingHasPaymentHistory &&
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
        title="Registrar Pagamento"
        isOpen={paymentModalOpen}
        onClose={closePaymentModal}
      >
        <form
          onSubmit={handlePaymentSubmit}
        >
          <div className="receipt-account-info">
            <span>Conta</span>

            <strong>
              {selectedPayable?.code} —{" "}
              {selectedPayable?.description}
            </strong>
          </div>

          <div className="receipt-form">
            <label>
              Parcela

              <select
                name="installment_id"
                value={
                  paymentForm.installment_id
                }
                onChange={
                  handlePaymentChange
                }
              >
                {getPendingInstallments(
                  selectedPayable || {}
                ).map((installment) => (
                  <option
                    key={installment.id}
                    value={installment.id}
                  >
                    Parcela{" "}
                    {
                      installment.installment_number
                    }{" "}
                    — vence em{" "}
                    {formatDate(
                      installment.due_date
                    )}{" "}
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
              Conta de saída

              <select
                name="financial_account_id"
                value={
                  paymentForm.financial_account_id
                }
                onChange={
                  handlePaymentChange
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
              Valor pago

              <input
                type="number"
                name="amount"
                min="0.01"
                step="0.01"
                value={paymentForm.amount}
                onChange={
                  handlePaymentChange
                }
              />
            </label>

            <label>
              Data do pagamento

              <input
                type="date"
                name="paid_date"
                value={
                  paymentForm.paid_date
                }
                onChange={
                  handlePaymentChange
                }
              />
            </label>

            <label>
              Forma de pagamento

              <select
                name="payment_method"
                value={
                  paymentForm.payment_method
                }
                onChange={
                  handlePaymentChange
                }
              >
                <option value="pix">
                  PIX
                </option>
                <option value="transferencia">
                  Transferência
                </option>
                <option value="boleto">
                  Boleto
                </option>
                <option value="dinheiro">
                  Dinheiro
                </option>
                <option value="outro">
                  Outro
                </option>
              </select>
            </label>

            <label>
              Observação

              <input
                type="text"
                name="note"
                value={paymentForm.note}
                onChange={
                  handlePaymentChange
                }
                placeholder="Observação do pagamento"
              />
            </label>
          </div>

          <div className="receivable-modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={closePaymentModal}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Registrando..."
                : "Confirmar Pagamento"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ContasPagar;
