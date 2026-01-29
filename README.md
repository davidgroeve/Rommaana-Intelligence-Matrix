# Candidate Dashboard

## Prerequisites
- Python 3.8+
- Node.js 16+

## Setup & Run

### 1. Backend (Python)
The backend handles data loading, PDF parsing, and analysis.

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies (if not already done):
    ```bash
    pip install fastapi uvicorn pandas pypdf python-multipart
    ```
3.  Start the server:
    ```bash
    python main.py
    ```
    The API will be available at `http://localhost:8000`.

### 2. Frontend (React)
The frontend provides the user interface.

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies (if not already done):
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    Open your browser to `http://localhost:5173`.

## Features
-   **Candidate List**: Automatically loads from `../Recruitment.csv`.
-   **Resume Analysis**: Paste a Job Description to score candidates based on their PDF content.
-   **Resume Viewing**: Shows extracted text from the PDF.
-   **Interview Feedback**: Rate and review candidates. Feedback is saved to `backend/interviews.json`.
