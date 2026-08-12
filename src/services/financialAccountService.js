import api from "./api";

export function getFinancialAccounts() {
  return api.get("/financial-accounts");
}

export function getFinancialAccountById(id) {
  return api.get(`/financial-accounts/${id}`);
}

export function createFinancialAccount(data) {
  return api.post("/financial-accounts", data);
}

export function updateFinancialAccount(id, data) {
  return api.put(
    `/financial-accounts/${id}`,
    data
  );
}

export function updateFinancialAccountStatus(
  id,
  active
) {
  return api.patch(
    `/financial-accounts/${id}/status`,
    {
      active,
    }
  );
}

export function deleteFinancialAccount(id) {
  return api.delete(
    `/financial-accounts/${id}`
  );
}
