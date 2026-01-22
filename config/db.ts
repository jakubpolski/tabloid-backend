import mongoose from "mongoose";

const connectDB = async(): Promise<void> => {
    try {
        const dbUser = process.env.DB_USER;
        const dbPassword = process.env.DB_PASSWORD;

        if (!dbUser || !dbPassword) {
            throw new Error("DB_USER or DB_PASSWORD is not defined in environment variables");
        }

        await mongoose.connect(
            `mongodb+srv://${dbUser}:${dbPassword}@tabloid.zb32hd3.mongodb.net/tabloid?appName=tabloid`
        )
        console.log("Successfully connected to MongoDB");
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

export default connectDB;