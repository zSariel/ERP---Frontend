import api from "./api";

export function getClients() {
  return api.get("/clients");
}

export function createClient(data) {
  return api.post("/clients", data);
}

export function updateClient(id, data) {
  return api.put(`/clients/${id}`, data);
}

export function deleteClient(id) {
  return api.delete(`/clients/${id}`);
}