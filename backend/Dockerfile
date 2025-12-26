# Usa la imagen oficial de Bun
FROM oven/bun:1.1.4

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de configuración
COPY package.json bun.lock* ./

# Instala las dependencias
RUN bun install --frozen-lockfile

# Copia el resto de los archivos
COPY . .

# Expone el puerto en el que corre la aplicación
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["bun", "run", "dev"]
