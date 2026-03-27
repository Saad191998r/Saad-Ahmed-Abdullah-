/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { StoreView } from './pages/StoreView';
import { ProductView } from './pages/ProductView';
import { Cart } from './pages/Cart';
import { Profile } from './pages/Profile';
import { SellerDashboard } from './pages/SellerDashboard';
import { Auth } from './pages/Auth';
import { Stores } from './pages/Stores';
import { ChatPage } from './pages/Chat';
import { Notifications } from './pages/Notifications';
import { AdminDashboard } from './pages/AdminDashboard';
import { Settings } from './pages/Settings';
import { Privacy } from './pages/Privacy';
import { Support } from './pages/Support';
import { SplashScreen } from './components/SplashScreen';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "stores", element: <Stores /> },
      { path: "store/:id", element: <StoreView /> },
      { path: "product/:id", element: <ProductView /> },
      { path: "cart", element: <Cart /> },
      { path: "profile", element: <Profile /> },
      { path: "dashboard", element: <SellerDashboard /> },
      { path: "admin", element: <AdminDashboard /> },
      { path: "auth", element: <Auth /> },
      { path: "chat", element: <ChatPage /> },
      { path: "chat/:id", element: <ChatPage /> },
      { path: "notifications", element: <Notifications /> },
      { path: "settings", element: <Settings /> },
      { path: "privacy", element: <Privacy /> },
      { path: "support", element: <Support /> },
    ],
  },
]);

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AppProvider>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      {!showSplash && <RouterProvider router={router} />}
    </AppProvider>
  );
}
