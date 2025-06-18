# Desktop Application

Una aplicación de escritorio multiplataforma creada con Electron, React y PrimeReact.

## Características

- Interfaz de usuario moderna con PrimeReact
- Menú superior con Menubar
- Panel lateral redimensionable con Splitter
- Explorador de archivos con Tree
- Soporte multiplataforma (Windows, macOS, Linux)

## Requisitos previos

- Node.js (versión 14 o superior)
- npm (viene con Node.js)

## Instalación

1. Clona o descarga este repositorio
2. Navega al directorio del proyecto
3. Instala las dependencias:

```bash
npm install
```

## Desarrollo

Para iniciar la aplicación en modo desarrollo:

1. En una terminal, ejecuta el compilador de webpack en modo watch:

```bash
npm run dev
```

2. En otra terminal, inicia la aplicación Electron:

```bash
npm run electron-dev
```

## Compilación

Para compilar la aplicación para producción:

```bash
npm run build
npm run package
```

Esto generará los archivos de instalación en el directorio `build`.

## Estructura del proyecto

- `main.js` - Punto de entrada de Electron
- `src/` - Código fuente de React
  - `components/` - Componentes de React
  - `assets/` - Recursos estáticos (CSS, imágenes, etc.)
- `dist/` - Archivos compilados por webpack
- `build/` - Archivos de instalación generados 