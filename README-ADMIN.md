# Panel administrativo

Ejecuta el sitio con Node.js desde esta carpeta:

```powershell
npm start
```

Abre `http://127.0.0.1:8765/about.html` y usa el icono de candado del pie de página. El panel edita `content/site.json` y publica los cambios en el blog, la portada, los destacados y la galería.

Para cambiar las credenciales al iniciar el servidor, define `ADMIN_EMAIL` y `ADMIN_PASSWORD` como variables de entorno. La sesión dura ocho horas y la contraseña predeterminada no se sirve al navegador.
