import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Fetch 30d Sales & Orders
  const recentOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      status: { not: "CANCELLED" },
    },
    select: { total: true },
  });

  const thirtyDayGrossSales = recentOrders.reduce((sum, order) => sum + order.total, 0);
  const thirtyDayOrderCount = recentOrders.length;

  // 2. Fetch "In Production" metrics
  const inProductionCount = await prisma.order.count({
    where: { status: "IN_PRODUCTION" },
  });
  const inQcCount = await prisma.order.count({
    where: { status: "QUALITY_CHECK" },
  });

  // 3. Fetch Total Customers instead of stock
  const customerCount = await prisma.user.count({
    where: { role: "USER" },
  });

  // 4. Fetch the 5 most recent orders
  const recentDbOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      customerFirstName: true,
      customerLastName: true,
      customerEmail: true,
      total: true,
      currency: true,
      status: true,
    },
  });

  const recent = recentDbOrders.map((o: any) => ({
    id: o.id,
    number: o.orderNumber,
    customer: o.customerFirstName ? `${o.customerFirstName} ${o.customerLastName || ""}`.trim() : o.customerEmail,
    total: o.total,
    currency: o.currency,
    status: o.status,
  }));

  // 5. Fetch Production Board Aggregates
  const statusCounts = await prisma.order.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const boardMap = statusCounts.reduce((acc: any, curr: any) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {} as Record<string, number>);

  const board = {
    DESIGN_RECEIVED: boardMap["DESIGN_RECEIVED"] || 0,
    IN_PRODUCTION: boardMap["IN_PRODUCTION"] || 0,
    QUALITY_CHECK: boardMap["QUALITY_CHECK"] || 0,
    READY_TO_SHIP: boardMap["READY_TO_SHIP"] || 0,
    SHIPPED: boardMap["SHIPPED"] || 0,
  };

  return {
    kpis: {
      thirtyDayGrossSales,
      thirtyDayOrderCount,
      inProductionCount,
      inQcCount,
      customerCount,
    },
    recent,
    board
  };
}
