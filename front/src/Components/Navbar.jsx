import  { useState } from 'react';
import {Link}  from 'react-router-dom';
import { IoPersonSharp } from "react-icons/io5";    


const Navbar = () => {
  // const [isOpen, setIsOpen] = useState(false);

  // const toggleMenu = () => {
  //   setIsOpen(!isOpen);
  // };

  // return (
  //   <div className=" shadow-md fixed w-full z-10 bg-gray-900">
  //     <div className="container mx-auto flex items-center justify-between p-4">
  //       {/* Logo */}
  //       <div className="flex items-center">
          
  //       </div>

  //       {/* Desktop Menu */}
  //       <div className="hidden md:flex space-x-8">
  //         <a href="#" className="text-gray-100 text-xl font-semibold hover:underline">
  //           Inicio
  //         </a>
  //         <a href="#" className="text-gray-100 text-xl font-semibold hover:underline">
  //           Cursos
  //         </a>
          
          
  //         <a href="#" className="text-gray-100 text-xl font-semibold hover:underline">
  //           Sobre Nosotros
  //         </a>
  //         <a href="#" className="text-gray-100 text-xl font-semibold hover:underline">
  //           Contacto
  //         </a>
  //       </div>

  //       {/* Ingresar Button */}
  //       <div className="hidden md:block">
  //       <Link to="/login"> {/* Usamos Link para navegar a /login */}
  //           <button className="bg-boton text-white text-xl py-2 px-4 rounded-md flex items-center space-x-2">
  //             <span>Ingresar</span>
  //             <IoPersonSharp />
  //           </button>
  //         </Link>
  //       </div>

  //       {/* Hamburger Menu Button */}
  //       <div className="md:hidden">
  //         <button onClick={toggleMenu} className="text-gray-600 focus:outline-none">
  //           <svg
  //             className="w-8 h-8"
  //             fill="none"
  //             stroke="currentColor"
  //             viewBox="0 0 24 24"
  //             xmlns="http://www.w3.org/2000/svg"
  //           >
  //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
  //           </svg>
  //         </button>
  //       </div>
  //     </div>

  //     {/* Mobile Menu */}
  //     {isOpen && (
  //       <div className="md:hidden">
  //         <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
  //           <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
  //             Inicio
  //           </a>
  //           <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
  //             Cursos
  //           </a>
  //           <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
  //             Sobre Nosotros
  //           </a>
            
            
  //           <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
  //             Contacto
  //           </a>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
};

export default Navbar;
