import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard.js";
import AppLayout from "./layouts/AppLayout";

import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Categorias from "./pages/Categorias";
import CentrosCusto from "./pages/CentrosCusto";
import ContasReceber from "./pages/ContasReceber";
import ContasPagar from "./pages/ContasPagar";
import ContasFinanceiras from "./pages/ContasFinanceiras";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/clientes"
            element={<Clientes />}
          />

          <Route
            path="/fornecedores"
            element={<Fornecedores />}
          />

          <Route
            path="/categorias"
            element={<Categorias />}
          />

          <Route
            path="/centros-custo"
            element={<CentrosCusto />}
          />

          <Route
            path="/contas-financeiras"
            element={<ContasFinanceiras />}
          />

          <Route
            path="/contas-receber"
            element={<ContasReceber />}
          />

          <Route
            path="/despesas"
            element={<ContasPagar />}
          />

          <Route
            path="/relatorios"
            element={<h1>Relatórios</h1>}
          />

          <Route
            path="/configuracoes"
            element={<h1>Configurações</h1>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
