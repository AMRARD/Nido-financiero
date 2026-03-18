import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { supabase } from "./supabase";
 
const HOY = new Date().toISOString().split("T")[0];
const COLORES = ["#0f172a", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1"];
 
const TIPOS_REPORTE = [
  { value: "diario", label: "Diario" },
  { value: "semanal", label: "Semanal" },
  { value: "mensual", label: "Mensual" },
  { value: "anual", label: "Anual" },
];
 
const LOGIN_VACIO = { email: "", password: "" };
const REGISTRO_VACIO = { nombre: "", email: "", password: "", confirmarPassword: "" };
const INGRESO_VACIO = { descripcion: "", monto: "", fecha: HOY };
const GASTO_VACIO = { descripcion: "", monto: "", categoria: "General", cuentaId: "", fecha: HOY };
const CUENTA_VACIA = { nombre: "", tipo: "Banco", saldo: "" };
const DEUDA_VACIA = { nombre: "", saldo: "" };
const PRESUPUESTO_VACIO = { categoria: "", limite: "" };
const MOVIMIENTO_VACIO = { origenId: "", destinoId: "", monto: "" };
const PAGO_DEUDA_VACIO = { cuentaId: "", deudaId: "", monto: "" };
 
const formatoMoneda = (valor) =>
  new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0);
 
const normalizarFecha = (fecha) => {
  if (!fecha) return HOY;
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return HOY;
  return valor.toISOString().split("T")[0];
};
 
const obtenerInicioSemana = (fecha) => {
  const base = new Date(`${normalizarFecha(fecha)}T00:00:00`);
  const dia = base.getDay();
  const ajuste = dia === 0 ? -6 : 1 - dia;
  base.setDate(base.getDate() + ajuste);
  return base.toISOString().split("T")[0];
};
 
const obtenerClavePeriodo = (fecha, tipo) => {
  const fechaNormalizada = normalizarFecha(fecha);
  const [year, month] = fechaNormalizada.split("-");
  if (tipo === "diario") return fechaNormalizada;
  if (tipo === "semanal") return obtenerInicioSemana(fechaNormalizada);
  if (tipo === "mensual") return `${year}-${month}`;
  return year;
};
 
const filtrarPorPeriodo = (items, tipo, referencia) => {
  const claveActual = obtenerClavePeriodo(referencia, tipo);
  return items.filter((item) => obtenerClavePeriodo(item.fecha, tipo) === claveActual);
};
 
const totalizarPorCategoria = (items) => {
  const mapa = items.reduce((acc, item) => {
    const categoria = item.categoria || "General";
    acc[categoria] = (acc[categoria] || 0) + (Number(item.monto) || 0);
    return acc;
  }, {});
  return Object.entries(mapa).map(([categoria, monto]) => ({ categoria, monto }));
};
 
function Campo({ className = "", ...props }) {
  return (
    <input
      className={`rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 ${className}`}
      {...props}
    />
  );
}
 
function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
 
