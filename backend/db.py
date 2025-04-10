from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    'host': '34.172.20.160',
    'user': 'root',
    'password': 'cs411123456',
    'database': 'olist_data',
    'port': 3306
}

db = mysql.connector.connect(**DB_CONFIG)

@app.route("/")
def home():
    return "Flask is running and connected to MySQL! 🎉"

@app.route("/api/products", methods=["GET"])
def get_products():
    try:
        cursor = db.cursor(dictionary=True)
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
        result = cursor.fetchall()
        cursor.close()
        return jsonify(result)
    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Database error"}), 500

@app.route("/api/products", methods=["POST"])
def add_product():
    try:
        data = request.get_json()
        name = data.get("name")
        quantity = int(data.get("quantity"))
        price = float(data.get("price"))
        order_id = data.get("order_id")
        seller_id = data.get("seller_id")

        cursor = db.cursor()
        cursor.execute("SET @new_id = UUID()")

        cursor.execute("""
            INSERT INTO olist_products_dataset (
                product_id,
                product_category_name,
                product_photos_qty
            )
            VALUES (
                @new_id, %s, %s
            )
        """, (name, quantity))

        cursor.execute("""
            INSERT INTO olist_order_items_dataset (
                order_id, order_item_id, product_id, seller_id, price, freight_value
            )
            VALUES (
                %s, 1, @new_id, %s, %s, %s
            )
        """, (order_id, seller_id, price, 0.0))

        db.commit()
        cursor.close()
        return jsonify({"message": "Product and order item added successfully"}), 201
    except Exception as e:
        db.rollback()
        print(name)
        print("Insert error:", e)
        return jsonify({"error": "Insert failed"}), 500

@app.route('/api/search-orders', methods=['GET'])
def search_orders():
    keyword = request.args.get('keyword', '')
    cursor = db.cursor(dictionary=True)
    query = """
        SELECT order_id, customer_id, order_status, order_purchase_timestamp
        FROM olist_orders_dataset
        WHERE order_id LIKE %s OR customer_id LIKE %s
        LIMIT 25;
    """
    like_pattern = f"%{keyword}%"
    cursor.execute(query, (like_pattern, like_pattern))
    results = cursor.fetchall()
    return jsonify(results)

@app.route('/api/delete-order/<order_id>', methods=['DELETE'])
def delete_order(order_id):
    cursor = db.cursor()
    cursor.execute("DELETE FROM olist_orders_dataset WHERE order_id = %s", (order_id,))
    db.commit()
    return jsonify({'message': 'Order deleted successfully'})

@app.route('/api/insert-order', methods=['POST'])
def insert_order():
    data = request.json
    order_id = data.get('order_id')
    customer_id = data.get('customer_id')
    order_status = data.get('order_status')

    cursor = db.cursor()
    try:
        cursor.execute(
            "INSERT INTO olist_orders_dataset (order_id, customer_id, order_status) VALUES (%s, %s, %s)",
            (order_id, customer_id, order_status)
        )
        db.commit()
        return jsonify({'message': 'Order inserted successfully'}), 201
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 400

@app.route('/api/update-order-status', methods=['PUT'])
def update_order_status():
    data = request.get_json()
    order_id = data.get('order_id')
    new_status = data.get('order_status')

    cursor = db.cursor()
    try:
        cursor.execute("""
            UPDATE olist_orders_dataset
            SET order_status = %s
            WHERE order_id = %s
        """, (new_status, order_id))
        db.commit()
        return jsonify({'message': 'Order status updated successfully'}), 200
    except mysql.connector.Error as err:
        return jsonify({'error': str(err)}), 400

if __name__ == '__main__':
    app.run(debug=True)
