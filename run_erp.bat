@echo off
REM Navigate to the project directory
cd /d "C:\Users\joelm\OneDrive\Desktop\Smart_Factory_UI"

REM Activate the virtual environment
call venv\Scripts\activate

REM Run the Python script asynchronously (in a new window)
start "" python writing_from_html.py

REM Keep the command prompt open
pause
