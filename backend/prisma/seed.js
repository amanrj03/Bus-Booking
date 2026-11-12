/**
 * Large-Scale Deterministic Seed Script for Bus Booking Management System
 * Seeds realistic Indian intercity routes, operators, buses, seats, trips, bookings,
 * cancellations, simulated payments, and audit logs.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper to chunk arrays for batch creation
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Random helper with deterministic seed sequence
function createRandom(seed = 42) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

async function main() {
  console.log('[Seed] Starting database seeding...');
  const startTime = Date.now();
  const rng = createRandom(1710);

  // 1. Clean existing records in reverse dependency order
  console.log('[Seed] Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.cancellation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingSeat.deleteMany();
  await prisma.bookingPassenger.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.tripSeat.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.routeStop.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.user.deleteMany();
  console.log('[Seed] Cleaned database.');

  // Pre-hash default demo password
  const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

  // 2. Seed Admin Users
  console.log('[Seed] Seeding Admin users...');
  const adminUsersData = [
    {
      name: 'System Administrator',
      email: 'admin@busbooking.local',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      phone: '+91 9811001100',
    },
    {
      name: 'Super Administrator',
      email: 'superadmin@busbooking.local',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      phone: '+91 9811001101',
    },
  ];
  await prisma.user.createMany({ data: adminUsersData });
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@busbooking.local' } });

  // 3. Seed Operators & Operator Users
  console.log('[Seed] Seeding Operators & Fleet managers...');
  const operatorDefs = [
    { name: 'Zingbus Express', email: 'zingbus@busbooking.local', phone: '+91 9820011001' },
    { name: 'IntrCity SmartBus', email: 'intrcity@busbooking.local', phone: '+91 9820011002' },
    { name: 'Orange Travels', email: 'orange@busbooking.local', phone: '+91 9820011003' },
    { name: 'VRL Travels', email: 'vrl@busbooking.local', phone: '+91 9820011004' },
    { name: 'Shrinath Travels', email: 'shrinath@busbooking.local', phone: '+91 9820011005' },
    { name: 'Neeta Travels', email: 'neeta@busbooking.local', phone: '+91 9820011006' },
    { name: 'Purple Bus', email: 'purple@busbooking.local', phone: '+91 9820011007' },
    { name: 'Patel Tours', email: 'patel@busbooking.local', phone: '+91 9820011008' },
    { name: 'Greenline Travels', email: 'greenline@busbooking.local', phone: '+91 9820011009' },
    { name: 'Hans Travels', email: 'hans@busbooking.local', phone: '+91 9820011010' },
  ];

  const operators = [];
  for (const op of operatorDefs) {
    const user = await prisma.user.create({
      data: {
        name: `${op.name} Manager`,
        email: op.email,
        passwordHash: defaultPasswordHash,
        role: 'OPERATOR',
        phone: op.phone,
      },
    });

    const operator = await prisma.operator.create({
      data: {
        userId: user.id,
        name: op.name,
        companyName: `${op.name} Pvt Ltd`,
        contactEmail: op.email,
        contactPhone: op.phone,
        logoUrl: `https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&auto=format&fit=crop&q=60`,
      },
    });
    operators.push(operator);
  }

  // 4. Seed Passenger Users (180 realistic passenger profiles)
  console.log('[Seed] Seeding 180 Passengers...');
  const firstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Pooja', 'Rohan', 'Ananya', 'Suresh', 'Kavita', 'Manish', 'Neha', 'Deepak', 'Divya', 'Sanjay', 'Meera', 'Alok', 'Ritu', 'Gaurav', 'Swati', 'Rajesh', 'Shweta', 'Nikhil', 'Tanvi', 'Abhishek', 'Sunita', 'Arjun', 'Simran', 'Karthik', 'Aishwarya'];
  const lastNames = ['Sharma', 'Verma', 'Patel', 'Singh', 'Gupta', 'Iyer', 'Reddy', 'Chopra', 'Jain', 'Mehta', 'Nair', 'Malhotra', 'Bose', 'Rao', 'Bhatia', 'Deshmukh', 'Yadav', 'Mishra', 'Agarwal', 'Shah'];

  const passengersData = [
    {
      name: 'Primary Demo Passenger',
      email: 'passenger@busbooking.local',
      passwordHash: defaultPasswordHash,
      role: 'PASSENGER',
      phone: '+91 9876543210',
    },
    {
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      passwordHash: defaultPasswordHash,
      role: 'PASSENGER',
      phone: '+91 9876543211',
    },
  ];

  for (let i = 1; i <= 178; i++) {
    const fn = firstNames[Math.floor(rng() * firstNames.length)];
    const ln = lastNames[Math.floor(rng() * lastNames.length)];
    passengersData.push({
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`,
      passwordHash: defaultPasswordHash,
      role: 'PASSENGER',
      phone: `+91 98${Math.floor(10000000 + rng() * 90000000)}`,
    });
  }

  await prisma.user.createMany({ data: passengersData });
  const allPassengers = await prisma.user.findMany({ where: { role: 'PASSENGER' } });
  console.log(`[Seed] Seeded ${allPassengers.length} passengers.`);

  // 5. Seed Buses (45 Buses across 10 operators)
  console.log('[Seed] Seeding 45 Buses with physical seat layouts...');
  const busTypes = ['AC_SEATER_2X2', 'AC_SLEEPER_2X1', 'NON_AC_SEATER_2X2'];
  const rtoCodes = ['DL-01-AB', 'RJ-14-PA', 'MH-12-QX', 'KA-01-TR', 'GJ-01-ZX', 'UP-32-BZ', 'HR-26-TY', 'MP-09-RT'];
  const buses = [];
  const seatsData = [];

  for (let i = 1; i <= 45; i++) {
    const operator = operators[(i - 1) % operators.length];
    const bType = busTypes[(i - 1) % busTypes.length];
    const rto = rtoCodes[(i - 1) % rtoCodes.length];
    const busNumber = `${rto}-${1000 + i}`;
    const totalSeats = bType === 'AC_SLEEPER_2X1' ? 36 : 40;

    const bus = await prisma.bus.create({
      data: {
        operatorId: operator.id,
        busNumber,
        busType: bType,
        totalSeats,
        deckCount: bType === 'AC_SLEEPER_2X1' ? 2 : 1,
        amenities: {
          wifi: true,
          chargingPort: true,
          waterBottle: bType.startsWith('AC'),
          blanket: bType === 'AC_SLEEPER_2X1',
          gpsTracking: true,
          emergencyContact: true,
        },
      },
    });
    buses.push(bus);

    // Generate physical seats layout
    if (bType === 'AC_SLEEPER_2X1') {
      // 2 decks, 6 rows, 3 per row (1 Single A, 2 Double B & C)
      for (let deck = 1; deck <= 2; deck++) {
        const deckPrefix = deck === 1 ? 'L' : 'U';
        for (let row = 1; row <= 6; row++) {
          seatsData.push({
            busId: bus.id,
            seatNumber: `${deckPrefix}${row}A`,
            deck,
            row,
            column: 1,
            seatType: 'SLEEPER',
            isAccessible: row === 1,
          });
          seatsData.push({
            busId: bus.id,
            seatNumber: `${deckPrefix}${row}B`,
            deck,
            row,
            column: 2,
            seatType: 'AISLE',
            isAccessible: false,
          });
          seatsData.push({
            busId: bus.id,
            seatNumber: `${deckPrefix}${row}C`,
            deck,
            row,
            column: 3,
            seatType: 'WINDOW',
            isAccessible: false,
          });
        }
      }
    } else {
      // 2x2 Seater: 10 rows, 4 seats per row (A, B aisle C, D)
      for (let row = 1; row <= 10; row++) {
        seatsData.push({
          busId: bus.id,
          seatNumber: `${row}A`,
          deck: 1,
          row,
          column: 1,
          seatType: 'WINDOW',
          isAccessible: row === 1,
        });
        seatsData.push({
          busId: bus.id,
          seatNumber: `${row}B`,
          deck: 1,
          row,
          column: 2,
          seatType: 'AISLE',
          isAccessible: row === 1,
        });
        seatsData.push({
          busId: bus.id,
          seatNumber: `${row}C`,
          deck: 1,
          row,
          column: 3,
          seatType: 'AISLE',
          isAccessible: false,
        });
        seatsData.push({
          busId: bus.id,
          seatNumber: `${row}D`,
          deck: 1,
          row,
          column: 4,
          seatType: 'WINDOW',
          isAccessible: false,
        });
      }
    }
  }

  // Insert physical seats in batches
  for (const chunk of chunkArray(seatsData, 1000)) {
    await prisma.seat.createMany({ data: chunk });
  }
  console.log(`[Seed] Seeded ${buses.length} buses and ${seatsData.length} physical seats.`);

  // 6. Seed Indian Cities & Major Stops (75 Stops)
  console.log('[Seed] Seeding 75 Stops across major Indian cities...');
  const cityStopsMap = {
    'Delhi': [
      { name: 'Kashmiri Gate ISBT', landmark: 'Metro Gate 1', address: 'Interstate Bus Terminal, Ring Road' },
      { name: 'Dhaula Kuan', landmark: 'Dhaula Kuan Metro Station', address: 'Ring Road Footover Bridge' },
      { name: 'Anand Vihar ISBT', landmark: 'Railway Station Bypass', address: 'East Delhi Bus Terminal' },
      { name: 'IFFCO Chowk Gurgaon', landmark: 'Flyover Pillar 45', address: 'MG Road, Sector 29' },
    ],
    'Jaipur': [
      { name: 'Sindhi Camp Central Bus Stand', landmark: 'Platform 3', address: 'Station Road, Sindhi Camp' },
      { name: 'Narayan Singh Circle', landmark: 'City Plaza', address: 'Agra Road Crossing' },
      { name: '200 Feet Bypass', landmark: 'Heerapura Flyover', address: 'Ajmer Road Bypass' },
      { name: 'Transport Nagar', landmark: 'Tunnel Entry', address: 'Delhi-Jaipur Highway Entry' },
    ],
    'Agra': [
      { name: 'Idgah Bus Stand', landmark: 'Near Railway Station', address: 'Idgah Colony' },
      { name: 'Water Works Crossing', landmark: 'Yamuna Expressway Cut', address: 'National Highway 19' },
    ],
    'Chandigarh': [
      { name: 'Sector 43 ISBT', landmark: 'Bay 12', address: 'Sector 43 Inter State Bus Terminal' },
      { name: 'Tribune Chowk', landmark: 'Flyover Underpass', address: 'Dakshin Marg' },
      { name: 'Mohali Phase 7', landmark: 'Near Gurudwara', address: 'Kharar Bypass' },
    ],
    'Manali': [
      { name: 'Private Bus Stand Manali', landmark: 'Near Mall Road', address: 'Circuit House Road' },
      { name: 'Kullu Bypass', landmark: 'Hotel Sarvari Chowk', address: 'NH 3, Kullu' },
    ],
    'Shimla': [
      { name: 'ISBT Tutikandi Shimla', landmark: 'New Bus Stand', address: 'Circular Road, Tutikandi' },
      { name: 'Victory Tunnel', landmark: 'Old Bus Stand', address: 'The Mall Shimla Approach' },
    ],
    'Udaipur': [
      { name: 'Udiapole Bus Stand', landmark: 'Hotel Paras Front', address: 'City Station Road' },
      { name: 'Reti Stand', landmark: 'Near Chetak Circle', address: 'Saheli Marg' },
      { name: 'Bhuwana Bypass', landmark: 'Sukher Highway Cut', address: 'NH 8 Bypass' },
    ],
    'Ahmedabad': [
      { name: 'Paldi Cross Roads', landmark: 'Near Museum', address: 'Shroff Chambers, Paldi' },
      { name: 'Geeta Mandir Central Stand', landmark: 'ST Stand', address: 'Swami Vivekananda Road' },
      { name: 'CTM Char Rasta', landmark: 'Expressway Entry', address: 'National Highway 48' },
      { name: 'Iscon Cross Road', landmark: 'Bopal Approach', address: 'SG Highway' },
    ],
    'Mumbai': [
      { name: 'Borivali East', landmark: 'National Park Gate', address: 'Western Express Highway' },
      { name: 'Dadar Central TT', landmark: 'Asiad Bus Stand', address: 'Dr. Babasaheb Ambedkar Road' },
      { name: 'Vashi Highway Toll', landmark: 'Near Plaza', address: 'Sion-Panvel Highway' },
      { name: 'Chembur', landmark: 'Maitri Park Bus Stop', address: 'Sion-Trombay Road' },
    ],
    'Pune': [
      { name: 'Wakad Bridge', landmark: 'Hinjewadi Flyover', address: 'Mumbai-Pune Expressway Bypass' },
      { name: 'Swargate Bus Terminal', landmark: 'Jedhe Chowk', address: 'Shivaji Road' },
      { name: 'Pune Station', landmark: 'Opposite Inox', address: 'Station Road, Sangamwadi' },
      { name: 'Katraj Bypass', landmark: 'Wonderland Gate', address: 'Satara Highway Cut' },
    ],
    'Goa': [
      { name: 'Mapusa KTC Bus Stand', landmark: 'Near Market', address: 'KTC Bus Stand, Mapusa' },
      { name: 'Panaji KTC Stand', landmark: 'Mandovi River View', address: 'Patto Centre, Panaji' },
      { name: 'Madgaon KTC Stand', landmark: 'Railway Station Road', address: 'Margao City Centre' },
    ],
    'Bangalore': [
      { name: 'Majestic KBS', landmark: 'Opp City Railway Station', address: 'Kempegowda Bus Station' },
      { name: 'Silk Board Junction', landmark: 'Near Flyover', address: 'Hosur Road' },
      { name: 'Electronic City Toll', landmark: 'Phase 1 Elevated Expressway', address: 'Bangalore-Hosur Highway' },
      { name: 'Madiwala', landmark: 'St. John Hospital Signal', address: 'Maruthi Nagar Main Road' },
    ],
    'Chennai': [
      { name: 'Koyambedu CMBT', landmark: 'Platform 5', address: 'Chennai Mofussil Bus Terminus' },
      { name: 'Guindy Kathipara', landmark: 'Under Flyover', address: 'Grand Southern Trunk Road' },
      { name: 'Sriperumbudur Toll', landmark: 'Near Rajiv Gandhi Memorial', address: 'Bangalore-Chennai Highway' },
    ],
    'Hyderabad': [
      { name: 'MGBS Bus Stand', landmark: 'Imlibun Island', address: 'Mahatma Gandhi Bus Station' },
      { name: 'Ameerpet Cross Road', landmark: 'Metro Pillar 1042', address: 'NH 65' },
      { name: 'Gachibowli ORR', landmark: 'Near Stadium', address: 'Outer Ring Road Junction' },
    ],
    'Lucknow': [
      { name: 'Alambagh ISBT', landmark: 'Metro Station Gate 2', address: 'Kanpur Road, Alambagh' },
      { name: 'Charbagh', landmark: 'Railway Station Front', address: 'Station Road' },
    ],
    'Jodhpur': [
      { name: 'Paota Bus Stand', landmark: 'Paota Circle', address: 'Mandore Road' },
      { name: 'Railway Station Road', landmark: 'Ratanada Circle', address: 'Station Road' },
    ],
  };

  const stopRecords = [];
  for (const [city, stops] of Object.entries(cityStopsMap)) {
    for (const s of stops) {
      stopRecords.push({
        city,
        stationName: s.name,
        landmark: s.landmark,
        address: s.address,
      });
    }
  }

  await prisma.stop.createMany({ data: stopRecords });
  const allStops = await prisma.stop.findMany();
  console.log(`[Seed] Seeded ${allStops.length} stops.`);

  // Helper map for fast stop lookup by city
  const cityStopsLookup = {};
  for (const s of allStops) {
    if (!cityStopsLookup[s.city]) cityStopsLookup[s.city] = [];
    cityStopsLookup[s.city].push(s);
  }

  // 7. Seed 35 High-Density Routes
  console.log('[Seed] Seeding 35 Indian Intercity Routes and intermediate stops...');
  const routeConfigs = [
    { from: 'Delhi', to: 'Jaipur', dist: 280, mins: 330 },
    { from: 'Jaipur', to: 'Delhi', dist: 280, mins: 330 },
    { from: 'Mumbai', to: 'Pune', dist: 150, mins: 225 },
    { from: 'Pune', to: 'Mumbai', dist: 150, mins: 225 },
    { from: 'Bangalore', to: 'Chennai', dist: 350, mins: 375 },
    { from: 'Chennai', to: 'Bangalore', dist: 350, mins: 375 },
    { from: 'Delhi', to: 'Chandigarh', dist: 250, mins: 300 },
    { from: 'Chandigarh', to: 'Delhi', dist: 250, mins: 300 },
    { from: 'Jaipur', to: 'Agra', dist: 240, mins: 270 },
    { from: 'Agra', to: 'Jaipur', dist: 240, mins: 270 },
    { from: 'Udaipur', to: 'Ahmedabad', dist: 260, mins: 300 },
    { from: 'Ahmedabad', to: 'Udaipur', dist: 260, mins: 300 },
    { from: 'Ahmedabad', to: 'Mumbai', dist: 530, mins: 570 },
    { from: 'Mumbai', to: 'Ahmedabad', dist: 530, mins: 570 },
    { from: 'Delhi', to: 'Lucknow', dist: 550, mins: 540 },
    { from: 'Lucknow', to: 'Delhi', dist: 550, mins: 540 },
    { from: 'Jaipur', to: 'Jodhpur', dist: 330, mins: 360 },
    { from: 'Jodhpur', to: 'Jaipur', dist: 330, mins: 360 },
    { from: 'Chandigarh', to: 'Shimla', dist: 115, mins: 210 },
    { from: 'Shimla', to: 'Chandigarh', dist: 115, mins: 210 },
    { from: 'Pune', to: 'Goa', dist: 450, mins: 580 },
    { from: 'Goa', to: 'Pune', dist: 450, mins: 580 },
    { from: 'Delhi', to: 'Manali', dist: 535, mins: 750 },
    { from: 'Manali', to: 'Delhi', dist: 535, mins: 750 },
    { from: 'Bangalore', to: 'Hyderabad', dist: 570, mins: 540 },
    { from: 'Hyderabad', to: 'Bangalore', dist: 570, mins: 540 },
    { from: 'Mumbai', to: 'Goa', dist: 580, mins: 660 },
    { from: 'Goa', to: 'Mumbai', dist: 580, mins: 660 },
    { from: 'Jaipur', to: 'Udaipur', dist: 390, mins: 420 },
    { from: 'Udaipur', to: 'Jaipur', dist: 390, mins: 420 },
    { from: 'Delhi', to: 'Agra', dist: 210, mins: 240 },
    { from: 'Agra', to: 'Delhi', dist: 210, mins: 240 },
    { from: 'Chandigarh', to: 'Manali', dist: 310, mins: 480 },
    { from: 'Manali', to: 'Chandigarh', dist: 310, mins: 480 },
    { from: 'Pune', to: 'Bangalore', dist: 840, mins: 840 },
  ];

  const routes = [];
  const routeStopsData = [];

  for (const rc of routeConfigs) {
    const route = await prisma.route.create({
      data: {
        sourceCity: rc.from,
        destinationCity: rc.to,
        distanceKm: rc.dist,
        estimatedMinutes: rc.mins,
        isActive: true,
      },
    });
    routes.push(route);

    // Pick boarding and dropping stops for this route
    const fromStops = cityStopsLookup[rc.from] || [];
    const toStops = cityStopsLookup[rc.to] || [];

    let order = 1;
    // Boarding stops (offset 0 to 45 mins)
    for (let idx = 0; idx < fromStops.length; idx++) {
      routeStopsData.push({
        routeId: route.id,
        stopId: fromStops[idx].id,
        stopOrder: order++,
        durationFromOriginMinutes: idx * 25,
        distanceFromOriginKm: idx * 12,
      });
    }
    // Dropping stops (near arrival time)
    for (let idx = 0; idx < toStops.length; idx++) {
      routeStopsData.push({
        routeId: route.id,
        stopId: toStops[idx].id,
        stopOrder: order++,
        durationFromOriginMinutes: Math.max(0, rc.mins - (toStops.length - idx - 1) * 20),
        distanceFromOriginKm: Math.max(0, rc.dist - (toStops.length - idx - 1) * 10),
      });
    }
  }

  await prisma.routeStop.createMany({ data: routeStopsData });
  console.log(`[Seed] Seeded ${routes.length} routes with ${routeStopsData.length} route stops.`);

  // 8. Seed 250 Scheduled Trips across past 30 days & upcoming 14 days
  console.log('[Seed] Seeding 250 Trips with live TripSeat inventory...');
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
  };

  const trips = [];
  const now = new Date();
  const departureHours = [6, 8, 11, 14, 17, 20, 22, 23];

  for (let i = 1; i <= 250; i++) {
    const route = routes[(i - 1) % routes.length];
    const bus = buses[(i - 1) % buses.length];

    // Day offset: -25 to +14 days relative to now
    const dayOffset = -25 + (i % 40);
    const depHour = departureHours[i % departureHours.length];
    const depMinute = (i * 15) % 60;

    const departureTime = new Date(now.getTime());
    departureTime.setDate(now.getDate() + dayOffset);
    departureTime.setHours(depHour, depMinute, 0, 0);

    const arrivalTime = new Date(departureTime.getTime() + route.estimatedMinutes * 60 * 1000);

    const routeKey = `${route.sourceCity}-${route.destinationCity}`;
    const baseFare = baseFares[routeKey] || Math.round(Number(route.distanceKm) * 2.2);

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
    trips.push({ trip, bus, route, baseFare, isPast: departureTime < now });
  }

  // Pre-fetch all seats per bus
  const allPhysicalSeats = await prisma.seat.findMany();
  const seatsByBus = {};
  for (const s of allPhysicalSeats) {
    if (!seatsByBus[s.busId]) seatsByBus[s.busId] = [];
    seatsByBus[s.busId].push(s);
  }

  // Generate TripSeats for every scheduled trip
  console.log('[Seed] Generating ~9,500 TripSeat inventory items...');
  const tripSeatsToInsert = [];
  const tripSeatsByTrip = {};

  for (const { trip, bus, baseFare } of trips) {
    const busSeats = seatsByBus[bus.id] || [];
    tripSeatsByTrip[trip.id] = [];

    for (const s of busSeats) {
      // Dynamic pricing: Sleeper +150, Window +50
      let seatPrice = Number(baseFare);
      if (s.seatType === 'SLEEPER') seatPrice += 150;
      else if (s.seatType === 'WINDOW') seatPrice += 50;

      const tsItem = {
        tripId: trip.id,
        seatId: s.id,
        seatNumber: s.seatNumber,
        price: seatPrice,
        status: 'AVAILABLE',
      };
      tripSeatsToInsert.push(tsItem);
    }
  }

  for (const chunk of chunkArray(tripSeatsToInsert, 1000)) {
    await prisma.tripSeat.createMany({ data: chunk });
  }

  // Re-fetch trip seats indexed by tripId and seatNumber for fast booking assignment
  const allTripSeats = await prisma.tripSeat.findMany();
  const tripSeatMap = {}; // tripId -> seatNumber -> TripSeat
  for (const ts of allTripSeats) {
    if (!tripSeatMap[ts.tripId]) tripSeatMap[ts.tripId] = {};
    tripSeatMap[ts.tripId][ts.seatNumber] = ts;
  }
  console.log(`[Seed] Seeded ${allTripSeats.length} TripSeats.`);

  // 9. Seed 650 Bookings (575 Confirmed, 75 Cancelled), Payments & Passengers
  console.log('[Seed] Seeding 650 Bookings (Confirmed, Cancelled, and Refunds)...');
  const bookingRecords = [];
  const bookingPassengersData = [];
  const bookingSeatsData = [];
  const paymentsData = [];
  const cancellationsData = [];
  const auditLogsData = [];
  const tripSeatsToUpdate = []; // updates to set status = 'BOOKED' or 'AVAILABLE'

  let bookingCounter = 1000;

  for (let bIdx = 0; bIdx < 650; bIdx++) {
    bookingCounter++;
    // Distribute bookings across trips
    const tripObj = trips[bIdx % trips.length];
    const { trip, isPast } = tripObj;
    const passengerUser = allPassengers[bIdx % allPassengers.length];

    // Determine booking status: 75 cancellations spread out
    const isCancelled = bIdx >= 575;
    const bookingStatus = isCancelled ? 'CANCELLED' : 'CONFIRMED';

    // Unique PNR: e.g. FLX-DEL-2611-1001
    const pnr = `FLX-${tripObj.route.sourceCity.substring(0, 3).toUpperCase()}-2611-${bookingCounter}`;

    // Seats count for this booking (1 to 3 passengers)
    const partySize = (bIdx % 3) + 1;
    const busSeats = seatsByBus[tripObj.bus.id] || [];

    // Select available physical seats for this party
    const partySeatNumbers = [];
    const partyTripSeats = [];

    // Find seats that aren't already booked on this trip
    for (const ps of busSeats) {
      if (partySeatNumbers.length === partySize) break;
      const ts = tripSeatMap[trip.id]?.[ps.seatNumber];
      if (ts && ts.status === 'AVAILABLE') {
        partySeatNumbers.push(ps.seatNumber);
        partyTripSeats.push(ts);
        // Mark temporarily in local memory to prevent duplicate in seed
        ts.status = bookingStatus === 'CONFIRMED' ? 'BOOKED' : 'AVAILABLE';
      }
    }

    if (partySeatNumbers.length === 0) continue; // skip if trip is full

    const totalFare = partyTripSeats.reduce((acc, curr) => acc + Number(curr.price), 0);
    const bookingCreatedAt = new Date(trip.departureTime.getTime() - ((bIdx % 10) + 1) * 24 * 3600 * 1000);

    const booking = await prisma.booking.create({
      data: {
        pnr,
        userId: passengerUser.id,
        tripId: trip.id,
        totalAmount: totalFare,
        status: bookingStatus,
        contactEmail: passengerUser.email,
        contactPhone: passengerUser.phone,
        createdAt: bookingCreatedAt,
      },
    });

    // Create BookingPassengers and BookingSeats
    for (let pIndex = 0; pIndex < partySeatNumbers.length; pIndex++) {
      const sNum = partySeatNumbers[pIndex];
      const tSeat = partyTripSeats[pIndex];

      const bp = await prisma.bookingPassenger.create({
        data: {
          bookingId: booking.id,
          fullName: pIndex === 0 ? passengerUser.name : `Guest ${pIndex} ${passengerUser.name.split(' ')[1]}`,
          age: 24 + ((bIdx + pIndex) % 40),
          gender: (bIdx + pIndex) % 2 === 0 ? 'M' : 'F',
          seatNumber: sNum,
          createdAt: bookingCreatedAt,
        },
      });

      bookingSeatsData.push({
        bookingId: booking.id,
        passengerId: bp.id,
        tripSeatId: tSeat.id,
        seatNumber: sNum,
        seatPrice: tSeat.price,
        status: bookingStatus,
        createdAt: bookingCreatedAt,
      });

      // If booking is confirmed, update TripSeat status in DB
      if (bookingStatus === 'CONFIRMED') {
        tripSeatsToUpdate.push({ id: tSeat.id, status: 'BOOKED', currentBookingId: booking.id });
      }
    }

    // Payment Record
    const paymentMethods = ['UPI', 'NET_BANKING', 'DEBIT_CARD', 'CREDIT_CARD', 'WALLET'];
    const pMethod = paymentMethods[bIdx % paymentMethods.length];
    const txnRef = `TXN-SIM-${booking.pnr.replace(/[^0-9]/g, '')}-${bIdx}`;

    paymentsData.push({
      bookingId: booking.id,
      amount: totalFare,
      paymentMethod: pMethod,
      paymentStatus: isCancelled ? 'REFUNDED' : 'SUCCESS',
      transactionReference: txnRef,
      createdAt: bookingCreatedAt,
    });

    // Cancellation Record (if cancelled)
    if (isCancelled) {
      // Dynamic cancellation fee rule: 20% deduction, 80% refund
      const fee = Math.round(totalFare * 0.2);
      const refund = totalFare - fee;
      cancellationsData.push({
        bookingId: booking.id,
        cancellationFee: fee,
        refundAmount: refund,
        reason: (bIdx % 2 === 0) ? 'Change of travel plans' : 'Medical emergency',
        refundStatus: 'PROCESSED',
        createdAt: new Date(bookingCreatedAt.getTime() + 12 * 3600 * 1000),
      });

      auditLogsData.push({
        userId: passengerUser.id,
        action: 'BOOKING_CANCELLED',
        entity: 'Booking',
        entityId: booking.id,
        details: { pnr: booking.pnr, fee, refund },
        ipAddress: '127.0.0.1',
        createdAt: new Date(bookingCreatedAt.getTime() + 12 * 3600 * 1000),
      });
    }

    auditLogsData.push({
      userId: passengerUser.id,
      action: 'BOOKING_CREATED',
      entity: 'Booking',
      entityId: booking.id,
      details: { pnr: booking.pnr, seats: partySeatNumbers, totalAmount: totalFare },
      ipAddress: '127.0.0.1',
      createdAt: bookingCreatedAt,
    });
  }

  // Bulk insert booking seats and payments
  console.log('[Seed] Inserting BookingSeats, Payments, Cancellations and AuditLogs...');
  for (const chunk of chunkArray(bookingSeatsData, 1000)) {
    await prisma.bookingSeat.createMany({ data: chunk });
  }

  for (const chunk of chunkArray(paymentsData, 500)) {
    await prisma.payment.createMany({ data: chunk });
  }

  for (const chunk of chunkArray(cancellationsData, 200)) {
    await prisma.cancellation.createMany({ data: chunk });
  }

  // Update booked trip seats in database
  console.log(`[Seed] Updating ${tripSeatsToUpdate.length} booked TripSeats...`);
  for (const item of tripSeatsToUpdate) {
    await prisma.tripSeat.update({
      where: { id: item.id },
      data: { status: 'BOOKED', currentBookingId: item.currentBookingId },
    });
  }

  // Add Operational Audit Logs (Trip creation, Fleet registration)
  for (let i = 0; i < 75; i++) {
    const t = trips[i % trips.length];
    auditLogsData.push({
      userId: adminUser.id,
      action: 'TRIP_SCHEDULED',
      entity: 'Trip',
      entityId: t.trip.id,
      details: { route: `${t.route.sourceCity} -> ${t.route.destinationCity}`, departure: t.trip.departureTime },
      ipAddress: '127.0.0.1',
      createdAt: new Date(now.getTime() - (i + 1) * 18 * 3600 * 1000),
    });
  }

  for (const chunk of chunkArray(auditLogsData, 500)) {
    await prisma.auditLog.createMany({ data: chunk });
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n=============================================================`);
  console.log(`[Seed] SUCCESS! Database seeded in ${durationSec}s`);
  console.log(`- Admin Users: 2`);
  console.log(`- Operators: ${operators.length}`);
  console.log(`- Passengers: ${allPassengers.length}`);
  console.log(`- Buses: ${buses.length}`);
  console.log(`- Physical Seats: ${seatsData.length}`);
  console.log(`- Routes: ${routes.length}`);
  console.log(`- Stops: ${allStops.length}`);
  console.log(`- Scheduled Trips: ${trips.length}`);
  console.log(`- TripSeat Inventory: ${allTripSeats.length}`);
  console.log(`- Bookings: 650 (575 Confirmed, 75 Cancelled)`);
  console.log(`- Booking Seats: ${bookingSeatsData.length}`);
  console.log(`- Payments: ${paymentsData.length}`);
  console.log(`- Cancellations: ${cancellationsData.length}`);
  console.log(`- Audit Logs: ${auditLogsData.length}`);
  console.log(`=============================================================\n`);
}

main()
  .catch((e) => {
    console.error('[Seed] Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
