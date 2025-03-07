import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import jwt from 'jsonwebtoken'
import { User } from '../models/userModel.js'

export const verifyJWT = asyncHandler(async (req, res, next) => {

     try {
          // const token = req.cookies?.accessToken || req.headers("Authorization")?.replace("Bearer ", "");
          const token = req.cookies?.accessToken || req.headers['authorization']?.replace('Bearer ', '');


          if (!token) {
               throw new ApiError(401, "Unauthorized request")
          }
          console.log("Token : ", token);

          let decodedToken;
          try {
               decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
          }
          catch (error) {
               console.log("JWT verification failed: ", error)
               if (error.name === 'TokenExpiredError') {
                    throw new ApiError(401, "Token has expired");
               }
               throw new ApiError(401, "Invalid token");
          }


          const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

          if (!user) {
               throw new ApiError(401, "Invalid Access token")
          }

          req.user = user;
          next();

     } catch (error) {
          console.error("Error in verifyJWT middleware:", error);
          throw new ApiError(401, "Invalid Access Token !!!");
     }
})
