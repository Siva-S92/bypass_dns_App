import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import databaseConnection from "../utils/database.js";
import { userRouter } from "../routes/userRoute.js";
import { moviesRouter } from "../routes/moviesRoute.js";
import { createProxyMiddleware } from "http-proxy-middleware";
import https from "https";
// import serverless from 'serverless-http'

//config the env variables
dotenv.config();

//server setup
const app = express();
const PORT = process.env.PORT || 8000;

//using middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'https://bypass-dns-app-frontend.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Handle preflight requests for all routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Handle preflight requests for all routes in Vercel’s serverless environment
//  Ensure that caching of preflight requests is disabled by setting appropriate headers:
// Disable CORS caching
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Disable caching of preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Cache-Control', 'no-store');
    return res.status(200).end();
  }
  
  next();
});



//database Connection
databaseConnection();

//routes

// Proxy endpoint to forward requests to TMDB

app.get("/wish", async (req, res) => {
  res.send("Hello World")
})
app.use("/api/user", userRouter);
app.use("/proxy/tmdb", moviesRouter);
app.use(
  "/tmdb-images",
  createProxyMiddleware({
    target: "https://image.tmdb.org", // Use the domain, not the IP
    changeOrigin: true, // Change origin to target
    secure: true, // Validate SSL certificates
    pathRewrite: {
      "^/tmdb-images": "", // Strip '/tmdb-images' from the start of the path
    },
    onProxyReq(proxyReq, req, res) {
      // Set Host header to image.tmdb.org for correct SSL handshake
      proxyReq.setHeader("Host", "image.tmdb.org");
    },
    onError(err, req, res) {
      res.status(500).send("Proxy error occurred: " + err.message);
    },
    agent: new https.Agent({ rejectUnauthorized: false }), // Disable SSL validation
  })
);

// Listern Server
// app.listen(PORT, () => {
//   console.log("server running on the PORT:", PORT);
// });


// Export the app as a serverless function
export default app;


// export const handler = serverless(app) //this is for aws lambda







// CLIENT_URL:'https://bypass-dns-app-frontend.vercel.app',