CREATE OR REPLACE FUNCTION fn_aprobar_reserva(
    p_id_reserva INTEGER,
    p_deposito NUMERIC DEFAULT NULL
)
RETURNS TABLE (
    id_contrato INTEGER,
    id_reserva INTEGER,
    estado_reserva VARCHAR,
    estado_propiedad VARCHAR,
    monto_mensual NUMERIC,
    deposito NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_propiedad INTEGER;
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
    v_estado_reserva VARCHAR;
    v_estado_propiedad VARCHAR;
    v_precio_mensual NUMERIC;
    v_id_contrato INTEGER;
    v_deposito NUMERIC;
BEGIN
    SELECT
        r.id_propiedad,
        r.fecha_inicio,
        r.fecha_fin,
        r.estado,
        p.estado,
        p.precio_mensual
    INTO
        v_id_propiedad,
        v_fecha_inicio,
        v_fecha_fin,
        v_estado_reserva,
        v_estado_propiedad,
        v_precio_mensual
    FROM reservas r
    INNER JOIN propiedades p ON p.id_propiedad = r.id_propiedad
    WHERE r.id_reserva = p_id_reserva
    FOR UPDATE OF r, p;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe la reserva %', p_id_reserva;
    END IF;

    IF v_estado_reserva <> 'pendiente' THEN
        RAISE EXCEPTION 'La reserva % no esta pendiente', p_id_reserva;
    END IF;

    IF v_estado_propiedad <> 'disponible' THEN
        RAISE EXCEPTION 'La propiedad asociada no esta disponible';
    END IF;

    v_deposito := COALESCE(p_deposito, v_precio_mensual);

    IF v_deposito < 0 THEN
        RAISE EXCEPTION 'El deposito no puede ser negativo';
    END IF;

    UPDATE reservas
    SET estado = 'aprobada'
    WHERE reservas.id_reserva = p_id_reserva;

    UPDATE propiedades
    SET estado = 'reservado'
    WHERE propiedades.id_propiedad = v_id_propiedad;

    INSERT INTO contratos (
        id_reserva,
        fecha_inicio,
        fecha_fin,
        monto_mensual,
        deposito,
        estado
    )
    VALUES (
        p_id_reserva,
        v_fecha_inicio,
        v_fecha_fin,
        v_precio_mensual,
        v_deposito,
        'activo'
    )
    RETURNING contratos.id_contrato INTO v_id_contrato;

    RETURN QUERY
    SELECT
        v_id_contrato,
        p_id_reserva,
        'aprobada'::VARCHAR,
        'reservado'::VARCHAR,
        v_precio_mensual,
        v_deposito;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'La reserva % ya tiene un contrato', p_id_reserva;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'No se pudo aprobar la reserva: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION fn_registrar_pago(
    p_id_contrato INTEGER,
    p_monto NUMERIC,
    p_metodo_pago VARCHAR,
    p_fecha_pago DATE DEFAULT CURRENT_DATE,
    p_referencia VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id_pago INTEGER,
    id_contrato INTEGER,
    monto NUMERIC,
    fecha_pago DATE,
    metodo_pago VARCHAR,
    estado VARCHAR,
    referencia VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_estado_contrato VARCHAR;
    v_id_pago INTEGER;
BEGIN
    SELECT c.estado
    INTO v_estado_contrato
    FROM contratos c
    WHERE c.id_contrato = p_id_contrato
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe el contrato %', p_id_contrato;
    END IF;

    IF v_estado_contrato <> 'activo' THEN
        RAISE EXCEPTION 'El contrato % no esta activo', p_id_contrato;
    END IF;

    IF p_monto <= 0 THEN
        RAISE EXCEPTION 'El monto debe ser mayor que cero';
    END IF;

    IF p_metodo_pago NOT IN ('efectivo', 'transferencia', 'tarjeta') THEN
        RAISE EXCEPTION 'Metodo de pago no valido';
    END IF;

    INSERT INTO pagos (
        id_contrato,
        monto,
        fecha_pago,
        metodo_pago,
        estado,
        referencia
    )
    VALUES (
        p_id_contrato,
        p_monto,
        p_fecha_pago,
        p_metodo_pago,
        'completado',
        p_referencia
    )
    RETURNING pagos.id_pago INTO v_id_pago;

    UPDATE contratos
    SET updated_at = CURRENT_TIMESTAMP
    WHERE contratos.id_contrato = p_id_contrato;

    RETURN QUERY
    SELECT
        v_id_pago,
        p_id_contrato,
        p_monto,
        p_fecha_pago,
        p_metodo_pago,
        'completado'::VARCHAR,
        p_referencia;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'No se pudo registrar el pago: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_aprobar_reserva(INTEGER, NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION fn_registrar_pago(INTEGER, NUMERIC, VARCHAR, DATE, VARCHAR) TO anon, authenticated;
