import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'


const videoSchema = new Schema(
     {
          videoFile: {
               type: String,
               reqruired: true
          },
          thumbnail: {
               type: String,
               reqruired: true
          },
          title: {
               type: String,
               reqruired: true
          },
          description: {
               type: String,
               reqruired: true
          },
          duration: {
               type: Number,
               reqruired: true
          },
          views: {
               type: Number,
               default: 0
          },
          isPublished: {
               type: Boolean,
               default: true
          },
          owner: {
               type: Schema.Types.ObjectId,
               ref: "User"
          }


     }, { timestamps: true }
)

videoSchema.plugin(mongooseAggregatePaginate)



export const Video = mongoose.model("Video", videoSchema)