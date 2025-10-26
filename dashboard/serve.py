"""
Simple HTTP server for the modern dashboard
Serves static files and provides JSON data from Chrome extension storage
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
import sqlite3
import glob

class DashboardHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()
    
    def do_GET(self):
        if self.path == '/' or self.path == '':
            self.path = '/index.html'
        elif self.path == '/api/extension-stats':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # Read stats from extension_stats.json (written by extension)
            stats_data = self.get_extension_stats()
            self.wfile.write(json.dumps(stats_data).encode())
            return
        return super().do_GET()
    
    def do_POST(self):
        if self.path == '/api/update-stats':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                stats = json.loads(post_data.decode('utf-8'))
                
                # Save stats to extension_stats.json
                with open('extension_stats.json', 'w') as f:
                    json.dump(stats, f, indent=2)
                
                print(f"✅ Stats updated: {stats.get('totalBattles', 0)} battles, ${stats.get('moneySaved', 0)} saved")
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
            except Exception as e:
                print(f"❌ Error saving stats: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            return
        
        self.send_response(404)
        self.end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def get_extension_stats(self):
        """Read stats from extension_stats.json file"""
        try:
            # ONLY read from extension_stats.json (written by extension)
            if os.path.exists('extension_stats.json'):
                with open('extension_stats.json', 'r') as f:
                    data = json.load(f)
                    print(f"✅ Loaded stats from extension_stats.json")
                    return data
            else:
                print(f"⚠️ No extension_stats.json found - extension hasn't exported data yet")
                
        except Exception as e:
            print(f"❌ Error reading extension_stats.json: {e}")
        
        # Return default empty stats matching extension format
        return {
            "totalBattles": 0,
            "victories": 0,
            "defeats": 0,
            "moneySaved": 0,
            "savingsHistory": [],
            "purchaseHistory": [],
            "categoryStats": {},
            "recentBattles": []
        }

def run_server(port=5000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, DashboardHandler)
    
    print("""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🚀 Impulse Guard Dashboard                           ║
║                                                           ║
║     ✨ Modern UI with Tailwind CSS                        ║
║     📊 Charts with Chart.js & Plotly.js                   ║
║     🎨 Beautiful Animations & Glassmorphism               ║
║     💎 Font Awesome Icons                                 ║
║                                                           ║
║     Server running on: http://localhost:{:<4}             ║
║                                                           ║
║     Open your browser and navigate to the URL above       ║
║     Press Ctrl+C to stop                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """.format(port))
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n✅ Server stopped gracefully")
        httpd.shutdown()

if __name__ == '__main__':
    # Change to dashboard directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    run_server(5000)
