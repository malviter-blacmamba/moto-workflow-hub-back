import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";

async function main() {
    const ADMIN_EMAIL = "admin@moto.local";
    const ADMIN_PASSWORD = "admin123";

    const existing = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
    });

    if (existing) {
        console.log(`✅ Admin ya existe con email: ${ADMIN_EMAIL}`);
        return;
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const user = await prisma.user.create({
        data: {
            name: "Admin Principal",
            email: ADMIN_EMAIL,
            password: hash,
            role: "ADMIN",
            status: "ACTIVE",
        },
    });

    console.log("✅ Admin creado:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
}

main()
    .catch((err) => {
        console.error("❌ Error en seed-admin:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
