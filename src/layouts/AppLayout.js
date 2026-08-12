import { Link, Outlet, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaBuilding,
  FaFolderOpen,
  FaMoneyBillWave,
  FaChartBar,
  FaCog,
  FaTags,
  FaSignOutAlt,
} from "react-icons/fa";

import "./AppLayout.css";
import {FaUniversity,} from "react-icons/fa";

function AppLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <span>🪙</span>
          <h2>Arcadia ERP</h2>
        </div>

        <nav className="menu">
          <Link to="/dashboard">
            <FaHome />
            Dashboard
          </Link>

          <p className="menu-title">Cadastros</p>

          <Link to="/clientes">
            <FaUsers />
            Clientes
          </Link>

          <Link to="/fornecedores">
            <FaBuilding />
            Fornecedores
          </Link>

          <p className="menu-title">Financeiro</p>

          <Link to="./contas-receber">
            <FaMoneyBillWave />
            Receitas
          </Link>

          <Link to="/despesas">
            <FaMoneyBillWave />
            Despesas
          </Link>
          
          <Link to="/centros-custo">
            <FaFolderOpen />
            Centros de Custo
          </Link>

          <Link to="/contas-financeiras">
            <FaUniversity />
            Contas Financeiras
          </Link>

          <p className="menu-title">Relatórios</p>

          <Link to="/relatorios">
            <FaChartBar />
            Relatórios
          </Link>
          
          <Link to="/categorias">
            <FaTags />
            Categorias
          </Link>

          <p className="menu-title">Sistema</p>

          <Link to="/configuracoes">
            <FaCog />
            Configurações
          </Link>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h3>Arcadia ERP</h3>
            <small>Sistema de Gestão Financeira Empresarial</small>
          </div>

          <button onClick={handleLogout} className="logout-button">
            <FaSignOutAlt />
            Sair
          </button>
        </header>

        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default AppLayout;