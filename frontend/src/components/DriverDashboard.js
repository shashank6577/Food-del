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
  Truck, 
  Clock, 
  CheckCircle, 
  MapPin, 
  Phone, 
  User,
  DollarSign,
  Package,
  Navigation,
  Timer
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DriverDashboard = () => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('available-orders');
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchAvailableOrders(),
        fetchMyOrders(),
        fetchDrivers()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders?status=pending`);
      setAvailableOrders(response.data);
    } catch (error) {
      console.error('Error fetching available orders:', error);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      const assignedOrders = response.data.filter(order => 
        order.status !== 'pending' && order.status !== 'delivered' && order.driver_name
      );
      setMyOrders(assignedOrders);
    } catch (error) {
      console.error('Error fetching my orders:', error);
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

  const assignOrderToDriver = async (orderId) => {
    if (!selectedDriver) {
      toast.error('Please select a driver first');
      return;
    }

    setLoading(true);
    try {
      await axios.patch(`${API}/orders/${orderId}/assign/${selectedDriver}`);
      toast.success('Order assigned successfully!');
      fetchData();
    } catch (error) {
      toast.error('Error assigning order');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setLoading(true);
    try {
      await axios.patch(`${API}/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
      fetchData();
    } catch (error) {
      toast.error('Error updating order status');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Available', className: 'status-pending' },
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

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      assigned: 'picked_up',
      picked_up: 'in_transit',
      in_transit: 'delivered'
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      assigned: 'Mark as Picked Up',
      picked_up: 'Mark as In Transit',
      in_transit: 'Mark as Delivered'
    };
    return labels[currentStatus];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'assigned': return <User className="h-4 w-4" />;
      case 'picked_up': return <Package className="h-4 w-4" />;
      case 'in_transit': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Driver Dashboard</h1>
          <p className="text-slate-600">Manage deliveries and update order status</p>
        </div>

        {/* Driver Selection */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Label htmlFor="driver-select">Select Driver:</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name} - {driver.vehicle_type} ({driver.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Auto-refresh enabled</span>
                </div>
                <Button onClick={fetchData} variant="outline" size="sm">
                  Refresh Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <Button
            variant={activeTab === 'available-orders' ? 'default' : 'outline'}
            onClick={() => setActiveTab('available-orders')}
            className="flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Available Orders ({availableOrders.length})</span>
          </Button>
          <Button
            variant={activeTab === 'my-orders' ? 'default' : 'outline'}
            onClick={() => setActiveTab('my-orders')}
            className="flex items-center space-x-2"
          >
            <Truck className="h-4 w-4" />
            <span>My Orders ({myOrders.length})</span>
          </Button>
        </div>

        {activeTab === 'available-orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Available Orders</h2>
              <div className="text-sm text-slate-600">
                {availableOrders.length} orders waiting for pickup
              </div>
            </div>

            {availableOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No orders available</h3>
                  <p className="text-slate-600">Check back later for new orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {availableOrders.map((order) => (
                  <Card key={order.id} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center space-x-2">
                            {getStatusIcon(order.status)}
                            <span>Order #{order.id.slice(-8)}</span>
                          </h3>
                          <p className="text-slate-600">{order.restaurant_name}</p>
                          <p className="text-sm text-slate-500 flex items-center space-x-1 mt-1">
                            <Timer className="h-3 w-3" />
                            <span>Placed: {formatTime(order.created_at)}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          <p className="text-lg font-bold text-green-600 mt-1">
                            ${order.total_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Customer Details</span>
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Name:</span> {order.customer_name}</p>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-3 w-3" />
                              <span>{order.customer_phone}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-3 w-3 mt-0.5" />
                              <span>{order.delivery_address}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 flex items-center space-x-2">
                            <Package className="h-4 w-4" />
                            <span>Order Items</span>
                          </h4>
                          <div className="space-y-1 text-sm">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium text-sm">Special Instructions:</span>
                          <p className="text-sm mt-1">{order.notes}</p>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button 
                          onClick={() => assignOrderToDriver(order.id)}
                          disabled={!selectedDriver || loading}
                          className="btn-primary"
                        >
                          {loading ? 'Assigning...' : 'Accept Order'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Active Orders</h2>
              <div className="text-sm text-slate-600">
                {myOrders.length} active deliveries
              </div>
            </div>

            {myOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Truck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No active orders</h3>
                  <p className="text-slate-600">Accept an order to start delivering</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {myOrders.map((order) => (
                  <Card key={order.id} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center space-x-2">
                            {getStatusIcon(order.status)}
                            <span>Order #{order.id.slice(-8)}</span>
                          </h3>
                          <p className="text-slate-600">{order.restaurant_name}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                            <span>Assigned: {formatTime(order.assigned_at)}</span>
                            {order.picked_up_at && (
                              <span>Picked up: {formatTime(order.picked_up_at)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          <p className="text-lg font-bold text-green-600 mt-1">
                            ${order.total_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center space-x-2">
                            <Navigation className="h-4 w-4" />
                            <span>Delivery Details</span>
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Customer:</span> {order.customer_name}</p>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-3 w-3" />
                              <span>{order.customer_phone}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-3 w-3 mt-0.5" />
                              <span>{order.delivery_address}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Order Summary</h4>
                          <div className="space-y-1 text-sm">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="border-t pt-1 font-medium">
                              <div className="flex justify-between">
                                <span>Total:</span>
                                <span>${order.total_amount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                          <span className="font-medium text-sm">Special Instructions:</span>
                          <p className="text-sm mt-1">{order.notes}</p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        {getNextStatus(order.status) && (
                          <Button 
                            onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                            disabled={loading}
                            className="btn-success"
                          >
                            {loading ? 'Updating...' : getNextStatusLabel(order.status)}
                          </Button>
                        )}
                        <Button 
                          variant="outline"
                          onClick={() => window.open(`tel:${order.customer_phone}`)}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call Customer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;