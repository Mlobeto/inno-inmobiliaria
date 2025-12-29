const { Router } = require("express");

const router = Router();

try {
    // Intentamos resolver la ruta del archivo
    console.log(require.resolve("./ClientWithRole"));
    
    // Si no hay errores, procedemos con la carga de la ruta
    router.use("/clientRole", require("./ClientWithRole"));
  } catch (error) {
    // Si ocurre un error, lo mostramos en la consola
    console.error("No se pudo encontrar clientWithRole:", error);
  }

router.use("/admin", require("./admin"));
router.use("/auth", require("./auth"));
router.use("/client", require("./client"));
router.use("/lease", require("./lease"));
router.use("/payment", require("./payment"));
router.use("/property", require("./property"));
router.use("/garantor", require("./garantor"));
router.use("/import", require("./import"));
router.use("/fix", require("./fixConstraints")); // Endpoint temporal

module.exports = router;
