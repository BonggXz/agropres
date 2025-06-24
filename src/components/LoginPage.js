import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { FiEyeOff } from "react-icons/fi";

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Email atau password salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 font-sans">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 font-heading">Agro Pres</h1>
        <p className="text-center text-gray-600">Silakan masuk untuk mengontrol sawah Anda.</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Alamat Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 mt-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="contoh@email.com" />
          </div>
          <div className="relative">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
            <input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 mt-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="********" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-600 top-7"><FiEyeOff /></button>
          </div>
           {error && <p className="text-sm text-center text-red-600">{error}</p>}
          <div><button type="submit" disabled={loading} className="w-full px-4 py-3 font-semibold text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300">{loading ? 'Memproses...' : 'MASUK'}</button></div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
