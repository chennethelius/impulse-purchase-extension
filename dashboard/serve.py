"""
Simple HTTP server for the modern dashboard
Serves static files and provides JSON data
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os

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
        return super().do_GET()

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
