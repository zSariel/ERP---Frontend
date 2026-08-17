import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

import api from "../services/api";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Não foi possível realizar o login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <video
        className="login-background-video"
        autoPlay
        muted
        loop
        playsInline
      >
        <source
          src="/video.mp4"
          type="video/mp4"
        />
      </video>

      <div className="login-overlay" />

      <section className="login-card">
        <div className="login-header">
          <h1>Entrar</h1>

          <p>
            Acesse sua conta para continuar
          </p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form
          className="login-form"
          onSubmit={handleLogin}
        >
          <div className="login-field">
            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              autoComplete="email"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">
              Senha
            </label>

            <div className="login-password">
              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="login-password-button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                aria-label={
                  showPassword
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {showPassword ? (
                  <FiEyeOff />
                ) : (
                  <FiEye />
                )}
              </button>
            </div>
          </div>

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Entrando..."
              : "Entrar"}
          </button>

          <div className="login-register">
            <span>
              Ainda não tem conta?
            </span>

            <Link to="/register">
              Criar conta
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

export default Login;