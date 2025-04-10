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

if __name__ == '__main__':
    app.run(debug=True)
