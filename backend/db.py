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
        cursor = conn.cursor()
        cursor.execute("SET @new_id = UUID()")
        cursor.execute("""
            INSERT INTO olist_products_dataset
              (product_id, product_category_name, product_photos_qty)
            VALUES (@new_id, %s, %s)
        """, (data["name"], int(data["quantity"])))
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
        return jsonify({'message': 'Order inserted successfully'}), 201
    except Error as err:
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

if __name__ == '__main__':
    app.run(debug=True)
