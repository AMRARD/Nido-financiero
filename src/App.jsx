import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

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

const formatoMoneda = (valor) =>
  new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(Number(valor) || 0);

function Campo({ className = "", ...props }) {
  return (
    <input
      className={`rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 ${className}`}
      {...props}
    />
  );
}

function Boton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white hover:opacity-90 ${className}`}
      {...props}
    >
      {children}
    </button>
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

function Bloque({ titulo, children }) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-900">{titulo}</h3>
      {children}
    </div>
  );
}

function ListaSimple({ items, renderItem, emptyText = "No hay registros." }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">{emptyText}</p>;
  }

  return <div className="space-y-3">{items.map(renderItem)}</div>;
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
        <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300">NIDO</p>
          <h1 className="mt-4 text-4xl font-bold">Nido Financiero</h1>
          <p className="mt-4 text-slate-300">
            Crea usuarios para que cada persona tenga acceso a su propio presupuesto,
            cuentas, deudas, ingresos y gastos.
          </p>
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
              <Boton onClick={onLogin}>Entrar</Boton>
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
            <Boton className="mt-4" onClick={onRegister}>
              Crear usuario
            </Boton>
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

export default function App() {
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

  const mostrarMensaje = (texto) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 2500);
  };

  const mostrarMensajeAuth = (texto) => {
    setMensajeAuth(texto);
    setTimeout(() => setMensajeAuth(""), 3500);
  };

  const limpiarDatos = () => {
    setCurrentUser(null);
    setIngresos([]);
    setGastos([]);
    setCuentas([]);
    setDeudas([]);
    setPresupuestos([]);
  };

  const cargarDatosUsuario = async (userId, fallbackUser = null) => {
    const [
      { data: profile },
      { data: ingresosData, error: ingresosError },
      { data: gastosData, error: gastosError },
      { data: cuentasData, error: cuentasError },
      { data: deudasData, error: deudasError },
      { data: presupuestosData, error: presupuestosError },
    ] = await Promise.all([
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

    if (ingresosError || gastosError || cuentasError || deudasError || presupuestosError) {
      console.error({
        ingresosError,
        gastosError,
        cuentasError,
        deudasError,
        presupuestosError,
      });
    }

    setCurrentUser({
      id: userId,
      nombre: profile?.nombre || fallbackUser?.user_metadata?.nombre || fallbackUser?.email || "",
      email: profile?.email || fallbackUser?.email || "",
    });

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
        await cargarDatosUsuario(session.user.id, session.user);
      } else {
        limpiarDatos();
      }
    };

    iniciar();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await cargarDatosUsuario(session.user.id, session.user);
      } else {
        limpiarDatos();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
      await cargarDatosUsuario(data.user.id, data.user);
      setLoginForm(LOGIN_VACIO);
      mostrarMensajeAuth("");
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    limpiarDatos();
  };

  const agregarIngreso = async () => {
    if (!currentUser) return;

    const descripcion = nuevoIngreso.descripcion.trim();
    const monto = Number(nuevoIngreso.monto);

    if (!descripcion || monto <= 0 || Number.isNaN(monto)) {
      mostrarMensaje("Completa bien el ingreso.");
      return;
    }

    const { error } = await supabase.from("ingresos").insert({
      user_id: currentUser.id,
      descripcion,
      monto,
      fecha: nuevoIngreso.fecha || HOY,
    });

    if (error) {
      mostrarMensaje(error.message);
      return;
    }

    await cargarDatosUsuario(currentUser.id, currentUser);
    setNuevoIngreso(INGRESO_VACIO);
    mostrarMensaje("Ingreso agregado correctamente.");
  };

  const agregarGasto = async () => {
    if (!currentUser) return;

    const descripcion = nuevoGasto.descripcion.trim();
    const monto = Number(nuevoGasto.monto);
    const categoria = nuevoGasto.categoria.trim() || "General";

    if (!descripcion || monto <= 0 || Number.isNaN(monto)) {
      mostrarMensaje("Completa bien el gasto.");
      return;
    }

    const { error } = await supabase.from("gastos").insert({
      user_id: currentUser.id,
      descripcion,
      monto,
      categoria,
      fecha: nuevoGasto.fecha || HOY,
    });

    if (error) {
      mostrarMensaje(error.message);
      return;
    }

    await cargarDatosUsuario(currentUser.id, currentUser);
    setNuevoGasto(GASTO_VACIO);
    mostrarMensaje("Gasto agregado correctamente.");
  };

  const agregarCuenta = async () => {
    if (!currentUser) return;

    const nombre = nuevaCuenta.nombre.trim();
    const tipo = nuevaCuenta.tipo.trim() || "Banco";
    const saldo = Number(nuevaCuenta.saldo);

    if (!nombre || saldo < 0 || Number.isNaN(saldo)) {
      mostrarMensaje("Completa bien la cuenta.");
      return;
    }

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

    await cargarDatosUsuario(currentUser.id, currentUser);
    setNuevaCuenta(CUENTA_VACIA);
    mostrarMensaje("Cuenta agregada correctamente.");
  };

  const agregarDeuda = async () => {
    if (!currentUser) return;

    const nombre = nuevaDeuda.nombre.trim();
    const saldo = Number(nuevaDeuda.saldo);

    if (!nombre || saldo < 0 || Number.isNaN(saldo)) {
      mostrarMensaje("Completa bien la deuda.");
      return;
    }

    const { error } = await supabase.from("deudas").insert({
      user_id: currentUser.id,
      nombre,
      saldo,
    });

    if (error) {
      mostrarMensaje(error.message);
      return;
    }

    await cargarDatosUsuario(currentUser.id, currentUser);
    setNuevaDeuda(DEUDA_VACIA);
    mostrarMensaje("Deuda agregada correctamente.");
  };

  const agregarPresupuesto = async () => {
    if (!currentUser) return;

    const categoria = nuevoPresupuesto.categoria.trim();
    const limite = Number(nuevoPresupuesto.limite);

    if (!categoria || limite <= 0 || Number.isNaN(limite)) {
      mostrarMensaje("Completa bien el presupuesto.");
      return;
    }

    const { error } = await supabase.from("presupuestos").insert({
      user_id: currentUser.id,
      categoria,
      limite,
    });

    if (error) {
      mostrarMensaje(error.message);
      return;
    }

    await cargarDatosUsuario(currentUser.id, currentUser);
    setNuevoPresupuesto(PRESUPUESTO_VACIO);
    mostrarMensaje("Presupuesto agregado correctamente.");
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Nido Financiero</h1>
              <p className="mt-2 text-slate-600">
                Sesión activa:{" "}
                <span className="font-semibold text-slate-900">{currentUser.nombre}</span> (
                {currentUser.email})
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

        <div className="grid gap-4 md:grid-cols-4">
          <TarjetaResumen titulo="Ingresos totales" valor={formatoMoneda(totalIngresos)} />
          <TarjetaResumen titulo="Gastos totales" valor={formatoMoneda(totalGastos)} />
          <TarjetaResumen
            titulo="Balance"
            valor={formatoMoneda(balance)}
            color={balance >= 0 ? "text-emerald-600" : "text-red-600"}
          />
          <TarjetaResumen titulo="Saldo en cuentas" value={formatoMoneda(totalCuentas)} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Bloque titulo="Agregar ingreso">
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
              <Boton onClick={agregarIngreso}>Guardar ingreso</Boton>
            </div>

            <ListaSimple
              items={ingresos}
              emptyText="No hay ingresos."
              renderItem={(item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-medium text-slate-900">{item.descripcion}</p>
                  <p className="text-sm text-slate-500">
                    {item.fecha} · {formatoMoneda(item.monto)}
                  </p>
                </div>
              )}
            />
          </Bloque>

          <Bloque titulo="Agregar gasto">
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
              <Boton onClick={agregarGasto}>Guardar gasto</Boton>
            </div>

            <ListaSimple
              items={gastos}
              emptyText="No hay gastos."
              renderItem={(item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-medium text-slate-900">{item.descripcion}</p>
                  <p className="text-sm text-slate-500">
                    {item.categoria} · {item.fecha} · {formatoMoneda(item.monto)}
                  </p>
                </div>
              )}
            />
          </Bloque>

          <Bloque titulo="Agregar cuenta">
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
              <Boton onClick={agregarCuenta}>Guardar cuenta</Boton>
            </div>

            <ListaSimple
              items={cuentas}
              emptyText="No hay cuentas."
              renderItem={(item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-medium text-slate-900">{item.nombre}</p>
                  <p className="text-sm text-slate-500">
                    {item.tipo} · {formatoMoneda(item.saldo)}
                  </p>
                </div>
              )}
            />
          </Bloque>

          <Bloque titulo="Agregar deuda">
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
              <Boton onClick={agregarDeuda}>Guardar deuda</Boton>
            </div>

            <ListaSimple
              items={deudas}
              emptyText="No hay deudas."
              renderItem={(item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-medium text-slate-900">{item.nombre}</p>
                  <p className="text-sm text-slate-500">{formatoMoneda(item.saldo)}</p>
                </div>
              )}
            />
          </Bloque>
        </div>

        <Bloque titulo="Presupuestos">
          <div className="grid gap-3 md:grid-cols-2">
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
          </div>
          <Boton onClick={agregarPresupuesto}>Guardar presupuesto</Boton>

          <ListaSimple
            items={presupuestos}
            emptyText="No hay presupuestos."
            renderItem={(item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{item.categoria}</p>
                <p className="text-sm text-slate-500">{formatoMoneda(item.limite)}</p>
              </div>
            )}
          />
        </Bloque>

        <div className="grid gap-4 md:grid-cols-2">
          <TarjetaResumen titulo="Total de cuentas" valor={String(cuentas.length)} />
          <TarjetaResumen titulo="Total de deudas" valor={String(deudas.length)} />
        </div>
      </div>
    </div>
  );
}