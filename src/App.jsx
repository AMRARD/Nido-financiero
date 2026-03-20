import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

const HOY = new Date().toISOString().split("T")[0];

const LOGIN_VACIO = { email: "", password: "" };
const REGISTRO_VACIO = {
  nombre: "",
  email: "",
  password: "",
  confirmarPassword: "",
};

const INGRESO_VACIO = { descripcion: "", monto: "", fecha: HOY };
const GASTO_VACIO = { descripcion: "", monto: "", categoria: "General", fecha: HOY };
const CUENTA_VACIA = { nombre: "", tipo: "Banco", saldo: "" };
const DEUDA_VACIA = { nombre: "", saldo: "" };
const PRESUPUESTO_VACIO = { categoria: "", limite: "" };
const PAGO_DEUDA_VACIO = { cuentaId: "", deudaId: "", monto: "" };

const SECCIONES = [
  { id: "resumen", label: "Resumen" },
  { id: "ingresos", label: "Ingresos" },
  { id: "gastos", label: "Gastos" },
  { id: "cuentas", label: "Cuentas" },
  { id: "deudas", label: "Deudas" },
  { id: "presupuestos", label: "Presupuestos" },
  { id: "reportes", label: "Reportes" },
];

const COLORES = ["#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8"];

const formatoMoneda = (valor) =>
  new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0);

const formatoFecha = (fecha) => {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-DO");
};

function Campo({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${className}`}
      {...props}
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function BotonPrimario({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-2xl bg-slate-950 px-5 py-3 font-medium text-white transition hover:opacity-90 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function BotonSecundario({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function TarjetaResumen({ titulo, valor, color = "text-slate-950", subtitulo = "" }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <h3 className={`mt-2 text-3xl font-bold ${color}`}>{valor}</h3>
      {subtitulo ? <p className="mt-2 text-sm text-slate-400">{subtitulo}</p> : null}
    </div>
  );
}

function Panel({ titulo, descripcion = "", derecha = null, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{titulo}</h2>
          {descripcion ? <p className="mt-1 text-sm text-slate-500">{descripcion}</p> : null}
        </div>
        {derecha}
      </div>
      {children}
    </div>
  );
}

function ItemLista({ titulo, subtitulo, valor }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
      <div>
        <p className="font-medium text-slate-900">{titulo}</p>
        <p className="text-sm text-slate-500">{subtitulo}</p>
      </div>
      <p className="font-semibold text-slate-900">{valor}</p>
    </div>
  );
}

function EstadoVacio({ texto }) {
  return <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">{texto}</p>;
}

function Sidebar({ seccionActiva, setSeccionActiva, onCerrarSesion, currentUser }) {
  return (
    <aside className="flex h-full min-h-screen w-full flex-col justify-between rounded-r-3xl bg-slate-950 p-5 text-white lg:w-72">
      <div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">NIDO</p>
          <h1 className="mt-3 text-2xl font-bold">Financiero</h1>
          <p className="mt-2 text-sm text-slate-400">
            Panel bancario por secciones para administrar tu dinero.
          </p>
        </div>

        <div className="mt-6 space-y-2">
          {SECCIONES.map((item) => {
            const activo = seccionActiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSeccionActiva(item.id)}
                className={`flex w-full items-center rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  activo
                    ? "bg-white text-slate-950"
                    : "bg-slate-950 text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Sesión activa</p>
          <p className="mt-1 font-semibold">{currentUser?.nombre || currentUser?.email}</p>
          <p className="text-sm text-slate-400">{currentUser?.email}</p>
        </div>

        <BotonSecundario className="w-full" onClick={onCerrarSesion}>
          Cerrar sesión
        </BotonSecundario>
      </div>
    </aside>
  );
}

