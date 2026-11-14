const prisma = require('../config/prisma');
const { buildTripSeatInventory } = require('../utils/tripPricing');

async function seedDailyTrips() {
  console.log('[DailyTrips] Generating daily trips for all active routes...');
  const routes = await prisma.route.findMany({ where: { isActive: true } });
  const buses = await prisma.bus.findMany({
    where: { isActive: true },
    include: { seats: true },
  });

  if (!routes.length || !buses.length) {
    console.log('[DailyTrips] No routes or buses found');
    return;
  }

  const baseFares = {
    'Delhi-Jaipur': 599, 'Jaipur-Delhi': 599,
    'Mumbai-Pune': 399, 'Pune-Mumbai': 399,
    'Bangalore-Chennai': 649, 'Chennai-Bangalore': 649,
    'Delhi-Chandigarh': 499, 'Chandigarh-Delhi': 499,
    'Jaipur-Agra': 449, 'Agra-Jaipur': 449,
    'Udaipur-Ahmedabad': 499, 'Ahmedabad-Udaipur': 499,
    'Ahmedabad-Mumbai': 899, 'Mumbai-Ahmedabad': 899,
    'Delhi-Lucknow': 899, 'Lucknow-Delhi': 899,
    'Delhi-Manali': 1299, 'Manali-Delhi': 1299,
    'Pune-Goa': 999, 'Goa-Pune': 999,
    'Bangalore-Hyderabad': 1099, 'Hyderabad-Bangalore': 1099,
    'Agra-Delhi': 462, 'Delhi-Agra': 462,
    'Mumbai-Goa': 1199, 'Goa-Mumbai': 1199,
    'Ahmedabad-Udaipur': 572, 'Udaipur-Ahmedabad': 572,
  };

  const schedules = [
    { hour: 7, minute: 30, busOffset: 0 },
    { hour: 14, minute: 15, busOffset: 1 },
    { hour: 21, minute: 45, busOffset: 2 },
  ];

  const now = new Date();
  let createdTripsCount = 0;
  let createdSeatsCount = 0;

  // Schedule for -2 days to +14 days (17 days total)
  for (let dayOffset = -2; dayOffset <= 14; dayOffset++) {
    const targetDate = new Date(now.getTime());
    targetDate.setDate(now.getDate() + dayOffset);

    const y = targetDate.getUTCFullYear();
    const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getUTCDate()).padStart(2, '0');
    const dayPrefix = `${y}-${m}-${d}`;

    const dayStart = new Date(`${dayPrefix}T00:00:00.000Z`);
    const dayEnd = new Date(`${dayPrefix}T23:59:59.999Z`);

    for (let rIdx = 0; rIdx < routes.length; rIdx++) {
      const route = routes[rIdx];

      // Check if trips already exist for this route on this day
      const existing = await prisma.trip.count({
        where: {
          routeId: route.id,
          departureTime: { gte: dayStart, lte: dayEnd },
        },
      });

      if (existing >= 2) {
        // Route already has 2+ trips on this day
        continue;
      }

      const routeKey = `${route.sourceCity}-${route.destinationCity}`;
      const baseFare = baseFares[routeKey] || Math.round(Number(route.distanceKm) * 2.2);

      for (let sIdx = 0; sIdx < schedules.length; sIdx++) {
        const sched = schedules[sIdx];
        const bus = buses[(rIdx * 3 + sched.busOffset) % buses.length];

        const departureTime = new Date(dayStart.getTime());
        departureTime.setUTCHours(sched.hour, sched.minute, 0, 0);

        const arrivalTime = new Date(departureTime.getTime() + route.estimatedMinutes * 60 * 1000);

        let status = 'SCHEDULED';
        if (departureTime < now) {
          status = arrivalTime < now ? 'COMPLETED' : 'RUNNING';
        }

        const trip = await prisma.trip.create({
          data: {
            routeId: route.id,
            busId: bus.id,
            departureTime,
            arrivalTime,
            baseFare,
            status,
          },
        });
        createdTripsCount++;

        const tripSeats = buildTripSeatInventory(trip.id, bus.seats, baseFare);
        if (tripSeats.length > 0) {
          await prisma.tripSeat.createMany({ data: tripSeats });
          createdSeatsCount += tripSeats.length;
        }
      }
    }
  }

  console.log(`[DailyTrips] Created ${createdTripsCount} daily trips with ${createdSeatsCount} trip seats across all routes.`);
}

seedDailyTrips()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[DailyTrips] Error:', err);
    process.exit(1);
  });
