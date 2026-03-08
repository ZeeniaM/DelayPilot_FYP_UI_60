// API configuration for DelayPilot backend
// By default, point to the FastAPI server started by `python start_delaypilot.py`
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export default API_BASE_URL;

