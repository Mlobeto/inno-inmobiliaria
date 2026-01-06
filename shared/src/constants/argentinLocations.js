/**
 * Provincias y ciudades principales de Argentina
 * Fuente: INDEC - Instituto Nacional de Estadística y Censos
 */

export const PROVINCIAS_ARGENTINA = [
  { id: 'buenos_aires', name: 'Buenos Aires' },
  { id: 'caba', name: 'Ciudad Autónoma de Buenos Aires' },
  { id: 'catamarca', name: 'Catamarca' },
  { id: 'chaco', name: 'Chaco' },
  { id: 'chubut', name: 'Chubut' },
  { id: 'cordoba', name: 'Córdoba' },
  { id: 'corrientes', name: 'Corrientes' },
  { id: 'entre_rios', name: 'Entre Ríos' },
  { id: 'formosa', name: 'Formosa' },
  { id: 'jujuy', name: 'Jujuy' },
  { id: 'la_pampa', name: 'La Pampa' },
  { id: 'la_rioja', name: 'La Rioja' },
  { id: 'mendoza', name: 'Mendoza' },
  { id: 'misiones', name: 'Misiones' },
  { id: 'neuquen', name: 'Neuquén' },
  { id: 'rio_negro', name: 'Río Negro' },
  { id: 'salta', name: 'Salta' },
  { id: 'san_juan', name: 'San Juan' },
  { id: 'san_luis', name: 'San Luis' },
  { id: 'santa_cruz', name: 'Santa Cruz' },
  { id: 'santa_fe', name: 'Santa Fe' },
  { id: 'santiago_del_estero', name: 'Santiago del Estero' },
  { id: 'tierra_del_fuego', name: 'Tierra del Fuego' },
  { id: 'tucuman', name: 'Tucumán' },
];

