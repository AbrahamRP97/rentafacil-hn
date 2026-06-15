INSERT INTO ubicaciones (departamento, municipio, direccion, codigo_postal, latitud, longitud) VALUES
('Francisco Morazan', 'Tegucigalpa', 'Colonia Palmira, avenida principal', '11101', 14.10170000, -87.20680000),
('Cortes', 'San Pedro Sula', 'Barrio Rio de Piedras, 3 calle', '21102', 15.50420000, -88.02500000),
('Atlantida', 'La Ceiba', 'Zona Viva, boulevard costero', '31101', 15.77920000, -86.79310000),
('Comayagua', 'Comayagua', 'Barrio San Francisco, calle real', '12101', 14.45140000, -87.63750000);

INSERT INTO propietarios (nombre, apellido, email, telefono, dni) VALUES
('Carlos', 'Mejia', 'admin@rentafacil.com', '50499990001', '0801199012345'),
('Mariana', 'Lopez', 'mariana.lopez@rentafacilhn.com', '50499990002', '0501199212346'),
('Jose', 'Rivera', 'jose.rivera@rentafacilhn.com', '50499990003', '0101198812347');

INSERT INTO inquilinos (nombre, apellido, email, telefono, dni) VALUES
('Ana', 'Castro', 'usuario@rentafacil.com', '50498880001', '0801199712348'),
('Luis', 'Garcia', 'luis.garcia@email.com', '50498880002', '0501199512349'),
('Diana', 'Martinez', 'diana.martinez@email.com', '50498880003', '0101199912350');

INSERT INTO propiedades
(id_propietario, id_ubicacion, titulo, descripcion, precio_mensual, habitaciones, banos, metros_cuadrados, tipo, estado)
VALUES
(1, 1, 'Apartamento amueblado en Palmira', 'Apartamento centrico cerca de oficinas y comercios.', 12500.00, 2, 2, 85.00, 'apartamento', 'alquilado'),
(1, 2, 'Casa familiar en San Pedro Sula', 'Casa amplia con patio y estacionamiento.', 18000.00, 3, 2, 140.00, 'casa', 'reservado'),
(2, 3, 'Local comercial en La Ceiba', 'Local en zona de alto transito peatonal.', 22000.00, 1, 1, 70.00, 'local', 'disponible'),
(3, 4, 'Cuarto independiente en Comayagua', 'Cuarto con servicios incluidos para estudiante.', 4500.00, 1, 1, 25.00, 'cuarto', 'disponible'),
(2, 1, 'Apartamento moderno en Tegucigalpa', 'Apartamento con seguridad privada y parqueo.', 15000.00, 2, 2, 92.00, 'apartamento', 'disponible');

INSERT INTO imagenes_propiedad (id_propiedad, url_imagen, es_portada) VALUES
(1, 'https://example.com/propiedades/apartamento-palmira-1.jpg', TRUE),
(1, 'https://example.com/propiedades/apartamento-palmira-2.jpg', FALSE),
(2, 'https://example.com/propiedades/casa-sps-1.jpg', TRUE),
(3, 'https://example.com/propiedades/local-ceiba-1.jpg', TRUE),
(4, 'https://example.com/propiedades/cuarto-comayagua-1.jpg', TRUE),
(5, 'https://example.com/propiedades/apartamento-tgu-1.jpg', TRUE);

INSERT INTO reservas (id_propiedad, id_inquilino, fecha_inicio, fecha_fin, estado) VALUES
(1, 1, '2026-01-01', '2026-12-31', 'aprobada'),
(2, 2, '2026-07-01', '2027-06-30', 'pendiente'),
(3, 3, '2026-08-01', '2027-07-31', 'rechazada'),
(5, 1, '2026-09-01', '2027-08-31', 'pendiente');

INSERT INTO contratos (id_reserva, fecha_inicio, fecha_fin, monto_mensual, deposito, estado) VALUES
(1, '2026-01-01', '2026-12-31', 12500.00, 12500.00, 'activo');

INSERT INTO pagos (id_contrato, monto, fecha_pago, metodo_pago, estado, referencia) VALUES
(1, 12500.00, '2026-01-05', 'transferencia', 'completado', 'BAC-0001'),
(1, 12500.00, '2026-02-05', 'transferencia', 'completado', 'BAC-0002'),
(1, 12500.00, '2026-03-05', 'efectivo', 'completado', 'REC-0003'),
(1, 12500.00, '2026-04-05', 'transferencia', 'pendiente', 'BAC-0004');

INSERT INTO calificaciones (id_contrato, tipo_autor, puntuacion, comentario) VALUES
(1, 'propietario', 5, 'Inquilina puntual y responsable.'),
(1, 'inquilino', 4, 'Propietario atento, la propiedad estaba en buen estado.');
