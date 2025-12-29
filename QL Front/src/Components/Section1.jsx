import React from 'react'
import {Link}  from 'react-router-dom';

function Section1() {
  return (
    
    <section className="bg-gray-950 text-center text-white py-16 ">
    <h1 className="text-5xl font-bold mt-8"><br/>Quintero Lobeto Propiedades<span> </span> 
      <span className="inline-flex items-center space-x-1">
        <br></br>
        
      </span>
    </h1>
    <div className="mt-8">
    <Link to="/login">
      <button className="bg-red-700 hover:bg-Blue-600 text-black font-bold py-3 px-8 rounded-lg shadow-lg">
        Ingresar
      </button>
      </Link>
    </div>
   
  </section>
);
  
}

export default Section1