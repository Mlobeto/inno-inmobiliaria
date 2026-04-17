require("dotenv").config();
const prisma = require("./src/utils/prismaClient");

async function main() {
  // Buscar el usuario por email en admins o en tenants directamente
  const tenant = await prisma.tenants.findFirst({
    where: {
      OR: [
        { email: "mercedeslobeto@gmail.com" },
        { admins: { some: { email: "mercedeslobeto@gmail.com" } } },
      ],
    },
    include: { subscriptions: true, admins: true },
  });

  if (!tenant) {
    console.log("Tenant no encontrado");
    return;
  }

  console.log("Tenant:", tenant.id, tenant.name, tenant.email);
  console.log("Subscriptions:", JSON.stringify(tenant.subscriptions, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
