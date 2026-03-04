import mongoose from "mongoose";

export const dbConnect = async () => {
  await mongoose
    .connect(process.env.MONGODB_URI)
    .then((res) => console.log("MongoDB Connected.."))
    .catch((error) => console.log("MongoDB Error", error.message));
};
