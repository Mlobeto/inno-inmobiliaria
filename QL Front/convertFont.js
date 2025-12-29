import font2base64 from 'font2base64';
import fs from 'fs';

// Convertir Tahoma a base64
font2base64.encodeToDataUrlSync('C:/Windows/Fonts/tahoma.ttf')
  .then(data => {
    const fileContent = `
import { jsPDF } from "jspdf";

const tahomaFont = '${data.split(',')[1]}';

const callAddFont = function () {
  this.addFileToVFS('Tahoma-normal.ttf', tahomaFont);
  this.addFont('Tahoma-normal.ttf', 'Tahoma', 'normal');
};

jsPDF.API.events.push(['addFonts', callAddFont]);

export default tahomaFont;
`;
    
    fs.writeFileSync('./src/utils/Tahoma-normal.js', fileContent);
    console.log('✅ Fuente Tahoma convertida exitosamente!');
  })
  .catch(err => console.error('Error:', err));
