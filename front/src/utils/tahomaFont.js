// Tahoma font configuration for jsPDF
// Para usar Tahoma, necesitas el archivo .ttf convertido a base64
// Proceso:
// 1. Descarga jsPDF font converter: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
// 2. Sube el archivo tahoma.ttf (lo encuentras en C:\Windows\Fonts\)
// 3. Copia el código generado aquí

// Mientras tanto, usaremos una fuente similar disponible en jsPDF
export const addTahomaFont = (doc) => {
  // jsPDF incluye estas fuentes por defecto:
  // helvetica, times, courier
  
  // Como alternativa temporal, helvetica es muy similar a Tahoma
  doc.setFont("helvetica");
  
  // TODO: Agregar archivo Tahoma convertido cuando esté disponible
};

export default addTahomaFont;
