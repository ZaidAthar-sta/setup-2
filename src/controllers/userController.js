import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/userModel.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"


const genAccessAndRefreshToken = async (userId) => {
     try {
          const user = await User.findById(userId)
          const accessToken = user.genAccessToken()
          const refreshToken = user.genRefreshToken()

          user.refreshToken = refreshToken;
          await user.save({ validateBeforeSave: false })

          return { accessToken, refreshToken }

     } catch (error) {
          throw new ApiError(500, "Something went wrong while generating access and refresh token!!!");

     }

}

const registerUser = asyncHandler(async (req, res) => {

     // get user details from frontend
     // validation - not empty
     // check if user already exists : username email
     // check for images , check for avatar
     // upload them in cloudinary
     // create user object - create entry in DB
     // remove password and refresh token field from response
     // check for user creation 
     // return response

     const { fullname, username, email, password } = req.body;

     if (fullname === "" || username === "" || email === "" || password === "") {
          throw new ApiError(400, "All fields are required!!");

     }
     const existedUser = await User.findOne({
          $or: [{ email }, { username }]
     })

     if (existedUser) {
          throw new ApiError(409, "User with email or user with username already exists")
     }

     const avatarLocalPath = req.files?.avatar ? req.files?.avatar[0]?.path : null
     // const coverImageLocalPath = req.files?.coverImage[0]?.path

     let coverImageLocalPath;
     if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
          coverImageLocalPath = req.files.coverImage[0].path;
     }
     console.log(req.files);

     if (!avatarLocalPath) {
          throw new ApiError(400, "Avatar is required !!");
     }

     const avatar = await uploadOnCloudinary(avatarLocalPath);
     const coverImage = await uploadOnCloudinary(coverImageLocalPath);

     if (!avatar) {
          throw new ApiError(400, "Avatar upload failed !!");
     } else {
          console.log("Avatar upload successful!!!");
     }

     const user = await User.create({
          fullname,
          avatar: avatar.url,
          coverImage: coverImage?.url || "",
          email,
          password,
          username: username.toLowerCase()
     })

     const createdUser = await User.findById(user._id).select(
          "-password -refreshToken"
     )

     if (!createdUser) {
          throw new ApiError(500, "Something went wrong while registering the user !!!");

     }

     return res.status(201).json(
          new ApiResponse(200, "User registered successfully !!!", createdUser)
     )

});


const loginUser = asyncHandler(async (req, res) => {
     // req body -> data
     // username or email
     // find the user
     // password check
     // access and refresh token
     // send cookies
     // send response


     const { email, username, password } = req.body;

     if (!(email || username)) {
          throw new ApiError(400, "Email or username required !!");
     }

     const user = await User.findOne({
          $or: [{ username }, { email }]
     })

     if (!user) {
          throw new ApiError(404, "User not Found");
     }

     const isPasswordValid = await user.isPasswordCorrect(password)

     if (!isPasswordValid) {
          throw new ApiError(401, "Password inValid");
     }

     const { accessToken, refreshToken } = await genAccessAndRefreshToken(user._id)


     const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

     const options = {
          httpOnly: true,
          secure: true
     }

     return res.status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .json(
               new ApiResponse(200,
                    {
                         user: loggedInUser, accessToken, refreshToken
                    },
                    "User Logged In Successfully !!!"
               )
          )

})

const logoutUser = asyncHandler(async (req, res) => {

     await User.findByIdAndUpdate(
          req.user._id,
          {
               $set: {
                    refreshToken: undefined
               }
          },
          {
               new: true
          }

     )

     const options = {
          httpOnly: true,
          secure: true
     }
     return res
          .status(200)
          .clearCookie("accessToken", options)
          .clearCookie("refreshToken", options)
          .json(new ApiResponse(200, {}, "User logged Out"));
})



export { registerUser, loginUser, logoutUser }

// --------------------------------------------------------------------------



// import { asyncHandler } from '../utils/asyncHandler.js'
// import { ApiError } from "../utils/ApiError.js";
// import { User } from "../models/userModel.js";
// import { v2 as cloudinary } from "cloudinary";
// import { ApiResponse } from "../utils/ApiResponse.js"
// import { uploadOnCloudinary } from "../utils/Cloudinary.js"


// const genAccessAndRefreshToken = async (userId) => {
//      try {
//           const user = await User.findById(userId)
//           const accessToken = user.genAccessToken()
//           const refreshToken = user.genRefreshToken()

//           user.refreshToken = refreshToken;
//           await user.save({ validateBeforeSave: false })

//           return { accessToken, refreshToken }

