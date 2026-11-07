'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Factory,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  UserPlus,
  KeyRound,
  RotateCw,
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';
  const justRecovered = searchParams.get('recovered') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'El correo o contraseña son incorrectos.');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Fondo industrial de almacén extra claro y luminoso */}
      <img
        src="/warehouse-bg.jpg?v=4"
        alt="Almacén Industrial"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-100 brightness-125 contrast-105 saturate-110"
      />
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-white/15 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Cabecera de la Marca Industrial */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 rounded-2xl shadow-xl shadow-cyan-500/25 mb-1 transform hover:rotate-3 transition-transform">
            <Factory className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>FACTORY</span>
            <span className="text-cyan-400">STOCK</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium max-w-sm mx-auto leading-relaxed drop-shadow-md">
            Control de Inventario y Almacén en Tiempo Real
          </p>
        </div>

        {/* Tarjeta de Autenticación */}
        <div className="bg-slate-900/85 border border-cyan-500/30 rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-xl shadow-cyan-950/50">
          <div className="mb-6">
            <h2 className="text-base font-bold text-white tracking-wide flex items-center justify-between">
              <span>Iniciar Sesión</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                WMS v2.0
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa tus credenciales institucionales para acceder al sistema
            </p>
          </div>

          {/* Notificación de registro exitoso previo */}
          {justRegistered && (
            <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs font-semibold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <span>¡Cuenta creada con éxito! Ingresa tu correo y contraseña para acceder.</span>
            </div>
          )}

          {/* Notificación de contraseña restablecida previo */}
          {justRecovered && (
            <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs font-semibold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <span>¡Contraseña restablecida! Ya puedes ingresar con tu nueva clave.</span>
            </div>
          )}

          {/* Error de autenticación */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Correo Institucional
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Contraseña
                </label>
                <Link
                  href="/recuperar"
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm rounded-full shadow-lg shadow-cyan-400/25 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              <span>{loading ? 'Validando...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Enlaces de acceso y creación de cuenta (sin contraseñas visibles) */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">
              ¿No tienes una cuenta aún?
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-950/70 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4 text-cyan-400" />
              <span>Registrar una cuenta nueva</span>
            </Link>
          </div>
        </div>

        {/* Pie */}
        <p className="text-center text-[11px] text-slate-500">
          FactoryStock &bull; Seguridad Criptográfica Hash Activa &bull; WMS
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          <RotateCw className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
