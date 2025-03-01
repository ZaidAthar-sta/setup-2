import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import app from './app.js';



dotenv.config({
     path: './env'
})


connectDB()
     .then(() => {
          app.listen(process.env.PORT || 3000, () => {
               console.log(`Server is running on Port ${process.env.PORT}`);

          })
     }

     )
     .catch((err) => {
          console.log("MONGODB connection failed !! ", err);

     })