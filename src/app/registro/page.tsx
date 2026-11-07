'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Factory,
  Lock,
  Mail,
  User,
  Building2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  RotateCw,
  Warehouse,
  HardHat,
} from 'lucide-react';
import { RolUsuario } from '@/types';

const AREAS_PLANTA = [
  'Almacén Central',
  'Producción Línea 1',
  'Producción Línea 2',
  'Mantenimiento',
  'Calidad',
  'Embarques',
  'Gerencia de Planta',
];

export default function RegisterPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<RolUsuario>('ALMACENISTA');
  const [area, setArea] = useState('Almacén Central');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRolChange = (newRol: RolUsuario) => {
    setRol(newRol);
    if (newRol === 'ALMACENISTA') {
      setArea('Almacén Central');
    } else if (newRol === 'ADMIN') {
      setArea('Gerencia de Planta');
    } else {
      setArea('Producción Línea 1');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener un mínimo de 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          rol,
          area,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No fue posible registrar la cuenta.');
      }

      // Redirigir directamente al dashboard (la cookie de sesión ya fue generada)
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 flex flex-col justify-center items-center p-4 relative overflow-hidden py-10">
      {/* Fondo industrial extra claro */}
      <img
        src="/warehouse-bg.jpg?v=4"
        alt="Almacén Industrial"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-100 brightness-125 contrast-105 saturate-110"
      />
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-white/15 pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Cabecera */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 rounded-2xl shadow-xl shadow-cyan-500/25 mb-1 transform hover:rotate-3 transition-transform">
            <Factory className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>FACTORY</span>
            <span className="text-cyan-400">STOCK</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium max-w-sm mx-auto leading-relaxed drop-shadow-md">
            Registro de Nueva Cuenta de Personal
          </p>
        </div>

        {/* Formulario Glassmorphism */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl shadow-cyan-950/50">
          <div className="mb-5">
            <h2 className="text-base font-bold text-white tracking-wide flex items-center justify-between">
              <span>Crear Cuenta de Usuario</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Alta Segura
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              La contraseña se guardará en Google Sheets de forma cifrada (Hash BCrypt)
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre Completo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Nombre Completo <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez Martínez"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
            </div>

            {/* Correo Institucional */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Correo Institucional <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
            </div>

            {/* Selector de Rol */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Rol / Perfil Operativo <span className="text-cyan-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRolChange('ALMACENISTA')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    rol === 'ALMACENISTA'
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <Warehouse className="w-4 h-4" />
                  <span className="text-[11px] font-bold">Almacén</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRolChange('JEFE_AREA')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    rol === 'JEFE_AREA'
                      ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-md shadow-amber-950/50'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <HardHat className="w-4 h-4" />
                  <span className="text-[11px] font-bold">Jefe de Área</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRolChange('ADMIN')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    rol === 'ADMIN'
                      ? 'bg-violet-950/80 border-violet-400 text-violet-300 shadow-md shadow-violet-950/50'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[11px] font-bold">Admin</span>
                </button>
              </div>
            </div>

            {/* Área de Planta */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Área de la Planta Asignada
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                >
                  {AREAS_PLANTA.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contraseña y Confirmar Contraseña */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Contraseña <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mín. 6 caracteres"
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirmar Contraseña <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm rounded-full shadow-lg shadow-cyan-400/25 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Registrando Cuenta...</span>
                </>
              ) : (
                <>
                  <span>Registrarse e Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Enlace para volver a iniciar sesión */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              ¿Ya tienes una cuenta registrada?{' '}
              <Link
                href="/login"
                className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline ml-1"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Pie */}
        <p className="text-center text-[11px] text-slate-500">
          FactoryStock &bull; Seguridad Hash Cifrada &bull; Sincronización en la Nube
        </p>
      </div>
    </div>
  );
}
