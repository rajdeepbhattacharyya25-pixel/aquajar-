import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Jars from './pages/Jars';
import Scanner from './pages/Scanner';
import Reports from './pages/Reports';
import Transactions from './pages/Transactions';
import Splash from './components/Splash';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetails />} />
          <Route path="jars" element={<Jars />} />
          <Route path="scan" element={<Scanner />} />
          <Route path="reports" element={<Reports />} />
          <Route path="transactions" element={<Transactions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
