from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)


DB_CONFIG = {
    'host': '34.172.20.160',
    'user': 'root',
    'password': 'cs411123456',
    'database': 'olist_data',
    'port': 3306
}

def get_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print("Connection error:", e)
        return None

@app.route("/")
def home():
    return "Flask is running and connected to MySQL! 🎉"

@app.route("/api/products", methods=["GET"])
def get_products():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                p.product_id AS id,
                p.product_category_name AS name,
                i.price AS price,
                p.product_photos_qty AS quantity,
                i.seller_id,
                i.order_id
            FROM olist_products_dataset p
            LEFT JOIN olist_order_items_dataset i
              ON p.product_id = i.product_id
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows)
    except Error as e:
        print("Error in get_products:", e)
        return jsonify({"error": "Database error"}), 500

@app.route("/api/products", methods=["POST"])
def add_product():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500
    
    try:
        data = request.get_json()

        # ✅ Validate that required fields exist
        required_fields = ["name", "quantity", "price", "order_id", "seller_id"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        cursor = conn.cursor()
        cursor.execute("SET @new_id = UUID()")
        
        # Insert into olist_products_dataset
        cursor.execute("""
            INSERT INTO olist_products_dataset
              (product_id, product_category_name, product_photos_qty)
            VALUES (@new_id, %s, %s)
        """, (data["name"], int(data["quantity"])))

        # Insert into olist_order_items_dataset
        cursor.execute("""
            INSERT INTO olist_order_items_dataset
              (order_id, order_item_id, product_id, seller_id, price, freight_value)
            VALUES (%s, 1, @new_id, %s, %s, 0.0)
        """, (data["order_id"], data["seller_id"], float(data["price"])))

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Product and order item added successfully"}), 201
    
    except Error as e:
        conn.rollback()
        print("Insert error:", e)
        return jsonify({"error": "Insert failed"}), 500

@app.route('/api/search-orders', methods=['GET'])
def search_orders():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500
    try:
        keyword    = request.args.get('keyword', '')
        page       = int(request.args.get('page', 1))
        page_size  = int(request.args.get('page_size', 10))
        offset     = (page - 1) * page_size
        like       = f"%{keyword}%"
        cursor     = conn.cursor(dictionary=True)

        # total count for pagination
        cursor.execute("""
            SELECT COUNT(*) AS total
              FROM olist_orders_dataset
             WHERE order_id LIKE %s OR customer_id LIKE %s
        """, (like, like))
        total = cursor.fetchone()['total']

        cursor.execute("""
            SELECT order_id, customer_id, order_status, order_purchase_timestamp
              FROM olist_orders_dataset
             WHERE order_id LIKE %s OR customer_id LIKE %s
          ORDER BY order_purchase_timestamp DESC
             LIMIT %s OFFSET %s
        """, (like, like, page_size, offset))
        data = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            "data": data,
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1)//page_size
        })
    except Error as e:
        print("Error in search_orders:", e)
        return jsonify({"error": "Database error"}), 500

