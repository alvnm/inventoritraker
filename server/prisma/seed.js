const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { ItemCategory, ItemRarity } = require('@prisma/client');

const library = [
  // ── Armas ──────────────────────────────────────────────
  { name: 'Espada larga', category: ItemCategory.WEAPONS, weight: 3, value: 15, rarity: ItemRarity.COMMON, equippable: true, description: 'Arma marcial a una mano, 1d8 cortante.' },
  { name: 'Espada corta', category: ItemCategory.WEAPONS, weight: 2, value: 10, rarity: ItemRarity.COMMON, equippable: true, description: 'Arma marcial ligera, 1d6 perforante.' },
  { name: 'Daga', category: ItemCategory.WEAPONS, weight: 1, value: 2, rarity: ItemRarity.COMMON, equippable: true, description: 'Arma sencilla ligera, 1d4 perforante. Puede lanzarse.' },
  { name: 'Arco largo', category: ItemCategory.WEAPONS, weight: 2, value: 50, rarity: ItemRarity.COMMON, equippable: true, description: 'Arma marcial a distancia, 1d8 perforante.' },
  { name: 'Arco corto', category: ItemCategory.WEAPONS, weight: 2, value: 25, rarity: ItemRarity.COMMON, equippable: true, description: 'Arma marcial a distancia, 1d6 perforante.' },
  { name: 'Ballesta ligera', category: ItemCategory.WEAPONS, weight: 5, value: 25, rarity: ItemRarity.COMMON, equippable: true, description: 'Arma marcial a distancia, 1d8 perforante.' },
  { name: 'Báculo', category: ItemCategory.WEAPONS, weight: 4, value: 2, rarity: ItemRarity.COMMON, equippable: true, description: 'Arma de lanzador, 1d6 contundente.' },
  { name: 'Maza', category: ItemCategory.WEAPONS, weight: 4, value: 5, rarity: ItemRarity.COMMON, equippable: true, description: 'Arma sencilla, 1d6 contundente.' },
  { name: 'Hacha de batalla', category: ItemCategory.WEAPONS, weight: 4, value: 10, rarity: ItemRarity.COMMON, equippable: true, description: 'Arma marcial, 1d8 cortante.' },
  { name: 'Martillo de guerra', category: ItemCategory.WEAPONS, weight: 2, value: 15, rarity: ItemRarity.COMMON, equippable: true, description: 'Arma marcial, 1d8 contundente.' },
  { name: 'Lanza', category: ItemCategory.WEAPONS, weight: 6, value: 1, rarity: ItemRarity.COMMON, equippable: true, description: 'Arma sencilla melee, 1d6 perforante.' },
  { name: 'Latigazo', category: ItemCategory.WEAPONS, weight: 3, value: 2, rarity: ItemRarity.COMMON, equippable: true, description: 'Arma sencilla, 1d4 cortante.' },
  { name: 'Guantes de piña', category: ItemCategory.WEAPONS, weight: 1, value: 1, rarity: ItemRarity.COMMON, equippable: true, description: 'Arma marcial ligera, 1d4 contundente.' },
  { name: 'Flechas (20)', category: ItemCategory.WEAPONS, weight: 1, value: 1, rarity: ItemRarity.COMMON, equippable: false, description: 'Munición para arcos.' },

  // ── Armaduras ──────────────────────────────────────────
  { name: 'Escudo', category: ItemCategory.ARMOR, weight: 6, value: 10, rarity: ItemRarity.COMMON, equippable: true, description: '+2 a la clase de armadura.' },
  { name: 'Armadura de cuero', category: ItemCategory.ARMOR, weight: 10, value: 10, rarity: ItemRarity.COMMON, equippable: true, description: 'CA 11 + mod. Destreza. Ligera.' },
  { name: 'Armadura de cuero tachonado', category: ItemCategory.ARMOR, weight: 13, value: 45, rarity: ItemRarity.COMMON, equippable: true, description: 'CA 12 + mod. Destreza. Ligera.' },
  { name: 'Cota de malla', category: ItemCategory.ARMOR, weight: 55, value: 75, rarity: ItemRarity.COMMON, equippable: true, description: 'CA 16, Des máx +2. Media.' },
  { name: 'Armadura de placas', category: ItemCategory.ARMOR, weight: 65, value: 1500, rarity: ItemRarity.COMMON, equippable: true, description: 'CA 18, Des máx 0. Pesada.' },
  { name: 'Gambesón', category: ItemCategory.ARMOR, weight: 8, value: 5, rarity: ItemRarity.COMMON, equippable: true, description: 'CA 11 + mod. Destreza (máx +2). Ligera.' },
  { name: 'Casco', category: ItemCategory.ARMOR, weight: 2, value: 5, rarity: ItemRarity.COMMON, equippable: false, description: 'Protección adicional para la cabeza.' },

  // ── Pociones ───────────────────────────────────────────
  { name: 'Poción de curación', category: ItemCategory.POTIONS, weight: 0.5, value: 50, rarity: ItemRarity.COMMON, equippable: false, description: 'Restaura 2d4 + 2 puntos de vida.' },
  { name: 'Poción de curación mayor', category: ItemCategory.POTIONS, weight: 0.5, value: 150, rarity: ItemRarity.UNCOMMON, equippable: false, description: 'Restaura 4d4 + 4 puntos de vida.' },
  { name: 'Poción de curación superior', category: ItemCategory.POTIONS, weight: 0.5, value: 450, rarity: ItemRarity.RARE, equippable: false, description: 'Restaura 8d4 + 8 puntos de vida.' },
  { name: 'Poción de invisibilidad', category: ItemCategory.POTIONS, weight: 0.5, value: 180, rarity: ItemRarity.VERY_RARE, equippable: false, description: 'Te vuelve invisible durante 1 hora.' },
  { name: 'Poción de fuerza de gigante de la colina', category: ItemCategory.POTIONS, weight: 0.5, value: 250, rarity: ItemRarity.UNCOMMON, equippable: false, description: 'Fuerza 21 durante 1 hora.' },
  { name: 'Aceite de afilar', category: ItemCategory.POTIONS, weight: 0.5, value: 25, rarity: ItemRarity.COMMON, equippable: false, description: '+1d4 al primer ataque con arma cortante.' },

  // ── Objetos mágicos ────────────────────────────────────
  { name: 'Anillo de protección +1', category: ItemCategory.MAGIC_ITEMS, weight: 0, value: 3500, rarity: ItemRarity.RARE, equippable: true, description: '+1 a CA y tiradas de salvación.' },
  { name: 'Capa de elfo', category: ItemCategory.MAGIC_ITEMS, weight: 1, value: 2500, rarity: ItemRarity.UNCOMMON, equippable: true, description: 'Ventaja en sigilo; mejoras al ocultarte.' },
  { name: 'Varita de misiles mágicos', category: ItemCategory.MAGIC_ITEMS, weight: 0.2, value: 800, rarity: ItemRarity.UNCOMMON, equippable: true, description: 'Lanza misiles mágicos (7 cargas).' },
  { name: 'Piedra de zahorí', category: ItemCategory.MAGIC_ITEMS, weight: 0.5, value: 500, rarity: ItemRarity.UNCOMMON, equippable: false, description: 'Detecta agua, metales y tesoros cercanos.' },
  { name: 'Pergamino de bolas de fuego', category: ItemCategory.MAGIC_ITEMS, weight: 0.1, value: 500, rarity: ItemRarity.RARE, equippable: false, description: 'Pergamino con el conjuro bola de fuego (nivel 3).' },
  { name: 'Bolsa sin fondo', category: ItemCategory.MAGIC_ITEMS, weight: 1, value: 3000, rarity: ItemRarity.RARE, equippable: false, description: 'Interior más grande que el exterior.' },

  // ── Herramientas ───────────────────────────────────────
  { name: 'Herramientas de ladrón', category: ItemCategory.TOOLS, weight: 1, value: 25, rarity: ItemRarity.COMMON, equippable: false, description: 'Para abrir cerraduras y desactivar trampas.' },
  { name: 'Herramientas de herrero', category: ItemCategory.TOOLS, weight: 8, value: 20, rarity: ItemRarity.COMMON, equippable: false, description: 'Para forjar y reparar metal.' },
  { name: 'Kit de Herbolaria', category: ItemCategory.TOOLS, weight: 3, value: 5, rarity: ItemRarity.COMMON, equippable: false, description: 'Para identificar y preparar plantas.' },
  { name: 'Kit de navegación', category: ItemCategory.TOOLS, weight: 2, value: 25, rarity: ItemRarity.COMMON, equippable: false, description: 'Sextante, mapas y compás.' },
  { name: 'Kit de médico', category: ItemCategory.TOOLS, weight: 3, value: 5, rarity: ItemRarity.COMMON, equippable: false, description: 'Estabiliza moribundos automáticamente.' },
  { name: 'Cuerda (50 pies)', category: ItemCategory.TOOLS, weight: 10, value: 2, rarity: ItemRarity.COMMON, equippable: false, description: 'Cuerda de cáñamo resistente.' },
  { name: 'Palanca', category: ItemCategory.TOOLS, weight: 4, value: 0.5, rarity: ItemRarity.COMMON, equippable: false, description: 'Palanca de hierro.' },
  { name: 'Espejo de acero', category: ItemCategory.TOOLS, weight: 0.5, value: 5, rarity: ItemRarity.COMMON, equippable: false, description: 'Señales con reflejos; revisa esquinas.' },
  { name: 'Candado', category: ItemCategory.TOOLS, weight: 1, value: 10, rarity: ItemRarity.COMMON, equippable: false, description: 'Cerradura CD 15 para forzar.' },

  // ── Comida ─────────────────────────────────────────────
  { name: 'Raciones (1 día)', category: ItemCategory.FOOD, weight: 2, value: 0.5, rarity: ItemRarity.COMMON, equippable: false, description: 'Comida seca para un día.' },
  { name: 'Cantimplora', category: ItemCategory.FOOD, weight: 5, value: 2, rarity: ItemRarity.COMMON, equippable: false, description: 'Contiene 2 litros de agua.' },
  { name: 'Aguardiente', category: ItemCategory.FOOD, weight: 1, value: 10, rarity: ItemRarity.COMMON, equippable: false, description: 'Botella de licor fuerte.' },
  { name: 'Queso curado', category: ItemCategory.FOOD, weight: 1, value: 1, rarity: ItemRarity.COMMON, equippable: false, description: 'Pieza de queso de granja.' },

  // ── Materiales ─────────────────────────────────────────
  { name: 'Antorcha', category: ItemCategory.MATERIALS, weight: 1, value: 0.01, rarity: ItemRarity.COMMON, equippable: true, description: 'Luz brillante en 20 pies, tenue en 20 más. 1 hora.' },
  { name: 'Yesca y coughán', category: ItemCategory.MATERIALS, weight: 1, value: 0.5, rarity: ItemRarity.COMMON, equippable: false, description: 'Enciende fuego no mágico.' },
  { name: 'Piedra de amolar', category: ItemCategory.MATERIALS, weight: 1, value: 0.1, rarity: ItemRarity.COMMON, equippable: false, description: 'Mantén tus armas afiladas.' },
  { name: 'Aceite (frasco)', category: ItemCategory.MATERIALS, weight: 1, value: 0.1, rarity: ItemRarity.COMMON, equippable: false, description: 'Lubrica; arde si se enciende.' },
  { name: 'Polvo de gemas (300 po)', category: ItemCategory.MATERIALS, weight: 0.1, value: 300, rarity: ItemRarity.COMMON, equippable: false, description: 'Componente material para conjuros.' },

  // ── Misceláneos ────────────────────────────────────────
  { name: 'Mochila', category: ItemCategory.MISC, weight: 5, value: 2, rarity: ItemRarity.COMMON, equippable: true, description: 'Contiene un arnés de mazmorras estándar.' },
  { name: 'Saco de dormir', category: ItemCategory.MISC, weight: 7, value: 1, rarity: ItemRarity.COMMON, equippable: false, description: 'Para dormir en campamentos.' },
  { name: 'Kit de viaje', category: ItemCategory.MISC, weight: 2, value: 2, rarity: ItemRarity.COMMON, equippable: false, description: 'Bastón, arena, pan fleje y yesca.' },
  { name: 'Tenda (dos personas)', category: ItemCategory.MISC, weight: 20, value: 2, rarity: ItemRarity.COMMON, equippable: false, description: 'Refugio para dos criaturas medianas.' },
  { name: 'Libro y tintero', category: ItemCategory.MISC, weight: 5, value: 10, rarity: ItemRarity.COMMON, equippable: false, description: 'Para anotar aventuras y conjuros.' },
  { name: 'Bolsa de componenthes', category: ItemCategory.MISC, weight: 2, value: 25, rarity: ItemRarity.COMMON, equippable: true, description: 'Componentes para lanzaconjuros.' },
  { name: 'Brújula', category: ItemCategory.MISC, weight: 0.1, value: 10, rarity: ItemRarity.COMMON, equippable: false, description: 'Apunta al norte mágico.' },
];

async function main() {
  console.log('Sembrando biblioteca global de objetos...');
  for (const entry of library) {
    await prisma.item.upsert({
      where: { id: `lib_${entry.name}` },
      update: {
        description: entry.description,
        category: entry.category,
        weight: entry.weight,
        value: entry.value,
        rarity: entry.rarity,
        equippable: entry.equippable,
      },
      create: {
        id: `lib_${entry.name}`,
        name: entry.name,
        description: entry.description,
        category: entry.category,
        weight: entry.weight,
        value: entry.value,
        rarity: entry.rarity,
        equippable: entry.equippable,
        isLibrary: true,
      },
    });
  }
  console.log(`✔ ${library.length} objetos de biblioteca listos.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
