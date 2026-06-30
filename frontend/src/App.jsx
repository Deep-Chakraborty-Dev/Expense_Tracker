import { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:4000/api';

const initialForm = {
  type: 'expense',
  description: '',
  amount: '',
  category: 'Food',
  date: new Date().toISOString().split('T')[0]
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ name: '', email: '', password: '' });
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [meRes, dashboardRes, incomeRes, expenseRes] = await Promise.all([
        fetch(`${API_BASE}/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/income/get`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/expense/get`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const meData = meRes.ok ? await meRes.json() : null;
      const dashboardData = dashboardRes.ok ? await dashboardRes.json() : null;
      const incomeData = incomeRes.ok ? await incomeRes.json() : [];
      const expenseData = expenseRes.ok ? await expenseRes.json() : [];

      if (meData?.success) {
        setUser(meData.user);
      }

      if (dashboardData?.success) {
        setDashboard(dashboardData.data);
      }

      const mergedTransactions = [
        ...incomeData.map((item) => ({ ...item, type: 'income' })),
        ...expenseData.map((item) => ({ ...item, type: 'expense' }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(mergedTransactions);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Unable to load data right now.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setAuthData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const endpoint = authMode === 'login' ? '/user/login' : '/user/register';
      const payload = authMode === 'login'
        ? { email: authData.email, password: authData.password }
        : authData;

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setMessage({ type: 'success', text: authMode === 'login' ? 'Welcome back!' : 'Account created successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setDashboard(null);
    setTransactions([]);
    setMessage({ type: 'success', text: 'You have been logged out.' });
  };

  const handleTransactionChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTransactionSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formElement = event.currentTarget;
      const formData = new FormData(formElement);
      const transactionType = formData.get('type') || form.type;
      const payload = {
        description: formData.get('description')?.toString().trim(),
        amount: formData.get('amount')?.toString().trim(),
        category: formData.get('category')?.toString().trim(),
        date: formData.get('date')?.toString().trim()
      };

      const endpoint = transactionType === 'income' ? '/income/add' : '/expense/add';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save transaction');
      }

      setForm(initialForm);
      setMessage({ type: 'success', text: `${transactionType} saved successfully` });
      await loadData();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    const endpoint = type === 'income' ? `/income/delete/${id}` : `/expense/delete/${id}`;

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Unable to delete item');
      }

      setMessage({ type: 'success', text: 'Item removed successfully' });
      await loadData();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const expenseChartData = (dashboard?.spendByCategory || [])
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const incomeChartData = transactions
    .filter((item) => item.type === 'income')
    .slice(0, 6)
    .map((item) => ({
      label: item.description || 'Income',
      value: Number(item.amount || 0)
    }));

  const expenseMax = Math.max(...expenseChartData.map((item) => item.amount), 1);
  const incomeMax = Math.max(...incomeChartData.map((item) => item.value), 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Expense Tracker</p>
            <h1 className="text-xl font-semibold">Personal finance dashboard</h1>
          </div>
          {token && user && (
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
                {user.name}
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {message.text && (
        <div className={`mx-auto mt-6 max-w-7xl rounded-lg border px-4 py-3 text-sm ${message.type === 'error' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>
          {message.text}
        </div>
      )}

      {!token ? (
        <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center px-6 py-10">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/30">
            <div className="mb-6 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Welcome</p>
              <h2 className="mt-2 text-2xl font-semibold">Track income, expenses and savings</h2>
            </div>

            <div className="mb-6 flex rounded-full bg-slate-800 p-1">
              <button
                className={`flex-1 rounded-full px-3 py-2 text-sm ${authMode === 'login' ? 'bg-emerald-500 text-white' : 'text-slate-300'}`}
                onClick={() => setAuthMode('login')}
              >
                Login
              </button>
              <button
                className={`flex-1 rounded-full px-3 py-2 text-sm ${authMode === 'register' ? 'bg-emerald-500 text-white' : 'text-slate-300'}`}
                onClick={() => setAuthMode('register')}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Name</label>
                  <input
                    name="name"
                    value={authData.name}
                    onChange={handleAuthChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none ring-0"
                    placeholder="Your name"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm text-slate-300">Email</label>
                <input
                  type="email"
                  name="email"
                  value={authData.email}
                  onChange={handleAuthChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none ring-0"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Password</label>
                <input
                  type="password"
                  name="password"
                  value={authData.password}
                  onChange={handleAuthChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none ring-0"
                  placeholder="At least 8 characters"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-400 disabled:opacity-70"
              >
                {loading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Total Balance</p>
              <h3 className="mt-2 text-2xl font-semibold">${dashboard?.totalBalance?.toFixed(2) || '0.00'}</h3>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Monthly Income</p>
              <h3 className="mt-2 text-2xl font-semibold">${dashboard?.monthlyIncome?.toFixed(2) || '0.00'}</h3>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Monthly Expenses</p>
              <h3 className="mt-2 text-2xl font-semibold">${dashboard?.monthlyExpense?.toFixed(2) || '0.00'}</h3>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Add transaction</h2>
                  <p className="text-sm text-slate-400">Create a new income or expense record</p>
                </div>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleTransactionChange}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <form onSubmit={handleTransactionSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Description</label>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleTransactionChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                    placeholder="What was this for?"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      value={form.amount}
                      onChange={handleTransactionChange}
                      required
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-slate-300">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleTransactionChange}
                      required
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Category</label>
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleTransactionChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                    placeholder="Food"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-400 disabled:opacity-70"
                >
                  {loading ? 'Saving...' : `Save ${form.type}`}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Recent transactions</h2>
                  <p className="text-sm text-slate-400">Manage your latest entries</p>
                </div>
              </div>

              <div className="space-y-3">
                {transactions.length === 0 && !loading ? (
                  <div className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                    No transactions yet.
                  </div>
                ) : (
                  transactions.map((item) => (
                    <div key={`${item.type}-${item._id}`} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-slate-400">
                          {item.category} • {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.type === 'income' ? '+' : '-'}${Number(item.amount).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDelete(item.type, item._id)}
                          className="rounded-lg border border-slate-700 px-2 py-1 text-sm hover:bg-slate-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-slate-900 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">AI Insights</p>
                <h2 className="mt-2 text-xl font-semibold">Smart analysis of your income and expenses</h2>
                <p className="mt-2 text-sm text-slate-400">{dashboard?.aiInsights?.headline || 'Add transactions to unlock personalized suggestions.'}</p>
              </div>
              <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                {dashboard?.aiInsights?.score ?? 0}/100 health
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {(dashboard?.aiInsights?.suggestions?.length ? dashboard.aiInsights.suggestions : ['Record more transactions to generate richer insights.']).map((suggestion, index) => (
                <div key={`${suggestion}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
                  {suggestion}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Expense</h2>
                <p className="text-sm text-slate-400">Spending by category as vertical bars</p>
              </div>

              {expenseChartData.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                  No expense data available yet.
                </div>
              ) : (
                <div className="flex h-56 items-end gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  {expenseChartData.map((item) => (
                    <div key={item.category} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-40 w-full items-end rounded-t-xl bg-slate-800 p-1">
                        <div
                          className="w-full rounded-t-xl bg-gradient-to-t from-rose-500 to-orange-400"
                          style={{ height: `${Math.max(10, (item.amount / expenseMax) * 100)}%` }}
                        />
                      </div>
                      <span className="text-center text-[11px] text-slate-400">{item.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Income</h2>
                <p className="text-sm text-slate-400">Recent income entries as vertical bars</p>
              </div>

              {incomeChartData.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                  No income data available yet.
                </div>
              ) : (
                <div className="flex h-56 items-end gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  {incomeChartData.map((item) => (
                    <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-40 w-full items-end rounded-t-xl bg-slate-800 p-1">
                        <div
                          className="w-full rounded-t-xl bg-gradient-to-t from-emerald-500 to-cyan-400"
                          style={{ height: `${Math.max(10, (item.value / incomeMax) * 100)}%` }}
                        />
                      </div>
                      <span className="text-center text-[11px] text-slate-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      )}
    </div>
  );
};

export default App;