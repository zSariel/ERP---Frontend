import api from "./api";

export function getCostCenters() {
  return api.get("/cost-centers");
}

export function createCostCenter(data) {
  return api.post("/cost-centers", data);
}

export function updateCostCenter(id, data) {
  return api.put(`/cost-centers/${id}`, data);
}

export function deleteCostCenter(id) {
  return api.delete(`/cost-centers/${id}`);
}