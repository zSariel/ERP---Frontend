import { useState } from "react";
import api from "../services/api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao cadastrar");
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input
        placeholder="Nome"
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Senha"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">Cadastrar</button>
    </form>
  );
}

export default Register;