export const CIUDADES_POR_PROVINCIA = {
  caba: [
    'Buenos Aires',
    'Villa Celina',
  ],
  buenos_aires: [
    'Acasusso', 'Adolfo Gonzáles Chaves', 'Adrogue', 'Aldo Bonzi', 'Alejandro Korn', 'Arrecifes', 'Avellaneda',
    'Ayacucho', 'Azul', 'Bahía Blanca', 'Balcarce', 'Balneario Monte Hermoso', 'Banfield', 'Baradero', 'Batán',
    'Beccar', 'Bella Vista', 'Belén de Escobar', 'Benito Juárez', 'Berazategui', 'Berisso', 'Bernal', 'Billinghurst',
    'Bragado', 'Brandsen', 'Burzaco', 'Campana', 'Capilla del Señor', 'Capitán Sarmiento', 'Carhué', 'Carlos Casares',
    'Carlos Spegazzini', 'Carmen de Areco', 'Carmen de Patagones', 'Caseros', 'Castelar', 'Cañuelas', 'Chacabuco',
    'Chascomús', 'Chivilcoy', 'City Bell', 'Ciudad General Belgrano', 'Ciudadela', 'Claypole', 'Colón', 'Coronel Dorrego',
    'Coronel Suárez', 'Daireaux', 'Darregueira', 'Dock Sur', 'Dolores', 'Don Bosco', 'Don Torcuato', 'El Palomar',
    'El Talar de Pacheco', 'Ensenada', 'Ensenada Berisso', 'Esteban Echeverría', 'Ezpeleta', 'Florencio Varela', 'Florida',
    'Garín', 'General Alvear', 'General Arenales', 'General Belgrano', 'General Juan Madariaga', 'General Las Heras',
    'General Pacheco', 'General Rodríguez', 'General San Martín', 'General Viamonte', 'General Villegas', 'Gerli', 'Glew',
    'González Catán', 'Grand Bourg', 'Guernica', 'Haedo', 'Henderson', 'Hurlingham', 'Ingeniero Maschwitz',
    'Ingeniero Pablo Nogués', 'Ingeniero White', 'Isidro Casanova', 'Ituzaingó', 'José C. Paz', 'José María Ezeiza',
    'José Mármol', 'Junín', 'La Lucila', 'La Plata', 'La Reja', 'Lanús', 'Las Flores', 'Libertad', 'Lincoln', 'Llavallol',
    'Lobería', 'Lobos', 'Lomas de Zamora', 'Lomas del Mirador', 'Longchamps', 'Los Polvorines', 'Luján', 'Magdalena',
    'Maipú', 'Manuel B. Gonnet', 'Mar de Ajó', 'Mar del Plata', 'Marcos Paz', 'Mariano Acosta', 'Martín Coronado',
    'Martínez', 'Matheu', 'Melchor Romero', 'Mercedes', 'Merlo', 'Miramar', 'Monte Chingolo', 'Morón', 'Munro', 'Muñiz',
    'Navarro', 'Necochea', 'Nueve de Julio', 'Olavarría', 'Pedro Luro', 'Pehuajó', 'Pergamino', 'Pigüé', 'Pilar',
    'Pinamar', 'Puan', 'Punta Alta', 'Punta Indio', 'Quilmes', 'Rafael Calzada', 'Rafael Castillo', 'Ramallo',
    'Ramos Mejía', 'Ranchos', 'Rauch', 'Remedios de Escalada', 'Roque Pérez', 'Saavedra', 'San Andrés de Giles',
    'San Antonio de Areco', 'San Antonio de Padua', 'San Fernando', 'San Francisco Solano', 'San Isidro', 'San Justo',
    'San Miguel', 'San Nicolás de los Arroyos', 'San Pedro', 'San Vicente', 'Sarandí', 'Tandil', 'Tapiales', 'Temperley',
    'Tigre', 'Tolosa', 'Tornquist', 'Tortuguitas', 'Trenque Lauquen', 'Tres Arroyos', 'Veinticinco de Mayo', 'Vicente López',
    'Villa Adelina', 'Villa Alsina', 'Villa Ballester', 'Villa Domínico', 'Villa Elisa', 'Villa Gesell', 'Villa Luzuriaga',
    'Villa Sarmiento', 'Villalonga', 'Virreyes', 'Wilde', 'Zárate',
  ],
  catamarca: [
    'Andalgalá', 'Belén', 'Catamarca', 'Chumbicha', 'Recreo', 'Santa María', 'Tinogasta',
  ],
  chaco: [
    'Barranqueras', 'Campo Largo', 'Castelli', 'Charata', 'Coronel Du Graty', 'Corzuela', 'Fontana',
    'General José de San Martín', 'General Pinedo', 'La Leonesa', 'Las Breñas', 'Machagai', 'Pampa del Infierno',
    'Presidencia Roque Sáenz Peña', 'Presidencia de la Plaza', 'Puerto Tirol', 'Quitilipi', 'Resistencia',
    'San Bernardo', 'Santa Sylvina', 'Tres Isletas', 'Villa Berthet', 'Villa Ángela',
  ],
  chubut: [
    'Alto Río Senguer', 'Comodoro Rivadavia', 'El Maitén', 'Esquel', 'Gastre', 'Puerto Madryn', 'Rada Tilly',
    'Rawson', 'Río Mayo', 'Sarmiento', 'Telsen', 'Trelew',
  ],
  cordoba: [
    'Alta Gracia', 'Arroyito', 'Bell Ville', 'Brinkmann', 'Capilla del Monte', 'Corral de Bustos', 'Cosquín',
    'Cruz del Eje', 'Córdoba', 'Deán Funes', 'Embalse', 'Frontera', 'General Cabrera', 'General Deheza', 'Hernando',
    'Huinca Renancó', 'Jesús María', 'La Calera', 'La Carlota', 'La Falda', 'Laboulaye', 'Leones', 'Malvinas Argentinas',
    'Marcos Juárez', 'Monte Cristo', 'Morteros', 'Oliva', 'Oncativo', 'Pilar', 'Río Cuarto', 'Río Segundo', 'Río Tercero',
    'San Francisco', 'Santa María', 'Santa Rosa de Calamuchita', 'Santa Rosa de Río Primero', 'Unquillo', 'Villa Carlos Paz',
    'Villa Dolores', 'Villa General Belgrano', 'Villa María', 'Villa Nueva', 'Villa Rumipal', 'Villa del Rosario',
  ],
  corrientes: [
    'Bella Vista', 'Corrientes', 'Curuzú Cuatiá', 'Empedrado', 'Gobernador Virasora', 'Goya', 'Ituzaingó', 'La Cruz',
    'Mburucuyá', 'Mercedes', 'Monte Caseros', 'Paso de los Libres', 'Saladas', 'San Lorenzo', 'San Luis del Palmar',
    'San Roque', 'Santa Lucía', 'Santo Tomé', 'Sauce',
  ],
  entre_rios: [
    'Basavilbaso', 'Chajarí', 'Colón', 'Concepción del Uruguay', 'Concordia', 'Crespo', 'Diamante', 'Federación',
    'Federal', 'Gualeguay', 'Gualeguaychú', 'Ibicuy', 'La Paz', 'Nogoyá', 'Paraná', 'Rosario del Tala',
    'San José de Feliciano', 'San Salvador', 'Santa Elena', 'Urdinarrain', 'Viale', 'Victoria', 'Villa Elisa',
    'Villa Paranacito', 'Villa San José', 'Villaguay',
  ],
  formosa: [
    'Clorinda', 'Comandante Fontana', 'Formosa', 'Ingeniero Guillermo N. Juárez', 'Las Lomitas', 'Pirané',
  ],
  jujuy: [
    'Abra Pampa', 'Humahuaca', 'La Quiaca', 'Libertador General San Martín', 'Monte Rico', 'Palpalá', 'Perico',
    'Rinconada', 'San Pedro', 'San Salvador de Jujuy', 'Susques',
  ],
  la_pampa: [
    'General Acha', 'General Pico', 'Río Colorado', 'Santa Rosa', 'Veinticinco de Mayo', 'Victorica',
  ],
  la_rioja: [
    'Chamical', 'Chepes', 'Chilecito', 'La Rioja', 'Villa Unión',
  ],
  mendoza: [
    'General Alvear', 'Godoy Cruz', 'La Paz', 'Las Heras', 'Luján de Cuyo', 'Maipú', 'Malargüe', 'Mendoza',
    'Rivadavia', 'San Martín', 'San Rafael', 'Santa Rosa', 'Tunuyán', 'Uspallata',
  ],
  misiones: [
    'Apóstoles', 'Aristóbulo del Valle', 'Bernardo de Irigoyen', 'Candelaria', 'Eldorado', 'Garupá', 'Jardín América',
    'Leandro N. Alem', 'Oberá', 'Posadas', 'Puerto Iguazú', 'Puerto Rico', 'Wanda',
  ],
  neuquen: [
    'Centenario', 'Chos Malal', 'Cutral-Có', 'Junín de los Andes', 'Las Lajas', 'Neuquén', 'Plaza Huincul', 'Plottier',
    'San Martín de los Andes', 'Senillosa', 'Villa La Angostura', 'Zapala',
  ],
  rio_negro: [
    'Allen', 'Catriel', 'Choele Choel', 'Cinco Saltos', 'Cipolletti', 'Comallo', 'El Bolsón', 'General Conesa',
    'General Roca', 'Ingeniero Jacobacci', 'San Antonio Oeste', 'San Carlos de Bariloche', 'Sierra Colorada',
    'Viedma', 'Villa Regina',
  ],
  salta: [
    'Cafayate', 'Cerrillos', 'Embarcación', 'General Enrique Mosconi', 'General Martín Miguel de Güemes',
    'Joaquín V. González', 'Los Blancos', 'Pichanal', 'Profesor Salvador Mazza', 'Rosario de Lerma',
    'Rosario de la Frontera', 'Salta', 'San Antonio de los Cobres', 'San Ramón de la Nueva Orán', 'Tartagal',
  ],
  san_juan: [
    'Caucete', 'Chimbas', 'Rivadavia', 'Rodeo', 'San José de Jáchal', 'San Juan', 'San Martín', 'Villa Aberastain',
    'Villa Krause',
  ],
  san_luis: [
    'Justo Daract', 'San Luis', 'Villa Mercedes',
  ],
  santa_cruz: [
    'Caleta Olivia', 'Comandante Luis Piedra Buena', 'El Calafate', 'Gobernador Gregores', 'Las Heras', 'Perito Moreno',
    'Pico Truncado', 'Puerto Deseado', 'Río Gallegos', 'San Julián', 'Veintiocho de Noviembre', 'Yacimiento Río Turbio',
  ],
  santa_fe: [
    'Alcorta', 'Armstrong', 'Arroyo Seco', 'Avellaneda', 'Capitán Bermúdez', 'Carcarañá', 'Casilda', 'Cañada de Gómez',
    'Ceres', 'Coronda', 'El Trébol', 'Esperanza', 'Firmat', 'Fray Luis A. Beltrán', 'Funes', 'Gobernador Gálvez',
    'Granadero Baigorria', 'Gálvez', 'Laguna Paiva', 'Las Parejas', 'Las Rosas', 'Puerto San Martín', 'Pérez', 'Rafaela',
    'Reconquista', 'Roldán', 'Romang', 'Rosario', 'Rufino', 'San Carlos Centro', 'San Cristóbal', 'San Javier',
    'San Jorge', 'San Justo', 'San Lorenzo', 'Santa Fe', 'Santo Tomé', 'Sunchales', 'Tostado', 'Venado Tuerto', 'Vera',
    'Villa Cañás', 'Villa Constitución', 'Villa Ocampo',
  ],
  santiago_del_estero: [
    'Añatuya', 'Ciudad de Loreto', 'Frías', 'La Banda', 'Monte Quemado', 'Quimilí', 'Santiago del Estero',
    'Termas de Río Hondo', 'Villa Ojo de Agua',
  ],
  tucuman: [
    'Aguilares', 'Banda del Río Salí', 'Bella Vista', 'Concepción', 'Famaillá', 'Monteros', 'San Isidro de Lules',
    'San Miguel de Tucumán', 'Tafí Viejo', 'Trancas', 'Villa Nougues', 'Yerba Buena',
  ],
};

/**
 * Obtener ciudades de una provincia
 */
export const getCiudadesByProvincia = (provinciaId) => {
  return CIUDADES_POR_PROVINCIA[provinciaId] || [];
};

/**
 * Buscar provincia por nombre
 */
export const findProvinciaByName = (name) => {
  return PROVINCIAS_ARGENTINA.find(p => 
    p.name.toLowerCase().includes(name.toLowerCase())
  );
};