//      } catch (error) {
//           throw new ApiError(500, "Something went wrong while generating access and refresh token!!!");

//      }

// }

// const registerUser = asyncHandler(async (req, res) => {

//      // get user details from frontend
//      // validation - not empty
//      // check if user already exists : username email
//      // check for images , check for avatar
//      // upload them in cloudinary
//      // create user object - create entry in DB
//      // remove password and refresh token field from response
//      // check for user creation
//      // return response

//      const { fullname, username, email, password } = req.body;
//      console.log("Email : ", email);

//      if (fullname === "" || username === "" || email === "" || password === "") {
//           throw new ApiError(400, "All fields are required!!");

//      }
//      const existedUser = await User.findOne({
//           $or: [{ email }, { username }]
//      })

//      if (existedUser) {
//           throw new ApiError(409, "User with email or user with username already exists")
//      }
//      // const avatar = req.file;
//      // let avatarURL = null;
//      // if (avatar) {
//      //      const response = await cloudinary.uploader.upload(avatar.path, { resource_type: "image" });
//      //      avatarURL = response.secure_url;
//      // }

//      const avatar = req.files.avatar ? req.files.avatar[0] : null;
//      const coverImage = req.files.coverImage ? req.files.coverImage[0] : null;

//      if (!avatar || !coverImage) {
//           return res.status(404).json({ success: false, message: "All fields are required" });
//      }

//      let avatarURL = null;
//      let coverImageURL = null;

//      if (avatar) {
//           const response = await cloudinary.uploader.upload(avatar.path, { resource_type: "image" });
//           avatarURL = response.secure_url;
//      }

//      if (coverImage) {
//           const response = await cloudinary.uploader.upload(coverImage.path, { resource_type: "image" });
//           coverImageURL = response.secure_url;
//      }


//      // const avatarLocalPath = req.files?.avatar ? req.files?.avatar[0]?.path : null
//      // const coverImageLocalPath = req.files?.coverImage[0]?.path

//      // console.log(req.files);

//      // if (!avatarLocalPath) {
//      //      throw new ApiError(400, "Avatar is required !!");
//      // }

//      // const avatar = await uploadOnCloudinary(avatarLocalPath);
//      // const coverImage = await uploadOnCloudinary(coverImageLocalPath);

//      // if (!avatar) {
//      //      throw new ApiError(400, "Avatar upload failed !!");
//      // }

//      const user = await User.create({
//           fullname,
//           avatar: avatarURL,
//           coverImage: coverImageURL,
//           email,
//           password,
//           username: username.toLowerCase()
//      })

//      const createdUser = await User.findById(user._id).select(
//           "-password -refreshToken"
//      )

//      if (!createdUser) {
//           throw new ApiError(500, "Something went wrong while registering the user !!!");

//      }

//      return res.status(201).json(
//           new ApiResponse(200, "User registered successfully !!!", createdUser)
//      )

// });


// const loginUser = asyncHandler(async (req, res) => {
//      // req body -> data
//      // username or email
//      // find the user
//      // password check
//      // access and refresh token
//      // send cookies
//      // send response


//      const { email, username, password } = req.body;

//      if (!(email || username)) {
//           throw new ApiError(400, "Email or username required !!");
//      }

//      const user = await User.findOne({
//           $or: [{ username }, { email }]
//      })

//      if (!user) {
//           throw new ApiError(404, "User not Found");
//      }

//      const isPasswordValid = await user.isPasswordCorrect(password)

//      if (!isPasswordValid) {
//           throw new ApiError(401, "Password inValid");
//      }

//      const { accessToken, refreshToken } = await genAccessAndRefreshToken(user._id)


//      const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

//      const options = {
//           httpOnly: true,
//           secure: true
//      }

//      return res.status(200)
//           .cookie("accessToken", accessToken, options)
//           .cookie("refreshToken", refreshToken, options)
//           .json(
//                new ApiResponse(200,
//                     {
//                          user: loggedInUser, accessToken, refreshToken
//                     },
//                     "User Logged In Successfully !!!"
//                )
//           )

// })

// const logoutUser = asyncHandler(async (req, res) => {

//      await User.findByIdAndUpdate(
//           req.user._id,
//           {
//                $set: {
//                     refreshToken: undefined
//                }
//           },
//           {
//                new: true
//           }

//      )

//      const options = {
//           httpOnly: true,
//           secure: true
//      }
//      return res
//           .status(200)
//           .clearCookie("accessToken", options)
//           .clearCookie("refreshToken", options)
//           .json(new ApiResponse(200, {}, "User logged Out"));
// })



// export { registerUser, loginUser, logoutUser }








