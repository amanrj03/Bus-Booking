/**
 * Generates physical seat layout templates for a Bus
 *
 * @param {string} busId
 * @param {'AC_SLEEPER_2X1' | 'AC_SEATER_2X2' | 'NON_AC_SEATER_2X2'} busType
 * @param {number} [customRows]
 * @returns {Array<{
 *   busId: string,
 *   seatNumber: string,
 *   deck: number,
 *   row: number,
 *   column: number,
 *   seatType: 'WINDOW' | 'AISLE' | 'MIDDLE' | 'SLEEPER',
 *   isAccessible: boolean
 * }>}
 */
function generateBusSeats(busId, busType, customRows) {
  const seats = [];

  if (busType === 'AC_SLEEPER_2X1') {
    const rowsPerDeck = customRows || 6; // 6 rows * 3 seats * 2 decks = 36 seats
    for (let deck = 1; deck <= 2; deck++) {
      const prefix = deck === 1 ? 'L' : 'U';
      for (let row = 1; row <= rowsPerDeck; row++) {
        seats.push(
          {
            busId,
            seatNumber: `${prefix}${row}A`,
            deck,
            row,
            column: 1,
            seatType: 'SLEEPER',
            isAccessible: deck === 1 && row === 1,
          },
          {
            busId,
            seatNumber: `${prefix}${row}B`,
            deck,
            row,
            column: 2,
            seatType: 'AISLE',
            isAccessible: false,
          },
          {
            busId,
            seatNumber: `${prefix}${row}C`,
            deck,
            row,
            column: 3,
            seatType: 'WINDOW',
            isAccessible: false,
          }
        );
      }
    }
    return seats;
  }

  // Standard 2x2 Coach Seater layout
  const rows = customRows || 10; // 10 rows * 4 seats = 40 seats
  for (let row = 1; row <= rows; row++) {
    seats.push(
      {
        busId,
        seatNumber: `${row}A`,
        deck: 1,
        row,
        column: 1,
        seatType: 'WINDOW',
        isAccessible: row === 1,
      },
      {
        busId,
        seatNumber: `${row}B`,
        deck: 1,
        row,
        column: 2,
        seatType: 'AISLE',
        isAccessible: row === 1,
      },
      {
        busId,
        seatNumber: `${row}C`,
        deck: 1,
        row,
        column: 3,
        seatType: 'AISLE',
        isAccessible: false,
      },
      {
        busId,
        seatNumber: `${row}D`,
        deck: 1,
        row,
        column: 4,
        seatType: 'WINDOW',
        isAccessible: false,
      }
    );
  }

  return seats;
}

module.exports = {
  generateBusSeats,
};
