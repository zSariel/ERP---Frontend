import api from "./api";

export function getReceivables(params = {}) {
  return api.get("/receivables", {
    params,
  });
}

export function getReceivablesSummary() {
  return api.get("/receivables/summary");
}

export function getReceivableById(id) {
  return api.get(`/receivables/${id}`);
}

export function createReceivable(data) {
  return api.post("/receivables", data);
}

export function updateReceivable(id, data) {
  return api.put(`/receivables/${id}`, data);
}

export function updateReceivableStatus(id, status) {
  return api.patch(`/receivables/${id}/status`, {
    status,
  });
}

export function receiveInstallment(
  installmentId,
  data
) {
  return api.patch(
    `/receivables/installments/${installmentId}/receive`,
    data
  );
}

export function reverseInstallmentReceipt(
  installmentId
) {
  return api.patch(
    `/receivables/installments/${installmentId}/reverse`
  );
}

export function reverseReceivablePayment(
  paymentId
) {
  return api.patch(
    `/receivables/payments/${paymentId}/reverse`
  );
}

export function bulkUpdateReceivableStatus(
  ids,
  status
) {
  return api.patch("/receivables/bulk/status", {
    ids,
    status,
  });
}

export function bulkReceiveReceivables(
  ids,
  data
) {
  return api.post("/receivables/bulk/receive", {
    ids,
    ...data,
  });
}

export function bulkDeleteReceivables(ids) {
  return api.delete("/receivables/bulk", {
    data: {
      ids,
    },
  });
}

export function deleteReceivable(id) {
  return api.delete(`/receivables/${id}`);
}
