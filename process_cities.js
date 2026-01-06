const fs = require('fs');
const path = require('path');

// Leer el CSV
const csvPath = 'C:\\Users\\merce\\Downloads\\simplemaps_worldcities_basicv1.901\\worldcities.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parsear CSV simple
const lines = csvContent.split('\n');
const cities = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.includes('"Argentina"')) continue;
  
  // Extraer campos (simple parsing)
  const match = line.match(/"([^"]+)","([^"]+)","([^"]+)","([^"]+)","Argentina","AR","ARG","([^"]+)"/);
  if (match) {
    cities.push({
      city: match[1],
      admin: match[5]
    });
  }
}

// Mapear nombres de provincias del CSV a IDs
const provinceMap = {
  'Buenos Aires': 'buenos_aires',
  'Buenos Aires, Ciudad Autónoma de': 'caba',
  'Catamarca': 'catamarca',
  'Chaco': 'chaco',
  'Chubut': 'chubut',
  'Córdoba': 'cordoba',
  'Corrientes': 'corrientes',
  'Entre Ríos': 'entre_rios',
  'Formosa': 'formosa',
  'Jujuy': 'jujuy',
  'La Pampa': 'la_pampa',
  'La Rioja': 'la_rioja',
  'Mendoza': 'mendoza',
  'Misiones': 'misiones',
  'Neuquén': 'neuquen',
  'Río Negro': 'rio_negro',
  'Salta': 'salta',
  'San Juan': 'san_juan',
  'San Luis': 'san_luis',
  'Santa Cruz': 'santa_cruz',
  'Santa Fe': 'santa_fe',
  'Santiago del Estero': 'santiago_del_estero',
  'Tierra del Fuego': 'tierra_del_fuego',
  'Tucumán': 'tucuman'
};

// Agrupar por provincia
const cityByProvince = {};
cities.forEach(city => {
  const provinceId = provinceMap[city.admin];
  if (provinceId) {
    if (!cityByProvince[provinceId]) {
      cityByProvince[provinceId] = new Set();
    }
    cityByProvince[provinceId].add(city.city);
  }
});

// Convertir a arrays y ordenar
const result = {};
Object.keys(cityByProvince).forEach(provinceId => {
  result[provinceId] = Array.from(cityByProvince[provinceId]).sort();
});

console.log(JSON.stringify(result, null, 2));
