import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Clock, 
  CheckCircle, 
  Truck, 
  MapPin,
  Phone,
  DollarSign
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('place-order');
  
  // Order form state
  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    restaurant_name: '',
    notes: ''
  });
  
  const [orderItems, setOrderItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, price: 0 });

  useEffect(() => {
    fetchOrders();
    fetchRestaurants();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
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

  const addItemToOrder = () => {
    if (!newItem.name || newItem.price <= 0) {
      toast.error('Please fill in all item details');
      return;
    }
    
    setOrderItems([...orderItems, { ...newItem, id: Date.now() }]);
    setNewItem({ name: '', quantity: 1, price: 0 });
    toast.success('Item added to order');
  };

  const removeItemFromOrder = (itemId) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
    toast.success('Item removed from order');
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setOrderItems(orderItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (!orderForm.customer_name || !orderForm.customer_phone || !orderForm.delivery_address || !orderForm.restaurant_name) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (orderItems.length === 0) {
      toast.error('Please add at least one item to your order');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        ...orderForm,
        items: orderItems.map(({ id, ...item }) => item)
      };
      
      await axios.post(`${API}/orders`, orderData);
      toast.success('Order placed successfully!');
      
      // Reset form
      setOrderForm({
        customer_name: '',
        customer_phone: '',
        delivery_address: '',
        restaurant_name: '',
        notes: ''
      });
      setOrderItems([]);
      setActiveTab('track-orders');
      fetchOrders();
    } catch (error) {
      toast.error('Error placing order');
      console.error('Error:', error);
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'assigned': return <Truck className="h-4 w-4" />;
      case 'picked_up': return <CheckCircle className="h-4 w-4" />;
      case 'in_transit': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Customer Dashboard</h1>
          <p className="text-slate-600">Place orders and track your deliveries</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <Button
            variant={activeTab === 'place-order' ? 'default' : 'outline'}
            onClick={() => setActiveTab('place-order')}
            className="flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Place Order</span>
          </Button>
          <Button
            variant={activeTab === 'track-orders' ? 'default' : 'outline'}
            onClick={() => setActiveTab('track-orders')}
            className="flex items-center space-x-2"
          >
            <Truck className="h-4 w-4" />
            <span>Track Orders</span>
          </Button>
        </div>

        {activeTab === 'place-order' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Order Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Place New Order</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitOrder} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer_name">Your Name *</Label>
                        <Input
                          id="customer_name"
                          value={orderForm.customer_name}
                          onChange={(e) => setOrderForm({...orderForm, customer_name: e.target.value})}
                          placeholder="Enter your name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer_phone">Phone Number *</Label>
                        <Input
                          id="customer_phone"
                          value={orderForm.customer_phone}
                          onChange={(e) => setOrderForm({...orderForm, customer_phone: e.target.value})}
                          placeholder="Enter phone number"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="delivery_address">Delivery Address *</Label>
                      <Textarea
                        id="delivery_address"
                        value={orderForm.delivery_address}
                        onChange={(e) => setOrderForm({...orderForm, delivery_address: e.target.value})}
                        placeholder="Enter complete delivery address"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="restaurant_name">Restaurant *</Label>
                      {restaurants.length > 0 ? (
                        <Select value={orderForm.restaurant_name} onValueChange={(value) => setOrderForm({...orderForm, restaurant_name: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a restaurant" />
                          </SelectTrigger>
                          <SelectContent>
                            {restaurants.map((restaurant) => (
                              <SelectItem key={restaurant.id} value={restaurant.name}>
                                {restaurant.name} - {restaurant.cuisine_type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="restaurant_name"
                          value={orderForm.restaurant_name}
                          onChange={(e) => setOrderForm({...orderForm, restaurant_name: e.target.value})}
                          placeholder="Enter restaurant name"
                          required
                        />
                      )}
                    </div>

                    {/* Add Items Section */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Add Items</h3>
                      <div className="grid md:grid-cols-4 gap-3 mb-4">
                        <div>
                          <Label htmlFor="item_name">Item Name</Label>
                          <Input
                            id="item_name"
                            value={newItem.name}
                            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                            placeholder="Item name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="item_quantity">Quantity</Label>
                          <Input
                            id="item_quantity"
                            type="number"
                            min="1"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="item_price">Price ($)</Label>
                          <Input
                            id="item_price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={newItem.price}
                            onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button type="button" onClick={addItemToOrder} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Special Instructions</Label>
                      <Textarea
                        id="notes"
                        value={orderForm.notes}
                        onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                        placeholder="Any special instructions for your order"
                      />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full btn-primary">
                      {loading ? 'Placing Order...' : 'Place Order'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {orderItems.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No items added yet</p>
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-slate-600">${item.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeItemFromOrder(item.id)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total:</span>
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4" />
                            {calculateTotal()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'track-orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Orders</h2>
              <Button onClick={fetchOrders} variant="outline">
                Refresh
              </Button>
            </div>

            {orders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No orders yet</h3>
                  <p className="text-slate-600 mb-4">Place your first order to get started</p>
                  <Button onClick={() => setActiveTab('place-order')}>
                    Place Order
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => (
                  <Card key={order.id} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center space-x-2">
                            {getStatusIcon(order.status)}
                            <span>Order #{order.id.slice(-8)}</span>
                          </h3>
                          <p className="text-slate-600">{order.restaurant_name}</p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          <p className="text-lg font-bold mt-1">${order.total_amount.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="flex items-center space-x-2 text-sm text-slate-600 mb-1">
                            <Phone className="h-4 w-4" />
                            <span>{order.customer_phone}</span>
                          </div>
                          <div className="flex items-start space-x-2 text-sm text-slate-600">
                            <MapPin className="h-4 w-4 mt-0.5" />
                            <span>{order.delivery_address}</span>
                          </div>
                        </div>
                        <div>
                          {order.driver_name && (
                            <div className="text-sm">
                              <span className="font-medium">Driver:</span> {order.driver_name}
                            </div>
                          )}
                          <div className="text-sm text-slate-600">
                            <span className="font-medium">Ordered:</span> {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Items:</h4>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;