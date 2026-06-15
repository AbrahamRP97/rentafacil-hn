CREATE TABLE ubicaciones (
    id_ubicacion SERIAL PRIMARY KEY,
    departamento VARCHAR(100) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    codigo_postal VARCHAR(10),
    latitud NUMERIC(10,8),
    longitud NUMERIC(11,8)
);

CREATE TABLE propietarios (
    id_propietario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    dni VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_propietario_email UNIQUE (email),
    CONSTRAINT uk_propietario_dni UNIQUE (dni)
);

CREATE TABLE inquilinos (
    id_inquilino SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    dni VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_inquilino_email UNIQUE (email),
    CONSTRAINT uk_inquilino_dni UNIQUE (dni)
);

CREATE TABLE propiedades (
    id_propiedad SERIAL PRIMARY KEY,
    id_propietario INT NOT NULL,
    id_ubicacion INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio_mensual NUMERIC(10,2) NOT NULL,
    habitaciones INT NOT NULL DEFAULT 1,
    banos INT NOT NULL DEFAULT 1,
    metros_cuadrados NUMERIC(8,2),
    tipo VARCHAR(50) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_propiedades_propietarios FOREIGN KEY (id_propietario)
        REFERENCES propietarios(id_propietario) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_propiedades_ubicaciones FOREIGN KEY (id_ubicacion)
        REFERENCES ubicaciones(id_ubicacion) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_propiedades_estado CHECK (estado IN ('disponible', 'reservado', 'alquilado'))
);

CREATE TABLE imagenes_propiedad (
    id_imagen SERIAL PRIMARY KEY,
    id_propiedad INT NOT NULL,
    url_imagen VARCHAR(500) NOT NULL,
    es_portada BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_imagenes_propiedad_propiedades FOREIGN KEY (id_propiedad)
        REFERENCES propiedades(id_propiedad) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE reservas (
    id_reserva SERIAL PRIMARY KEY,
    id_propiedad INT NOT NULL,
    id_inquilino INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservas_propiedades FOREIGN KEY (id_propiedad)
        REFERENCES propiedades(id_propiedad) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_reservas_inquilinos FOREIGN KEY (id_inquilino)
        REFERENCES inquilinos(id_inquilino) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_reservas_estado CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'cancelada')),
    CONSTRAINT chk_reserva_fechas CHECK (fecha_fin > fecha_inicio)
);

CREATE TABLE contratos (
    id_contrato SERIAL PRIMARY KEY,
    id_reserva INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    monto_mensual NUMERIC(10,2) NOT NULL,
    deposito NUMERIC(10,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_contratos_reserva UNIQUE (id_reserva),
    CONSTRAINT fk_contratos_reservas FOREIGN KEY (id_reserva)
        REFERENCES reservas(id_reserva) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_contratos_estado CHECK (estado IN ('activo', 'finalizado', 'cancelado')),
    CONSTRAINT chk_contrato_fechas CHECK (fecha_fin > fecha_inicio)
);

CREATE TABLE pagos (
    id_pago SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL,
    monto NUMERIC(10,2) NOT NULL,
    fecha_pago DATE NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'completado',
    referencia VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pagos_contratos FOREIGN KEY (id_contrato)
        REFERENCES contratos(id_contrato) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_pagos_metodo CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta')),
    CONSTRAINT chk_pagos_estado CHECK (estado IN ('completado', 'pendiente', 'fallido'))
);

CREATE TABLE calificaciones (
    id_calificacion SERIAL PRIMARY KEY,
    id_contrato INT NOT NULL,
    tipo_autor VARCHAR(20) NOT NULL,
    puntuacion SMALLINT NOT NULL,
    comentario TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_calificaciones_contratos FOREIGN KEY (id_contrato)
        REFERENCES contratos(id_contrato) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_calificaciones_puntuacion CHECK (puntuacion BETWEEN 1 AND 5),
    CONSTRAINT chk_calificaciones_autor CHECK (tipo_autor IN ('propietario', 'inquilino')),
    CONSTRAINT uk_contrato_tipo_autor UNIQUE (id_contrato, tipo_autor)
);
