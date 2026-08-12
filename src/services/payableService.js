import api from "./api";

export function getPayables(params = {}) {
  return api.get("/payables", {
    params,
  });
}

export function getPayablesSummary() {
  return api.get("/payables/summary");
}

export function getPayableById(id) {
  return api.get(`/payables/${id}`);
}

export function createPayable(data) {
  return api.post("/payables", data);
}

export function updatePayable(id, data) {
  return api.put(`/payables/${id}`, data);
}

export function updatePayableStatus(id, status) {
  return api.patch(
    `/payables/${id}/status`,
    { status }
  );
}

export function payInstallment(
  installmentId,
  data
) {
  return api.patch(
    `/payables/installments/${installmentId}/pay`,
    data
  );
}

export function reversePayablePayment(
  paymentId
) {
  return api.patch(
    `/payables/payments/${paymentId}/reverse`
  );
}

export function deletePayable(id) {
  return api.delete(`/payables/${id}`);
}