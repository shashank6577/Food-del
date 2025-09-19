from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Enums for Order Status
class OrderStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class DriverStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"


# Data Models
class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    address: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Driver(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    vehicle_type: str
    status: DriverStatus = DriverStatus.AVAILABLE
    current_order_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Restaurant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    phone: str
    cuisine_type: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderItem(BaseModel):
    name: str
    quantity: int
    price: float
    notes: Optional[str] = None


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    customer_phone: str
    delivery_address: str
    restaurant_id: str
    restaurant_name: str
    items: List[OrderItem]
    total_amount: float
    status: OrderStatus = OrderStatus.PENDING
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    assigned_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None


# Create Models
class CustomerCreate(BaseModel):
    name: str
    phone: str
    address: str


class DriverCreate(BaseModel):
    name: str
    phone: str 
    vehicle_type: str


class RestaurantCreate(BaseModel):
    name: str
    address: str
    phone: str
    cuisine_type: str


class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    delivery_address: str
    restaurant_name: str
    items: List[OrderItem]
    notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


# Utility function for MongoDB serialization
def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, list):
                data[key] = [prepare_for_mongo(item) if isinstance(item, dict) else item for item in value]
    return data


def parse_from_mongo(item):
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str) and 'T' in value and key.endswith(('_at', 'created_at')):
                try:
                    item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    pass
            elif isinstance(value, list):
                item[key] = [parse_from_mongo(i) if isinstance(i, dict) else i for i in value]
    return item


# Customer Routes
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer: CustomerCreate):
    customer_obj = Customer(**customer.dict())
    customer_dict = prepare_for_mongo(customer_obj.dict())
    await db.customers.insert_one(customer_dict)
    return customer_obj


@api_router.get("/customers", response_model=List[Customer])
async def get_customers():
    customers = await db.customers.find().to_list(1000)
    return [Customer(**parse_from_mongo(customer)) for customer in customers]


# Driver Routes
@api_router.post("/drivers", response_model=Driver)
async def create_driver(driver: DriverCreate):
    driver_obj = Driver(**driver.dict())
    driver_dict = prepare_for_mongo(driver_obj.dict())
    await db.drivers.insert_one(driver_dict)
    return driver_obj


@api_router.get("/drivers", response_model=List[Driver])
async def get_drivers():
    drivers = await db.drivers.find().to_list(1000)
    return [Driver(**parse_from_mongo(driver)) for driver in drivers]


@api_router.get("/drivers/available", response_model=List[Driver])
async def get_available_drivers():
    drivers = await db.drivers.find({"status": DriverStatus.AVAILABLE}).to_list(1000)
    return [Driver(**parse_from_mongo(driver)) for driver in drivers]


@api_router.patch("/drivers/{driver_id}/status")
async def update_driver_status(driver_id: str, status: DriverStatus):
    result = await db.drivers.update_one(
        {"id": driver_id},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    return {"message": "Driver status updated"}


# Restaurant Routes
@api_router.post("/restaurants", response_model=Restaurant)
async def create_restaurant(restaurant: RestaurantCreate):
    restaurant_obj = Restaurant(**restaurant.dict())
    restaurant_dict = prepare_for_mongo(restaurant_obj.dict())
    await db.restaurants.insert_one(restaurant_dict)
    return restaurant_obj


@api_router.get("/restaurants", response_model=List[Restaurant])
async def get_restaurants():
    restaurants = await db.restaurants.find().to_list(1000)
    return [Restaurant(**parse_from_mongo(restaurant)) for restaurant in restaurants]


# Order Routes
@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    # Find or create customer
    existing_customer = await db.customers.find_one({"phone": order.customer_phone})
    if not existing_customer:
        customer_obj = Customer(
            name=order.customer_name,
            phone=order.customer_phone,
            address=order.delivery_address
        )
        customer_dict = prepare_for_mongo(customer_obj.dict())
        await db.customers.insert_one(customer_dict)
        customer_id = customer_obj.id
    else:
        customer_id = existing_customer["id"]

    # Find or create restaurant
    existing_restaurant = await db.restaurants.find_one({"name": order.restaurant_name})
    if not existing_restaurant:
        restaurant_obj = Restaurant(
            name=order.restaurant_name,
            address="Address not provided",
            phone="Phone not provided",
            cuisine_type="General"
        )
        restaurant_dict = prepare_for_mongo(restaurant_obj.dict())
        await db.restaurants.insert_one(restaurant_dict)
        restaurant_id = restaurant_obj.id
    else:
        restaurant_id = existing_restaurant["id"]

    # Calculate total amount
    total_amount = sum(item.price * item.quantity for item in order.items)

    # Create order
    order_obj = Order(
        customer_id=customer_id,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        delivery_address=order.delivery_address,
        restaurant_id=restaurant_id,
        restaurant_name=order.restaurant_name,
        items=order.items,
        total_amount=total_amount,
        notes=order.notes
    )
    
    order_dict = prepare_for_mongo(order_obj.dict())
    await db.orders.insert_one(order_dict)
    return order_obj


@api_router.get("/orders", response_model=List[Order])
async def get_orders(status: Optional[OrderStatus] = Query(None)):
    filter_dict = {}
    if status:
        filter_dict["status"] = status
        
    orders = await db.orders.find(filter_dict).to_list(1000)
    return [Order(**parse_from_mongo(order)) for order in orders]


@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**parse_from_mongo(order))


@api_router.patch("/orders/{order_id}/assign/{driver_id}")
async def assign_order_to_driver(order_id: str, driver_id: str):
    # Get driver info
    driver = await db.drivers.find_one({"id": driver_id})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Update order
    order_result = await db.orders.update_one(
        {"id": order_id, "status": OrderStatus.PENDING},
        {
            "$set": {
                "status": OrderStatus.ASSIGNED,
                "driver_id": driver_id,
                "driver_name": driver["name"],
                "assigned_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if order_result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found or already assigned")
    
    # Update driver status
    await db.drivers.update_one(
        {"id": driver_id},
        {"$set": {"status": DriverStatus.BUSY, "current_order_id": order_id}}
    )
    
    return {"message": "Order assigned successfully"}


@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: OrderStatusUpdate):
    update_data = {"status": status_update.status}
    
    # Add timestamp based on status
    current_time = datetime.now(timezone.utc).isoformat()
    if status_update.status == OrderStatus.PICKED_UP:
        update_data["picked_up_at"] = current_time
    elif status_update.status == OrderStatus.DELIVERED:
        update_data["delivered_at"] = current_time
        
        # Free up the driver when order is delivered
        order = await db.orders.find_one({"id": order_id})
        if order and order.get("driver_id"):
            await db.drivers.update_one(
                {"id": order["driver_id"]},
                {"$set": {"status": DriverStatus.AVAILABLE, "current_order_id": None}}
            )
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}


# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": OrderStatus.PENDING})
    active_orders = await db.orders.count_documents({
        "status": {"$in": [OrderStatus.ASSIGNED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT]}
    })
    completed_orders = await db.orders.count_documents({"status": OrderStatus.DELIVERED})
    
    total_drivers = await db.drivers.count_documents({})
    available_drivers = await db.drivers.count_documents({"status": DriverStatus.AVAILABLE})
    busy_drivers = await db.drivers.count_documents({"status": DriverStatus.BUSY})
    
    return {
        "orders": {
            "total": total_orders,
            "pending": pending_orders,
            "active": active_orders,
            "completed": completed_orders
        },
        "drivers": {
            "total": total_drivers,
            "available": available_drivers,
            "busy": busy_drivers
        }
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()