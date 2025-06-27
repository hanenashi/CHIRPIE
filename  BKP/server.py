import http.server
import socketserver
import json
import os
import urllib.parse

PORT = 8000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_path.query)

        if parsed_path.path == '/api/birds':
            try:
                birds = {}
                birds_dir = 'birds'
                for folder in os.listdir(birds_dir):
                    folder_path = os.path.join(birds_dir, folder)
                    if os.path.isdir(folder_path):
                        birds[folder] = []
                        for file in os.listdir(folder_path):
                            if file.endswith('.mp3'):
                                birds[folder].append({
                                    'name': os.path.splitext(file)[0],
                                    'file': f'birds/{folder}/{file}'
                                })
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(birds).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        
        elif parsed_path.path == '/api/file/download':
            try:
                file_path = query_params.get('path', [''])[0]
                if not file_path or not file_path.endswith('.txt'):
                    self.send_response(400)
                    self.end_headers()
                    return
                full_path = os.path.join(os.getcwd(), file_path)
                if not os.path.isfile(full_path):
                    self.send_response(404)
                    self.end_headers()
                    return
                with open(full_path, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/save':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            folder = data['folder']
            bird_data = data['data']
            file_path = os.path.join('birds', folder, f'{folder}.txt')
            
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    for key, value in bird_data.items():
                        f.write(f'{key}={value}\n')
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success'}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

Handler = CustomHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()