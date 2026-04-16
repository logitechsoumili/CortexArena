FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code (exclude .env – secrets injected by Cloud Run at runtime)
COPY . .
RUN rm -f .env

# Expose port (Cloud Run uses PORT env var)
EXPOSE 8080

# Run the application
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
