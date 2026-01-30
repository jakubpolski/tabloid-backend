import mongoose from "mongoose";

const connectDB = async(): Promise<void> => {
    try {
        const dbConnection = process.env.DB_CONNECTION;

        await mongoose.connect(
            dbConnection
        )
        console.log("Successfully connected to MongoDB");
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

export default connectDB;