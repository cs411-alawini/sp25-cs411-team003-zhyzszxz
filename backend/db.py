from flask import Flask, jsonify
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

@app.route("/api/sellers")
def get_sellers():
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT seller_id, seller_city, seller_state FROM olist_sellers_dataset LIMIT 10;")
    result = cursor.fetchall()
    cursor.close()
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
