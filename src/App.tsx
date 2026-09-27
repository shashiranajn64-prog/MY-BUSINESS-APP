/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Wallet, 
  BookOpen, 
  Receipt, 
  BarChart3, 
  LogOut, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Search, 
  UserPlus, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  RefreshCw, 
  IndianRupee, 
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Download
} from 'lucide-react';

// Default Supabase Configuration (Set to user project)
const DEFAULT_SUPABASE_URL = 'https://iddbbcvyitqercvadmct.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_ECcr2-SRlRlnjW8d0Yh-Vg_LEt9gtm1';

export default function App() {
  // Supabase Configuration State
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    const saved = localStorage.getItem('mb_supabase_url');
    if (saved && saved.startsWith('http') && !saved.includes('YOUR_PROJECT')) {
      return saved.trim();
    }
    return DEFAULT_SUPABASE_URL;
  });
  const [supabaseKey, setSupabaseKey] = useState(() => {
    const saved = localStorage.getItem('mb_supabase_key');
    if (saved && saved.length > 10 && !saved.includes('YOUR_ANON_KEY')) {
      return saved.trim();
    }
    return DEFAULT_SUPABASE_KEY;
  });
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileInput, setMobileInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'cash' | 'khata' | 'bill' | 'hisab'>('cash');

  // TAB 1: Cash Counter State (Denominations)
  const notes = [500, 200, 100, 50, 20, 10, 5, 2, 1];
  const noteColors: Record<number, string> = {
    500: '#a8b5a2',
    200: '#f4b400',
    100: '#8e7cc3',
    50: '#6fa8dc',
    20: '#e8d44d',
    10: '#aaaaaa',
    5: '#82c99a',
    2: '#f1948a',
    1: '#85c1e9'
  };
  const [counts, setCounts] = useState<Record<number, number>>({
    500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0
  });

  // TAB 2: Khata Book State
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [transAmount, setTransAmount] = useState('');
  const [transNote, setTransNote] = useState('');
  const [transType, setTransType] = useState<'gave' | 'got'>('gave'); // gave = udhar, got = payment received
  const [khataSearch, setKhataSearch] = useState('');

  // TAB 3: Bill Generator State & Shop Details
  const [shopDetails, setShopDetails] = useState(() => {
    const saved = localStorage.getItem('shopDetails');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      shop_name: 'Shashi General Store',
      address: 'Mathurapur Muzaffarpur 843113',
      mobile: '7870089309',
      gst: '',
      footer: 'Dhanyavad! Phir Aaiye'
    };
  });
  const [showShopSettings, setShowShopSettings] = useState(false);

  const [billCustomerName, setBillCustomerName] = useState('Cash Customer');
  const [billCustomerPhone, setBillCustomerPhone] = useState('');
  const [billItems, setBillItems] = useState<Array<{name: string, qty: number, rate: number, total: number}>>([]);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemRate, setItemRate] = useState('');
  const [discountRs, setDiscountRs] = useState('0');
  const [previewMode, setPreviewMode] = useState<'thermal' | 'a5'>('thermal');
  const [currentBillNo] = useState(() => Math.floor(100000 + Math.random() * 900000));
  
  const [savedBills, setSavedBills] = useState<any[]>(() => {
    const saved = localStorage.getItem('mb_saved_bills');
    return saved ? JSON.parse(saved) : [];
  });
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [viewingBill, setViewingBill] = useState<any>(null);

  // Initialize Supabase Client
  useEffect(() => {
    try {
      const cleanUrl = supabaseUrl?.trim();
      const cleanKey = supabaseKey?.trim();
      if (cleanUrl && cleanKey && cleanUrl.startsWith('http') && !cleanUrl.includes('YOUR_PROJECT')) {
        const client = createClient(cleanUrl, cleanKey);
        setSupabaseClient(client);
        checkUser(client);
      } else {
        // Fallback demo mode if Supabase not configured
        setLoading(false);
        const demoUser = localStorage.getItem('mb_demo_user');
        if (demoUser) {
          setUser(JSON.parse(demoUser));
        }
      }
    } catch (err) {
      console.error("Supabase init error:", err);
      setLoading(false);
    }
  }, [supabaseUrl, supabaseKey]);

  const checkUser = async (client: SupabaseClient) => {
    try {
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        setUser(user);
        fetchAppData(user.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const mobileToEmail = (mobile: string) => {
    return mobile.trim() + '@mybusiness.app';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!mobileInput || mobileInput.length < 10) {
      setAuthError('Kripya 10 ank ka mobile number dalein.');
      return;
    }
    if (!passwordInput || passwordInput.length < 6) {
      setAuthError('Password kam se kam 6 akshar ka hona chahiye.');
      return;
    }

    const email = mobileToEmail(mobileInput);

    if (!supabaseClient || supabaseUrl.includes('YOUR_PROJECT')) {
      // Demo Mode Authentication
      if (authMode === 'signup') {
        const fakeUser = { id: 'demo-' + mobileInput, email, user_metadata: { mobile: mobileInput } };
        localStorage.setItem('mb_demo_user', JSON.stringify(fakeUser));
        setUser(fakeUser);
        setAuthSuccess('Account safaltapurvak ban gaya! (Demo Mode)');
      } else {
        const fakeUser = { id: 'demo-' + mobileInput, email, user_metadata: { mobile: mobileInput } };
        localStorage.setItem('mb_demo_user', JSON.stringify(fakeUser));
        setUser(fakeUser);
        setAuthSuccess('Login safal raha! (Demo Mode)');
      }
      setLoading(false);
      return;
    }

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password: passwordInput,
          options: { data: { mobile: mobileInput } }
        });
        if (error) throw error;
        if (data.user) {
          setUser(data.user);
          setAuthSuccess('Account safaltapurvak ban gaya!');
          fetchAppData(data.user.id);
        }
      } else {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password: passwordInput
        });
        if (error) throw error;
        if (data.user) {
          setUser(data.user);
          setAuthSuccess('Login safal raha!');
          fetchAppData(data.user.id);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication mein samasya aayi.');
    }
  };

  const handleLogout = async () => {
    if (supabaseClient && !supabaseUrl.includes('YOUR_PROJECT')) {
      await supabaseClient.auth.signOut();
    }
    localStorage.removeItem('mb_demo_user');
    setUser(null);
    setMobileInput('');
    setPasswordInput('');
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('mb_supabase_url', supabaseUrl);
    localStorage.setItem('mb_supabase_key', supabaseKey);
    setShowSettings(false);
    window.location.reload();
  };

  // Fetch Data from Supabase with RLS user_id filter
  const fetchAppData = async (userId: string) => {
    if (!supabaseClient || supabaseUrl.includes('YOUR_PROJECT')) return;
    try {
      // Fetch Customers
      const { data: custData } = await supabaseClient
        .from('mb_customers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (custData) setCustomers(custData);

      // Fetch Transactions
      const { data: txData } = await supabaseClient
        .from('mb_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (txData) setTransactions(txData);

      // Fetch Bills
      const { data: billData } = await supabaseClient
        .from('mb_bills')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (billData) setSavedBills(billData);
    } catch (e) {
      console.error("Error fetching app data:", e);
    }
  };

  // TAB 1: Cash Counter Calculations
  const updateCount = (note: number, delta: number) => {
    setCounts(prev => {
      const current = prev[note] || 0;
      const updated = Math.max(0, current + delta);
      return { ...prev, [note]: updated };
    });
  };

  const handleCountChange = (note: number, val: string) => {
    const num = parseInt(val) || 0;
    setCounts(prev => ({ ...prev, [note]: Math.max(0, num) }));
  };

  const totalCash = notes.reduce((sum, note) => sum + note * (counts[note] || 0), 0);
  const totalNotesCount = notes.reduce((sum, note) => sum + (counts[note] || 0), 0);

  const resetCash = () => {
    setCounts({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 });
  };

  // TAB 2: Khata Actions
  const addCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    const newCust = {
      name: newCustomerName,
      phone: newCustomerPhone || '',
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    if (supabaseClient && !supabaseUrl.includes('YOUR_PROJECT')) {
      const { data, error } = await supabaseClient
        .from('mb_customers')
        .insert([newCust])
        .select();
      if (!error && data) {
        setCustomers([data[0], ...customers]);
        setSelectedCustomer(data[0]);
      }
    } else {
      // Local demo fallback
      const localCust = { id: 'cust-' + Date.now(), ...newCust };
      const updated = [localCust, ...customers];
      setCustomers(updated);
      setSelectedCustomer(localCust);
      localStorage.setItem('mb_local_cust_' + user.id, JSON.stringify(updated));
    }

    setNewCustomerName('');
    setNewCustomerPhone('');
    setShowAddCustomer(false);
  };

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !transAmount) return;

    const amount = parseFloat(transAmount) || 0;
    const newTx = {
      customer_id: selectedCustomer.id,
      amount,
      type: transType, // 'gave' or 'got'
      note: transNote || '',
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    if (supabaseClient && !supabaseUrl.includes('YOUR_PROJECT')) {
      const { data, error } = await supabaseClient
        .from('mb_transactions')
        .insert([newTx])
        .select();
      if (!error && data) {
        setTransactions([data[0], ...transactions]);
      }
    } else {
      const localTx = { id: 'tx-' + Date.now(), ...newTx };
      const updated = [localTx, ...transactions];
      setTransactions(updated);
      localStorage.setItem('mb_local_tx_' + user.id, JSON.stringify(updated));
    }

    setTransAmount('');
    setTransNote('');
  };

  // Calculate Customer Balance
  const getCustomerBalance = (customerId: string) => {
    const custTxs = transactions.filter(t => t.customer_id === customerId);
    let balance = 0; // positive means they owe us (Udhar), negative means we owe them
    custTxs.forEach(t => {
      if (t.type === 'gave') balance += t.amount;
      else balance -= t.amount;
    });
    return balance;
  };

  const downloadCustomerCSV = () => {
    if (!selectedCustomer) return;
    const custTxs = transactions.filter(t => t.customer_id === selectedCustomer.id);
    const headers = ['Transaction ID', 'Customer Name', 'Phone', 'Type (Gave/Got)', 'Amount', 'Note', 'Date'];
    const rows = custTxs.map(t => [
      t.id,
      `"${selectedCustomer.name}"`,
      selectedCustomer.phone || '',
      t.type === 'gave' ? 'Diya (Udhar)' : 'Liya (Payment)',
      t.amount,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      new Date(t.created_at).toLocaleString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedCustomer.name}_transactions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // TAB 3: Bill Generator Functions & Shop Details
  const saveShopDetails = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('shopDetails', JSON.stringify(shopDetails));
    setShowShopSettings(false);
    alert('Shop Details Safaltapurvak Save Ho Gayi!');
  };

  const addItemToBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemRate) return;
    const rate = parseFloat(itemRate) || 0;
    const qty = parseInt(itemQty) || 1;
    const total = qty * rate;
    setBillItems([...billItems, { name: itemName, qty, rate, total }]);
    setItemName('');
    setItemRate('');
    setItemQty('1');
  };

  const removeBillItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const discountValue = parseFloat(discountRs) || 0;
  const payable = Math.max(0, subtotal - discountValue);

  const printThermal = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const thermalHtml = document.getElementById('thermalBill')?.innerHTML || '';
    printWindow.document.write(`
      <html>
        <head>
          <title>Thermal Bill #${currentBillNo}</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            body { font-family: monospace; font-size: 11px; width: 58mm; margin: 0; padding: 6px; background: white; color: black; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 2px 0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-dashed { border-bottom: 1px dashed #000; margin: 5px 0; }
          </style>
        </head>
        <body>
          ${thermalHtml}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printA5 = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const a5Html = document.getElementById('a5Bill')?.innerHTML || '';
    printWindow.document.write(`
      <html>
        <head>
          <title>A5 Bill #${currentBillNo}</title>
          <style>
            @page { size: A5; margin: 10mm; }
            body { font-family: sans-serif; font-size: 12px; margin: 0; padding: 10px; background: white; color: black; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; }
            th { background: #f0f0f0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
          </style>
        </head>
        <body>
          ${a5Html}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const shareWhatsApp = () => {
    const itemsText = billItems.map((item, i) => `${i+1}. ${item.name} x ${item.qty} = ₹${item.total}`).join('\n');
    const text = `*${shopDetails.shop_name}*\n${shopDetails.address}\nMob: ${shopDetails.mobile}\n\n*Bill No:* #${currentBillNo}\n*Customer:* ${billCustomerName}\n*Date:* ${new Date().toLocaleDateString('hi-IN')}\n\n*Items:*\n${itemsText}\n\n*Subtotal:* ₹${subtotal}\n*Discount:* ₹${discountValue}\n*Grand Payable:* ₹${payable}\n\n${shopDetails.footer}\n*Powered by Shashi Ranjan*`;
    const url = `https://wa.me/${billCustomerPhone ? '91' + billCustomerPhone : ''}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const saveAndPrintBill = async () => {
    if (billItems.length === 0) return;
    const billData = {
      id: 'bill-' + Date.now(),
      bill_no: currentBillNo,
      customer_name: billCustomerName || 'Cash Customer',
      customer_phone: billCustomerPhone || '',
      items: billItems,
      subtotal,
      discount: discountValue,
      total: payable,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    const updated = [billData, ...savedBills];
    setSavedBills(updated);
    localStorage.setItem('mb_saved_bills', JSON.stringify(updated));

    if (supabaseClient && !supabaseUrl.includes('YOUR_PROJECT')) {
      try {
        await supabaseClient
          .from('mb_bills')
          .insert([{
            customer_name: billData.customer_name,
            customer_phone: billData.customer_phone,
            items: billItems,
            subtotal,
            discount: discountValue,
            tax: 0,
            total: payable,
            user_id: user.id,
            created_at: billData.created_at
          }]);
      } catch (e) {
        console.error("Error saving bill to supabase:", e);
      }
    }

    if (previewMode === 'thermal') {
      printThermal();
    } else {
      printA5();
    }
  };

  const deleteBill = (id: string) => {
    if (confirm('Kya aap is bill ko delete karna chahte hain?')) {
      const updated = savedBills.filter(b => b.id !== id);
      setSavedBills(updated);
      localStorage.setItem('mb_saved_bills', JSON.stringify(updated));
    }
  };

  const editBill = (bill: any) => {
    setBillCustomerName(bill.customer_name || 'Cash Customer');
    setBillCustomerPhone(bill.customer_phone || '');
    setBillItems(bill.items || []);
    setDiscountRs(bill.discount ? bill.discount.toString() : '0');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert(`Bill #${bill.bill_no || ''} edit karne ke liye form mein load kar diya gaya hai.`);
  };

  // TAB 4: Hisab (Calculations)
  const totalUdharGiven = customers.reduce((acc, c) => {
    const bal = getCustomerBalance(c.id);
    return acc + (bal > 0 ? bal : 0);
  }, 0);

  const totalAdvanceCollected = customers.reduce((acc, c) => {
    const bal = getCustomerBalance(c.id);
    return acc + (bal < 0 ? Math.abs(bal) : 0);
  }, 0);

  const totalSalesToday = savedBills.reduce((acc, b) => acc + (b.total || 0), 0);

  // Extract mobile from user email or metadata
  const userMobile = user?.user_metadata?.mobile || user?.email?.split('@')[0] || '9876543210';

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-lg font-medium">My Business App Load Ho Raha Hai...</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LOGIN / SIGNUP SCREEN
  // ----------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-neutral-900 to-amber-950 flex flex-col justify-between text-neutral-100 font-sans">
        {/* Top Header */}
        <header className="py-6 px-6 text-center border-b border-red-900/40 bg-black/40 backdrop-blur-md">
          <div className="inline-flex items-center justify-center bg-red-900/40 border border-red-600/50 p-3 rounded-2xl mb-2 shadow-lg shadow-red-900/20">
            <Wallet className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-wider text-amber-400">MY BUSINESS APP</h1>
          <p className="text-xs text-neutral-400 mt-1">Cash Counter, Khata, Bill & Hisab Ek Hi Jagah</p>
        </header>

        {/* Auth Form Container */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md bg-neutral-900/90 border border-red-900/50 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-red-600 to-amber-500"></div>
            
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-neutral-100">
                {authMode === 'login' ? 'Dukaan Par Login Karein' : 'Naya Business Account Banayein'}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">Apne 10 anko ke mobile number se shuru karein</p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Mobile Number (10 digits)</label>
                <div className="flex rounded-xl overflow-hidden border border-neutral-700 focus-within:border-amber-500 bg-neutral-950">
                  <span className="bg-neutral-800 px-3.5 py-3 text-neutral-300 font-bold text-sm flex items-center border-r border-neutral-700">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={mobileInput}
                    onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-transparent px-4 py-3 text-white text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Password (6+ characters)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition duration-200 text-sm cursor-pointer mt-2"
              >
                {authMode === 'login' ? 'Login Karo' : 'Naya Account Banao'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); setAuthSuccess(''); }}
                className="text-xs text-amber-400 hover:underline font-medium cursor-pointer"
              >
                {authMode === 'login' ? "Account nahi hai? Naya Account Banao" : "Pehle se account hai? Login Karo"}
              </button>
            </div>

            {/* Supabase Config Status Button */}
            <div className="mt-8 pt-4 border-t border-neutral-800 text-center">
              <button
                onClick={() => setShowSettings(true)}
                className="text-[11px] text-neutral-400 hover:text-neutral-200 inline-flex items-center gap-1.5 cursor-pointer bg-neutral-800/60 px-3 py-1.5 rounded-lg border border-neutral-700/50"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span>Supabase Database Settings</span>
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-neutral-400 border-t border-red-900/40 bg-black/40">
          Powered by Shashi Ranjan
        </footer>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                Supabase Connection Settings
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                Apna Supabase URL aur Anon Key yahan dalein taaki data cloud par safe rahe aur RLS enable ho sake.
              </p>
              <form onSubmit={saveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Supabase URL</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xxx.supabase.co"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Supabase Anon Key</label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOi..."
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    Radd Karein
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    Save & Connect
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN APP AFTER LOGIN (4 TABS)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col justify-between selection:bg-amber-500 selection:text-neutral-950">
      
      {/* HEADER: Gradient #4A0A0A to #8B0000 */}
      <header className="bg-gradient-to-r from-[#4A0A0A] via-[#660000] to-[#8B0000] text-white shadow-xl sticky top-0 z-40 border-b border-red-900/60">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black/30 p-2.5 rounded-xl border border-red-600/30 shadow-inner">
              <Wallet className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-wider text-amber-400 drop-shadow-sm">MY BUSINESS APP</h1>
              <div className="flex items-center gap-2 text-xs text-neutral-200 mt-0.5">
                <span className="bg-black/40 px-2 py-0.5 rounded-md font-mono border border-white/10">
                  +91 {userMobile}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/50">
                  <ShieldCheck className="w-3 h-3" /> Secure RLS
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              title="Settings"
              className="bg-black/30 hover:bg-black/50 p-2 rounded-xl border border-white/10 text-neutral-200 transition cursor-pointer"
            >
              <Settings className="w-4 h-4 text-amber-400" />
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-900/60 hover:bg-red-800/80 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-red-700/50 shadow-md transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="max-w-4xl mx-auto px-4 flex border-t border-red-900/40 bg-black/25 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('cash')}
            className={`flex-1 py-3 px-4 text-xs md:text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeTab === 'cash' 
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-lg' 
                : 'text-neutral-300 hover:text-white border-transparent hover:bg-white/5'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>💰 CASH</span>
          </button>

          <button
            onClick={() => setActiveTab('khata')}
            className={`flex-1 py-3 px-4 text-xs md:text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeTab === 'khata' 
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-lg' 
                : 'text-neutral-300 hover:text-white border-transparent hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📒 खाताबुक</span>
          </button>

          <button
            onClick={() => setActiveTab('bill')}
            className={`flex-1 py-3 px-4 text-xs md:text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeTab === 'bill' 
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-lg' 
                : 'text-neutral-300 hover:text-white border-transparent hover:bg-white/5'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>🧾 BILL</span>
          </button>

          <button
            onClick={() => setActiveTab('hisab')}
            className={`flex-1 py-3 px-4 text-xs md:text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition cursor-pointer border-b-2 ${
              activeTab === 'hisab' 
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-lg' 
                : 'text-neutral-300 hover:text-white border-transparent hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 हिसाब</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 mb-16">
        
        {/* ==================================================== */}
        {/* TAB 1: CASH COUNTER */}
        {/* ==================================================== */}
        {activeTab === 'cash' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-md">
              <div>
                <h2 className="text-sm font-bold text-neutral-300">Cash Counter / Denominations</h2>
                <p className="text-xs text-neutral-400">Notes ki sankhya darj karein aur kul cash dekhein</p>
              </div>
              <button
                onClick={resetCash}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-xl text-xs font-medium border border-neutral-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset Karo</span>
              </button>
            </div>

            {/* Denomination Rows */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl divide-y divide-neutral-800/80">
              {notes.map((note) => {
                const count = counts[note] || 0;
                const subtotal = note * count;
                const noteColor = noteColors[note] || '#fff';

                return (
                  <div key={note} className="p-3 md:p-4 flex items-center justify-between gap-2 md:gap-4 hover:bg-neutral-850 transition">
                    
                    {/* Note Box + Plus / Minus Buttons */}
                    <div className="flex items-center gap-2 md:gap-3 w-36 md:w-44 shrink-0">
                      <div 
                        className="w-16 md:w-20 py-1.5 px-2 rounded-xl text-neutral-950 font-black text-center text-xs md:text-sm shadow-md border border-white/20 flex items-center justify-center gap-0.5"
                        style={{ backgroundColor: noteColor }}
                      >
                        <IndianRupee className="w-3.5 h-3.5 text-neutral-900" />
                        <span>{note}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateCount(note, -1)}
                          className="w-8 h-8 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 flex items-center justify-center font-bold text-base transition cursor-pointer active:scale-95 shadow"
                          title="Kam Karein"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateCount(note, 1)}
                          className="w-8 h-8 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800 flex items-center justify-center font-bold text-base transition cursor-pointer active:scale-95 shadow"
                          title="Badhayein"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Note x Label */}
                    <div className="text-xs font-bold text-neutral-400 hidden sm:block w-16 text-center">
                      × {note}
                    </div>

                    {/* White Input for Count */}
                    <div className="w-20 md:w-28">
                      <input
                        type="number"
                        min="0"
                        value={count === 0 ? '' : count}
                        onChange={(e) => handleCountChange(note, e.target.value)}
                        placeholder="0"
                        className="w-full bg-white text-neutral-950 font-bold text-center py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm md:text-base shadow-inner"
                      />
                    </div>

                    <div className="text-neutral-500 font-bold">=</div>

                    {/* Yellow Amount Count * Note */}
                    <div className="w-28 md:w-36 text-right font-mono font-black text-amber-400 text-sm md:text-lg bg-neutral-950/60 px-3 py-2 rounded-xl border border-neutral-800">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total at bottom with gold gradient */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-5 rounded-3xl shadow-2xl text-neutral-950 flex items-center justify-between border-2 border-amber-300">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">Kul Notes: {totalNotesCount}</p>
                <h3 className="text-xl md:text-2xl font-black">Total Cash Amount</h3>
              </div>
              <div className="text-2xl md:text-4xl font-black tracking-tight font-mono bg-neutral-950 text-amber-400 px-4 py-2 rounded-2xl shadow-inner border border-amber-400/40">
                ₹{totalCash.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: KHATA BOOK (खाताबुक) */}
        {/* ==================================================== */}
        {activeTab === 'khata' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Customer List Column */}
            <div className="md:col-span-1 bg-neutral-900 border border-neutral-800 rounded-3xl p-4 flex flex-col h-[600px] shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Grahak (Customers)
                </h3>
                <button
                  onClick={() => setShowAddCustomer(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 p-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Naya</span>
                </button>
              </div>

              {/* Search Grahak */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Grahak khojein..."
                  value={khataSearch}
                  onChange={(e) => setKhataSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                />
              </div>

              {/* Customers List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {customers
                  .filter(c => c.name.toLowerCase().includes(khataSearch.toLowerCase()))
                  .map(cust => {
                    const balance = getCustomerBalance(cust.id);
                    const isSelected = selectedCustomer?.id === cust.id;

                    return (
                      <div
                        key={cust.id}
                        onClick={() => setSelectedCustomer(cust)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? 'bg-amber-500/10 border-amber-500/60 shadow-md' 
                            : 'bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-850'
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-bold text-white">{cust.name}</h4>
                          <p className="text-[10px] text-neutral-400">{cust.phone || 'No Phone'}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-bold font-mono ${balance > 0 ? 'text-red-400' : balance < 0 ? 'text-emerald-400' : 'text-neutral-400'}`}>
                            {balance > 0 ? `₹${balance} Dene hain` : balance < 0 ? `₹{Math.abs(balance)} Jama` : 'Clear'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                {customers.length === 0 && (
                  <div className="text-center py-12 text-neutral-500 text-xs">
                    Koi grahak nahi hai. 'Naya' button dabayein.
                  </div>
                )}
              </div>
            </div>

            {/* Customer Details & Transactions Column */}
            <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-4 md:p-6 flex flex-col h-[600px] shadow-xl">
              {selectedCustomer ? (
                <>
                  {/* Selected Customer Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                    <div>
                      <h3 className="text-base font-bold text-white">{selectedCustomer.name}</h3>
                      <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-amber-400" />
                        {selectedCustomer.phone || 'Number uplabdh nahi hai'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={downloadCustomerCSV}
                        className="bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition"
                        title="Download CSV Backup"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV Backup</span>
                      </button>
                      <div className="text-right">
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Kul Balance</p>
                        {(() => {
                          const bal = getCustomerBalance(selectedCustomer.id);
                          return (
                            <p className={`text-sm md:text-base font-black font-mono ${bal > 0 ? 'text-red-400' : bal < 0 ? 'text-emerald-400' : 'text-neutral-300'}`}>
                              {bal > 0 ? `₹${bal} (Udhar)` : bal < 0 ? `₹{Math.abs(bal)} (Advance)` : '₹0 (Hisab Clear)'}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Add Transaction Form */}
                  <form onSubmit={addTransaction} className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <input
                        type="number"
                        placeholder="Rakam (₹)"
                        value={transAmount}
                        onChange={(e) => setTransAmount(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Vivar / Note (Optional)"
                        value={transNote}
                        onChange={(e) => setTransNote(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        onClick={() => setTransType('gave')}
                        className="flex-1 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 font-bold py-2 rounded-xl text-xs cursor-pointer shadow transition flex items-center justify-center gap-1"
                      >
                        <ArrowUpRight className="w-3 h-3" />
                        <span>Diya (-)</span>
                      </button>
                      <button
                        type="submit"
                        onClick={() => setTransType('got')}
                        className="flex-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 font-bold py-2 rounded-xl text-xs cursor-pointer shadow transition flex items-center justify-center gap-1"
                      >
                        <ArrowDownRight className="w-3 h-3" />
                        <span>Liya (+)</span>
                      </button>
                    </div>
                  </form>

                  {/* Transactions History */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar pt-2">
                    <h4 className="text-xs font-semibold text-neutral-400 mb-2">Len-Den Itihas</h4>
                    {transactions
                      .filter(t => t.customer_id === selectedCustomer.id)
                      .map(tx => (
                        <div key={tx.id} className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-white">{tx.note || (tx.type === 'gave' ? 'Udhar Diya' : 'Rakam Prapt Hui')}</p>
                            <p className="text-[10px] text-neutral-500">{new Date(tx.created_at).toLocaleDateString('hi-IN')} {new Date(tx.created_at).toLocaleTimeString('hi-IN', {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                          <div className={`text-xs font-bold font-mono ${tx.type === 'gave' ? 'text-red-400' : 'text-emerald-400'}`}>
                            {tx.type === 'gave' ? `-₹${tx.amount}` : `+₹${tx.amount}`}
                          </div>
                        </div>
                      ))}
                    {transactions.filter(t => t.customer_id === selectedCustomer.id).length === 0 && (
                      <div className="text-center py-16 text-neutral-500 text-xs">
                        Abhi tak koi len-den darj nahi hai.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-500">
                  <BookOpen className="w-12 h-12 text-neutral-700 mb-2" />
                  <p className="text-sm font-medium">Koi Grahak Chunein</p>
                  <p className="text-xs text-neutral-600 mt-1">Left side se grahak par click karein ya naya banayein.</p>
                </div>
              )}
            </div>

            {/* Add Customer Modal */}
            {showAddCustomer && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                  <h3 className="text-base font-bold text-white mb-3">Naya Grahak Jodein</h3>
                  <form onSubmit={addCustomer} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">Grahak Ka Naam</label>
                      <input
                        type="text"
                        placeholder="Jaise: Ramesh Kumar"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">Mobile Number (Optional)</label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddCustomer(false)}
                        className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 rounded-xl text-xs cursor-pointer"
                      >
                        Radd Karein
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2 rounded-xl text-xs cursor-pointer"
                      >
                        Jodein
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: BILL GENERATOR */}
        {/* ==================================================== */}
        {activeTab === 'bill' && (
          <div className="space-y-6">
            
            {/* 1. Shop Details Header / Settings Bar */}
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-3xl shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/30">
                  <Settings className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{shopDetails.shop_name}</h3>
                  <p className="text-xs text-neutral-400">{shopDetails.address} | Mob: {shopDetails.mobile}</p>
                </div>
              </div>
              <button
                onClick={() => setShowShopSettings(!showShopSettings)}
                className="bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer shadow transition"
              >
                {showShopSettings ? 'Settings Band Karein' : '⚙️ Shop Details Edit'}
              </button>
            </div>

            {/* Collapsible Shop Details Form */}
            {showShopSettings && (
              <form onSubmit={saveShopDetails} className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-2xl space-y-4">
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Shop Details & Invoice Header Configuration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">Shop Name</label>
                    <input
                      type="text"
                      value={shopDetails.shop_name}
                      onChange={(e) => setShopDetails({...shopDetails, shop_name: e.target.value})}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">Address</label>
                    <input
                      type="text"
                      value={shopDetails.address}
                      onChange={(e) => setShopDetails({...shopDetails, address: e.target.value})}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">Mobile</label>
                    <input
                      type="text"
                      value={shopDetails.mobile}
                      onChange={(e) => setShopDetails({...shopDetails, mobile: e.target.value})}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">GSTIN (Optional)</label>
                    <input
                      type="text"
                      value={shopDetails.gst}
                      onChange={(e) => setShopDetails({...shopDetails, gst: e.target.value})}
                      placeholder="e.g. 10AAAAA0000A1Z5"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-neutral-400 mb-1 font-medium">Footer Message</label>
                    <input
                      type="text"
                      value={shopDetails.footer}
                      onChange={(e) => setShopDetails({...shopDetails, footer: e.target.value})}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow"
                  >
                    Save Shop Details
                  </button>
                </div>
              </form>
            )}

            {/* Main Bill Section: Form & Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 2. Bill Form Column */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  Naya Bill Banayein
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Grahak Ka Naam</label>
                    <input
                      type="text"
                      value={billCustomerName}
                      onChange={(e) => setBillCustomerName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Grahak Mobile (Optional)</label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={billCustomerPhone}
                      onChange={(e) => setBillCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Add Item Form */}
                <form onSubmit={addItemToBill} className="bg-neutral-950/60 border border-neutral-800 p-3.5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-semibold text-neutral-300">Item Jodein</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Item Name"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={itemQty}
                        onChange={(e) => setItemQty(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="number"
                        placeholder="Rate (₹)"
                        value={itemRate}
                        onChange={(e) => setItemRate(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2 rounded-xl text-xs cursor-pointer shadow transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Item Add Karein</span>
                  </button>
                </form>

                {/* Items List Table */}
                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                  {billItems.map((item, idx) => (
                    <div key={idx} className="bg-neutral-950 border border-neutral-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{idx + 1}. {item.name}</span>
                        <span className="text-neutral-400 ml-2">({item.qty} × ₹{item.rate})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-amber-400">₹{item.total}</span>
                        <button
                          onClick={() => removeBillItem(idx)}
                          className="text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {billItems.length === 0 && (
                    <div className="text-center py-6 text-neutral-500 text-xs">
                      Koi item nahi joda gaya.
                    </div>
                  )}
                </div>

                {/* Totals & Discount */}
                <div className="space-y-2 pt-2 border-t border-neutral-800 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-white">₹{subtotal}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-neutral-400">Discount (₹):</span>
                    <input
                      type="number"
                      value={discountRs}
                      onChange={(e) => setDiscountRs(e.target.value)}
                      className="w-24 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-right text-white"
                    />
                  </div>
                  <div className="flex justify-between text-sm font-bold text-amber-400 pt-2 border-t border-neutral-800">
                    <span>Grand Payable:</span>
                    <span className="font-mono text-base">₹{payable.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 3. Preview Column with Toggle & Previews */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col justify-between">
                
                <div>
                  {/* Toggle Buttons */}
                  <div className="flex gap-2 mb-4 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800">
                    <button
                      onClick={() => setPreviewMode('thermal')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                        previewMode === 'thermal'
                          ? 'bg-amber-400 text-neutral-950 shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      🧾 THERMAL 58mm
                    </button>
                    <button
                      onClick={() => setPreviewMode('a5')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                        previewMode === 'a5'
                          ? 'bg-amber-400 text-neutral-950 shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      📄 NORMAL A5
                    </button>
                  </div>

                  {/* PREVIEW CONTAINER (bg-white text-black) */}
                  <div className="overflow-x-auto p-2 bg-neutral-950 rounded-2xl border border-neutral-800 flex justify-center max-h-[420px]">
                    
                    {/* 4. THERMAL PREVIEW (id="thermalBill") */}
                    {previewMode === 'thermal' && (
                      <div id="thermalBill" className="w-[220px] bg-white text-black p-3 font-mono text-[11px] border border-dashed border-neutral-400 shadow-md">
                        <div className="text-center pb-2 border-b border-dashed border-black mb-2">
                          <h3 className="font-bold text-[14px] uppercase">{shopDetails.shop_name}</h3>
                          <p className="text-[10px]">{shopDetails.address}</p>
                          <p className="text-[10px]">Mob: {shopDetails.mobile}</p>
                          {shopDetails.gst && <p className="text-[10px]">GSTIN: {shopDetails.gst}</p>}
                        </div>

                        <div className="border-b border-dashed border-black pb-2 mb-2 space-y-0.5 text-[10px]">
                          <div><strong>Bill No:</strong> #{currentBillNo}</div>
                          <div><strong>Date:</strong> {new Date().toLocaleDateString('hi-IN')} {new Date().toLocaleTimeString('hi-IN', {hour: '2-digit', minute:'2-digit'})}</div>
                          <div><strong>Customer:</strong> {billCustomerName} {billCustomerPhone ? `(${billCustomerPhone})` : ''}</div>
                        </div>

                        <div className="border-b border-dashed border-black pb-2 mb-2">
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="border-b border-black">
                                <th className="text-left pb-1">#</th>
                                <th className="text-left pb-1">Item</th>
                                <th className="text-right pb-1">Qty×Rate=Amt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {billItems.map((item, i) => (
                                <tr key={i}>
                                  <td className="py-0.5">{i + 1}</td>
                                  <td className="py-0.5 truncate max-w-[80px]">{item.name}</td>
                                  <td className="py-0.5 text-right">{item.qty}×{item.rate}={item.total}</td>
                                </tr>
                              ))}
                              {billItems.length === 0 && (
                                <tr>
                                  <td colSpan={3} className="text-center py-2 text-neutral-500">No Items</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        <div className="space-y-0.5 pb-2 border-b border-dashed border-black mb-2 text-[11px]">
                          <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal}</span></div>
                          {discountValue > 0 && <div className="flex justify-between"><span>Discount:</span><span>-₹{discountValue}</span></div>}
                          <div className="flex justify-between font-bold text-[13px] pt-1">
                            <span>Payable:</span>
                            <span>₹{payable.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="text-center text-[10px] space-y-0.5">
                          <p>{shopDetails.footer}</p>
                          <p className="text-[9px] text-neutral-500">Powered by Shashi Ranjan</p>
                        </div>
                      </div>
                    )}

                    {/* 5. A5 PREVIEW (id="a5Bill") */}
                    {previewMode === 'a5' && (
                      <div id="a5Bill" className="w-full max-w-[700px] bg-white text-black p-6 border-2 border-black text-xs font-sans shadow-md space-y-4">
                        <div className="flex justify-between items-start border-b-2 border-black pb-3">
                          <div>
                            <h2 className="text-[22px] font-black uppercase tracking-tight">{shopDetails.shop_name}</h2>
                            <p className="text-neutral-700">{shopDetails.address}</p>
                            <p className="text-neutral-700">Mob: {shopDetails.mobile}</p>
                          </div>
                          {shopDetails.gst && (
                            <div className="border border-black p-2 text-right text-[11px]">
                              <strong>GSTIN:</strong> {shopDetails.gst}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-3 border border-black text-[11px]">
                          <div>
                            <p><strong>Customer Name:</strong> {billCustomerName}</p>
                            <p><strong>Customer Mobile:</strong> {billCustomerPhone || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p><strong>Bill No:</strong> #{currentBillNo}</p>
                            <p><strong>Date:</strong> {new Date().toLocaleDateString('hi-IN')}</p>
                          </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full border-collapse border border-black text-xs">
                          <thead>
                            <tr className="bg-neutral-200 text-black">
                              <th className="border border-black p-2 text-center w-10">S.No</th>
                              <th className="border border-black p-2 text-left">Item Name</th>
                              <th className="border border-black p-2 text-center w-16">Qty</th>
                              <th className="border border-black p-2 text-right w-20">Rate (₹)</th>
                              <th className="border border-black p-2 text-right w-24">Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {billItems.map((item, i) => (
                              <tr key={i}>
                                <td className="border border-black p-2 text-center">{i + 1}</td>
                                <td className="border border-black p-2">{item.name}</td>
                                <td className="border border-black p-2 text-center">{item.qty}</td>
                                <td className="border border-black p-2 text-right">₹{item.rate}</td>
                                <td className="border border-black p-2 text-right font-bold">₹{item.total}</td>
                              </tr>
                            ))}
                            {billItems.length === 0 && (
                              <tr>
                                <td colSpan={5} className="border border-black p-4 text-center text-neutral-500">Koi item nahi joda gaya.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>

                        {/* Bottom Right Totals */}
                        <div className="flex justify-end pt-2">
                          <div className="w-64 space-y-1 text-right text-xs">
                            <div className="flex justify-between py-1 border-b border-neutral-300">
                              <span>Subtotal:</span>
                              <span className="font-mono">₹{subtotal}</span>
                            </div>
                            {discountValue > 0 && (
                              <div className="flex justify-between py-1 border-b border-neutral-300">
                                <span>Discount:</span>
                                <span className="font-mono">-₹{discountValue}</span>
                              </div>
                            )}
                            <div className="flex justify-between py-2 text-[18px] font-black border-t-2 border-black">
                              <span>Grand Payable:</span>
                              <span className="font-mono text-amber-700">₹{payable.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer & Auth Sign */}
                        <div className="pt-6 border-t border-black flex justify-between items-end text-[11px]">
                          <div>
                            <p className="font-bold text-neutral-800">{shopDetails.footer}</p>
                            <p className="text-neutral-500 text-[10px] mt-0.5">Powered by Shashi Ranjan</p>
                          </div>
                          <div className="text-center">
                            <div className="h-10 border-b border-black mb-1 w-32"></div>
                            <p className="font-bold">Authorized Signature</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Buttons Below Preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
                  <button
                    onClick={printThermal}
                    disabled={billItems.length === 0}
                    className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-bold py-2.5 px-2 rounded-xl text-xs cursor-pointer shadow flex items-center justify-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print Thermal</span>
                  </button>

                  <button
                    onClick={printA5}
                    disabled={billItems.length === 0}
                    className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-bold py-2.5 px-2 rounded-xl text-xs cursor-pointer shadow flex items-center justify-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print A5</span>
                  </button>

                  <button
                    onClick={saveAndPrintBill}
                    disabled={billItems.length === 0}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold py-2.5 px-2 rounded-xl text-xs cursor-pointer shadow flex items-center justify-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Bill</span>
                  </button>

                  <button
                    onClick={shareWhatsApp}
                    disabled={billItems.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-2 rounded-xl text-xs cursor-pointer shadow flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>

              </div>

            </div>

            {/* Saved Bills Manager Section */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    Sabhi Saved Bills (Search, Edit & Delete)
                  </h3>
                  <p className="text-xs text-neutral-400">Bill number ya grahak naam se khojein</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Bill No. ya Grahak khojein..."
                    value={billSearchQuery}
                    onChange={(e) => setBillSearchQuery(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Bills List Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400">
                      <th className="py-2.5 px-3">Bill #</th>
                      <th className="py-2.5 px-3">Grahak Naam</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Total (₹)</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {savedBills
                      .filter(b => 
                        (b.bill_no?.toString() || '').includes(billSearchQuery) ||
                        (b.customer_name || '').toLowerCase().includes(billSearchQuery.toLowerCase()) ||
                        (b.customer_phone || '').includes(billSearchQuery)
                      )
                      .map((bill) => (
                        <tr key={bill.id} className="hover:bg-neutral-850 transition">
                          <td className="py-3 px-3 font-mono font-bold text-amber-400">#{bill.bill_no || '---'}</td>
                          <td className="py-3 px-3 font-bold text-white">{bill.customer_name}</td>
                          <td className="py-3 px-3 text-neutral-400">{bill.customer_phone || 'N/A'}</td>
                          <td className="py-3 px-3 text-neutral-400">{new Date(bill.created_at).toLocaleDateString('hi-IN')}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-white">₹{bill.total?.toFixed(2)}</td>
                          <td className="py-3 px-3 text-center space-x-2">
                            <button
                              onClick={() => setViewingBill(bill)}
                              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => editBill(bill)}
                              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer border border-amber-500/30"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteBill(bill.id)}
                              className="bg-red-950/80 hover:bg-red-900 text-red-300 px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer border border-red-800"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    {savedBills.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-neutral-500">
                          Koi saved bill nahi hai.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill Details Modal */}
            {viewingBill && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white text-neutral-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl font-mono text-xs relative">
                  <div className="text-center pb-3 border-b border-dashed border-neutral-400 mb-3">
                    <h3 className="font-black text-sm uppercase">{shopDetails.shop_name}</h3>
                    <p className="text-[10px]">{shopDetails.address}</p>
                    <p className="text-[10px]">Bill No: #{viewingBill.bill_no || '---'}</p>
                    <p className="text-[10px] text-neutral-500">{new Date(viewingBill.created_at).toLocaleString('hi-IN')}</p>
                  </div>
                  <div className="mb-3 space-y-0.5">
                    <p><strong>Grahak:</strong> {viewingBill.customer_name}</p>
                    {viewingBill.customer_phone && <p><strong>Phone:</strong> {viewingBill.customer_phone}</p>}
                  </div>
                  <div className="border-t border-b border-dashed border-neutral-400 py-2 mb-3 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>Item</span>
                      <span>Total</span>
                    </div>
                    {viewingBill.items?.map((it: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span>{it.name} x {it.qty}</span>
                        <span>₹{it.total || (it.price * it.qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1 pb-3 border-b border-dashed border-neutral-400 mb-4">
                    <div className="flex justify-between"><span>Subtotal:</span><span>₹{viewingBill.subtotal}</span></div>
                    {viewingBill.discount > 0 && <div className="flex justify-between"><span>Discount:</span><span>-₹{viewingBill.discount}</span></div>}
                    <div className="flex justify-between font-bold text-sm pt-1"><span>Grand Payable:</span><span>₹{viewingBill.total?.toFixed(2)}</span></div>
                  </div>
                  <div className="text-center text-[10px] text-neutral-500 mb-4">
                    {shopDetails.footer} <br/> Powered by Shashi Ranjan
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingBill(null)}
                      className="flex-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 py-2 rounded-xl font-bold cursor-pointer"
                    >
                      Band Karein
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-2 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: HISAB (📊 हिसाब) */}
        {/* ==================================================== */}
        {activeTab === 'hisab' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-3xl shadow-md">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                Dukaan Ka Kul Hisab & Dashboard
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">Apke business ka financial overview aur cash summary</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-3xl shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-xs font-semibold">Cash Counter Total</span>
                  <Wallet className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-black font-mono text-amber-400">
                  ₹{totalCash.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">Galle mein rakhi kul rakam</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-3xl shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-xs font-semibold">Kul Udhar Diya</span>
                  <TrendingUp className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-xl font-black font-mono text-red-400">
                  ₹{totalUdharGiven.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">Jo grahako se lene baki hain</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-3xl shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-xs font-semibold">Kul Advance Jama</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-black font-mono text-emerald-400">
                  ₹{totalAdvanceCollected.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">Jo grahako ka advance jama hai</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-3xl shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-xs font-semibold">Kul Bill Sales</span>
                  <Receipt className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-black font-mono text-amber-400">
                  ₹{totalSalesToday.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">Banaye gaye bills ki kul value</p>
              </div>

            </div>

            {/* Quick Summary Card */}
            <div className="bg-gradient-to-r from-neutral-900 to-neutral-850 border border-neutral-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Business Security & RLS Compliance</h3>
                <p className="text-xs text-neutral-400">
                  Apka sabhi data Supabase Row Level Security (RLS) dwara protected hai. Kewal aap hi apna data dekh aur badal sakte hain.
                </p>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-2.5 rounded-xl text-xs shrink-0 cursor-pointer shadow"
              >
                Supabase Settings Check Karein
              </button>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER: Powered by Shashi Ranjan */}
      <footer className="py-4 text-center text-xs text-neutral-400 border-t border-neutral-900 bg-neutral-950">
        Powered by Shashi Ranjan
      </footer>

      {/* Settings Modal (Global) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              Supabase Connection Settings
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Apna Supabase URL aur Anon Key yahan dalein taaki data cloud par safe rahe aur RLS enable ho sake.
            </p>
            <form onSubmit={saveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Supabase URL</label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xxx.supabase.co"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Supabase Anon Key</label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOi..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Radd Karein
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
