# Base Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy and install Python dependencies from the backend directory
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend project files
COPY backend/ .

# Expose port 8000 for Render
EXPOSE 8000

# Start the app with gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8000"]
