# EP2 - Añadiéndole complejidad a nuestro pipeline

**Asignatura:** Ingeniería DevOps (DOY0101)
**Institución:** Duoc UC
**Estudiante:** Matias Nazal


## 1. Estrategia de Contenedorización

Para garantizar la portabilidad y la consistencia del entorno entre desarrollo y producción, se diseñó un esquema de empaquetado utilizando **Docker**.

### Justificación de la Imagen Base:
Se seleccionó la imagen oficial de **Node:20-alpine**. Las razones arquitectónicas detrás de esta elección son:
* **Seguridad (Superficie de ataque reducida):** Al ser una distribución minimalista basada en Alpine Linux, no incluye herramientas ni paquetes innecesarios, minimizando la cantidad de vulnerabilidades potenciales.
* **Eficiencia:** Reduce significativamente el peso de la imagen final (menos de 200MB en comparación con los ~1GB de las imágenes estándar), optimizando los tiempos de descarga y despliegue dentro del pipeline.

### Buenas Prácticas Aplicadas:
1. **Uso de `.dockerignore`:** Exclusión explícita de `node_modules`, archivos de configuración local, carpetas de control de versiones (`.git`) y logs, evitando la contaminación del contexto de construcción.
2. **Optimización de Capas (Caching):** Se copian primero los archivos de dependencias (`package*.json`) y se ejecuta `npm install` antes de copiar el resto del código fuente. Esto asegura que si el código cambia pero las dependencias no, Docker reutilice la capa de caché, acelerando los despliegues futuros.


## 2. Framework de Pruebas Unitarias Automatizadas

La validación temprana de la lógica de negocio se configuró utilizando **Jest** y **Supertest** como suite de pruebas automatizadas.

### Justificación Técnica:
* **Jest:** Ofrece un entorno de ejecución de pruebas de alto rendimiento y asíncrono con aserciones nativas legibles.
* **Supertest:** Permite realizar pruebas de integración de endpoints HTTP simulando peticiones directas a la aplicación Express sin necesidad de levantar el servidor de manera física en un puerto de red expuesto.

### Mitigación de Bloqueos en CI/CD:
Durante las pruebas automatizadas, se identificó un comportamiento donde los procesos asíncronos de escucha de Express mantenían los hilos de Node activos, amenazando con congelar las máquinas de ejecución de GitHub Actions por *timeout*. 
Se aplicó una solución mediante la bandera `--forceExit` en el script de testeo (`jest --forceExit`), garantizando la terminación limpia y forzada del proceso.

## 3. Estrategia de Seguridad Fail-Fast y Análisis de Vulnerabilidades

Se integró un enfoque moderno de **DevSecOps** dentro del flujo de trabajo, implementando dos capas independientes de seguridad automatizada:

1. **Snyk (Análisis de Dependencias SCA):** Integrado directamente en el flujo de GitHub Actions. Está configurado bajo la premisa de **Fail-Fast**: si detecta vulnerabilidades con un umbral de severidad alto (`--severity-threshold=high`), el pipeline interrumpe su ejecución de inmediato y bloquea la integración del código hacia las ramas protegidas (`develop` y `main`).
2. **GitHub Dependabot:** Automatización a nivel de repositorio encargada de monitorear el árbol de dependencias del archivo `package.json` de forma semanal. Genera alertas y Pull Requests automáticos ante la aparición de parches de seguridad para librerías obsoletas o comprometidas.


## 4. Orquestación del Entorno Simulado

Para la gestión unificada de los servicios, se implementó un plano de control mediante **Docker Compose** a través del archivo `docker-compose.yml`.

### Justificación de la Herramienta:
Docker Compose actúa como el orquestador local. Permite abstraer la configuración de red, variables de entorno, mapeo de puertos y volúmenes en un único archivo declarativo de configuración. 

### Características del Entorno:
* **Aislamiento de Red:** Define el mapeo estricto de puertos (`8080:8080`) aislando el puerto del contenedor y exponiendo el servicio hacia el host de manera controlada.
* **Políticas de Resiliencia:** Se configuró el parámetro `restart: always`, asegurando que si el proceso del microservicio colapsa por algún error de desbordamiento de memoria o excepción no controlada, el motor de Docker lo levante automáticamente para mantener la disponibilidad del servicio.
* **Variables de Entorno Inyectadas:** Mantiene separada la configuración del entorno (`NODE_ENV=production`) del código fuente duro, cumpliendo con los principios de *The Twelve-Factor App*.


## 5. Arquitectura del Pipeline de CI/CD (GitHub Actions)

El workflow automatizado ejecuta los procesos de validación secuencial en cada Pull Request o Push hacia las ramas principales:

```text
[Checkout Código] ➔ [Setup Node.js] ➔ [Instalar Dependencias] ➔ [Ejecutar Tests (Jest)] ➔ [Análisis de Seguridad (Snyk)] ➔ [Construcción de Imagen Docker]