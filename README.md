# Divya-Drishti

A comprehensive telemedicine platform for real-time patient vital signs monitoring using advanced OCR technology and AI-powered analysis.

##  Features

- **Patient Records System**: Manage patient admissions, bed assignments, and medical history.
- **Real-Time Camera Monitoring**: Live camera feed with automatic vital signs extraction every 3 seconds.
- **AI-Powered OCR**: Utilizes **Hugging Face (Qwen2.5-VL-7B-Instruct)** for high-accuracy vital sign extraction, with **Tesseract.js** as a robust fallback.
- **Video Processing**: Upload and analyze video files to extract vital signs data.
- **Comprehensive Dashboard**: View historical data, trends, and analytics with interactive charts.
- **Real-Time Notifications**: Get alerts for abnormal vital signs readings via Socket.io.
- **Data Export**: Export monitoring data to CSV for further analysis.
- **Responsive Design**: Works seamlessly across desktop and mobile devices.

##  Architecture

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with Shadcn/ui components
- **Routing**: React Router DOM
- **State Management**: React Query
- **Real-Time**: Socket.io Client
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (using `mysql2`)
- **Real-Time**: Socket.io Server
- **AI/OCR**: 
  - **Primary**: Hugging Face Inference API (Qwen2.5-VL-7B-Instruct)
  - **Secondary**: Tesseract.js (On-device OCR)

##  Database Schema

The application uses a relational MySQL database with the following structure:

### `patients`
Stores patient demographic and admission details.
- `patient_id` (PK)
- `patient_name`
- `age`
- `gender`
- `diagnosis`
- `admission_date`

### `beds`
Maps patients to specific beds.
- `bed_id` (PK)
- `patient_id` (FK -> patients.patient_id)

### `vitals`
Stores time-series vital sign data.
- `vital_id` (PK)
- `patient_id` (FK -> patients.patient_id)
- `hr` (Heart Rate)
- `pulse`
- `spo2` (Oxygen Saturation)
- `abp` (Arterial Blood Pressure)
- `pap` (Pulmonary Artery Pressure)
- `etco2` (End-Tidal CO2)
- `awrr` (Airway Respiratory Rate)
- `source` ('camera' or 'video')
- `created_at`

## 🛠️ Setup and Installation

### Prerequisites
- Node.js 18+
- MySQL Server (running locally or remotely)
- Hugging Face API Key (free)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Tele-Sanjeevani
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies (frontend)
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Database Setup**
   - Ensure your MySQL server is running.
   - Log in to MySQL and run the schema script located at `server/schema.sql`.
   - This will create the `vitalview` database and seed it with initial data.
   ```bash
   # Example command line usage
   mysql -u root -p < server/schema.sql
   ```

4. **Environment Configuration**
   Create a `.env` file in the `server/` directory:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=vitalview
   HUGGING_FACE_API_KEY=your_hf_api_key
   ```

5. **Start Development Server**
   This command runs both the frontend (Vite) and backend (Express) concurrently.
   ```bash
   npm run dev
   ```

##  Usage

### Patient Records
1. Navigate to the "Patient Records" tab.
2. View the list of admitted patients and their assigned beds.
3. Click on a patient to view their specific dashboard and history.

### Real-Time Monitoring
1. Navigate to the "Camera" tab.
2. Select a patient to associate the data with.
3. Click "Start Capture" to begin live monitoring.
4. The system will automatically extract vitals from the camera feed.

### Dashboard Analytics
1. Access the "Dashboard" tab.
2. Filter data by date range.
3. View charts and trends for specific patients.

##  Security & Privacy

- **Data Isolation**: Patient data is strictly segregated in the database.
- **Secure Communication**: API calls and real-time events are handled securely.
- **Environment Variables**: Sensitive keys (DB credentials, API keys) are never committed to version control.

##  Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

##  License

This project is licensed under the MIT License.
