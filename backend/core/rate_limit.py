from fastapi import Request, HTTPException
import time

class RateLimiter:
    def __init__(self, calls: int, period: int):
        self.calls = calls
        self.period = period
        self.clients = {}

    def __call__(self, request: Request):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        if client_ip not in self.clients:
            self.clients[client_ip] = []
            
        # Clean up old requests
        self.clients[client_ip] = [req_time for req_time in self.clients[client_ip] if now - req_time < self.period]
        
        if len(self.clients[client_ip]) >= self.calls:
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
            
        self.clients[client_ip].append(now)

# Create instances for different endpoints
login_limiter = RateLimiter(calls=10, period=60) # 10 requests per minute
scan_limiter = RateLimiter(calls=30, period=60) # 30 scans per minute
activation_limiter = RateLimiter(calls=5, period=300) # 5 attempts per 5 minutes
