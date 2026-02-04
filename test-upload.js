const fs = require('fs');
const path = require('path');

// 1. Create a dummy image
const dummyImagePath = path.join(__dirname, 'test_image.png');
fs.writeFileSync(dummyImagePath, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", 'base64'));

async function runTest() {
    const baseUrl = 'http://localhost:5000/api';
    const email = `testuser_${Date.now()}@example.com`;
    const password = "password123";

    console.log("1️⃣  Registering user...");
    try {
        const regRes = await fetch(`${baseUrl}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "TestUser", email, password })
        });
        const regData = await regRes.json();
        console.log("   Register status:", regRes.status);
        if (!regRes.ok) throw new Error(regData.message);

        console.log("2️⃣  Logging in...");
        const loginRes = await fetch(`${baseUrl}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        console.log("   Login status:", loginRes.status);
        if (!loginRes.ok) throw new Error(loginData.message);
        const token = loginData.token;
        console.log("   ✅ Token received");

        console.log("3️⃣  Uploading image...");
        const formData = new FormData();
        const fileBlob = new Blob([fs.readFileSync(dummyImagePath)], { type: 'image/png' });
        formData.append("image", fileBlob, "test_image.png");

        const uploadRes = await fetch(`${baseUrl}/upload`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
                // Note: NO Content-Type header, fetch sets it for FormData
            },
            body: formData
        });

        const uploadData = await uploadRes.json();
        console.log("   Upload status:", uploadRes.status);
        console.log("   Response:", uploadData);

        if (uploadRes.ok) {
            console.log("\n✅ SUCCESS: Image upload verified!");
        } else {
            console.log("\n❌ FAILED: " + uploadData.message);
        }

    } catch (error) {
        console.error("\n❌ Error:", error.message);
    } finally {
        // Cleanup
        if (fs.existsSync(dummyImagePath)) fs.unlinkSync(dummyImagePath);
    }
}

runTest();
