const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "mercedeslobeto@gmail.com" },
    include: {
      tenant: {
        include: { subscriptions: true },
      },
    },
  });

  if (!user) {
    console.log("Usuario no encontrado");
    return;
  }

  console.log("Tenant:", user.tenant.id, user.tenant.name);
  console.log("Subscriptions:", JSON.stringify(user.tenant.subscriptions, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