function AuthPanel({
  onLogin,
  onRegister,
  loginForm,
  setLoginForm,
  registerForm,
  setRegisterForm,
  mensajeAuth,
}) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-sm md:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">NIDO</p>
          <h1 className="mt-6 text-4xl font-bold md:text-5xl">Nido Financiero</h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">
            Un panel elegante para administrar ingresos, gastos, cuentas, deudas y
            presupuestos en un entorno visual tipo banca e inversiones.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Control total</p>
              <p className="mt-2 text-2xl font-bold">Tus finanzas en un solo lugar</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Acceso individual</p>
              <p className="mt-2 text-2xl font-bold">Cada usuario con su panel</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Panel titulo="Iniciar sesión" descripcion="Accede a tu panel financiero personal.">
            <div className="grid gap-3">
              <Campo
                placeholder="Correo"
                value={loginForm.email}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Campo
                type="password"
                placeholder="Contraseña"
                value={loginForm.password}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
              />
              <BotonPrimario onClick={onLogin}>Entrar</BotonPrimario>
            </div>
          </Panel>

          <Panel titulo="Crear usuario" descripcion="Registra una nueva cuenta en la plataforma.">
            <div className="grid gap-3 md:grid-cols-2">
              <Campo
                placeholder="Nombre"
                value={registerForm.nombre}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, nombre: e.target.value }))}
              />
              <Campo
                placeholder="Correo"
                value={registerForm.email}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Campo
                type="password"
                placeholder="Contraseña"
                value={registerForm.password}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
              />
              <Campo
                type="password"
                placeholder="Confirmar contraseña"
                value={registerForm.confirmarPassword}
                onChange={(e) =>
                  setRegisterForm((prev) => ({ ...prev, confirmarPassword: e.target.value }))
                }
              />
            </div>
            <BotonPrimario className="mt-4" onClick={onRegister}>
              Crear usuario
            </BotonPrimario>
          </Panel>

          {mensajeAuth ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              {mensajeAuth}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [loginForm, setLoginForm] = useState(LOGIN_VACIO);
  const [registerForm, setRegisterForm] = useState(REGISTRO_VACIO);
  const [mensajeAuth, setMensajeAuth] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [seccionActiva, setSeccionActiva] = useState("resumen");

  const [currentUser, setCurrentUser] = useState(null);

  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);

  const [nuevoIngreso, setNuevoIngreso] = useState(INGRESO_VACIO);
  const [nuevoGasto, setNuevoGasto] = useState(GASTO_VACIO);
  const [nuevaCuenta, setNuevaCuenta] = useState(CUENTA_VACIA);
  const [nuevaDeuda, setNuevaDeuda] = useState(DEUDA_VACIA);
  const [nuevoPresupuesto, setNuevoPresupuesto] = useState(PRESUPUESTO_VACIO);
  const [pagoDeuda, setPagoDeuda] = useState(PAGO_DEUDA_VACIO);

  const mostrarMensaje = (texto) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 3500);
  };

  const mostrarMensajeAuth = (texto) => {
    setMensajeAuth(texto);
    setTimeout(() => setMensajeAuth(""), 4000);
  };

  const limpiarDatos = () => {
    setCurrentUser(null);
    setIngresos([]);
    setGastos([]);
    setCuentas([]);
    setDeudas([]);
    setPresupuestos([]);
    setSeccionActiva("resumen");
  };

  const recargarTablas = async (userId) => {
    const [
      profileRes,
      ingresosRes,
      gastosRes,
      cuentasRes,
      deudasRes,
      presupuestosRes,
    ] = await Promise.allSettled([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("ingresos").select("*").eq("user_id", userId).order("id", { ascending: false }),
      supabase.from("gastos").select("*").eq("user_id", userId).order("id", { ascending: false }),
      supabase.from("cuentas").select("*").eq("user_id", userId).order("id", { ascending: false }),
      supabase.from("deudas").select("*").eq("user_id", userId).order("id", { ascending: false }),
      supabase
        .from("presupuestos")
        .select("*")
        .eq("user_id", userId)
        .order("id", { ascending: false }),
    ]);

    const profile = profileRes.status === "fulfilled" ? profileRes.value.data : null;
    const ingresosData = ingresosRes.status === "fulfilled" ? ingresosRes.value.data : [];
    const gastosData = gastosRes.status === "fulfilled" ? gastosRes.value.data : [];
    const cuentasData = cuentasRes.status === "fulfilled" ? cuentasRes.value.data : [];
    const deudasData = deudasRes.status === "fulfilled" ? deudasRes.value.data : [];
    const presupuestosData =
      presupuestosRes.status === "fulfilled" ? presupuestosRes.value.data : [];

    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            nombre: profile?.nombre || prev.nombre,
            email: profile?.email || prev.email,
          }
        : prev
    );

    setIngresos(ingresosData || []);
    setGastos(gastosData || []);
    setCuentas(cuentasData || []);
    setDeudas(deudasData || []);
    setPresupuestos(presupuestosData || []);
  };

  useEffect(() => {
    const iniciar = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        limpiarDatos();
        return;
      }

      const session = data?.session;

      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          nombre: session.user.user_metadata?.nombre || session.user.email || "",
          email: session.user.email || "",
        });
      } else {
        limpiarDatos();
      }
    };

    iniciar();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          nombre: session.user.user_metadata?.nombre || session.user.email || "",
          email: session.user.email || "",
        });
      } else {
        limpiarDatos();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    recargarTablas(currentUser.id);
  }, [currentUser?.id]);

  const totalIngresos = useMemo(
    () => ingresos.reduce((acc, item) => acc + (Number(item.monto) || 0), 0),
    [ingresos]
  );

  const totalGastos = useMemo(
    () => gastos.reduce((acc, item) => acc + (Number(item.monto) || 0), 0),
    [gastos]
  );

  const totalCuentas = useMemo(
    () => cuentas.reduce((acc, item) => acc + (Number(item.saldo) || 0), 0),
    [cuentas]
  );

  const totalDeudas = useMemo(
    () => deudas.reduce((acc, item) => acc + (Number(item.saldo) || 0), 0),
    [deudas]
  );

  const balance = useMemo(() => totalIngresos - totalGastos, [totalIngresos, totalGastos]);

  const movimientosRecientes = useMemo(() => {
    const movs = [
      ...ingresos.map((item) => ({
        id: `ingreso-${item.id}`,
        tipo: "Ingreso",
        titulo: item.descripcion,
        fecha: item.fecha,
        monto: Number(item.monto) || 0,
      })),
      ...gastos.map((item) => ({
        id: `gasto-${item.id}`,
        tipo: "Gasto",
        titulo: item.descripcion,
        fecha: item.fecha,
        monto: Number(item.monto) || 0,
      })),
    ];

    return movs
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
      .slice(0, 6);
  }, [ingresos, gastos]);

  const resumenPresupuestos = useMemo(() => {
    return presupuestos.map((p) => {
      const gastado = gastos
        .filter((g) => (g.categoria || "").toLowerCase() === (p.categoria || "").toLowerCase())
        .reduce((acc, item) => acc + (Number(item.monto) || 0), 0);

      const limite = Number(p.limite) || 0;
      const porcentaje = limite > 0 ? Math.min((gastado / limite) * 100, 100) : 0;

      return {
        ...p,
        gastado,
        porcentaje,
      };
    });
  }, [presupuestos, gastos]);

  const datosGraficaCategorias = useMemo(() => {
    const mapa = gastos.reduce((acc, item) => {
      const categoria = item.categoria || "General";
      acc[categoria] = (acc[categoria] || 0) + (Number(item.monto) || 0);
      return acc;
    }, {});

    return Object.entries(mapa).map(([name, value]) => ({ name, value }));
  }, [gastos]);

  const datosGraficaResumen = useMemo(
    () => [
      { name: "Ingresos", valor: totalIngresos },
      { name: "Gastos", valor: totalGastos },
      { name: "Cuentas", valor: totalCuentas },
      { name: "Deudas", valor: totalDeudas },
    ],
    [totalIngresos, totalGastos, totalCuentas, totalDeudas]
  );

  const crearUsuario = async () => {
    const nombre = registerForm.nombre.trim();
    const email = registerForm.email.trim();
    const password = registerForm.password;
    const confirmarPassword = registerForm.confirmarPassword;

    if (!nombre || !email || !password || !confirmarPassword) {
      mostrarMensajeAuth("Completa todos los campos del nuevo usuario.");
      return;
    }

    if (password !== confirmarPassword) {
      mostrarMensajeAuth("Las contraseñas no coinciden.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
      },
    });

    if (error) {
      mostrarMensajeAuth(error.message);
      return;
    }

    setRegisterForm(REGISTRO_VACIO);
    mostrarMensajeAuth("Usuario creado correctamente. Ahora inicia sesión.");
  };

  const iniciarSesion = async () => {
    const email = loginForm.email.trim();
    const password = loginForm.password;

    if (!email || !password) {
      mostrarMensajeAuth("Completa correo y contraseña.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      mostrarMensajeAuth(error.message);
      return;
    }

    if (data?.user) {
      setCurrentUser({
        id: data.user.id,
        nombre: data.user.user_metadata?.nombre || data.user.email || "",
        email: data.user.email || "",
      });
      setLoginForm(LOGIN_VACIO);
      setMensajeAuth("");
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    limpiarDatos();
  };

  const agregarIngreso = async () => {
    if (!currentUser?.id) {
      mostrarMensaje("No hay sesión activa.");
      return;
    }

    const descripcion = nuevoIngreso.descripcion.trim();
    const monto = Number(nuevoIngreso.monto);

    if (!descripcion || Number.isNaN(monto) || monto <= 0) {
      mostrarMensaje("Completa bien el ingreso.");
      return;
    }

    const { error } = await supabase.from("ingresos").insert([
      {
        user_id: currentUser.id,
        descripcion,
        monto,
        fecha: nuevoIngreso.fecha || HOY,
      },
    ]);

    if (error) {
      mostrarMensaje(`Error ingreso: ${error.message}`);
      return;
    }

    await recargarTablas(currentUser.id);
    setNuevoIngreso(INGRESO_VACIO);
    mostrarMensaje("Ingreso agregado correctamente.");
  };

  const agregarGasto = async () => {
    if (!currentUser?.id) {
      mostrarMensaje("No hay sesión activa.");
      return;
    }

    const descripcion = nuevoGasto.descripcion.trim();
    const monto = Number(nuevoGasto.monto);
    const categoria = nuevoGasto.categoria.trim() || "General";

    if (!descripcion || Number.isNaN(monto) || monto <= 0) {
      mostrarMensaje("Completa bien el gasto.");
      return;
    }

    const { error } = await supabase.from("gastos").insert([
      {
        user_id: currentUser.id,
        descripcion,
        monto,
        categoria,
        fecha: nuevoGasto.fecha || HOY,
      },
    ]);

    if (error) {
      mostrarMensaje(`Error gasto: ${error.message}`);
      return;
    }

    await recargarTablas(currentUser.id);
    setNuevoGasto(GASTO_VACIO);
    mostrarMensaje("Gasto agregado correctamente.");
  };

  const agregarCuenta = async () => {
    if (!currentUser?.id) {
      mostrarMensaje("No hay sesión activa.");
      return;
    }

    const nombre = nuevaCuenta.nombre.trim();
    const tipo = nuevaCuenta.tipo.trim() || "Banco";
    const saldo = Number(nuevaCuenta.saldo);

    if (!nombre || Number.isNaN(saldo) || saldo < 0) {
      mostrarMensaje("Completa bien la cuenta.");
      return;
    }

    const { error } = await supabase.from("cuentas").insert([
      {
        user_id: currentUser.id,
        nombre,
        tipo,
        saldo,
      },
    ]);

    if (error) {
      mostrarMensaje(`Error cuenta: ${error.message}`);
      return;
    }

    await recargarTablas(currentUser.id);
    setNuevaCuenta(CUENTA_VACIA);
    mostrarMensaje("Cuenta agregada correctamente.");
  };

  const agregarDeuda = async () => {
    if (!currentUser?.id) {
      mostrarMensaje("No hay sesión activa.");
      return;
    }

    const nombre = nuevaDeuda.nombre.trim();
    const saldo = Number(nuevaDeuda.saldo);

    if (!nombre || Number.isNaN(saldo) || saldo < 0) {
      mostrarMensaje("Completa bien la deuda.");
      return;
    }

    const { error } = await supabase.from("deudas").insert([
      {
        user_id: currentUser.id,
        nombre,
        saldo,
      },
    ]);

    if (error) {
      mostrarMensaje(`Error deuda: ${error.message}`);
      return;
    }

    await recargarTablas(currentUser.id);
    setNuevaDeuda(DEUDA_VACIA);
    mostrarMensaje("Deuda agregada correctamente.");
  };

  const agregarPresupuesto = async () => {
    if (!currentUser?.id) {
      mostrarMensaje("No hay sesión activa.");
      return;
    }

    const categoria = nuevoPresupuesto.categoria.trim();
    const limite = Number(nuevoPresupuesto.limite);

    if (!categoria || Number.isNaN(limite) || limite <= 0) {
      mostrarMensaje("Completa bien el presupuesto.");
      return;
    }

    const { error } = await supabase.from("presupuestos").insert([
      {
        user_id: currentUser.id,
        categoria,
        limite,
      },
    ]);

    if (error) {
      mostrarMensaje(`Error presupuesto: ${error.message}`);
      return;
    }

    await recargarTablas(currentUser.id);
    setNuevoPresupuesto(PRESUPUESTO_VACIO);
    mostrarMensaje("Presupuesto agregado correctamente.");
  };

  const pagarDeudaDesdeCuenta = async () => {
    if (!currentUser?.id) {
      mostrarMensaje("No hay sesión activa.");
      return;
    }

    const cuentaId = Number(pagoDeuda.cuentaId);
    const deudaId = Number(pagoDeuda.deudaId);
    const monto = Number(pagoDeuda.monto);

    if (!cuentaId || !deudaId || Number.isNaN(monto) || monto <= 0) {
      mostrarMensaje("Completa correctamente el pago de deuda.");
      return;
    }

    const cuenta = cuentas.find((c) => Number(c.id) === cuentaId);
    const deuda = deudas.find((d) => Number(d.id) === deudaId);

    if (!cuenta || !deuda) {
      mostrarMensaje("Selecciona una cuenta y una deuda válidas.");
      return;
    }

    const saldoCuenta = Number(cuenta.saldo) || 0;
    const saldoDeuda = Number(deuda.saldo) || 0;

    if (saldoCuenta < monto) {
      mostrarMensaje("La cuenta no tiene fondos suficientes.");
      return;
    }

    const nuevoSaldoCuenta = saldoCuenta - monto;
    const nuevoSaldoDeuda = Math.max(0, saldoDeuda - monto);

    const { error: errorCuenta } = await supabase
      .from("cuentas")
      .update({ saldo: nuevoSaldoCuenta })
      .eq("id", cuentaId)
      .eq("user_id", currentUser.id);

    if (errorCuenta) {
      mostrarMensaje(`Error al debitar cuenta: ${errorCuenta.message}`);
      return;
    }

    const { error: errorDeuda } = await supabase
      .from("deudas")
      .update({ saldo: nuevoSaldoDeuda })
      .eq("id", deudaId)
      .eq("user_id", currentUser.id);

    if (errorDeuda) {
      mostrarMensaje(`Error al acreditar deuda: ${errorDeuda.message}`);
      return;
    }

    await recargarTablas(currentUser.id);
    setPagoDeuda(PAGO_DEUDA_VACIO);
    mostrarMensaje("Pago de deuda aplicado correctamente.");
  };

  const renderGraficas = () => (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel titulo="Distribución de gastos por categoría" descripcion="Vista gráfica de tus categorías de gasto.">
        {datosGraficaCategorias.length ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datosGraficaCategorias}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label
                >
                  {datosGraficaCategorias.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORES[index % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatoMoneda(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EstadoVacio texto="Aún no hay datos suficientes para la gráfica de categorías." />
        )}
      </Panel>

      <Panel titulo="Comparativo financiero" descripcion="Resumen visual de ingresos, gastos, cuentas y deudas.">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGraficaResumen}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatoMoneda(value)} />
              <Legend />
              <Bar dataKey="valor" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );

  const renderResumen = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TarjetaResumen titulo="Ingresos totales" valor={formatoMoneda(totalIngresos)} />
        <TarjetaResumen titulo="Gastos totales" valor={formatoMoneda(totalGastos)} />
        <TarjetaResumen
          titulo="Balance"
          valor={formatoMoneda(balance)}
          color={balance >= 0 ? "text-emerald-600" : "text-red-600"}
        />
        <TarjetaResumen titulo="Saldo en cuentas" valor={formatoMoneda(totalCuentas)} />
      </div>

      {renderGraficas()}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel titulo="Movimientos recientes" descripcion="Últimos ingresos y gastos registrados.">
          {movimientosRecientes.length ? (
            <div className="space-y-3">
              {movimientosRecientes.map((mov) => (
                <ItemLista
                  key={mov.id}
                  titulo={mov.titulo}
                  subtitulo={`${mov.tipo} · ${formatoFecha(mov.fecha)}`}
                  valor={formatoMoneda(mov.monto)}
                />
              ))}
            </div>
          ) : (
            <EstadoVacio texto="Todavía no tienes movimientos registrados." />
          )}
        </Panel>

        <Panel titulo="Vista rápida" descripcion="Indicadores clave del panel.">
          <div className="grid gap-4">
            <TarjetaResumen titulo="Total de cuentas" valor={String(cuentas.length)} />
            <TarjetaResumen titulo="Total de deudas" valor={String(deudas.length)} />
            <TarjetaResumen titulo="Presupuestos activos" valor={String(presupuestos.length)} />
          </div>
        </Panel>
      </div>
    </div>
  );

  const renderIngresos = () => (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Panel titulo="Nuevo ingreso" descripcion="Registra una entrada de dinero.">
        <div className="grid gap-3">
          <Campo
            placeholder="Descripción"
            value={nuevoIngreso.descripcion}
            onChange={(e) => setNuevoIngreso((prev) => ({ ...prev, descripcion: e.target.value }))}
          />
          <Campo
            type="number"
            placeholder="Monto"
            value={nuevoIngreso.monto}
            onChange={(e) => setNuevoIngreso((prev) => ({ ...prev, monto: e.target.value }))}
          />
          <Campo
            type="date"
            value={nuevoIngreso.fecha}
            onChange={(e) => setNuevoIngreso((prev) => ({ ...prev, fecha: e.target.value || HOY }))}
          />
          <BotonPrimario onClick={agregarIngreso}>Guardar ingreso</BotonPrimario>
        </div>
      </Panel>

      <Panel titulo="Historial de ingresos" descripcion="Tus ingresos registrados más recientes.">
        {ingresos.length ? (
          <div className="space-y-3">
            {ingresos.map((item) => (
              <ItemLista
                key={item.id}
                titulo={item.descripcion}
                subtitulo={formatoFecha(item.fecha)}
                valor={formatoMoneda(item.monto)}
              />
            ))}
          </div>
        ) : (
          <EstadoVacio texto="No hay ingresos registrados." />
        )}
      </Panel>
    </div>
  );

  const renderGastos = () => (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Panel titulo="Nuevo gasto" descripcion="Registra una salida de dinero.">
        <div className="grid gap-3">
          <Campo
            placeholder="Descripción"
            value={nuevoGasto.descripcion}
            onChange={(e) => setNuevoGasto((prev) => ({ ...prev, descripcion: e.target.value }))}
          />
          <Campo
            placeholder="Categoría"
            value={nuevoGasto.categoria}
            onChange={(e) => setNuevoGasto((prev) => ({ ...prev, categoria: e.target.value }))}
          />
          <Campo
            type="number"
            placeholder="Monto"
            value={nuevoGasto.monto}
            onChange={(e) => setNuevoGasto((prev) => ({ ...prev, monto: e.target.value }))}
          />
          <Campo
            type="date"
            value={nuevoGasto.fecha}
            onChange={(e) => setNuevoGasto((prev) => ({ ...prev, fecha: e.target.value || HOY }))}
          />
          <BotonPrimario onClick={agregarGasto}>Guardar gasto</BotonPrimario>
        </div>
      </Panel>

      <Panel titulo="Historial de gastos" descripcion="Tus gastos registrados más recientes.">
        {gastos.length ? (
          <div className="space-y-3">
            {gastos.map((item) => (
              <ItemLista
                key={item.id}
                titulo={item.descripcion}
                subtitulo={`${item.categoria} · ${formatoFecha(item.fecha)}`}
                valor={formatoMoneda(item.monto)}
              />
            ))}
          </div>
        ) : (
          <EstadoVacio texto="No hay gastos registrados." />
        )}
      </Panel>
    </div>
  );

  const renderCuentas = () => (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Panel titulo="Nueva cuenta" descripcion="Agrega una cuenta bancaria, ahorro o caja.">
        <div className="grid gap-3">
          <Campo
            placeholder="Nombre"
            value={nuevaCuenta.nombre}
            onChange={(e) => setNuevaCuenta((prev) => ({ ...prev, nombre: e.target.value }))}
          />
          <Campo
            placeholder="Tipo"
            value={nuevaCuenta.tipo}
            onChange={(e) => setNuevaCuenta((prev) => ({ ...prev, tipo: e.target.value }))}
          />
          <Campo
            type="number"
            placeholder="Saldo"
            value={nuevaCuenta.saldo}
            onChange={(e) => setNuevaCuenta((prev) => ({ ...prev, saldo: e.target.value }))}
          />
          <BotonPrimario onClick={agregarCuenta}>Guardar cuenta</BotonPrimario>
        </div>
      </Panel>

      <Panel titulo="Cuentas registradas" descripcion="Visualiza el balance por cuenta.">
        {cuentas.length ? (
          <div className="space-y-3">
            {cuentas.map((item) => (
              <ItemLista
                key={item.id}
                titulo={item.nombre}
                subtitulo={item.tipo}
                valor={formatoMoneda(item.saldo)}
              />
            ))}
          </div>
        ) : (
          <EstadoVacio texto="No hay cuentas registradas." />
        )}
      </Panel>
    </div>
  );

  const renderDeudas = () => (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel titulo="Nueva deuda" descripcion="Agrega una deuda para dar seguimiento.">
          <div className="grid gap-3">
            <Campo
              placeholder="Nombre"
              value={nuevaDeuda.nombre}
              onChange={(e) => setNuevaDeuda((prev) => ({ ...prev, nombre: e.target.value }))}
            />
            <Campo
              type="number"
              placeholder="Saldo"
              value={nuevaDeuda.saldo}
              onChange={(e) => setNuevaDeuda((prev) => ({ ...prev, saldo: e.target.value }))}
            />
            <BotonPrimario onClick={agregarDeuda}>Guardar deuda</BotonPrimario>
          </div>
        </Panel>

        <Panel titulo="Deudas registradas" descripcion="Controla el saldo pendiente de cada deuda.">
          {deudas.length ? (
            <div className="space-y-3">
              {deudas.map((item) => (
                <ItemLista
                  key={item.id}
                  titulo={item.nombre}
                  subtitulo="Deuda activa"
                  valor={formatoMoneda(item.saldo)}
                />
              ))}
            </div>
          ) : (
            <EstadoVacio texto="No hay deudas registradas." />
          )}
        </Panel>
      </div>

      <Panel titulo="Debitar deuda desde una cuenta" descripcion="Descuenta dinero de una cuenta y reduce el saldo de una deuda.">
        <div className="grid gap-3 md:grid-cols-3">
          <Select
            value={pagoDeuda.cuentaId}
            onChange={(e) => setPagoDeuda((prev) => ({ ...prev, cuentaId: e.target.value }))}
          >
            <option value="">Selecciona cuenta</option>
            {cuentas.map((cuenta) => (
              <option key={cuenta.id} value={cuenta.id}>
                {cuenta.nombre}
              </option>
            ))}
          </Select>

          <Select
            value={pagoDeuda.deudaId}
            onChange={(e) => setPagoDeuda((prev) => ({ ...prev, deudaId: e.target.value }))}
          >
            <option value="">Selecciona deuda</option>
            {deudas.map((deuda) => (
              <option key={deuda.id} value={deuda.id}>
                {deuda.nombre}
              </option>
            ))}
          </Select>

          <Campo
            type="number"
            placeholder="Monto a pagar"
            value={pagoDeuda.monto}
            onChange={(e) => setPagoDeuda((prev) => ({ ...prev, monto: e.target.value }))}
          />
        </div>

        <BotonPrimario className="mt-4" onClick={pagarDeudaDesdeCuenta}>
          Aplicar pago de deuda
        </BotonPrimario>
      </Panel>
    </div>
  );

  const renderPresupuestos = () => (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Panel titulo="Nuevo presupuesto" descripcion="Define un límite por categoría.">
        <div className="grid gap-3">
          <Campo
            placeholder="Categoría"
            value={nuevoPresupuesto.categoria}
            onChange={(e) => setNuevoPresupuesto((prev) => ({ ...prev, categoria: e.target.value }))}
          />
          <Campo
            type="number"
            placeholder="Límite"
            value={nuevoPresupuesto.limite}
            onChange={(e) => setNuevoPresupuesto((prev) => ({ ...prev, limite: e.target.value }))}
          />
          <BotonPrimario onClick={agregarPresupuesto}>Guardar presupuesto</BotonPrimario>
        </div>
      </Panel>

      <Panel titulo="Presupuestos activos" descripcion="Compara tu gasto real contra tu límite.">
        {resumenPresupuestos.length ? (
          <div className="space-y-4">
            {resumenPresupuestos.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="font-medium text-slate-900">{item.categoria}</p>
                  <p className="text-sm text-slate-500">
                    {formatoMoneda(item.gastado)} / {formatoMoneda(item.limite)}
                  </p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      item.porcentaje >= 100
                        ? "bg-red-500"
                        : item.porcentaje >= 70
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${item.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EstadoVacio texto="No hay presupuestos registrados." />
        )}
      </Panel>
    </div>
  );

  const renderReportes = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TarjetaResumen titulo="Ingresos" valor={formatoMoneda(totalIngresos)} />
        <TarjetaResumen titulo="Gastos" valor={formatoMoneda(totalGastos)} />
        <TarjetaResumen titulo="Cuentas" valor={formatoMoneda(totalCuentas)} />
        <TarjetaResumen titulo="Deudas" valor={formatoMoneda(totalDeudas)} color="text-red-600" />
      </div>
      {renderGraficas()}
    </div>
  );

  const renderContenido = () => {
    switch (seccionActiva) {
      case "ingresos":
        return renderIngresos();
      case "gastos":
        return renderGastos();
      case "cuentas":
        return renderCuentas();
      case "deudas":
        return renderDeudas();
      case "presupuestos":
        return renderPresupuestos();
      case "reportes":
        return renderReportes();
      case "resumen":
      default:
        return renderResumen();
    }
  };

  if (!currentUser) {
    return (
      <AuthPanel
        onLogin={iniciarSesion}
        onRegister={crearUsuario}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        registerForm={registerForm}
        setRegisterForm={setRegisterForm}
        mensajeAuth={mensajeAuth}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[18rem_1fr]">
        <Sidebar
          seccionActiva={seccionActiva}
          setSeccionActiva={setSeccionActiva}
          onCerrarSesion={cerrarSesion}
          currentUser={currentUser}
        />

        <main className="p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Panel financiero</p>
                  <h1 className="mt-1 text-3xl font-bold text-slate-950">
                    {SECCIONES.find((s) => s.id === seccionActiva)?.label || "Resumen"}
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Bienvenido, {currentUser.nombre || currentUser.email}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
                  <p className="text-sm text-slate-300">Saldo consolidado</p>
                  <p className="mt-1 text-2xl font-bold">{formatoMoneda(totalCuentas - totalDeudas)}</p>
                </div>
              </div>

              {mensaje ? (
                <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {mensaje}
                </div>
              ) : null}
            </div>

            {renderContenido()}
          </div>
        </main>
      </div>
    </div>
  );
}