@app.route('/api/delete-order/<order_id>', methods=['DELETE'])
def delete_order(order_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500
    cursor = conn.cursor()
    cursor.execute("DELETE FROM olist_orders_dataset WHERE order_id = %s", (order_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Order deleted successfully'})

@app.route('/api/insert-order', methods=['POST'])
def insert_order():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500
    data = request.json
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO olist_orders_dataset (order_id, customer_id, order_status) VALUES (%s, %s, %s)",
            (data['order_id'], data['customer_id'], data['order_status'])
        )
        conn.commit()

        # Auto-Trigger: Call Stored Procedure after insert
        cursor.callproc('update_customer_order_stats', [data['customer_id']])
        conn.commit()

        return jsonify({'message': 'Order inserted and customer summary updated successfully'}), 201
    except Error as err:
        conn.rollback()
        return jsonify({'error': str(err)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/api/update-order/<order_id>', methods=['PUT'])
def update_order(order_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500
    new_status = request.json.get('order_status')
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE olist_orders_dataset SET order_status = %s WHERE order_id = %s",
            (new_status, order_id)
        )
        conn.commit()
        return jsonify({'message': 'Order updated successfully'})
    except Error as err:
        return jsonify({'error': str(err)}), 400
    finally:
        cursor.close()
        conn.close()

# Use to test transaction
@app.route('/api/customer-summary/<customer_id>', methods=['GET'])
def get_customer_summary(customer_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM customer_summary WHERE customer_id = %s", (customer_id,))
        summary = cursor.fetchone()
        if summary:
            return jsonify(summary), 200
        else:
            return jsonify({'error': 'No summary found for this customer'}), 404
    except Exception as e:
        print("Error fetching summary:", e)
        return jsonify({'error': 'Failed to fetch customer summary'}), 500
    finally:
        cursor.close()
        conn.close()



# Store Procedure
@app.route('/api/customer-orders/<customer_id>', methods=['GET'])
def get_customer_orders_advanced(customer_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.callproc('GetCustomerOrders', [customer_id])
        result = {
            "orders": [],
            "average_order_value": None,
            "message": None
        }

        for idx, res in enumerate(cursor.stored_results()):
            if idx == 0:
                # First result set: Order details with total amount
                result["orders"] = res.fetchall()
            elif idx == 1:
                # Second result set: Average order value
                avg_data = res.fetchone()
                result["average_order_value"] = avg_data['avg_order_value'] if avg_data else 0
            elif idx == 2:
                # Third result set: Possible message if no orders
                msg_data = res.fetchone()
                if msg_data:
                    result["message"] = msg_data['message']

        return jsonify(result), 200
    except mysql.connector.Error as err:
        print("Stored procedure error:", err)
        return jsonify({'error': str(err)}), 500
    finally:
        cursor.close()
        conn.close()


# 2nd store procedure 
@app.route('/api/update-customer-summary/<customer_id>', methods=['POST'])
def update_customer_summary(customer_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500

    cursor = conn.cursor()
    try:
        # Call the stored procedure
        cursor.callproc('update_customer_order_stats', [customer_id])
        conn.commit()

        return jsonify({'message': f'Customer summary updated for {customer_id}'}), 200
    except Error as err:
        conn.rollback()
        print("Stored procedure call failed:", err)
        return jsonify({'error': 'Failed to update customer summary'}), 500
    finally:
        cursor.close()
        conn.close()



# Transaction 
@app.route('/api/insert-order-advanced', methods=['POST'])
def insert_order_advanced():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500
    data = request.get_json()

    order_id = data.get('order_id')
    customer_id = data.get('customer_id')
    order_status = data.get('order_status')
    items = data.get('items', [])  # [{product_id, seller_id, price, freight_value}]

    cursor = conn.cursor()
    try:
        conn.start_transaction(isolation_level='READ COMMITTED')

        # Insert Order (basic)
        cursor.execute("""
            INSERT INTO olist_orders_dataset (order_id, customer_id, order_status)
            VALUES (%s, %s, %s)
        """, (order_id, customer_id, order_status))

        # Insert Items (multiple relations join later)
        for item in items:
            cursor.execute("""
            INSERT INTO olist_order_items_dataset (order_id, order_item_id, product_id, seller_id, price, freight_value)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            order_id,
            item['order_item_id'],  # Now included
            item['product_id'],
            item['seller_id'],
            item['price'],
            item['freight_value']
        ))

        # Advanced Query 1: Aggregation by Seller (GROUP BY)
        cursor.execute("""
            SELECT seller_id, AVG(freight_value) AS avg_freight
            FROM olist_order_items_dataset
            WHERE seller_id = %s
            GROUP BY seller_id
        """, (items[0]['seller_id'],))
        avg_freight_result = cursor.fetchone()
        avg_freight = avg_freight_result[1] if avg_freight_result else 0.0

        # Advanced Query 2: Conditional Update Using Subquery + JOIN
        cursor.execute("""
            UPDATE olist_sellers_dataset s
            JOIN (
                SELECT seller_id, AVG(freight_value) AS avg_freight
                FROM olist_order_items_dataset
                WHERE seller_id = %s
                GROUP BY seller_id
            ) avg_data ON s.seller_id = avg_data.seller_id
            SET s.seller_city = IF(avg_data.avg_freight > 50, 'High Freight City', s.seller_city)
        """, (items[0]['seller_id'],))
        cursor.callproc('update_customer_order_stats', [customer_id])

        conn.commit()
        return jsonify({'message': 'Order, items, and seller updated in transaction'}), 201

    except Error as err:
        conn.rollback()
        print("Transaction failed:", err)
        return jsonify({'error': 'Transaction failed'}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run(debug=True)