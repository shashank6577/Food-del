import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { 
  BarChart3,
  Users,
  Truck,
  ShoppingCart,
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  Phone,
  MapPin,
  Plus,
  Edit,
  Settings
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    orders: { total: 0, pending: 0, active: 0, completed: 0 },
    drivers: { total: 0, available: 0, busy: 0 }
  });
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  // Form states
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    vehicle_type: ''
  });
  
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    address: '',
    phone: '',
    cuisine_type: ''
  });

  useEffect(() => {
    fetchAllData();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchAllData, 15000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchStats(),
        fetchOrders(),
        fetchDrivers(),
        fetchRestaurants()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(`${API}/drivers`);
      setDrivers(response.data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get(`${API}/restaurants`);
      setRestaurants(response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const addDriver = async (e) => {
    e.preventDefault();
    if (!newDriver.name || !newDriver.phone || !newDriver.vehicle_type) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/drivers`, newDriver);
      toast.success('Driver added successfully!');
      setNewDriver({ name: '', phone: '', vehicle_type: '' });
      fetchDrivers();
    } catch (error) {
      toast.error('Error adding driver');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRestaurant = async (e) => {
    e.preventDefault();
    if (!newRestaurant.name || !newRestaurant.address || !newRestaurant.phone || !newRestaurant.cuisine_type) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/restaurants`, newRestaurant);
      toast.success('Restaurant added successfully!');
      setNewRestaurant({ name: '', address: '', phone: '', cuisine_type: '' });
      fetchRestaurants();
    } catch (error) {
      toast.error('Error adding restaurant');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDriverStatus = async (driverId, newStatus) => {
    try {
      await axios.patch(`${API}/drivers/${driverId}/status`, null, {
        params: { status: newStatus }
      });
      toast.success('Driver status updated');
      fetchDrivers();
      fetchStats();
    } catch (error) {
      toast.error('Error updating driver status');
      console.error('Error:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'status-pending' },
      assigned: { label: 'Assigned', className: 'status-assigned' },
      picked_up: { label: 'Picked Up', className: 'status-picked_up' },
      in_transit: { label: 'In Transit', className: 'status-in_transit' },
      delivered: { label: 'Delivered', className: 'status-delivered' },
      cancelled: { label: 'Cancelled', className: 'status-cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.className} border px-2 py-1 text-xs font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const getDriverStatusBadge = (status) => {
    const statusConfig = {
      available: { label: 'Available', className: 'driver-available' },
      busy: { label: 'Busy', className: 'driver-busy' },
      offline: { label: 'Offline', className: 'driver-offline' }
    };
    
    const config = statusConfig[status] || statusConfig.offline;
    return (
      <Badge className={`${config.className} border px-2 py-1 text-xs font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const StatCard = ({ title, value, icon: Icon, subtitle, trend }) => (
    <Card className="stat-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
            {subtitle && <p className="text-sm text-white/70 mt-1">{subtitle}</p>}
          </div>
          <Icon className="h-8 w-8 text-white/80" />
        </div>
        {trend && (
          <div className="flex items-center mt-4 text-white/80">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="text-sm">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
            <p className="text-slate-600">Monitor and manage the entire system</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-slate-600">
              <Activity className="h-4 w-4 text-green-500" />
              <span>Live updates</span>
            </div>
            <Button onClick={fetchAllData} variant="outline">
              Refresh All
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overview')}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'outline'}
            onClick={() => setActiveTab('orders')}
            className="flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Orders ({orders.length})</span>
          </Button>
          <Button
            variant={activeTab === 'drivers' ? 'default' : 'outline'}
            onClick={() => setActiveTab('drivers')}
            className="flex items-center space-x-2"
          >
            <Truck className="h-4 w-4" />
            <span>Drivers ({drivers.length})</span>
          </Button>
          <Button
            variant={activeTab === 'restaurants' ? 'default' : 'outline'}
            onClick={() => setActiveTab('restaurants')}
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Restaurants ({restaurants.length})</span>
          </Button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <StatCard
                title="Total Orders"
                value={stats.orders.total}
                icon={ShoppingCart}
                subtitle="All time"
              />
              <StatCard
                title="Pending Orders"
                value={stats.orders.pending}
                icon={Clock}
                subtitle="Awaiting assignment"
              />
              <StatCard
                title="Active Deliveries"
                value={stats.orders.active}
                icon={Truck}
                subtitle="In progress"
              />
              <StatCard
                title="Available Drivers"
                value={stats.drivers.available}
                icon={Users}
                subtitle={`${stats.drivers.busy} busy`}
              />
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Recent Orders</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">#{order.id.slice(-8)}</p>
                        <p className="text-sm text-slate-600">{order.customer_name} • {order.restaurant_name}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(order.status)}
                        <p className="text-sm font-medium mt-1">${order.total_amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Driver Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {drivers.slice(0, 5).map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-slate-600">{driver.vehicle_type}</p>
                      </div>
                      <div className="text-right">
                        {getDriverStatusBadge(driver.status)}
                        {driver.current_order_id && (
                          <p className="text-xs text-slate-500 mt-1">On delivery</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">All Orders</h2>
              <div className="text-sm text-slate-600">
                Total: {orders.length} orders
              </div>
            </div>

            <div className="grid gap-4">
              {orders.map((order) => (
                <Card key={order.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Order #{order.id.slice(-8)}</h3>
                        <p className="text-slate-600">{order.restaurant_name}</p>
                        <p className="text-sm text-slate-500">
                          Placed: {formatTime(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(order.status)}
                        <p className="text-lg font-bold text-green-600 mt-1">
                          ${order.total_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium mb-1">Customer</h4>
                        <p className="text-sm">{order.customer_name}</p>
                        <div className="flex items-center space-x-1 text-sm text-slate-600">
                          <Phone className="h-3 w-3" />
                          <span>{order.customer_phone}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Delivery Address</h4>
                        <div className="flex items-start space-x-1 text-sm text-slate-600">
                          <MapPin className="h-3 w-3 mt-0.5" />
                          <span>{order.delivery_address}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Driver</h4>
                        {order.driver_name ? (
                          <p className="text-sm">{order.driver_name}</p>
                        ) : (
                          <p className="text-sm text-orange-600">Not assigned</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Items:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <span className="font-medium text-sm">Notes:</span> {order.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="space-y-6">
            {/* Add New Driver */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add New Driver</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addDriver} className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="driver_name">Name</Label>
                    <Input
                      id="driver_name"
                      value={newDriver.name}
                      onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
                      placeholder="Driver name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver_phone">Phone</Label>
                    <Input
                      id="driver_phone"
                      value={newDriver.phone}
                      onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                      placeholder="Phone number"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle_type">Vehicle Type</Label>
                    <Select value={newDriver.vehicle_type} onValueChange={(value) => setNewDriver({...newDriver, vehicle_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motorcycle">Motorcycle</SelectItem>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="bicycle">Bicycle</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? 'Adding...' : 'Add Driver'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Drivers List */}
            <div className="grid gap-4">
              {drivers.map((driver) => (
                <Card key={driver.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{driver.name}</h3>
                        <p className="text-slate-600">{driver.vehicle_type}</p>
                        <div className="flex items-center space-x-1 text-sm text-slate-600 mt-1">
                          <Phone className="h-3 w-3" />
                          <span>{driver.phone}</span>
                        </div>
                        {driver.current_order_id && (
                          <p className="text-sm text-blue-600 mt-1">
                            Currently delivering order #{driver.current_order_id.slice(-8)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {getDriverStatusBadge(driver.status)}
                        <div className="mt-2 space-x-2">
                          <Select 
                            value={driver.status} 
                            onValueChange={(value) => updateDriverStatus(driver.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="busy">Busy</SelectItem>
                              <SelectItem value="offline">Offline</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'restaurants' && (
          <div className="space-y-6">
            {/* Add New Restaurant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add New Restaurant</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addRestaurant} className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="restaurant_name">Restaurant Name</Label>
                    <Input
                      id="restaurant_name"
                      value={newRestaurant.name}
                      onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                      placeholder="Restaurant name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="restaurant_phone">Phone</Label>
                    <Input
                      id="restaurant_phone"
                      value={newRestaurant.phone}
                      onChange={(e) => setNewRestaurant({...newRestaurant, phone: e.target.value})}
                      placeholder="Phone number"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="restaurant_address">Address</Label>
                    <Input
                      id="restaurant_address"
                      value={newRestaurant.address}
                      onChange={(e) => setNewRestaurant({...newRestaurant, address: e.target.value})}
                      placeholder="Restaurant address"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cuisine_type">Cuisine Type</Label>
                    <Select value={newRestaurant.cuisine_type} onValueChange={(value) => setNewRestaurant({...newRestaurant, cuisine_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cuisine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Italian">Italian</SelectItem>
                        <SelectItem value="Chinese">Chinese</SelectItem>
                        <SelectItem value="Indian">Indian</SelectItem>
                        <SelectItem value="Mexican">Mexican</SelectItem>
                        <SelectItem value="American">American</SelectItem>
                        <SelectItem value="Thai">Thai</SelectItem>
                        <SelectItem value="Japanese">Japanese</SelectItem>
                        <SelectItem value="Fast Food">Fast Food</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? 'Adding...' : 'Add Restaurant'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Restaurants List */}
            <div className="grid md:grid-cols-2 gap-4">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="card-hover">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                    <p className="text-slate-600 mb-2">{restaurant.cuisine_type}</p>
                    <div className="space-y-1 text-sm text-slate-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{restaurant.address}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{restaurant.phone}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;