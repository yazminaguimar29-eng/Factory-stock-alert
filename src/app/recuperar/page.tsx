'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Factory,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  RotateCw,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export default function RecuperarPage() {
  const router = useRouter();

  // Paso 1: Buscar cuenta por correo
  // Paso 2: Ingresar nueva contraseña
  // Paso 3: Éxito
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userArea, setUserArea] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paso 1: Validar correo
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No fue posible localizar la cuenta.');
      }

      setUserName(data.nombre);
      setUserRole(data.rol);
      setUserArea(data.area);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Restablecer contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener un mínimo de 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al restablecer la contraseña.');
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-800 flex flex-col justify-center items-center p-4 relative overflow-hidden py-10">
      {/* Fondo industrial de almacén extra claro */}
      <img
        src="/warehouse-bg.jpg?v=4"
        alt="Almacén Industrial"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-100 brightness-125 contrast-105 saturate-110"
      />
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-900/40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Cabecera de la Marca */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 rounded-2xl shadow-xl shadow-cyan-500/25 mb-1 transform hover:rotate-3 transition-transform">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>FACTORY</span>
            <span className="text-cyan-400">STOCK</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium max-w-sm mx-auto leading-relaxed drop-shadow-md">
            Recuperación Segura de Contraseña
          </p>
        </div>

        {/* Tarjeta Glassmorphism */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl shadow-cyan-950/50">
          
          {/* PASO 1: Ingreso de correo */}
          {step === 1 && (
            <div>
              <div className="mb-5">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Identifica tu Cuenta
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Ingresa el correo institucional con el que estás dado de alta en la planta
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs font-semibold animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyEmail} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm rounded-full shadow-lg shadow-cyan-400/25 transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span>Buscar Cuenta</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* PASO 2: Ingreso de nueva contraseña */}
          {step === 2 && (
            <div>
              <div className="mb-4">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Crear Nueva Contraseña
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Se actualizará el hash de tu cuenta y se sincronizará con Google Sheets
                </p>
              </div>

              {/* Ficha de confirmación de identidad */}
              <div className="mb-4 p-3.5 bg-slate-950/80 border border-cyan-500/30 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{userName}</h4>
                  <p className="text-[11px] font-mono text-cyan-300 truncate">{email}</p>
                  <span className="text-[10px] text-slate-400 block">{userRole} &bull; {userArea}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs font-semibold animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Nueva Contraseña <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Confirmar Nueva Contraseña <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError(null);
                    }}
                    className="px-4 py-2.5 bg-slate-950/80 hover:bg-slate-800 text-slate-300 rounded-full text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    Atrás
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-full shadow-lg shadow-cyan-400/25 transition-all hover:scale-[1.01] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Actualizando...</span>
                      </>
                    ) : (
                      <>
                        <span>Guardar Nueva Contraseña</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PASO 3: Éxito */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  ¡Contraseña Actualizada con Éxito!
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Tu nueva clave fue encriptada criptográficamente (Hash BCrypt) y almacenada de forma segura en Google Sheets.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login?recovered=true"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-sm rounded-full shadow-lg shadow-emerald-400/25 transition-all hover:scale-[1.01]"
                >
                  <span>Iniciar Sesión Ahora</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Enlace para volver a Iniciar Sesión */}
          {step !== 3 && (
            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al inicio de sesión</span>
              </Link>
            </div>
          )}
        </div>

        {/* Pie */}
        <p className="text-center text-[11px] text-slate-500">
          FactoryStock &bull; Seguridad Hash Cifrada &bull; WMS
        </p>
      </div>
    </div>
  );
}
