# Patient Management System

## Project Overview
This Patient Management System allows healthcare providers to manage patient information effectively. It offers features for tracking patient records, appointments, billing, and more.

## Features
- User authentication and authorization  
- Patient information management  
- Appointment scheduling  
- Billing management  
- API for third-party integrations  

## Tech Stack
- **Frontend**: React.js  
- **Backend**: Node.js, Express  
- **Database**: MongoDB  
- **Authentication**: JWT  

## Installation Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/cybersree401/patient-management-system.git
   cd patient-management-system
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## How to Set Up Database
1. Ensure MongoDB is installed and running on your machine.
2. Create a new database named `patient_management`.
3. Update the database connection string in the `.env` file.

## Environment Variables
- `PORT`: Port number for the server.
- `MONGODB_URI`: Connection string for MongoDB.
- `JWT_SECRET`: Secret key for JWT authentication.

## Running the Application
1. Start the server:
   ```bash
   npm start
   ```
2. Open `http://localhost:<PORT>` in your browser.

## API Endpoints
- **GET /api/patients**: Retrieve all patients.
- **POST /api/patients**: Create a new patient record.
- **GET /api/patients/:id**: Get patient details by ID.
- **PUT /api/patients/:id**: Update patient information.
- **DELETE /api/patients/:id**: Delete a patient record.

## Project Structure
```
patient-management-system/
│
├── client/              # Frontend application
│   └── ...              
│
├── server/              # Backend application
│   └── ...              
│
├── .env                 # Environment variables
├── package.json          # Node.js dependencies
└── README.md            # Project documentation
```