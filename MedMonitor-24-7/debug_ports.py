import socket

ports = [8000, 8001, 5140]
for port in ports:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1)
    try:
        s.connect(('127.0.0.1', port))
        print(f'127.0.0.1:{port} OPEN')
    except Exception as e:
        print(f'127.0.0.1:{port} CLOSED ({type(e).__name__})')
    finally:
        s.close()
