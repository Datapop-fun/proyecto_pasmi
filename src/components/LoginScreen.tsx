"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Shield, Sparkles } from "lucide-react";
import styles from "./LoginScreen.module.css";
import { useAuth } from "@/state/auth";

const LOGO_URL = "https://ia600704.us.archive.org/15/items/logo-pasmi-nuevo-mesa-de-trabajo-1/Logo%20Pasmi%20nuevo_Mesa%20de%20trabajo%201.png";

export function LoginScreen() {
  const { login, isLoggedIn } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      setLoading(false);
      router.replace("/vender");
    }
  }, [isLoggedIn, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(false);

    if (user === "PASMI" && pass === "PASMI") {
      setLoading(true);
      setTimeout(() => {
        login();
        setLoading(false);
      }, 800);
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginBackdrop}>
      <div className={styles.glow} />
      <div className={styles.card}>
        <img src={LOGO_URL} alt="PASMI Logo" className={styles.logo} />
        <p className={styles.kicker}>Panel Administrativo</p>
        <h1 className={styles.title}>Ingresa con tus credenciales</h1>
        <p className={styles.subtitle}>
          Acceso seguro para gestionar ventas, inventario y reportes en tiempo real.
        </p>

        <div className={styles.features}>
          <div className={styles.featureTag}>
            <Shield size={14} />
            Sesión segura
          </div>
          <div className={styles.featureTag}>
            <Sparkles size={14} />
            Datos sincronizados
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className={styles.input}
            placeholder="Usuario"
            autoComplete="off"
          />
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className={styles.input}
            placeholder="Contraseña"
          />
          {error && (
            <div className={styles.error}>Credenciales incorrectas</div>
          )}
          <button type="submit" className={styles.button} disabled={loading}>
            Ingresar
            <LogIn size={16} />
          </button>
        </form>

        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            Cargando sistema...
          </div>
        )}
      </div>
      <p className={styles.footer}>PASMI POS · Acceso interno</p>
    </div>
  );
}
