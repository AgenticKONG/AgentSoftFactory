# -*- coding: utf-8 -*-
import http.server
import socketserver
import os
import sys

PORT = 8000
DIRECTORY = "/Users/erickong/AgentSoftFactory/projects"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"--- ASF PREVIEW SERVER ACTIVE ---")
        print(f"Serving projects at: http://localhost:{PORT}")
        print(f"Project 001: http://localhost:{PORT}/001-d3-gdp-viz/index.html")
        httpd.serve_forever()

if __name__ == "__main__":
    try:
        run_server()
    except KeyboardInterrupt:
        print("\nServer stopped by user.")
        sys.exit(0)
