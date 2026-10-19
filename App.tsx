/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Customer, Language, LineItem, Product, StoreProfile, Transaction, UserSession } from './types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_TRANSACTIONS,
  MICROFINANCE_OFFERS,
  STORE_PROFILE,
} from './data/initialData';
import { AuthView } from './components/AuthView';
import { TopNav } from './components/TopNav';
import { DashboardView } from './components/DashboardView';
import { AIMunshiView } from './components/AIMunshiView';
import { UdhaarKhataView } from './components/UdhaarKhataView';
import { InventoryView } from './components/InventoryView';
import { FinancingView } from './components/FinancingView';
import { PosReceiptModal } from './components/PosReceiptModal';

export default function App() {
  const [language, setLanguage] = useState<Language>('ur');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Authentication State with Remember Me persistence
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const savedUser = localStorage.getItem('finsaathi_user_session');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.rememberMe) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Session parse error', e);
    }
    return null;
  });

  // Dynamic store profile based on logged-in user or default
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    if (currentUser) {
      return {
        ...STORE_PROFILE,
        storeName: currentUser.storeName || STORE_PROFILE.storeName,
        storeNameUrdu: currentUser.storeNameUrdu || STORE_PROFILE.storeNameUrdu,
        ownerName: currentUser.name || STORE_PROFILE.ownerName,
        ownerNameUrdu: currentUser.nameUrdu || STORE_PROFILE.ownerNameUrdu,
        phone: currentUser.phone || STORE_PROFILE.phone,
        city: currentUser.city || STORE_PROFILE.city,
      };
    }
    return STORE_PROFILE;
  });

  // Products state with localStorage persistence
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('finsaathi_products');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Customers state with localStorage persistence
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('finsaathi_customers');
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  // Transactions state with localStorage persistence
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('finsaathi_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // Modal states
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [activeReceiptTransaction, setActiveReceiptTransaction] = useState<Transaction | null>(null);

  // Sync products, customers, transactions
  useEffect(() => {
    try {
      localStorage.setItem('finsaathi_products', JSON.stringify(products));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('finsaathi_customers', JSON.stringify(customers));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem('finsaathi_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [transactions]);

  // Handle Login Success
  const handleLoginSuccess = (session: UserSession) => {
    setCurrentUser(session);
    setStoreProfile({
      ...STORE_PROFILE,
      storeName: session.storeName || STORE_PROFILE.storeName,
      storeNameUrdu: session.storeNameUrdu || STORE_PROFILE.storeNameUrdu,
      ownerName: session.name || STORE_PROFILE.ownerName,
      ownerNameUrdu: session.nameUrdu || STORE_PROFILE.ownerNameUrdu,
      phone: session.phone || STORE_PROFILE.phone,
      city: session.city || STORE_PROFILE.city,
    });

    if (session.rememberMe) {
      localStorage.setItem('finsaathi_user_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('finsaathi_user_session');
    }
    setActiveTab('dashboard');
  };

  // Handle Sign Out
  const handleSignOut = () => {
    localStorage.removeItem('finsaathi_user_session');
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Handlers for transactions and inventory
  const handleAddTransaction = (newTx: Omit<Transaction, 'id' | 'receiptNumber'>) => {
    const receiptNum = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
    const tx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
      receiptNumber: receiptNum,
    };

    setTransactions((prev) => [tx, ...prev]);

    // If it's udhaar sale, increment customer balance
    if (tx.type === 'sale_udhaar' && tx.partyName) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (
            c.name.toLowerCase().includes(tx.partyName!.toLowerCase()) ||
            tx.partyName!.toLowerCase().includes(c.name.toLowerCase())
          ) {
            return {
              ...c,
              balanceOwed: c.balanceOwed + tx.totalAmount,
            };
          }
          return c;
        })
      );
    }
  };

  const handleUpdateInventoryAfterSale = (items: LineItem[]) => {
    setProducts((prev) =>
      prev.map((prod) => {
        const sold = items.find(
          (it) => it.name.toLowerCase().includes(prod.name.toLowerCase()) || prod.name.toLowerCase().includes(it.name.toLowerCase())
        );
        if (sold) {
          return {
            ...prod,
            currentStock: Math.max(0, prod.currentStock - sold.quantity),
          };
        }
        return prod;
      })
    );
  };

  const handleRecordRecovery = (customerId: string, amount: number, notes: string) => {
    const targetCust = customers.find((c) => c.id === customerId);
    if (!targetCust) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toISOString().split('T')[0];

    // Decrement customer balance
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              balanceOwed: Math.max(0, c.balanceOwed - amount),
              lastPaymentDate: dateStr,
            }
          : c
      )
    );

    // Record recovery in ledger
    handleAddTransaction({
      date: dateStr,
      time: timeStr,
      type: 'udhaar_recovery',
      partyName: targetCust.name,
      partyPhone: targetCust.phone,
      items: [],
      totalAmount: amount,
      paymentMethod: 'cash',
      notes: notes || `Recovery against ${targetCust.name} khata`,
    });
  };

  const handleAddNewCustomer = (customerData: Omit<Customer, 'id'>) => {
    const newCust: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
    };
    setCustomers((prev) => [...prev, newCust]);
  };

  const handleAddNewProduct = (productData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [...prev, newProd]);
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, currentStock: newStock } : p))
    );
  };

  const handleOpenPOSModal = () => {
    setActiveReceiptTransaction(null);
    setIsPosOpen(true);
  };

  const handleSelectReceipt = (tx: Transaction) => {
    setActiveReceiptTransaction(tx);
    setIsPosOpen(true);
  };

  const isUrdu = language === 'ur';

  // If user is not logged in, render professional Auth View
  if (!currentUser) {
    return (
      <AuthView
        onLoginSuccess={handleLoginSuccess}
        language={language}
        setLanguage={setLanguage}
      />
    );
  }

  // Once authenticated, render full application
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* 3-Zone Clean Top Navigation with User Profile and Sign Out */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        onOpenPOS={handleOpenPOSModal}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Content Viewport Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            customers={customers}
            products={products}
            storeProfile={storeProfile}
            language={language}
            onNavigate={setActiveTab}
            onOpenPOS={handleOpenPOSModal}
            onSelectReceipt={handleSelectReceipt}
          />
        )}

        {activeTab === 'ai-munshi' && (
          <AIMunshiView
            customers={customers}
            products={products}
            language={language}
            onAddTransaction={handleAddTransaction}
            onUpdateInventoryAfterSale={handleUpdateInventoryAfterSale}
          />
        )}

        {activeTab === 'khata' && (
          <UdhaarKhataView
            customers={customers}
            storeProfile={storeProfile}
            language={language}
            onRecordRecovery={handleRecordRecovery}
            onAddNewCustomer={handleAddNewCustomer}
            transactions={transactions}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            storeProfile={storeProfile}
            language={language}
            onUpdateStock={handleUpdateStock}
            onAddNewProduct={handleAddNewProduct}
          />
        )}

        {activeTab === 'financing' && (
          <FinancingView
            transactions={transactions}
            customers={customers}
            products={products}
            storeProfile={storeProfile}
            offers={MICROFINANCE_OFFERS}
            language={language}
          />
        )}
      </main>

      {/* Quick POS / Thermal Receipt Modal */}
      <PosReceiptModal
        isOpen={isPosOpen}
        onClose={() => {
          setIsPosOpen(false);
          setActiveReceiptTransaction(null);
        }}
        products={products}
        customers={customers}
        storeProfile={storeProfile}
        language={language}
        onCompleteSale={(tx) => {
          handleAddTransaction(tx);
          handleUpdateInventoryAfterSale(tx.items);
        }}
        initialTransaction={activeReceiptTransaction}
      />

      {/* Quiet Clean Footer */}
      <footer className="border-t border-slate-200 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-800">
              {isUrdu ? storeProfile.storeNameUrdu : storeProfile.storeName}
            </span>{' '}
            · {storeProfile.address}, {storeProfile.city}
          </div>
          <div className="flex items-center gap-4">
            <span>FinSaathi AI © 2026</span>
            <span aria-hidden="true">·</span>
            <span>{isUrdu ? 'کریانہ کھاتہ اور مائیکروفنانس نظام' : 'Kiryana Bookkeeping & SME Credit System'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
