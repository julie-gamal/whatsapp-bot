
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");
const http = require("http");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        // printQRInTerminal: true, // Removed deprecated option
        browser: ["Chrome", "Windows", "10.0"],
    });

    
    sock.ev.on("creds.update", saveCreds);

    
    sock.ev.on("connection.update", (update) => {
        const { connection, qr, lastDisconnect } = update;
        if (qr) {
            console.log("📌 امسح الكود ده بالواتساب (أو انسخ السطر التالي في مولد QR):");
            console.log(qr); // Log the QR string for remote use
            // Save QR as PNG for download (if running locally)
            QRCode.toFile("qr.png", qr, function (err) {
                if (err) console.error("فشل حفظ QR:", err);
                else console.log("تم حفظ QR كصورة qr.png");
            });
        }
        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = reason !== DisconnectReason.loggedOut;
            console.log("❌ الاتصال اتقفل، بيحاول يشتغل تاني...");
            if (shouldReconnect) {
                setTimeout(startBot, 5000);
            } else {
                console.log("تم تسجيل الخروج بالكامل، امسح مجلد auth_info واعمل سكان جديد.");
            }
        } else if (connection === "open") {
            console.log("✅ تم تسجيل الدخول بنجاح!");
        }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        const msg = messages[0];
        console.log(JSON.stringify(msg, null, 2)); // Log the incoming message for debugging

        if (!msg.message || msg.key.fromMe || msg.key.remoteJid === "status@broadcast") return;

        const from = msg.key.remoteJid;
        let text = "";


        if (msg.message.conversation) text = msg.message.conversation;
        else if (msg.message.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;
        else if (msg.message.imageMessage?.caption) text = msg.message.imageMessage.caption;
        else if (msg.message.videoMessage?.caption) text = msg.message.videoMessage.caption;
        else if (msg.message.buttonsResponseMessage?.selectedButtonId) text = msg.message.buttonsResponseMessage.selectedButtonId;
        else if (msg.message.listResponseMessage?.singleSelectReply?.selectedRowId) text = msg.message.listResponseMessage.singleSelectReply.selectedRowId;

        if (!text) return;

        text = text.trim().toLowerCase();
        console.log("📩 النص المستخرج:", text);

       
        if (
            text === "مرحبا" ||
            text === "السلام عليكم" ||
            text === "hello" ||
            text === "hi" ||
            text === "مساء الخير" ||
            text === "مساءالخير" ||
            text === "صباح الخير" ||
            text === "صباحالخير"
        ) {
            await sock.sendMessage(from, {
                text: "شكرا لتواصلك مع رهط الدينامو ⚡\nاختر الخدمة:\n1️⃣ الأشكال\n2️⃣ الأسعار\n3️⃣ تواصل معنا\n4️⃣للطلب"
            });
        } else if (text === "1") {
            await sock.sendMessage(from, {
                text: "دي الأشكال المتاحة: https://bit.ly/beddy-dynamo\nلو عايز تكمل الطلب اكتب اطلب دلوقتي",
            });
        } else if (text === "2") {
            await sock.sendMessage(from, {
                text: `الأسعار:
١ طقم سرير ١٨٠ سم - ٦٥٠ جنيه
سرير ١٦٠ سم - ٦٠٠ جنيه
سرير ١٤٠ سم - ٥٥٠ جنيه
سرير ١٢٠ سم - ٥٠٠ جنيه
٢ طقم سريرين ١٨٠ سم - ١١٥٠ جنيه
سريرين ١٦٠ سم - ١٠٥٠ جنيه
سريرين ١٤٠ سم - ٩٥٠ جنيه
سريرين ١٢٠ سم - ٩٠٠ جنيه
عرض العائلة:
١٨٠ + ٢×١٢٠ = ١٥٠٠ جنيه
١٦٠ + ٢×١٢٠ = ١٤٥٠ جنيه
🚚 التوصيل مجانًا في مصر الجديدة وشيراتون
لو عايز تكمل الطلب اكتب اطلب دلوقتي`,
            });
        } else if (text === "3") {
            await sock.sendMessage(from, {
                text: `للتواصل:
+20 121 177 1417
+20 122 963 4467
+20 120 047 0719
📍 كنيسة مارجرجس والأنبا إبرام هليوبوليس`,
            });
        } else if (text === "order") {
            await sock.sendMessage(from, {
                text: "🛒 اكتب كود الشكل (من هنا): https://bit.ly/beddy-dynamo",
            });
        } else if (text === "للطلب" || text === "4") {
            await sock.sendMessage(from, {
                text: "🛒 اكتب كود الشكل (من هنا): https://bit.ly/beddy-dynamo",
            });
        } else if (/^(p(0[1-9]|[1-6][0-9]|7[0-3])|c0[1-9]|k0[1-9]|k1[0-4])$/i.test(text.replace(/\s+/g, ""))) {
            await sock.sendMessage(from, { text: "اختار المقاس المطلوب: 120 - 140 - 160 - 180" });
        } else if (["120", "140", "160", "180"].includes(text.replace(/\s+/g, ""))) {
            await sock.sendMessage(from, { text: "من فضلك رقم الموبايل للتواصل" });
        } else if (/^\d{11}$/.test(text.replace(/\s+/g, ""))) {
            await sock.sendMessage(from, {
                text: `شكراً جدًا لطلبك معانا ❤️\nأوردر حضرتك اتسجل و في حد من افراد الرهط هيتواصل معاك لتأكيد الاوردر و البيانات✅\nوهيوصلك الاوردر خلال 10 أيام 🚚 \nلو في أي استفسار تقدر ترد في أي وقت.\nرهط الدينامو ⚡ / Beddy`
            });
        }
    });
}

startBot();

// Simple HTTP server for Railway
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WhatsApp bot is running!\n");
}).listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
