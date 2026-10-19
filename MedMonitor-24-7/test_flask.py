"""
Hello World - اختبار أن Flask يعمل
"""
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return "✅ Hello! Flask is working!"

@app.route('/test')
def test():
    return {"status": "OK", "message": "Server is running"}

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Starting Flask Test Server")
    print("="*60)
    print("\nOpen in browser:")
    print("  http://localhost:8000")
    print("  http://localhost:8000/test")
    print("\nPress Ctrl+C to stop\n")
    
    try:
        app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
