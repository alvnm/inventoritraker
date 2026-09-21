// Equivalencias estándar de D&D 5e en cobres (CP):
// 1 PP = 10 GP = 2 EP = 50 SP = 500 CP
const CP = {
  PLATINUM: 500,
  GOLD: 100,
  ELECTRUM: 50,
  SILVER: 10,
  COPPER: 1,
};

function toCopper(c) {
  return (
    (c.platinum || 0) * CP.PLATINUM +
    (c.gold || 0) * CP.GOLD +
    (c.electrum || 0) * CP.ELECTRUM +
    (c.silver || 0) * CP.SILVER +
    (c.copper || 0) * CP.COPPER
  );
}

module.exports = { CP, toCopper };
