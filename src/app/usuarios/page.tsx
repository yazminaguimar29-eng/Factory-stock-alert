'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Warehouse,
  HardHat,
  RotateCw,
  AlertCircle,
  CheckCircle,
  Building2,
  Mail,
  Lock,
} from 'lucide-react';
import { Usuario, UsuarioAutenticado, RolUsuario } from '@/types';

export default function UsuariosPage() {
  const [currentUser, setCurrentUser] = useState<UsuarioAutenticado | null>(null);
  const [usuarios, setUsuarios] = useState<Omit<Usuario, 'password_hash'>[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<RolUsuario>('ALMACENISTA');
  const [area, setArea] = useState('Almacén Central');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) setCurrentUser(data.user);
      });

    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/usuarios');
      const data = await res.json();
      if (data.usuarios) {
        setUsuarios(data.usuarios);
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          password,
          rol,
          area: area.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear usuario.');
      }

      setSuccess(`Usuario ${nombre} (${email}) registrado exitosamente con rol ${rol}.`);
      setNombre('');
      setEmail('');
      setPassword('');
      setIsCreating(false);
      loadUsuarios();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RotateCw className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <AppShell user={currentUser}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
              <Users className="w-7 h-7 text-amber-400" />
              <span>Administración de Usuarios y Roles</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Control de credenciales, áreas de planta y permisos de acceso para ADMIN, ALMACENISTA y JEFE_AREA
            </p>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-400/20 transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isCreating ? 'Cancelar' : 'Registrar Nuevo Usuario'}</span>
          </button>
        </div>

        {/* Mensajes de Éxito / Error */}
        {success && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario de Alta de Usuario */}
        {isCreating && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Alta de Usuario en Hoja de Usuarios</span>
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Ing. Carlos Mendoza"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Correo Institucional *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Contraseña Inicial *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500">Se encriptará con hash bcrypt.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Rol en Planta *
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => {
                      const newRol = e.target.value as RolUsuario;
                      setRol(newRol);
                      if (newRol === 'ALMACENISTA') setArea('Almacén Central');
                      else if (newRol === 'ADMIN') setArea('Gerencia de Planta');
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="ADMIN">ADMIN (Gerente / Administrador)</option>
                    <option value="ALMACENISTA">ALMACENISTA (Operador de Almacén)</option>
                    <option value="JEFE_AREA">JEFE_AREA (Responsable de Producción)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Área Asignada *
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Ej. Producción Línea 1, Mantenimiento"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla de Usuarios */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Usuarios Registrados en el Sistema ({usuarios.length})
            </h3>
            <button onClick={loadUsuarios} className="text-slate-400 hover:text-white p-1">
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Correo Institucional</th>
                  <th className="px-4 py-3">Rol del Sistema</th>
                  <th className="px-4 py-3">Área de Planta</th>
                  <th className="px-4 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {usuarios.map((u) => {
                  const getRoleBadge = () => {
                    switch (u.rol) {
                      case 'ADMIN':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            ADMIN
                          </span>
                        );
                      case 'ALMACENISTA':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold text-[11px]">
                            <Warehouse className="w-3.5 h-3.5" />
                            ALMACENISTA
                          </span>
                        );
                      case 'JEFE_AREA':
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold text-[11px]">
                            <HardHat className="w-3.5 h-3.5" />
                            JEFE_AREA
                          </span>
                        );
                    }
                  };

                  return (
                    <tr key={u.id} className="hover:bg-slate-850 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">{u.nombre}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{u.email}</td>
                      <td className="px-4 py-3">{getRoleBadge()}</td>
                      <td className="px-4 py-3 text-slate-300 font-medium">{u.area}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          ACTIVO (SI)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
