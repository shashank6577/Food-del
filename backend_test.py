import requests
import sys
import json
from datetime import datetime

class SmartLogixAPITester:
    def __init__(self, base_url="https://smartlogix-api.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'customers': [],
            'drivers': [],
            'restaurants': [],
            'orders': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and 'id' in response_data:
                        print(f"   Created ID: {response_data['id']}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/",
            200
        )
        return success

    def test_create_driver(self, name, phone, vehicle_type):
        """Test driver creation"""
        success, response = self.run_test(
            "Create Driver",
            "POST",
            "api/drivers",
            200,
            data={
                "name": name,
                "phone": phone,
                "vehicle_type": vehicle_type
            }
        )
        if success and 'id' in response:
            self.created_ids['drivers'].append(response['id'])
            return response['id']
        return None

    def test_get_drivers(self):
        """Test getting all drivers"""
        success, response = self.run_test(
            "Get All Drivers",
            "GET",
            "api/drivers",
            200
        )
        return success, response

    def test_get_available_drivers(self):
        """Test getting available drivers"""
        success, response = self.run_test(
            "Get Available Drivers",
            "GET",
            "api/drivers/available",
            200
        )
        return success, response

    def test_create_restaurant(self, name, address, phone, cuisine_type):
        """Test restaurant creation"""
        success, response = self.run_test(
            "Create Restaurant",
            "POST",
            "api/restaurants",
            200,
            data={
                "name": name,
                "address": address,
                "phone": phone,
                "cuisine_type": cuisine_type
            }
        )
        if success and 'id' in response:
            self.created_ids['restaurants'].append(response['id'])
            return response['id']
        return None

    def test_get_restaurants(self):
        """Test getting all restaurants"""
        success, response = self.run_test(
            "Get All Restaurants",
            "GET",
            "api/restaurants",
            200
        )
        return success, response

    def test_create_customer(self, name, phone, address):
        """Test customer creation"""
        success, response = self.run_test(
            "Create Customer",
            "POST",
            "api/customers",
            200,
            data={
                "name": name,
                "phone": phone,
                "address": address
            }
        )
        if success and 'id' in response:
            self.created_ids['customers'].append(response['id'])
            return response['id']
        return None

    def test_get_customers(self):
        """Test getting all customers"""
        success, response = self.run_test(
            "Get All Customers",
            "GET",
            "api/customers",
            200
        )
        return success, response

    def test_create_order(self, customer_name, customer_phone, delivery_address, restaurant_name, items, notes=None):
        """Test order creation"""
        success, response = self.run_test(
            "Create Order",
            "POST",
            "api/orders",
            200,
            data={
                "customer_name": customer_name,
                "customer_phone": customer_phone,
                "delivery_address": delivery_address,
                "restaurant_name": restaurant_name,
                "items": items,
                "notes": notes
            }
        )
        if success and 'id' in response:
            self.created_ids['orders'].append(response['id'])
            return response['id']
        return None

    def test_get_orders(self, status=None):
        """Test getting orders"""
        params = {"status": status} if status else None
        success, response = self.run_test(
            f"Get Orders{' (status: ' + status + ')' if status else ''}",
            "GET",
            "api/orders",
            200,
            params=params
        )
        return success, response

    def test_get_order_by_id(self, order_id):
        """Test getting specific order"""
        success, response = self.run_test(
            "Get Order by ID",
            "GET",
            f"api/orders/{order_id}",
            200
        )
        return success, response

    def test_assign_order(self, order_id, driver_id):
        """Test assigning order to driver"""
        success, response = self.run_test(
            "Assign Order to Driver",
            "PATCH",
            f"api/orders/{order_id}/assign/{driver_id}",
            200
        )
        return success

    def test_update_order_status(self, order_id, status):
        """Test updating order status"""
        success, response = self.run_test(
            f"Update Order Status to {status}",
            "PATCH",
            f"api/orders/{order_id}/status",
            200,
            data={"status": status}
        )
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Dashboard Statistics",
            "GET",
            "api/dashboard/stats",
            200
        )
        return success, response

    def run_complete_flow_test(self):
        """Test complete order flow"""
        print("\n" + "="*60)
        print("🚀 TESTING COMPLETE ORDER FLOW")
        print("="*60)

        # Step 1: Create driver
        driver_id = self.test_create_driver("John Driver", "+1234567890", "Motorcycle")
        if not driver_id:
            print("❌ Cannot continue flow test - Driver creation failed")
            return False

        # Step 2: Create restaurant
        restaurant_id = self.test_create_restaurant("Pizza Palace", "123 Main St", "+1987654321", "Italian")
        if not restaurant_id:
            print("❌ Cannot continue flow test - Restaurant creation failed")
            return False

        # Step 3: Create customer
        customer_id = self.test_create_customer("Jane Customer", "+1122334455", "456 Oak Ave")
        if not customer_id:
            print("❌ Cannot continue flow test - Customer creation failed")
            return False

        # Step 4: Create order
        order_items = [
            {"name": "Margherita Pizza", "quantity": 1, "price": 15.99},
            {"name": "Garlic Bread", "quantity": 2, "price": 4.50}
        ]
        order_id = self.test_create_order(
            "Jane Customer", "+1122334455", "456 Oak Ave", 
            "Pizza Palace", order_items, "Please ring doorbell"
        )
        if not order_id:
            print("❌ Cannot continue flow test - Order creation failed")
            return False

        # Step 5: Assign order to driver
        if not self.test_assign_order(order_id, driver_id):
            print("❌ Cannot continue flow test - Order assignment failed")
            return False

        # Step 6: Update order status through delivery flow
        statuses = ["picked_up", "in_transit", "delivered"]
        for status in statuses:
            if not self.test_update_order_status(order_id, status):
                print(f"❌ Cannot continue flow test - Status update to {status} failed")
                return False

        # Step 7: Verify final order state
        success, final_order = self.test_get_order_by_id(order_id)
        if success and final_order.get('status') == 'delivered':
            print("✅ Complete order flow test PASSED!")
            return True
        else:
            print("❌ Complete order flow test FAILED - Final verification failed")
            return False

