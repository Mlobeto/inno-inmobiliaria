import csv
import json
from collections import defaultdict

province_map = {
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
}

cities_by_province = defaultdict(set)

with open(r'C:\Users\merce\Downloads\simplemaps_worldcities_basicv1.901\worldcities.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['country'] == 'Argentina':
            province_id = province_map.get(row['admin_name'])
            if province_id:
                cities_by_province[province_id].add(row['city'])

result = {k: sorted(list(v)) for k, v in cities_by_province.items()}

with open('argentina_cities.json', 'w', encoding='utf-8') as outf:
    json.dump(result, outf, ensure_ascii=False, indent=2)

print(f"Procesadas {sum(len(v) for v in result.values())} ciudades en {len(result)} provincias")
