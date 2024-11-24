import app from "./app";
import SmeeClient from "smee-client";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);

    // Set up Smee.io for testing webhooks
    const smee = new SmeeClient({
        source: "https://smee.io/ninacodemx",
        target: `http://localhost:${PORT}/whatsapp`,
        logger: console,
    });

    smee.start();
    console.log("Smee client is forwarding webhooks to /whatsapp");
});