def main():
    print("🧪 SmartLogix API Testing Suite")
    print("="*50)
    
    tester = SmartLogixAPITester()
    
    # Test 1: Health Check
    if not tester.test_health_check():
        print("❌ API is not responding. Stopping tests.")
        return 1

    # Test 2: Basic CRUD operations
    print("\n" + "="*50)
    print("📋 TESTING BASIC CRUD OPERATIONS")
    print("="*50)

    # Driver tests
    driver_id = tester.test_create_driver("Test Driver", "+1234567890", "Car")
    tester.test_get_drivers()
    tester.test_get_available_drivers()

    # Restaurant tests
    restaurant_id = tester.test_create_restaurant("Test Restaurant", "123 Test St", "+1987654321", "Fast Food")
    tester.test_get_restaurants()

    # Customer tests
    customer_id = tester.test_create_customer("Test Customer", "+1122334455", "456 Test Ave")
    tester.test_get_customers()

    # Order tests
    test_items = [{"name": "Test Item", "quantity": 1, "price": 10.00}]
    order_id = tester.test_create_order("Test Customer", "+1122334455", "456 Test Ave", "Test Restaurant", test_items)
    tester.test_get_orders()
    tester.test_get_orders("pending")

    # Dashboard stats
    tester.test_dashboard_stats()

    # Test 3: Complete order flow
    flow_success = tester.run_complete_flow_test()

    # Print final results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if flow_success:
        print("✅ Complete order flow test: PASSED")
    else:
        print("❌ Complete order flow test: FAILED")

    # Summary
    if tester.tests_passed == tester.tests_run and flow_success:
        print("\n🎉 ALL TESTS PASSED! Backend API is fully functional.")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} tests failed. Backend needs attention.")
        return 1

if __name__ == "__main__":
    sys.exit(main())