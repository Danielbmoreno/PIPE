# Asset oficial de Minu

Coloca la imagen oficial autorizada en `frontend/src/assets/minu.png` o
`frontend/src/assets/minu.svg` y vuelve a compilar. Se prefiere PNG transparente.
Si existen ambos archivos, el componente utiliza PNG.

`FloatingMinu` descubre estos archivos con `import.meta.glob`, por lo que el
build funciona aunque ninguno exista. Mientras tanto muestra un emblema PIPE
con la etiqueta “Minu · imagen pendiente”; no representa la mascota oficial.
No se han descargado ni generado imágenes de Minu.
