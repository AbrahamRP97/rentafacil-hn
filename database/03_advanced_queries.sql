SELECT
    p.id_propiedad,
    p.titulo,
    p.tipo,
    u.departamento,
    u.municipio,
    p.precio_mensual,
    p.habitaciones,
    p.banos
FROM propiedades p
INNER JOIN ubicaciones u ON u.id_ubicacion = p.id_ubicacion
WHERE p.estado = 'disponible'
  AND p.precio_mensual BETWEEN 4000 AND 16000
ORDER BY u.municipio, p.precio_mensual;

SELECT
    r.id_reserva,
    r.fecha_inicio,
    r.fecha_fin,
    r.estado,
    i.nombre || ' ' || i.apellido AS inquilino,
    i.email AS email_inquilino,
    p.titulo AS propiedad,
    prop.nombre || ' ' || prop.apellido AS propietario
FROM reservas r
INNER JOIN inquilinos i ON i.id_inquilino = r.id_inquilino
INNER JOIN propiedades p ON p.id_propiedad = r.id_propiedad
INNER JOIN propietarios prop ON prop.id_propietario = p.id_propietario
WHERE r.estado = 'pendiente'
ORDER BY r.created_at DESC;

SELECT
    c.id_contrato,
    p.titulo AS propiedad,
    i.nombre || ' ' || i.apellido AS inquilino,
    pg.fecha_pago,
    pg.monto,
    pg.metodo_pago,
    pg.estado,
    pg.referencia
FROM contratos c
INNER JOIN reservas r ON r.id_reserva = c.id_reserva
INNER JOIN propiedades p ON p.id_propiedad = r.id_propiedad
INNER JOIN inquilinos i ON i.id_inquilino = r.id_inquilino
LEFT JOIN pagos pg ON pg.id_contrato = c.id_contrato
ORDER BY c.id_contrato, pg.fecha_pago;

SELECT
    c.id_contrato,
    p.titulo AS propiedad,
    i.nombre || ' ' || i.apellido AS inquilino,
    c.monto_mensual,
    pg.fecha_pago,
    pg.estado AS estado_pago
FROM contratos c
INNER JOIN reservas r ON r.id_reserva = c.id_reserva
INNER JOIN propiedades p ON p.id_propiedad = r.id_propiedad
INNER JOIN inquilinos i ON i.id_inquilino = r.id_inquilino
INNER JOIN pagos pg ON pg.id_contrato = c.id_contrato
WHERE c.estado = 'activo'
  AND pg.estado = 'pendiente'
ORDER BY pg.fecha_pago;

SELECT
    c.id_contrato,
    p.titulo AS propiedad,
    AVG(cal.puntuacion::NUMERIC(5,2)) AS promedio_calificacion,
    COUNT(cal.id_calificacion) AS total_calificaciones
FROM contratos c
INNER JOIN reservas r ON r.id_reserva = c.id_reserva
INNER JOIN propiedades p ON p.id_propiedad = r.id_propiedad
LEFT JOIN calificaciones cal ON cal.id_contrato = c.id_contrato
GROUP BY c.id_contrato, p.titulo
ORDER BY promedio_calificacion DESC;

SELECT
    prop.id_propietario,
    prop.nombre || ' ' || prop.apellido AS propietario,
    SUM(CASE WHEN pg.estado = 'completado' THEN pg.monto ELSE 0 END) AS ingresos_completados,
    COUNT(DISTINCT p.id_propiedad) AS propiedades_publicadas
FROM propietarios prop
INNER JOIN propiedades p ON p.id_propietario = prop.id_propietario
LEFT JOIN reservas r ON r.id_propiedad = p.id_propiedad
LEFT JOIN contratos c ON c.id_reserva = r.id_reserva
LEFT JOIN pagos pg ON pg.id_contrato = c.id_contrato
GROUP BY prop.id_propietario, prop.nombre, prop.apellido
ORDER BY ingresos_completados DESC;

SELECT
    p.id_propiedad,
    p.titulo,
    p.tipo,
    COUNT(r.id_reserva) AS total_reservas
FROM propiedades p
LEFT JOIN reservas r ON r.id_propiedad = p.id_propiedad
GROUP BY p.id_propiedad, p.titulo, p.tipo
ORDER BY total_reservas DESC, p.titulo;
