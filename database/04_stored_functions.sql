CREATE OR REPLACE FUNCTION fn_resumen_propietarios(
    p_id_propietario INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id_propietario INTEGER,
    propietario TEXT,
    propiedades_publicadas BIGINT,
    ingresos_completados NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH resumen_propiedades AS (
        SELECT
            p.id_propietario,
            COUNT(p.id_propiedad) AS total_propiedades
        FROM propiedades p
        GROUP BY p.id_propietario
    ),
    resumen_ingresos AS (
        SELECT
            p.id_propietario,
            COALESCE(SUM(pg.monto) FILTER (WHERE pg.estado = 'completado'), 0) AS total_ingresos
        FROM propiedades p
        LEFT JOIN reservas r ON r.id_propiedad = p.id_propiedad
        LEFT JOIN contratos c ON c.id_reserva = r.id_reserva
        LEFT JOIN pagos pg ON pg.id_contrato = c.id_contrato
        GROUP BY p.id_propietario
    )
    SELECT
        pr.id_propietario AS id_propietario,
        pr.nombre || ' ' || pr.apellido AS propietario,
        COALESCE(rp.total_propiedades, 0) AS propiedades_publicadas,
        COALESCE(ri.total_ingresos, 0) AS ingresos_completados
    FROM resumen_propiedades rp
    FULL OUTER JOIN resumen_ingresos ri
        ON ri.id_propietario = rp.id_propietario
    INNER JOIN propietarios pr
        ON pr.id_propietario = COALESCE(rp.id_propietario, ri.id_propietario)
    WHERE p_id_propietario IS NULL
       OR pr.id_propietario = p_id_propietario
    ORDER BY COALESCE(ri.total_ingresos, 0) DESC, pr.nombre, pr.apellido;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'No se pudo generar el resumen de propietarios: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION fn_reservas_detalladas(
    p_estado VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id_reserva INTEGER,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado VARCHAR,
    inquilino TEXT,
    email_inquilino VARCHAR,
    propiedad VARCHAR,
    propietario TEXT,
    total_reservas_inquilino BIGINT
)
LANGUAGE sql
AS $$
    SELECT
        r.id_reserva,
        r.fecha_inicio,
        r.fecha_fin,
        r.estado,
        i.nombre || ' ' || i.apellido,
        i.email,
        p.titulo,
        prop.nombre || ' ' || prop.apellido,
        (
            SELECT COUNT(*)
            FROM reservas r2
            WHERE r2.id_inquilino = r.id_inquilino
        ) AS total_reservas_inquilino
    FROM reservas r
    INNER JOIN inquilinos i ON i.id_inquilino = r.id_inquilino
    INNER JOIN propiedades p ON p.id_propiedad = r.id_propiedad
    INNER JOIN propietarios prop ON prop.id_propietario = p.id_propietario
    WHERE p_estado IS NULL OR r.estado = p_estado
    ORDER BY r.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION fn_historial_pagos(
    p_id_contrato INTEGER
)
RETURNS TABLE (
    id_contrato INTEGER,
    propiedad VARCHAR,
    inquilino TEXT,
    fecha_pago DATE,
    monto NUMERIC,
    metodo_pago VARCHAR,
    estado VARCHAR,
    referencia VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_id_contrato IS NULL THEN
        RAISE EXCEPTION 'El id del contrato es obligatorio';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM contratos c
        WHERE c.id_contrato = p_id_contrato
    ) THEN
        RAISE EXCEPTION 'No existe el contrato %', p_id_contrato;
    END IF;

    RETURN QUERY
    SELECT
        c.id_contrato,
        p.titulo,
        i.nombre || ' ' || i.apellido,
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
    WHERE c.id_contrato = p_id_contrato
    ORDER BY pg.fecha_pago;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'No se pudo consultar el historial de pagos: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_resumen_propietarios(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_reservas_detalladas(VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_historial_pagos(INTEGER) TO anon, authenticated;
