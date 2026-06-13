import { useState } from 'react';
import { login, register } from '../api';

export default function LoginPage({ onLogin, darkMode }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { accessToken } = await login(name, password);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('username', name);
        onLogin(accessToken, name);
      } else {
        await register(name, password, confirmedPassword);
        setSuccess('Konto utworzone! Możesz się teraz zalogować.');
        setMode('login');
        setPassword('');
        setConfirmedPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full px-5 py-3.5 rounded-xl border-2 outline-none transition-all ${
    darkMode
      ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-indigo-500 focus:bg-slate-700'
      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:bg-white'
  }`;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${
      darkMode
        ? 'bg-gradient-to-br from-slate-950 via-purple-950/80 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${darkMode ? 'bg-indigo-600/10' : 'bg-indigo-300/20'}`} />
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl ${darkMode ? 'bg-purple-600/10' : 'bg-purple-300/15'}`} />
      </div>

      <div className={`relative w-full max-w-md rounded-3xl p-8 border ${
        darkMode ? 'bg-slate-800/90 border-white/10' : 'bg-white/95 border-gray-200 shadow-2xl'
      }`}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-4">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Cloud<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Drive</span>
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            {mode === 'login' ? 'Zaloguj się do swojego konta' : 'Utwórz nowe konto'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className={`flex rounded-xl p-1 mb-6 ${darkMode ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
          <button
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'login'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : (darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700')
            }`}
          >
            Logowanie
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'register'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : (darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700')
            }`}
          >
            Rejestracja
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nazwa użytkownika"
            className={inputClass}
            required
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Hasło"
            className={inputClass}
            required
          />
          {mode === 'register' && (
            <input
              type="password"
              value={confirmedPassword}
              onChange={e => setConfirmedPassword(e.target.value)}
              placeholder="Potwierdź hasło"
              className={inputClass}
              required
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Ładowanie...' : mode === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>
        </form>
      </div>
    </div>
  );
}