function TarjetaResumen({ titulo, valor, color = "text-slate-900" }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <h2 className={`mt-2 text-2xl font-bold ${color}`}>{valor}</h2>
    </div>
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
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Nido</p>
          <h1 className="mt-4 text-4xl font-bold">Nido Financiero</h1>
          <p className="mt-4 text-slate-300">
            Sistema en la nube para ingresos, gastos, presupuestos, cuentas, deudas y reportes.
          </p>
          <div className="mt-8 rounded-3xl border border-slate-700 bg-slate-800 p-5">
            <p className="text-sm text-slate-300">Acceso con Supabase</p>
            <p className="mt-2 text-sm">Crea tu usuario con correo y contraseña.</p>
            <p className="text-sm">Luego entra desde cualquier dispositivo.</p>
          </div>
        </div>
 
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
            <div className="mt-4 grid gap-3">
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
              <button
                onClick={onLogin}
                className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white hover:opacity-90"
              >
                Entrar
              </button>
            </div>
          </div>
 
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Crear usuario</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
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
            <button
              onClick={onRegister}
              className="mt-4 rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white hover:opacity-90"
            >
              Crear usuario
            </button>
          </div>
 
          {mensajeAuth ? (
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              {mensajeAuth}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
 
export default function PresupuestoWeb() {
  const [loginForm, setLoginForm] = useState(LOGIN_VACIO);
  const [registerForm, setRegisterForm] = useState(REGISTRO_VACIO);
  const [mensajeAuth, setMensajeAuth] = useState("");
  const [mensaje, setMensaje] = useState("");
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
  const [movimiento, setMovimiento] = useState(MOVIMIENTO_VACIO);
  const [pagoDeuda, setPagoDeuda] = useState(PAGO_DEUDA_VACIO);
  const [filtro, setFiltro] = useState("Todos");
  const [tipoReporte, setTipoReporte] = useState("mensual");
  const [fechaReporte, setFechaReporte] = useState(HOY);
 
  const mostrarMensaje = (texto) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 2500);
  };
 
  const mostrarMensajeAuth = (texto) => {
    setMensajeAuth(texto);
    setTimeout(() => setMensajeAuth(""), 3500);
  };
 
  const cargarSesionActual = async () => {
    const { data: authData } = await supabase.auth.getUser();
 
    if (!authData.user) {
      setCurrentUser(null);
      setIngresos([]);
      setGastos([]);
      setCuentas([]);
      setDeudas([]);
      setPresupuestos([]);
      return;
    }
 
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();
 
    setCurrentUser({
      id: authData.user.id,
      nombre: profileData?.nombre || authData.user.email,
      email: authData.user.email,
    });
  };
 
  const cargarDatosUsuario = async (userId) => {
    const [
      { data: ingresosData, error: ingresosError },
      { data: gastosData, error: gastosError },
      { data: cuentasData, error: cuentasError },
      { data: deudasData, error: deudasError },
      { data: presupuestosData, error: presupuestosError },
    ] = await Promise.all([
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
 
    const primerError =
      ingresosError || gastosError || cuentasError || deudasError || presupuestosError;
 
    if (primerError) {
      mostrarMensaje(primerError.message);
      return;
    }
 
    setIngresos((ingresosData || []).map((item) => ({ ...item, fecha: normalizarFecha(item.fecha) })));
    setGastos((gastosData || []).map((item) => ({ ...item, fecha: normalizarFecha(item.fecha) })));
    setCuentas(cuentasData || []);
    setDeudas(deudasData || []);
    setPresupuestos(presupuestosData || []);
  };
 
  useEffect(() => {
    const iniciar = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        await cargarSesionActual();
        await cargarDatosUsuario(authData.user.id);
      }
    };
 
    iniciar();
 
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await cargarSesionActual();
        await cargarDatosUsuario(session.user.id);
      } else {
        setCurrentUser(null);
        setIngresos([]);
        setGastos([]);
        setCuentas([]);
        setDeudas([]);
        setPresupuestos([]);
      }
    });
 
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);
 
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
 
    if (data.user) {
      await cargarSesionActual();
      await cargarDatosUsuario(data.user.id);
      setLoginForm(LOGIN_VACIO);
      setFiltro("Todos");
      setTipoReporte("mensual");
      setFechaReporte(HOY);
    }
  };
 
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
 
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
 
    if (error) {
      mostrarMensajeAuth(error.message);
      return;
    }
 
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        nombre,
        email,
      });
 
      if (profileError) {
        mostrarMensajeAuth(profileError.message);
        return;
      }
    }
 
    setRegisterForm(REGISTRO_VACIO);
    mostrarMensajeAuth("Usuario creado correctamente. Si Supabase exige confirmación, revisa tu correo.");
  };
 
  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIngresos([]);
    setGastos([]);
    setCuentas([]);
    setDeudas([]);
    setPresupuestos([]);
    setFiltro("Todos");
    setTipoReporte("mensual");
    setFechaReporte(HOY);
    setNuevoIngreso(INGRESO_VACIO);
    setNuevoGasto(GASTO_VACIO);
    setNuevaCuenta(CUENTA_VACIA);
    setNuevaDeuda(DEUDA_VACIA);
    setNuevoPresupuesto(PRESUPUESTO_VACIO);
    setMovimiento(MOVIMIENTO_VACIO);
    setPagoDeuda(PAGO_DEUDA_VACIO);
  };
 
  const agregarIngreso = async () => {
    const descripcion = nuevoIngreso.descripcion.trim();
    const monto = Number(nuevoIngreso.monto);
 
    if (!currentUser || !descripcion || monto <= 0 || Number.isNaN(monto)) return;
 
    const { error } = await supabase.from("ingresos").insert({
      user_id: currentUser.id,
      descripcion,
      monto,
      fecha: normalizarFecha(nuevoIngreso.fecha),
    });
 
    if (error) {
      mostrarMensaje(error.message);
      return;
    }
 
    await cargarDatosUsuario(currentUser.id);
    setNuevoIngreso(INGRESO_VACIO);
    mostrarMensaje("Ingreso agregado correctamente.");
  };
 
  const agregarGasto = async () => {
    const descripcion = nuevoGasto.descripcion.trim();
    const categoria = nuevoGasto.categoria.trim() || "General";
    const monto = Number(nuevoGasto.monto);
    const cuentaId = Number(nuevoGasto.cuentaId);
 
    if (!currentUser || !descripcion || monto <= 0 || Number.isNaN(monto)) return;
 
    const cuenta = cuentaId ? cuentas.find((item) => item.id === cuentaId) : null;
 
    if (cuentaId && (!cuenta || Number(cuenta.saldo) < monto)) {
      mostrarMensaje("Fondos insuficientes en la cuenta seleccionada.");
      return;
    }
 
    const { error: gastoError } = await supabase.from("gastos").insert({
      user_id: currentUser.id,
      descripcion,
      monto,
      categoria,
      fecha: normalizarFecha(nuevoGasto.fecha),
    });
 
    if (gastoError) {
      mostrarMensaje(gastoError.message);
      return;
    }
 
    if (cuentaId) {
      const { error: cuentaError } = await supabase
        .from("cuentas")
        .update({ saldo: Number(cuenta.saldo) - monto })
        .eq("id", cuentaId)
        .eq("user_id", currentUser.id);
 
      if (cuentaError) {
        mostrarMensaje(cuentaError.message);
        return;
      }
    }
 
    await cargarDatosUsuario(currentUser.id);
    setNuevoGasto(GASTO_VACIO);
    mostrarMensaje("Gasto agregado correctamente.");
  };
 
  const agregarCuenta = async () => {
    const nombre = nuevaCuenta.nombre.trim();
    const tipo = nuevaCuenta.tipo.trim() || "Banco";
    const saldo = Number(nuevaCuenta.saldo);
 
    if (!currentUser || !nombre || saldo < 0 || Number.isNaN(saldo)) return;
 
    const { error } = await supabase.from("cuentas").insert({
      user_id: currentUser.id,
      nombre,
      tipo,
      saldo,
    });
 
    if (error) {
      mostrarMensaje(error.message);
      return;
    }
 
    await cargarDatosUsuario(currentUser.id);
    setNuevaCuenta(CUENTA_VACIA);
    mostrarMensaje("Cuenta agregada correctamente.");
  };
 
  const agregarDeuda = async () => {
    const nombre = nuevaDeuda.nombre.trim();
    const saldo = Number(nuevaDeuda.saldo);
 
    if (!currentUser || !nombre || saldo < 0 || Number.isNaN(saldo)) return;
 
    const { error } = await supabase.from("deudas").insert({
      user_id: currentUser.id,
      nombre,
      saldo,
    });
 
    if (error) {
      mostrarMensaje(error.message);
      return;
    }
 
    await cargarDatosUsuario(currentUser.id);
    setNuevaDeuda(DEUDA_VACIA);
    mostrarMensaje("Deuda agregada correctamente.");
  };
 
  const agregarPresupuesto = async () => {
    const categoria = nuevoPresupuesto.categoria.trim();
    const limite = Number(nuevoPresupuesto.limite);
 
    if (!currentUser || !categoria || limite <= 0 || Number.isNaN(limite)) return;
 
    const { error } = await supabase.from("presupuestos").insert({
      user_id: currentUser.id,
      categoria,
      limite,
    });
 
    if (error) {
      mostrarMensaje(error.message);
      return;
    }
 
    await cargarDatosUsuario(currentUser.id);
    setNuevoPresupuesto(PRESUPUESTO_VACIO);
    mostrarMensaje("Presupuesto agregado correctamente.");
  };
 
  const moverDinero = async () => {
    const origenId = Number(movimiento.origenId);
    const destinoId = Number(movimiento.destinoId);
    const monto = Number(movimiento.monto);
 
    if (!currentUser || !origenId || !destinoId || origenId === destinoId || monto <= 0 || Number.isNaN(monto)) return;
 
    const origen = cuentas.find((item) => item.id === origenId);
    const destino = cuentas.find((item) => item.id === destinoId);
 
    if (!origen || !destino) return;
 
    if (Number(origen.saldo) < monto) {
      mostrarMensaje("La cuenta de origen no tiene fondos suficientes.");
      return;
    }
 
    const { error: errorOrigen } = await supabase
      .from("cuentas")
      .update({ saldo: Number(origen.saldo) - monto })
      .eq("id", origenId)
      .eq("user_id", currentUser.id);
 
    if (errorOrigen) {
      mostrarMensaje(errorOrigen.message);
      return;
    }
 
    const { error: errorDestino } = await supabase
      .from("cuentas")
      .update({ saldo: Number(destino.saldo) + monto })
      .eq("id", destinoId)
      .eq("user_id", currentUser.id);
 
    if (errorDestino) {
      mostrarMensaje(errorDestino.message);
      return;
    }
 
    await cargarDatosUsuario(currentUser.id);
    setMovimiento(MOVIMIENTO_VACIO);
    mostrarMensaje("Movimiento realizado correctamente.");
  };
 
  const pagarDeudaDesdeCuenta = async () => {
    const cuentaId = Number(pagoDeuda.cuentaId);
    const deudaId = Number(pagoDeuda.deudaId);
    const monto = Number(pagoDeuda.monto);
 
    if (!currentUser || !cuentaId || !deudaId || monto <= 0 || Number.isNaN(monto)) return;
 
    const cuenta = cuentas.find((item) => item.id === cuentaId);
    const deuda = deudas.find((item) => item.id === deudaId);
 
    if (!cuenta || !deuda) return;
 
    if (Number(cuenta.saldo) < monto) {
      mostrarMensaje("La cuenta seleccionada no tiene fondos suficientes.");
      return;
    }
 
    const { error: errorCuenta } = await supabase
      .from("cuentas")
      .update({ saldo: Number(cuenta.saldo) - monto })
      .eq("id", cuentaId)
      .eq("user_id", currentUser.id);
 
    if (errorCuenta) {
      mostrarMensaje(errorCuenta.message);
      return;
    }
 
    const { error: errorDeuda } = await supabase
      .from("deudas")
      .update({ saldo: Math.max(0, Number(deuda.saldo) - monto) })
      .eq("id", deudaId)
      .eq("user_id", currentUser.id);
 
    if (errorDeuda) {
      mostrarMensaje(errorDeuda.message);
      return;
    }
 
    await cargarDatosUsuario(currentUser.id);
    setPagoDeuda(PAGO_DEUDA_VACIO);
    mostrarMensaje("Pago aplicado correctamente a la deuda.");
  };
 
  const eliminarIngreso = async (id) => {
    if (!currentUser) return;
    const { error } = await supabase.from("ingresos").delete().eq("id", id).eq("user_id", currentUser.id);
    if (error) return mostrarMensaje(error.message);
    await cargarDatosUsuario(currentUser.id);
  };
 
  const eliminarGasto = async (id) => {
    if (!currentUser) return;
    const { error } = await supabase.from("gastos").delete().eq("id", id).eq("user_id", currentUser.id);
    if (error) return mostrarMensaje(error.message);
    await cargarDatosUsuario(currentUser.id);
  };
 
  const eliminarCuenta = async (id) => {
    if (!currentUser) return;
    const { error } = await supabase.from("cuentas").delete().eq("id", id).eq("user_id", currentUser.id);
    if (error) return mostrarMensaje(error.message);
    await cargarDatosUsuario(currentUser.id);
  };
 
  const eliminarDeuda = async (id) => {
    if (!currentUser) return;
    const { error } = await supabase.from("deudas").delete().eq("id", id).eq("user_id", currentUser.id);
    if (error) return mostrarMensaje(error.message);
    await cargarDatosUsuario(currentUser.id);
  };
 
  const eliminarPresupuesto = async (id) => {
    if (!currentUser) return;
    const { error } = await supabase.from("presupuestos").delete().eq("id", id).eq("user_id", currentUser.id);
    if (error) return mostrarMensaje(error.message);
    await cargarDatosUsuario(currentUser.id);
  };
 
  const totalIngresos = useMemo(() => ingresos.reduce((acc, item) => acc + (Number(item.monto) || 0), 0), [ingresos]);
  const totalGastos = useMemo(() => gastos.reduce((acc, item) => acc + (Number(item.monto) || 0), 0), [gastos]);
  const totalCuentas = useMemo(() => cuentas.reduce((acc, item) => acc + (Number(item.saldo) || 0), 0), [cuentas]);
  const totalDeudas = useMemo(() => deudas.reduce((acc, item) => acc + (Number(item.saldo) || 0), 0), [deudas]);
  const balance = useMemo(() => totalIngresos - totalGastos, [totalIngresos, totalGastos]);
  const patrimonioDisponible = useMemo(() => totalCuentas - totalDeudas, [totalCuentas, totalDeudas]);
 
  const categorias = useMemo(() => ["Todos", ...new Set(gastos.map((g) => g.categoria).filter(Boolean))], [gastos]);
  const gastosFiltrados = useMemo(() => (filtro === "Todos" ? gastos : gastos.filter((g) => g.categoria === filtro)), [gastos, filtro]);
  const datosCategorias = useMemo(() => totalizarPorCategoria(gastos), [gastos]);
 
  const ingresosReporte = useMemo(() => filtrarPorPeriodo(ingresos, tipoReporte, fechaReporte), [ingresos, tipoReporte, fechaReporte]);
  const gastosReporte = useMemo(() => filtrarPorPeriodo(gastos, tipoReporte, fechaReporte), [gastos, tipoReporte, fechaReporte]);
  const totalIngresosReporte = useMemo(() => ingresosReporte.reduce((acc, item) => acc + (Number(item.monto) || 0), 0), [ingresosReporte]);
  const totalGastosReporte = useMemo(() => gastosReporte.reduce((acc, item) => acc + (Number(item.monto) || 0), 0), [gastosReporte]);
  const balanceReporte = useMemo(() => totalIngresosReporte - totalGastosReporte, [totalIngresosReporte, totalGastosReporte]);
  const categoriasReporte = useMemo(() => totalizarPorCategoria(gastosReporte), [gastosReporte]);
 
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Nido Financiero</h1>
              <p className="mt-2 text-slate-600">
                Registra ingresos, gastos, presupuestos, saldos por cuenta, deudas y movimientos entre tus fondos.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Sesión activa: <span className="font-semibold text-slate-900">{currentUser.nombre}</span> ({currentUser.email})
              </p>
            </div>
            <button
              onClick={cerrarSesion}
              className="rounded-2xl border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
          </div>
          {mensaje ? (
            <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              {mensaje}
            </div>
          ) : null}
        </div>
 
        <div className="grid gap-4 md:grid-cols-5">
          <TarjetaResumen titulo="Ingresos totales" valor={formatoMoneda(totalIngresos)} />
          <TarjetaResumen titulo="Gastos totales" valor={formatoMoneda(totalGastos)} />
          <TarjetaResumen titulo="Balance del período" valor={formatoMoneda(balance)} color={balance >= 0 ? "text-emerald-600" : "text-red-600"} />
          <TarjetaResumen titulo="Saldo en cuentas" valor={formatoMoneda(totalCuentas)} />
          <TarjetaResumen titulo="Deudas pendientes" valor={formatoMoneda(totalDeudas)} color="text-red-600" />
        </div>
 
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Reportes</h3>
              <p className="text-sm text-slate-500">Consulta resultados diarios, semanales, mensuales y anuales.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Select value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value)}>
                {TIPOS_REPORTE.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </Select>
              <Campo type="date" value={fechaReporte} onChange={(e) => setFechaReporte(e.target.value || HOY)} />
            </div>
          </div>
 
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <TarjetaResumen titulo="Ingresos del reporte" valor={formatoMoneda(totalIngresosReporte)} />
            <TarjetaResumen titulo="Gastos del reporte" valor={formatoMoneda(totalGastosReporte)} />
            <TarjetaResumen titulo="Balance del reporte" valor={formatoMoneda(balanceReporte)} color={balanceReporte >= 0 ? "text-emerald-600" : "text-red-600"} />
            <TarjetaResumen titulo="Movimientos" valor={String(ingresosReporte.length + gastosReporte.length)} />
          </div>
 
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div>
              <h4 className="mb-3 text-lg font-semibold text-slate-900">Gastos por categoría del reporte</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoriasReporte} dataKey="monto" nameKey="categoria" cx="50%" cy="50%" outerRadius={95} label>
                      {categoriasReporte.map((entry, index) => (
                        <Cell key={entry.categoria} fill={COLORES[index % COLORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatoMoneda(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
 
            <div className="space-y-4">
              <h4 className="mb-3 text-lg font-semibold text-slate-900">Detalle del reporte</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="mb-2 font-semibold text-slate-900">Ingresos</p>
                  <div className="max-h-52 space-y-2 overflow-auto">
                    {ingresosReporte.length ? ingresosReporte.map((item) => (
                      <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                        <p className="font-medium text-slate-900">{item.descripcion}</p>
                        <p className="text-slate-500">{item.fecha} · {formatoMoneda(item.monto)}</p>
                      </div>
                    )) : <p className="text-sm text-slate-500">No hay ingresos en este período.</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="mb-2 font-semibold text-slate-900">Gastos</p>
                  <div className="max-h-52 space-y-2 overflow-auto">
                    {gastosReporte.length ? gastosReporte.map((item) => (
                      <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                        <p className="font-medium text-slate-900">{item.descripcion}</p>
                        <p className="text-slate-500">{item.fecha} · {item.categoria} · {formatoMoneda(item.monto)}</p>
                      </div>
                    )) : <p className="text-sm text-slate-500">No hay gastos en este período.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
 
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-slate-900">Gastos por categoría</h3>
              <p className="text-sm text-slate-500">Visualiza en qué categorías estás gastando más.</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={datosCategorias} dataKey="monto" nameKey="categoria" cx="50%" cy="50%" outerRadius={110} label>
                    {datosCategorias.map((entry, index) => (
                      <Cell key={entry.categoria} fill={COLORES[index % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatoMoneda(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
 
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-slate-900">Comparativo por categoría</h3>
              <p className="text-sm text-slate-500">Revisa rápidamente el monto gastado en cada rubro.</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosCategorias}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatoMoneda(value)} />
                  <Legend />
                  <Bar dataKey="monto" name="Monto" fill="#334155" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
 
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Agregar ingreso</h3>
              <p className="text-sm text-slate-500">Registra una nueva entrada de dinero.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Campo placeholder="Descripción" value={nuevoIngreso.descripcion} onChange={(e) => setNuevoIngreso((prev) => ({ ...prev, descripcion: e.target.value }))} />
              <Campo type="number" min="0" step="0.01" placeholder="Monto" value={nuevoIngreso.monto} onChange={(e) => setNuevoIngreso((prev) => ({ ...prev, monto: e.target.value }))} />
              <Campo type="date" className="md:col-span-2" value={nuevoIngreso.fecha} onChange={(e) => setNuevoIngreso((prev) => ({ ...prev, fecha: e.target.value || HOY }))} />
            </div>
            <button onClick={agregarIngreso} className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white hover:opacity-90">Guardar ingreso</button>
            <div className="space-y-3 pt-2">
              {ingresos.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{item.descripcion}</p>
                    <p className="text-sm text-slate-500">{item.fecha} · {formatoMoneda(item.monto)}</p>
                  </div>
                  <button onClick={() => eliminarIngreso(item.id)} className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">Eliminar</button>
                </div>
              ))}
            </div>
          </div>
 
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Agregar gasto</h3>
              <p className="text-sm text-slate-500">Puedes cargar el gasto y descontarlo de una cuenta.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Campo placeholder="Descripción" value={nuevoGasto.descripcion} onChange={(e) => setNuevoGasto((prev) => ({ ...prev, descripcion: e.target.value }))} />
              <Campo placeholder="Categoría" value={nuevoGasto.categoria} onChange={(e) => setNuevoGasto((prev) => ({ ...prev, categoria: e.target.value }))} />
              <Campo type="number" min="0" step="0.01" placeholder="Monto" value={nuevoGasto.monto} onChange={(e) => setNuevoGasto((prev) => ({ ...prev, monto: e.target.value }))} />
              <Campo type="date" value={nuevoGasto.fecha} onChange={(e) => setNuevoGasto((prev) => ({ ...prev, fecha: e.target.value || HOY }))} />
              <Select className="md:col-span-2" value={nuevoGasto.cuentaId} onChange={(e) => setNuevoGasto((prev) => ({ ...prev, cuentaId: e.target.value }))}>
                <option value="">Selecciona cuenta opcional</option>
                {cuentas.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre}</option>
                ))}
              </Select>
            </div>
            <button onClick={agregarGasto} className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white hover:opacity-90">Guardar gasto</button>
            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm text-slate-500">Filtrar:</span>
              <Select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-3 pt-2">
              {gastosFiltrados.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{item.descripcion}</p>
                    <p className="text-sm text-slate-500">{item.fecha} · {item.categoria} · {formatoMoneda(item.monto)}</p>
                  </div>
                  <button onClick={() => eliminarGasto(item.id)} className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
 
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Cuentas y billeteras</h3>
              <p className="text-sm text-slate-500">Agrega efectivo, bancos, ahorros o cualquier cartera.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Campo placeholder="Nombre" value={nuevaCuenta.nombre} onChange={(e) => setNuevaCuenta((prev) => ({ ...prev, nombre: e.target.value }))} />
              <Campo placeholder="Tipo" value={nuevaCuenta.tipo} onChange={(e) => setNuevaCuenta((prev) => ({ ...prev, tipo: e.target.value }))} />
              <Campo type="number" min="0" step="0.01" placeholder="Saldo inicial" value={nuevaCuenta.saldo} onChange={(e) => setNuevaCuenta((prev) => ({ ...prev, saldo: e.target.value }))} />
            </div>
            <button onClick={agregarCuenta} className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white hover:opacity-90">Guardar cuenta</button>
            <div className="space-y-3 pt-2">
              {cuentas.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{item.nombre}</p>
                    <p className="text-sm text-slate-500">{item.tipo} · {formatoMoneda(item.saldo)}</p>
                  </div>
                  <button onClick={() => eliminarCuenta(item.id)} className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">Eliminar</button>
                </div>
              ))}
            </div>
          </div>
 
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Deudas</h3>
              <p className="text-sm text-slate-500">Agrega tus deudas y reduce el saldo con pagos directos.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Campo placeholder="Nombre de la deuda" value={nuevaDeuda.nombre} onChange={(e) => setNuevaDeuda((prev) => ({ ...prev, nombre: e.target.value }))} />
              <Campo type="number" min="0" step="0.01" placeholder="Saldo pendiente" value={nuevaDeuda.saldo} onChange={(e) => setNuevaDeuda((prev) => ({ ...prev, saldo: e.target.value }))} />
            </div>
            <button onClick={agregarDeuda} className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white hover:opacity-90">Guardar deuda</button>
            <div className="space-y-3 pt-2">
              {deudas.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{item.nombre}</p>
                    <p className="text-sm text-slate-500">Pendiente · {formatoMoneda(item.saldo)}</p>
                  </div>
                  <button onClick={() => eliminarDeuda(item.id)} className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
 
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Presupuestos</h3>
              <p className="text-sm text-slate-500">Define límites por categoría para controlar tus gastos.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Campo placeholder="Categoría" value={nuevoPresupuesto.categoria} onChange={(e) => setNuevoPresupuesto((prev) => ({ ...prev, categoria: e.target.value }))} />
              <Campo type="number" min="0" step="0.01" placeholder="Límite" value={nuevoPresupuesto.limite} onChange={(e) => setNuevoPresupuesto((prev) => ({ ...prev, limite: e.target.value }))} />
            </div>
            <button onClick={agregarPresupuesto} className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white hover:opacity-90">Guardar presupuesto</button>
            <div className="space-y-3 pt-2">
              {presupuestos.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{item.categoria}</p>
                    <p className="text-sm text-slate-500">Límite · {formatoMoneda(item.limite)}</p>
                  </div>
                  <button onClick={() => eliminarPresupuesto(item.id)} className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">Eliminar</button>
                </div>
              ))}
            </div>
          </div>
 
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Control de presupuesto</h3>
              <p className="text-sm text-slate-500">Compara el gasto acumulado con el límite definido.</p>
            </div>
            <div className="space-y-3">
              {presupuestos.length ? presupuestos.map((presupuesto) => {
                const gastado = gastos
                  .filter((g) => (g.categoria || "General") === presupuesto.categoria)
                  .reduce((acc, item) => acc + (Number(item.monto) || 0), 0);
                const disponible = Number(presupuesto.limite) - gastado;
                return (
                  <div key={presupuesto.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-medium text-slate-900">{presupuesto.categoria}</p>
                    <p className="text-sm text-slate-500">Límite: {formatoMoneda(presupuesto.limite)}</p>
                    <p className="text-sm text-slate-500">Gastado: {formatoMoneda(gastado)}</p>
                    <p className={`text-sm font-medium ${disponible >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      Disponible: {formatoMoneda(disponible)}
                    </p>
                  </div>
                );
              }) : <p className="text-sm text-slate-500">Aún no hay presupuestos registrados.</p>}
            </div>
          </div>
        </div>
 
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Mover dinero entre cuentas</h3>
              <p className="text-sm text-slate-500">Debita una cuenta y acredita otra automáticamente.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Select value={movimiento.origenId} onChange={(e) => setMovimiento((prev) => ({ ...prev, origenId: e.target.value }))}>
                <option value="">Cuenta origen</option>
                {cuentas.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre}</option>)}
              </Select>
              <Select value={movimiento.destinoId} onChange={(e) => setMovimiento((prev) => ({ ...prev, destinoId: e.target.value }))}>
                <option value="">Cuenta destino</option>
                {cuentas.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre}</option>)}
              </Select>
              <Campo type="number" min="0" step="0.01" placeholder="Monto" value={movimiento.monto} onChange={(e) => setMovimiento((prev) => ({ ...prev, monto: e.target.value }))} />
            </div>
            <button onClick={moverDinero} className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white hover:opacity-90">Transferir monto</button>
          </div>
 
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Pagar deuda desde una cuenta</h3>
              <p className="text-sm text-slate-500">Se descuenta de la cuenta y se reduce la deuda.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Select value={pagoDeuda.cuentaId} onChange={(e) => setPagoDeuda((prev) => ({ ...prev, cuentaId: e.target.value }))}>
                <option value="">Cuenta</option>
                {cuentas.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre}</option>)}
              </Select>
              <Select value={pagoDeuda.deudaId} onChange={(e) => setPagoDeuda((prev) => ({ ...prev, deudaId: e.target.value }))}>
                <option value="">Deuda</option>
                {deudas.map((deuda) => <option key={deuda.id} value={deuda.id}>{deuda.nombre}</option>)}
              </Select>
              <Campo type="number" min="0" step="0.01" placeholder="Monto" value={pagoDeuda.monto} onChange={(e) => setPagoDeuda((prev) => ({ ...prev, monto: e.target.value }))} />
            </div>
            <button onClick={pagarDeudaDesdeCuenta} className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white hover:opacity-90">Aplicar pago</button>
          </div>
        </div>
 
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Resumen general</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <TarjetaResumen titulo="Cantidad de ingresos" valor={String(ingresos.length)} />
            <TarjetaResumen titulo="Cantidad de gastos" valor={String(gastos.length)} />
            <TarjetaResumen titulo="Cantidad de cuentas" valor={String(cuentas.length)} />
            <TarjetaResumen titulo="Patrimonio disponible" valor={formatoMoneda(patrimonioDisponible)} color={patrimonioDisponible >= 0 ? "text-emerald-600" : "text-red-600"} />
          </div>
        </div>
      </div>
    </div>
  );
}

