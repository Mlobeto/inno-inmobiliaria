const numeroALetras = (numero) => {
    console.log('Número recibido:', numero, typeof numero);
    
    const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    const especiales = {
      11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
      16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve'
    };
  
    if (!numero && numero !== 0) return '';
    
    const num = Math.floor(Number(numero));
    console.log('Número convertido:', num);
  
    if (num === 0) return 'cero';
    if (num < 0 || num > 999999) return numero.toString();
  
    let resultado = '';
    
    // Manejar miles de forma recursiva
    const miles = Math.floor(num / 1000);
    const restantes = num % 1000;
    
    if (miles > 0) {
      if (miles === 1) {
        resultado += 'mil';
      } else {
        // Llamo recursivamente para convertir la parte de los miles
        resultado += numeroALetras(miles) + ' mil';
      }
    }
    
    if (restantes === 0) {
      return resultado;
    }
    
    // Manejar centenas
    const centenasNum = Math.floor(restantes / 100);
    if (centenasNum === 1) {
      resultado += (restantes % 100 === 0) ? ' cien' : ' ciento';
    } else if (centenasNum > 1) {
      resultado += ' ' + centenas[centenasNum];
    }
    
    // Manejar decenas y unidades
    const decena = Math.floor((restantes % 100) / 10);
    const unidad = restantes % 10;
    
    if (decena === 1 && unidad > 0) {
      resultado += ' ' + especiales[10 + unidad];
    } else {
      if (decena > 0) {
        resultado += ' ' + decenas[decena];
        if (unidad > 0) resultado += ' y';
      }
      if (unidad > 0) {
        resultado += ' ' + unidades[unidad];
      }
    }
    
    return resultado.trim();
  };
  
  export default numeroALetras;