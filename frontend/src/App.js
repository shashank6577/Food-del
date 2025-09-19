import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import CustomerDashboard from "./components/CustomerDashboard";
import DriverDashboard from "./components/DriverDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Truck, Users, ShoppingCart, BarChart3 } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/customer", label: "Customer", icon: ShoppingCart },
    { path: "/driver", label: "Driver", icon: Truck },
    { path: "/admin", label: "Admin", icon: BarChart3 }
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">SmartLogix</h1>
        </div>
        
        <div className="flex space-x-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}>
              <Button
                variant={location.pathname === path ? "secondary" : "ghost"}
                className={`flex items-center space-x-2 ${
                  location.pathname === path 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Welcome to SmartLogix
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Complete Food Delivery & Logistics Management System
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          
          <Link to="/customer">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
              <CardHeader className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-slate-900">Customer Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center">
                  Place orders, track deliveries, and manage your food delivery experience
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/driver">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
              <CardHeader className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-slate-900">Driver Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center">
                  Accept orders, update delivery status, and manage your deliveries
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
              <CardHeader className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-slate-900">Admin Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center">
                  Monitor operations, manage drivers, and oversee the entire system
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">System Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Order Management</h3>
              <ul className="text-slate-600 space-y-1">
                <li>• Real-time order placement and tracking</li>
                <li>• Automated driver assignment</li>
                <li>• Status updates throughout delivery</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Driver Operations</h3>
              <ul className="text-slate-600 space-y-1">
                <li>• Accept and manage deliveries</li>
                <li>• Update order status in real-time</li>
                <li>• Track earnings and performance</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Admin Control</h3>
              <ul className="text-slate-600 space-y-1">
                <li>• Monitor all system operations</li>
                <li>• Manage drivers and restaurants</li>
                <li>• View analytics and reports</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Real-time Updates</h3>
              <ul className="text-slate-600 space-y-1">
                <li>• Live order status tracking</li>
                <li>• Driver availability monitoring</li>
                <li>• System-wide notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/customer" element={
            <>
              <Navigation />
              <CustomerDashboard />
            </>
          } />
          <Route path="/driver" element={
            <>
              <Navigation />
              <DriverDashboard />
            </>
          } />
          <Route path="/admin" element={
            <>
              <Navigation />
              <AdminDashboard />
            </>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;