# pip install Flask Flask-CORS requests

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
# Enable CORS for all domains, which is necessary for a React frontend
CORS(app)

# This is a placeholder for a real API key. You should get a free API key from a service
# like Alpha Vantage, IEX Cloud, or similar.
# Store your API key in an environment variable for security.
# For example: os.environ.get('STOCK_API_KEY')
# For this example, we'll just use a mock API response.
# real_api_key = os.environ.get('STOCK_API_KEY')
# real_api_base_url = 'https://www.alphavantage.co/query'

# Define a mock API response to test the app without an API key
MOCK_DATA = {
    'AAPL': {
        'symbol': 'AAPL',
        'price': 175.25,
        'open': 174.50,
        'high': 176.10,
        'low': 174.05,
        'prevClose': 174.90
    },
    'GOOGL': {
        'symbol': 'GOOGL',
        'price': 140.50,
        'open': 139.80,
        'high': 141.20,
        'low': 139.50,
        'prevClose': 140.10
    }
}

@app.route('/api/stock/<symbol>', methods=['GET'])
def get_stock_data(symbol):
    """
    This endpoint serves stock data for a given symbol.
    It currently uses a mock data source but can be easily
    adapted to use a real stock market API.
    """
    print(f"Received request for symbol: {symbol}")
    
    # In a real application, you would make an API call here.
    # Example using Alpha Vantage:
    # params = {
    #     'function': 'GLOBAL_QUOTE',
    #     'symbol': symbol,
    #     'apikey': real_api_key
    # }
    # try:
    #     response = requests.get(real_api_base_url, params=params)
    #     response.raise_for_status() # Raises an HTTPError if the status is 4xx or 5xx
    #     data = response.json()
    #     # Process the data here and return it
    #     return jsonify(data)
    # except requests.exceptions.RequestException as e:
    #     print(f"Error fetching data: {e}")
    #     return jsonify({'error': 'Failed to fetch data from external API'}), 500

    # Using the mock data for now
    if symbol.upper() in MOCK_DATA:
        return jsonify(MOCK_DATA[symbol.upper()])
    else:
        # Return a 404 error if the symbol is not found in our mock data
        return jsonify({'error': 'Stock symbol not found'}), 404

if __name__ == '__main__':
    # Run the Flask app on port 5000
    app.run(debug=True, port=5000)
