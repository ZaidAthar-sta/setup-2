import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';

const userSchema = new Schema(

     {
          username: {
               type: String,
               required: true,
               unique: true,
               lowercase: true,
               trim: true,
               index: true
          },
          email: {
               type: String,
               required: true,
               unique: true,
               lowercase: true,
               trim: true,
          },
          fullname: {
               type: String,
               required: true,
               trim: true,
               index: true
          },
          avatar: {
               type: String, // cloudinary url
               required: true,
          },
          coverImg: {
               type: String // cloudinary url 
          },
          watchHistory: [
               {
                    type: Schema.Types.ObjectId,
                    ref: "Video"
               }
          ],
          password: {
               type: String,
               required: [true, "Password Required"]
          },
          refreshToken: {
               type: String
          }
     }, { timestamps: true }
)

userSchema.pre("save", async function () {
     if (!this.isModified("password")) return next()

     this.password = await bcrypt.hash(this.password, 10)
     next();

})

userSchema.methods.isPasswordCorrect = async function (password) {
     return await bcrypt.compare(password, this.password)
}

userSchema.methods.genAccessToken = function () {
     jwt.sign({
          id: this._id,
          email: this.email,
          username: this.username,
          fullname: this.fullname
     },
          process.env.ACCESS_TOKEN_SECRET,
          {
               expiresIn: process.env.ACCESS_TOKEN_EXPIRY
          }
     )

}

userSchema.methods.genRefreshToken = function () {
     jwt.sign({
          id: this._id
     },
          process.env.REFRESH_TOKEN_SECRET,
          {
               expiresIn: process.env.REFRESH_TOKEN_EXPIRY
          }
     )

}



export const User = mongoose.model("User", userSchema)