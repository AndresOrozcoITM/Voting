# Voting System API

## Descripción

Este proyecto es una API RESTful para gestionar un sistema de votaciones, desarrollado con Node.js y Express, y utilizando MySQL como base de datos.

## Requisitos

- Node.js v14 o superior
- MySQL
- npm o yarn

## Instalación

1. Clonar el repositorio:
   ```sh
   git clone https://github.com/tu-usuario/voting-system-api.git
   cd voting-system-api
   ```
2. Instalar dependencias:
   ```sh
   npm install
   ```
3. Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_NAME=voting_system
   DB_USER=root
   DB_PASS=tu_contraseña
   SECRET_KEY=supersecretkey
   ```
4. Configurar la base de datos en MySQL:
   ```sql
   CREATE DATABASE voting_system;
   ```
5. Ejecutar el servidor:
   ```sh
   npm start
   ```

## Endpoints

### Autenticación

- `POST /register`: Registrar un nuevo votante.
- `POST /login`: Iniciar sesión y obtener un token JWT.

### Votantes

- `GET /voters?page=1&limit=10`: Obtener lista paginada de votantes.

### Candidatos

- `GET /candidates?page=1&limit=10`: Obtener lista paginada de candidatos.

### Votos

- `POST /votes`: Emitir un voto (requiere autenticación).
- `GET /votes/statistics`: Obtener estadísticas de la votación.

## Ejemplo de Uso

### Registro de Votante
```sh
curl -X POST http://localhost:5000/register \
     -H "Content-Type: application/json" \
     -d '{"name": "John Doe", "email": "john@example.com", "password": "123456"}'
```

### Inicio de Sesión
```sh
curl -X POST http://localhost:5000/login \
     -H "Content-Type: application/json" \
     -d '{"email": "john@example.com", "password": "123456"}'
```

Esto devolverá un token que debe ser utilizado en los endpoints protegidos.

### Emitir un Voto
```sh
curl -X POST http://localhost:5000/votes \
     -H "Authorization: Bearer <TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"candidate_id": 1}'
```

## Capturas de Estadísticas

Se deben agregar capturas de pantalla de los resultados obtenidos en el endpoint `/votes/statistics`.

## Contribuciones

Las contribuciones son bienvenidas. Para ello, crea un fork del repositorio y envía un pull request.

## Licencia

Este proyecto está bajo la licencia MIT.

