import subprocess
import time
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

WATCHED_EXTENSIONS = ('.py', '.html', '.css', '.js', '.txt', '.mp3', '.jpg')

class ReloadHandler(FileSystemEventHandler):
    def __init__(self, command):
        self.command = command
        self.process = None
        self.start_server()

    def start_server(self):
        if self.process:
            self.process.kill()
        print("\n>>> Starting server...")
        self.process = subprocess.Popen(self.command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=1, universal_newlines=True)
        self.print_logs()

    def print_logs(self):
        def read_output():
            for line in self.process.stdout:
                print(f"[server] {line.strip()}")

        import threading
        threading.Thread(target=read_output, daemon=True).start()

    def on_any_event(self, event):
        if event.is_directory or event.src_path.endswith(WATCHED_EXTENSIONS):
            print(f">>> Change detected: {event.src_path}")
            self.start_server()

if __name__ == "__main__":
    path = '.'
    handler = ReloadHandler(['python', 'server.py'])
    observer = Observer()
    observer.schedule(handler, path=path, recursive=True)
    observer.start()
    print(">>> Watching for changes in your project. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(">>> Stopping watcher.")
        observer.stop()
        if handler.process:
            handler.process.kill()
    observer.join()
