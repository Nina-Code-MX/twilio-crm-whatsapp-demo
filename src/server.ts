import app from "./app";
import SmeeClient from "smee-client";
import dotenv from "dotenv";

dotenv.config();

const PORT: string | undefined = process.env.PORT || '3000';
const ENV: string | undefined = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {

    if (ENV === 'development') {
        const smee = new SmeeClient({
            source: "https://smee.io/ninacodemx",
            target: `http://localhost:${PORT}/voice/ninacode`,
            logger: console,
        });
    
        smee.start();
    }
});
