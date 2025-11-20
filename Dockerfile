# Base Python image
FROM python:3.11-slim

# Install system utilities
RUN apt-get update && apt-get install -y iputils-ping traceroute && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project
COPY . .

# Expose port 8000 for Render
EXPOSE 8000

# Start the app with gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8000"]
