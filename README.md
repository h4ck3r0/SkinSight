# SkinSight

SkinSight is a modern healthcare management platform that connects patients, doctors, and hospitals. It enables patients to find nearby hospitals, book appointments, join real-time queues, and manage their healthcare journey efficiently.

## Features

- **Patient Dashboard:**  
  - Search and view nearby hospitals using geolocation  
  - Filter hospitals by name, address, city, state, or doctor  
  - View available doctors and their specializations  
  - Book appointments with doctors  
  - Join and monitor real-time queues  
  - View appointment history

- **Doctor & Hospital Dashboards:**  
  - Manage appointments and queues  
  - View patient lists  
  - Update availability and consultation details

- **Real-Time Queue System:**  
  - Patients can join queues and track their position  
  - Doctors and staff can manage queue flow

- **Authentication:**  
  - Secure login for patients, doctors, and hospital staff  
  - JWT-based authentication

- **Responsive UI:**  
  - Built with React, Tailwind CSS, and Vite for fast, modern user experience

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Axios, React Router, Socket.IO Client
- **Backend:** Node.js, Express, MongoDB, Mongoose, Socket.IO
- **Deployment:** Netlify (client), Render/Heroku (server)

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- MongoDB instance (local or cloud)
-Change the MonGo_URL in the .env to your own cluster
### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/MyCareBridge.git
cd MyCareBridge
```

#### 2. Setup the Server

```bash
cd server
npm install
# Create a .env file with your MongoDB URI and JWT secret
npm run dev
```

#### 3. Setup the Client

```bash
cd ../client
npm install
npm run dev
```

- The client will run on [http://localhost:5173](http://localhost:5173) by default.
- The server will run on [http://localhost:5000](http://localhost:5000) by default.

### Building for Production

```bash
cd client
npm run build
```

- The production build will be in the `client/dist` folder.

### Deploying

- **Frontend:** Deploy the `client/dist` folder to Netlify or any static hosting.
- **Backend:** Deploy the `server` folder to Render, Heroku, or any Node.js hosting.

#### Netlify Configuration

Add a `netlify.toml` in the `client` folder:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Environment Variables

- **Client:**  
  - `VITE_API_URL` — URL of your backend API

- **Server:**  
  - `MONGO_URI` — MongoDB connection string  
  - `JWT_SECRET` — Secret for JWT authentication

## Folder Structure

```
MyCareBridge/
  client/      # React frontend
  server/      # Node.js/Express backend.
```

##Link
<link src='skinsight.netlify.app'>Link<link>


## Contributing

Pull requests are welcome! For major changes,  please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)

---

**SkinSight** — Bridging the gap between patients and healthcare providers
